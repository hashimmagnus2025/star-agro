import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { getMyReferrals } from '../controllers/referral.controller.js';

const ReferralRoutes = express.Router();

ReferralRoutes.get('/my-referrals', protect, getMyReferrals);

export default ReferralRoutes;
