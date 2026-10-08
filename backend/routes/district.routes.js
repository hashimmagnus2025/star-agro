import express from 'express';
import {
  getDistricts,
  getDistrict,
  createDistrictController,
  updateDistrictController,
  deleteDistrictController,
} from '../controllers/district.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const DistrictRoutes = express.Router();

DistrictRoutes.get('/', getDistricts);
DistrictRoutes.get('/:id', getDistrict);
DistrictRoutes.post('/', protect, authorize('admin', 'super_admin'), createDistrictController);
DistrictRoutes.put('/:id', protect, authorize('admin', 'super_admin'), updateDistrictController);
DistrictRoutes.delete('/:id', protect, authorize('admin', 'super_admin'), deleteDistrictController);

export default DistrictRoutes;
