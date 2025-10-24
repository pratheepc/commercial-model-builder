import { Model, ModelUnitType } from './MongoModels.js';

export class ModelService {
  async getAllModels() {
    try {
      const models = await Model.find().sort({ createdAt: -1 });
      return models;
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }

  async getModelById(id) {
    try {
      const model = await Model.findById(id);
      return model;
    } catch (error) {
      console.error('Error fetching model by ID:', error);
      throw error;
    }
  }

  async createModel(modelData) {
    try {
      console.log('Creating model with data:', modelData);
      const newModel = new Model({
        minimum_fee: 0,
        implementation_fee: 0,
        status: 'active',
        modules: [],
        ...modelData
      });
      console.log('Model object before save:', newModel);
      
      const savedModel = await newModel.save();
      
      // Create a default unit type for the model
      const defaultUnitType = new ModelUnitType({
        model_id: savedModel._id,
        name: 'Default Units',
        starting_units: 0,
        growth_type: 'percentage',
        growth_value: 0
      });
      
      await defaultUnitType.save();
      
      console.log('Saved model:', savedModel);
      return savedModel;
    } catch (error) {
      console.error('Error creating model:', error);
      throw error;
    }
  }

  async updateModel(id, updateData) {
    try {
      const updatedModel = await Model.findByIdAndUpdate(
        id, 
        updateData, 
        { new: true, runValidators: true }
      );
      return updatedModel;
    } catch (error) {
      console.error('Error updating model:', error);
      throw error;
    }
  }

  async deleteModel(id) {
    try {
      // Delete all unit types associated with this model
      await ModelUnitType.deleteMany({ model_id: id });
      
      const deletedModel = await Model.findByIdAndDelete(id);
      return deletedModel !== null;
    } catch (error) {
      console.error('Error deleting model:', error);
      throw error;
    }
  }

  async duplicateModel(id) {
    try {
      const originalModel = await Model.findById(id);
      if (!originalModel) return null;
      
      const duplicatedModel = new Model({
        ...originalModel.toObject(),
        _id: undefined,
        name: `${originalModel.name} (Copy)`,
        modules: originalModel.modules.map(module => ({
          ...module.toObject(),
          _id: undefined
        }))
      });
      
      const savedModel = await duplicatedModel.save();
      return savedModel;
    } catch (error) {
      console.error('Error duplicating model:', error);
      throw error;
    }
  }
}
