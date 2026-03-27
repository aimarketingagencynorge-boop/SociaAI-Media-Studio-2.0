
import { GoogleGenAI, Type } from "@google/genai";
import { BrandData, SocialPost, Language, PlatformDNA, Platform } from "./types";
import { useStore } from "./store";

export interface CampaignContext {
  platform: Platform;
  topic: string;
  content: string;
  hook: string;
  language: Language;
  brand: BrandData;
  platformDNA?: PlatformDNA;
  goal?: string;
}

export class GeminiService {
  private getLanguageName(lang: Language): string {
    const names: Record<Language, string> = {
      'PL': 'Polish',
      'EN': 'English',
      'NO': 'Norwegian',
      'RU': 'Russian'
    };
    return names[lang] || 'English';
  }

  private cleanJsonResponse(text: string): string {
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
  }

  private getSignature(brand: BrandData): string {
    if (!brand) return '';
    const sig = brand.signature;
    if (!sig || !sig.enabled) return '';

    const lang = brand.contentLanguage || 'EN';
    const labels = {
      'PL': { address: 'Adres', phone: 'Tel', email: 'Email', web: 'WWW' },
      'EN': { address: 'Address', phone: 'Phone', email: 'Email', web: 'Web' },
      'NO': { address: 'Adresse', phone: 'Tlf', email: 'E-post', web: 'Web' },
      'RU': { address: 'Адрес', phone: 'Тел', email: 'Email', web: 'Сайт' }
    }[lang] || { address: 'Address', phone: 'Phone', email: 'Email', web: 'Web' };

    const parts = [];
    if (sig.showBrandName && brand.name) parts.push(brand.name);
    if (sig.showAddress && brand.address) parts.push(`📍 ${labels.address}: ${brand.address}`);
    if (sig.showPhone && brand.phone) parts.push(`📞 ${labels.phone}: ${brand.phone}`);
    if (sig.showEmail && brand.email) parts.push(`📧 ${labels.email}: ${brand.email}`);
    if (sig.showCtaLink && brand.ctaLink) parts.push(`🌐 ${labels.web}: ${brand.ctaLink}`);
    
    return parts.length > 0 ? `\n\n---\n${parts.join('\n')}` : '';
  }

  public buildFinalContent(baseContent: string, brand: BrandData): string {
    if (!brand) return baseContent;
    const signature = this.getSignature(brand);
    // Remove existing signature if present (anything after ---)
    const cleanContent = baseContent.split('\n\n---\n')[0];
    return cleanContent + signature;
  }

  private getBrandContextPrompt(brand: BrandData, targetLanguage: Language): string {
    if (!brand) return '';
    const colorString = (brand.colors || []).map(c => `${c.name}: ${c.hex}`).join(', ');
    const langName = this.getLanguageName(targetLanguage);
    
    let referenceContext = '';
    const referenceImages = brand.referenceImages || [];
    if (brand.referenceSettings?.useInGeneration && referenceImages.length > 0) {
      const primaryRefs = referenceImages.filter(img => img.priority === 'primary');
      const refsToUse = primaryRefs.length > 0 ? primaryRefs : referenceImages.slice(0, 5);
      
      referenceContext = `
    --- VISUAL DNA REFERENCES (Strength: ${brand.referenceSettings?.strength || 'medium'}) ---
    The following visual elements are part of the Brand DNA and MUST be used as reference for style, atmosphere, and composition:
    ${refsToUse.map(img => `- [${img.tags.join(', ')}]: ${img.title}. ${img.note}`).join('\n    ')}
    ----------------------------------------------------------
      `;
    }

    const emojiInstructions = [
      "DO NOT use any emojis.",
      "Use emojis very sparingly (max 1-2 per post).",
      "Use emojis naturally to emphasize key points.",
      "Use emojis richfully and creatively to make the post vibrant."
    ][brand.emojiStyle || 0];

    const ctaInstructions = {
      'delicate': 'Use a subtle, non-pushy call to action.',
      'educational': 'Focus the call to action on learning more or discovering value.',
      'direct': 'Use a strong, direct, and clear call to action.'
    }[brand.ctaStyle || 'direct'];

    return `
    --- BRAND DNA CORE ---
    TARGET LANGUAGE: ${langName}
    BRAND NAME: ${brand.name}
    INDUSTRY: ${brand.industry}
    DESCRIPTION: ${brand.description}
    USP: ${brand.usp || 'Not specified'}
    MISSION: ${brand.coreMission}
    WHAT WE DO: ${brand.whatWeDo}
    HOW WE DO IT: ${brand.howWeDoIt}
    TONE OF VOICE: ${brand.toneOfVoice}
    VISUAL MOOD: ${brand.voiceProfile}
    BRAND PERCEPTION: ${brand.brandPerception || 'Not specified'}
    PILLARS: ${brand.pillars?.join(', ') || 'Not specified'}
    HUMAN TOUCH: ${brand.humanTouch || 'Not specified'}
    COLORS: ${colorString}
    EMOJI STYLE: ${emojiInstructions}
    CTA STYLE: ${ctaInstructions}
    YODA MODE: ${brand.isYodaMode && targetLanguage === 'PL' ? 'ACTIVE (Use inverted Polish grammar)' : 'INACTIVE'}
    ${referenceContext}
    ----------------------
    `;
  }

