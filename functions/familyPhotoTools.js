const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const busboy = require('busboy');
const sharp = require('sharp');
const ffmpegPath = require('ffmpeg-static');
const crypto = require('crypto');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

if (!admin.apps.length) admin.initializeApp();

const FAMILY_DIRECTORY_COLLECTION = 'familyDirectory';
const TARGET_OUTPUT_BYTES = 4 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 31 * 1024 * 1024;
const ALLOWED_ORIGINS = new Set([
  'https://jorgeranilla.com',
  'https://www.jorgeranilla.com',
]);
const IMAGE_MIMES = new Set([
  'image/dng',
  'image/heic',
  'image/heif',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/tiff',
  'image/webp',
  'image/x-adobe-dng',
]);
const VIDEO_MIMES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/x-m4v',
]);

const FUNCTION_OPTS = {
  region: 'us-central1',
  invoker: 'public',
  minInstances: 0,
  timeoutSeconds: 300,
  memory: '2GiB',
};

function cors(req, res) {
  const origin = req.get('origin') || '';

  if (ALLOWED_ORIGINS.has(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
  }

  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.set('Access-Control-Expose-Headers', 'X-Output-File-Name, X-Output-Mime-Type, X-Output-Media-Kind');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return true;
  }

  return false;
}

async function checkFamilyAdmin(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();

  if (!token) return false;

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(token);
  } catch {
    return false;
  }

  const profile = await admin.firestore()
    .collection(FAMILY_DIRECTORY_COLLECTION)
    .doc(decoded.uid)
    .get();

  if (!profile.exists) return false;

  const data = profile.data() || {};
  return data.role === 'admin' && data.status === 'approved';
}

function getExtension(fileName) {
  const match = String(fileName || '').toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? `.${match[1]}` : '';
}

function baseNameFor(fileName) {
  return String(fileName || 'media')
    .replace(/[\\/]+/g, '-')
    .replace(/\.[a-z0-9]+$/i, '')
    .trim() || 'media';
}

function getMediaKind(mimeType, fileName) {
  const mime = String(mimeType || '').toLowerCase();
  const extension = getExtension(fileName);

  if (VIDEO_MIMES.has(mime) || ['.mov', '.mp4', '.m4v'].includes(extension)) return 'video';
  if (IMAGE_MIMES.has(mime) || ['.dng', '.heic', '.heif', '.jpg', '.jpeg', '.png', '.tif', '.tiff', '.webp'].includes(extension)) return 'image';

  if (mime === 'application/octet-stream') {
    if (['.mov', '.mp4', '.m4v'].includes(extension)) return 'video';
    if (['.dng', '.heic', '.heif'].includes(extension)) return 'image';
  }

  return '';
}

function isDngFile(fileName, mimeType) {
  const mime = String(mimeType || '').toLowerCase();
  return mime === 'image/dng' || mime === 'image/x-adobe-dng' || /\.dng$/i.test(String(fileName || ''));
}

function isHeifFile(fileName, mimeType) {
  const mime = String(mimeType || '').toLowerCase();
  return mime === 'image/heic' || mime === 'image/heif' || /\.(heic|heif)$/i.test(String(fileName || ''));
}

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers, limits: { fileSize: MAX_UPLOAD_BYTES } });
    const chunks = [];
    let fileName = '';
    let fileMime = '';
    let fileSize = 0;
    let fileKind = '';
    let fileTooLarge = false;
    let invalidFile = false;

    bb.on('file', (name, file, info) => {
      if (name !== 'photo' && name !== 'media') {
        file.resume();
        return;
      }

      const kind = getMediaKind(info.mimeType, info.filename);
      if (!kind) {
        invalidFile = true;
        file.resume();
        return;
      }

      fileName = info.filename || (kind === 'video' ? 'video.mov' : 'photo.jpg');
      fileMime = info.mimeType || 'application/octet-stream';
      fileKind = kind;

      file.on('limit', () => {
        fileTooLarge = true;
      });

      file.on('data', chunk => {
        fileSize += chunk.length;
        chunks.push(chunk);
      });
    });

    bb.on('close', () => resolve({
      fileBuffer: chunks.length ? Buffer.concat(chunks) : null,
      fileName,
      fileMime,
      fileSize,
      fileKind,
      fileTooLarge,
      invalidFile,
    }));
    bb.on('error', reject);

    if (req.rawBody) {
      bb.write(req.rawBody);
      bb.end();
    } else {
      req.pipe(bb);
    }
  });
}

