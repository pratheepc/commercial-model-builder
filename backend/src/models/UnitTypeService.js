import { ModelUnitType, Model } from './MongoModels.js';

export class UnitTypeService {
  // Get all unit types for a specific model
  static async getUnitTypesByModel(modelId) {
    try {
      const unitTypes = await ModelUnitType.find({ model_id: modelId })
        .sort({ createdAt: 1 });
      return unitTypes;
    } catch (error) {
      console.error('Error fetching unit types by model:', error);
      throw error;
    }
  }

  // Create a new unit type
  static async createUnitType(unitTypeData) {
    try {
      // Validate that the model exists
      const model = await Model.findById(unitTypeData.model_id);
      if (!model) {
        throw new Error('Model not found');
      }

      // Check if unit type name is unique within the model
      const existingUnitType = await ModelUnitType.findOne({
        model_id: unitTypeData.model_id,
        name: unitTypeData.name
      });

      if (existingUnitType) {
        throw new Error('Unit type name must be unique within a model');
      }

      const unitType = new ModelUnitType(unitTypeData);
      await unitType.save();
      return unitType;
    } catch (error) {
      console.error('Error creating unit type:', error);
      throw error;
    }
  }

  // Update a unit type
  static async updateUnitType(id, updateData) {
    try {
      // If name is being updated, check for uniqueness within the model
      if (updateData.name) {
        const currentUnitType = await ModelUnitType.findById(id);
        if (currentUnitType) {
          const existingUnitType = await ModelUnitType.findOne({
            model_id: currentUnitType.model_id,
            name: updateData.name,
            _id: { $ne: id }
          });

          if (existingUnitType) {
            throw new Error('Unit type name must be unique within a model');
          }
        }
      }

      const unitType = await ModelUnitType.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      return unitType;
    } catch (error) {
      console.error('Error updating unit type:', error);
      throw error;
    }
  }

  // Delete a unit type
  static async deleteUnitType(id) {
    try {
      // Check if any modules are using this unit type
      const Model = (await import('./MongoModels.js')).Model;
      const modulesUsingUnitType = await Model.findOne({
        'modules.unit_type_id': id
      });

      if (modulesUsingUnitType) {
        throw new Error('Cannot delete unit type that is being used by modules');
      }

      const result = await ModelUnitType.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      console.error('Error deleting unit type:', error);
      throw error;
    }
  }

  // Get unit type by ID
  static async getUnitTypeById(id) {
    try {
      const unitType = await ModelUnitType.findById(id);
      return unitType;
    } catch (error) {
      console.error('Error fetching unit type by ID:', error);
      throw error;
    }
  }
}
