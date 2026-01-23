
export type Language = 'PL' | 'EN' | 'NO' | 'RU';

export interface BrandColor {
  name: string;
  hex: string;
}

export interface BrandAsset {
  id: string;
  url: string;
  tag: 'PRODUKT' | 'LUDZIE' | 'WNĘTRZE' | 'MOOD/DETAL';
}

export interface BrandData {
  name: string;
  description: string;
  usp?: string;
  industry: string;
  toneOfVoice: string;
  isYodaMode: boolean;
  colors: BrandColor[];
  toneConfidence: number;
  logos: {
    main?: string;
    light?: string;
    dark?: string;
  };
  assets: BrandAsset[];
  voiceProfile: 'premium' | 'warm' | 'modern' | 'storyteller' | 'corporate';
  humanTouch: string;
  coreMission: string;
  pillars: string[];
  dictionary: {
    keywords: string[];
    forbidden: string[];
  };
  emojiStyle: number; 
  ctaStyle: 'delicate' | 'educational' | 'direct';
  missionContext: 'ig' | 'fb' | 'li' | 'ad';
  address?: string;
  phone?: string;
  email?: string;
  ctaLink?: string;
}

export interface SocialPost {
  id: string;
  weekIndex: number; // For infinite scroll support
  dayIndex: number; // 0 (Mon) to 6 (Sun)
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok';
  topic: string;
  hook: string; // The "Scroll-stopper" short text (UI overlay)
  content: string;
  hashtags: string[];
  status: 'draft' | 'scheduled' | 'sent';
  isApproved: boolean;
  imageBrief: string; // Description for AI Image Generation (no-text brief)
  imagePrompt?: string; 
  imagePreviewUrl?: string; 
  showHook?: boolean;
}

export interface UserState {
  credits: number;
  language: Language;
  onboardingStep: number;
  brand: BrandData;
  isAuthenticated: boolean;
  posts: SocialPost[];
  isAutopilotRunning: boolean;
}
