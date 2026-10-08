import express from 'express';
import {
  assignJurisdiction,
  removeJurisdiction,
  getJurisdictionForUser,
  getMyTeam,
  getTalukaTeam,
  getVillageTeam,
} from '../controllers/jurisdiction.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const JurisdictionRoutes = express.Router();

JurisdictionRoutes.get('/my-team', protect, getMyTeam);
JurisdictionRoutes.get('/my-team/talukas/:talukaId', protect, getTalukaTeam);
JurisdictionRoutes.get('/my-team/villages/:villageId', protect, getVillageTeam);
JurisdictionRoutes.get('/:userId', protect, authorize('admin', 'super_admin'), getJurisdictionForUser);
JurisdictionRoutes.put('/:userId', protect, authorize('admin', 'super_admin'), assignJurisdiction);
JurisdictionRoutes.delete('/:userId', protect, authorize('admin', 'super_admin'), removeJurisdiction);

export default JurisdictionRoutes;
