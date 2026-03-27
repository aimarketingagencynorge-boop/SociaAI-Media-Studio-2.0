
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { useStore } from './store';
import { AIAccessSettings, SocialPost } from './types';

interface AuthContextType {
  currentUser: User | null;
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initStatus, setInitStatus] = useState<'idle' | 'auth' | 'firestore' | 'workspace' | 'ready'>('idle');
  const { 
    setAuthenticated, 
    setFirebaseUser, 
    updateBrand, 
    setLanguage, 
    setOnboardingStep, 
    setUserId, 
    setAiSettings, 
    setIsLoadingAICredits, 
    setWorkspaceId, 
    workspaceId, 
    setWeeklyPlan,
    setMediaAssets,
    setStudioAssets
  } = useStore();

  useEffect(() => {
    setInitStatus('auth');
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setFirebaseUser(user);
      setAuthenticated(!!user);
      
      if (user) {
        setUserId(user.uid);
        setInitStatus('firestore');
        
        // 1. Initialize user on backend (Auth Init)
        const initUser = async () => {
          try {
            const response = await fetch('/api/auth/init', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.uid, email: user.email })
            });
            const data = await response.json();
            if (data.workspaceId) {
              setWorkspaceId(data.workspaceId);
            }
          } catch (err) {
            console.error("[Auth Init] Failed to init user credits:", err);
          }
        };
        initUser();

        setIsLoadingAICredits(true);
        
        // 2. Sync User Data (Firestore Init)
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            // We no longer read brand from the user doc as it's moved to a subcollection
            if (data.language) setLanguage(data.language);
            if (typeof data.onboardingStep === 'number') setOnboardingStep(data.onboardingStep);
            
            if (data.workspaceId) {
              setWorkspaceId(data.workspaceId);
              setInitStatus('workspace');
            }
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`, false);
          if (!workspaceId) setLoading(false);
        });

        // 3. Sync Brand Data (Subcollection)
        const brandDocRef = doc(db, 'users', user.uid, 'brands', 'default');
        const unsubscribeBrand = onSnapshot(brandDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            updateBrand(data, true); // skipSync = true
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}/brands/default`, false);
        });

        // 3a. Sync Reference Images (Subcollection)
        const refImagesColRef = collection(db, 'users', user.uid, 'brands', 'default', 'referenceImages');
        const unsubscribeReferenceImages = onSnapshot(refImagesColRef, (querySnap) => {
          const images: any[] = [];
          querySnap.forEach((doc) => {
            images.push(doc.data());
          });
          if (images.length > 0) {
            updateBrand({ referenceImages: images as any }, true); // skipSync = true
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}/brands/default/referenceImages`, false);
        });

        // 3b. Sync Assets (Subcollection)
        const assetsColRef = collection(db, 'users', user.uid, 'brands', 'default', 'assets');
        const unsubscribeAssets = onSnapshot(assetsColRef, (querySnap) => {
          const assets: any[] = [];
          querySnap.forEach((doc) => {
            assets.push(doc.data());
          });
          if (assets.length > 0) {
            updateBrand({ assets: assets as any }, true); // skipSync = true
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}/brands/default/assets`, false);
        });

        // 4. Sync Posts (Subcollection)
        const postsColRef = collection(db, 'users', user.uid, 'posts');
        const unsubscribePosts = onSnapshot(postsColRef, (querySnap) => {
          const posts: SocialPost[] = [];
          querySnap.forEach((doc) => {
            posts.push(doc.data() as SocialPost);
          });
          if (posts.length > 0) {
            setWeeklyPlan(posts, true); // skipSync = true
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}/posts`, false);
        });

        // 5. Sync Media Assets (Subcollection)
        const mediaAssetsColRef = collection(db, 'users', user.uid, 'mediaAssets');
        const unsubscribeMediaAssets = onSnapshot(mediaAssetsColRef, (querySnap) => {
          const assets: any[] = [];
          querySnap.forEach((doc) => {
            assets.push(doc.data());
          });
          if (assets.length > 0) {
            setMediaAssets(assets);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}/mediaAssets`, false);
        });

        // 6. Sync Studio Assets (Subcollection)
        const studioAssetsColRef = collection(db, 'users', user.uid, 'studioAssets');
        const unsubscribeStudioAssets = onSnapshot(studioAssetsColRef, (querySnap) => {
          const assets: any[] = [];
          querySnap.forEach((doc) => {
            assets.push(doc.data());
          });
          if (assets.length > 0) {
            setStudioAssets(assets);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}/studioAssets`, false);
        });

        return () => {
          unsubscribeUser();
          unsubscribeBrand();
          unsubscribeReferenceImages();
          unsubscribeAssets();
          unsubscribePosts();
          unsubscribeMediaAssets();
          unsubscribeStudioAssets();
        };
      } else {
        setAiSettings(null);
        setWorkspaceId('');
        setIsLoadingAICredits(false);
        setInitStatus('ready');
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [setAuthenticated, setFirebaseUser, updateBrand, setLanguage, setOnboardingStep, setUserId, setWorkspaceId, setAiSettings, setIsLoadingAICredits, setWeeklyPlan, setMediaAssets, setStudioAssets]);

  // 3. Workspace Bootstrap
  useEffect(() => {
    if (!currentUser || !workspaceId) {
      // If we have a user but no workspaceId yet, we wait
      return;
    }

    const workspaceDocRef = doc(db, 'workspaces', workspaceId);
    const unsubscribeWorkspace = onSnapshot(workspaceDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as AIAccessSettings;
        setAiSettings(data);
      }
      setIsLoadingAICredits(false);
      setInitStatus('ready');
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `workspaces/${workspaceId}`, false);
      setIsLoadingAICredits(false);
      setInitStatus('ready');
      setLoading(false);
    });

    return () => unsubscribeWorkspace();
  }, [currentUser, workspaceId, setAiSettings, setIsLoadingAICredits]);

  const logout = async () => {
    try {
      await auth.signOut();
      setAuthenticated(false);
      setFirebaseUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    currentUser,
    user: currentUser,
    loading,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
