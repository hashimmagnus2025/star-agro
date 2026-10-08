import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { runUploadsMigration } from '../utils/migrateUploads.js';

const MigrationRouter = express.Router();

// One-time (safe to re-run) migration of existing local /uploads files to Bunny CDN,
// triggerable from the admin panel for hosts without terminal/SSH access.
MigrationRouter.post('/uploads-to-bunny', protect, authorize('admin', 'super_admin'), async (req, res) => {
  const logs = [];
  try {
    const results = await runUploadsMigration((line) => logs.push(line));
    return res.status(200).json({ message: 'Migration finished', results, logs });
  } catch (error) {
    console.error('Migration route error:', error.message || error);
    return res.status(500).json({ message: error.message || 'Migration failed', logs });
  }
});

export default MigrationRouter;
