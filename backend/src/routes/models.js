import express from 'express';
import { 
  getAllModels, 
  getModelById, 
  createModel, 
  updateModel, 
  deleteModel,
  duplicateModel 
} from '../controllers/modelController.js';

const router = express.Router();

// GET /api/models - Get all models
router.get('/', getAllModels);

// GET /api/models/:id - Get model by ID
router.get('/:id', getModelById);

// POST /api/models - Create new model
router.post('/', createModel);

// PUT /api/models/:id - Update model
router.put('/:id', updateModel);

// DELETE /api/models/:id - Delete model
router.delete('/:id', deleteModel);

// POST /api/models/:id/duplicate - Duplicate model
router.post('/:id/duplicate', duplicateModel);

export default router;
