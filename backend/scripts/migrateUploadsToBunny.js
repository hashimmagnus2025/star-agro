// One-time migration: pushes every existing local /uploads file (from before Bunny CDN
// was wired up) to Bunny Storage, and rewrites the corresponding DB column to the new
// CDN URL. Safe to re-run — rows already pointing at an http(s) URL are skipped.
//
// Run this ON THE SERVER where backend/uploads actually lives (via SSH/terminal):
//   cd backend
//   node scripts/migrateUploadsToBunny.js
//
// No terminal access (e.g. some cPanel plans)? Use the admin-panel button instead —
// see routes/migration.routes.js — which runs this same logic over HTTP.
//
// This does NOT delete local files — verify the site looks right first, then clean up
// backend/uploads manually if you want the disk space back.

import { runUploadsMigration } from '../utils/migrateUploads.js';

runUploadsMigration()
  .then(() => {
    console.log('Migration complete.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error.message || error);
    process.exit(1);
  });
