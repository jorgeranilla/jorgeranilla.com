const crypto = require('crypto');
const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const FUNCTION_OPTS = {
  region: 'us-central1',
  invoker: 'public',
  minInstances: 0
};

const ALLOWED_ORIGINS = new Set([
  'https://jorgeranilla.com',
  'https://www.jorgeranilla.com',
  'https://jorgeranilla-site.web.app',
  'https://jorgeranilla-site.firebaseapp.com'
]);

const LOCAL_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
const SUGGESTIONS_COLLECTION = 'familyPhotoTagSuggestions';
const RATE_LIMIT_COLLECTION = 'familyPhotoTagSuggestionRateLimits';
const FAMILY_DIRECTORY_COLLECTION = 'familyDirectory';
const DAILY_BROWSER_LIMIT = 20;
const TAG_OPTIONS_CACHE_MS = 10 * 60 * 1000;
const MAX_SELECTED_PEOPLE = 20;
const MAX_OTHER_NAMES = 10;

const PHOTO_TAG_CANONICAL_SLUGS = {
  "luis-fernando": "luis-fernando-astocondor",
  "fernando-javier": "fernando-pallete",
  "lorenzo-david": "lorenzo-lu",
  "eugenio-jesus": "eugenio-astocondor",
  "eugenio-augusto": "eugenio-astocondor-salazar-lopez",
  "eugenio-augusto-astocondor": "eugenio-astocondor-salazar-lopez",
  "ernesto": "ernesto-herrera",
  "luisa-cristina": "luisa-astocondor",
  "monica-del-carmen": "monica-astocondor",
  "paola-andrea": "paola-pallete",
  "paola-andres": "paola-pallete",
  "milagros": "milagros-herrera",
  "adriana": "adriana-astocondor",
  "alessandra": "alessandra-briceno",
  "paola-josefina": "paola-ranilla",
  "victor-andres": "victor-ranilla",
  "victor-andres-ranilla": "victor-ranilla",
  "maria-eugenia": "maria-ranilla",
  "maria-eugenia-ranilla": "maria-ranilla",
  "maria-alcira": "alcira-astocondor-salazar-lopez",
  "maria-alcira-del-carmen-astocondor": "alcira-astocondor-salazar-lopez",
  "maria-carlota": "carlota-ruiz-guevara",
  "maria-carlota-ruiz": "carlota-ruiz-guevara",
  "maria-carlota-astocondor": "carlota-astocondor-salazar-lopez",
  "maria-carlota-astocondor-salazar-lopez": "carlota-astocondor-salazar-lopez",
  "maria-jesus-cateriano": "maria-jesus-cateriano-dongo",
  "shane": "shane-ranilla",
  "jorge": "jorge-ranilla",
  "jorge-luis": "jorge-ranilla-cateriano",
  "jorge-luis-ranilla": "jorge-ranilla-cateriano",
  "jorge-gelasio": "jorge-astocondor",
  "jorge-astocondor-fuertes": "jorge-astocondor",
  "sylvia": "sylvia-astocondor-salazar-lopez",
  "sylvia-ines": "sylvia-astocondor-salazar-lopez",
  "sylvia-ines-astocondor": "sylvia-astocondor-salazar-lopez",
  "sylvia-astocondor-salazar": "sylvia-astocondor-salazar-lopez",
  "alyssa": "alyssa-ranilla",
  "carolina": "carolina-ranilla",
  "fatima": "fatima-astocondor",
  "fatima-celeste": "fatima-astocondor",
  "fernando-jose": "fernando-astocondor",
  "gabriel": "gabriel-astocondor",
  "hector": "hector-briceno",
  "janet": "janet-ranilla-cateriano",
  "janet-cecilia": "janet-ranilla-cateriano",
  "oscar-alberto": "oscar-ranilla-cateriano",
  "raul-sergio-victor": "raul-ranilla-cateriano",
  "sebastian": "sebastian-astocondor",
  "sebastian-martin": "sebastian-astocondor",
  "alcira-isabel": "alcira-astocondor",
  "patty": "patricia-malca",
  "lucy": "lucia-mendez",
  'maria-carlota-ruiz-guevara': 'carlota-ruiz-guevara',
  'maria-alcira-del-carmen': 'alcira-astocondor-salazar-lopez',
  'luis-fernando-astocondor-salazar-lopez': 'fernando-astocondor-salazar-lopez'
};