  private getPlatformContextPrompt(platform: string, brand: BrandData): string {
    if (!brand) return '';
    const platformDNA = brand.platformDNA?.[platform as keyof typeof brand.platformDNA];
    if (!platformDNA) return '';
    
    return `
      --- PLATFORM DNA (${platform}) ---
      POSITIONING: ${platformDNA.positioning}
      CONTENT FOCUS: ${platformDNA.contentFocus}
      VISUAL DIRECTION: ${platformDNA.visualDirection}
      GOAL: ${platformDNA.goal}
      ----------------------------------
    `;
  }

  private manualApiKey: string | null = localStorage.getItem('GEMINI_API_KEY');

  setApiKey(key: string) {
    this.manualApiKey = key;
    localStorage.setItem('GEMINI_API_KEY', key);
  }

  getStoredApiKey(): string | null {
    return this.manualApiKey;
  }

  private getAiInstance() {
    // Access API key from various possible locations in a Vite environment
    const storeKey = useStore.getState().geminiApiKey;
    const apiKey = storeKey ||
                   this.manualApiKey ||
                   (process.env as any)?.GEMINI_API_KEY ||
                   (process.env as any)?.API_KEY || 
                   (import.meta as any).env?.VITE_API_KEY ||
                   (window as any).API_KEY ||
                   (window as any).process?.env?.API_KEY;
    
    if (!apiKey) {
      // If we are in the browser and have access to aistudio helper
      if (typeof window !== 'undefined' && (window as any).aistudio) {
        (window as any).aistudio.openSelectKey();
      }
      
      console.error("GeminiService: API_KEY not found in any expected location.");
      throw new Error("AUTH_KEY_MISSING: The system could not find a valid API Key. Please select your API key in the settings.");
    }
    return new GoogleGenAI({ apiKey });
  }

  private async handleApiError(error: any) {
    const errorMsg = error?.message || String(error);
    if (errorMsg.includes("Requested entity was not found") || errorMsg.includes("API_KEY_INVALID")) {
      if (typeof window !== 'undefined' && (window as any).aistudio) {
        await (window as any).aistudio.openSelectKey();
      }
    }
    throw error;
  }

  public buildCampaignContext(post: Partial<SocialPost>, brand: BrandData): CampaignContext {
    if (!brand) {
      // Return a minimal context if brand is missing
      return {
        platform: post.platform || 'instagram',
        topic: post.topic || '',
        content: post.content || '',
        hook: post.hook || '',
        language: post.language || 'EN',
        brand: {} as BrandData
      };
    }
    const platform: Platform = post.platform || 'instagram';
    const platformDNA = brand.platformDNA?.[platform];
    
    return {
      platform,
      topic: post.topic || '',
      content: post.content || '',
      hook: post.hook || '',
      language: post.language || brand.contentLanguage,
      brand,
      platformDNA,
      goal: platformDNA?.goal
    };
  }

