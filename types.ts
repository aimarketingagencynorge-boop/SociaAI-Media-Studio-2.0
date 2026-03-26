
export type Language = 'PL' | 'EN' | 'NO' | 'RU';

export interface BrandColor {
  name: string;
  hex: string;
}

export type ReferenceTag = 
  | 'INTERIOR'
  | 'PRODUCT'
  | 'FOOD'
  | 'TEAM'
  | 'EVENT'
  | 'MOOD'
  | 'BRANDING'
  | 'LOCATION'
  | 'STYLE'
  | 'VENUE';

export type Platform = 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube';

export interface BrandReferenceImage {
  id: string;
  userId: string;
  workspaceId: string;
  imageUrl: string;
  title?: string;
  note?: string;
  tags: ReferenceTag[];
  priority: 'primary' | 'secondary';
  platforms?: Platform[];
  createdAt: string;
  updatedAt: string;
}

export interface ReferenceSettings {
  useInGeneration: boolean;
  strength: 'low' | 'medium' | 'high';
}

export interface BrandAsset {
  id: string;
  url: string;
  tag: 'PRODUKT' | 'LUDZIE' | 'WNĘTRZE' | 'MOOD/DETAL';
}

export interface SignatureSettings {
  enabled: boolean;
  showBrandName: boolean;
  showAddress: boolean;
  showPhone: boolean;
  showEmail: boolean;
  showCtaLink: boolean;
}

export interface PlatformDNA {
  positioning: string;
  contentFocus: string;
  visualDirection: string;
  goal: string;
}

export interface BrandData {
  name: string;
  description: string;
  usp?: string;
  industry: string;
  toneOfVoice: string;
  isYodaMode: boolean;
  contentLanguage: Language;
  colors: BrandColor[];
  toneConfidence: number;
  logos: {
    main?: string;
    light?: string;
    dark?: string;
  };
  assets: BrandAsset[];
  referenceImages: BrandReferenceImage[];
  referenceSettings: ReferenceSettings;
  voiceProfile: 'premium' | 'warm' | 'modern' | 'storyteller' | 'corporate';
  humanTouch: string;
  customSignature?: string;
  coreMission: string;
  whatWeDo: string;
  howWeDoIt: string;
  brandPerception: string;
  pillars: string[];
  dictionary: {
    keywords: string[];
    forbidden: string[];
  };
  emojiStyle: number; 
  ctaStyle: 'delicate' | 'educational' | 'direct';
  missionContext: 'ig' | 'fb' | 'li' | 'ad';
  platformDNA: Record<Platform, PlatformDNA>;
  address?: string;
  phone?: string;
  email?: string;
  ctaLink?: string;
  signature?: SignatureSettings;
}

export interface SocialPost {
  id: string;
  weekIndex: number; 
  dayIndex: number; 
  platform: Platform;
  topic: string;
  hook: string; 
  content: string;
  hashtags: string[];
  status: 'draft' | 'scheduled' | 'sent';
  isApproved: boolean;
  imageBrief: string; 
  imagePrompt?: string; 
  imagePreviewUrl?: string; 
  videoUrl?: string;
  showHook?: boolean;
  signatureEnabled?: boolean;
  signatureOverride?: Partial<BrandData>;
  language?: Language;
}

export interface MediaAsset {
  id: string;
  type: 'image' | 'video' | 'thumbnail';
  sourceUrl: string;
  editedUrl?: string;
  thumbnailUrl?: string;
  title?: string;
  description?: string;
  tags?: string[];
  createdAt: string;
  status: 'original' | 'edited' | 'final';
}

export type StudioGenerationMode =
  | 'text-to-image'
  | 'image-to-image'
  | 'text-to-video'
  | 'image-to-video';

export interface StudioGeneratedAsset {
  id: string;
  type: 'image' | 'video';
  mode: StudioGenerationMode;
  sourceImageUrl?: string;
  outputUrl: string;
  brandedOutputUrl?: string;
  thumbnailUrl?: string;
  platform: Platform;
  createdAt: string;
}

export interface UserState {
  credits: number;
  language: Language;
  onboardingStep: number;
  brand: BrandData;
  isAuthenticated: boolean;
  posts: SocialPost[];
  mediaAssets: MediaAsset[];
  studioAssets: StudioGeneratedAsset[];
  isAutopilotRunning: boolean;
  integrations: UserIntegration[];
  workspaceId: string;
  userId: string;
}

export type IntegrationType = 'zapier' | 'webhook' | 'custom';

export type OutboundEventType = 
  | 'post_created'
  | 'post_updated'
  | 'post_scheduled'
  | 'post_sent'
  | 'ai_asset_generated'
  | 'asset_added'
  | 'brand_updated'
  | 'draft_completed'
  | 'sent_to_planner'
  | 'export_to_external';

export interface UserIntegration {
  id: string;
  userId: string;
  workspaceId: string;
  name: string;
  type: IntegrationType;
  endpointUrl: string;
  isEnabled: boolean;
  events: OutboundEventType[];
  createdAt: string;
  updatedAt: string;
}

export interface OutboundEventPayload {
  eventType: OutboundEventType;
  userId: string;
  workspaceId: string;
  platform?: string;
  postId?: string;
  assetId?: string;
  brandName?: string;
  content?: string;
  assetUrl?: string;
  thumbnailUrl?: string;
  signature?: any;
  metadata?: Record<string, any>;
  createdAt: string;
  sourceModule: 'planner' | 'media-lab' | 'ai-studio' | 'dashboard' | 'brand-kit' | 'integrations';
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
    process?: {
      env: {
        [key: string]: string | undefined;
      };
    };
    API_KEY?: string;
  }
}
