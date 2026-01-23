
import { GoogleGenAI, Type } from "@google/genai";
import { BrandData, SocialPost, Language } from "./types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private getSignature(brand: BrandData): string {
    const parts = [];
    if (brand.address) parts.push(`📍 Adres: ${brand.address}`);
    if (brand.phone) parts.push(`📞 Tel: ${brand.phone}`);
    if (brand.ctaLink) parts.push(`🌐 WWW: ${brand.ctaLink}`);
    return parts.length > 0 ? `\n\n---\n${parts.join('\n')}` : '';
  }

  private getBrandContextPrompt(brand: BrandData, targetLanguage: Language): string {
    const colorString = brand.colors.map(c => `${c.name}: ${c.hex}`).join(', ');
    
    return `
    --- BRAND DNA CORE ---
    TARGET LANGUAGE: ${targetLanguage} (MANDATORY: All output text must be in this language)
    BRAND NAME: ${brand.name}
    INDUSTRY: ${brand.industry}
    VISUAL MOOD: ${brand.voiceProfile}
    COLORS: ${colorString}
    HUMAN TOUCH: ${brand.humanTouch}
    YODA MODE: ${brand.isYodaMode && targetLanguage === 'PL' ? 'ACTIVE (Use inverted Polish syntax)' : 'INACTIVE'}
    ----------------------
    `;
  }

  async generateImage(prompt: string, brand: BrandData): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const brandPrompt = `
      Create a high-quality professional photography for a social media post.
      TOPIC: ${prompt}
      BRAND MOOD: ${brand.voiceProfile}
      COLORS: ${brand.colors.map(c => c.hex).join(', ')}
      NO TEXT OR LETTERS ON IMAGE. Cinematic lighting.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: brandPrompt }] },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    } catch (error) {
      console.error("Image generation failed:", error);
    }
    
    return `https://loremflickr.com/1024/1024/${brand.industry.split(' ')[0] || 'business'},${prompt.split(' ')[0]}?lock=${Math.floor(Math.random() * 1000)}`;
  }

  async scanWebsite(url: string, targetLanguage: Language) {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an AI Recon Drone. Scan: ${url}. 
      Extract brand info. MANDATORY: The "description" and "toneOfVoice" fields MUST be written in ${targetLanguage}.
      Output ONLY a valid JSON object.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            industry: { type: Type.STRING },
            colors: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, hex: { type: Type.STRING } } } },
            toneOfVoice: { type: Type.STRING },
            toneConfidence: { type: Type.NUMBER }
          },
          required: ["name", "description", "industry", "colors", "toneOfVoice", "toneConfidence"]
        }
      }
    });

    try {
      return JSON.parse(response.text || '{}');
    } catch (e) {
      throw new Error("Neural scan failed.");
    }
  }

  async generateSocialPost(topic: string, platform: string, brand: BrandData, targetLanguage: Language) {
    const signature = this.getSignature(brand);
    const context = this.getBrandContextPrompt(brand, targetLanguage);
    
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `${context}
      Generate a ${platform} post about: ${topic}.
      MANDATORY: All output fields ('content', 'hook', 'hashtags') must be in ${targetLanguage}.
      Return JSON with 'content', 'hook', 'imageBrief' (brief in English), 'keyword'.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING },
            hook: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            imageBrief: { type: Type.STRING },
            keyword: { type: Type.STRING }
          },
          required: ["content", "hook", "hashtags", "imageBrief", "keyword"]
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    const imageUrl = await this.generateImage(data.imageBrief, brand);

    return {
      ...data,
      content: data.content + signature,
      imagePreviewUrl: imageUrl
    };
  }

  async generateWeeklyPlan(brand: BrandData, targetLanguage: Language, weekIndex: number = 0): Promise<SocialPost[]> {
    const signature = this.getSignature(brand);
    const context = this.getBrandContextPrompt(brand, targetLanguage);
    
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${context} Generate a 7-day social media plan (Mon-Sun). 
      MANDATORY: Output text (content, hook, topic) MUST be in ${targetLanguage}. 
      JSON array output.`,
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
              imageBrief: { type: Type.STRING },
              keyword: { type: Type.STRING }
            },
            required: ["dayIndex", "platform", "topic", "hook", "content", "hashtags", "imageBrief", "keyword"]
          }
        }
      }
    });

    const data = JSON.parse(response.text || '[]');
    return await Promise.all(data.map(async (item: any) => ({
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      weekIndex,
      content: item.content + signature,
      status: 'draft',
      isApproved: false,
      showHook: true,
      imagePreviewUrl: await this.generateImage(item.imageBrief, brand)
    })));
  }

  async generateSocialPostForDay(brand: BrandData, targetLanguage: Language, dayName: string, dayIndex: number): Promise<SocialPost> {
    const signature = this.getSignature(brand);
    const context = this.getBrandContextPrompt(brand, targetLanguage);
    
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `${context} Generate a new post for ${dayName}. LANGUAGE MUST BE ${targetLanguage}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            platform: { type: Type.STRING },
            topic: { type: Type.STRING },
            hook: { type: Type.STRING },
            content: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            imageBrief: { type: Type.STRING },
            keyword: { type: Type.STRING }
          },
          required: ["platform", "topic", "hook", "content", "hashtags", "imageBrief", "keyword"]
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    const imageUrl = await this.generateImage(data.imageBrief, brand);

    return {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      weekIndex: 0,
      dayIndex,
      content: data.content + signature,
      status: 'draft',
      isApproved: false,
      showHook: true,
      imagePreviewUrl: imageUrl
    };
  }

  async refineContent(post: SocialPost, refinePrompt: string, brand: BrandData, targetLanguage: Language) {
    const signature = this.getSignature(brand);
    const context = this.getBrandContextPrompt(brand, targetLanguage);
    
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `${context} Refine this post: ${refinePrompt}. Current Topic: ${post.topic}. MANDATORY: Output in ${targetLanguage}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING },
            hook: { type: Type.STRING },
            imageBrief: { type: Type.STRING },
            keyword: { type: Type.STRING }
          },
          required: ["content", "hook", "imageBrief", "keyword"]
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    return {
      ...data,
      content: data.content + signature,
      imagePreviewUrl: await this.generateImage(data.imageBrief, brand)
    };
  }
}

export const gemini = new GeminiService();
