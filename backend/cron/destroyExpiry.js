import cron from 'node-cron';
import { getExpiredUnclaimedDestroyListings, expireDestroyListings } from '../models/product.model.js';

// Runs every hour: any crop marked for destroy that has been open for 3 days
// with nobody claiming it gets flipped to expired/inactive and drops off listings.
export const startDestroyExpiryJob = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      const expired = await getExpiredUnclaimedDestroyListings();
      if (!expired.length) return;

      await expireDestroyListings();
      console.log(`[DestroyExpiry] Expired ${expired.length} unclaimed destroy listing(s).`);
    } catch (error) {
      console.error('[DestroyExpiry] Failed to expire destroy listings:', error.message || error);
    }
  });
};
