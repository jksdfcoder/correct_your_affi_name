import { Header } from '@/components/Header';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthorPanel } from '@/components/AuthorPanel';
import { PreviewPanel } from '@/components/PreviewPanel';
import { SettingsPanel } from '@/components/SettingsPanel';

function AppContent() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Author Panel + Settings */}
        <div className="w-full lg:w-[400px] xl:w-[450px] flex flex-col border-r bg-muted/20">
          {/* Author Panel - takes most space */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <AuthorPanel />
          </div>

          {/* Settings Panel - collapsible at bottom */}
          <div className="border-t flex-shrink-0 max-h-[50vh] overflow-y-auto">
            <SettingsPanel />
          </div>
        </div>

        {/* Right Column: Preview Panel - full height */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <PreviewPanel />
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
