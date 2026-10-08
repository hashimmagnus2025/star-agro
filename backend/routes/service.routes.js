import express from 'express';
import createUploader from '../middleware/multer.middleware.js';
import {
  createService,
  getServices,
  getMyServices,
  getService,
  updateServiceController,
  updateServiceStatusController,
  updateServiceActiveController,
  deleteServiceController,
} from '../controllers/service.controller.js';
import { protect, optionalAuth, authorize, hasPermission } from '../middleware/auth.middleware.js';
import { requireCompleteProfile } from '../middleware/profile.middleware.js';

const upload = createUploader('services', 30 * 1024 * 1024);
const router = express.Router();

router.get('/', optionalAuth, getServices);
router.get('/my-services', protect, hasPermission('service.view'), getMyServices);
router.get('/:id', getService);
router.post('/', protect, requireCompleteProfile, hasPermission('service.create'), upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 },
]), createService);
router.put('/:id', protect, hasPermission('service.edit'), upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 },
]), updateServiceController);
router.put('/:id/status', protect, authorize('admin', 'super_admin'), updateServiceStatusController);
router.put('/:id/active', protect, updateServiceActiveController);
router.delete('/:id', protect, hasPermission('service.delete'), deleteServiceController);

export default router;