  async generateImagePromptFromPost(context: CampaignContext): Promise<string> {
    const ai = this.getAiInstance();
    const brandContext = this.getBrandContextPrompt(context.brand, context.language);
    
    const promptText = `
      ${brandContext}
      --- CAMPAIGN CONTEXT ---
      PLATFORM: ${context.platform}
      TOPIC: ${context.topic}
      POST CONTENT: ${context.content}
      HOOK/OVERLAY: ${context.hook}
      PLATFORM GOAL: ${context.goal}
      VISUAL DIRECTION: ${context.platformDNA?.visualDirection}
      ------------------------

      Based on the above Brand DNA and the specific Post Content, generate a detailed visual prompt for an AI image generator (like DALL-E or Midjourney).
      The image MUST:
      1. Reflect the post's topic and content.
      2. Adhere to the Brand's visual DNA and colors.
      3. Match the platform's visual direction.
      4. Be professional, cinematic, and high-quality.
      5. DO NOT include any text in the image.
      
      Return ONLY the prompt string.
    `;

    const parts: any[] = [{ text: promptText }];

    // Include actual reference images if available to help the AI "see" the style
    const referenceImages = context.brand.referenceImages || [];
    if (context.brand.referenceSettings?.useInGeneration && referenceImages.length > 0) {
      const primaryRefs = referenceImages
        .filter(img => img.priority === 'primary')
        .slice(0, 3);
      
      for (const img of primaryRefs) {
        if (img.imageUrl.startsWith('data:image')) {
          parts.push({
            inlineData: {
              data: img.imageUrl.split(',')[1],
              mimeType: "image/png"
            }
          });
        }
      }
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Using Flash for better visual understanding
        contents: { parts }
      });

