import express from 'express';
import {
  getStates,
  getState,
  createStateController,
  updateStateController,
  deleteStateController,
} from '../controllers/state.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const StateRoutes = express.Router();

StateRoutes.get('/', getStates);
StateRoutes.get('/:id', getState);
StateRoutes.post('/', protect, authorize('admin', 'super_admin'), createStateController);
StateRoutes.put('/:id', protect, authorize('admin', 'super_admin'), updateStateController);
StateRoutes.delete('/:id', protect, authorize('admin', 'super_admin'), deleteStateController);

export default StateRoutes;
