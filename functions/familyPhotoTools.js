const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const busboy = require('busboy');
const crypto = require('crypto');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

// Lazy-load native modules so Firebase CLI code analysis succeeds
// even when node_modules aren't fully installed locally.
let _sharp = null;
let _ffmpegPath = null;
function getSharp() {
  if (!_sharp) _sharp = require('sharp');
  return _sharp;
}
function getFfmpegPath() {
  if (_ffmpegPath === null) _ffmpegPath = require('ffmpeg-static');
  return _ffmpegPath;
}

if (!admin.apps.length) admin.initializeApp();

const FAMILY_DIRECTORY_COLLECTION = 'familyDirectory';
const TARGET_OUTPUT_MEGABYTES = 3;
const TARGET_OUTPUT_BYTES = TARGET_OUTPUT_MEGABYTES * 1024 * 1024;
const MAX_UPLOAD_BYTES = 31 * 1024 * 1024;
const MAX_WEB_IMAGE_WIDTH = 3840;
const MIN_WEB_IMAGE_WIDTH = 1600;
const JPEG_QUALITY_TIERS = [
  [96, 95, 94, 93, 92, 91, 90, 89, 88],
  [87, 86, 85, 84, 83, 82],
  [80, 78, 76]
];
const WEB_IMAGE_WIDTHS = [3840, 3200, 2800, 2400, 2200, 2000, 1800, 1600];
const ALLOWED_ORIGINS = new Set([
  'https://jorgeranilla.com',
  'https://www.jorgeranilla.com',
  'https://jorgeranilla-site.web.app',
  'https://jorgeranilla-site.firebaseapp.com',
  'null'
]);
const LOCAL_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
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


const FUNCTION_OPTS = {
  region: 'us-central1',
  invoker: 'public',
  minInstances: 0,
  timeoutSeconds: 300,
  memory: '2GiB',
};

function cors(req, res) {
  const origin = req.get('origin') || '';

  if (ALLOWED_ORIGINS.has(origin) || LOCAL_ORIGIN_RE.test(origin)) {
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

  if (IMAGE_MIMES.has(mime) || ['.dng', '.heic', '.heif', '.jpg', '.jpeg', '.png', '.tif', '.tiff', '.webp'].includes(extension)) return 'image';

  if (mime === 'application/octet-stream' && ['.dng', '.heic', '.heif'].includes(extension)) return 'image';

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

function isJpegFile(fileName, mimeType) {
  const mime = String(mimeType || '').toLowerCase();
  return mime === 'image/jpeg' || mime === 'image/jpg' || /\.(jpe?g)$/i.test(String(fileName || ''));
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

      fileName = info.filename || 'photo.jpg';
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

function getImageWidthCandidates(metadata, includeOriginal) {
  const originalWidth = Number(metadata?.width) || 0;
  const minWidth = originalWidth > 0 ? Math.min(originalWidth, MIN_WEB_IMAGE_WIDTH) : MIN_WEB_IMAGE_WIDTH;
  const resizedWidths = WEB_IMAGE_WIDTHS.filter(width => {
    if (originalWidth && width >= originalWidth) return false;
    return width >= minWidth;
  });
  const widths = includeOriginal ? [0, ...resizedWidths] : resizedWidths;
  return [...new Set(widths)];
}

async function renderJpegCandidate(fileBuffer, width, quality) {
  const sharp = getSharp();
  let image = sharp(fileBuffer, { limitInputPixels: 80000000 }).rotate();
  if (width > 0) {
    image = image.resize({ width, withoutEnlargement: true });
  }

  return image.jpeg({ quality, mozjpeg: true }).toBuffer();
}

async function tryJpegCandidateTier(fileBuffer, widths, qualities) {
  for (const width of widths) {
    for (const quality of qualities) {
      const output = await renderJpegCandidate(fileBuffer, width, quality);

      if (output.length <= TARGET_OUTPUT_BYTES) {
        return output;
      }
    }
  }

  return null;
}

async function buildJpegUnderTarget(fileBuffer, sourceName, sourceMime) {
  if (isJpegFile(sourceName, sourceMime) && fileBuffer.length <= TARGET_OUTPUT_BYTES) {
    return fileBuffer;
  }

  const sharp = getSharp();
  const metadata = await sharp(fileBuffer, { limitInputPixels: 80000000 }).metadata();
  const originalWidth = Number(metadata?.width) || 0;
  const includeOriginal = originalWidth > 0 && originalWidth <= MAX_WEB_IMAGE_WIDTH;
  const widths = getImageWidthCandidates(metadata, includeOriginal);

  for (const qualities of JPEG_QUALITY_TIERS) {
    const output = await tryJpegCandidateTier(fileBuffer, widths, qualities);
    if (output) return output;
  }

  const sourceType = isDngFile(sourceName, sourceMime) ? 'DNG' : 'image';
  throw new Error(`Could not reduce this ${sourceType} below ${TARGET_OUTPUT_MEGABYTES} MB without losing too much detail.`);
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
    const ffmpegPath = getFfmpegPath();
    if (!ffmpegPath) {
      reject(new Error('DNG conversion is unavailable because ffmpeg is not installed.'));
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
    console.error('Family photo parse error:', error);
    return res.status(400).json({ error: 'Could not read the uploaded photo.' });
  }

  if (parsed.fileTooLarge) return res.status(400).json({ error: 'Upload a photo under 31 MB.' });
  if (parsed.invalidFile || !parsed.fileBuffer || !parsed.fileKind) {
    return res.status(400).json({ error: 'Upload a supported photo file.' });
  }

  try {
    const converted = await convertImageUpload(parsed);
    return sendConvertedMedia(res, converted);
  } catch (error) {
    console.error('Family photo conversion error:', error);
    return res.status(400).json({ error: error.message || 'Could not convert this photo.' });
  }
});
