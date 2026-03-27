import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { GoogleGenAI, Modality } from "@google/genai";
import crypto from "crypto";
import { AI_COSTS } from "./types.ts";
import type { CreditTransaction, AIAccessSettings, AISource, CreditActionType } from "./types.ts";

// Encryption Helpers
const ENCRYPTION_KEY = process.env.AI_ENCRYPTION_KEY || 'a_very_secret_32_byte_key_for_ai_keys_123';
const IV_LENGTH = 16;

function encrypt(text: string) {
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
const configDbId = (rawConfigDbId && rawConfigDbId !== "(default)") ? rawConfigDbId : "ai-studio-da2c7ce8-8cbd-4a4d-a1f0-c740600206e8";

// Force environment variables to match the target project
process.env.GOOGLE_CLOUD_PROJECT = projectId;
process.env.GCLOUD_PROJECT = projectId;
process.env.GCP_PROJECT = projectId;

if (!configDbId || configDbId === "(default)") {
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
}> {
  console.log(`[AI Access] Resolving access for workspaceId: ${workspaceId}`);
  const workspaceRef = db.collection("workspaces").doc(workspaceId);
  const workspaceSnap = await workspaceRef.get();

  if (!workspaceSnap.exists) {
    console.warn(`[AI Access] Workspace not found: ${workspaceId}`);
    return { apiKey: "", source: "starter_credits", cost: 0, error: "Workspace not found", status: 404 };
  }

  const settings: AIAccessSettings = workspaceSnap.data() as AIAccessSettings;
  console.log(`[AI Access] Workspace data for ${workspaceId}: creditBalance=${settings.creditBalance}, activeSource=${settings.activeSource}, starterCreditsGranted=${settings.starterCreditsGranted}`);
  
  const masterKey = process.env.GEMINI_MASTER_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;

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
  return { apiKey: masterKey, source: settings.activeSource, cost: 0 };
}

async function startServer() {
  // We no longer verify Firestore at startup to prevent blocking the server 
  // if there are permission issues with the ambient credentials.
  // Verification will happen on first request.

  const app = express();
  // The PORT is hardcoded to 3000 in the AI Studio environment.
  // We use process.env.PORT to support external deployments like Cloud Run.
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Request logger for API
  app.use('/api', (req, res, next) => {
    console.log(`[API Request] ${req.method} ${req.url}`);
    next();
  });

  // Auth Initialization Endpoint (Grant starter credits)
  app.post("/api/auth/init", async (req, res) => {
    try {
      const { userId, email } = req.body;
      if (!userId) return res.status(400).json({ error: "Missing userId" });

      // In this app, workspaceId is currently same as userId for simplicity
      const workspaceId = userId; 
      
      console.log(`[Auth Init] Request for userId: ${userId}, email: ${email}`);
      console.log(`[Auth Init] Using Firestore Project: ${projectId}, Database: ${configDbId}`);

      const userRef = db.collection("users").doc(userId);
      const workspaceRef = db.collection("workspaces").doc(workspaceId);
      
      console.log(`[Auth Init] Attempting to fetch user doc: users/${userId}`);
      const userSnap = await userRef.get();
      console.log(`[Auth Init] User doc fetched. Exists: ${userSnap.exists}`);
      const STARTER_AMOUNT = 500;
      const workspaceSnap = await workspaceRef.get();

      // Initialize Workspace if not exists
      if (!workspaceSnap.exists || !workspaceSnap.data()?.starterCreditsGranted) {
        const initialSettings: AIAccessSettings = {
          workspaceId,
          aiProvider: 'gemini',
          activeSource: 'starter_credits',
          starterCreditsGranted: true,
          creditBalance: STARTER_AMOUNT,
          hasUserApiKey: false,
          userApiKeyStatus: 'missing',
          updatedAt: new Date().toISOString()
        };

        await workspaceRef.set(initialSettings);

        // Record transaction
        const historyRef = workspaceRef.collection("transactions").doc();
        const transactionRecord: CreditTransaction = {
          userId,
          amount: STARTER_AMOUNT,
          actionType: 'initial_grant',
          source: 'starter',
          description: 'Welcome starter credits!',
          createdAt: new Date().toISOString()
        };
        await historyRef.set(transactionRecord);
        
        // Ensure user has workspaceId and credits field for frontend sync
        await userRef.set({ 
          uid: userId,
          email: email || "",
          workspaceId: workspaceId,
          credits: STARTER_AMOUNT,
          updatedAt: new Date().toISOString(),
          brand: admin.firestore.FieldValue.delete(),
          posts: admin.firestore.FieldValue.delete(),
          mediaAssets: admin.firestore.FieldValue.delete(),
          studioAssets: admin.firestore.FieldValue.delete()
        }, { merge: true });

        return res.json({ success: true, message: "Starter credits granted", credits: STARTER_AMOUNT, workspaceId });
      }

      // REPAIR LOGIC: If workspace exists but has 0 or missing credits and user is still in onboarding step 1
      const workspaceData = workspaceSnap.data() as AIAccessSettings;
      const userData = userSnap.data();
      
      const hasZeroCredits = workspaceData.creditBalance === 0 || workspaceData.creditBalance === undefined || workspaceData.creditBalance === null;
      const isInOnboarding = !userData?.onboardingStep || userData.onboardingStep <= 2;

      if (hasZeroCredits && isInOnboarding) {
        console.log(`[Auth Init] Repairing user ${userId}: ${workspaceData.creditBalance} credits found in onboarding. Granting 500.`);
        const updateObj: any = { 
          creditBalance: STARTER_AMOUNT,
          starterCreditsGranted: true,
          updatedAt: new Date().toISOString()
        };
        
        // Also ensure activeSource is correct
        if (!workspaceData.activeSource) {
          updateObj.activeSource = 'starter_credits';
        }

        await workspaceRef.update(updateObj);
        await userRef.update({ 
          credits: STARTER_AMOUNT,
          updatedAt: new Date().toISOString()
        });
        
        const historyRef = workspaceRef.collection("transactions").doc();
        await historyRef.set({
          userId,
          amount: STARTER_AMOUNT,
          actionType: 'initial_grant',
          source: 'starter',
          description: 'Starter credits (Repair)',
          createdAt: new Date().toISOString()
        });
        return res.json({ success: true, message: "Starter credits repaired", credits: STARTER_AMOUNT, workspaceId });
      }

      // Migration/Fix: If activeSource is user_api_key but key is missing/invalid, reset to starter_credits
      const data = workspaceSnap.data() as AIAccessSettings;
      if (data.activeSource === 'user_api_key' && (data.userApiKeyStatus !== 'valid' || !data.userApiKeyEncrypted)) {
        console.log(`[Auth Init] Resetting activeSource to starter_credits for user ${userId} (invalid/missing user key)`);
        await workspaceRef.update({ 
          activeSource: 'starter_credits',
          updatedAt: new Date().toISOString()
        });
      }

      res.json({ success: true, message: "User already initialized", workspaceId });
    } catch (error: any) {
      console.error("Auth Init Error:", error);
      res.status(500).json({ error: "Failed to initialize user", details: error.message });
    }
  });

  // API Key Management Endpoints
  app.post("/api/ai/settings/update", async (req, res) => {
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
        updateData.activeSource = activeSource;
      }

      await workspaceRef.update(updateData);
      const freshSnap = await workspaceRef.get();
      res.json({ success: true, settings: freshSnap.data() });
    } catch (error: any) {
      console.error("Update AI Settings Error:", error);
      res.status(500).json({ error: "Failed to update AI settings", details: error.message });
    }
  });

  app.post("/api/ai/settings/validate", async (req, res) => {
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
  app.post("/api/ai/execute", async (req, res) => {
    try {
      const { actionType, payload, userId, workspaceId } = req.body;
      const targetWorkspaceId = workspaceId || userId; // Fallback for legacy
      
      console.log(`[Gatekeeper] Request: actionType=${actionType}, userId=${userId}, workspaceId=${targetWorkspaceId}`);

      if (!userId || !targetWorkspaceId) {
        return res.status(401).json({ error: "Unauthorized: Missing User or Workspace ID" });
      }

      const cost = AI_COSTS[actionType as CreditActionType] || 0;
      
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

      // Execute AI Action
      const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
      const modelName = payload.model || "gemini-3-flash-preview"; 
      
      let aiResult;
      try {
        if (actionType === 'generate_video') {
          // Video Generation (Veo)
          let operation = await ai.models.generateVideos({
            model: modelName,
            prompt: payload.prompt,
            image: payload.image ? {
              imageBytes: payload.image.split(',')[1],
              mimeType: 'image/png'
            } : undefined,
            config: payload.config
          });

          while (!operation.done) {
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
          // Image Generation or Multimodal
          const parts: any[] = [{ text: payload.prompt }];
          if (payload.image) {
            parts.push({
              inlineData: {
                data: payload.image.split(',')[1],
                mimeType: 'image/png'
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
        } else {
          // Standard Text Generation
          console.log(`Executing standard text generation for ${actionType} with model ${modelName}`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [{ parts: [{ text: payload.prompt }] }],
            config: payload.config
          });
          aiResult = response.text || "";
          console.log(`Generation successful, result length: ${aiResult.length}`);
        }
      } catch (aiError: any) {
        console.error("Gemini API Error:", aiError);
        return res.status(502).json({ error: "AI Generation failed", details: aiError.message });
      }

      // If success and credit mode -> Deduct credits in a transaction
      if (shouldUseCredits && cost > 0) {
        const workspaceRef = db.collection("workspaces").doc(targetWorkspaceId);
        const userRef = db.collection("users").doc(userId);

        await db.runTransaction(async (transaction: any) => {
          const freshSnap = await transaction.get(workspaceRef);
          const freshData = freshSnap.data() as AIAccessSettings;
          
          const newBalance = (freshData?.creditBalance || 0) - cost;

          transaction.update(workspaceRef, {
            "creditBalance": newBalance,
            "updatedAt": new Date().toISOString()
          });

          // Sync with users collection for frontend consistency
          transaction.update(userRef, {
            "credits": newBalance,
            "updatedAt": new Date().toISOString()
          });

          // Record transaction history
          const historyRef = workspaceRef.collection("transactions").doc();
          const transactionRecord: CreditTransaction = {
            userId,
            amount: -cost,
            actionType: actionType as CreditActionType,
            source: 'usage',
            description: `AI Action: ${actionType}`,
            createdAt: new Date().toISOString()
          };
          transaction.set(historyRef, transactionRecord);
        });
      }

      res.json({ 
        success: true, 
        result: aiResult, 
        creditsUsed: shouldUseCredits ? cost : 0
      });

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

  // Diagnostic Endpoint
  app.get("/api/admin/diagnose-user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const userRef = db.collection("users").doc(userId);
      const workspaceRef = db.collection("workspaces").doc(userId);
      
      const [userSnap, workspaceSnap] = await Promise.all([userRef.get(), workspaceRef.get()]);
      
      res.json({
        userId,
        userExists: userSnap.exists,
        userData: userSnap.exists ? userSnap.data() : null,
        workspaceExists: workspaceSnap.exists,
        workspaceData: workspaceSnap.exists ? workspaceSnap.data() : null,
        masterKeyConfigured: !!(process.env.GEMINI_MASTER_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY)
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Catch-all for unmatched API routes
  app.all("/api/*all", (req, res) => {
    console.warn(`[API 404] Unmatched API route: ${req.method} ${req.url}`);
    res.status(404).json({ error: "API route not found", method: req.method, url: req.url });
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
