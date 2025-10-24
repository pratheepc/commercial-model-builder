import React, { useState } from 'react';
import { Model } from '@/types';
import { ModelManagement } from '@/components/ModelManagement';
import { ModelDetails } from '@/components/ModelDetails';
import { ProductModuleManagement } from '@/components/ProductModuleManagement';
import { Sidebar } from '@/components/Sidebar';
import { LoadingState } from '@/components/LoadingState';
import { Footer } from '@/components/Footer';
import { AppProvider } from '@/contexts/AppContext';
import { useBrowserHistory } from '@/hooks/useBrowserHistory';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Calculator, BarChart3 } from 'lucide-react';

function AppContent() {
    const [currentView, setCurrentView] = useState<'models' | 'details' | 'catalogue'>('models');
    const [selectedModel, setSelectedModel] = useState<Model | null>(null);

    const handleViewModel = (model: Model) => {
        setSelectedModel(model);
        setCurrentView('details');
    };

    const handleBackToModels = () => {
        setSelectedModel(null);
        setCurrentView('models');
    };

    const handleNavigate = (view: 'models' | 'catalogue') => {
        setCurrentView(view);
        setSelectedModel(null);
    };

    // Browser history management
    useBrowserHistory(currentView, selectedModel, handleNavigate, handleViewModel);

    return (
        <TooltipProvider>
            <div className="h-screen bg-slate-50 flex overflow-hidden">
                {/* Sidebar */}
                <Sidebar
                    currentView={currentView}
                    onNavigate={handleNavigate}
                    selectedModel={selectedModel}
                />

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-h-0">
                    {/* Header */}
                    <header className="bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
                        <div className="px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold">
                                        {currentView === 'models' ? 'Pricing Models' :
                                            currentView === 'catalogue' ? 'Products & Modules' :
                                                selectedModel?.name || 'Model Details'}
                                    </h1>
                                    <p className="text-sm text-muted-foreground">
                                        {currentView === 'models' ? 'Create and manage pricing models for your SaaS products' :
                                            currentView === 'catalogue' ? 'Manage products and their associated modules' :
                                                'Configure modules, pricing, and projections for this model'}
                                    </p>
                                </div>
                                {currentView === 'details' && (
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Model Details</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>

                    {/* Main Content */}
                    <main className="flex-1 p-6 overflow-y-auto">
                        <LoadingState>
                            {currentView === 'details' && selectedModel ? (
                                <ModelDetails
                                    model={selectedModel}
                                    onBack={handleBackToModels}
                                />
                            ) : currentView === 'models' ? (
                                <ModelManagement onViewModel={handleViewModel} />
                            ) : (
                                <ProductModuleManagement />
                            )}
                        </LoadingState>
                    </main>

                    {/* Footer */}
                    <div className="shadow-sm">
                        <Footer />
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}

function App() {
    return (
        <ErrorBoundary>
            <AppProvider>
                <AppContent />
            </AppProvider>
        </ErrorBoundary>
    );
}

export default App;
