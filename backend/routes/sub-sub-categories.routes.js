import express from 'express';
import * as SubSubCategoriesController from '../controllers/sub-sub-categories.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import createUploader from '../middleware/multer.middleware.js';

const SubSubCategoriesRoutes = express.Router();
const uploader = createUploader("sub-sub-categories");

SubSubCategoriesRoutes.get('/',  SubSubCategoriesController.getAllSubSubCategories);
SubSubCategoriesRoutes.get('/:id', SubSubCategoriesController.getSubSubCategoryById);
SubSubCategoriesRoutes.post('/',  protect, authorize('admin', 'super_admin'), uploader.single('image'), SubSubCategoriesController.createSubSubCategory);
SubSubCategoriesRoutes.put('/:id', protect, authorize('admin', 'super_admin'), uploader.single('image'), SubSubCategoriesController.updateSubSubCategory);
SubSubCategoriesRoutes.delete('/:id', protect, authorize('admin', 'super_admin'), uploader.single('image'), SubSubCategoriesController.deleteSubSubCategory);

export default SubSubCategoriesRoutes;
