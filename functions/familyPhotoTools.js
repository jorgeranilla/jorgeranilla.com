const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const busboy = require('busboy');
const sharp = require('sharp');

if (!admin.apps.length) admin.initializeApp();

const FAMILY_DIRECTORY_COLLECTION = 'familyDirectory';
const MAX_IMAGE_BYTES = 35 * 1024 * 1024;
const ALLOWED_ORIGINS = new Set([
  'https://jorgeranilla.com',
  'https://www.jorgeranilla.com',
]);
const ALLOWED_IMAGE_MIMES = new Set([
  'image/heic',
  'image/heif',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/octet-stream',
]);

const FUNCTION_OPTS = {
  region: 'us-central1',
  invoker: 'public',
  minInstances: 0,
  timeoutSeconds: 60,
  memory: '1GiB',
};

function cors(req, res) {
  const origin = req.get('origin') || '';

  if (ALLOWED_ORIGINS.has(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
  }

  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.set('Access-Control-Expose-Headers', 'X-Output-File-Name');

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

function isAllowedImage(mimeType, fileName) {
  const normalizedMime = String(mimeType || '').toLowerCase();
  const normalizedName = String(fileName || '').toLowerCase();

  if (!ALLOWED_IMAGE_MIMES.has(normalizedMime)) return false;
  if (normalizedMime === 'application/octet-stream') {
    return /\.(heic|heif)$/i.test(normalizedName);
  }

  return true;
}

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers, limits: { fileSize: MAX_IMAGE_BYTES } });
    const chunks = [];
    let fileName = '';
    let fileSize = 0;
    let fileTooLarge = false;
    let invalidFile = false;

    bb.on('file', (name, file, info) => {
      if (name !== 'photo') {
        file.resume();
        return;
      }

      if (!isAllowedImage(info.mimeType, info.filename)) {
        invalidFile = true;
        file.resume();
        return;
      }

      fileName = info.filename || 'photo.heic';

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

function jpegNameFor(fileName) {
  const cleaned = String(fileName || 'photo')
    .replace(/[\\/]+/g, '-')
    .replace(/\.[a-z0-9]+$/i, '')
    .trim() || 'photo';

  return `${cleaned}.jpg`;
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
    return res.status(400).json({ error: 'Could not read the uploaded image.' });
  }

  if (parsed.fileTooLarge) return res.status(400).json({ error: 'Image exceeds the 35 MB limit.' });
  if (parsed.invalidFile || !parsed.fileBuffer) return res.status(400).json({ error: 'Upload a HEIC, JPEG, PNG, or WebP image.' });

  try {
    const jpeg = await sharp(parsed.fileBuffer, { limitInputPixels: 80000000 })
      .rotate()
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer();

    res.set('Content-Type', 'image/jpeg');
    res.set('Content-Disposition', `inline; filename="${jpegNameFor(parsed.fileName)}"`);
    res.set('X-Output-File-Name', jpegNameFor(parsed.fileName));
    return res.status(200).send(jpeg);
  } catch (error) {
    console.error('Family photo conversion error:', error);
    return res.status(400).json({ error: 'Could not convert this image to JPEG.' });
  }
});