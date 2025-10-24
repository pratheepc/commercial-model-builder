import express from 'express';
import {
  getUnitTypesByModel,
  createUnitType,
  updateUnitType,
  deleteUnitType
} from '../controllers/unitTypeController.js';

const router = express.Router();

// GET /api/unit-types/model/:modelId - Get all unit types for a model
router.get('/model/:modelId', getUnitTypesByModel);

// POST /api/unit-types - Create a new unit type
router.post('/', createUnitType);

// PUT /api/unit-types/:id - Update a unit type
router.put('/:id', updateUnitType);

// DELETE /api/unit-types/:id - Delete a unit type
router.delete('/:id', deleteUnitType);

export default router;
