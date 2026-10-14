import axios from 'axios';
import fs from 'fs';

const BUNNY_STORAGE_HOST = process.env.BUNNY_STORAGE_HOST;
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE;
const BUNNY_STORAGE_ACCESS_KEY = process.env.BUNNY_STORAGE_ACCESS_KEY;
const BUNNY_PULL_ZONE_URL = (process.env.BUNNY_PULL_ZONE_URL || '').replace(/\/$/, '');

export const isBunnyConfigured = () =>
  Boolean(BUNNY_STORAGE_HOST && BUNNY_STORAGE_ZONE && BUNNY_STORAGE_ACCESS_KEY && BUNNY_PULL_ZONE_URL);

// Only these content types go to Bunny CDN; everything else stays on local /uploads disk
// storage, even when Bunny is configured — keeps CDN storage/bandwidth usage limited to
// the high-traffic, high-size content (product media, onboarding videos, ad banners).
const BUNNY_ENABLED_FOLDERS = new Set(['how-to-use', 'products/images', 'products/videos', 'advertisements']);

// Uploads a local file to Bunny Storage and returns its public CDN URL (via the Pull Zone).
export const uploadFileToBunny = async (localFilePath, remoteFolder, remoteFileName) => {
  const fileBuffer = fs.readFileSync(localFilePath);
  const remotePath = `${remoteFolder}/${remoteFileName}`;
  const uploadUrl = `https://${BUNNY_STORAGE_HOST}/${BUNNY_STORAGE_ZONE}/${remotePath}`;

  await axios.put(uploadUrl, fileBuffer, {
    headers: {
      AccessKey: BUNNY_STORAGE_ACCESS_KEY,
      'Content-Type': 'application/octet-stream',
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  return `${BUNNY_PULL_ZONE_URL}/${remotePath}`;
};

// Convenience wrapper for the common case: a single multer disk-storage file that
// should end up under the same-named remote and local folder. Uploads to Bunny when
// configured AND the folder is in BUNNY_ENABLED_FOLDERS (deleting the local temp copy
// afterwards); otherwise (folder not CDN-eligible, Bunny not configured, or upload
// fails) falls back to the local /uploads URL so an upload never gets blocked.
export const resolveUploadedFileUrl = async (file, folder) => {
  if (!file) return null;

  if (isBunnyConfigured() && BUNNY_ENABLED_FOLDERS.has(folder)) {
    try {
      const cdnUrl = await uploadFileToBunny(file.path, folder, file.filename);
      fs.unlink(file.path, () => {});
      return cdnUrl;
    } catch (uploadError) {
      console.error('Bunny upload failed, falling back to local storage:', uploadError.message || uploadError);
    }
  }

  return `/uploads/${folder}/${file.filename}`;
};

// Best-effort delete of a Bunny-hosted file given its public CDN URL. Silently no-ops
// for local (/uploads/...) URLs or when Bunny isn't configured.
export const deleteFileFromBunny = async (cdnUrl) => {
  if (!isBunnyConfigured() || !cdnUrl || !cdnUrl.startsWith(BUNNY_PULL_ZONE_URL)) return;

  try {
    const remotePath = cdnUrl.slice(BUNNY_PULL_ZONE_URL.length).replace(/^\//, '');
    const deleteUrl = `https://${BUNNY_STORAGE_HOST}/${BUNNY_STORAGE_ZONE}/${remotePath}`;
    await axios.delete(deleteUrl, { headers: { AccessKey: BUNNY_STORAGE_ACCESS_KEY } });
  } catch (error) {
    console.error('Bunny delete failed:', error.message || error);
  }
};
