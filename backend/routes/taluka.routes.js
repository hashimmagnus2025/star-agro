import express from 'express';
import {
  getTalukas,
  getTaluka,
  createTalukaController,
  updateTalukaController,
  deleteTalukaController,
} from '../controllers/taluka.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const TalukaRoutes = express.Router();

TalukaRoutes.get('/', getTalukas);
TalukaRoutes.get('/:id', getTaluka);
TalukaRoutes.post('/', protect, authorize('admin', 'super_admin'), createTalukaController);
TalukaRoutes.put('/:id', protect, authorize('admin', 'super_admin'), updateTalukaController);
TalukaRoutes.delete('/:id', protect, authorize('admin', 'super_admin'), deleteTalukaController);

export default TalukaRoutes;
