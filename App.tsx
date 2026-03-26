
import React, { useEffect } from 'react';
import { useStore } from './store';
import LandingPage from './components/LandingPage';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import AppShell from './components/AppShell';
import AIStudio from './components/AIStudio';
import Store from './components/Store';
import MediaLab from './components/MediaLab';
import Analytics from './components/Analytics';
import BrandKit from './components/BrandKit';
import Planner from './components/Planner';
import Settings from './components/Settings';
import Billing from './components/Billing';
import Integrations from './components/Integrations';
import { auth, db, handleFirestoreError, OperationType, User } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

const App: React.FC = () => {
  const { isAuthenticated, onboardingStep, activeView, setAuthenticated, setFirebaseUser, setGeminiApiKey, updateBrand, setLanguage } = useStore();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        setFirebaseUser(user);
        setAuthenticated(true);

        // Sync data from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeFirestore = onSnapshot(userDocRef, (docSnap: any) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.geminiApiKey) setGeminiApiKey(data.geminiApiKey);
            if (data.brand) updateBrand(data.brand);
            if (data.language) setLanguage(data.language);
            if (data.onboardingStep !== undefined) {
              // Only update if it's different to avoid loops
              // Actually, store actions already handle this
            }
          }
        }, (error: any) => {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        });

        return () => unsubscribeFirestore();
      } else {
        setFirebaseUser(null);
        setAuthenticated(false);
      }
    });

    return () => unsubscribeAuth();
  }, [setAuthenticated, setFirebaseUser, setGeminiApiKey, updateBrand, setLanguage]);

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  if (onboardingStep > 0) {
    return <Onboarding />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard />;
      case 'ai-studio': return <AIStudio />;
      case 'media-lab': return <MediaLab />;
      case 'analytics': return <Analytics />;
      case 'brand-kit': return <BrandKit />;
      case 'planner': return <Planner />;
      case 'settings': return <Settings />;
      case 'integrations': return <Integrations />;
      case 'store': return <Billing />; // Using Billing component for the refined terminal look
      default: return (
        <div className="flex items-center justify-center h-full">
           <div className="text-center glass-panel p-12 rounded-3xl">
              <h2 className="text-2xl font-orbitron uppercase text-white/40 tracking-[0.4em]">Sector in Development</h2>
           </div>
        </div>
      );
    }
  };

  return (
    <AppShell>
      {renderView()}
    </AppShell>
  );
};

export default App;
