import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import { GoogleGenAI, Modality } from "@google/genai";
import { AI_COSTS, CreditTransaction, AIAccessSettings, AISource, CreditActionType } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
// In this environment, we assume default credentials or project ID is enough if running in the same cloud project
admin.initializeApp({
  projectId: "gen-lang-client-0893574157",
});

const db = admin.firestore();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Initialization Endpoint (Grant starter credits)
  app.post("/api/auth/init", async (req, res) => {
    try {
      const { userId, email } = req.body;
      if (!userId) return res.status(400).json({ error: "Missing userId" });

      const userRef = db.collection("users").doc(userId);
      const userSnap = await userRef.get();

      const STARTER_AMOUNT = 500;

      if (!userSnap.exists || !userSnap.data()?.aiSettings?.starterCreditsGranted) {
        const initialSettings: AIAccessSettings = {
          creditBalance: STARTER_AMOUNT,
          starterCreditsGranted: true,
          activeSource: 'credits',
          hasUserApiKey: false,
          updatedAt: new Date().toISOString()
        };

        await userRef.set({ 
          uid: userId,
          email: email || "",
          aiSettings: initialSettings 
        }, { merge: true });

        // Record transaction
        const historyRef = userRef.collection("credit_history").doc();
        const transactionRecord: CreditTransaction = {
          userId,
          amount: STARTER_AMOUNT,
          actionType: 'initial_grant',
          source: 'starter',
          description: 'Welcome starter credits!',
          createdAt: new Date().toISOString()
        };
        await historyRef.set(transactionRecord);

        return res.json({ success: true, message: "Starter credits granted", credits: STARTER_AMOUNT });
      }

      res.json({ success: true, message: "User already initialized" });
    } catch (error: any) {
      console.error("Auth Init Error:", error);
      res.status(500).json({ error: "Failed to initialize user", details: error.message });
    }
  });

  // API Gatekeeper Endpoint
  app.post("/api/ai/execute", async (req, res) => {
    try {
      const { actionType, payload, userId } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized: Missing User ID" });
      }

      if (!AI_COSTS[actionType as CreditActionType] && actionType !== 'initial_grant') {
        return res.status(400).json({ error: "Invalid AI action type" });
      }

      // Fetch user data and AI settings
      const userRef = db.collection("users").doc(userId);
      const userSnap = await userRef.get();
      
      if (!userSnap.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      const userData = userSnap.data();
      const settings: AIAccessSettings = userData?.aiSettings;

      if (!settings) {
        return res.status(400).json({ error: "AI settings not configured for this user" });
      }

      const cost = AI_COSTS[actionType as CreditActionType] || 0;
      let apiKeyToUse: string | undefined;
      let shouldUseCredits = false;

      // Decision Logic
      if (settings.activeSource === 'user_api_key') {
        // Mode 1: User's own API key
        // Note: In a real app, this should be encrypted in Firestore and decrypted here
        apiKeyToUse = userData?.geminiApiKey; 
        if (!apiKeyToUse) {
          return res.status(400).json({ error: "User API key selected but not provided" });
        }
      } else {
        // Mode 2: Platform Credits
        if (settings.creditBalance < cost) {
          return res.status(403).json({ error: "resource-exhausted", message: "Insufficient credits. Please top up or use your own API key." });
        }
        apiKeyToUse = process.env.GEMINI_MASTER_KEY || process.env.GEMINI_API_KEY;
        shouldUseCredits = true;
      }

      if (!apiKeyToUse) {
        return res.status(500).json({ error: "AI service configuration error (Missing API Key)" });
      }

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
          const response = await ai.models.generateContent({
            model: modelName,
            contents: payload.prompt,
            config: payload.config
          });
          aiResult = response.text;
        }
      } catch (aiError: any) {
        console.error("Gemini API Error:", aiError);
        return res.status(502).json({ error: "AI Generation failed", details: aiError.message });
      }

      // If success and credit mode -> Deduct credits in a transaction
      if (shouldUseCredits && cost > 0) {
        await db.runTransaction(async (transaction) => {
          const freshUserSnap = await transaction.get(userRef);
          const freshData = freshUserSnap.data();
          const freshSettings: AIAccessSettings = freshData?.aiSettings;
          
          const newBalance = (freshSettings?.creditBalance || 0) - cost;

          transaction.update(userRef, {
            "aiSettings.creditBalance": newBalance,
            "aiSettings.updatedAt": new Date().toISOString()
          });

          // Record transaction history
          const historyRef = userRef.collection("credit_history").doc();
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
        creditsUsed: shouldUseCredits ? cost : 0,
        newBalance: shouldUseCredits ? settings.creditBalance - cost : settings.creditBalance
      });

    } catch (error: any) {
      console.error("Gatekeeper Error:", error);
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
