import { createGenerationLimiter } from './serverRateLimit';
import { installBilling } from './stripeBilling';
import express from "express";
import { authenticate, validateAIRequest, assertAIResult } from './serverPolicy';
// Node 22+ loads local configuration; production may inject environment variables.
try { process.loadEnvFile('.env.local'); } catch { /* optional */ }
try { process.loadEnvFile('.env'); } catch { /* optional */ }
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import { getStorage, getDownloadURL } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";
import { GoogleGenAI, Modality } from "@google/genai";
import { VertexAI } from "@google-cloud/vertexai";
import { GoogleAuth } from "google-auth-library";
import crypto from "crypto";
import { AI_COSTS } from "./types.ts";
import type { CreditTransaction, AIAccessSettings, AISource, CreditActionType } from "./types.ts";

// Encryption Helpers
const ENCRYPTION_KEY = process.env.AI_ENCRYPTION_KEY || '';
const IV_LENGTH = 16;

function encrypt(text: string) {
  if (ENCRYPTION_KEY.length < 32) throw new Error('Set AI_ENCRYPTION_KEY to at least 32 random characters before saving user keys.');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string) {
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    console.error("Decryption failed:", e);
    return "";
  }
}

// Load Firebase configuration
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const projectId = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId;
const rawConfigDbId = process.env.FIRESTORE_DATABASE_ID || firebaseConfig.firestoreDatabaseId;
const configDbId = rawConfigDbId || "(default)";

// Force environment variables to match the target project
process.env.GOOGLE_CLOUD_PROJECT = projectId;
process.env.GCLOUD_PROJECT = projectId;
process.env.GCP_PROJECT = projectId;

if (!configDbId) {
  console.error("CRITICAL: Firestore Database ID is missing or set to (default).");
}

console.log(`[Server] Initializing Firebase Admin...`);
console.log(`[Server] Target Project ID: ${projectId}`);
console.log(`[Server] Target Database ID: ${configDbId}`);

let firebaseApp: admin.app.App;

// Check for Service Account Key in environment
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT;
let credential = admin.credential.applicationDefault();

if (serviceAccountKey) {
  try {
    const sa = JSON.parse(serviceAccountKey);
    credential = admin.credential.cert(sa);
    console.log("[Server] Using Service Account Key from environment.");
  } catch (e: any) {
    console.error("[Server] Failed to parse FIREBASE_SERVICE_ACCOUNT:", e.message);
  }
}

if (!admin.apps.length) {
  try {
    firebaseApp = admin.initializeApp({
      credential,
      projectId: projectId,
    });
    console.log("[Server] Firebase Admin initialized successfully.");
  } catch (initError: any) {
    console.error("[Server] Firebase Admin initialization failed:", initError.message);
    // Fallback to default app if initialization fails
    firebaseApp = admin.app();
  }
} else {
  firebaseApp = admin.app();
  console.log("[Server] Using existing Firebase Admin app. Project ID:", firebaseApp.options.projectId);
  
  if (firebaseApp.options.projectId !== projectId || serviceAccountKey) {
    console.warn(`[Server] Existing app project ID (${firebaseApp.options.projectId}) does not match target (${projectId}) or new credentials provided.`);
    try {
      firebaseApp = admin.initializeApp({ 
        credential,
        projectId 
      }, 'target-project');
      console.log("[Server] Initialized named app 'target-project' with correct Project ID and credentials.");
    } catch (e: any) {
      console.error("[Server] Failed to initialize named app:", e.message);
    }
  }
}

// Canonical Firestore instance
const db = getFirestore(firebaseApp, configDbId);
console.log(`[Server] Firestore instance created for database: ${configDbId}`);

// Initial connection verification
async function verifyFirestore() {
  console.log("[Server] Verifying Firestore connection...");
  try {
    // Simple read to verify connection
    await db.collection('test').doc('connection').get();
    console.log(`[Server] Firestore verified: ${configDbId}`);
  } catch (error: any) {
    if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
      console.warn(`[Server] Firestore database '${configDbId}' NOT FOUND. Ensure it exists in the Firebase console.`);
    } else if (error.code === 7 || error.message?.includes('PERMISSION_DENIED')) {
      console.error("[Server] Firestore PERMISSION_DENIED. Database:", configDbId);
      console.error("[Server] Error Details:", error.message);
      if (error.details) console.error("[Server] Error Details Extra:", error.details);
      console.log("[Server] Firestore reached (Permission Denied as expected with strict rules).");
    } else {
      console.error("[Server] Firestore verification failed:", error.message);
    }
  }
}

