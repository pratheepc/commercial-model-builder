import { Model, ModelModule, PricingSlab, ModuleCatalogue, ModelUnitType, CreateModelData, CreateProjectionData, CreateUnitTypeData, Product } from '@/types';
import { modelsApi, moduleCatalogueApi, modelModulesApi, projectionsApi, unitTypesApi, productsApi } from '@/lib/api';

// Helper function to convert MongoDB document to our Model type
function convertMongoModelToModel(mongoModel: any): Model {
  return {
    id: mongoModel._id,
    name: mongoModel.name,
    description: mongoModel.description || '',
    currency: mongoModel.currency || 'USD',
    minimum_fee: mongoModel.minimum_fee || 0,
    implementation_fee: mongoModel.implementation_fee || 0,
    status: mongoModel.status || 'active',
    created_at: mongoModel.createdAt || new Date().toISOString(),
    updated_at: mongoModel.updatedAt || new Date().toISOString(),
    modules: mongoModel.modules?.map((module: any) => ({
      id: module._id || module.id,
      model_id: mongoModel._id,
      unit_type_id: module.unit_type_id,
      module_name: module.module_name,
      pricing_type: module.pricing_type,
      monthly_fee: module.monthly_fee || 0,
      annual_fee: module.annual_fee || 0,
      one_time_fee: module.one_time_fee || 0,
      module_minimum_fee: module.module_minimum_fee || 0,
      module_implementation_fee: module.module_implementation_fee || 0,
      order: module.order || 1,
      slabs: module.slabs?.map((slab: any) => ({
        id: slab._id || slab.id,
        from_units: slab.from_units,
        to_units: slab.to_units,
        rate_per_unit: slab.rate_per_unit,
        fee_type: slab.fee_type,
        parent_type: slab.parent_type,
        parent_id: slab.parent_id
      })) || []
    })) || [],
    unit_types: mongoModel.unit_types || []
  };
}

// Helper function to convert MongoDB document to Product type
function convertMongoProductToProduct(mongoProduct: any): Product {
  return {
    id: mongoProduct._id,
    name: mongoProduct.name,
    description: mongoProduct.description || '',
    created_at: mongoProduct.createdAt || new Date().toISOString(),
    updated_at: mongoProduct.updatedAt || new Date().toISOString()
  };
}

// Helper function to convert MongoDB document to ModuleCatalogue type
function convertMongoModuleToCatalogue(mongoModule: any): ModuleCatalogue {
  return {
    id: mongoModule._id,
    name: mongoModule.name,
    product_id: mongoModule.product_id
  };
}

// Helper function to convert MongoDB unit type to our ModelUnitType type
function convertMongoUnitTypeToUnitType(mongoUnitType: any): ModelUnitType {
  return {
    id: mongoUnitType._id,
    model_id: mongoUnitType.model_id,
    name: mongoUnitType.name,
    starting_units: mongoUnitType.starting_units,
    growth_type: mongoUnitType.growth_type,
    growth_value: mongoUnitType.growth_value,
    created_at: mongoUnitType.createdAt,
    updated_at: mongoUnitType.updatedAt,
  };
}

