import { UnitTypeService } from '../models/UnitTypeService.js';

// Get all unit types for a specific model
export const getUnitTypesByModel = async (req, res) => {
  try {
    const { modelId } = req.params;
    const unitTypes = await UnitTypeService.getUnitTypesByModel(modelId);
    res.json(unitTypes);
  } catch (error) {
    console.error('Error fetching unit types:', error);
    res.status(500).json({ error: 'Failed to fetch unit types' });
  }
};

// Create a new unit type
export const createUnitType = async (req, res) => {
  try {
    const unitTypeData = req.body;
    const unitType = await UnitTypeService.createUnitType(unitTypeData);
    res.status(201).json(unitType);
  } catch (error) {
    console.error('Error creating unit type:', error);
    res.status(500).json({ error: 'Failed to create unit type' });
  }
};

// Update a unit type
export const updateUnitType = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const unitType = await UnitTypeService.updateUnitType(id, updateData);
    
    if (!unitType) {
      return res.status(404).json({ error: 'Unit type not found' });
    }
    
    res.json(unitType);
  } catch (error) {
    console.error('Error updating unit type:', error);
    res.status(500).json({ error: 'Failed to update unit type' });
  }
};

// Delete a unit type
export const deleteUnitType = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await UnitTypeService.deleteUnitType(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Unit type not found' });
    }
    
    res.json({ message: 'Unit type deleted successfully' });
  } catch (error) {
    console.error('Error deleting unit type:', error);
    res.status(500).json({ error: 'Failed to delete unit type' });
  }
};
