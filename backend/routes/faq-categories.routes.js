import express from 'express';
import { createFaqCategory, deleteFaqCategoryController, getFaqCategories, updateFaqCategoryController } from '../controllers/faq-categories.controller.js';
import { authorize, protect } from '../middleware/auth.middleware.js';

const FaqCategoriesRoutes = express.Router();
FaqCategoriesRoutes.get('/', getFaqCategories);
FaqCategoriesRoutes.post('/', protect, authorize('admin', 'super_admin'), createFaqCategory);
FaqCategoriesRoutes.put('/:id', protect, authorize('admin', 'super_admin'), updateFaqCategoryController);
FaqCategoriesRoutes.delete('/:id', protect, authorize('admin', 'super_admin'), deleteFaqCategoryController);
export default FaqCategoriesRoutes;
