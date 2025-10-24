import { useState, useEffect, useCallback } from 'react';
import { Model, ModuleCatalogue } from '@/types';
import { apiDataService } from '@/lib/apiDataService';

interface AppState {
  models: Model[];
  moduleCatalogue: ModuleCatalogue[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface AppStateActions {
  refreshModels: () => Promise<void>;
  refreshModuleCatalogue: () => Promise<void>;
  refreshAll: () => Promise<void>;
  addModel: (model: Model) => void;
  updateModel: (id: string, updates: Partial<Model>) => void;
  removeModel: (id: string) => void;
  addModuleToCatalogue: (module: ModuleCatalogue) => void;
  updateModuleInCatalogue: (id: string, updates: Partial<ModuleCatalogue>) => void;
  removeModuleFromCatalogue: (id: string) => void;
  clearError: () => void;
}

export function useAppState(): AppState & AppStateActions {
  const [state, setState] = useState<AppState>({
    models: [],
    moduleCatalogue: [],
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  const loadInitialData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const [models, moduleCatalogue] = await Promise.all([
        apiDataService.getModels(),
        apiDataService.getModuleCatalogue(),
      ]);

      setState(prev => ({
        ...prev,
        models,
        moduleCatalogue,
        isLoading: false,
        lastUpdated: new Date(),
      }));
    } catch (error) {
      console.error('Error loading initial data:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load data',
      }));
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const refreshModels = useCallback(async () => {
    try {
      const models = await apiDataService.getModels();
      setState(prev => ({
        ...prev,
        models,
        lastUpdated: new Date(),
        error: null,
      }));
    } catch (error) {
      console.error('Error refreshing models:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to refresh models',
      }));
    }
  }, []);

  const refreshModuleCatalogue = useCallback(async () => {
    try {
      const moduleCatalogue = await apiDataService.getModuleCatalogue();
      setState(prev => ({
        ...prev,
        moduleCatalogue,
        lastUpdated: new Date(),
        error: null,
      }));
    } catch (error) {
      console.error('Error refreshing module catalogue:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to refresh module catalogue',
      }));
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const [models, moduleCatalogue] = await Promise.all([
        apiDataService.getModels(),
        apiDataService.getModuleCatalogue(),
      ]);

      setState(prev => ({
        ...prev,
        models,
        moduleCatalogue,
        isLoading: false,
        lastUpdated: new Date(),
        error: null,
      }));
    } catch (error) {
      console.error('Error refreshing all data:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to refresh data',
      }));
    }
  }, []);

  const addModel = useCallback((model: Model) => {
    setState(prev => ({
      ...prev,
      models: [...prev.models, model],
      lastUpdated: new Date(),
    }));
  }, []);

  const updateModel = useCallback((id: string, updates: Partial<Model>) => {
    setState(prev => ({
      ...prev,
      models: prev.models.map(model => 
        model.id === id ? { ...model, ...updates } : model
      ),
      lastUpdated: new Date(),
    }));
  }, []);

  const removeModel = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      models: prev.models.filter(model => model.id !== id),
      lastUpdated: new Date(),
    }));
  }, []);

  const addModuleToCatalogue = useCallback((module: ModuleCatalogue) => {
    setState(prev => ({
      ...prev,
      moduleCatalogue: [...prev.moduleCatalogue, module],
      lastUpdated: new Date(),
    }));
  }, []);

  const updateModuleInCatalogue = useCallback((id: string, updates: Partial<ModuleCatalogue>) => {
    setState(prev => ({
      ...prev,
      moduleCatalogue: prev.moduleCatalogue.map(module =>
        module.id === id ? { ...module, ...updates } : module
      ),
      lastUpdated: new Date(),
    }));
  }, []);

  const removeModuleFromCatalogue = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      moduleCatalogue: prev.moduleCatalogue.filter(module => module.id !== id),
      lastUpdated: new Date(),
    }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    refreshModels,
    refreshModuleCatalogue,
    refreshAll,
    addModel,
    updateModel,
    removeModel,
    addModuleToCatalogue,
    updateModuleInCatalogue,
    removeModuleFromCatalogue,
    clearError,
  };
}
