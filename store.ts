
import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { UserState, Language, BrandData, SocialPost, BrandAsset, MediaAsset, StudioGeneratedAsset, UserIntegration, OutboundEventPayload, BrandReferenceImage, ReferenceSettings, AIAccessSettings, AISource } from './types';
import { db, auth, OperationType, handleFirestoreError } from './firebase';
import { doc, onSnapshot, setDoc, updateDoc, collection, deleteDoc, deleteField, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

// Debounce timers for Firestore sync
let brandSyncTimeout: any = null;
let postsSyncTimeout: any = null;
let mediaAssetsSyncTimeout: any = null;
let studioAssetsSyncTimeout: any = null;
let referenceImagesSyncTimeout: any = null;
let assetsSyncTimeout: any = null;

export type AppView = 'dashboard' | 'planner' | 'ai-studio' | 'media-lab' | 'analytics' | 'brand-kit' | 'store' | 'settings' | 'integrations';

interface StoreActions {
  setLanguage: (lang: Language, skipSync?: boolean) => void;
  setOnboardingStep: (step: number, skipSync?: boolean) => void;
  updateBrand: (data: Partial<BrandData>, skipSync?: boolean) => void;
  setAuthenticated: (status: boolean) => void;
  setFirebaseUser: (user: User | null) => void;
  setAiSettings: (settings: AIAccessSettings | null) => void;
  setCredits: (credits: number) => void;
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

const compressBase64Image = (base64Str: string, maxWidth = 640, maxHeight = 640, quality = 0.75): Promise<string> => {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith('data:image/')) {
      resolve(base64Str);
      return;
    }
    
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(base64Str);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = base64Str;
    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(base64Str);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        
        if (compressedBase64.length < base64Str.length) {
          resolve(compressedBase64);
        } else {
          resolve(base64Str);
        }
      } catch (err) {
        console.error("Failed to compress base64 image", err);
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

const sanitizeForFirestore = (data: any): any => {
  if (data === undefined) return null;
  if (data === null) return null;
  if (Array.isArray(data)) {
    return data.map(sanitizeForFirestore);
  }
  if (typeof data === 'object') {
    if (data instanceof Date) return data.toISOString();
    const clean: any = {};
    for (const key of Object.keys(data)) {
      const val = data[key];
      if (val !== undefined) {
        clean[key] = sanitizeForFirestore(val);
      }
    }
    return clean;
  }
  return data;
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
      webhookUrl: '',
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

      setLanguage: (language, skipSync = false) => {
        set({ language });
        if (skipSync) return;
        const state = get();
        if (state.firebaseUser) {
          const userDocRef = doc(db, 'users', state.firebaseUser.uid);
          setDoc(userDocRef, { language, updatedAt: new Date().toISOString() }, { merge: true }).catch((e: any) => handleFirestoreError(e, OperationType.UPDATE, `users/${state.firebaseUser?.uid}`));
        }
      },
      setIsStarted: (isStarted) => set({ isStarted }),
      setOnboardingStep: (onboardingStep, skipSync = false) => {
        set({ onboardingStep });
        if (skipSync) return;
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
          // Debounce the main brand metadata sync
          if (brandSyncTimeout) clearTimeout(brandSyncTimeout);
          
          brandSyncTimeout = setTimeout(() => {
            const currentState = get();
            if (!currentState.firebaseUser) return;

            const brandDocRef = doc(db, 'users', currentState.firebaseUser.uid, 'brands', 'default');
            
            // Ensure we don't send undefined to Firestore
            const brandToSync = JSON.parse(JSON.stringify(currentState.brand, (key, value) => {
              if (value === undefined) return null;
              return value;
            }));

            // Exclude large arrays from the main brand document to avoid 1MB limit
            const { referenceImages, assets, ...brandMetadata } = brandToSync;

            // We sync the brand metadata to its own document
            setDoc(brandDocRef, { ...brandMetadata, updatedAt: new Date().toISOString() }, { merge: true })
              .catch((e: any) => handleFirestoreError(e, OperationType.UPDATE, `users/${currentState.firebaseUser?.uid}/brands/default`));
            
            // Also sync basic info to user doc for quick access
            const userDocRef = doc(db, 'users', currentState.firebaseUser.uid);
            updateDoc(userDocRef, { 
              brandName: brandToSync.name || '',
              industry: brandToSync.industry || '',
              updatedAt: new Date().toISOString()
            }).catch((e: any) => {
              // If doc doesn't exist, set it
              setDoc(userDocRef, { 
                brandName: brandToSync.name || '',
                industry: brandToSync.industry || '',
                updatedAt: new Date().toISOString()
              }, { merge: true }).catch((err: any) => handleFirestoreError(err, OperationType.UPDATE, `users/${currentState.firebaseUser?.uid}`));
            });
          }, 5000); // 5 second debounce for brand metadata

          // If referenceImages or assets were explicitly provided in 'data', sync them with debounce
          if (data.referenceImages && Array.isArray(data.referenceImages)) {
            if (referenceImagesSyncTimeout) clearTimeout(referenceImagesSyncTimeout);
            referenceImagesSyncTimeout = setTimeout(() => {
              const currentState = get();
              if (!currentState.firebaseUser) return;
              
              const batch = writeBatch(db);
              currentState.brand.referenceImages.forEach((img: any) => {
                const imgDocRef = doc(db, 'users', currentState.firebaseUser!.uid, 'brands', 'default', 'referenceImages', img.id);
                batch.set(imgDocRef, sanitizeForFirestore(img), { merge: true });
              });
              batch.commit().catch((e: any) => handleFirestoreError(e, OperationType.UPDATE, `users/${currentState.firebaseUser?.uid}/brands/default/referenceImages (batch)`));
            }, 5000);
          }

          if (data.assets && Array.isArray(data.assets)) {
            if (assetsSyncTimeout) clearTimeout(assetsSyncTimeout);
            assetsSyncTimeout = setTimeout(() => {
              const currentState = get();
              if (!currentState.firebaseUser) return;

              const batch = writeBatch(db);
              currentState.brand.assets.forEach((asset: any) => {
                const assetDocRef = doc(db, 'users', currentState.firebaseUser!.uid, 'brands', 'default', 'assets', asset.id);
                batch.set(assetDocRef, sanitizeForFirestore(asset), { merge: true });
              });
              batch.commit().catch((e: any) => handleFirestoreError(e, OperationType.UPDATE, `users/${currentState.firebaseUser?.uid}/brands/default/assets (batch)`));
            }, 5000);
          }
        }
      },
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setFirebaseUser: (firebaseUser) => {
        if (get().firebaseUser?.uid !== firebaseUser?.uid) {
          [brandSyncTimeout, postsSyncTimeout, mediaAssetsSyncTimeout, studioAssetsSyncTimeout, referenceImagesSyncTimeout, assetsSyncTimeout].forEach(clearTimeout);
        }
        set({ firebaseUser });
      },
      setAiSettings: (aiSettings) => set({ aiSettings, credits: aiSettings?.creditBalance || 0 }),
      setCredits: (credits) => set({ credits }),
      setIsLoadingAICredits: (isLoadingAICredits) => set({ isLoadingAICredits }),
      setWorkspaceId: (workspaceId) => set({ workspaceId }),
      setWeeklyPlan: (posts, skipSync = false) => {
        const applyWeeklyPlan = (resolvedPosts: SocialPost[]) => {
          set({ posts: resolvedPosts });
          if (skipSync) return;
          
          const state = get();
          if (state.firebaseUser) {
            // Debounce the posts sync
            if (postsSyncTimeout) clearTimeout(postsSyncTimeout);
            
            postsSyncTimeout = setTimeout(async () => {
              const currentState = get();
              if (!currentState.firebaseUser) return;

              const batch = writeBatch(db);
              currentState.posts.forEach(post => {
                const postDocRef = doc(db, 'users', currentState.firebaseUser!.uid, 'posts', post.id);
                batch.set(postDocRef, sanitizeForFirestore(post), { merge: true });
              });
              
              try {
                await batch.commit();
              } catch (e: any) {
                handleFirestoreError(e, OperationType.UPDATE, `users/${currentState.firebaseUser?.uid}/posts (batch)`);
              }
            }, 0); // Save the batch immediately
          }
        };

        const imagePosts = posts.filter(p => p.imagePreviewUrl && p.imagePreviewUrl.startsWith('data:image/'));
        if (imagePosts.length > 0) {
          Promise.all(
            posts.map(async (p) => {
              if (p.imagePreviewUrl && p.imagePreviewUrl.startsWith('data:image/')) {
                const compressedUrl = await compressBase64Image(p.imagePreviewUrl);
                return { ...p, imagePreviewUrl: compressedUrl };
              }
              return p;
            })
          ).then(applyWeeklyPlan);
        } else {
          applyWeeklyPlan(posts);
        }
      },
      addPost: (post, skipSync = false) => {
        const applyAdd = (resolvedPost: SocialPost) => {
          set((state) => ({ posts: [...state.posts, resolvedPost] }));
          if (skipSync) return;
          const state = get();
          if (state.firebaseUser) {
            const postDocRef = doc(db, 'users', state.firebaseUser.uid, 'posts', resolvedPost.id);
            setDoc(postDocRef, sanitizeForFirestore(resolvedPost)).catch((e: any) => handleFirestoreError(e, OperationType.CREATE, `posts/${resolvedPost.id}`));
          }
        };

        if (post.imagePreviewUrl && post.imagePreviewUrl.startsWith('data:image/')) {
          compressBase64Image(post.imagePreviewUrl).then((compressedUrl) => {
            applyAdd({ ...post, imagePreviewUrl: compressedUrl });
          });
        } else {
          applyAdd(post);
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
        const applyUpdate = (resolvedUpdates: Partial<SocialPost>) => {
          set((state) => ({
            posts: state.posts.map(p => p.id === id ? { ...p, ...resolvedUpdates } : p)
          }));
          if (skipSync) return;
          const state = get();
          if (state.firebaseUser) {
            const postDocRef = doc(db, 'users', state.firebaseUser.uid, 'posts', id);
            setDoc(postDocRef, sanitizeForFirestore(resolvedUpdates), { merge: true }).catch((e: any) => handleFirestoreError(e, OperationType.UPDATE, `posts/${id}`));
          }
        };

        if (updates.imagePreviewUrl && updates.imagePreviewUrl.startsWith('data:image/')) {
          compressBase64Image(updates.imagePreviewUrl).then((compressedUrl) => {
            applyUpdate({ ...updates, imagePreviewUrl: compressedUrl });
          });
        } else {
          applyUpdate(updates);
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
      addBrandAsset: (asset) => {
        set((state) => {
          const brand = state.brand || INITIAL_BRAND_DATA;
          if (brand.assets.length >= 10) return state;
          return { brand: { ...brand, assets: [...brand.assets, asset] } };
        });

        const state = get();
        if (state.firebaseUser) {
          if (assetsSyncTimeout) clearTimeout(assetsSyncTimeout);
          assetsSyncTimeout = setTimeout(() => {
            const currentState = get();
            if (!currentState.firebaseUser) return;
            const assetDocRef = doc(db, 'users', currentState.firebaseUser.uid, 'brands', 'default', 'assets', asset.id);
            setDoc(assetDocRef, asset, { merge: true }).catch((e: any) => handleFirestoreError(e, OperationType.CREATE, `users/${currentState.firebaseUser?.uid}/brands/default/assets/${asset.id}`));
          }, 5000);
        }
      },
      removeBrandAsset: (id) => {
        set((state) => {
          const brand = state.brand || INITIAL_BRAND_DATA;
          return {
            brand: { ...brand, assets: brand.assets.filter(a => a.id !== id) }
          };
        });

        const state = get();
        if (state.firebaseUser) {
          const assetDocRef = doc(db, 'users', state.firebaseUser.uid, 'brands', 'default', 'assets', id);
          deleteDoc(assetDocRef).catch((e: any) => handleFirestoreError(e, OperationType.DELETE, `users/${state.firebaseUser?.uid}/brands/default/assets/${id}`));
        }
      },
      updateBrandAssetTag: (id, tag) => {
        set((state) => {
          const brand = state.brand || INITIAL_BRAND_DATA;
          return {
            brand: { ...brand, assets: brand.assets.map(a => a.id === id ? { ...a, tag } : a) }
          };
        });

        const state = get();
        if (state.firebaseUser) {
          if (assetsSyncTimeout) clearTimeout(assetsSyncTimeout);
          assetsSyncTimeout = setTimeout(() => {
            const currentState = get();
            if (!currentState.firebaseUser) return;
            const assetDocRef = doc(db, 'users', currentState.firebaseUser.uid, 'brands', 'default', 'assets', id);
            setDoc(assetDocRef, { tag, updatedAt: new Date().toISOString() }, { merge: true }).catch((e: any) => handleFirestoreError(e, OperationType.UPDATE, `users/${currentState.firebaseUser?.uid}/brands/default/assets/${id}`));
          }, 5000);
        }
      },
      addReferenceImage: (image) => {
        set((state) => {
          const brand = state.brand || INITIAL_BRAND_DATA;
          const currentImages = brand.referenceImages || [];
          if (currentImages.length >= 20) return state;
          return {
            brand: { ...brand, referenceImages: [image, ...currentImages] }
          };
        });
        
        const state = get();
        if (state.firebaseUser) {
          (() => {
            const currentState = get();
            if (!currentState.firebaseUser) return;
            const imgDocRef = doc(db, 'users', currentState.firebaseUser.uid, 'brands', 'default', 'referenceImages', image.id);
            setDoc(imgDocRef, image, { merge: true }).catch((e: any) => handleFirestoreError(e, OperationType.CREATE, `users/${currentState.firebaseUser?.uid}/brands/default/referenceImages/${image.id}`));
          })();
        }
      },
      addReferenceImages: (images) => {
        set((state) => {
          const brand = state.brand || INITIAL_BRAND_DATA;
          const currentImages = brand.referenceImages || [];
          const currentCount = currentImages.length;
          const availableSlots = 20 - currentCount;
          if (availableSlots <= 0) return state;
          
          const newImages = images.slice(0, availableSlots);
          return {
            brand: { ...brand, referenceImages: [...newImages, ...currentImages] }
          };
        });

        const state = get();
        if (state.firebaseUser) {
          const batch = writeBatch(db);
          images.forEach(image => {
            const imgDocRef = doc(db, 'users', state.firebaseUser!.uid, 'brands', 'default', 'referenceImages', image.id);
            batch.set(imgDocRef, image, { merge: true });
          });
          
          batch.commit().catch((e: any) => handleFirestoreError(e, OperationType.CREATE, `users/${state.firebaseUser?.uid}/brands/default/referenceImages (batch)`));
        }
      },
      removeReferenceImage: (id) => {
        set((state) => {
          const brand = state.brand || INITIAL_BRAND_DATA;
          return {
            brand: { ...brand, referenceImages: (brand.referenceImages || []).filter(img => img.id !== id) }
          };
        });

        const state = get();
        if (state.firebaseUser) {
          const imgDocRef = doc(db, 'users', state.firebaseUser.uid, 'brands', 'default', 'referenceImages', id);
          deleteDoc(imgDocRef).catch((e: any) => handleFirestoreError(e, OperationType.DELETE, `users/${state.firebaseUser?.uid}/brands/default/referenceImages/${id}`));
        }
      },
      updateReferenceImage: (id, updates) => {
        set((state) => {
          const brand = state.brand || INITIAL_BRAND_DATA;
          return {
            brand: { 
              ...brand, 
              referenceImages: (brand.referenceImages || []).map(img => img.id === id ? { ...img, ...updates, updatedAt: new Date().toISOString() } : img) 
            }
          };
        });

        const state = get();
        if (state.firebaseUser) {
          (() => {
            const currentState = get();
            if (!currentState.firebaseUser) return;
            const imgDocRef = doc(db, 'users', currentState.firebaseUser.uid, 'brands', 'default', 'referenceImages', id);
            setDoc(imgDocRef, updates, { merge: true }).catch((e: any) => handleFirestoreError(e, OperationType.UPDATE, `users/${currentState.firebaseUser?.uid}/brands/default/referenceImages/${id}`));
          })();
        }
      },
      updateReferenceSettings: (settings) => {
        set((state) => {
          const brand = state.brand || INITIAL_BRAND_DATA;
          return {
            brand: { ...brand, referenceSettings: { ...(brand.referenceSettings || { useInGeneration: true, strength: 'medium' }), ...settings } }
          };
        });

        const state = get();
        if (state.firebaseUser) {
          const brandDocRef = doc(db, 'users', state.firebaseUser.uid, 'brands', 'default');
          setDoc(brandDocRef, { referenceSettings: { ...(state.brand?.referenceSettings || {}), ...settings } }, { merge: true })
            .catch((e: any) => handleFirestoreError(e, OperationType.UPDATE, `users/${state.firebaseUser?.uid}/brands/default`));
        }
      },
      addMediaAsset: (asset, skipSync = false) => {
        const applyAddMedia = (resolvedAsset: MediaAsset) => {
          set((state) => ({
            mediaAssets: [resolvedAsset, ...state.mediaAssets]
          }));
          if (skipSync) return;
          const state = get();
          if (state.firebaseUser) {
            (() => {
              const currentState = get();
              if (!currentState.firebaseUser) return;
              const assetDocRef = doc(db, 'users', currentState.firebaseUser.uid, 'mediaAssets', resolvedAsset.id);
              setDoc(assetDocRef, sanitizeForFirestore(resolvedAsset), { merge: true }).catch((e: any) => handleFirestoreError(e, OperationType.UPDATE, `users/${currentState.firebaseUser?.uid}/mediaAssets/${resolvedAsset.id}`));
            })();
          }
        };

        const compressUrls = async () => {
          let sourceUrl = asset.sourceUrl;
          let editedUrl = asset.editedUrl;
          if (sourceUrl && sourceUrl.startsWith('data:image/')) {
            sourceUrl = await compressBase64Image(sourceUrl);
          }
          if (editedUrl && editedUrl.startsWith('data:image/')) {
            editedUrl = await compressBase64Image(editedUrl);
          }
          return { ...asset, sourceUrl, editedUrl };
        };

        compressUrls().then(applyAddMedia);
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
        const applyUpdateMedia = (resolvedUpdates: Partial<MediaAsset>) => {
          set((state) => ({
            mediaAssets: state.mediaAssets.map(a => a.id === id ? { ...a, ...resolvedUpdates } : a)
          }));
          if (skipSync) return;
          const state = get();
          if (state.firebaseUser) {
            (() => {
              const currentState = get();
              if (!currentState.firebaseUser) return;
              const assetDocRef = doc(db, 'users', currentState.firebaseUser.uid, 'mediaAssets', id);
              setDoc(assetDocRef, sanitizeForFirestore(resolvedUpdates), { merge: true }).catch((e: any) => handleFirestoreError(e, OperationType.UPDATE, `users/${currentState.firebaseUser?.uid}/mediaAssets/${id}`));
            })();
          }
        };

        const compressUrls = async () => {
          let sourceUrl = updates.sourceUrl;
          let editedUrl = updates.editedUrl;
          if (sourceUrl && sourceUrl.startsWith('data:image/')) {
            sourceUrl = await compressBase64Image(sourceUrl);
          }
          if (editedUrl && editedUrl.startsWith('data:image/')) {
            editedUrl = await compressBase64Image(editedUrl);
          }
          const up: Partial<MediaAsset> = { ...updates };
          if (sourceUrl !== undefined) up.sourceUrl = sourceUrl;
          if (editedUrl !== undefined) up.editedUrl = editedUrl;
          return up;
        };

        compressUrls().then(applyUpdateMedia);
      },
      addStudioAsset: (asset, skipSync = false) => {
        const applyAddStudio = (resolvedAsset: StudioGeneratedAsset) => {
          set((state) => ({
            studioAssets: [resolvedAsset, ...state.studioAssets]
          }));
          if (skipSync) return;
          const state = get();
          if (state.firebaseUser) {
            (() => {
              const currentState = get();
              if (!currentState.firebaseUser) return;
              const assetDocRef = doc(db, 'users', currentState.firebaseUser.uid, 'studioAssets', resolvedAsset.id);
              setDoc(assetDocRef, sanitizeForFirestore(resolvedAsset), { merge: true }).catch((e: any) => handleFirestoreError(e, OperationType.UPDATE, `users/${currentState.firebaseUser?.uid}/studioAssets/${resolvedAsset.id}`));
            })();
          }
        };

        const compressUrls = async () => {
          let outputUrl = asset.outputUrl;
          let brandedOutputUrl = asset.brandedOutputUrl;
          if (outputUrl && outputUrl.startsWith('data:image/')) {
            outputUrl = await compressBase64Image(outputUrl);
          }
          if (brandedOutputUrl && brandedOutputUrl.startsWith('data:image/')) {
            brandedOutputUrl = await compressBase64Image(brandedOutputUrl);
          }
          return { ...asset, outputUrl, brandedOutputUrl };
        };

        compressUrls().then(applyAddStudio);
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
              throw new Error(`Eksport do ${integration.name} nieudany (${response.status}).`);
            }
          } catch (error) {
            console.error(`Error sending webhook to ${integration.name}:`, error);
            throw error;
          }
        });

        const results = await Promise.allSettled(promises);
        if (eventData.eventType === 'export_to_external' && results.some(result => result.status === 'rejected')) {
          throw new Error('Co najmniej jedna integracja odrzuciła eksport. Sprawdź odbiorców przed ponowieniem, aby uniknąć duplikatów.');
        }
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
