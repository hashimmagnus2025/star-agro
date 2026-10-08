import express from 'express';
import createUploader from '../middleware/multer.middleware.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { createHowToUse, getHowToUse, updateHowToUseItem, removeHowToUse } from '../controllers/howToUse.controller.js';

const HowToUseRoutes = express.Router();
const upload = createUploader('how-to-use', 500 * 1024 * 1024);

HowToUseRoutes.get('/', getHowToUse);
HowToUseRoutes.post('/', protect, authorize('admin', 'super_admin'), upload.single('video'), createHowToUse);
HowToUseRoutes.put('/:id', protect, authorize('admin', 'super_admin'), upload.single('video'), updateHowToUseItem);
HowToUseRoutes.delete('/:id', protect, authorize('admin', 'super_admin'), removeHowToUse);

export default HowToUseRoutes;