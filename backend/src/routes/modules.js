import express from 'express';
import { 
  getModuleCatalogue,
  addModuleToCatalogue,
  updateModuleInCatalogue,
  deleteModuleFromCatalogue,
  addModuleToModel,
  updateModuleInModel,
  deleteModuleFromModel
} from '../controllers/moduleController.js';

const router = express.Router();

// Module Catalogue Routes
// GET /api/modules/catalogue - Get module catalogue
router.get('/catalogue', getModuleCatalogue);

// POST /api/modules/catalogue - Add module to catalogue
router.post('/catalogue', addModuleToCatalogue);

// PUT /api/modules/catalogue/:id - Update module in catalogue
router.put('/catalogue/:id', updateModuleInCatalogue);

// DELETE /api/modules/catalogue/:id - Delete module from catalogue
router.delete('/catalogue/:id', deleteModuleFromCatalogue);

// Model Module Routes
// POST /api/modules/model/:modelId - Add module to model
router.post('/model/:modelId', addModuleToModel);

// PUT /api/modules/model/:modelId/:moduleId - Update module in model
router.put('/model/:modelId/:moduleId', updateModuleInModel);

// DELETE /api/modules/model/:modelId/:moduleId - Delete module from model
router.delete('/model/:modelId/:moduleId', deleteModuleFromModel);

export default router;