      return response.text || `Professional cinematic photo for ${context.brand.name} about ${context.topic}`;
    } catch (e: any) {
      console.error("Image prompt generation failed", e);
      if (e.message?.includes("Requested entity was not found") || e.message?.includes("API_KEY_INVALID")) {
        await this.handleApiError(e);
      }
      return `Professional cinematic photo for ${context.brand.name} about ${context.topic}`;
    }
  }

  async generateImage(prompt: string, brand: BrandData, context?: CampaignContext): Promise<string> {
    try {
      if (!brand && !context?.brand) {
        return `https://loremflickr.com/800/800/business?random=${Math.random()}`;
      }
      const ai = this.getAiInstance();
      let finalPrompt = prompt;

      if (context) {
        // If context is provided, we use it to enrich the prompt if it's too simple
        if (prompt.length < 50) {
          finalPrompt = await this.generateImagePromptFromPost(context);
        }
      } else {
        finalPrompt = `Professional cinematic photo for ${brand.name}. Topic: ${prompt}. Style: ${brand.voiceProfile}. High resolution, no text.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: finalPrompt }] },
        config: { 
          imageConfig: { 
            aspectRatio: context?.platform === 'tiktok' ? "9:16" : context?.platform === 'instagram' ? "1:1" : "16:9",
          } 
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    } catch (e: any) {
      console.error("Image generation failed", e);
      if (e.message?.includes("Requested entity was not found") || e.message?.includes("API_KEY_INVALID")) {
        await this.handleApiError(e);
      }
    }
    return `https://loremflickr.com/800/800/${brand.industry.split(' ')[0] || 'business'}?random=${Math.random()}`;
  }

  async scanWebsite(url: string, targetLanguage: Language) {
    const ai = this.getAiInstance();
    const langName = this.getLanguageName(targetLanguage);
    
    let intelligence = "";
    let sources: string[] = [];

    try {
      const searchResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Audit this business website: ${url.trim()}. 
        Extract: official name, detailed description of services/products, industry, core mission, and brand colors.
        Report must be in ${langName}.`,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      intelligence = searchResponse.text || "";
      const groundingChunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      sources = groundingChunks.map((chunk: any) => chunk.web?.uri).filter(Boolean);
    } catch (searchError: any) {
      console.warn("Search grounding failed, falling back to direct analysis", searchError);
      if (searchError.message?.includes("Requested entity was not found") || searchError.message?.includes("API_KEY_INVALID")) {
        await this.handleApiError(searchError);
      }
      // Fallback: Try without search tools if search fails (might be a key restriction)
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this business URL: ${url.trim()}. 
        Based on the URL name and common knowledge, describe the business, industry, and mission.
        Report must be in ${langName}.`,
      });
      intelligence = fallbackResponse.text || "";
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Using Flash for faster mapping and better schema compliance
        contents: `Based on this intelligence: "${intelligence}", create a structured Brand DNA JSON.
        URL: ${url}.
        Language: ${langName}.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              industry: { type: Type.STRING },
              colors: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT, 
                  properties: { name: { type: Type.STRING }, hex: { type: Type.STRING } } 
                } 
              },
              toneOfVoice: { type: Type.STRING },
              toneConfidence: { type: Type.NUMBER }
            },
            required: ["name", "description", "industry", "colors", "toneOfVoice", "toneConfidence"]
          }
        }
      });

      const cleaned = this.cleanJsonResponse(response.text || '{}');
      return {
        data: JSON.parse(cleaned),
        sources: sources
      };
    } catch (e: any) {
      console.error("DNA Mapping Error", e);
      if (e.message?.includes("Requested entity was not found") || e.message?.includes("API_KEY_INVALID")) {
        await this.handleApiError(e);
      }
      throw new Error("Neural link failed to decode brand DNA. Try again.");
    }
  }

  async refineBrandDNA(brand: BrandData, prompt: string, targetLanguage: Language) {
    const ai = this.getAiInstance();
    const langName = this.getLanguageName(targetLanguage);
    const context = this.getBrandContextPrompt(brand, targetLanguage);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${context} Refine the following Brand DNA based on this request: "${prompt}". 
        Current Brand Data: ${JSON.stringify(brand)}.
        Language: ${langName}.
        Return a complete updated Brand DNA JSON object.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              industry: { type: Type.STRING },
              usp: { type: Type.STRING },
              toneOfVoice: { type: Type.STRING },
              voiceProfile: { type: Type.STRING },
              coreMission: { type: Type.STRING },
              whatWeDo: { type: Type.STRING },
              howWeDoIt: { type: Type.STRING },
              brandPerception: { type: Type.STRING },
              pillars: { type: Type.ARRAY, items: { type: Type.STRING } },
              humanTouch: { type: Type.STRING }
            }
          }
        }
      });

      const cleaned = this.cleanJsonResponse(response.text || '{}');
      return JSON.parse(cleaned);
    } catch (e: any) {
      console.error("Brand DNA Refinement Error", e);
      if (e.message?.includes("Requested entity was not found") || e.message?.includes("API_KEY_INVALID")) {
        await this.handleApiError(e);
      }
      throw new Error("Failed to refine brand DNA.");
    }
  }

  async generateSocialPost(topic: string, platform: Platform, brand: BrandData, targetLanguage: Language) {
    const ai = this.getAiInstance();
    const contextPrompt = this.getBrandContextPrompt(brand, targetLanguage);
    const langName = this.getLanguageName(targetLanguage);
    const platformDNA = brand.platformDNA?.[platform];
    
    const platformContext = platformDNA ? `
      --- PLATFORM DNA (${platform}) ---
      POSITIONING: ${platformDNA.positioning}
      CONTENT FOCUS: ${platformDNA.contentFocus}
      VISUAL DIRECTION: ${platformDNA.visualDirection}
      GOAL: ${platformDNA.goal}
      ----------------------------------
    ` : '';
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${contextPrompt} ${platformContext} Write a high-engagement ${platform} post about: ${topic}. 
        Language: ${langName}. 
        Ensure the content matches the platform's focus and goal.
        Return JSON format.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              content: { type: Type.STRING },
              hook: { type: Type.STRING },
              hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
              imageBrief: { type: Type.STRING }
            },
            required: ["content", "hook", "hashtags", "imageBrief"]
          }
        }
      });

      const data = JSON.parse(this.cleanJsonResponse(response.text || '{}'));
      const campaignContext = this.buildCampaignContext({ ...data, platform }, brand);
      const imageUrl = await this.generateImage(data.imageBrief, brand, campaignContext);
      return {
        ...data,
        content: this.buildFinalContent(data.content, brand),
        imagePreviewUrl: imageUrl
      };
    } catch (e: any) {
      console.error("Social post generation failed", e);
      if (e.message?.includes("Requested entity was not found") || e.message?.includes("API_KEY_INVALID")) {
        await this.handleApiError(e);
      }
      throw e;
    }
  }

  async enhanceImage(base64Image: string, prompt: string, brand: BrandData): Promise<string> {
    try {
      const ai = this.getAiInstance();
      const brandPrompt = `Enhance this image for ${brand.name}. Command: ${prompt}. Style: ${brand.voiceProfile}. High quality marketing visual. Return the enhanced image.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: base64Image.split(',')[1], mimeType: "image/png" } },
            { text: brandPrompt }
          ]
        },
        config: {
          imageConfig: {
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    } catch (e: any) {
      console.error("Image enhancement failed", e);
      if (e.message?.includes("Requested entity was not found") || e.message?.includes("API_KEY_INVALID")) {
        await this.handleApiError(e);
      }
    }
    return base64Image;
  }

  async generateThumbnail(videoDescription: string, brand: BrandData, targetLanguage: Language): Promise<{ url: string; hook: string }> {
    const ai = this.getAiInstance();
    const langName = this.getLanguageName(targetLanguage);
    const contextPrompt = this.getBrandContextPrompt(brand, targetLanguage);
    const platformContext = this.getPlatformContextPrompt('youtube', brand);
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${contextPrompt} ${platformContext} Create a high-impact thumbnail brief for a video described as: "${videoDescription}". Language: ${langName}. JSON format with 'imageBrief' and 'hookText'.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              imageBrief: { type: Type.STRING },
              hookText: { type: Type.STRING }
            },
            required: ["imageBrief", "hookText"]
          }
        }
      });

      const data = JSON.parse(this.cleanJsonResponse(response.text || '{}'));
      const campaignContext = this.buildCampaignContext({ topic: videoDescription, hook: data.hookText, platform: 'youtube' }, brand);
      const url = await this.generateImage(data.imageBrief, brand, campaignContext);
      return { url, hook: data.hookText };
    } catch (e: any) {
      console.error("Thumbnail generation failed", e);
      if (e.message?.includes("Requested entity was not found") || e.message?.includes("API_KEY_INVALID")) {
        await this.handleApiError(e);
      }
      throw e;
    }
  }

  async draftPostFromMedia(mediaType: 'image' | 'video', mediaDescription: string, platform: Platform, brand: BrandData, targetLanguage: Language) {
    const ai = this.getAiInstance();
    const contextPrompt = this.getBrandContextPrompt(brand, targetLanguage);
    const platformContext = this.getPlatformContextPrompt(platform, brand);
    const langName = this.getLanguageName(targetLanguage);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${contextPrompt} ${platformContext} Write a high-engagement ${platform} post for this ${mediaType}: "${mediaDescription}". Language: ${langName}. JSON format.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              content: { type: Type.STRING },
              hook: { type: Type.STRING },
              hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["content", "hook", "hashtags"]
          }
        }
      });

      const data = JSON.parse(this.cleanJsonResponse(response.text || '{}'));
      return {
        ...data,
        content: this.buildFinalContent(data.content, brand)
      };
    } catch (e: any) {
      console.error("Post from media generation failed", e);
      if (e.message?.includes("Requested entity was not found") || e.message?.includes("API_KEY_INVALID")) {
        await this.handleApiError(e);
      }
      throw e;
    }
  }

  async generateWeeklyPlan(brand: BrandData, targetLanguage: Language, weekIndex: number = 0): Promise<SocialPost[]> {
    const ai = this.getAiInstance();
    const contextPrompt = this.getBrandContextPrompt(brand, targetLanguage);
    const langName = this.getLanguageName(targetLanguage);
    
    const allPlatformsContext = Object.entries(brand.platformDNA || {})
      .map(([platform, dna]) => `
        PLATFORM: ${platform}
        POSITIONING: ${dna.positioning}
        CONTENT FOCUS: ${dna.contentFocus}
        GOAL: ${dna.goal}
      `).join('\n');

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Upgraded for better planning
        contents: `${contextPrompt} 
        --- PLATFORM STRATEGIES ---
        ${allPlatformsContext}
        ---------------------------
        Create a 7-day social media plan with a mix of platforms (facebook, instagram, linkedin, tiktok). 
        Language: ${langName}. 
        Ensure each post follows the specific platform strategy.
        Return as a JSON array.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                dayIndex: { type: Type.INTEGER },
                platform: { type: Type.STRING },
                topic: { type: Type.STRING },
                hook: { type: Type.STRING },
                content: { type: Type.STRING },
                hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                imageBrief: { type: Type.STRING }
              },
              required: ["dayIndex", "platform", "topic", "hook", "content", "hashtags", "imageBrief"]
            }
          }
        }
      });

      const data = JSON.parse(this.cleanJsonResponse(response.text || '[]'));
      return await Promise.all(data.map(async (item: any) => {
        const campaignContext = this.buildCampaignContext(item, brand);
        return {
          ...item,
          id: Math.random().toString(36).substr(2, 9),
          weekIndex,
          status: 'draft',
          isApproved: false,
          showHook: true,
          signatureEnabled: true,
          content: this.buildFinalContent(item.content, brand),
          imagePreviewUrl: await this.generateImage(item.imageBrief, brand, campaignContext)
        };
      }));
    } catch (e: any) {
      console.error("Weekly plan generation failed", e);
      if (e.message?.includes("Requested entity was not found") || e.message?.includes("API_KEY_INVALID")) {
        await this.handleApiError(e);
      }
      throw e;
    }
  }

  async refineText(post: SocialPost, refinePrompt: string, brand: BrandData, targetLanguage: Language) {
    const ai = this.getAiInstance();
    const contextPrompt = this.getBrandContextPrompt(brand, targetLanguage);
    const platformContext = this.getPlatformContextPrompt(post.platform, brand);
    const langName = this.getLanguageName(targetLanguage);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${contextPrompt} ${platformContext} Refine post CAPTION/CONTENT ONLY. DO NOT change the image hook or the image itself. 
        Command: "${refinePrompt}". 
        Original Topic: ${post.topic}. 
        Language: ${langName}. 
        Return JSON with 'content' field only.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              content: { type: Type.STRING }
            },
            required: ["content"]
          }
        }
      });

      const data = JSON.parse(this.cleanJsonResponse(response.text || '{}'));
      return {
        content: this.buildFinalContent(data.content, brand)
      };
    } catch (e: any) {
      console.error("Text refinement failed", e);
      if (e.message?.includes("Requested entity was not found") || e.message?.includes("API_KEY_INVALID")) {
        await this.handleApiError(e);
      }
      throw e;
    }
  }

  async refineImage(post: SocialPost, refinePrompt: string, brand: BrandData) {
    const ai = this.getAiInstance();
    const contextPrompt = this.getBrandContextPrompt(brand, brand.contentLanguage);
    const platformContext = this.getPlatformContextPrompt(post.platform, brand);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${contextPrompt} ${platformContext} Refine post IMAGE BRIEF ONLY: "${refinePrompt}". Original: ${post.topic}. JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              imageBrief: { type: Type.STRING }
            },
            required: ["imageBrief"]
          }
        }
      });

      const data = JSON.parse(this.cleanJsonResponse(response.text || '{}'));
      const campaignContext = this.buildCampaignContext(post, brand);
      const imageUrl = await this.generateImage(data.imageBrief, brand, campaignContext);
      return {
        imageBrief: data.imageBrief,
        imagePreviewUrl: imageUrl
      };
    } catch (e: any) {
      console.error("Image refinement failed", e);
      if (e.message?.includes("Requested entity was not found") || e.message?.includes("API_KEY_INVALID")) {
        await this.handleApiError(e);
      }
      throw e;
    }
  }

  async refineContent(post: SocialPost, refinePrompt: string, brand: BrandData, targetLanguage: Language) {
    const ai = this.getAiInstance();
    const contextPrompt = this.getBrandContextPrompt(brand, targetLanguage);
    const platformContext = this.getPlatformContextPrompt(post.platform, brand);
    const langName = this.getLanguageName(targetLanguage);

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${contextPrompt} ${platformContext} Refine post: "${refinePrompt}". Original: ${post.topic}. Language: ${langName}. JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING },
            hook: { type: Type.STRING },
            imageBrief: { type: Type.STRING }
          },
          required: ["content", "hook", "imageBrief"]
        }
      }
    });

    const data = JSON.parse(this.cleanJsonResponse(response.text || '{}'));
    const campaignContext = this.buildCampaignContext({ ...data, platform: post.platform }, brand);
    return {
      ...data,
      content: this.buildFinalContent(data.content, brand),
      imagePreviewUrl: await this.generateImage(data.imageBrief, brand, campaignContext)
    };
  }

  async generateStudioImage(
    mode: 'text-to-image' | 'image-to-image',
    prompt: string,
    platform: Platform,
    brand: BrandData,
    useBrandDNA: boolean,
    sourceImageUrl?: string
  ): Promise<string> {
    try {
      const ai = this.getAiInstance();
      let finalPrompt = prompt;
      
      if (useBrandDNA) {
        const context = this.buildCampaignContext({ platform, topic: prompt }, brand);
        finalPrompt = await this.generateImagePromptFromPost(context);
      }

      const contents: any = {
        parts: [{ text: finalPrompt }]
      };

      if (mode === 'image-to-image' && sourceImageUrl) {
        contents.parts.unshift({
          inlineData: {
            data: sourceImageUrl.split(',')[1],
            mimeType: "image/png"
          }
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents,
        config: {
          imageConfig: {
            aspectRatio: platform === 'instagram' ? "1:1" : platform === 'tiktok' ? "9:16" : "16:9",
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    } catch (e: any) {
      console.error("Studio image generation failed", e);
      if (e.message?.includes("Requested entity was not found") || e.message?.includes("API_KEY_INVALID")) {
        await this.handleApiError(e);
      }
    }
    return `https://loremflickr.com/1080/1080/${brand.industry.split(' ')[0] || 'business'}?random=${Math.random()}`;
  }

  async generateStudioVideo(
    mode: 'text-to-video' | 'image-to-video',
    prompt: string,
    platform: Platform,
    brand: BrandData,
    useBrandDNA: boolean,
    sourceImageUrl?: string
  ): Promise<string> {
    try {
      const ai = this.getAiInstance();
      let finalPrompt = prompt;
      
      if (useBrandDNA) {
        const context = this.buildCampaignContext({ platform, topic: prompt }, brand);
        finalPrompt = await this.generateImagePromptFromPost(context);
      }

      const videoConfig: any = {
        model: 'veo-3.1-fast-generate-preview',
        prompt: finalPrompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: platform === 'tiktok' || platform === 'instagram' ? '9:16' : '16:9'
        }
      };

      if (mode === 'image-to-video' && sourceImageUrl) {
        videoConfig.image = {
          imageBytes: sourceImageUrl.split(',')[1],
          mimeType: 'image/png'
        };
      }

      let operation = await ai.models.generateVideos(videoConfig);

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const apiKey = (ai as any).apiKey;
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: { 'x-goog-api-key': apiKey },
        });
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
    } catch (e: any) {
      console.error("Studio video generation failed", e);
      if (e.message?.includes("Requested entity was not found") || e.message?.includes("API_KEY_INVALID")) {
        await this.handleApiError(e);
      }
    }
    return "https://assets.mixkit.co/videos/preview/mixkit-abstract-technology-background-with-blue-lines-41344-large.mp4";
  }
}

export const gemini = new GeminiService();
