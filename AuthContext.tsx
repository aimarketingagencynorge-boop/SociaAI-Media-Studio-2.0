
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
  const { setAuthenticated, setFirebaseUser, setGeminiApiKey, updateBrand, setLanguage, setOnboardingStep, setUserId } = useStore();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setFirebaseUser(user);
      setAuthenticated(!!user);
      if (user) setUserId(user.uid);

      if (user) {
        // Sync data from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.geminiApiKey) setGeminiApiKey(data.geminiApiKey);
            if (data.brand) updateBrand(data.brand);
            if (data.language) setLanguage(data.language);
            if (typeof data.onboardingStep === 'number') setOnboardingStep(data.onboardingStep);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        });

        setLoading(false);
        return () => unsubscribeFirestore();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [setAuthenticated, setFirebaseUser, setGeminiApiKey, updateBrand, setLanguage, setOnboardingStep, setUserId]);

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
