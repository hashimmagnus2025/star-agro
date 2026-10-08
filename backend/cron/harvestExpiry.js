import cron from 'node-cron';
import { getExpiredHarvestCrops, expireHarvestedCrops } from '../models/product.model.js';

// Runs every hour: any crop whose harvesting_end_date has passed gets flipped
// to inactive and drops off the crops listing.
export const startHarvestExpiryJob = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      const expired = await getExpiredHarvestCrops();
      if (!expired.length) return;

      await expireHarvestedCrops();
      console.log(`[HarvestExpiry] Deactivated ${expired.length} crop(s) past their harvesting end date.`);
    } catch (error) {
      console.error('[HarvestExpiry] Failed to expire harvested crops:', error.message || error);
    }
  });
};
