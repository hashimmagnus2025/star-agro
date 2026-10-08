import ffmpegPath from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobeStatic.path);

const TARGET_SIZE_BYTES = 3.5 * 1024 * 1024;
const MIN_VIDEO_BITRATE_KBPS = 250;
const MAX_VIDEO_BITRATE_KBPS = 2500;
const AUDIO_BITRATE_KBPS = 96;

// Only worth re-encoding if the upload is meaningfully bigger than our target;
// small clips are left untouched to avoid needless quality loss/processing time.
export const COMPRESS_VIDEO_THRESHOLD_BYTES = 4 * 1024 * 1024;

const getVideoDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata?.format?.duration || 0);
    });
  });
};

// Single-pass bitrate targeting: derive a video bitrate from the clip's duration
// so the output lands close to TARGET_SIZE_BYTES (~3-4MB), clamped so very short
// clips don't get an absurdly high bitrate and very long ones don't turn to mush.
export const compressVideo = async (inputPath, outputPath) => {
  const duration = await getVideoDuration(inputPath);
  if (!duration) {
    throw new Error('Could not read video duration for compression');
  }

  const targetTotalKbps = (TARGET_SIZE_BYTES * 8) / duration / 1000;
  const videoBitrateKbps = Math.max(
    MIN_VIDEO_BITRATE_KBPS,
    Math.min(MAX_VIDEO_BITRATE_KBPS, Math.round(targetTotalKbps - AUDIO_BITRATE_KBPS))
  );

  await new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .videoBitrate(videoBitrateKbps)
      .audioCodec('aac')
      .audioBitrate(AUDIO_BITRATE_KBPS)
      .outputOptions([
        '-preset veryfast',
        `-maxrate ${videoBitrateKbps}k`,
        `-bufsize ${videoBitrateKbps * 2}k`,
        "-vf scale='min(1280,iw)':-2",
        '-movflags +faststart',
      ])
      .on('error', reject)
      .on('end', () => resolve())
      .save(outputPath);
  });
};

// Compresses in place and normalizes the output to .mp4 (we always re-encode to
// H.264/AAC), since the source extension - .mov, .webm, etc. - would otherwise be
// left on a file that's no longer that container. Returns the final file path.
export const compressVideoInPlace = async (filePath) => {
  const parsed = path.parse(filePath);
  const finalPath = path.join(parsed.dir, `${parsed.name}.mp4`);
  const tempPath = path.join(parsed.dir, `${parsed.name}.tmp.mp4`);

  await compressVideo(filePath, tempPath);
  await fs.promises.unlink(filePath);
  await fs.promises.rename(tempPath, finalPath);

  return finalPath;
};
