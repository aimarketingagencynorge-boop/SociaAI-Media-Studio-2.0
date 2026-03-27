import { BrandData, SocialPost, Language, PlatformDNA, Platform, CreditActionType } from "./types";
import { useStore } from "./store";
import { callAI } from "./aiGatekeeper";

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

  private async callGatekeeper(actionType: CreditActionType, prompt: string, model: string = 'gemini-3-flash-preview', config?: any): Promise<string> {
    const state = useStore.getState();
    const userId = state.userId;
    const workspaceId = state.workspaceId;
    if (!userId) throw new Error("User not authenticated");
    
    return await callAI(actionType, { prompt, model, config }, userId, workspaceId);
  }

  public buildCampaignContext(post: Partial<SocialPost>, brand: BrandData): CampaignContext {
    if (!brand) {
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

    try {
      return await this.callGatekeeper('ai_enhance', promptText);
    } catch (e: any) {
      console.error("Image prompt generation failed", e);
      return `Professional cinematic photo for ${context.brand.name} about ${context.topic}`;
    }
  }

  async generateImage(prompt: string, brand: BrandData, context?: CampaignContext): Promise<string> {
    try {
      if (!brand && !context?.brand) {
        return `https://loremflickr.com/800/800/business?random=${Math.random()}`;
      }
      
      let finalPrompt = prompt;
      if (context) {
        if (prompt.length < 50) {
          finalPrompt = await this.generateImagePromptFromPost(context);
        }
      } else {
        finalPrompt = `Professional cinematic photo for ${brand.name}. Topic: ${prompt}. Style: ${brand.voiceProfile}. High resolution, no text.`;
      }

      const state = useStore.getState();
      const userId = state.userId;
      const workspaceId = state.workspaceId;
      const result = await callAI('generate_image', { 
        prompt: finalPrompt, 
        model: 'gemini-2.5-flash-image' 
      }, userId, workspaceId);

      return result;
    } catch (e: any) {
      console.error("Image generation failed", e);
    }
    return `https://loremflickr.com/800/800/${brand.industry.split(' ')[0] || 'business'}?random=${Math.random()}`;
  }

  async scanWebsite(url: string, targetLanguage: Language) {
    const langName = this.getLanguageName(targetLanguage);
    
    let intelligence = "";
    try {
      const prompt = `Audit this business website: ${url.trim()}. 
        Extract: official name, detailed description of services/products, industry, core mission, and brand colors.
        Report must be in ${langName}.`;
      
      intelligence = await this.callGatekeeper('scan_brand', prompt, 'gemini-3-flash-preview', {
        tools: [{ googleSearch: {} }]
      });
    } catch (searchError: any) {
      console.warn("Search grounding failed, falling back to direct analysis", searchError);
      const fallbackPrompt = `Analyze this business URL: ${url.trim()}. 
        Based on the URL name and common knowledge, describe the business, industry, and mission.
        Report must be in ${langName}.`;
      intelligence = await this.callGatekeeper('scan_brand', fallbackPrompt);
    }

    try {
      const dnaPrompt = `Based on this intelligence: "${intelligence}", create a structured Brand DNA JSON.
        URL: ${url}.
        Language: ${langName}.`;

      const responseText = await this.callGatekeeper('ai_enhance', dnaPrompt, 'gemini-3-flash-preview', {
        responseMimeType: "application/json"
      });

      const cleaned = this.cleanJsonResponse(responseText || '{}');
      return {
        data: JSON.parse(cleaned),
        sources: []
      };
    } catch (e: any) {
      console.error("DNA Mapping Error", e);
      throw new Error("Neural link failed to decode brand DNA. Try again.");
    }
  }

  async refineBrandDNA(brand: BrandData, prompt: string, targetLanguage: Language) {
    const langName = this.getLanguageName(targetLanguage);
    const context = this.getBrandContextPrompt(brand, targetLanguage);

    try {
      const refinePrompt = `${context} Refine the following Brand DNA based on this request: "${prompt}". 
        Current Brand Data: ${JSON.stringify(brand)}.
        Language: ${langName}.
        Return a complete updated Brand DNA JSON object.`;

      const responseText = await this.callGatekeeper('ai_enhance', refinePrompt, 'gemini-3-flash-preview', {
        responseMimeType: "application/json"
      });

      const cleaned = this.cleanJsonResponse(responseText || '{}');
      return JSON.parse(cleaned);
    } catch (e: any) {
      console.error("Brand DNA Refinement Error", e);
      throw new Error("Failed to refine brand DNA.");
    }
  }

  async generateSocialPost(topic: string, platform: Platform, brand: BrandData, targetLanguage: Language) {
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
      const prompt = `${contextPrompt} ${platformContext} Write a high-engagement ${platform} post about: ${topic}. 
        Language: ${langName}. 
        Ensure the content matches the platform's focus and goal.
        Return JSON format.`;

      const responseText = await this.callGatekeeper('generate_post', prompt, 'gemini-3-flash-preview', {
        responseMimeType: "application/json"
      });

      const data = JSON.parse(this.cleanJsonResponse(responseText || '{}'));
      const campaignContext = this.buildCampaignContext({ ...data, platform }, brand);
      const imageUrl = await this.generateImage(data.imageBrief, brand, campaignContext);
      return {
        ...data,
        content: this.buildFinalContent(data.content, brand),
        imagePreviewUrl: imageUrl
      };
    } catch (e: any) {
      console.error("Social post generation failed", e);
      throw e;
    }
  }

  async enhanceImage(base64Image: string, prompt: string, brand: BrandData): Promise<string> {
    try {
      const brandPrompt = `Enhance this image for ${brand.name}. Command: ${prompt}. Style: ${brand.voiceProfile}. High quality marketing visual. Return the enhanced image.`;
      
      const state = useStore.getState();
      const userId = state.userId;
      const workspaceId = state.workspaceId;
      const result = await callAI('generate_image', {
        prompt: brandPrompt,
        model: 'gemini-2.5-flash-image',
        image: base64Image
      }, userId, workspaceId);

      return result;
    } catch (e: any) {
      console.error("Image enhancement failed", e);
    }
    return base64Image;
  }

  async generateThumbnail(videoDescription: string, brand: BrandData, targetLanguage: Language): Promise<{ url: string; hook: string }> {
    const langName = this.getLanguageName(targetLanguage);
    const contextPrompt = this.getBrandContextPrompt(brand, targetLanguage);
    const platformContext = this.getPlatformContextPrompt('youtube', brand);
    
    try {
      const prompt = `${contextPrompt} ${platformContext} Create a high-impact thumbnail brief for a video described as: "${videoDescription}". Language: ${langName}. JSON format with 'imageBrief' and 'hookText'.`;
      
      const responseText = await this.callGatekeeper('ai_enhance', prompt, 'gemini-3-flash-preview', {
        responseMimeType: "application/json"
      });

      const data = JSON.parse(this.cleanJsonResponse(responseText || '{}'));
      const campaignContext = this.buildCampaignContext({ topic: videoDescription, hook: data.hookText, platform: 'youtube' }, brand);
      const url = await this.generateImage(data.imageBrief, brand, campaignContext);
      return { url, hook: data.hookText };
    } catch (e: any) {
      console.error("Thumbnail generation failed", e);
      throw e;
    }
  }

  async draftPostFromMedia(mediaType: 'image' | 'video', mediaDescription: string, platform: Platform, brand: BrandData, targetLanguage: Language) {
    const contextPrompt = this.getBrandContextPrompt(brand, targetLanguage);
    const platformContext = this.getPlatformContextPrompt(platform, brand);
    const langName = this.getLanguageName(targetLanguage);

    try {
      const prompt = `${contextPrompt} ${platformContext} Write a high-engagement ${platform} post for this ${mediaType}: "${mediaDescription}". Language: ${langName}. JSON format.`;
      
      const responseText = await this.callGatekeeper('ai_enhance', prompt, 'gemini-3-flash-preview', {
        responseMimeType: "application/json"
      });

      const data = JSON.parse(this.cleanJsonResponse(responseText || '{}'));
      return {
        ...data,
        content: this.buildFinalContent(data.content, brand)
      };
    } catch (e: any) {
      console.error("Post from media generation failed", e);
      throw e;
    }
  }

  async generateWeeklyPlan(brand: BrandData, targetLanguage: Language, weekIndex: number = 0): Promise<SocialPost[]> {
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
      const prompt = `${contextPrompt} 
        --- PLATFORM STRATEGIES ---
        ${allPlatformsContext}
        ---------------------------
        Create a 7-day social media plan with a mix of platforms (facebook, instagram, linkedin, tiktok). 
        Language: ${langName}. 
        Ensure each post follows the specific platform strategy.
        Return as a JSON array.`;

      const responseText = await this.callGatekeeper('generate_post', prompt, 'gemini-3-flash-preview', {
        responseMimeType: "application/json"
      });

      const data = JSON.parse(this.cleanJsonResponse(responseText || '[]'));
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
      throw e;
    }
  }

  async refineText(post: SocialPost, refinePrompt: string, brand: BrandData, targetLanguage: Language) {
    const contextPrompt = this.getBrandContextPrompt(brand, targetLanguage);
    const platformContext = this.getPlatformContextPrompt(post.platform, brand);
    const langName = this.getLanguageName(targetLanguage);

    try {
      const prompt = `${contextPrompt} ${platformContext} Refine post CAPTION/CONTENT ONLY. DO NOT change the image hook or the image itself. 
        Command: "${refinePrompt}". 
        Original Topic: ${post.topic}. 
        Language: ${langName}. 
        Return JSON with 'content' field only.`;

      const responseText = await this.callGatekeeper('ai_enhance', prompt, 'gemini-3-flash-preview', {
        responseMimeType: "application/json"
      });

      const data = JSON.parse(this.cleanJsonResponse(responseText || '{}'));
      return {
        content: this.buildFinalContent(data.content, brand)
      };
    } catch (e: any) {
      console.error("Text refinement failed", e);
      throw e;
    }
  }

  async refineImage(post: SocialPost, refinePrompt: string, brand: BrandData) {
    const contextPrompt = this.getBrandContextPrompt(brand, brand.contentLanguage);
    const platformContext = this.getPlatformContextPrompt(post.platform, brand);

    try {
      const prompt = `${contextPrompt} ${platformContext} Refine post IMAGE BRIEF ONLY: "${refinePrompt}". Original: ${post.topic}. JSON.`;
      
      const responseText = await this.callGatekeeper('ai_enhance', prompt, 'gemini-3-flash-preview', {
        responseMimeType: "application/json"
      });

      const data = JSON.parse(this.cleanJsonResponse(responseText || '{}'));
      const campaignContext = this.buildCampaignContext(post, brand);
      const imageUrl = await this.generateImage(data.imageBrief, brand, campaignContext);
      return {
        imageBrief: data.imageBrief,
        imagePreviewUrl: imageUrl
      };
    } catch (e: any) {
      console.error("Image refinement failed", e);
      throw e;
    }
  }

  async refineContent(post: SocialPost, refinePrompt: string, brand: BrandData, targetLanguage: Language) {
    const contextPrompt = this.getBrandContextPrompt(brand, targetLanguage);
    const platformContext = this.getPlatformContextPrompt(post.platform, brand);
    const langName = this.getLanguageName(targetLanguage);

    const prompt = `${contextPrompt} ${platformContext} Refine post: "${refinePrompt}". Original: ${post.topic}. Language: ${langName}. JSON.`;
    
    const responseText = await this.callGatekeeper('ai_enhance', prompt, 'gemini-3-flash-preview', {
      responseMimeType: "application/json"
    });

    const data = JSON.parse(this.cleanJsonResponse(responseText || '{}'));
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
      let finalPrompt = prompt;
      
      if (useBrandDNA) {
        const context = this.buildCampaignContext({ platform, topic: prompt }, brand);
        finalPrompt = await this.generateImagePromptFromPost(context);
      }

      const state = useStore.getState();
      const userId = state.userId;
      const workspaceId = state.workspaceId;
      const result = await callAI('generate_image', {
        prompt: finalPrompt,
        model: 'gemini-2.5-flash-image',
        image: mode === 'image-to-image' ? sourceImageUrl : undefined,
        config: {
          imageConfig: {
            aspectRatio: platform === 'instagram' ? "1:1" : platform === 'tiktok' ? "9:16" : "16:9",
          }
        }
      }, userId, workspaceId);

      return result;
    } catch (e: any) {
      console.error("Studio image generation failed", e);
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
      let finalPrompt = prompt;
      
      if (useBrandDNA) {
        const context = this.buildCampaignContext({ platform, topic: prompt }, brand);
        finalPrompt = await this.generateImagePromptFromPost(context);
      }

      const state = useStore.getState();
      const userId = state.userId;
      const workspaceId = state.workspaceId;
      const result = await callAI('generate_video', {
        prompt: finalPrompt,
        model: 'veo-3.1-fast-generate-preview',
        image: mode === 'image-to-video' ? sourceImageUrl : undefined,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: platform === 'tiktok' || platform === 'instagram' ? '9:16' : '16:9'
        }
      }, userId, workspaceId);

      return result;
    } catch (e: any) {
      console.error("Studio video generation failed", e);
    }
    return "https://assets.mixkit.co/videos/preview/mixkit-abstract-technology-background-with-blue-lines-41344-large.mp4";
  }
}

export const gemini = new GeminiService();
