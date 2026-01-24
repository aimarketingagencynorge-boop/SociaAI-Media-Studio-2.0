
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
  missionLanguage: Language; // Nowe pole
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
  weekIndex: number; 
  dayIndex: number; 
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok';
  topic: string;
  hook: string; 
  content: string;
  hashtags: string[];
  status: 'draft' | 'scheduled' | 'sent';
  isApproved: boolean;
  imageBrief: string; 
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