export const apiDataService = {
  // Model operations
  getModels: async (): Promise<Model[]> => {
    try {
      const mongoModels = await modelsApi.getAll();
      return mongoModels.map(convertMongoModelToModel);
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
    }
  },

  getModel: async (id: string): Promise<Model | null> => {
    try {
      const mongoModel = await modelsApi.getById(id);
      return mongoModel ? convertMongoModelToModel(mongoModel) : null;
    } catch (error) {
      console.error('Error fetching model:', error);
      return null;
    }
  },

  createModel: async (modelData: CreateModelData): Promise<Model | null> => {
    try {
      const mongoModel = await modelsApi.create(modelData);
      return convertMongoModelToModel(mongoModel);
    } catch (error) {
      console.error('Error creating model:', error);
      return null;
    }
  },

  updateModel: async (id: string, updates: Partial<Model>): Promise<Model | null> => {
    try {
      const mongoModel = await modelsApi.update(id, updates);
      return mongoModel ? convertMongoModelToModel(mongoModel) : null;
    } catch (error) {
      console.error('Error updating model:', error);
      return null;
    }
  },

  deleteModel: async (id: string): Promise<boolean> => {
    try {
      await modelsApi.delete(id);
      return true;
    } catch (error) {
      console.error('Error deleting model:', error);
      return false;
    }
  },

  duplicateModel: async (id: string): Promise<Model | null> => {
    try {
      const mongoModel = await modelsApi.duplicate(id);
      return mongoModel ? convertMongoModelToModel(mongoModel) : null;
    } catch (error) {
      console.error('Error duplicating model:', error);
      return null;
    }
  },

  // Module operations
  addModuleToModel: async (modelId: string, moduleData: Omit<ModelModule, 'id' | 'model_id' | 'order'>): Promise<ModelModule | null> => {
    try {
      const mongoModule = await modelModulesApi.addToModel(modelId, moduleData);
      return mongoModule ? {
        id: mongoModule._id || mongoModule.id,
        model_id: modelId,
        unit_type_id: mongoModule.unit_type_id,
        module_name: mongoModule.module_name,
        pricing_type: mongoModule.pricing_type,
        monthly_fee: mongoModule.monthly_fee || 0,
        one_time_fee: mongoModule.one_time_fee || 0,
        module_minimum_fee: mongoModule.module_minimum_fee || 0,
        order: mongoModule.order || 1,
        slabs: mongoModule.slabs || []
      } : null;
    } catch (error) {
      console.error('Error adding module to model:', error);
      return null;
    }
  },

  updateModuleInModel: async (modelId: string, moduleId: string, updates: Partial<ModelModule>): Promise<ModelModule | null> => {
    try {
      const mongoModule = await modelModulesApi.updateInModel(modelId, moduleId, updates);
      return mongoModule ? {
        id: mongoModule._id || mongoModule.id,
        model_id: modelId,
        unit_type_id: mongoModule.unit_type_id,
        module_name: mongoModule.module_name,
        pricing_type: mongoModule.pricing_type,
        monthly_fee: mongoModule.monthly_fee || 0,
        one_time_fee: mongoModule.one_time_fee || 0,
        module_minimum_fee: mongoModule.module_minimum_fee || 0,
        order: mongoModule.order || 1,
        slabs: mongoModule.slabs || []
      } : null;
    } catch (error) {
      console.error('Error updating module in model:', error);
      return null;
    }
  },

  deleteModuleFromModel: async (modelId: string, moduleId: string): Promise<boolean> => {
    try {
      await modelModulesApi.deleteFromModel(modelId, moduleId);
      return true;
    } catch (error) {
      console.error('Error deleting module from model:', error);
      return false;
    }
  },

  // Module Catalogue operations
  getModuleCatalogue: async (): Promise<ModuleCatalogue[]> => {
    try {
      const mongoModules = await moduleCatalogueApi.getAll();
      return mongoModules.map(convertMongoModuleToCatalogue);
    } catch (error) {
      console.error('Error fetching module catalogue:', error);
      return [];
    }
  },

  addModuleToCatalogue: async (moduleData: Omit<ModuleCatalogue, 'id'>): Promise<ModuleCatalogue | null> => {
    try {
      const mongoModule = await moduleCatalogueApi.create(moduleData);
      return mongoModule ? convertMongoModuleToCatalogue(mongoModule) : null;
    } catch (error) {
      console.error('Error adding module to catalogue:', error);
      return null;
    }
  },

  updateModuleInCatalogue: async (id: string, updates: Partial<ModuleCatalogue>): Promise<ModuleCatalogue | null> => {
    try {
      const mongoModule = await moduleCatalogueApi.update(id, updates);
      return mongoModule ? convertMongoModuleToCatalogue(mongoModule) : null;
    } catch (error) {
      console.error('Error updating module in catalogue:', error);
      return null;
    }
  },

  deleteModuleFromCatalogue: async (id: string): Promise<boolean> => {
    try {
      await moduleCatalogueApi.delete(id);
      return true;
    } catch (error) {
      console.error('Error deleting module from catalogue:', error);
      return false;
    }
  },

  // Unit Type operations
  getUnitTypesByModel: async (modelId: string): Promise<ModelUnitType[]> => {
    try {
      const mongoUnitTypes = await unitTypesApi.getByModel(modelId);
      return mongoUnitTypes.map(convertMongoUnitTypeToUnitType);
    } catch (error) {
      console.error('Error fetching unit types:', error);
      return [];
    }
  },

  createUnitType: async (modelId: string, unitTypeData: CreateUnitTypeData): Promise<ModelUnitType | null> => {
    try {
      const mongoUnitType = await unitTypesApi.create({
        model_id: modelId,
        ...unitTypeData
      });
      return mongoUnitType ? convertMongoUnitTypeToUnitType(mongoUnitType) : null;
    } catch (error) {
      console.error('Error creating unit type:', error);
      return null;
    }
  },

  updateUnitType: async (id: string, updateData: Partial<ModelUnitType>): Promise<ModelUnitType | null> => {
    try {
      const mongoUnitType = await unitTypesApi.update(id, updateData);
      return mongoUnitType ? convertMongoUnitTypeToUnitType(mongoUnitType) : null;
    } catch (error) {
      console.error('Error updating unit type:', error);
      return null;
    }
  },

  deleteUnitType: async (id: string): Promise<boolean> => {
    try {
      await unitTypesApi.delete(id);
      return true;
    } catch (error) {
      console.error('Error deleting unit type:', error);
      return false;
    }
  },

  // Projection operations
  createProjection: async (projectionData: CreateProjectionData): Promise<any> => {
    try {
      return await projectionsApi.create(projectionData);
    } catch (error) {
      console.error('Error creating projection:', error);
      return null;
    }
  },

  getProjectionsByModel: async (modelId: string): Promise<any[]> => {
    try {
      return await projectionsApi.getByModel(modelId);
    } catch (error) {
      console.error('Error fetching projections by model:', error);
      return [];
    }
  },

  deleteProjection: async (id: string): Promise<boolean> => {
    try {
      await projectionsApi.delete(id);
      return true;
    } catch (error) {
      console.error('Error deleting projection:', error);
      return false;
    }
  },

  // Product operations
  getAllProducts: async (): Promise<Product[]> => {
    try {
      const mongoProducts = await productsApi.getAll();
      return mongoProducts.map(convertMongoProductToProduct);
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  getProductById: async (id: string): Promise<Product | null> => {
    try {
      const mongoProduct = await productsApi.getById(id);
      return mongoProduct ? convertMongoProductToProduct(mongoProduct) : null;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  },

  createProduct: async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product | null> => {
    try {
      const mongoProduct = await productsApi.create(productData);
      return mongoProduct ? convertMongoProductToProduct(mongoProduct) : null;
    } catch (error) {
      console.error('Error creating product:', error);
      return null;
    }
  },

  updateProduct: async (id: string, updates: Partial<Product>): Promise<Product | null> => {
    try {
      const mongoProduct = await productsApi.update(id, updates);
      return mongoProduct ? convertMongoProductToProduct(mongoProduct) : null;
    } catch (error) {
      console.error('Error updating product:', error);
      return null;
    }
  },

  deleteProduct: async (id: string): Promise<boolean> => {
    try {
      await productsApi.delete(id);
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  }
};
