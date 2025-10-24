import { ModuleCatalogue, Model, ModelUnitType } from './MongoModels.js';

// Default module catalogue
const DEFAULT_MODULE_CATALOGUE = [
  { name: 'Analytics' },
  { name: 'Support' },
  { name: 'Storage' },
  { name: 'API Access' },
  { name: 'Security' },
  { name: 'Integration' },
  { name: 'Customization' },
  { name: 'Training' },
];

export class ModuleService {
  constructor() {
    this.initialized = false;
  }

  // Initialize default catalogue if empty (only once)
  async initializeDefaultCatalogue() {
    if (this.initialized) return;
    
    try {
      const count = await ModuleCatalogue.countDocuments();
      if (count === 0) {
        await ModuleCatalogue.insertMany(DEFAULT_MODULE_CATALOGUE);
        console.log('✅ Default module catalogue initialized');
      }
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing default catalogue:', error);
    }
  }

  // Module Catalogue Methods
  
  async getModuleCatalogue() {
    try {
      await this.initializeDefaultCatalogue();
      const catalogue = await ModuleCatalogue.find().sort({ name: 1 });
      return catalogue;
    } catch (error) {
      console.error('Error fetching module catalogue:', error);
      throw error;
    }
  }

  async addModuleToCatalogue(moduleData) {
    try {
      const newModule = new ModuleCatalogue(moduleData);
      const savedModule = await newModule.save();
      return savedModule;
    } catch (error) {
      console.error('Error adding module to catalogue:', error);
      throw error;
    }
  }

  async updateModuleInCatalogue(id, updateData) {
    try {
      const updatedModule = await ModuleCatalogue.findByIdAndUpdate(
        id, 
        updateData, 
        { new: true, runValidators: true }
      );
      return updatedModule;
    } catch (error) {
      console.error('Error updating module in catalogue:', error);
      throw error;
    }
  }

  async deleteModuleFromCatalogue(id) {
    try {
      const deletedModule = await ModuleCatalogue.findByIdAndDelete(id);
      return deletedModule !== null;
    } catch (error) {
      console.error('Error deleting module from catalogue:', error);
      throw error;
    }
  }

  // Model Module Methods
  
  async addModuleToModel(modelId, moduleData) {
    try {
      const model = await Model.findById(modelId);
      if (!model) return null;

      // Validate that the unit type exists
      const unitType = await ModelUnitType.findById(moduleData.unit_type_id);
      if (!unitType) {
        throw new Error('Unit type not found');
      }

      const newModule = {
        ...moduleData,
        order: model.modules.length + 1
      };

      model.modules.push(newModule);
      const savedModel = await model.save();
      
      return savedModel.modules[savedModel.modules.length - 1];
    } catch (error) {
      console.error('Error adding module to model:', error);
      throw error;
    }
  }

  async updateModuleInModel(modelId, moduleId, updateData) {
    try {
      const model = await Model.findById(modelId);
      if (!model) return null;

      // If unit_type_id is being updated, validate it exists
      if (updateData.unit_type_id) {
        const unitType = await ModelUnitType.findById(updateData.unit_type_id);
        if (!unitType) {
          throw new Error('Unit type not found');
        }
      }

      const moduleIndex = model.modules.findIndex(module => module._id.toString() === moduleId);
      if (moduleIndex === -1) return null;

      model.modules[moduleIndex] = {
        ...model.modules[moduleIndex].toObject(),
        ...updateData
      };

      const savedModel = await model.save();
      return savedModel.modules[moduleIndex];
    } catch (error) {
      console.error('Error updating module in model:', error);
      throw error;
    }
  }

  async deleteModuleFromModel(modelId, moduleId) {
    try {
      const model = await Model.findById(modelId);
      if (!model) return false;

      const moduleIndex = model.modules.findIndex(module => module._id.toString() === moduleId);
      if (moduleIndex === -1) return false;

      model.modules.splice(moduleIndex, 1);
      await model.save();
      return true;
    } catch (error) {
      console.error('Error deleting module from model:', error);
      throw error;
    }
  }
}
