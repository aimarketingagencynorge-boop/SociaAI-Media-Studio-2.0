
import React, { useEffect } from 'react';
import { useStore } from './store';
import { AuthProvider, useAuth } from './AuthContext';
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
import Auth from './components/Auth';

const AppContent: React.FC = () => {
  const { onboardingStep, activeView, fetchUserData } = useStore();
  const { user, token, isLoading } = useAuth();

  useEffect(() => {
    if (token) {
      fetchUserData(token);
    }
  }, [token, fetchUserData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A12] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
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
      case 'store': return <Billing />;
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

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
