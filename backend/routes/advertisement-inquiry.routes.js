import express from 'express';
import {
  saveAdvertisementInquiry,
  getAdvertisementInquiries,
  getAdvertisementInquiry,
} from '../controllers/advertisement-inquiry.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const AdvertisementInquiryRouter = express.Router();

AdvertisementInquiryRouter.post('/', saveAdvertisementInquiry);
AdvertisementInquiryRouter.get('/', protect, authorize('admin', 'super_admin'), getAdvertisementInquiries);
AdvertisementInquiryRouter.get('/:id', protect, authorize('admin', 'super_admin'), getAdvertisementInquiry);

export default AdvertisementInquiryRouter;