// Unified AI Access Resolver
async function resolveAiAccess(workspaceId: string): Promise<{ 
  apiKey: string; 
  source: AISource; 
  cost: number;
  error?: string;
  status?: number;
  useAdc?: boolean;
}> {
  console.log(`[AI Access] Resolving access for workspaceId: ${workspaceId}`);
  const workspaceRef = db.collection("workspaces").doc(workspaceId);
  const workspaceSnap = await workspaceRef.get();

  if (!workspaceSnap.exists) {
    console.warn(`[AI Access] Workspace not found: ${workspaceId}`);
    return { apiKey: "", source: "starter_credits", cost: 0, error: "Workspace not found", status: 404 };
  }

  const settings: AIAccessSettings = workspaceSnap.data() as AIAccessSettings;
  const secretSnap = await db.collection('workspaceSecrets').doc(workspaceId).get();
  settings.userApiKeyEncrypted = secretSnap.data()?.userApiKeyEncrypted || settings.userApiKeyEncrypted;
  console.log(`[AI Access] Workspace data for ${workspaceId}: creditBalance=${settings.creditBalance}, activeSource=${settings.activeSource}, starterCreditsGranted=${settings.starterCreditsGranted}`);
  
  const masterKey = process.env.GEMINI_MASTER_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
  console.log(`[AI Access] Master Key Present: ${!!masterKey}`);

  // Mode 1: User's own API key
  if (settings.activeSource === 'user_api_key') {
    if (settings.userApiKeyStatus === 'valid' && settings.userApiKeyEncrypted) {
      // Decrypt the key
      const decryptedKey = decrypt(settings.userApiKeyEncrypted);
      if (decryptedKey) {
        console.log(`[AI Access] Using User API Key`);
        return { apiKey: decryptedKey, source: "user_api_key", cost: 0 };
      }
    }
    
    if (settings.billingAccessUntil && Date.parse(settings.billingAccessUntil) <= Date.now()) {
      return { apiKey: '', source: settings.activeSource, cost: 0, error: 'Okres dostępu AI zakończył się. Sprawdź abonament.', status: 402 };
    }
    // Fallback to Master Key if user key is selected but invalid/missing
    if (masterKey) {
      console.log(`[AI Access] User key invalid/missing, falling back to Master Key. Balance: ${settings.creditBalance}`);
      if (settings.creditBalance <= 0) {
        console.warn(`[AI Access] Resource exhausted (fallback mode)`);
        return { 
          apiKey: "", 
          source: "starter_credits", 
          cost: 0, 
          error: "resource-exhausted", 
          status: 403 
        };
      }
      return { apiKey: masterKey, source: "starter_credits", cost: 0 };
    }

    console.warn(`[AI Access] User API key invalid and no Master Key fallback`);
    return { apiKey: "", source: "user_api_key", cost: 0, error: "User API key is not valid or missing", status: 400 };
  }

  if (settings.billingAccessUntil && Date.parse(settings.billingAccessUntil) <= Date.now()) {
    return { apiKey: '', source: settings.activeSource, cost: 0, error: 'Okres dostępu AI zakończył się. Sprawdź abonament w panelu płatności.', status: 402 };
  }
  // Mode 2: Platform Credits (Starter or Purchased)
  if (!masterKey) {
    console.error(`[AI Access] Master Key missing from environment!`);
    return { apiKey: "", source: settings.activeSource, cost: 0, error: "AI service configuration error (Missing Master Key)", status: 500 };
  }

  if (settings.creditBalance === undefined || settings.creditBalance === null || settings.creditBalance <= 0) {
    console.warn(`[AI Access] Resource exhausted for ${workspaceId}. Balance: ${settings.creditBalance}`);
    return { 
      apiKey: "", 
      source: settings.activeSource, 
      cost: 0, 
      error: "resource-exhausted", 
      status: 403 
    };
  }

  console.log(`[AI Access] Using Master Key with credits. Remaining: ${settings.creditBalance}`);
  return { apiKey: masterKey, source: settings.activeSource, cost: 0, useAdc: !masterKey };
}

