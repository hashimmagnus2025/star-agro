import express from 'express';
import {
  createSubCategory,
  getSubCategories,
  getSubCategory,
  updateSubCategoryController,
  deleteSubCategoryController,
} from '../controllers/sub-categories.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import createUploader from '../middleware/multer.middleware.js';

const upload = createUploader('sub-categories');
const SubCategoriesRoutes = express.Router();

SubCategoriesRoutes.get('/', getSubCategories);
SubCategoriesRoutes.get('/:id', getSubCategory);
SubCategoriesRoutes.post('/', protect, authorize('admin', 'super_admin'), upload.single('image'), createSubCategory);
SubCategoriesRoutes.put('/:id', protect, authorize('admin', 'super_admin'), upload.single('image'), updateSubCategoryController);
SubCategoriesRoutes.delete('/:id', protect, authorize('admin', 'super_admin'), deleteSubCategoryController);

export default SubCategoriesRoutes;
