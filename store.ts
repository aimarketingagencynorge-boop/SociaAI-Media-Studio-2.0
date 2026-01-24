
import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { UserState, Language, BrandData, SocialPost, BrandAsset } from './types';

export type AppView = 'dashboard' | 'planner' | 'ai-studio' | 'media-lab' | 'analytics' | 'brand-kit' | 'store' | 'settings';

interface StoreActions {
  setLanguage: (lang: Language) => void;
  setCredits: (amount: number) => void;
  deductCredits: (amount: number) => boolean;
  addCredits: (amount: number) => void;
  setOnboardingStep: (step: number) => void;
  updateBrand: (data: Partial<BrandData>) => void;
  setAuthenticated: (status: boolean) => void;
  setWeeklyPlan: (posts: SocialPost[]) => void;
  addPost: (post: SocialPost) => void;
  removePost: (id: string) => void;
  updatePost: (id: string, updates: Partial<SocialPost>) => void;
  setActiveView: (view: AppView) => void;
  setAutopilotRunning: (status: boolean) => void;
  incrementVideoCount: () => void;
  setHyperspace: (active: boolean) => void;
  toggleSocialLink: (platform: string) => void;
  resetMission: () => void;
  setEditingPost: (post: SocialPost | null) => void;
  addBrandAsset: (asset: BrandAsset) => void;
  removeBrandAsset: (id: string) => void;
  updateBrandAssetTag: (id: string, tag: BrandAsset['tag']) => void;
  activeView: AppView;
  videoCount: number;
  isHyperspaceActive: boolean;
  socialLinks: Record<string, boolean>;
  webhookUrl: string;
  editingPost: SocialPost | null;
}

const INITIAL_BRAND_DATA: BrandData = {
  name: '',
  description: '',
  usp: '',
  industry: '',
  toneOfVoice: 'professional',
  isYodaMode: false,
  missionLanguage: 'PL', // Domyślny inicjalny
  colors: [
    { name: 'Primary Neon', hex: '#8C4DFF' },
    { name: 'Secondary Cyan', hex: '#34E0F7' },
    { name: 'Accent Magenta', hex: '#C74CFF' },
    { name: 'Deep Space', hex: '#0A0A12' },
  ],
  toneConfidence: 0,
  address: '',
  phone: '',
  email: '',
  ctaLink: '',
  logos: {
    main: undefined,
    light: undefined,
    dark: undefined
  },
  assets: [],
  voiceProfile: 'modern',
  humanTouch: '',
  coreMission: '',
  pillars: ['', '', ''],
  dictionary: { keywords: [], forbidden: [] },
  emojiStyle: 50,
  ctaStyle: 'direct',
  missionContext: 'ig'
};

const indexedDBStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("sociai_mediastudio_db", 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("state")) {
          db.createObjectStore("state");
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction("state", "readonly");
        const store = transaction.objectStore("state");
        const getRequest = store.get(name);
        getRequest.onsuccess = () => resolve(getRequest.result || null);
        getRequest.onerror = () => reject(getRequest.error);
      };
      request.onerror = () => reject(request.error);
    });
  },
  setItem: async (name: string, value: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("sociai_mediastudio_db", 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("state")) {
          db.createObjectStore("state");
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction("state", "readwrite");
        const store = transaction.objectStore("state");
        const putRequest = store.put(value, name);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      request.onerror = () => reject(request.error);
    });
  },
  removeItem: async (name: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("sociai_mediastudio_db", 1);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction("state", "readwrite");
        const store = transaction.objectStore("state");
        const deleteRequest = store.delete(name);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      };
      request.onerror = () => reject(request.error);
    });
  },
};

export const useStore = create<UserState & StoreActions & { activeView: AppView }>()(
  persist(
    (set, get) => ({
      credits: 500,
      language: 'PL',
      onboardingStep: 0,
      isAuthenticated: false,
      activeView: 'dashboard',
      videoCount: 0,
      isHyperspaceActive: false,
      isAutopilotRunning: false,
      editingPost: null,
      webhookUrl: 'https://hooks.zapier.com/hooks/catch/21562148/uq3g9os/',
      socialLinks: {
        instagram: true,
        facebook: false,
        tiktok: false,
        linkedin: true,
      },
      brand: INITIAL_BRAND_DATA,
      posts: [],

      setLanguage: (language) => set((state) => ({ 
        language, 
        brand: { ...state.brand, missionLanguage: language } // Sync mission lang with UI lang by default
      })),
      setCredits: (credits) => set({ credits }),
      addCredits: (amount) => set((state) => ({ credits: state.credits + amount })),
      deductCredits: (amount) => {
        const current = get().credits;
        if (current >= amount) {
          set({ credits: current - amount });
          return true;
        }
        return false;
      },
      setOnboardingStep: (onboardingStep) => set({ onboardingStep }),
      updateBrand: (data) => set((state) => ({ brand: { ...state.brand, ...data } })),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setWeeklyPlan: (posts) => set({ posts }),
      addPost: (post) => set((state) => ({ posts: [...state.posts, post] })),
      removePost: (id) => set((state) => ({ posts: state.posts.filter(p => p.id !== id) })),
      updatePost: (id, updates) => set((state) => ({
        posts: state.posts.map(p => p.id === id ? { ...p, ...updates } : p)
      })),
      setActiveView: (activeView) => set({ activeView }),
      setAutopilotRunning: (isAutopilotRunning) => set({ isAutopilotRunning }),
      incrementVideoCount: () => set((state) => ({ videoCount: state.videoCount + 1 })),
      setHyperspace: (isHyperspaceActive) => set({ isHyperspaceActive }),
      setEditingPost: (editingPost) => set({ editingPost }),
      toggleSocialLink: (platform) => set((state) => ({
        socialLinks: { ...state.socialLinks, [platform]: !state.socialLinks[platform] }
      })),
      addBrandAsset: (asset) => set((state) => {
        if (state.brand.assets.length >= 10) return state;
        return { brand: { ...state.brand, assets: [...state.brand.assets, asset] } };
      }),
      removeBrandAsset: (id) => set((state) => ({
        brand: { ...state.brand, assets: state.brand.assets.filter(a => a.id !== id) }
      })),
      updateBrandAssetTag: (id, tag) => set((state) => ({
        brand: { ...state.brand, assets: state.brand.assets.map(a => a.id === id ? { ...a, tag } : a) }
      })),
      resetMission: () => set({
        onboardingStep: 1,
        posts: [],
        editingPost: null,
        brand: { ...INITIAL_BRAND_DATA, missionLanguage: get().language }
      }),
    }),
    {
      name: 'sociai-studio-storage-v2',
      storage: createJSONStorage(() => indexedDBStorage),
      partialize: (state) => ({ 
        credits: state.credits, 
        language: state.language, 
        brand: state.brand, 
        socialLinks: state.socialLinks,
        posts: state.posts
      }),
    }
  )
);
