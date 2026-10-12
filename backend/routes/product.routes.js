import express from 'express';
import {
    createProduct,
    getProducts,
    getProduct,
    updateProductController,
    updateProductStatusController,
    updateProductActiveController,
    deleteProductController,
    getMyProducts,
    getDistrictTeamProducts,
    markProductDestroyController,
    claimProductDestroyController,
    getDestroyListingsController,
} from '../controllers/product.controller.js';
import { protect, optionalAuth, hasPermission } from '../middleware/auth.middleware.js';

import createUploader from '../middleware/multer.middleware.js'
const upload = createUploader('products', 500 * 1024 * 1024); // 500MB to handle both image and video

const router = express.Router();

// Routes
router.get('/', optionalAuth, getProducts);
router.get('/my-products', protect, hasPermission('product.view'), getMyProducts);
router.get('/district-team', protect, hasPermission('product.approve'), getDistrictTeamProducts);
router.get('/destroy-listings', protect, getDestroyListingsController);
router.get('/:id', getProduct);
router.post('/', protect, hasPermission('product.create'), upload.fields([{ name: 'image', maxCount: 1 }, { name: 'product_video', maxCount: 1 }]), createProduct);
router.put('/:id', protect, hasPermission('product.edit'), upload.fields([{ name: 'image', maxCount: 1 }, { name: 'product_video', maxCount: 1 }]), updateProductController);
router.put('/:id/status', protect, hasPermission('product.approve'), updateProductStatusController);
router.put('/:id/active', protect, updateProductActiveController);
router.post('/:id/mark-destroy', protect, markProductDestroyController);
router.post('/:id/claim-destroy', protect, claimProductDestroyController);
router.delete('/:id', protect, hasPermission('product.delete'), deleteProductController);

export default router;
