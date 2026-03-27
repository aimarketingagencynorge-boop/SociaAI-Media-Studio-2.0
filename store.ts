
import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { UserState, Language, BrandData, SocialPost, BrandAsset, MediaAsset, StudioGeneratedAsset, UserIntegration, OutboundEventPayload, BrandReferenceImage, ReferenceSettings, AIAccessSettings, AISource } from './types';
import { db, auth, OperationType, handleFirestoreError } from './firebase';
import { doc, onSnapshot, setDoc, updateDoc, collection, deleteDoc, deleteField } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

export type AppView = 'dashboard' | 'planner' | 'ai-studio' | 'media-lab' | 'analytics' | 'brand-kit' | 'store' | 'settings' | 'integrations';

interface StoreActions {
  setLanguage: (lang: Language) => void;
  setOnboardingStep: (step: number) => void;
  updateBrand: (data: Partial<BrandData>, skipSync?: boolean) => void;
  setAuthenticated: (status: boolean) => void;
  setFirebaseUser: (user: User | null) => void;
  setAiSettings: (settings: AIAccessSettings | null) => void;
  setIsLoadingAICredits: (loading: boolean) => void;
  setWorkspaceId: (id: string) => void;
  setWeeklyPlan: (posts: SocialPost[], skipSync?: boolean) => void;
  addPost: (post: SocialPost, skipSync?: boolean) => void;
  removePost: (id: string, skipSync?: boolean) => void;
  updatePost: (id: string, updates: Partial<SocialPost>, skipSync?: boolean) => void;
  setActiveView: (view: AppView) => void;
  setAutopilotRunning: (status: boolean) => void;
  incrementVideoCount: () => void;
  setHyperspace: (active: boolean) => void;
  toggleSocialLink: (platform: string) => void;
  setWebhookUrl: (url: string) => void;
  resetMission: () => void;
  setEditingPost: (post: SocialPost | null) => void;
  setUserId: (id: string) => void;
  addBrandAsset: (asset: BrandAsset) => void;
  removeBrandAsset: (id: string) => void;
  updateBrandAssetTag: (id: string, tag: BrandAsset['tag']) => void;
  addReferenceImage: (image: BrandReferenceImage) => void;
  addReferenceImages: (images: BrandReferenceImage[]) => void;
  removeReferenceImage: (id: string) => void;
  updateReferenceImage: (id: string, updates: Partial<BrandReferenceImage>) => void;
  updateReferenceSettings: (settings: Partial<ReferenceSettings>) => void;
  addMediaAsset: (asset: MediaAsset, skipSync?: boolean) => void;
  removeMediaAsset: (id: string, skipSync?: boolean) => void;
  updateMediaAsset: (id: string, updates: Partial<MediaAsset>, skipSync?: boolean) => void;
  addStudioAsset: (asset: StudioGeneratedAsset, skipSync?: boolean) => void;
  removeStudioAsset: (id: string, skipSync?: boolean) => void;
  setMediaAssets: (assets: MediaAsset[]) => void;
  setStudioAssets: (assets: StudioGeneratedAsset[]) => void;
  syncAllPostsWithBrand: (buildFinalContent: (content: string, brand: BrandData) => string) => void;
  addIntegration: (integration: UserIntegration) => void;
  removeIntegration: (id: string) => void;
  updateIntegration: (id: string, updates: Partial<UserIntegration>) => void;
  toggleIntegration: (id: string) => void;
  triggerOutboundEvent: (event: Omit<OutboundEventPayload, 'userId' | 'workspaceId' | 'createdAt'>) => Promise<void>;
  setIsStarted: (status: boolean) => void;
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
  contentLanguage: 'PL',
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
    main: null,
    light: null,
    dark: null
  },
  assets: [],
  referenceImages: [],
  referenceSettings: {
    useInGeneration: true,
    strength: 'medium'
  },
  voiceProfile: 'modern',
  humanTouch: '',
  coreMission: '',
  whatWeDo: '',
  howWeDoIt: '',
  brandPerception: '',
  pillars: ['', '', ''],
  dictionary: { keywords: [], forbidden: [] },
  emojiStyle: 50,
  ctaStyle: 'direct',
  missionContext: 'ig',
  platformDNA: {
    instagram: { positioning: '', contentFocus: '', visualDirection: '', goal: '' },
    facebook: { positioning: '', contentFocus: '', visualDirection: '', goal: '' },
    tiktok: { positioning: '', contentFocus: '', visualDirection: '', goal: '' },
    linkedin: { positioning: '', contentFocus: '', visualDirection: '', goal: '' },
    youtube: { positioning: '', contentFocus: '', visualDirection: '', goal: '' },
    twitter: { positioning: '', contentFocus: '', visualDirection: '', goal: '' }
  },
  signature: {
    enabled: true,
    showBrandName: true,
    showAddress: true,
    showPhone: true,
    showEmail: true,
    showCtaLink: true
  }
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

