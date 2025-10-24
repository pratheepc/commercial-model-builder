import { useEffect, useCallback } from 'react';

interface HistoryState {
  view: 'models' | 'catalogue' | 'details';
  modelId?: string;
  modelName?: string;
}

export function useBrowserHistory(
  currentView: 'models' | 'details' | 'catalogue',
  selectedModel?: { id: string; name: string } | null,
  onNavigate?: (view: 'models' | 'catalogue') => void,
  onViewModel?: (model: { id: string; name: string }) => void
) {
  // Update URL when view or model changes
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const state: HistoryState = {
      view: currentView,
    };

    if (currentView === 'details' && selectedModel) {
      state.modelId = selectedModel.id;
      state.modelName = selectedModel.name;
    }

    const url = new URL(window.location.href);
    
    // Update URL path
    if (currentView === 'models') {
      url.pathname = '/';
    } else if (currentView === 'catalogue') {
      url.pathname = '/catalogue';
    } else if (currentView === 'details' && selectedModel) {
      url.pathname = `/models/${selectedModel.id}`;
    }

    // Update browser history without triggering navigation
    window.history.replaceState(state, '', url.toString());
  }, [currentView, selectedModel]);

  // Handle browser back/forward buttons
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as HistoryState | null;
      
      if (state) {
        if (state.view === 'models' && onNavigate) {
          onNavigate('models');
        } else if (state.view === 'catalogue' && onNavigate) {
          onNavigate('catalogue');
        } else if (state.view === 'details' && state.modelId && state.modelName && onViewModel) {
          onViewModel({ id: state.modelId, name: state.modelName });
        }
      } else {
        // Handle direct URL navigation
        const path = window.location.pathname;
        
        if (path === '/' || path === '/models') {
          onNavigate?.('models');
        } else if (path === '/catalogue') {
          onNavigate?.('catalogue');
        } else if (path.startsWith('/models/')) {
          const modelId = path.split('/')[2];
          // We'll need to fetch the model name from the global state
          // For now, just navigate to models view
          onNavigate?.('models');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Handle initial page load - only if there's no existing state
    if (!window.history.state) {
      handlePopState(new PopStateEvent('popstate'));
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onNavigate, onViewModel]);

  // Helper function to navigate with history
  const navigateWithHistory = useCallback((
    view: 'models' | 'catalogue' | 'details',
    model?: { id: string; name: string }
  ) => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const state: HistoryState = { view };
    
    if (view === 'details' && model) {
      state.modelId = model.id;
      state.modelName = model.name;
    }

    const url = new URL(window.location.href);
    
    if (view === 'models') {
      url.pathname = '/';
    } else if (view === 'catalogue') {
      url.pathname = '/catalogue';
    } else if (view === 'details' && model) {
      url.pathname = `/models/${model.id}`;
    }

    window.history.pushState(state, '', url.toString());
  }, []);

  return { navigateWithHistory };
}
