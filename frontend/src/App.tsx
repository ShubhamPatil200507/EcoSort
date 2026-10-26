import React, { useState } from 'react';
import { LocationProvider } from './context/LocationContext';
import { AppHeader } from './components/Navigation/AppHeader';
import { Sidebar } from './components/Navigation/Sidebar';
import { LocationModal } from './components/Location/LocationModal';
import { ModelTransparencyModal } from './components/ModelTransparency/ModelTransparencyModal';
import { AppView, StoredSessionRecord } from './types';
import { getStoredSessions } from './utils/sessionStore';

// Public Views
import { LandingPageView } from './components/Public/LandingPageView';
import { HowItWorksView } from './components/Public/HowItWorksView';
import { PublicResearchView } from './components/Public/PublicResearchView';
import { AboutProjectView } from './components/Public/AboutProjectView';

// Workspace Views
import { OverviewView } from './components/Workspace/OverviewView';
import { AnalysisStudioView } from './components/Workspace/AnalysisStudioView';
import { AnalysisHistoryView } from './components/Workspace/AnalysisHistoryView';
import { CentresExplorerView } from './components/CentresExplorer/CentresExplorerView';
import { ResearchEvaluationView } from './components/Workspace/ResearchEvaluationView';
import { DocumentationView } from './components/Workspace/DocumentationView';
import { SettingsView } from './components/Workspace/SettingsView';

const MainApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [selectedSessionForStudio, setSelectedSessionForStudio] = useState<StoredSessionRecord | null>(null);
  const [isModelModalOpen, setIsModelModalOpen] = useState<boolean>(false);

  const isPublicView = ['landing', 'how-it-works', 'research-public', 'about'].includes(currentView);
  const historySessions = getStoredSessions();

  const handleOpenPastSession = (session: StoredSessionRecord) => {
    setSelectedSessionForStudio(session);
    setCurrentView('analysis');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartNewAnalysis = () => {
    setSelectedSessionForStudio(null);
    setCurrentView('analysis');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F2] text-[#17231D] selection:bg-[#EAF4EC] selection:text-[#174D3A]">
      {isPublicView ? (
        /* ================= PUBLIC WEBSITE MODE ================= */
        <div className="flex-1 flex flex-col">
          <AppHeader
            currentView={currentView}
            onNavigate={(view) => {
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />

          <main className="flex-1 w-full">
            {currentView === 'landing' && (
              <LandingPageView
                onNavigate={(view) => {
                  setCurrentView(view);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {currentView === 'how-it-works' && (
              <HowItWorksView
                onNavigate={(view) => {
                  setCurrentView(view);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {currentView === 'research-public' && (
              <PublicResearchView
                onNavigate={(view) => {
                  setCurrentView(view);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {currentView === 'about' && (
              <AboutProjectView
                onNavigate={(view) => {
                  setCurrentView(view);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
          </main>
        </div>
      ) : (
        /* ================= WORKSPACE MODE ================= */
        <div className="flex-1 flex">
          {/* Persistent Sidebar (desktop) and Drawer (mobile) */}
          <Sidebar
            currentView={currentView}
            onNavigate={(view) => {
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            historyCount={historySessions.length}
            isOpenMobile={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />

          {/* Right Workspace Content Area */}
          <div className="flex-1 flex flex-col lg:pl-72 w-full transition-all">
            <AppHeader
              currentView={currentView}
              onNavigate={(view) => {
                setCurrentView(view);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
            />

            <main className="flex-1 p-4 sm:p-6 lg:p-8">
              {currentView === 'overview' && (
                <OverviewView
                  onNavigate={(view) => {
                    setCurrentView(view);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onOpenSession={handleOpenPastSession}
                />
              )}

              {currentView === 'analysis' && (
                <AnalysisStudioView
                  initialSession={selectedSessionForStudio}
                  onViewHistory={() => setCurrentView('history')}
                />
              )}

              {currentView === 'history' && (
                <AnalysisHistoryView
                  onOpenSession={handleOpenPastSession}
                  onNavigateNew={handleStartNewAnalysis}
                />
              )}

              {currentView === 'centres' && <CentresExplorerView />}

              {currentView === 'evaluation' && <ResearchEvaluationView />}

              {currentView === 'docs' && <DocumentationView />}

              {currentView === 'settings' && <SettingsView />}
            </main>
          </div>
        </div>
      )}

      {/* Global Location Modal */}
      <LocationModal />

      {/* Global Model Architecture & Retraining Governance Modal */}
      <ModelTransparencyModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <LocationProvider>
      <MainApp />
    </LocationProvider>
  );
}

export default App;
