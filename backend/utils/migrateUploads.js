// Shared logic for pushing existing local /uploads files (from before Bunny CDN was
// wired up) to Bunny Storage and rewriting the corresponding DB column to the CDN URL.
// Used by both the CLI script (scripts/migrateUploadsToBunny.js) and the admin-triggered
// HTTP endpoint, so cPanel hosts without terminal/SSH access can still run it.

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';
import { isBunnyConfigured, uploadFileToBunny } from './bunny.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_ROOT = path.join(__dirname, '..');

const MIGRATIONS = [
  { table: 'products', column: 'image_url', remoteFolder: 'products/images' },
  { table: 'products', column: 'product_video', remoteFolder: 'products/videos' },
  { table: 'advertisements', column: 'image', remoteFolder: 'advertisements' },
  { table: 'cms_content', column: 'image_url', remoteFolder: 'cms' },
  { table: 'categories', column: 'image_url', remoteFolder: 'categories' },
  { table: 'sub_categories', column: 'image', remoteFolder: 'sub-categories' },
  { table: 'sub_sub_categories', column: 'image', remoteFolder: 'sub-sub-categories' },
  { table: 'gallery', column: 'image', remoteFolder: 'gallery' },
  { table: 'how_to_use', column: 'video_url', remoteFolder: 'how-to-use' },
  { table: 'general_settings', column: 'logo', remoteFolder: 'generalSettings' },
  { table: 'general_settings', column: 'favicon', remoteFolder: 'generalSettings' },
  { table: 'job_applications', column: 'cv_file', remoteFolder: 'jobs' },
  { table: 'services', column: 'image_url', remoteFolder: 'services' },
  { table: 'services', column: 'video_url', remoteFolder: 'services' },
  { table: 'users', column: 'profile_image', remoteFolder: 'profile' },
  { table: 'users', column: 'document_file', remoteFolder: 'profile' },
];

const migrateColumn = async ({ table, column, remoteFolder }, log) => {
  const [rows] = await pool.query(
    `SELECT id, \`${column}\` AS value FROM \`${table}\` WHERE \`${column}\` LIKE '/uploads/%'`
  );

  const summary = { table, column, total: rows.length, migrated: 0, skipped: 0, failed: 0 };

  if (rows.length === 0) {
    log(`[${table}.${column}] nothing to migrate`);
    return summary;
  }

  log(`[${table}.${column}] migrating ${rows.length} file(s)...`);

  for (const row of rows) {
    const localPath = path.join(UPLOADS_ROOT, row.value);

    if (!fs.existsSync(localPath)) {
      log(`  skip id=${row.id}: local file not found at ${localPath}`);
      summary.skipped += 1;
      continue;
    }

    try {
      const filename = path.basename(localPath);
      const cdnUrl = await uploadFileToBunny(localPath, remoteFolder, filename);
      await pool.query(`UPDATE \`${table}\` SET \`${column}\` = ? WHERE id = ?`, [cdnUrl, row.id]);
      summary.migrated += 1;
      log(`  id=${row.id} -> ${cdnUrl}`);
    } catch (error) {
      summary.failed += 1;
      log(`  FAILED id=${row.id}: ${error.message || error}`);
    }
  }

  return summary;
};

// onLog: optional callback for progress lines (defaults to console.log). Returns an
// array of per-column summaries; throws if Bunny isn't configured.
export const runUploadsMigration = async (onLog = console.log) => {
  if (!isBunnyConfigured()) {
    throw new Error('Bunny CDN is not configured (check BUNNY_* vars in .env)');
  }

  const results = [];
  for (const migration of MIGRATIONS) {
    results.push(await migrateColumn(migration, onLog));
  }
  return results;
};
