import express from 'express';
import { authorize, protect } from '../middleware/auth.middleware.js';
import { createAdvertisementDuration, deleteAdvertisementDurationController, getAdvertisementDurations, updateAdvertisementDurationController } from '../controllers/advertisement.duration.controller.js';

const AdvertisementDurationRoutes = express.Router();
AdvertisementDurationRoutes.get('/', getAdvertisementDurations);
AdvertisementDurationRoutes.post('/', protect, authorize('admin', 'super_admin'), createAdvertisementDuration);
AdvertisementDurationRoutes.put('/:id', protect, authorize('admin', 'super_admin'), updateAdvertisementDurationController);
AdvertisementDurationRoutes.delete('/:id', protect, authorize('admin', 'super_admin'), deleteAdvertisementDurationController);
export default AdvertisementDurationRoutes;