export const useStore = create<UserState & StoreActions & { activeView: AppView; firebaseUser: User | null }>()(
  persist(
    (set, get) => ({
      credits: 0,
      language: 'PL',
      onboardingStep: 0,
      isAuthenticated: false,
      isStarted: false,
      firebaseUser: null,
      aiSettings: null,
      isLoadingAICredits: false,
      activeView: 'dashboard',
      videoCount: 0,
      isHyperspaceActive: false,
      isAutopilotRunning: false,
      editingPost: null,
      userId: '',
      workspaceId: '',
      integrations: [],
      webhookUrl: 'https://hooks.zapier.com/hooks/catch/21562148/uq3g9os/',
      socialLinks: {
        instagram: true,
        facebook: false,
        tiktok: false,
        linkedin: true,
      },
      brand: INITIAL_BRAND_DATA,
      posts: [],
      mediaAssets: [],
      studioAssets: [],

      setLanguage: (language) => set({ language }),
      setIsStarted: (isStarted) => set({ isStarted }),
      setOnboardingStep: (onboardingStep) => {
        set({ onboardingStep });
        // Sync with Firebase if authenticated
        const state = get();
        if (state.firebaseUser) {
          const userDocRef = doc(db, 'users', state.firebaseUser.uid);
          setDoc(userDocRef, { onboardingStep, updatedAt: new Date().toISOString() }, { merge: true }).catch((e: any) => handleFirestoreError(e, OperationType.UPDATE, `users/${state.firebaseUser?.uid}`));
        }
      },
      updateBrand: (data, skipSync = false) => {
        // Remove undefined values from data to prevent them from overwriting existing values with undefined
        const cleanData = JSON.parse(JSON.stringify(data, (key, value) => {
          if (value === undefined) return null;
          return value;
        }));

        set((state) => ({ 
          brand: { ...(state.brand || INITIAL_BRAND_DATA), ...cleanData } 
        }));
        
        if (skipSync) return;

        // Sync with Firebase if authenticated
        const state = get();
        if (state.firebaseUser) {
          const brandDocRef = doc(db, 'users', state.firebaseUser.uid, 'brands', 'default');
          
          // Ensure we don't send undefined to Firestore (redundant but safe)
          const brandToSync = JSON.parse(JSON.stringify(get().brand, (key, value) => {
            if (value === undefined) return null;
            return value;
          }));

          // Exclude large arrays from the main brand document to avoid 1MB limit
          const { referenceImages, assets, ...brandMetadata } = brandToSync;

          // We sync the brand metadata to its own document
          setDoc(brandDocRef, { ...brandMetadata, updatedAt: new Date().toISOString() }, { merge: true }).catch((e: any) => handleFirestoreError(e, OperationType.UPDATE, `users/${state.firebaseUser?.uid}/brands/default`));
          
          // Sync reference images separately
          if (referenceImages && Array.isArray(referenceImages)) {
            referenceImages.forEach((img: any) => {
              const imgDocRef = doc(db, 'users', state.firebaseUser!.uid, 'brands', 'default', 'referenceImages', img.id);
              setDoc(imgDocRef, img, { merge: true }).catch((e: any) => handleFirestoreError(e, OperationType.UPDATE, `users/${state.firebaseUser?.uid}/brands/default/referenceImages/${img.id}`));
            });
          }

          // Sync assets separately
          if (assets && Array.isArray(assets)) {
            assets.forEach((asset: any) => {
              const assetDocRef = doc(db, 'users', state.firebaseUser!.uid, 'brands', 'default', 'assets', asset.id);
              setDoc(assetDocRef, asset, { merge: true }).catch((e: any) => handleFirestoreError(e, OperationType.UPDATE, `users/${state.firebaseUser?.uid}/brands/default/assets/${asset.id}`));
            });
          }

          // Also sync basic info to user doc for quick access
          const userDocRef = doc(db, 'users', state.firebaseUser.uid);
          
          // We use updateDoc to explicitly delete the old large fields while updating metadata
          updateDoc(userDocRef, { 
            brandName: brandToSync.name || '',
            industry: brandToSync.industry || '',
            updatedAt: new Date().toISOString(),
            brand: deleteField(), // Remove legacy large brand object
            posts: deleteField(), // Remove legacy large posts array
            mediaAssets: deleteField(), // Remove legacy large mediaAssets array
            studioAssets: deleteField() // Remove legacy large studioAssets array
          }).catch((e: any) => {
            // If updateDoc fails (e.g. document doesn't exist yet or fields already deleted), 
            // fallback to setDoc with merge for basic metadata
            setDoc(userDocRef, { 
              brandName: brandToSync.name || '',
              industry: brandToSync.industry || '',
              updatedAt: new Date().toISOString()
            }, { merge: true }).catch((err: any) => handleFirestoreError(err, OperationType.UPDATE, `users/${state.firebaseUser?.uid}`));
          });
        }
      },
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
      setAiSettings: (aiSettings) => set({ aiSettings, credits: aiSettings?.creditBalance || 0 }),
      setIsLoadingAICredits: (isLoadingAICredits) => set({ isLoadingAICredits }),
      setWorkspaceId: (workspaceId) => set({ workspaceId }),
      setWeeklyPlan: (posts, skipSync = false) => {
        set({ posts });
        if (skipSync) return;
        // Sync posts with Firebase
        const state = get();
        if (state.firebaseUser) {
          posts.forEach(post => {
            const postDocRef = doc(db, 'users', state.firebaseUser!.uid, 'posts', post.id);
            setDoc(postDocRef, post, { merge: true }).catch((e: any) => handleFirestoreError(e, OperationType.UPDATE, `users/${state.firebaseUser?.uid}/posts/${post.id}`));
          });
        }
      },
      addPost: (post, skipSync = false) => {
        set((state) => ({ posts: [...state.posts, post] }));
        if (skipSync) return;
        const state = get();
        if (state.firebaseUser) {
          const postDocRef = doc(db, 'users', state.firebaseUser.uid, 'posts', post.id);
          setDoc(postDocRef, post).catch((e: any) => handleFirestoreError(e, OperationType.CREATE, `users/${state.firebaseUser?.uid}/posts/${post.id}`));
        }
      },
      removePost: (id, skipSync = false) => {
        set((state) => ({ posts: state.posts.filter(p => p.id !== id) }));
        if (skipSync) return;
        const state = get();
        if (state.firebaseUser) {
          const postDocRef = doc(db, 'users', state.firebaseUser.uid, 'posts', id);
          deleteDoc(postDocRef).catch((e: any) => handleFirestoreError(e, OperationType.DELETE, `users/${state.firebaseUser?.uid}/posts/${id}`));
        }
      },
      updatePost: (id, updates, skipSync = false) => {
        set((state) => ({
          posts: state.posts.map(p => p.id === id ? { ...p, ...updates } : p)
        }));
        if (skipSync) return;
        const state = get();
        if (state.firebaseUser) {
          const postDocRef = doc(db, 'users', state.firebaseUser.uid, 'posts', id);
          setDoc(postDocRef, updates, { merge: true }).catch((e: any) => handleFirestoreError(e, OperationType.UPDATE, `users/${state.firebaseUser?.uid}/posts/${id}`));
        }
      },
      setActiveView: (activeView) => set({ activeView }),
      setAutopilotRunning: (isAutopilotRunning) => set({ isAutopilotRunning }),
      incrementVideoCount: () => set((state) => ({ videoCount: state.videoCount + 1 })),
      setHyperspace: (isHyperspaceActive) => set({ isHyperspaceActive }),
      setEditingPost: (editingPost) => set({ editingPost }),
      setUserId: (userId) => set({ userId }),
      toggleSocialLink: (platform) => set((state) => ({
        socialLinks: { ...state.socialLinks, [platform]: !state.socialLinks[platform] }
      })),
      setWebhookUrl: (webhookUrl) => set({ webhookUrl }),
      addBrandAsset: (asset) => set((state) => {
        const brand = state.brand || INITIAL_BRAND_DATA;
        if (brand.assets.length >= 10) return state;
        return { brand: { ...brand, assets: [...brand.assets, asset] } };
      }),
      removeBrandAsset: (id) => set((state) => {
        const brand = state.brand || INITIAL_BRAND_DATA;
        return {
          brand: { ...brand, assets: brand.assets.filter(a => a.id !== id) }
        };
      }),
      updateBrandAssetTag: (id, tag) => set((state) => {
        const brand = state.brand || INITIAL_BRAND_DATA;
        return {
          brand: { ...brand, assets: brand.assets.map(a => a.id === id ? { ...a, tag } : a) }
        };
      }),
      addReferenceImage: (image) => set((state) => {
        const brand = state.brand || INITIAL_BRAND_DATA;
        const currentImages = brand.referenceImages || [];
        if (currentImages.length >= 20) return state;
        return {
          brand: { ...brand, referenceImages: [image, ...currentImages] }
        };
      }),
      addReferenceImages: (images) => set((state) => {
        const brand = state.brand || INITIAL_BRAND_DATA;
        const currentImages = brand.referenceImages || [];
        const currentCount = currentImages.length;
        const availableSlots = 20 - currentCount;
        if (availableSlots <= 0) return state;
        
        const newImages = images.slice(0, availableSlots);
        return {
          brand: { ...brand, referenceImages: [...newImages, ...currentImages] }
        };
      }),
      removeReferenceImage: (id) => set((state) => {
        const brand = state.brand || INITIAL_BRAND_DATA;
        return {
          brand: { ...brand, referenceImages: (brand.referenceImages || []).filter(img => img.id !== id) }
        };
      }),
      updateReferenceImage: (id, updates) => set((state) => {
        const brand = state.brand || INITIAL_BRAND_DATA;
        return {
          brand: { 
            ...brand, 
            referenceImages: (brand.referenceImages || []).map(img => img.id === id ? { ...img, ...updates, updatedAt: new Date().toISOString() } : img) 
          }
        };
      }),
      updateReferenceSettings: (settings) => set((state) => {
        const brand = state.brand || INITIAL_BRAND_DATA;
        return {
          brand: { ...brand, referenceSettings: { ...(brand.referenceSettings || { useInGeneration: true, strength: 'medium' }), ...settings } }
        };
      }),
      addMediaAsset: (asset, skipSync = false) => {
        set((state) => ({
          mediaAssets: [asset, ...state.mediaAssets]
        }));
        if (skipSync) return;
        const state = get();
        if (state.firebaseUser) {
          const assetDocRef = doc(db, 'users', state.firebaseUser.uid, 'mediaAssets', asset.id);
          setDoc(assetDocRef, asset, { merge: true }).catch((e: any) => handleFirestoreError(e, OperationType.UPDATE, `users/${state.firebaseUser?.uid}/mediaAssets/${asset.id}`));
        }
      },
      removeMediaAsset: (id, skipSync = false) => {
        set((state) => ({
          mediaAssets: state.mediaAssets.filter(a => a.id !== id)
        }));
        if (skipSync) return;
        const state = get();
        if (state.firebaseUser) {
          const assetDocRef = doc(db, 'users', state.firebaseUser.uid, 'mediaAssets', id);
          deleteDoc(assetDocRef).catch((e: any) => handleFirestoreError(e, OperationType.DELETE, `users/${state.firebaseUser?.uid}/mediaAssets/${id}`));
        }
      },
      updateMediaAsset: (id, updates, skipSync = false) => {
        set((state) => ({
          mediaAssets: state.mediaAssets.map(a => a.id === id ? { ...a, ...updates } : a)
        }));
        if (skipSync) return;
        const state = get();
        if (state.firebaseUser) {
          const assetDocRef = doc(db, 'users', state.firebaseUser.uid, 'mediaAssets', id);
          setDoc(assetDocRef, updates, { merge: true }).catch((e: any) => handleFirestoreError(e, OperationType.UPDATE, `users/${state.firebaseUser?.uid}/mediaAssets/${id}`));
        }
      },
      addStudioAsset: (asset, skipSync = false) => {
        set((state) => ({
          studioAssets: [asset, ...state.studioAssets]
        }));
        if (skipSync) return;
        const state = get();
        if (state.firebaseUser) {
          const assetDocRef = doc(db, 'users', state.firebaseUser.uid, 'studioAssets', asset.id);
          setDoc(assetDocRef, asset, { merge: true }).catch((e: any) => handleFirestoreError(e, OperationType.UPDATE, `users/${state.firebaseUser?.uid}/studioAssets/${asset.id}`));
        }
      },
      removeStudioAsset: (id, skipSync = false) => {
        set((state) => ({
          studioAssets: state.studioAssets.filter(a => a.id !== id)
        }));
        if (skipSync) return;
        const state = get();
        if (state.firebaseUser) {
          const assetDocRef = doc(db, 'users', state.firebaseUser.uid, 'studioAssets', id);
          deleteDoc(assetDocRef).catch((e: any) => handleFirestoreError(e, OperationType.DELETE, `users/${state.firebaseUser?.uid}/studioAssets/${id}`));
        }
      },
      setMediaAssets: (mediaAssets: MediaAsset[]) => set({ mediaAssets }),
      setStudioAssets: (studioAssets: StudioGeneratedAsset[]) => set({ studioAssets }),
      syncAllPostsWithBrand: (buildFinalContent) => set((state) => ({
        posts: state.posts.map(post => {
          if (post.signatureEnabled) {
            return { ...post, content: buildFinalContent(post.content, state.brand) };
          }
          return post;
        })
      })),
      addIntegration: (integration) => set((state) => ({ 
        integrations: [...state.integrations, integration] 
      })),
      removeIntegration: (id) => set((state) => ({ 
        integrations: state.integrations.filter(i => i.id !== id) 
      })),
      updateIntegration: (id, updates) => set((state) => ({
        integrations: state.integrations.map(i => i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i)
      })),
      toggleIntegration: (id) => set((state) => ({
        integrations: state.integrations.map(i => i.id === id ? { ...i, isEnabled: !i.isEnabled, updatedAt: new Date().toISOString() } : i)
      })),
      triggerOutboundEvent: async (eventData) => {
        const state = get();
        const payload: OutboundEventPayload = {
          ...eventData,
          userId: state.userId,
          workspaceId: state.workspaceId,
          createdAt: new Date().toISOString(),
          brandName: state.brand.name
        };

        // Find enabled integrations that listen to this event
        const activeIntegrations = state.integrations.filter(i => 
          i.isEnabled && i.events.includes(payload.eventType)
        );

        if (activeIntegrations.length === 0) return;

        // Send to each integration
        const promises = activeIntegrations.map(async (integration) => {
          try {
            const response = await fetch(integration.endpointUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            if (!response.ok) {
              console.error(`Failed to send webhook to ${integration.name}: ${response.statusText}`);
            }
          } catch (error) {
            console.error(`Error sending webhook to ${integration.name}:`, error);
          }
        });

        await Promise.allSettled(promises);
      },
      resetMission: () => set({
        onboardingStep: 1,
        posts: [],
        editingPost: null,
        brand: INITIAL_BRAND_DATA
      }),
    }),
    {
      name: 'sociai-studio-storage-v2',
      storage: createJSONStorage(() => indexedDBStorage),
      onRehydrateStorage: () => (state) => {
        if (state && !state.brand) {
          state.brand = INITIAL_BRAND_DATA;
        } else if (state && state.brand) {
          // Ensure referenceImages exists
          if (!state.brand.referenceImages) {
            state.brand.referenceImages = [];
          }
          if (!state.brand.referenceSettings) {
            state.brand.referenceSettings = { useInGeneration: true, strength: 'medium' };
          }
        }
      },
      partialize: (state) => ({ 
        credits: state.credits, 
        language: state.language, 
        brand: state.brand, 
        socialLinks: state.socialLinks,
        posts: state.posts,
        mediaAssets: state.mediaAssets,
        studioAssets: state.studioAssets,
        integrations: state.integrations,
        webhookUrl: state.webhookUrl,
        userId: state.userId,
        workspaceId: state.workspaceId
      }),
    }
  )
);
