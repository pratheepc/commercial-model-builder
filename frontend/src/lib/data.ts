import { Model, ModelModule, PricingSlab, ModuleCatalogue, DEFAULT_MODULE_CATALOGUE } from '@/types';
import { generateId } from '@/lib/utils';
import { modelsApi, moduleCatalogueApi, modelModulesApi, projectionsApi } from '@/lib/api';

// Dynamic module catalogue - can be modified by users
let moduleCatalogue: ModuleCatalogue[] = [...DEFAULT_MODULE_CATALOGUE];

// Mock data storage - in a real app this would be API calls
let models: Model[] = [
  {
    id: 'model-1',
    name: 'Enterprise SaaS',
    description: 'Complete enterprise solution with all modules',
    minimum_fee: 50000,
    implementation_fee: 25000,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    unit_types: [
      {
        id: 'unit-type-1',
        model_id: 'model-1',
        name: 'Default Units',
        starting_units: 100,
        growth_type: 'percentage',
        growth_value: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ],
    modules: [
      {
        id: 'module-1',
        model_id: 'model-1',
        unit_type_id: 'unit-type-1',
        module_name: 'Analytics',
        pricing_type: 'slab',
        monthly_fee: 0,
        annual_fee: 0,
        one_time_fee: 0,
        module_minimum_fee: 5000,
        module_implementation_fee: 0,
        order: 1,
        slabs: [
          {
            id: 'slab-1',
            from_units: 0,
            to_units: 100,
            rate_per_unit: 100,
            fee_type: 'monthly',
            parent_type: 'module',
            parent_id: 'module-1'
          },
          {
            id: 'slab-2',
            from_units: 101,
            to_units: 500,
            rate_per_unit: 75,
            fee_type: 'monthly',
            parent_type: 'module',
            parent_id: 'module-1'
          },
          {
            id: 'slab-3',
            from_units: 501,
            to_units: undefined,
            rate_per_unit: 50,
            fee_type: 'monthly',
            parent_type: 'module',
            parent_id: 'module-1'
          }
        ]
      },
      {
        id: 'module-2',
        model_id: 'model-1',
        unit_type_id: 'unit-type-1',
        module_name: 'Support',
        pricing_type: 'flat',
        monthly_fee: 10000,
        annual_fee: 0,
        one_time_fee: 0,
        module_minimum_fee: 0,
        module_implementation_fee: 0,
        order: 2,
        slabs: []
      }
    ]
  }
];

export const dataService = {
  // Model operations
  getModels: (): Model[] => {
    return [...models];
  },

  getModel: (id: string): Model | undefined => {
    return models.find(m => m.id === id);
  },

  createModel: (modelData: Omit<Model, 'id' | 'created_at' | 'updated_at' | 'modules' | 'starting_unit_count' | 'minimum_fee' | 'implementation_fee' | 'status'>): Model => {
    const newModel: Model = {
      ...modelData,
      minimum_fee: 0,
      implementation_fee: 0,
      status: 'active',
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      modules: []
    };
    models.push(newModel);
    return newModel;
  },

  updateModel: (id: string, updates: Partial<Model>): Model | null => {
    const index = models.findIndex(m => m.id === id);
    if (index === -1) return null;
    
    models[index] = {
      ...models[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    return models[index];
  },

  deleteModel: (id: string): boolean => {
    const index = models.findIndex(m => m.id === id);
    if (index === -1) return false;
    models.splice(index, 1);
    return true;
  },

  duplicateModel: (id: string, newName: string): Model | null => {
    const original = models.find(m => m.id === id);
    if (!original) return null;

    const duplicated: Model = {
      ...original,
      id: generateId(),
      name: newName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      modules: original.modules.map(module => ({
        ...module,
        id: generateId(),
        model_id: '', // Will be set after model is created
        slabs: module.slabs.map(slab => ({
          ...slab,
          id: generateId(),
          parent_id: '' // Will be set after module is created
        }))
      }))
    };

    // Update module and slab IDs
    duplicated.modules.forEach(module => {
      module.model_id = duplicated.id;
      module.slabs.forEach(slab => {
        slab.parent_id = module.id;
      });
    });

    models.push(duplicated);
    return duplicated;
  },

  // Module operations
  addModule: (modelId: string, moduleData: Omit<ModelModule, 'id' | 'model_id' | 'order' | 'slabs'>): ModelModule | null => {
    const model = models.find(m => m.id === modelId);
    if (!model) return null;

    const newModule: ModelModule = {
      ...moduleData,
      id: generateId(),
      model_id: modelId,
      order: model.modules.length + 1,
      slabs: []
    };

    model.modules.push(newModule);
    model.updated_at = new Date().toISOString();
    return newModule;
  },

  updateModule: (modelId: string, moduleId: string, updates: Partial<ModelModule>): ModelModule | null => {
    const model = models.find(m => m.id === modelId);
    if (!model) return null;

    const moduleIndex = model.modules.findIndex(m => m.id === moduleId);
    if (moduleIndex === -1) return null;

    model.modules[moduleIndex] = {
      ...model.modules[moduleIndex],
      ...updates
    };
    model.updated_at = new Date().toISOString();
    return model.modules[moduleIndex];
  },

  deleteModule: (modelId: string, moduleId: string): boolean => {
    const model = models.find(m => m.id === modelId);
    if (!model) return false;

    const moduleIndex = model.modules.findIndex(m => m.id === moduleId);
    if (moduleIndex === -1) return false;

    model.modules.splice(moduleIndex, 1);
    model.updated_at = new Date().toISOString();
    return true;
  },

  // Slab operations
  addSlab: (modelId: string, moduleId: string, slabData: Omit<PricingSlab, 'id' | 'parent_type' | 'parent_id'>): PricingSlab | null => {
    const model = models.find(m => m.id === modelId);
    if (!model) return null;

    const module = model.modules.find(m => m.id === moduleId);
    if (!module) return null;

    const newSlab: PricingSlab = {
      ...slabData,
      id: generateId(),
      parent_type: 'module',
      parent_id: moduleId
    };

    module.slabs.push(newSlab);
    model.updated_at = new Date().toISOString();
    return newSlab;
  },

  updateSlab: (modelId: string, moduleId: string, slabId: string, updates: Partial<PricingSlab>): PricingSlab | null => {
    const model = models.find(m => m.id === modelId);
    if (!model) return null;

    const module = model.modules.find(m => m.id === moduleId);
    if (!module) return null;

    const slabIndex = module.slabs.findIndex(s => s.id === slabId);
    if (slabIndex === -1) return null;

    module.slabs[slabIndex] = {
      ...module.slabs[slabIndex],
      ...updates
    };
    model.updated_at = new Date().toISOString();
    return module.slabs[slabIndex];
  },

  deleteSlab: (modelId: string, moduleId: string, slabId: string): boolean => {
    const model = models.find(m => m.id === modelId);
    if (!model) return false;

    const module = model.modules.find(m => m.id === moduleId);
    if (!module) return false;

    const slabIndex = module.slabs.findIndex(s => s.id === slabId);
    if (slabIndex === -1) return false;

    module.slabs.splice(slabIndex, 1);
    model.updated_at = new Date().toISOString();
    return true;
  },

  // Module Catalogue operations
  getModuleCatalogue: (): ModuleCatalogue[] => {
    return [...moduleCatalogue];
  },

  addModuleToCatalogue: (module: Omit<ModuleCatalogue, 'id'>): ModuleCatalogue => {
    const newModule: ModuleCatalogue = {
      ...module,
      id: generateId()
    };
    moduleCatalogue.push(newModule);
    return newModule;
  },

  updateModuleInCatalogue: (id: string, updates: Partial<ModuleCatalogue>): ModuleCatalogue | null => {
    const index = moduleCatalogue.findIndex(m => m.id === id);
    if (index === -1) return null;
    
    moduleCatalogue[index] = {
      ...moduleCatalogue[index],
      ...updates
    };
    return moduleCatalogue[index];
  },

  deleteModuleFromCatalogue: (id: string): boolean => {
    const index = moduleCatalogue.findIndex(m => m.id === id);
    if (index === -1) return false;
    moduleCatalogue.splice(index, 1);
    return true;
  },

  setModuleCatalogue: (catalogue: ModuleCatalogue[]): void => {
    moduleCatalogue = [...catalogue];
  }
};