let tagOptionsCache = {
  expiresAt: 0,
  options: []
};

function sendCors(req, res, methods = 'POST, OPTIONS') {
  const origin = req.get('origin') || '';

  if (ALLOWED_ORIGINS.has(origin) || LOCAL_ORIGIN_RE.test(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
  }

  res.set('Access-Control-Allow-Methods', methods);
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return true;
  }

  return false;
}

function rejectUnless(req, res, allowedMethods) {
  if (allowedMethods.includes(req.method)) return false;
  res.status(405).json({ error: 'Method not allowed.' });
  return true;
}

function cleanString(value, maxLength = 120) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function makeSlug(value) {
  return cleanString(value, 160)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function canonicalSlug(value) {
  const slug = makeSlug(value);
  return PHOTO_TAG_CANONICAL_SLUGS[slug] || slug;
}

function uniqueStrings(values, maxItems, maxLength) {
  const seen = new Set();
  const out = [];

  (Array.isArray(values) ? values : [])
    .map(value => cleanString(value, maxLength))
    .filter(Boolean)
    .forEach(value => {
      const key = value.toLowerCase();
      if (seen.has(key) || out.length >= maxItems) return;
      seen.add(key);
      out.push(value);
    });

  return out;
}

function sanitizePeople(values) {
  const seen = new Set();
  const out = [];

  (Array.isArray(values) ? values : []).forEach(item => {
    const tagKey = cleanString(item?.tagKey, 140);
    const tagLabel = cleanString(item?.tagLabel || item?.displayName, 120);
    const personSlug = canonicalSlug(item?.personSlug || tagLabel);
    const personId = cleanString(item?.personId || item?.id, 140);

    if (!tagKey || !tagLabel || !personSlug || seen.has(tagKey) || out.length >= MAX_SELECTED_PEOPLE) return;
    seen.add(tagKey);
    out.push({ tagKey, tagLabel, personSlug, personId });
  });

  return out;
}

function hashBrowserId(browserId) {
  return crypto.createHash('sha256').update(browserId).digest('hex').slice(0, 48);
}

function getUtcDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function badRequest(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function sanitizeSuggestionBody(body = {}) {
  const browserId = cleanString(body.browserId, 100);
  if (!/^[a-zA-Z0-9_-]{16,100}$/.test(browserId)) {
    throw badRequest('This browser could not be identified for the daily suggestion limit.');
  }

  const target = body.target || {};
  const targetId = cleanString(target.id || body.targetId, 180);
  const targetType = cleanString(target.type || body.targetType, 24).toLowerCase();
  const source = cleanString(target.source || body.source || 'drive', 24).toLowerCase();
  const selectedPeople = sanitizePeople(body.selectedPeople);
  const otherNames = uniqueStrings(body.otherNames, MAX_OTHER_NAMES, 80);

  if (!targetId) throw badRequest('Missing photo or video id.');
  if (!['image', 'video'].includes(targetType)) throw badRequest('Invalid photo or video type.');
  if (!['drive', 'youtube'].includes(source)) throw badRequest('Invalid media source.');
  if (selectedPeople.length === 0 && otherNames.length === 0) {
    throw badRequest('Choose at least one person or add an Other name.');
  }

  return {
    browserId,
    browserHash: hashBrowserId(browserId),
    target: {
      id: targetId,
      type: targetType,
      source,
      name: cleanString(target.name || body.targetName, 180),
      youtubeId: cleanString(target.youtubeId || body.youtubeId, 60),
      albumSlug: cleanString(target.albumSlug || body.albumSlug, 80),
      galleryMode: cleanString(target.galleryMode || body.galleryMode, 40),
      pageUrl: cleanString(target.pageUrl || body.pageUrl, 500)
    },
    selectedPeople,
    otherNames
  };
}

function normalizeTagOption(docSnap) {
  const data = docSnap.data() || {};
  if (data.status !== 'approved') return null;

  const tagLabel = cleanString(data.displayName || data.email || docSnap.id, 120);
  const rawPersonSlug = makeSlug(tagLabel || docSnap.id);
  const personSlug = canonicalSlug(rawPersonSlug);

  if (!tagLabel || !personSlug) return null;

  return {
    id: docSnap.id,
    personId: docSnap.id,
    tagKey: `member:${docSnap.id}`,
    tagLabel,
    personSlug
  };
}

async function getTagOptions() {
  if (Date.now() < tagOptionsCache.expiresAt && tagOptionsCache.options.length > 0) {
    return tagOptionsCache.options;
  }

  const snapshot = await db.collection(FAMILY_DIRECTORY_COLLECTION).get();
  const options = snapshot.docs
    .map(normalizeTagOption)
    .filter(Boolean)
    .sort((a, b) => a.tagLabel.localeCompare(b.tagLabel, undefined, { sensitivity: 'base' }));

  tagOptionsCache = {
    expiresAt: Date.now() + TAG_OPTIONS_CACHE_MS,
    options
  };

  return options;
}

exports.familyPhotoTagOptions = onRequest(FUNCTION_OPTS, async (req, res) => {
  if (sendCors(req, res, 'GET, POST, OPTIONS') || rejectUnless(req, res, ['GET', 'POST'])) return;

  try {
    const options = await getTagOptions();
    res.set('Cache-Control', 'public, max-age=600, s-maxage=600');
    res.json({ options, limitPerBrowserPerDay: DAILY_BROWSER_LIMIT });
  } catch (error) {
    console.error('familyPhotoTagOptions error:', error);
    res.status(500).json({ error: 'Could not load the public tag list.' });
  }
});

exports.submitFamilyPhotoTagSuggestion = onRequest(FUNCTION_OPTS, async (req, res) => {
  if (sendCors(req, res) || rejectUnless(req, res, ['POST'])) return;

  try {
    const clean = sanitizeSuggestionBody(req.body || {});
    const dayKey = getUtcDayKey();
    const rateRef = db.collection(RATE_LIMIT_COLLECTION).doc(`${dayKey}_${clean.browserHash}`);
    const suggestionRef = db.collection(SUGGESTIONS_COLLECTION).doc();

    const result = await db.runTransaction(async tx => {
      const rateSnap = await tx.get(rateRef);
      const currentCount = Number(rateSnap.data()?.count || 0);

      if (currentCount >= DAILY_BROWSER_LIMIT) {
        throw badRequest('This browser has reached the daily tag suggestion limit. Please try again tomorrow.', 429);
      }

      const nextCount = currentCount + 1;
      const now = FieldValue.serverTimestamp();
      const selectedPeople = clean.selectedPeople;
      const peopleKeys = selectedPeople.map(person => person.tagKey);
      const peopleLabels = selectedPeople.map(person => person.tagLabel);

      tx.set(suggestionRef, {
        status: 'pending',
        target: clean.target,
        selectedPeople,
        peopleKeys,
        peopleLabels,
        otherNames: clean.otherNames,
        browserHash: clean.browserHash,
        browserDay: dayKey,
        userAgent: cleanString(req.get('user-agent'), 240),
        createdAt: now,
        updatedAt: now,
        version: 1
      });

      tx.set(rateRef, {
        browserHash: clean.browserHash,
        browserDay: dayKey,
        count: nextCount,
        firstSubmittedAt: rateSnap.exists ? rateSnap.data().firstSubmittedAt : now,
        lastSubmittedAt: now,
        updatedAt: now
      }, { merge: true });

      return { id: suggestionRef.id, remaining: Math.max(0, DAILY_BROWSER_LIMIT - nextCount) };
    });

    res.json({ ok: true, ...result, limitPerBrowserPerDay: DAILY_BROWSER_LIMIT });
  } catch (error) {
    console.error('submitFamilyPhotoTagSuggestion error:', error);
    res.status(error.status || 400).json({ error: error.message || 'Could not submit this tag suggestion.' });
  }
});