import express from 'express';
import createUploader from '../middleware/multer.middleware.js';
import {
    createAdvertisement,
    getAdvertisements,
    getActiveAdvertisementsController,
    getAdvertisementByIds,
    updateAdvertisementController,
    deleteAdvertisementController,
} from '../controllers/advertisement.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const upload = createUploader('advertisements');
const AdvertisementRoutes = express.Router();

AdvertisementRoutes.get('/', getAdvertisements);
AdvertisementRoutes.get('/active', getActiveAdvertisementsController);
AdvertisementRoutes.get('/:id', getAdvertisementByIds);
AdvertisementRoutes.post('/', protect, authorize('admin', 'super_admin'), upload.single('image'), createAdvertisement);
AdvertisementRoutes.put('/:id', protect, authorize('admin', 'super_admin'), upload.single('image'), updateAdvertisementController);
AdvertisementRoutes.delete('/:id', protect, authorize('admin', 'super_admin'), deleteAdvertisementController);


export default AdvertisementRoutes;



