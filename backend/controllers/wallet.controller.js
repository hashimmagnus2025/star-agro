import crypto from 'crypto';
import axios from 'axios';
import { createWalletTransaction, updateWalletTransaction, getWalletBalance, getWalletTransactions, getTotalWalletBalance } from '../models/wallet.model.js';

const RAZORPAY_KEY_ID = process.env.NEXT_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.NEXT_RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;
const USE_MOCK_RAZORPAY = process.env.USE_MOCK_RAZORPAY === 'true';

const toRupee = (amount) => Number(amount || 0);
const toPoints = (amount) => Math.round(Number(amount || 0) * 1);

export const createRazorpayOrder = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { amount } = req.body;
    const numericAmount = toRupee(amount);

    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0' });
    }

    if (USE_MOCK_RAZORPAY) {
      const mockOrder = {
        id: `mock_order_${Date.now()}`,
        amount: Math.round(numericAmount * 100),
        currency: 'INR',
        status: 'created',
      };

      const orderId = mockOrder.id;
      await createWalletTransaction({
        userId: req.user.id,
        amount: numericAmount,
        points: toPoints(numericAmount),
        currency: 'INR',
        orderId,
      });

      return res.status(200).json({ success: true, order: mockOrder, transactionId: orderId });
    }

    const orderPayload = {
      amount: Math.round(numericAmount * 100),
      currency: 'INR',
      receipt: `wallet-${req.user.id}-${Date.now()}`,
      notes: {
        userId: String(req.user.id),
        points: String(toPoints(numericAmount)),
      },
    };

    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    const response = await axios.post('https://api.razorpay.com/v1/orders', orderPayload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
    });

    const orderId = response.data.id;
    const transactionId = await createWalletTransaction({
      userId: req.user.id,
      amount: numericAmount,
      points: toPoints(numericAmount),
      currency: 'INR',
      orderId,
    });

    return res.status(200).json({
      success: true,
      order: response.data,
      transactionId,
    });
  } catch (error) {
    const razorpayError = error?.response?.data;
    console.error('createRazorpayOrder error', razorpayError || error.message);
    return res.status(500).json({
      success: false,
      message: razorpayError?.description || 'Failed to create payment order',
      details: razorpayError || null,
    });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, points } = req.body;

    if (USE_MOCK_RAZORPAY) {
      await updateWalletTransaction({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        amount,
        points,
      });

      return res.status(200).json({ success: true, message: 'Wallet recharge verified successfully' });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    await updateWalletTransaction({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      amount,
      points,
    });

    return res.status(200).json({ success: true, message: 'Wallet recharge verified successfully' });
  } catch (error) {
    console.error('verifyRazorpayPayment error', error.message);
    return res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};

export const getWalletSummary = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
    const balance = isAdmin
      ? await getTotalWalletBalance()
      : await getWalletBalance(req.user.id);
    const transactions = isAdmin ? [] : await getWalletTransactions(req.user.id);

    return res.status(200).json({ success: true, balance, transactions });
  } catch (error) {
    console.error('getWalletSummary error', error.message);
    return res.status(500).json({ success: false, message: 'Failed to load wallet summary' });
  }
};
