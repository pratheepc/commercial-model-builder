import { ModuleService } from '../models/ModuleService.js';

const moduleService = new ModuleService();

// Module Catalogue Routes

// GET /api/modules/catalogue
export const getModuleCatalogue = async (req, res) => {
  try {
    const catalogue = await moduleService.getModuleCatalogue();
    res.json(catalogue);
  } catch (error) {
    console.error('Error fetching module catalogue:', error);
    res.status(500).json({ error: 'Failed to fetch module catalogue' });
  }
};

// POST /api/modules/catalogue
export const addModuleToCatalogue = async (req, res) => {
  try {
    const newModule = await moduleService.addModuleToCatalogue(req.body);
    res.status(201).json(newModule);
  } catch (error) {
    console.error('Error adding module to catalogue:', error);
    res.status(500).json({ error: 'Failed to add module to catalogue' });
  }
};

// PUT /api/modules/catalogue/:id
export const updateModuleInCatalogue = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedModule = await moduleService.updateModuleInCatalogue(id, req.body);
    
    if (!updatedModule) {
      return res.status(404).json({ error: 'Module not found' });
    }
    
    res.json(updatedModule);
  } catch (error) {
    console.error('Error updating module in catalogue:', error);
    res.status(500).json({ error: 'Failed to update module in catalogue' });
  }
};

// DELETE /api/modules/catalogue/:id
export const deleteModuleFromCatalogue = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await moduleService.deleteModuleFromCatalogue(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Module not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting module from catalogue:', error);
    res.status(500).json({ error: 'Failed to delete module from catalogue' });
  }
};

// Model Module Routes

// POST /api/modules/model/:modelId
export const addModuleToModel = async (req, res) => {
  try {
    const { modelId } = req.params;
    const newModule = await moduleService.addModuleToModel(modelId, req.body);
    
    if (!newModule) {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    res.status(201).json(newModule);
  } catch (error) {
    console.error('Error adding module to model:', error);
    res.status(500).json({ error: 'Failed to add module to model' });
  }
};

// PUT /api/modules/model/:modelId/:moduleId
export const updateModuleInModel = async (req, res) => {
  try {
    const { modelId, moduleId } = req.params;
    const updatedModule = await moduleService.updateModuleInModel(modelId, moduleId, req.body);
    
    if (!updatedModule) {
      return res.status(404).json({ error: 'Module or model not found' });
    }
    
    res.json(updatedModule);
  } catch (error) {
    console.error('Error updating module in model:', error);
    res.status(500).json({ error: 'Failed to update module in model' });
  }
};

// DELETE /api/modules/model/:modelId/:moduleId
export const deleteModuleFromModel = async (req, res) => {
  try {
    const { modelId, moduleId } = req.params;
    const deleted = await moduleService.deleteModuleFromModel(modelId, moduleId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Module or model not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting module from model:', error);
    res.status(500).json({ error: 'Failed to delete module from model' });
  }
};
