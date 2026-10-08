import express from 'express';
import {
  createType,
  getTypes,
  getTypeByIdController,
  updateTypeController,
  deleteTypeController,
} from '../controllers/type.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const typeRouter = express.Router();

typeRouter.get('/', getTypes);
typeRouter.get('/:id', getTypeByIdController);
typeRouter.post('/', protect, authorize('admin', 'super_admin'), createType);
typeRouter.put('/:id', protect, authorize('admin', 'super_admin'), updateTypeController);
typeRouter.delete('/:id', protect, authorize('admin', 'super_admin'), deleteTypeController);

export default typeRouter;
