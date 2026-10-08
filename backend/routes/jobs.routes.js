import express from 'express';
import createUploader from '../middleware/multer.middleware.js';
import {
  saveJobApplication,
  getJobApplications,
  getJobApplication,
  updateJobApplicationStatusController,
  deleteJobApplicationController,
} from '../controllers/jobs.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const upload = createUploader('jobs');
const JobsRouter = express.Router();

JobsRouter.post('/', upload.single('cv_file'), saveJobApplication);
JobsRouter.get('/', protect, authorize('admin', 'super_admin'), getJobApplications);
JobsRouter.get('/:id', protect, authorize('admin', 'super_admin'), getJobApplication);
JobsRouter.put('/:id/status', protect, authorize('admin', 'super_admin'), updateJobApplicationStatusController);
JobsRouter.delete('/:id', protect, authorize('admin', 'super_admin'), deleteJobApplicationController);

export default JobsRouter;
