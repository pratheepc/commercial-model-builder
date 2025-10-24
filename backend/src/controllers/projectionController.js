import { ProjectionService } from '../models/ProjectionService.js';

const projectionService = new ProjectionService();

// POST /api/projections
export const createProjection = async (req, res) => {
  try {
    const newProjection = await projectionService.createProjection(req.body);
    res.status(201).json(newProjection);
  } catch (error) {
    console.error('Error creating projection:', error);
    res.status(500).json({ error: 'Failed to create projection' });
  }
};

// GET /api/projections/model/:modelId
export const getProjectionsByModel = async (req, res) => {
  try {
    const { modelId } = req.params;
    const projections = await projectionService.getProjectionsByModel(modelId);
    res.json(projections);
  } catch (error) {
    console.error('Error fetching projections:', error);
    res.status(500).json({ error: 'Failed to fetch projections' });
  }
};

// GET /api/projections/:id
export const getProjectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const projection = await projectionService.getProjectionById(id);
    
    if (!projection) {
      return res.status(404).json({ error: 'Projection not found' });
    }
    
    res.json(projection);
  } catch (error) {
    console.error('Error fetching projection:', error);
    res.status(500).json({ error: 'Failed to fetch projection' });
  }
};

// DELETE /api/projections/:id
export const deleteProjection = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await projectionService.deleteProjection(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Projection not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting projection:', error);
    res.status(500).json({ error: 'Failed to delete projection' });
  }
};
