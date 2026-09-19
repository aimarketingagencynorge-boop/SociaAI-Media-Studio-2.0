
import React, { Suspense, lazy, useState, useEffect } from 'react';
import { useStore } from './store';
import { AuthProvider, useAuth } from './AuthContext';
import LegalPage, { LegalLinks } from './components/LegalPage';

const Workshop = lazy(() => import('./components/Workshop'));
const QuickStart = lazy(() => import('./components/QuickStart'));
// Lazy load components
const LandingPage = lazy(() => import('./components/LandingPage'));
const Onboarding = lazy(() => import('./components/Onboarding'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const AppShell = lazy(() => import('./components/AppShell'));
const AIStudio = lazy(() => import('./components/AIStudio'));
const MediaLab = lazy(() => import('./components/MediaLab'));
const Analytics = lazy(() => import('./components/Analytics'));
const BrandKit = lazy(() => import('./components/BrandKit'));
const Planner = lazy(() => import('./components/Planner'));
const Settings = lazy(() => import('./components/Settings'));
const Billing = lazy(() => import('./components/Billing'));
const Integrations = lazy(() => import('./components/Integrations'));

const LoadingSpinner = () => (
  <div data-testid="loading-spinner" className="min-h-screen bg-[#0A0A12] flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
  </div>
);

const AppContent: React.FC = () => {
  const { isAuthenticated, onboardingStep, activeView, isStarted } = useStore();
  const { loading } = useAuth();
  const [advancedOnboarding, setAdvancedOnboarding] = useState(false);
  useEffect(() => {
    if (isAuthenticated && new URLSearchParams(window.location.search).has('billing')) {
      useStore.getState().setIsStarted(true);
      useStore.getState().setActiveView('store');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [isAuthenticated]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      {!isStarted || !isAuthenticated ? (
        <LandingPage />
      ) : onboardingStep > 0 ? (
        advancedOnboarding ? <Onboarding /> : <QuickStart onAdvanced={() => setAdvancedOnboarding(true)} />
      ) : (
        <AppShell>
          {(() => {
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
          })()}
        </AppShell>
      )}
    </Suspense>
  );
};

const App: React.FC = () => {
  if (['/regulamin', '/prywatnosc'].includes(window.location.pathname)) return <LegalPage privacy={window.location.pathname === '/prywatnosc'} />;
  if (new URLSearchParams(window.location.search).get("workshop") === "1") {
    return <Suspense fallback={<LoadingSpinner />}><Workshop onClose={() => { window.location.href = "/"; }} onStart={() => { window.location.href = "/"; }} /></Suspense>;
  }
  return (
    <AuthProvider>
      <AppContent />
      <LegalLinks />
    </AuthProvider>
  );
};

export default App;
