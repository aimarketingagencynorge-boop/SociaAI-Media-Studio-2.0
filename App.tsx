
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

const App: React.FC = () => {
  const { isAuthenticated, onboardingStep, activeView } = useStore();

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
