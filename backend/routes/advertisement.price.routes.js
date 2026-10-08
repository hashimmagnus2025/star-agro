import express from 'express';
import { authorize, protect } from '../middleware/auth.middleware.js';
import { createAdvertisementPrice, deleteAdvertisementPriceController, getAdvertisementPrices, updateAdvertisementPriceController } from '../controllers/advertisement.price.controller.js';

const AdvertisementPriceRoutes = express.Router();
AdvertisementPriceRoutes.get('/', getAdvertisementPrices);
AdvertisementPriceRoutes.post('/', protect, authorize('admin', 'super_admin'), createAdvertisementPrice);
AdvertisementPriceRoutes.put('/:id', protect, authorize('admin', 'super_admin'), updateAdvertisementPriceController);
AdvertisementPriceRoutes.delete('/:id', protect, authorize('admin', 'super_admin'), deleteAdvertisementPriceController);
export default AdvertisementPriceRoutes;
