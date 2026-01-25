
import { GoogleGenAI, Type } from "@google/genai";
import { BrandData, SocialPost, Language } from "./types";

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
    YODA MODE: ${brand.isYodaMode && targetLanguage === 'PL' ? 'ACTIVE (Use inverted Polish grammar)' : 'INACTIVE'}
    ----------------------
    `;
  }

  async generateImage(prompt: string, brand: BrandData): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const brandPrompt = `Professional cinematic photo for ${brand.name}. Topic: ${prompt}. Style: ${brand.voiceProfile}. High resolution, no text.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: brandPrompt }] },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    } catch (e) {
      console.error("Image generation failed", e);
    }
    return `https://loremflickr.com/800/800/${brand.industry.split(' ')[0] || 'business'}?random=${Math.random()}`;
  }

  async scanWebsite(url: string, targetLanguage: Language) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langName = this.getLanguageName(targetLanguage);
    
    // STAGE 1: Grounded Search for brand data
    const searchResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Perform a deep search on this business URL: ${url}. 
      Extract its official name, detailed description of operations, industry, core mission, and branding colors.
      Provide the full intelligence report in ${langName}.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const intelligence = searchResponse.text;
    const sources = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    // STAGE 2: Structured Data Mapping
    const mappingResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Map the following intelligence report into a structured Brand DNA JSON: "${intelligence}".
      URL: ${url}.
      REQUIREMENT: "description" and "toneOfVoice" must be in ${langName}.`,
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
      return {
        data: JSON.parse(cleaned),
        sources: sources
      };
    } catch (e) {
      console.error("JSON Mapping failed", e, mappingResponse.text);
      throw new Error("Could not decode brand DNA.");
    }
  }

  async generateSocialPost(topic: string, platform: string, brand: BrandData, targetLanguage: Language) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const signature = this.getSignature(brand);
    const context = this.getBrandContextPrompt(brand, targetLanguage);
    const langName = this.getLanguageName(targetLanguage);
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `${context} Write a ${platform} post about: ${topic}. Text in ${langName}. JSON format.`,
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const signature = this.getSignature(brand);
    const context = this.getBrandContextPrompt(brand, targetLanguage);
    const langName = this.getLanguageName(targetLanguage);
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${context} Plan a 7-day social media strategy. Language: ${langName}. JSON array.`,
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const context = this.getBrandContextPrompt(brand, targetLanguage);
    const langName = this.getLanguageName(targetLanguage);

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `${context} Refine post: "${refinePrompt}". Topic: ${post.topic}. Language: ${langName}. JSON.`,
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
