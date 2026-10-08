import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { createRazorpayOrder, verifyRazorpayPayment, getWalletSummary } from '../controllers/wallet.controller.js';

const WalletRoutes = express.Router();

WalletRoutes.post('/create-order', protect, createRazorpayOrder);
WalletRoutes.post('/verify-payment', protect, verifyRazorpayPayment);
WalletRoutes.get('/summary', protect, getWalletSummary);

export default WalletRoutes;