async function startServer() {
  // We no longer verify Firestore at startup to prevent blocking the server 
  // if there are permission issues with the ambient credentials.
  // Verification will happen on first request.

  const app = express();
  const apiRouter = express.Router();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  const billing = installBilling(db);
  // Signature verification needs the unmodified request body, before the JSON parser.
  app.post('/api/billing/webhook', express.raw({ type: 'application/json', limit: '1mb' }), billing.webhook);
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Mount API Router
  app.use('/api', apiRouter);

  // Request logger for API
  apiRouter.use((req, res, next) => {
    console.log(`[API Request] ${req.method} ${req.url}`);
    next();
  });

  apiRouter.use(authenticate(token => admin.auth(firebaseApp).verifyIdToken(token)));

  apiRouter.post('/billing/status', billing.status);
  apiRouter.post('/billing/setup', createGenerationLimiter(), billing.setup);
  apiRouter.post('/billing/subscribe', createGenerationLimiter(), billing.subscribe);
  apiRouter.post('/billing/portal', createGenerationLimiter(), billing.portal);

  // Registration creates an empty wallet. Verified billing webhooks grant credits.
  apiRouter.post("/auth/init", async (req, res) => {
    try {
      const { userId, email } = req.body;
      if (!userId) return res.status(400).json({ error: "Missing userId" });
      if (!req.body.emailVerified) return res.status(403).json({ error: 'Zaloguj się kontem Google ze zweryfikowanym adresem e-mail.' });

      // In this app, workspaceId is currently same as userId for simplicity
      const workspaceId = userId; 
      
      console.log(`[Auth Init] Request for userId: ${userId}, email: ${email}`);
      console.log(`[Auth Init] Using Firestore Project: ${projectId}, Database: ${configDbId}`);

      const userRef = db.collection('users').doc(userId);
      const workspaceRef = db.collection('workspaces').doc(workspaceId);
      const credits = await db.runTransaction(async tx => {
        const [snap, userSnap] = await Promise.all([tx.get(workspaceRef), tx.get(userRef)]);
        if (snap.exists) {
          if (snap.data()?.userApiKeyEncrypted) {
            tx.set(db.collection('workspaceSecrets').doc(workspaceId), { userApiKeyEncrypted: snap.data()!.userApiKeyEncrypted });
            tx.update(workspaceRef, { userApiKeyEncrypted: admin.firestore.FieldValue.delete() });
          }
          return snap.data()?.creditBalance || 0;
        }
        const now = new Date().toISOString();
        tx.set(workspaceRef, {
          workspaceId, aiProvider: 'gemini', activeSource: 'starter_credits',
          starterCreditsGranted: false, creditBalance: 0, trialStatus: 'awaiting_card',
          hasUserApiKey: false, userApiKeyStatus: 'missing', updatedAt: now
        });
        tx.set(userRef, { ...(userSnap.exists ? {} : { onboardingStep: 1, createdAt: now }), uid: userId, email, workspaceId, credits: 0, updatedAt: now }, { merge: true });
        return 0;
      });
      res.json({ success: true, workspaceId, credits });
    } catch (error: any) {
      console.error("Auth Init Error:", error);
      if (error.message === 'STARTER_DAILY_LIMIT') return res.status(503).json({ error: 'Dzisiejsza pula kont pilotażowych została wykorzystana. Wróć jutro lub wypróbuj warsztat bez logowania.' });
      res.status(500).json({ error: "Failed to initialize user", details: error.message });
    }
  });

  // API Key Management Endpoints
  apiRouter.post("/ai/settings/update", async (req, res) => {
    try {
      const { userId, workspaceId, geminiApiKey, activeSource } = req.body;
      if (!workspaceId) return res.status(400).json({ error: "Missing workspaceId" });

      const workspaceRef = db.collection("workspaces").doc(workspaceId);
      const updateData: any = {
        updatedAt: new Date().toISOString()
      };

      if (geminiApiKey !== undefined) {
        if (geminiApiKey === "") {
          updateData.hasUserApiKey = false;
          updateData.userApiKeyStatus = 'missing';
          updateData.userApiKeyEncrypted = admin.firestore.FieldValue.delete();
          if (activeSource === 'user_api_key') {
            updateData.activeSource = 'starter_credits';
          }
        } else {
          // Validate key before saving
          try {
            const ai = new GoogleGenAI({ apiKey: geminiApiKey });
            const model = ai.models.get({ model: "gemini-3-flash-preview" });
            await model; // Simple check
            
            updateData.hasUserApiKey = true;
            updateData.userApiKeyStatus = 'valid';
            updateData.userApiKeyEncrypted = encrypt(geminiApiKey);
          } catch (err: any) {
            return res.status(400).json({ error: "Invalid Gemini API key", details: err.message });
          }
        }
      }

      if (activeSource) {
        if (!['starter_credits', 'purchased_credits', 'user_api_key'].includes(activeSource)) {
          return res.status(400).json({ error: 'Invalid AI source' });
        }
        updateData.activeSource = activeSource;
      }

      if (geminiApiKey !== undefined) {
        await db.collection('workspaceSecrets').doc(workspaceId).set({
          userApiKeyEncrypted: geminiApiKey ? updateData.userApiKeyEncrypted : null
        }, { merge: true });
        updateData.userApiKeyEncrypted = admin.firestore.FieldValue.delete();
      }
      await workspaceRef.update(updateData);
      const freshSnap = await workspaceRef.get();
      const { userApiKeyEncrypted: _secret, ...publicSettings } = freshSnap.data() || {};
      res.json({ success: true, settings: publicSettings });
    } catch (error: any) {
      console.error("Update AI Settings Error:", error);
      res.status(500).json({ error: "Failed to update AI settings", details: error.message });
    }
  });

  apiRouter.post("/ai/settings/validate", async (req, res) => {
    try {
      const { geminiApiKey } = req.body;
      if (!geminiApiKey) return res.status(400).json({ error: "Missing API key" });

      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const model = ai.models.get({ model: "gemini-3-flash-preview" });
      await model;
      
      res.json({ success: true, message: "API key is valid" });
    } catch (error: any) {
      res.status(400).json({ success: false, error: "Invalid Gemini API key", details: error.message });
    }
  });

  // API Gatekeeper Endpoint
  apiRouter.post("/ai/execute", createGenerationLimiter(), async (req, res) => {
    try {
      const { actionType, payload, userId, workspaceId } = req.body;
      const targetWorkspaceId = workspaceId || userId; // Fallback for legacy
      
      console.log(`[Gatekeeper] Request: actionType=${actionType}, userId=${userId}, workspaceId=${targetWorkspaceId}`);

      if (!userId || !targetWorkspaceId) {
        return res.status(401).json({ error: "Unauthorized: Missing User or Workspace ID" });
      }

      let cost: number;
      try { cost = validateAIRequest(actionType, payload); }
      catch (error: any) { return res.status(400).json({ error: error.message }); }
      
      // Resolve AI Access
      const access = await resolveAiAccess(targetWorkspaceId);
      if (access.error) {
        return res.status(access.status || 400).json({ 
          error: access.error, 
          message: access.error === "resource-exhausted" ? "Insufficient credits. Please top up or use your own API key." : access.error 
        });
      }

      const apiKeyToUse = access.apiKey;
      const shouldUseCredits = access.source !== 'user_api_key';
      const useAdc = access.useAdc || (!apiKeyToUse && shouldUseCredits);
      // Models and prices are server-controlled, not selected by untrusted clients.
      const modelName = actionType === 'generate_image'
        ? (process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image')
        : actionType === 'generate_video'
          ? (process.env.GEMINI_VIDEO_MODEL || 'veo-3.1-fast-generate-preview')
          : (process.env.GEMINI_TEXT_MODEL || 'gemini-3-flash-preview'); 
      
      console.log(`[Gatekeeper] useAdc=${useAdc}, apiKeyToUse=${apiKeyToUse ? 'PRESENT' : 'MISSING'}, shouldUseCredits=${shouldUseCredits}`);

      const wallet = db.collection('workspaces').doc(targetWorkspaceId);
      const ledger = wallet.collection('transactions').doc();
      let reserved = false;
      if (shouldUseCredits) {
        try {
          await db.runTransaction(async tx => {
            const snap = await tx.get(wallet);
            const balance = snap.data()?.creditBalance;
            if (!Number.isFinite(balance) || balance < cost) throw new Error('Insufficient credits');
            tx.update(wallet, { creditBalance: balance - cost });
            tx.set(db.collection('users').doc(userId), { credits: balance - cost }, { merge: true });
            tx.set(ledger, { userId, amount: -cost, actionType, source: 'usage',
              status: 'reserved', createdAt: new Date().toISOString() });
          });
          reserved = true;
        } catch { return res.status(402).json({ error: 'Insufficient credits. Use your own API key or top up.' }); }
      }

      // Execute AI Action
      let aiResult: string = "";
      try {
        if (useAdc) {
          console.log(`[Gatekeeper] Using Vertex AI with ADC for ${actionType} (Model: ${modelName})`);
          const vertexAi = new VertexAI({ project: projectId, location: 'us-central1' });
          const model = vertexAi.getGenerativeModel({ model: modelName });
          
          if (actionType === 'generate_video') {
            throw new Error("Video generation is not supported via Vertex AI SDK in this app yet. Please provide an API key.");
          } else if (actionType === 'generate_image' || modelName.includes('image')) {
             const response = await model.generateContent({
              contents: [{ role: 'user', parts: [{ text: payload.prompt }] }],
              generationConfig: payload.config
            });
            const candidate = response.response.candidates?.[0];
            const imagePart = candidate?.content?.parts?.find(p => p.inlineData);
            if (imagePart?.inlineData) {
              aiResult = `data:image/png;base64,${imagePart.inlineData.data}`;
            } else {
              // Vertex AI SDK response structure
              aiResult = candidate?.content?.parts?.[0]?.text || "";
            }
          } else {
            const response = await model.generateContent({
              contents: [{ role: 'user', parts: [{ text: payload.prompt }] }],
              generationConfig: payload.config
            });
            // Vertex AI SDK response structure
            aiResult = response.response.candidates?.[0]?.content?.parts?.[0]?.text || "";
          }
        } else {
          console.log(`[Gatekeeper] Using Gemini API with ${access.source} for ${actionType}`);
          const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
          
          if (actionType === 'generate_video') {
            // Video Generation (Veo)
            let operation = await ai.models.generateVideos({
              model: modelName,
              prompt: payload.prompt,
              image: payload.image ? {
                imageBytes: payload.image.split(',')[1],
                mimeType: payload.image?.match(/^data:([^;]+);/)?.[1] || 'image/png'
              } : undefined,
              config: payload.config
            });

            const deadline = Date.now() + 240_000;
            while (!operation.done) {
              if (Date.now() > deadline) throw new Error("Video generation timed out");
              await new Promise(resolve => setTimeout(resolve, 5000));
              operation = await ai.operations.getVideosOperation({ operation });
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink) {
              const response = await fetch(downloadLink, {
                method: 'GET',
                headers: { 'x-goog-api-key': apiKeyToUse },
              });
              const buffer = await response.arrayBuffer();
              const base64 = Buffer.from(buffer).toString('base64');
              aiResult = `data:video/mp4;base64,${base64}`;
            } else {
              throw new Error("Video generation failed: No download link returned");
            }
          } else if (actionType === 'generate_image' || modelName.includes('image')) {
            // Check if we should use generateImages for specialized Imagen models, or generateContent for modern multimodal image models
            if (modelName.includes('imagen')) {
              console.log(`[Gatekeeper] Using generateImages for Imagen model ${modelName}`);
              const response = await ai.models.generateImages({
                model: modelName,
                prompt: payload.prompt || "",
                config: {
                  numberOfImages: 1,
                  aspectRatio: payload.config?.imageConfig?.aspectRatio || '1:1',
                  outputMimeType: 'image/png',
                }
              });
              const imgObj = response.generatedImages?.[0];
              const imageBytes = imgObj?.image?.imageBytes || (imgObj as any)?.imageBytes || (imgObj as any)?.image?.data;
              if (imageBytes) {
                aiResult = `data:image/png;base64,${imageBytes}`;
              } else {
                throw new Error("No image was returned by the generation model.");
              }
            } else if (modelName === 'gemini-2.5-flash-image' || modelName === 'gemini-3.1-flash-image' || modelName === 'gemini-3-pro-image') {
              console.log(`[Gatekeeper] Using generateContent for nano banana model ${modelName}`);
              const parts: any[] = [{ text: payload.prompt }];
              if (payload.image) {
                parts.push({
                  inlineData: {
                    data: payload.image.split(',')[1],
                    mimeType: payload.image?.match(/^data:([^;]+);/)?.[1] || 'image/png'
                  }
                });
              }

              const response = await ai.models.generateContent({
                model: modelName,
                contents: { parts },
                config: {
                  responseModalities: [Modality.TEXT, Modality.IMAGE],
                  imageConfig: {
                    aspectRatio: payload.config?.imageConfig?.aspectRatio || "1:1",
                    ...(modelName === "gemini-2.5-flash-image" ? {} : { imageSize: "1K" })
                  }
                }
              });

              // Iterate parts to find the generated image
              const candidate = response.candidates?.[0];
              const partsList = candidate?.content?.parts || [];
              let foundImage = false;
              for (const part of partsList) {
                if (part.inlineData) {
                  aiResult = `data:image/png;base64,${part.inlineData.data}`;
                  foundImage = true;
                  break;
                }
              }

              if (!foundImage) {
                aiResult = response.text || "";
              }
            } else {
              // Image Generation or Multimodal fallback
              const parts: any[] = [{ text: payload.prompt }];
              if (payload.image) {
                parts.push({
                  inlineData: {
                    data: payload.image.split(',')[1],
                    mimeType: payload.image?.match(/^data:([^;]+);/)?.[1] || 'image/png'
                  }
                });
              }

              const response = await ai.models.generateContent({
                model: modelName,
                contents: { parts },
                config: payload.config
              });

              // Check for image output
              const candidate = response.candidates?.[0];
              const imagePart = candidate?.content?.parts?.find(p => p.inlineData);
              if (imagePart?.inlineData) {
                aiResult = `data:image/png;base64,${imagePart.inlineData.data}`;
              } else {
                aiResult = response.text || "";
              }
            }
          } else {
            // Standard Text Generation
            const response = await ai.models.generateContent({
              model: modelName,
              contents: [{ parts: [{ text: payload.prompt }] }],
              config: payload.config
            });
            aiResult = response.text || "";
          }
        }

        console.log(`Generation successful, result length: ${aiResult?.length || 0}`);

        assertAIResult(actionType, aiResult);
        if (actionType === 'generate_image' || actionType === 'generate_video') {
          const match = aiResult.match(/^data:([^;]+);base64,(.+)$/s);
          if (!match) throw new Error('Invalid generated media');
          const ext = actionType === 'generate_video' ? 'mp4' : 'png';
          const bucket = getStorage(firebaseApp).bucket(process.env.FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket);
          const file = bucket.file(`users/${userId}/generated/${crypto.randomUUID()}.${ext}`);
          await file.save(Buffer.from(match[2], 'base64'), {
            resumable: false, contentType: match[1],
            metadata: { metadata: { firebaseStorageDownloadTokens: crypto.randomUUID() } }
          });
          aiResult = await getDownloadURL(file);
        }
        if (reserved) await ledger.update({ status: 'completed' });

        return res.json({ 
          success: true, 
          result: aiResult, 
          creditsUsed: shouldUseCredits ? cost : 0
        });

      } catch (aiError: any) {
        if (reserved) {
          await db.runTransaction(async tx => {
            const [walletSnap, ledgerSnap] = await Promise.all([tx.get(wallet), tx.get(ledger)]);
            if (ledgerSnap.data()?.status !== 'reserved') return;
            const balance = (walletSnap.data()?.creditBalance || 0) + cost;
            tx.update(wallet, { creditBalance: balance });
            tx.set(db.collection('users').doc(userId), { credits: balance }, { merge: true });
            tx.update(ledger, { status: 'refunded', refundedAt: new Date().toISOString() });
          });
        }
        console.error("AI API Error:", aiError);
        const isForbidden = aiError.message?.includes("403") || aiError.message?.includes("Forbidden") || aiError.message?.includes("Permission denied") || aiError.status === 403;
        
        if (isForbidden) {
          return res.status(403).json({
            error: "PERMISSION_DENIED",
            message: "AI service returned 403 Forbidden. This usually means the Service Account lacks IAM roles (Vertex AI User) or the API Key is restricted.",
            details: aiError.message || aiError.toString()
          });
        }

        const isQuotaExceeded = aiError.message?.includes("resource-exhausted") || aiError.message?.includes("Quota exceeded") || aiError.code === 8 || aiError.code === 'resource-exhausted';
        if (isQuotaExceeded) {
          return res.status(429).json({
            error: "RESOURCE_EXHAUSTED",
            message: "Firestore or AI quota limit exceeded. Please wait for the daily reset or check your project limits.",
            details: aiError.message || aiError.toString()
          });
        }

        return res.status(502).json({ 
          error: "AI Generation failed", 
          details: aiError.message,
          code: aiError.code,
          status: aiError.status
        });
      }
    } catch (error: any) {
      console.error("Gatekeeper Error:", error);
      res.status(500).json({ 
        error: "Internal server error", 
        message: error.message,
        code: error.code,
        details: error.details || ""
      });
    }
  });

  // Health check
  apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Catch-all for unmatched API routes
  apiRouter.all("*all", (req, res) => {
    console.warn(`[API 404] Unmatched API route: ${req.method} ${req.url}`);
    res.status(404).json({ error: "API route not found", method: req.method, url: req.url });
  });

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("[Global Error Handler]", err);
    res.status(err.status || 500).json({
      error: "Internal Server Error",
      message: err.message || "An unexpected error occurred",
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
