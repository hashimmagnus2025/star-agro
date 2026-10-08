import express from 'express';
import { createAdvertisementSize, deleteAdvertisementSizeController, getAdvertisementSizes, updateAdvertisementSizeController } from '../controllers/advertisement.size.controller.js';
import { authorize, protect } from '../middleware/auth.middleware.js';

const AdvertisementSizeRoutes = express.Router();
AdvertisementSizeRoutes.get('/', getAdvertisementSizes);
AdvertisementSizeRoutes.post('/', protect, authorize('admin', 'super_admin'), createAdvertisementSize);
AdvertisementSizeRoutes.put('/:id', protect, authorize('admin', 'super_admin'), updateAdvertisementSizeController);
AdvertisementSizeRoutes.delete('/:id', protect, authorize('admin', 'super_admin'), deleteAdvertisementSizeController);
export default AdvertisementSizeRoutes;
