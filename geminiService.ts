
import { GoogleGenAI, Type } from "@google/genai";
import { BrandData, SocialPost, Language } from "./types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

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
    const parts = [];
    if (brand.address) parts.push(`📍 Adres: ${brand.address}`);
    if (brand.phone) parts.push(`📞 Tel: ${brand.phone}`);
    if (brand.ctaLink) parts.push(`🌐 WWW: ${brand.ctaLink}`);
    return parts.length > 0 ? `\n\n---\n${parts.join('\n')}` : '';
  }

  private getBrandContextPrompt(brand: BrandData, targetLanguage: Language): string {
    const colorString = brand.colors.map(c => `${c.name}: ${c.hex}`).join(', ');
    const langName = this.getLanguageName(targetLanguage);
    
    return `
    --- BRAND DNA CORE ---
    TARGET LANGUAGE: ${langName}
    BRAND NAME: ${brand.name}
    INDUSTRY: ${brand.industry}
    DESCRIPTION: ${brand.description}
    VISUAL MOOD: ${brand.voiceProfile}
    COLORS: ${colorString}
    YODA MODE: ${brand.isYodaMode && targetLanguage === 'PL' ? 'ACTIVE' : 'INACTIVE'}
    ----------------------
    `;
  }

  async generateImage(prompt: string, brand: BrandData): Promise<string> {
    const brandPrompt = `Professional photo for ${brand.name}. Topic: ${prompt}. Style: ${brand.voiceProfile}. No text.`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: brandPrompt }] },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    } catch (e) {
      console.error("Image gen failed", e);
    }
    return `https://loremflickr.com/800/800/${brand.industry.split(' ')[0] || 'brand'}?random=${Math.random()}`;
  }

  /**
   * SCAN WEBSITE LOGIC (Dual Stage)
   * Stage 1: Search for info about the URL using Google Search Grounding.
   * Stage 2: Convert search results into structured JSON.
   */
  async scanWebsite(url: string, targetLanguage: Language) {
    const langName = this.getLanguageName(targetLanguage);
    
    // STAGE 1: Gather info using Search
    const searchResponse = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search for information about this brand and website: ${url}. 
      Find out its name, what they do, their industry, typical colors, and brand mission.
      Describe it in detail in ${langName}.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const gatheredInfo = searchResponse.text;

    // STAGE 2: Map to JSON
    const mappingResponse = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on this brand information: "${gatheredInfo}", create a JSON object for brand settings.
      MANDATORY: "description" and "toneOfVoice" must be in ${langName}.
      The URL is ${url}.`,
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

    try {
      const cleaned = this.cleanJsonResponse(mappingResponse.text || '{}');
      return JSON.parse(cleaned);
    } catch (e) {
      console.error("Parsing failed", e, mappingResponse.text);
      throw new Error("Failed to map brand DNA.");
    }
  }

  async generateSocialPost(topic: string, platform: string, brand: BrandData, targetLanguage: Language) {
    const signature = this.getSignature(brand);
    const context = this.getBrandContextPrompt(brand, targetLanguage);
    
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `${context} Generate a ${platform} post about: ${topic}. JSON output.`,
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
    const langName = this.getLanguageName(targetLanguage);
    
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${context} Create a 7-day social media plan. Text in ${langName}. JSON array.`,
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
    return await Promise.all(data.map(async (item: any) => ({
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      weekIndex,
      status: 'draft',
      isApproved: false,
      showHook: true,
      content: item.content + signature,
      imagePreviewUrl: await this.generateImage(item.imageBrief, brand)
    })));
  }

  async refineContent(post: SocialPost, refinePrompt: string, brand: BrandData, targetLanguage: Language) {
    const context = this.getBrandContextPrompt(brand, targetLanguage);
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `${context} Refine this post: ${refinePrompt}. Current Topic: ${post.topic}. JSON output.`,
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
    return {
      ...data,
      imagePreviewUrl: await this.generateImage(data.imageBrief, brand)
    };
  }
}

export const gemini = new GeminiService();