async function buildJpegUnderTarget(fileBuffer, sourceName, sourceMime) {
  const widths = [0, 3840, 3200, 2800, 2400, 2200, 2000, 1800, 1600, 1440, 1280, 1080, 960, 720];
  const qualities = [96, 95, 94, 93, 92, 91, 90, 89, 88, 87, 86, 85, 84, 83, 82, 81, 80, 78, 76, 74, 72, 70, 68, 66, 64, 62, 60, 58, 56, 54, 52, 50, 48, 46, 44, 42, 40, 38, 36, 34, 32];
  let smallest = null;

  for (const width of widths) {
    for (const quality of qualities) {
      let image = sharp(fileBuffer, { limitInputPixels: 80000000 }).rotate();
      if (width > 0) {
        image = image.resize({ width, withoutEnlargement: true });
      }

      const output = await image.jpeg({ quality, mozjpeg: true }).toBuffer();
      if (!smallest || output.length < smallest.length) smallest = output;

      if (output.length <= TARGET_OUTPUT_BYTES) {
        return output;
      }
    }
  }

  if (smallest && smallest.length <= TARGET_OUTPUT_BYTES) return smallest;

  const sourceType = isDngFile(sourceName, sourceMime) ? 'DNG' : 'image';
  throw new Error(`Could not reduce this ${sourceType} below 4 MB without losing too much detail.`);
}

async function convertImageUpload(parsed) {
  try {
    return {
      buffer: await buildJpegUnderTarget(parsed.fileBuffer, parsed.fileName, parsed.fileMime),
      fileName: `${baseNameFor(parsed.fileName)}.jpg`,
      kind: 'image',
      mimeType: 'image/jpeg',
    };
  } catch (error) {
    if (!isDngFile(parsed.fileName, parsed.fileMime)) {
      throw error;
    }

    try {
      const extractedJpeg = await extractDngJpegWithFfmpeg(parsed);
      return {
        buffer: await buildJpegUnderTarget(extractedJpeg, `${baseNameFor(parsed.fileName)}.jpg`, 'image/jpeg'),
        fileName: `${baseNameFor(parsed.fileName)}.jpg`,
        kind: 'image',
        mimeType: 'image/jpeg',
      };
    } catch (dngError) {
      console.error('DNG conversion fallback error:', dngError);
      throw new Error('Could not convert this DNG file. DNG is a camera RAW format; export it as JPEG first if this file cannot be decoded here.');
    }
  }
}

async function extractDngJpegWithFfmpeg(parsed) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'family-dng-'));
  const inputPath = path.join(tempDir, `${crypto.randomUUID()}.dng`);
  const outputPath = path.join(tempDir, 'preview.jpg');

  try {
    await fs.writeFile(inputPath, parsed.fileBuffer);
    await runFfmpeg(['-y', '-i', inputPath, '-frames:v', '1', '-q:v', '2', outputPath]);
    return fs.readFile(outputPath);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) {
      reject(new Error('Video conversion is unavailable because ffmpeg is not installed.'));
      return;
    }

    const child = spawn(ffmpegPath, args, { windowsHide: true });
    let stderr = '';

    child.stderr.on('data', chunk => {
      stderr += chunk.toString();
      if (stderr.length > 30000) stderr = stderr.slice(-30000);
    });

    child.on('error', reject);
    child.on('close', code => {
      if (code === 0) {
        resolve(stderr);
        return;
      }

      reject(new Error(stderr || `ffmpeg exited with code ${code}`));
    });
  });
}

function parseDurationSeconds(ffmpegOutput) {
  const match = String(ffmpegOutput || '').match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!match) return 0;

  return (Number(match[1]) * 3600) + (Number(match[2]) * 60) + Number(match[3]);
}

function widthForVideoBitrate(videoKbps) {
  if (videoKbps < 180) return 480;
  if (videoKbps < 360) return 640;
  if (videoKbps < 700) return 960;
  return 1280;
}

