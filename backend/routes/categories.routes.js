import express from 'express';
import createUploader from '../middleware/multer.middleware.js';
import {
  createCategory,
  getCategories,
  getCategory,
  updateCategoryController,
  deleteCategoryController,
} from '../controllers/categories.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const upload = createUploader('categories');
const CategoriesRoutes = express.Router();

CategoriesRoutes.get('/', getCategories);
CategoriesRoutes.get('/:id', getCategory);
CategoriesRoutes.post('/', protect, authorize('admin', 'super_admin'), upload.single('image'), createCategory);
CategoriesRoutes.put('/:id', protect, authorize('admin', 'super_admin'), upload.single('image'), updateCategoryController);
CategoriesRoutes.delete('/:id', protect, authorize('admin', 'super_admin'), deleteCategoryController);

export default CategoriesRoutes;
