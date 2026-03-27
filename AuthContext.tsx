
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useStore } from './store';

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
  const { setAuthenticated, setFirebaseUser, updateBrand, setLanguage, setOnboardingStep, setUserId, setAiSettings, setIsLoadingAICredits, setWorkspaceId, workspaceId } = useStore();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setFirebaseUser(user);
      setAuthenticated(!!user);
      if (user) {
        setUserId(user.uid);
        
        // Initialize user on backend (grant credits if needed)
        fetch('/api/auth/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid, email: user.email })
        }).catch(err => console.error("Failed to init user credits:", err));

        setIsLoadingAICredits(true);
        // Sync data from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.brand) updateBrand(data.brand);
            if (data.language) setLanguage(data.language);
            if (typeof data.onboardingStep === 'number') setOnboardingStep(data.onboardingStep);
            
            if (data.workspaceId) {
              setWorkspaceId(data.workspaceId);
            } else {
              // No workspaceId, we can stop loading
              setLoading(false);
            }
          } else {
            // User doc doesn't exist yet, we'll wait for /api/auth/init or just stop loading
            // if we're not expecting a workspace sync
            setLoading(false);
          }
        }, (error) => {
          // Log but don't throw to prevent app crash during startup
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`, false);
          setLoading(false);
        });

        return () => unsubscribeUser();
      } else {
        setAiSettings(null);
        setWorkspaceId('');
        setIsLoadingAICredits(false);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [setAuthenticated, setFirebaseUser, updateBrand, setLanguage, setOnboardingStep, setUserId, setWorkspaceId, setAiSettings, setIsLoadingAICredits]);

  // Separate effect for workspace sync
  useEffect(() => {
    if (!currentUser || !workspaceId) {
      if (!currentUser) {
        setIsLoadingAICredits(false);
        setLoading(false);
      }
      return;
    }

    const workspaceDocRef = doc(db, 'workspaces', workspaceId);
    const unsubscribeWorkspace = onSnapshot(workspaceDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.aiSettings) {
          setAiSettings(data.aiSettings);
        }
      }
      setIsLoadingAICredits(false);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `workspaces/${workspaceId}`);
      setIsLoadingAICredits(false);
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
