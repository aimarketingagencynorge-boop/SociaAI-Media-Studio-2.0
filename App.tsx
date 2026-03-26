
import React from 'react';
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
import { AuthProvider, useAuth } from './AuthContext';

const AppContent: React.FC = () => {
  const { isAuthenticated, onboardingStep, activeView } = useStore();
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A12] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

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
