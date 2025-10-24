import express from 'express';
import { 
  createProjection,
  getProjectionsByModel,
  getProjectionById,
  deleteProjection
} from '../controllers/projectionController.js';

const router = express.Router();

// POST /api/projections - Create new projection
router.post('/', createProjection);

// GET /api/projections/model/:modelId - Get projections for a model
router.get('/model/:modelId', getProjectionsByModel);

// GET /api/projections/:id - Get projection by ID
router.get('/:id', getProjectionById);

// DELETE /api/projections/:id - Delete projection
router.delete('/:id', deleteProjection);

export default router;