function createVideoProfiles(durationSeconds) {
  const profiles = [];

  if (durationSeconds > 0) {
    const totalKbps = Math.max(96, Math.floor((TARGET_OUTPUT_BYTES * 8 * 0.88) / durationSeconds / 1000));
    const audioKbps = Math.min(80, Math.max(24, Math.floor(totalKbps * 0.22)));
    const videoKbps = Math.max(48, totalKbps - audioKbps);

    profiles.push({ width: widthForVideoBitrate(videoKbps), videoKbps, audioKbps });
    profiles.push({ width: widthForVideoBitrate(Math.floor(videoKbps * 0.75)), videoKbps: Math.max(40, Math.floor(videoKbps * 0.75)), audioKbps: Math.max(24, Math.floor(audioKbps * 0.75)) });
    profiles.push({ width: 480, videoKbps: Math.max(32, Math.floor(videoKbps * 0.55)), audioKbps: 24 });
  }

  profiles.push(
    { width: 1280, crf: 30, audioKbps: 80 },
    { width: 960, crf: 34, audioKbps: 64 },
    { width: 720, crf: 37, audioKbps: 48 },
    { width: 540, crf: 40, audioKbps: 40 },
    { width: 480, crf: 42, audioKbps: 32 }
  );

  return profiles;
}

async function runVideoProfile(inputPath, outputPath, profile) {
  await fs.rm(outputPath, { force: true });

  const filter = `scale=min(${profile.width}\\,iw):-2`;
  const args = [
    '-y',
    '-i', inputPath,
    '-map', '0:v:0',
    '-map', '0:a?',
    '-vf', filter,
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-c:a', 'aac',
    '-b:a', `${profile.audioKbps || 48}k`,
    '-ac', '2',
    '-ar', '44100',
  ];

  if (profile.videoKbps) {
    args.push('-b:v', `${profile.videoKbps}k`, '-maxrate', `${Math.max(profile.videoKbps, 32)}k`, '-bufsize', `${Math.max(profile.videoKbps * 2, 64)}k`);
  } else {
    args.push('-crf', String(profile.crf || 34));
  }

  args.push(outputPath);
  await runFfmpeg(args);
  return fs.readFile(outputPath);
}

async function convertVideoUpload(parsed) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'family-media-'));
  const inputPath = path.join(tempDir, `${crypto.randomUUID()}${getExtension(parsed.fileName) || '.mov'}`);
  const outputPath = path.join(tempDir, 'output.mp4');
  let best = null;

  try {
    await fs.writeFile(inputPath, parsed.fileBuffer);

    let durationSeconds = 0;
    try {
      durationSeconds = parseDurationSeconds(await runFfmpeg(['-i', inputPath]));
    } catch (error) {
      durationSeconds = parseDurationSeconds(error.message);
    }

    for (const profile of createVideoProfiles(durationSeconds)) {
      const output = await runVideoProfile(inputPath, outputPath, profile);
      if (!best || output.length < best.length) best = output;
      if (output.length <= TARGET_OUTPUT_BYTES) {
        return {
          buffer: output,
          fileName: `${baseNameFor(parsed.fileName)}.mp4`,
          kind: 'video',
          mimeType: 'video/mp4',
        };
      }
    }

    if (best && best.length <= TARGET_OUTPUT_BYTES) {
      return {
        buffer: best,
        fileName: `${baseNameFor(parsed.fileName)}.mp4`,
        kind: 'video',
        mimeType: 'video/mp4',
      };
    }

    throw new Error('Could not reduce this video below 4 MB. Try trimming it shorter first.');
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

function sendConvertedMedia(res, converted) {
  res.set('Content-Type', converted.mimeType);
  res.set('Content-Disposition', `inline; filename="${converted.fileName}"`);
  res.set('X-Output-File-Name', converted.fileName);
  res.set('X-Output-Mime-Type', converted.mimeType);
  res.set('X-Output-Media-Kind', converted.kind);
  return res.status(200).send(converted.buffer);
}

exports.convertFamilyPhotoUpload = onRequest(FUNCTION_OPTS, async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only.' });
  if (!(await checkFamilyAdmin(req))) return res.status(401).json({ error: 'Unauthorized.' });

  let parsed;
  try {
    parsed = await parseMultipart(req);
  } catch (error) {
    console.error('Family media parse error:', error);
    return res.status(400).json({ error: 'Could not read the uploaded media.' });
  }

  if (parsed.fileTooLarge) return res.status(400).json({ error: 'Upload media under 31 MB.' });
  if (parsed.invalidFile || !parsed.fileBuffer || !parsed.fileKind) {
    return res.status(400).json({ error: 'Upload a supported photo or video file.' });
  }

  try {
    const converted = parsed.fileKind === 'video'
      ? await convertVideoUpload(parsed)
      : await convertImageUpload(parsed);

    return sendConvertedMedia(res, converted);
  } catch (error) {
    console.error('Family media conversion error:', error);
    return res.status(400).json({ error: error.message || 'Could not convert this media file.' });
  }
});
