const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const FAMILY_DIRECTORY_COLLECTION = 'familyDirectory';
const FAMILY_PHOTO_TAGS_COLLECTION = 'familyPhotoTags';

const FUNCTION_OPTS = {
  region: 'us-central1',
  invoker: 'public',
  minInstances: 0
};

const ALLOWED_ORIGINS = new Set([
  'https://jorgeranilla.com',
  'https://www.jorgeranilla.com',
  'https://jorgeranilla-site.web.app',
  'https://jorgeranilla-site.firebaseapp.com',
  'null'
]);
const LOCAL_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

function sendCors(req, res, methods = 'POST, OPTIONS') {
  const origin = req.get('origin') || '';

  if (ALLOWED_ORIGINS.has(origin) || LOCAL_ORIGIN_RE.test(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
  }

  res.set('Access-Control-Allow-Methods', methods);
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return true;
  }

  return false;
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function cleanString(value, maxLength = 240) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function makeSlug(value) {
  return cleanString(value, 180)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isImportedRecord(id, data = {}) {
  const uid = String(data.uid || '');
  return String(id || '').startsWith('import_') ||
    String(id || '').startsWith('manual_') ||
    uid.startsWith('import_') ||
    uid.startsWith('manual_');
}

function isClaimableProfile(docSnap, uid, emailLower) {
  if (!docSnap.exists) return false;
  if (docSnap.id === uid) return false;

  const data = docSnap.data() || {};
  if (data.isPhotoTagOnly === true) return false;
  if (String(data.status || '') === 'claimed') return false;
  if (data.claimedByUid && data.claimedByUid !== uid) return false;

  const docEmail = normalizeEmail(data.emailLower || data.email);
  if (!docEmail || docEmail !== emailLower) return false;

  // These are the profiles created by admin/import/sync flows and safe to auto-claim by email.
  return isImportedRecord(docSnap.id, data) || data.claimableByEmail === true;
}

function mergeClaimedProfileData(user, sourceData = {}, existingData = {}) {
  const emailLower = normalizeEmail(user.email || sourceData.email || existingData.email);
  const now = FieldValue.serverTimestamp();

  return {
    uid: user.uid,
    displayName: sourceData.displayName || existingData.displayName || user.name || user.email || '',
    email: user.email || existingData.email || sourceData.email || '',
    emailLower,
    photoURL: sourceData.photoURL || existingData.photoURL || user.picture || '',
    phone: sourceData.phone || existingData.phone || '',
    address: sourceData.address || existingData.address || '',
    city: sourceData.city || existingData.city || '',
    country: sourceData.country || existingData.country || '',
    birthday: sourceData.birthday || existingData.birthday || '',
    preferredContact: sourceData.preferredContact || existingData.preferredContact || (user.email ? 'email' : 'phone'),
    role: sourceData.role || existingData.role || 'member',
    status: 'approved',
    privacy: sourceData.privacy || existingData.privacy || {
      showPhone: true,
      showEmail: true,
      showAddress: false,
      showBirthday: true,
      showAge: false
    },
    isPhotoTagOnly: false,
    claimedByUid: user.uid,
    claimedByEmail: user.email || sourceData.email || '',
    claimedAt: now,
    updatedAt: now,
    createdAt: sourceData.createdAt || existingData.createdAt || now,
    googleContactResourceName: sourceData.googleContactResourceName || existingData.googleContactResourceName || '',
    googleContactEtag: sourceData.googleContactEtag || existingData.googleContactEtag || '',
    googleContactLabels: sourceData.googleContactLabels || existingData.googleContactLabels || [],
    googleContactLastSyncedAt: sourceData.googleContactLastSyncedAt || existingData.googleContactLastSyncedAt || null,
    pageSlug: sourceData.pageSlug || existingData.pageSlug || '',
    pageUrl: sourceData.pageUrl || existingData.pageUrl || '',
    publicProfileName: sourceData.publicProfileName || existingData.publicProfileName || '',
    syncSource: sourceData.syncSource || existingData.syncSource || ''
  };
}

function profileResponse(uid, data = {}) {
  return {
    id: uid,
    uid,
    displayName: data.displayName || '',
    email: data.email || '',
    emailLower: data.emailLower || '',
    photoURL: data.photoURL || '',
    phone: data.phone || '',
    address: data.address || '',
    city: data.city || '',
    country: data.country || '',
    birthday: data.birthday || '',
    preferredContact: data.preferredContact || 'email',
    role: data.role || 'member',
    status: data.status || 'approved',
    privacy: data.privacy || {},
    isPhotoTagOnly: data.isPhotoTagOnly === true,
    claimedFrom: data.claimedFrom || '',
    claimedByUid: data.claimedByUid || uid,
    claimedByEmail: data.claimedByEmail || data.email || '',
    pageSlug: data.pageSlug || '',
    pageUrl: data.pageUrl || '',
    publicProfileName: data.publicProfileName || ''
  };
}

function replaceArrayValue(values, oldValue, newValue) {
  const out = [];
  const seen = new Set();

  (Array.isArray(values) ? values : []).forEach(value => {
    const next = value === oldValue ? newValue : value;
    if (!next || seen.has(next)) return;
    seen.add(next);
    out.push(next);
  });

  return out;
}

function updatePhotoTagClaimReferences(tag, oldId, newId, displayName) {
  const oldKey = `member:${oldId}`;
  const newKey = `member:${newId}`;
  const personSlug = makeSlug(displayName || newId);
  const people = replaceArrayValue(tag.people || [], oldKey, newKey);
  const personIds = replaceArrayValue(tag.personIds || [], oldId, newId);
  const peopleLabels = Array.isArray(tag.peopleLabels) ? [...tag.peopleLabels] : [];
  const peopleAliases = Array.isArray(tag.peopleAliases) ? [...tag.peopleAliases] : [];
  let changed = false;

  if (JSON.stringify(people) !== JSON.stringify(tag.people || [])) changed = true;
  if (JSON.stringify(personIds) !== JSON.stringify(tag.personIds || [])) changed = true;

  const memberIndex = people.indexOf(newKey);
  if (memberIndex >= 0) {
    while (peopleLabels.length <= memberIndex) peopleLabels.push('');
    while (peopleAliases.length <= memberIndex) peopleAliases.push('');

    if (displayName && peopleLabels[memberIndex] !== displayName) {
      peopleLabels[memberIndex] = displayName;
      changed = true;
    }

    if (personSlug && peopleAliases[memberIndex] !== personSlug) {
      peopleAliases[memberIndex] = personSlug;
      changed = true;
    }
  }

  return changed ? { people, personIds, peopleLabels, peopleAliases } : null;
}

async function migratePhotoTagsForClaim(oldId, newId, displayName) {
  if (!oldId || !newId || oldId === newId) return 0;

  const tagsRef = db.collection(FAMILY_PHOTO_TAGS_COLLECTION);
  const oldKey = `member:${oldId}`;
  const tagDocs = new Map();
  const queries = [
    tagsRef.where('people', 'array-contains', oldKey),
    tagsRef.where('personIds', 'array-contains', oldId)
  ];

  for (const query of queries) {
    const snap = await query.get();
    snap.docs.forEach(doc => tagDocs.set(doc.id, doc));
  }

  let batch = db.batch();
  let batchCount = 0;
  let migrated = 0;

  for (const docSnap of tagDocs.values()) {
    const update = updatePhotoTagClaimReferences(docSnap.data() || {}, oldId, newId, displayName);
    if (!update) continue;

    batch.update(docSnap.ref, {
      ...update,
      updatedAt: FieldValue.serverTimestamp()
    });
    batchCount++;
    migrated++;

    if (batchCount >= 450) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) await batch.commit();
  return migrated;
}

async function findClaimableProfile(uid, emailLower, originalEmail = '') {
  const found = new Map();
  const addDocs = snap => snap.docs.forEach(doc => found.set(doc.id, doc));

  const byEmailLower = await db.collection(FAMILY_DIRECTORY_COLLECTION)
    .where('emailLower', '==', emailLower)
    .limit(10)
    .get();
  addDocs(byEmailLower);

  const exactEmails = [emailLower, originalEmail]
    .map(value => cleanString(value, 320))
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index);

  for (const email of exactEmails) {
    const byEmail = await db.collection(FAMILY_DIRECTORY_COLLECTION)
      .where('email', '==', email)
      .limit(10)
      .get();
    addDocs(byEmail);
  }

  let candidates = Array.from(found.values()).filter(doc => isClaimableProfile(doc, uid, emailLower));

  if (candidates.length === 0) {
    const documentId = admin.firestore.FieldPath.documentId();
    const fallbackQueries = [
      db.collection(FAMILY_DIRECTORY_COLLECTION).where(documentId, '>=', 'import_').where(documentId, '<', 'import`').orderBy(documentId).limit(300),
      db.collection(FAMILY_DIRECTORY_COLLECTION).where(documentId, '>=', 'manual_').where(documentId, '<', 'manual`').orderBy(documentId).limit(300)
    ];

    for (const query of fallbackQueries) {
      const snap = await query.get();
      snap.docs.forEach(doc => found.set(doc.id, doc));
    }

    candidates = Array.from(found.values()).filter(doc => isClaimableProfile(doc, uid, emailLower));
  }

  candidates.sort((a, b) => {
    const aImport = isImportedRecord(a.id, a.data()) ? 0 : 1;
    const bImport = isImportedRecord(b.id, b.data()) ? 0 : 1;
    if (aImport !== bImport) return aImport - bImport;
    return a.id.localeCompare(b.id);
  });

  return candidates[0] || null;
}

exports.claimFamilyProfileByEmail = onRequest(FUNCTION_OPTS, async (req, res) => {
  if (sendCors(req, res) || req.method !== 'POST') {
    if (req.method !== 'OPTIONS' && req.method !== 'POST') res.status(405).json({ error: 'POST only.' });
    return;
  }

  try {
    const auth = req.headers.authorization || '';
    const token = auth.replace(/^Bearer\s+/i, '').trim();
    if (!token) return res.status(401).json({ error: 'Sign in before claiming a profile.' });

    const decoded = await admin.auth().verifyIdToken(token);
    const emailLower = normalizeEmail(decoded.email);
    if (!decoded.uid || !emailLower) {
      return res.status(400).json({ error: 'Your Google account does not have an email that can be matched.' });
    }

    const existingRef = db.collection(FAMILY_DIRECTORY_COLLECTION).doc(decoded.uid);
    const existingSnap = await existingRef.get();
    const existingData = existingSnap.exists ? existingSnap.data() || {} : {};

    const claimDoc = await findClaimableProfile(decoded.uid, emailLower, decoded.email || '');
    if (!claimDoc) {
      if (existingSnap.exists && existingData.status === 'approved' && existingData.uid === decoded.uid) {
        return res.json({ claimed: false, alreadyClaimed: true, profile: profileResponse(decoded.uid, existingData), migratedPhotoTags: 0 });
      }

      return res.json({ claimed: false, profile: existingSnap.exists ? profileResponse(decoded.uid, existingData) : null, migratedPhotoTags: 0 });
    }

    const sourceData = claimDoc.data() || {};
    const claimedData = mergeClaimedProfileData(decoded, sourceData, existingData);
    claimedData.claimedFrom = claimDoc.id;

    await existingRef.set(claimedData, { merge: true });
    await claimDoc.ref.set({
      status: 'claimed',
      claimedByUid: decoded.uid,
      claimedByEmail: decoded.email || sourceData.email || '',
      claimedReplacementUid: decoded.uid,
      claimedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    const migratedPhotoTags = await migratePhotoTagsForClaim(claimDoc.id, decoded.uid, claimedData.displayName);

    return res.json({
      claimed: true,
      claimedFrom: claimDoc.id,
      migratedPhotoTags,
      profile: profileResponse(decoded.uid, { ...claimedData, claimedFrom: claimDoc.id })
    });
  } catch (error) {
    console.error('claimFamilyProfileByEmail error:', error);
    return res.status(500).json({ error: error.message || 'Could not claim this profile.' });
  }
});