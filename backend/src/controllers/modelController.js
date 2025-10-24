import { ModelService } from '../models/ModelService.js';

const modelService = new ModelService();

// GET /api/models
export const getAllModels = async (req, res) => {
  try {
    const models = await modelService.getAllModels();
    res.json(models);
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
};

// GET /api/models/:id
export const getModelById = async (req, res) => {
  try {
    const { id } = req.params;
    const model = await modelService.getModelById(id);
    
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    res.json(model);
  } catch (error) {
    console.error('Error fetching model:', error);
    res.status(500).json({ error: 'Failed to fetch model' });
  }
};

// POST /api/models
export const createModel = async (req, res) => {
  try {
    const newModel = await modelService.createModel(req.body);
    res.status(201).json(newModel);
  } catch (error) {
    console.error('Error creating model:', error);
    res.status(500).json({ error: 'Failed to create model' });
  }
};

// PUT /api/models/:id
export const updateModel = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedModel = await modelService.updateModel(id, req.body);
    
    if (!updatedModel) {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    res.json(updatedModel);
  } catch (error) {
    console.error('Error updating model:', error);
    res.status(500).json({ error: 'Failed to update model' });
  }
};

// DELETE /api/models/:id
export const deleteModel = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await modelService.deleteModel(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting model:', error);
    res.status(500).json({ error: 'Failed to delete model' });
  }
};

// POST /api/models/:id/duplicate
export const duplicateModel = async (req, res) => {
  try {
    const { id } = req.params;
    const duplicatedModel = await modelService.duplicateModel(id);
    
    if (!duplicatedModel) {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    res.status(201).json(duplicatedModel);
  } catch (error) {
    console.error('Error duplicating model:', error);
    res.status(500).json({ error: 'Failed to duplicate model' });
  }
};
