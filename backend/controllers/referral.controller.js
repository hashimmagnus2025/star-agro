import { getReferralsByReferrerId, getReferralStats } from '../models/referral.model.js';

export const getMyReferrals = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const [referrals, stats] = await Promise.all([
      getReferralsByReferrerId(req.user.id),
      getReferralStats(req.user.id),
    ]);

    return res.status(200).json({
      success: true,
      referrals,
      totalReferrals: stats.totalReferrals,
      totalPoints: stats.totalPoints,
    });
  } catch (error) {
    console.error('getMyReferrals error', error.message || error);
    return res.status(500).json({ success: false, message: 'Failed to load referrals' });
  }
};
