import express from 'express';
import {
  getVillages,
  getVillage,
  createVillageController,
  updateVillageController,
  deleteVillageController,
} from '../controllers/village.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const VillageRoutes = express.Router();

VillageRoutes.get('/', getVillages);
VillageRoutes.get('/:id', getVillage);
VillageRoutes.post('/', protect, authorize('admin', 'super_admin'), createVillageController);
VillageRoutes.put('/:id', protect, authorize('admin', 'super_admin'), updateVillageController);
VillageRoutes.delete('/:id', protect, authorize('admin', 'super_admin'), deleteVillageController);

export default VillageRoutes;
