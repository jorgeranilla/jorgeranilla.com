/* ═══════════════════════════════════════════
   Directory Profile – Firebase Logic
   Auth · Firestore · RBAC
═══════════════════════════════════════════ */

// Firebase config (jorgeranilla-site)
const firebaseConfig = {
  apiKey: "AIzaSyBc0zrXLzr9Qhq9iuhXLAXOzbkQ13mEaU4",
  authDomain: "jorgeranilla-site.firebaseapp.com",
  projectId: "jorgeranilla-site",
  storageBucket: "jorgeranilla-site.firebasestorage.app",
  messagingSenderId: "125483521813",
  appId: "1:125483521813:web:f48b02d491cb4c698ffb1c"
};

/* ── Globals ── */
let app, auth, db, currentUser = null, currentProfile = null;
let isAdmin = false;
let fdAuthWatchdog = null;
const COLLECTION = 'familyDirectory';
const FD_PHOTO_TAGS_COLLECTION = 'familyPhotoTags';
const FD_MEMBER_REQUESTS_COLLECTION = 'familyMemberRequests';
const FD_CLAIM_PROFILE_ENDPOINT = 'https://us-central1-jorgeranilla-site.cloudfunctions.net/claimFamilyProfileByEmail';
const FD_AUTH_TIMEOUT_MS = 25000;
const GOOGLE_CONTACTS_SCOPE = 'https://www.googleapis.com/auth/contacts.readonly';
const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';
const GOOGLE_DRIVE_TOKEN_TTL_MS = 50 * 60 * 1000;
let fdGoogleDriveAccessToken = '';
let fdGoogleDriveAccessTokenExpiresAt = 0;
let fdGoogleDriveAccessTokenUid = '';
const FD_PUBLIC_PROFILE_ROOT = 'https://jorgeranilla.com/family/';
const FD_PUBLIC_PROFILE_PAGES = Object.freeze([
  { name: "Adriana Astocondor", slug: "adriana-astocondor", aliases: ["adriana"] },
  { name: "Alcira Astocondor", slug: "alcira-astocondor", aliases: ["alcira-isabel"] },
  { name: "Alcira Lopez Ruiz", slug: "alcira-lopez-ruiz", aliases: ["alcira-victoria", "alcira-victoria-lopez"] },
  { name: "Alessandra Briceno", slug: "alessandra-briceno", aliases: ["alessandra"] },
  { name: "Alyssa Ranilla", slug: "alyssa-ranilla", aliases: ["alyssa"] },
  { name: "Aurora Rondon Perea", slug: "aurora-rondon-perea", aliases: [] },
  { name: "Carlota Astocondor Salazar Lopez", slug: "carlota-astocondor-salazar-lopez", aliases: ["maria-carlota-astocondor", "maria-carlota-astocondor-salazar-lopez"] },
  { name: "Carlota Ruiz Guevara", slug: "carlota-ruiz-guevara", aliases: ["maria-carlota", "maria-carlota-ruiz", "maria-carlota-ruiz-guevara"] },
  { name: "Carlota Salazar Mateo", slug: "carlota-salazar-mateo", aliases: [] },
  { name: "Carolina Ranilla", slug: "carolina-ranilla", aliases: ["carolina"] },
  { name: "Ernesto Herrera", slug: "ernesto-herrera", aliases: ["ernesto"] },
  { name: "Eugenio Astocondor", slug: "eugenio-astocondor", aliases: ["eugenio-jesus"] },
  { name: "Eugenio Astocondor Fuertes", slug: "eugenio-astocondor-fuertes", aliases: [] },
  { name: "Eugenio Astocondor Salazar", slug: "eugenio-astocondor-salazar", aliases: [] },
  { name: "Eugenio Astocondor Salazar Lopez", slug: "eugenio-astocondor-salazar-lopez", aliases: ["eugenio-augusto", "eugenio-augusto-astocondor"] },
  { name: "Fatima Astocondor", slug: "fatima-astocondor", aliases: ["fatima", "fatima-celeste"] },
  { name: "Fernando Astocondor", slug: "fernando-astocondor", aliases: ["fernando-jose"] },
  { name: "Fernando Astocondor Salazar Lopez", slug: "fernando-astocondor-salazar-lopez", aliases: ["luis-fernando-astocondor-salazar-lopez"] },
  { name: "Fernando Pallete", slug: "fernando-pallete", aliases: ["fernando-javier"] },
  { name: "Gabriel Astocondor", slug: "gabriel-astocondor", aliases: ["gabriel"] },
  { name: "Hector Briceno", slug: "hector-briceno", aliases: ["hector"] },
  { name: "Janet Ranilla Cateriano", slug: "janet-ranilla-cateriano", aliases: ["janet", "janet-cecilia"] },
  { name: "Jorge Astocondor", slug: "jorge-astocondor", aliases: ["jorge-gelasio", "jorge-astocondor-fuertes"] },
  { name: "Jorge Ranilla", slug: "jorge-ranilla", aliases: ["jorge"] },
  { name: "Jorge Ranilla Cateriano", slug: "jorge-ranilla-cateriano", aliases: ["jorge-luis", "jorge-luis-ranilla"] },
  { name: "Jose Dalicio Lopez Lopez", slug: "jose-dalicio-lopez-lopez", aliases: ["jose-dalicio-lopez"] },
  { name: "Lorenzo Lu", slug: "lorenzo-lu", aliases: ["lorenzo-david"] },
  { name: "Lucila Dongo Salcedo", slug: "lucila-dongo-salcedo", aliases: [] },
  { name: "Luis Fernando Astocondor", slug: "luis-fernando-astocondor", aliases: ["luis-fernando"] },
  { name: "Luisa Astocondor", slug: "luisa-astocondor", aliases: ["luisa-cristina"] },
  { name: "Alcira Astocondor Salazar Lopez", slug: "alcira-astocondor-salazar-lopez", aliases: ["maria-alcira", "maria-alcira-del-carmen-astocondor", "maria-alcira-del-carmen"] },
  { name: "Maria Jesus Cateriano Dongo", slug: "maria-jesus-cateriano-dongo", aliases: ["maria-jesus-cateriano"] },
  { name: "Maria Ranilla", slug: "maria-ranilla", aliases: ["maria", "maria-eugenia", "maria-eugenia-ranilla"] },
  { name: "Milagros Herrera", slug: "milagros-herrera", aliases: ["milagros"] },
  { name: "Monica Astocondor", slug: "monica-astocondor", aliases: ["monica-del-carmen"] },
  { name: "Oscar Ranilla", slug: "oscar-ranilla", aliases: [] },
  { name: "Oscar Ranilla Cateriano", slug: "oscar-ranilla-cateriano", aliases: ["oscar-alberto"] },
  { name: "Paola Pallete", slug: "paola-pallete", aliases: ["paola-andrea"] },
  { name: "Paola Ranilla", slug: "paola-ranilla", aliases: ["paola-josefina"] },
  { name: "Raul Ranilla", slug: "raul-ranilla", aliases: [] },
  { name: "Raul Ranilla Cateriano", slug: "raul-ranilla-cateriano", aliases: ["raul-sergio-victor"] },
  { name: "Sebastian Astocondor", slug: "sebastian-astocondor", aliases: ["sebastian", "sebastian-martin"] },
  { name: "Sergio Ranilla Ranilla", slug: "sergio-ranilla-ranilla", aliases: [] },
  { name: "Sergio Ranilla Rondon", slug: "sergio-ranilla-rondon", aliases: ["sergio-raul-ranilla"] },
  { name: "Shane Ranilla", slug: "shane-ranilla", aliases: ["shane"] },
  { name: "Sylvia Astocondor Salazar Lopez", slug: "sylvia-astocondor-salazar-lopez", aliases: ["sylvia", "sylvia-ines", "sylvia-ines-astocondor"] },
  { name: "Victor Ranilla", slug: "victor-ranilla", aliases: ["victor", "victor-andres", "victor-andres-ranilla"] },
  { name: "Victoriano Cateriano", slug: "victoriano-cateriano", aliases: [] }
]);
const FD_PUBLIC_PROFILE_SLUGS = new Set(FD_PUBLIC_PROFILE_PAGES.map(profile => profile.slug));
const FD_PUBLIC_PROFILE_BY_KEY = (() => {
  const map = new Map();
  FD_PUBLIC_PROFILE_PAGES.forEach(profile => {
    [profile.name, profile.slug, ...(profile.aliases || [])].forEach(value => {
      const key = fdPublicProfileKey(value);
      if (key && !map.has(key)) map.set(key, profile);
    });
  });
  return map;
})();

function fdPublicProfileKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u200D\uFE0E\uFE0F]/g, '')
    .replace(/[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, '-');
}

function fdExtractPublicProfileSlug(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  const urlMatch = text.match(/\/family\/([a-z0-9-]+)(?:\.html)?(?:[?#].*)?$/i);
  if (urlMatch) return urlMatch[1].toLowerCase();
  return fdPublicProfileKey(text);
}

function fdPublicProfileUrl(slug) {
  const cleanSlug = fdExtractPublicProfileSlug(slug);
  return cleanSlug ? `${FD_PUBLIC_PROFILE_ROOT}${cleanSlug}.html` : '';
}

function fdPublicProfileHref(slug) {
  const cleanSlug = fdExtractPublicProfileSlug(slug);
  return cleanSlug ? `../family/${cleanSlug}.html` : '';
}

function fdFindPublicProfileBySlug(slug) {
  const cleanSlug = fdExtractPublicProfileSlug(slug);
  return FD_PUBLIC_PROFILE_PAGES.find(profile => profile.slug === cleanSlug) || null;
}

function fdResolvePublicProfile(member = {}) {
  const nameProfile = FD_PUBLIC_PROFILE_BY_KEY.get(fdPublicProfileKey(member.displayName || member.publicProfileName || member.name));
  const directSlug = fdExtractPublicProfileSlug(member.pageSlug || member.pageUrl || member.profileSlug || member.publicProfileSlug);
  const directProfile = fdFindPublicProfileBySlug(directSlug);

  if (nameProfile) return nameProfile;
  if (directProfile) return directProfile;

  const candidates = [member.id, member.uid, member.claimedFrom, member.googleContactName].filter(Boolean);
  for (const candidate of candidates) {
    const profile = FD_PUBLIC_PROFILE_BY_KEY.get(fdPublicProfileKey(candidate));
    if (profile) return profile;
  }

  return null;
}

function fdBuildPublicProfileUpdate(member = {}, existingMember = member) {
  const profile = fdResolvePublicProfile(member);
  if (!profile) return {};

  const target = {
    pageSlug: profile.slug,
    pageUrl: fdPublicProfileUrl(profile.slug),
    publicProfileName: profile.name
  };
  const updates = {};

  Object.entries(target).forEach(([key, value]) => {
    if (String(existingMember?.[key] || '') !== value) updates[key] = value;
  });

  return updates;
}

async function syncDirectoryPublicProfileLinks(members = []) {
  if (!isAdmin || !Array.isArray(members) || !window._fb?.writeBatch) return members;

  const { doc, writeBatch, serverTimestamp } = window._fb;
  const nextMembers = members.map(member => ({ ...member }));
  let batch = writeBatch(db);
  let writes = 0;
  let total = 0;

  for (const member of nextMembers) {
    const updates = fdBuildPublicProfileUpdate(member, member);
    if (Object.keys(updates).length === 0) continue;

    Object.assign(member, updates);
    batch.update(doc(db, COLLECTION, member.id), {
      ...updates,
      publicProfileLinkedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    writes++;
    total++;

    if (writes >= 450) {
      await batch.commit();
      batch = writeBatch(db);
      writes = 0;
    }
  }

  if (writes > 0) await batch.commit();
  if (total > 0) console.info(`Directory public page links synced for ${total} profile${total === 1 ? '' : 's'}.`);
  return nextMembers;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function isImportedFamilyRecord(member = {}) {
  const id = String(member.id || '');
  const uid = String(member.uid || '');
  return id.startsWith('import_') ||
    id.startsWith('manual_') ||
    uid.startsWith('import_') ||
    uid.startsWith('manual_');
}

function isClaimedFamilyRecord(member = {}) {
  if (member.status === 'claimed') return true;
  if (member.claimedBy || member.claimedByUid || member.claimedAt) return true;
  if (member.claimedFrom && !isImportedFamilyRecord(member)) return true;
  return Boolean(member.uid && member.id === member.uid && !isImportedFamilyRecord(member));
}

function getFamilyRecordClaimStatus(member = {}) {
  if (member.status === 'pending') return 'pending';
  if (isClaimedFamilyRecord(member)) return 'claimed';
  return 'unclaimed';
}

async function findClaimableProfileByEmail(email) {
  const { collection, documentId, getDocs, query, where, orderBy } = window._fb;
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) return null;

  const foundMatches = new Map();
  const claimQueries = [
    query(
      collection(db, COLLECTION),
      where(documentId(), '>=', 'import_'),
      where(documentId(), '<', 'import`'),
      orderBy(documentId())
    ),
    query(
      collection(db, COLLECTION),
      where(documentId(), '>=', 'manual_'),
      where(documentId(), '<', 'manual`'),
      orderBy(documentId())
    )
  ];

  for (const claimQuery of claimQueries) {
    const matchSnap = await getDocs(claimQuery);
    matchSnap.docs.forEach(d => foundMatches.set(d.id, d));
  }

  return Array.from(foundMatches.values()).find(d => {
    const data = d.data();
    const isClaimableRecord = d.id.startsWith('import_') ||
      d.id.startsWith('manual_') ||
      (data.uid && data.uid.startsWith('import_')) ||
      (data.uid && data.uid.startsWith('manual_'));

    return isClaimableRecord &&
      data.isPhotoTagOnly !== true &&
      normalizeEmail(data.email) === normalizedEmail &&
      data.status !== 'claimed';
  }) || null;
}

function mergeClaimedProfileData(user, importDoc, existingData = {}) {
  const importData = importDoc.data();
  const normalizedEmail = normalizeEmail(user.email || importData.email);

  return {
    uid: user.uid,
    displayName: user.displayName || existingData.displayName || importData.displayName || '',
    email: user.email || existingData.email || importData.email || '',
    emailLower: normalizedEmail,
    photoURL: user.photoURL || existingData.photoURL || importData.photoURL || '',
    phone: existingData.phone || importData.phone || '',
    address: existingData.address || importData.address || '',
    city: existingData.city || importData.city || '',
    country: existingData.country || importData.country || '',
    birthday: existingData.birthday || importData.birthday || '',
    preferredContact: existingData.preferredContact || importData.preferredContact || 'email',
    role: existingData.role || importData.role || 'member',
    status: 'approved',
    privacy: existingData.privacy || importData.privacy || {
      showPhone: true,
      showEmail: true,
      showAddress: false,
      showBirthday: true,
      showAge: false
    },
    claimedFrom: importDoc.id,
    claimedByUid: user.uid,
    claimedByEmail: user.email || importData.email || '',
    claimedAt: window._fb.serverTimestamp(),
    googleContactResourceName: existingData.googleContactResourceName || importData.googleContactResourceName || '',
    googleContactEtag: existingData.googleContactEtag || importData.googleContactEtag || '',
    googleContactLabels: existingData.googleContactLabels || importData.googleContactLabels || [],
    googleContactLastSyncedAt: existingData.googleContactLastSyncedAt || importData.googleContactLastSyncedAt || null,
    pageSlug: existingData.pageSlug || importData.pageSlug || '',
    pageUrl: existingData.pageUrl || importData.pageUrl || '',
    publicProfileName: existingData.publicProfileName || importData.publicProfileName || '',
    syncSource: existingData.syncSource || importData.syncSource || '',
    createdAt: existingData.createdAt || importData.createdAt,
    updatedAt: window._fb.serverTimestamp()
  };
}

async function cleanupClaimedImport(importDoc, uid) {
  const { doc, deleteDoc, updateDoc, serverTimestamp } = window._fb;

  try {
    await deleteDoc(doc(db, COLLECTION, importDoc.id));
  } catch (delErr) {
    console.warn('Could not delete old import record, marking as claimed:', delErr);
    await updateDoc(doc(db, COLLECTION, importDoc.id), {
      status: 'claimed',
      claimedBy: uid,
      claimedByUid: uid,
      claimedByEmail: currentUser?.email || '',
      claimedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
}

async function autoClaimExistingImport(user, profileRef, existingData = {}) {
  const { setDoc } = window._fb;
  const importDoc = await findClaimableProfileByEmail(user.email);

  if (!importDoc) return null;

  const claimedData = mergeClaimedProfileData(user, importDoc, existingData);
  await setDoc(profileRef, claimedData);
  await cleanupClaimedImport(importDoc, user.uid);
  return { id: user.uid, ...claimedData };
}

async function fdClaimFamilyProfileByEmail(user) {
  if (!user || typeof user.getIdToken !== 'function') return null;

  const token = await user.getIdToken();
  const response = await fetch(FD_CLAIM_PROFILE_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Could not claim matching profile.');
  }

  if (!data.claimed && !data.alreadyClaimed) return null;

  const migrated = Number(data.migratedPhotoTags || 0);
  if (data.claimed && migrated > 0) {
    fdToast(`Profile linked and ${migrated} photo tag${migrated === 1 ? '' : 's'} updated.`);
  }

  return data.profile ? { id: data.profile.id || user.uid, ...data.profile } : null;
}

async function syncGoogleIdentity(user, profileRef, profileData) {
  if (profileData?.status === 'approved' && profileData?.role !== 'admin') return profileData;

  const { updateDoc, serverTimestamp } = window._fb;
  const updates = {};

  if (user.email && normalizeEmail(profileData.email) !== normalizeEmail(user.email)) {
    updates.email = user.email;
    updates.emailLower = normalizeEmail(user.email);
  } else if (user.email && !profileData.emailLower) {
    updates.emailLower = normalizeEmail(user.email);
  }

  if (user.photoURL && profileData.photoURL !== user.photoURL) {
    updates.photoURL = user.photoURL;
  }

  if (Object.keys(updates).length === 0) return profileData;

  updates.updatedAt = serverTimestamp();
  await updateDoc(profileRef, updates);
  return { ...profileData, ...updates };
}

/* ── Init ── */
function fdClearAuthWatchdog() {
  if (fdAuthWatchdog) {
    clearTimeout(fdAuthWatchdog);
    fdAuthWatchdog = null;
  }

  if (window.fdPhotoTagsStartupTimer) {
    clearTimeout(window.fdPhotoTagsStartupTimer);
    window.fdPhotoTagsStartupTimer = null;
  }
}

function fdSetLoadingMessage(message) {
  const loadingEl = document.getElementById('fd-loading');
  const label = loadingEl?.querySelector('[data-fd-loading-message]') || loadingEl?.querySelector('span');
  if (label) label.textContent = message;
}

function fdStartAuthWatchdog(detail) {
  fdClearAuthWatchdog();
  fdAuthWatchdog = setTimeout(() => {
    fdShowLoadError('This is taking longer than expected.', detail || 'Refresh the page and try again.');
  }, FD_AUTH_TIMEOUT_MS);
}

function fdShowLoadError(title = 'Could not load Directory Profile.', detail = 'Refresh the page and try again.') {
  fdClearAuthWatchdog();

  const loadingEl = document.getElementById('fd-loading');
  const authGate = document.getElementById('fd-auth-gate');
  const pendingEl = document.getElementById('fd-pending');
  const appEl = document.getElementById('fd-app');

  if (authGate) authGate.style.display = 'none';
  if (pendingEl) pendingEl.style.display = 'none';
  if (appEl) appEl.classList.remove('active');
  if (!loadingEl) return;

  loadingEl.style.display = 'flex';
  loadingEl.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'fd-auth-card';

  const label = document.createElement('p');
  label.className = 'fd-auth-label';
  label.textContent = 'Load Error';

  const heading = document.createElement('h1');
  heading.className = 'fd-auth-title';
  heading.textContent = title;

  const body = document.createElement('p');
  body.className = 'fd-auth-sub';
  body.textContent = detail;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'fd-google-btn';
  button.textContent = 'Refresh Page';
  button.addEventListener('click', () => window.location.reload());

  card.append(label, heading, body, button);
  loadingEl.appendChild(card);
}

async function fdInit() {
  fdSetLoadingMessage('Checking sign-in...');
  fdStartAuthWatchdog('Still checking your sign-in. Refresh the page if this keeps spinning.');

  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js');
    const { getAuth, onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider }
      = await import('https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js');
    const { getFirestore, collection, doc, documentId, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, writeBatch }
      = await import('https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js');

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    window._fb = {
      auth, db, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
      collection, doc, documentId, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
      query, where, orderBy, serverTimestamp, writeBatch
    };

    onAuthStateChanged(auth, handleAuthState, error => {
      console.error('Auth state error:', error);
      fdShowLoadError('Could not check sign-in status.', error.message || 'Refresh the page and try again.');
    });
  } catch (error) {
    console.error('Family directory startup error:', error);
    fdShowLoadError('Could not start Directory Profile.', error.message || 'Refresh the page and try again.');
    throw error;
  }
}

async function handleAuthState(user) {
  const loadingEl = document.getElementById('fd-loading');
  const authGate = document.getElementById('fd-auth-gate');
  const appEl = document.getElementById('fd-app');
  const pendingEl = document.getElementById('fd-pending');

  try {
    if (!user) {
      fdClearGoogleDriveAccessToken();
      currentUser = null;
      currentProfile = null;
      isAdmin = false;
      fdClearAuthWatchdog();
      if (loadingEl) loadingEl.style.display = 'none';
      if (authGate) authGate.style.display = 'flex';
      if (appEl) appEl.classList.remove('active');
      if (pendingEl) pendingEl.style.display = 'none';
      return;
    }

    if (currentUser?.uid && currentUser.uid !== user.uid) fdClearGoogleDriveAccessToken();
    currentUser = user;
    fdSetLoadingMessage('Loading your profile...');
    fdStartAuthWatchdog('Still loading your profile. Refresh the page if this keeps spinning.');
    if (loadingEl) loadingEl.style.display = 'flex';
    if (authGate) authGate.style.display = 'none';

    const { doc, getDoc } = window._fb;
    const profileRef = doc(db, COLLECTION, user.uid);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      currentProfile = { id: profileSnap.id, ...profileSnap.data() };
      if (currentProfile.status !== 'approved') {
        try {
          const claimedProfile = await fdClaimFamilyProfileByEmail(user);
          if (claimedProfile) currentProfile = claimedProfile;
        } catch (claimErr) {
          console.warn('Could not auto-claim matching profile:', claimErr);
        }
      }
      currentProfile = await syncGoogleIdentity(user, profileRef, currentProfile);
      isAdmin = currentProfile.role === 'admin';

      if (currentProfile.status !== 'approved' && !isAdmin) {
        fdClearAuthWatchdog();
        if (loadingEl) loadingEl.style.display = 'none';
        if (pendingEl) {
          pendingEl.style.display = 'flex';
          const nameEl = pendingEl.querySelector('.fd-pending-name');
          if (nameEl) nameEl.textContent = user.displayName || user.email;
        }
        return;
      }

      fdClearAuthWatchdog();
      if (loadingEl) loadingEl.style.display = 'none';
      if (appEl) appEl.classList.add('active');
      updateNavUser();
      if (typeof onPageReady === 'function') onPageReady();
      return;
    }

    const { setDoc, serverTimestamp } = window._fb;
    let claimedProfile = null;

    try {
      claimedProfile = await fdClaimFamilyProfileByEmail(user);
      if (claimedProfile) console.log(`Claimed matching profile -> ${user.uid}`);
    } catch (err) {
      console.warn('Could not auto-claim matching profile:', err);
    }

    if (claimedProfile) {
      currentProfile = claimedProfile;
      isAdmin = currentProfile.role === 'admin';

      fdClearAuthWatchdog();
      if (loadingEl) loadingEl.style.display = 'none';
      if (appEl) appEl.classList.add('active');
      updateNavUser();
      fdToast('Welcome! Your profile has been linked.');
      if (typeof onPageReady === 'function') onPageReady();
      return;
    }

    const newProfile = {
      uid: user.uid,
      displayName: user.displayName || '',
      email: user.email || '',
      emailLower: normalizeEmail(user.email),
      photoURL: user.photoURL || '',
      phone: '',
      address: '',
      city: '',
      country: '',
      birthday: '',
      preferredContact: 'email',
      role: 'member',
      status: 'pending',
      privacy: {
        showPhone: true,
        showEmail: true,
        showAddress: false,
        showBirthday: true,
        showAge: false
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(profileRef, newProfile);
    currentProfile = { id: user.uid, ...newProfile };

    fdClearAuthWatchdog();
    if (loadingEl) loadingEl.style.display = 'none';
    if (pendingEl) {
      pendingEl.style.display = 'flex';
      const nameEl = pendingEl.querySelector('.fd-pending-name');
      if (nameEl) nameEl.textContent = user.displayName || user.email;
    }
  } catch (error) {
    console.error('Family directory load error:', error);
    fdShowLoadError('Could not load Directory Profile.', error.message || 'Refresh the page and try again.');
  }
}
function fdSignIn() {
  const { auth, GoogleAuthProvider, signInWithPopup } = window._fb;
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider).catch(err => {
    console.error('Sign-in error:', err);
    fdToast('Could not sign in. Please try again.');
  });
}

/* ── Sign Out ── */
async function fdGetGoogleContactsAccessToken() {
  if (!isAdmin) {
    throw new Error('Only admins can sync Google Contacts.');
  }

  const { auth, GoogleAuthProvider, signInWithPopup } = window._fb;
  const provider = new GoogleAuthProvider();
  provider.addScope(GOOGLE_CONTACTS_SCOPE);
  provider.setCustomParameters({ prompt: 'consent' });

  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);

  if (!credential?.accessToken) {
    throw new Error('Google did not return a Contacts access token.');
  }

  return credential.accessToken;
}

function fdClearGoogleDriveAccessToken() {
  fdGoogleDriveAccessToken = '';
  fdGoogleDriveAccessTokenExpiresAt = 0;
  fdGoogleDriveAccessTokenUid = '';
}

async function fdGetGoogleDriveAccessToken({ forceRefresh = false } = {}) {
  if (!isAdmin) {
    throw new Error('Only admins can update Google Drive files.');
  }

  const uid = auth?.currentUser?.uid || currentUser?.uid || '';
  const now = Date.now();
  if (!forceRefresh && fdGoogleDriveAccessToken && fdGoogleDriveAccessTokenUid === uid && now < fdGoogleDriveAccessTokenExpiresAt) {
    return fdGoogleDriveAccessToken;
  }

  const { auth: fbAuth, GoogleAuthProvider, signInWithPopup } = window._fb;
  const provider = new GoogleAuthProvider();
  provider.addScope(GOOGLE_DRIVE_SCOPE);

  const result = await signInWithPopup(fbAuth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);

  if (!credential?.accessToken) {
    fdClearGoogleDriveAccessToken();
    throw new Error('Google did not return a Drive access token.');
  }

  fdGoogleDriveAccessToken = credential.accessToken;
  fdGoogleDriveAccessTokenUid = uid;
  fdGoogleDriveAccessTokenExpiresAt = Date.now() + GOOGLE_DRIVE_TOKEN_TTL_MS;
  return fdGoogleDriveAccessToken;
}

function fdSignOut() {
  fdClearGoogleDriveAccessToken();
  const { auth, signOut } = window._fb;
  signOut(auth);
}

/* ── Update Nav User Info ── */
function updateNavUser() {
  const avatarEl = document.getElementById('fd-user-avatar');
  const nameEl = document.getElementById('fd-user-name');
  if (avatarEl && currentUser) {
    avatarEl.src = currentUser.photoURL || '';
    avatarEl.alt = currentUser.displayName || '';
  }
  if (nameEl && currentUser) {
    nameEl.textContent = currentUser.displayName || currentUser.email;
  }
}

/* ── Fetch Approved Members ── */
async function fetchApprovedMembers() {
  const { collection, getDocs, query } = window._fb;
  const q = query(collection(db, COLLECTION));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(m => m.status === 'approved')
    .sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
}

/* ── Fetch All Members (Admin) ── */
async function fetchAllMembers() {
  const { collection, getDocs, query } = window._fb;
  const q = query(collection(db, COLLECTION));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
}

/* Member Change Requests */
const FD_PROFILE_REQUEST_FIELDS = [
  'displayName',
  'phone',
  'email',
  'address',
  'city',
  'country',
  'birthday',
  'photoURL',
  'preferredContact',
  'privacy',
  'pageText',
  'pageSourceUrl'
];

function fdCleanRequestString(value, maxLength = 600) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function fdCleanPageText(value, maxLength = 20000) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength);
}

function fdSanitizeProfilePayload(data = {}) {
  const payload = {};

  FD_PROFILE_REQUEST_FIELDS.forEach(field => {
    if (!(field in data)) return;

    if (field === 'privacy') {
      const privacy = data.privacy || {};
      payload.privacy = {
        showPhone: privacy.showPhone !== false,
        showEmail: privacy.showEmail !== false,
        showAddress: privacy.showAddress === true,
        showBirthday: privacy.showBirthday !== false,
        showAge: privacy.showAge === true
      };
      return;
    }

    if (field === 'pageText') {
      payload[field] = fdCleanPageText(data[field]);
      return;
    }

    const maxLength = field === 'photoURL' ? 250000 : field === 'pageSourceUrl' ? 900 : 600;
    payload[field] = fdCleanRequestString(data[field], maxLength);
  });

  if ('email' in payload) payload.emailLower = normalizeEmail(payload.email);
  return payload;
}

function fdSanitizePhotoRequestPayload(data = {}) {
  const url = fdCleanRequestString(data.url, 1200);
  const title = fdCleanRequestString(data.title, 180);
  const notes = fdCleanRequestString(data.notes || data.reason, 1000);
  const mediaType = fdCleanRequestString(data.mediaType || 'photo', 30).toLowerCase();

  return {
    mediaType: ['photo', 'video'].includes(mediaType) ? mediaType : 'photo',
    url,
    title,
    notes,
    reason: notes,
    photoId: fdCleanRequestString(data.photoId, 240),
    photoName: fdCleanRequestString(data.photoName, 240),
    thumbnailUrl: fdCleanRequestString(data.thumbnailUrl, 1200),
    mediaSource: fdCleanRequestString(data.mediaSource, 40)
  };
}

function fdRequestTimestampMs(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

async function submitFamilyMemberRequest(type, payload = {}) {
  if (!currentUser || !currentProfile) throw new Error('Sign in before submitting a request.');

  const allowedTypes = ['profile_update', 'photo_add', 'photo_remove'];
  if (!allowedTypes.includes(type)) throw new Error('Unsupported request type.');

  const { collection, doc, setDoc, serverTimestamp } = window._fb;
  const requestRef = doc(collection(db, FD_MEMBER_REQUESTS_COLLECTION));
  const cleanPayload = type === 'profile_update'
    ? fdSanitizeProfilePayload(payload)
    : fdSanitizePhotoRequestPayload(payload);

  await setDoc(requestRef, {
    type,
    status: 'pending',
    memberId: currentUser.uid,
    memberName: currentProfile.displayName || currentUser.displayName || '',
    memberEmail: currentProfile.email || currentUser.email || '',
    payload: cleanPayload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return { id: requestRef.id, type, status: 'pending', payload: cleanPayload };
}

async function fetchMyMemberRequests() {
  if (!currentUser) return [];

  const { collection, getDocs, query, where } = window._fb;
  const q = query(collection(db, FD_MEMBER_REQUESTS_COLLECTION), where('memberId', '==', currentUser.uid));
  const snap = await getDocs(q);

  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => fdRequestTimestampMs(b.createdAt) - fdRequestTimestampMs(a.createdAt));
}

async function fetchPendingMemberRequests() {
  if (!isAdmin) return [];

  const { collection, getDocs, query, where } = window._fb;
  const q = query(collection(db, FD_MEMBER_REQUESTS_COLLECTION), where('status', '==', 'pending'));
  const snap = await getDocs(q);

  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => fdRequestTimestampMs(a.createdAt) - fdRequestTimestampMs(b.createdAt));
}

async function saveProfile(data) {
  if (!currentUser) return null;
  const payload = fdSanitizeProfilePayload(data);

  if (isAdmin || currentProfile?.role === 'admin') {
    const { doc, updateDoc, serverTimestamp } = window._fb;
    const ref = doc(db, COLLECTION, currentUser.uid);
    await updateDoc(ref, { ...payload, updatedAt: serverTimestamp() });
    Object.assign(currentProfile, payload);
    return { status: 'saved' };
  }

  return submitFamilyMemberRequest('profile_update', payload);
}

async function submitPhotoAddRequest(data) {
  if (fdParseYoutubeId(data?.url)) {
    throw new Error('Video links are not accepted here. Please submit a Google Drive photo link.');
  }
  return submitFamilyMemberRequest('photo_add', { ...data, mediaType: 'photo' });
}

async function submitPhotoRemoveRequest(data) {
  return submitFamilyMemberRequest('photo_remove', data);
}

function fdParseYoutubeId(value) {
  const text = String(value || '').trim();
  if (!text) return '';

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{6,})/i,
    /^[a-zA-Z0-9_-]{6,}$/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1] || match[0];
  }

  return '';
}

function fdParseDriveFileId(value) {
  const text = String(value || '').trim();
  if (!text) return '';

  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i,
    /[?&]id=([a-zA-Z0-9_-]+)/i,
    /^([a-zA-Z0-9_-]{20,})$/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1] || match[0];
  }

  return '';
}

function fdBuildMemberTagData(memberId, memberData = {}) {
  const displayName = fdCleanRequestString(memberData.displayName || memberData.memberName || memberId, 120);
  return {
    people: [`member:${memberId}`],
    peopleAliases: [makeDirectoryPhotoTagSlug(displayName || memberId)].filter(Boolean),
    peopleLabels: [displayName].filter(Boolean),
    personIds: [memberId]
  };
}

function fdBuildPhotoAddTagPayload(request, memberData = {}, payload = {}) {
  const memberId = request.memberId;
  const memberTags = fdBuildMemberTagData(memberId, { ...memberData, memberName: request.memberName });
  const youtubeId = payload.mediaType === 'video' ? fdParseYoutubeId(payload.url) : '';
  const driveFileId = fdParseDriveFileId(payload.url);
  const title = fdCleanRequestString(payload.title || payload.photoName, 180);
  const now = window._fb.serverTimestamp();

  if (youtubeId) {
    return {
      docId: `youtube_${youtubeId}`,
      data: {
        youtubeId,
        youtubeThumbnail: `https://i.ytimg.com/vi/${encodeURIComponent(youtubeId)}/hqdefault.jpg`,
        youtubeTitle: title || `Video ID: ${youtubeId}`,
        type: 'video',
        mimeType: 'video/youtube',
        source: 'youtube',
        ...memberTags,
        otherPeopleLabels: [],
        albums: ['family'],
        status: 'approved',
        reviewReason: null,
        memberRequestId: request.id,
        approvedAt: now,
        updatedAt: now,
        createdAt: now
      }
    };
  }

  if (driveFileId) {
    return {
      docId: driveFileId,
      data: {
        driveFileId,
        name: title || driveFileId,
        type: 'image',
        source: 'member-request',
        ...memberTags,
        otherPeopleLabels: [],
        albums: ['family'],
        status: 'approved',
        reviewReason: null,
        memberRequestId: request.id,
        approvedAt: now,
        updatedAt: now,
        createdAt: now
      }
    };
  }

  return null;
}

function fdRemoveMemberFromTagPayload(tag = {}, memberId) {
  const memberKey = `member:${memberId}`;
  const people = Array.isArray(tag.people) ? tag.people : [];
  const peopleAliases = Array.isArray(tag.peopleAliases) ? tag.peopleAliases : [];
  const peopleLabels = Array.isArray(tag.peopleLabels) ? tag.peopleLabels : [];
  const personIds = Array.isArray(tag.personIds) ? tag.personIds : [];
  const removeIndexes = new Set();

  people.forEach((value, index) => {
    if (value === memberKey) removeIndexes.add(index);
  });
  personIds.forEach((value, index) => {
    if (value === memberId) removeIndexes.add(index);
  });

  const nextPeople = people.filter((value, index) => value !== memberKey && !removeIndexes.has(index));
  const nextAliases = peopleAliases.filter((_, index) => !removeIndexes.has(index));
  const nextLabels = peopleLabels.filter((_, index) => !removeIndexes.has(index));
  const nextPersonIds = personIds.filter(value => value !== memberId);

  const changed = JSON.stringify(nextPeople) !== JSON.stringify(people) ||
    JSON.stringify(nextAliases) !== JSON.stringify(peopleAliases) ||
    JSON.stringify(nextLabels) !== JSON.stringify(peopleLabels) ||
    JSON.stringify(nextPersonIds) !== JSON.stringify(personIds);

  return changed ? {
    people: nextPeople,
    peopleAliases: nextAliases,
    peopleLabels: nextLabels,
    personIds: nextPersonIds
  } : null;
}

async function approveMemberRequest(requestId, overrides = {}) {
  if (!isAdmin) throw new Error('Only admins can approve member requests.');

  const { doc, getDoc, setDoc, updateDoc, serverTimestamp } = window._fb;
  const requestRef = doc(db, FD_MEMBER_REQUESTS_COLLECTION, requestId);
  const requestSnap = await getDoc(requestRef);
  if (!requestSnap.exists()) throw new Error('This request no longer exists.');

  const request = { id: requestSnap.id, ...requestSnap.data() };
  if (request.status !== 'pending') return { status: request.status || 'reviewed' };

  const memberRef = doc(db, COLLECTION, request.memberId);
  const memberSnap = await getDoc(memberRef);
  const memberData = memberSnap.exists() ? memberSnap.data() : {};
  let appliedPayload = null;
  let publishStatus = 'not_applicable';

  if (request.type === 'profile_update') {
    appliedPayload = fdSanitizeProfilePayload(overrides.payload || request.payload || {});
    const beforeName = String(memberData.displayName || '').trim();
    const afterName = String(appliedPayload.displayName || beforeName).trim();

    await updateDoc(memberRef, { ...appliedPayload, updatedAt: serverTimestamp() });

    if (afterName && afterName !== beforeName) {
      await syncPhotoTagLabelsForDirectoryMember(request.memberId, { ...memberData, ...appliedPayload, id: request.memberId });
    }
  } else if (request.type === 'photo_remove') {
    const payload = fdSanitizePhotoRequestPayload(request.payload || {});
    const tagRef = doc(db, FD_PHOTO_TAGS_COLLECTION, payload.photoId);
    const tagSnap = await getDoc(tagRef);

    if (!tagSnap.exists()) throw new Error('The photo or video tag record was not found.');

    const update = fdRemoveMemberFromTagPayload(tagSnap.data() || {}, request.memberId);
    if (update) {
      await updateDoc(tagRef, {
        ...update,
        updatedAt: serverTimestamp(),
        memberRemovalApprovedAt: serverTimestamp(),
        memberRemovalApprovedBy: currentUser?.email || currentUser?.uid || ''
      });
    }
    appliedPayload = payload;
    publishStatus = update ? 'removed_member_tag' : 'already_removed';
  } else if (request.type === 'photo_add') {
    const payload = fdSanitizePhotoRequestPayload({ ...(request.payload || {}), ...(overrides.payload || {}) });
    const tagPayload = fdBuildPhotoAddTagPayload(request, memberData, payload);
    appliedPayload = payload;

    if (tagPayload) {
      await setDoc(doc(db, FD_PHOTO_TAGS_COLLECTION, tagPayload.docId), tagPayload.data, { merge: true });
      publishStatus = tagPayload.data.source === 'youtube' ? 'published_youtube' : 'published_drive_tag';
    } else {
      publishStatus = 'approved_manual_followup';
    }
  }

  await updateDoc(requestRef, {
    status: 'approved',
    appliedPayload,
    publishStatus,
    reviewedAt: serverTimestamp(),
    approvedAt: serverTimestamp(),
    reviewedBy: currentUser?.email || currentUser?.uid || '',
    updatedAt: serverTimestamp()
  });

  return { status: 'approved', publishStatus };
}

async function rejectMemberRequest(requestId, note = '') {
  if (!isAdmin) throw new Error('Only admins can reject member requests.');

  const { doc, updateDoc, serverTimestamp } = window._fb;
  await updateDoc(doc(db, FD_MEMBER_REQUESTS_COLLECTION, requestId), {
    status: 'rejected',
    adminNote: fdCleanRequestString(note, 1000),
    reviewedAt: serverTimestamp(),
    rejectedAt: serverTimestamp(),
    reviewedBy: currentUser?.email || currentUser?.uid || '',
    updatedAt: serverTimestamp()
  });

  return { status: 'rejected' };
}
/* ── Admin: Approve Member ── */
async function adminApprove(uid) {
  if (!isAdmin) return;
  const { doc, updateDoc } = window._fb;
  await updateDoc(doc(db, COLLECTION, uid), { status: 'approved' });
}

/* ── Admin: Delete Member ── */
async function adminDelete(uid) {
  if (!isAdmin) return;
  const { doc, deleteDoc } = window._fb;
  await deleteDoc(doc(db, COLLECTION, uid));
}

/* ── Admin: Update Any Profile ── */
async function adminUpdateProfile(uid, data) {
  if (!isAdmin) return;
  const { doc, getDoc, updateDoc, serverTimestamp } = window._fb;
  const ref = doc(db, COLLECTION, uid);
  const beforeSnap = await getDoc(ref).catch(() => null);
  const beforeData = beforeSnap?.exists?.() ? beforeSnap.data() : {};
  const beforeName = String(beforeData.displayName || '').trim();
  const payload = { ...data };
  if ('email' in payload) payload.emailLower = normalizeEmail(payload.email);

  await updateDoc(ref, { ...payload, updatedAt: serverTimestamp() });

  const afterName = String(payload.displayName || beforeName).trim();
  if ('displayName' in payload && afterName && afterName !== beforeName) {
    try {
      await syncPhotoTagLabelsForDirectoryMember(uid, { ...beforeData, ...payload, id: uid });
    } catch (error) {
      console.warn('Could not sync renamed member photo tags:', error);
      fdToast('Profile updated, but photo tag labels could not be synced automatically.');
    }
  }
}

/* ── Toast ── */
function makeDirectoryPhotoTagSlug(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function updatePhotoTagMemberArrays(tag, uid, displayName) {
  const memberKey = `member:${uid}`;
  const personSlug = makeDirectoryPhotoTagSlug(displayName || uid);
  const people = Array.isArray(tag.people) ? [...tag.people] : [];
  const peopleLabels = Array.isArray(tag.peopleLabels) ? [...tag.peopleLabels] : [];
  const peopleAliases = Array.isArray(tag.peopleAliases) ? [...tag.peopleAliases] : [];
  const personIds = Array.isArray(tag.personIds) ? [...tag.personIds] : [];
  let index = people.indexOf(memberKey);
  let changed = false;

  if (index < 0 && personIds.includes(uid)) {
    people.push(memberKey);
    index = people.length - 1;
    changed = true;
  }

  if (index < 0) return null;

  if (!personIds.includes(uid)) {
    personIds.push(uid);
    changed = true;
  }

  while (peopleLabels.length <= index) peopleLabels.push('');
  while (peopleAliases.length <= index) peopleAliases.push('');

  if (peopleLabels[index] !== displayName) {
    peopleLabels[index] = displayName;
    changed = true;
  }

  if (personSlug && peopleAliases[index] !== personSlug) {
    peopleAliases[index] = personSlug;
    changed = true;
  }

  return changed ? { people, peopleLabels, peopleAliases, personIds } : null;
}

async function syncPhotoTagLabelsForDirectoryMember(uid, profileData = {}) {
  if (!isAdmin || !uid) return 0;

  const displayName = String(profileData.displayName || '').trim();
  if (!displayName) return 0;

  const { collection, query, where, getDocs, writeBatch, serverTimestamp } = window._fb;
  const memberKey = `member:${uid}`;
  const tagDocs = new Map();
  const tagsRef = collection(db, FD_PHOTO_TAGS_COLLECTION);
  const queries = [
    query(tagsRef, where('people', 'array-contains', memberKey)),
    query(tagsRef, where('personIds', 'array-contains', uid))
  ];

  for (const tagQuery of queries) {
    const snapshot = await getDocs(tagQuery);
    snapshot.docs.forEach(docSnap => tagDocs.set(docSnap.id, docSnap));
  }

  let batch = writeBatch(db);
  let batchCount = 0;
  let updated = 0;

  for (const docSnap of tagDocs.values()) {
    const update = updatePhotoTagMemberArrays(docSnap.data() || {}, uid, displayName);
    if (!update) continue;

    batch.update(docSnap.ref, {
      ...update,
      updatedAt: serverTimestamp()
    });
    batchCount++;
    updated++;

    if (batchCount >= 450) {
      await batch.commit();
      batch = writeBatch(db);
      batchCount = 0;
    }
  }

  if (batchCount > 0) await batch.commit();
  return updated;
}
function fdToast(msg) {
  let toast = document.getElementById('fd-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'fd-toast';
    toast.className = 'fd-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

/* ── Helpers ── */
function normalizeBirthday(dateValue) {
  if (!dateValue) return '';

  if (typeof dateValue === 'object' && typeof dateValue.toDate === 'function') {
    dateValue = dateValue.toDate();
  }

  if (dateValue instanceof Date && !Number.isNaN(dateValue.getTime())) {
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, '0');
    const day = String(dateValue.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  if (typeof dateValue !== 'string') return '';

  const value = dateValue.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/^\d{8}$/.test(value)) return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  if (/^--\d{2}-\d{2}$/.test(value)) return `1604-${value.slice(2)}`;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isBirthdayYearOmitted(dateStr) {
  const normalized = normalizeBirthday(dateStr);
  return normalized.startsWith('1604-');
}

function formatBirthday(dateStr) {
  const normalized = normalizeBirthday(dateStr);
  if (!normalized) return '';
  const d = new Date(normalized + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function daysUntilBirthday(dateStr) {
  const normalized = normalizeBirthday(dateStr);
  if (!normalized) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [, m, d] = normalized.split('-').map(Number);
  let next = new Date(today.getFullYear(), m - 1, d);
  if (next < today) next.setFullYear(next.getFullYear() + 1);
  return Math.round((next - today) / 86400000);
}

function calcAge(dateStr) {
  const normalized = normalizeBirthday(dateStr);
  if (!normalized) return null;
  if (isBirthdayYearOmitted(normalized)) return null;
  const birth = new Date(normalized + 'T00:00:00');
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const mDiff = today.getMonth() - birth.getMonth();
  if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function defaultAvatar(name) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="88" height="88"><rect fill="#e0d6cc" width="88" height="88" rx="44"/><text x="44" y="50" text-anchor="middle" fill="#8b7e74" font-size="28" font-family="sans-serif">${initials}</text></svg>`
  )}`;
}

/* ── Build Directory Card HTML ── */
function buildCardHTML(member) {
  const p = member.privacy || {};
  const photo = member.photoURL || defaultAvatar(member.displayName);
  const showAdmin = isAdmin && currentProfile && member.id !== currentProfile.id;

  let infoRows = '';

  if (p.showPhone !== false && member.phone) {
    infoRows += `<div class="fd-card-row">
      <svg viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
      <a href="tel:${member.phone}">${member.phone}</a>
    </div>`;
  }

  if (p.showEmail !== false && member.email) {
    infoRows += `<div class="fd-card-row">
      <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
      <a href="mailto:${member.email}">${member.email}</a>
    </div>`;
  }

  if (p.showAddress !== false && (member.address || member.city || member.country)) {
    const loc = [member.address, member.city, member.country].filter(Boolean).join(', ');
    infoRows += `<div class="fd-card-row">
      <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
      <span>${loc}</span>
    </div>`;
  }

  if (p.showBirthday !== false && member.birthday) {
    const bdayStr = formatBirthday(member.birthday);
    const age = calcAge(member.birthday);
    const ageStr = (p.showAge !== false && age !== null) ? ` · Age ${age}` : '';
    infoRows += `<div class="fd-card-row">
      <svg viewBox="0 0 24 24"><path d="M12 6c1.11 0 2-.9 2-2 0-.38-.1-.73-.29-1.03L12 0l-1.71 2.97c-.19.3-.29.65-.29 1.03 0 1.1.9 2 2 2zm4.6 9.99l-1.07-1.07-1.08 1.07c-1.3 1.3-3.58 1.31-4.89 0l-1.07-1.07-1.09 1.07C6.75 16.64 5.88 17 4.96 17c-.73 0-1.4-.23-1.96-.61V21c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-4.61c-.56.38-1.23.61-1.96.61-.92 0-1.79-.36-2.44-1.01zM18 9h-5V7h-2v2H6c-1.66 0-3 1.34-3 3v1.54c0 1.08.88 1.96 1.96 1.96.52 0 1.02-.2 1.38-.57l2.14-2.13 2.13 2.13c.74.74 2.03.74 2.77 0l2.14-2.13 2.13 2.13c.37.37.86.57 1.38.57 1.08 0 1.96-.88 1.96-1.96V12c.01-1.66-1.33-3-2.99-3z"/></svg>
      <span>${bdayStr}${ageStr}</span>
    </div>`;
  }

  const tagBadge = member.isPhotoTagOnly
    ? `<div class="fd-card-preferred" style="background:#f1f3f4; color:#5f6368; border: 1px solid #dadce0;">Photo Tags Only</div>`
    : '';
  const publicProfile = fdResolvePublicProfile(member);
  const pageLink = publicProfile
    ? `<a class="fd-card-page-link" href="${fdPublicProfileHref(publicProfile.slug)}" aria-label="View ${publicProfile.name} public page">View Page</a>`
    : '';

  const claimStatus = getFamilyRecordClaimStatus(member);
  const claimText = {
    claimed: 'Claimed',
    pending: 'Pending',
    unclaimed: 'Unclaimed'
  }[claimStatus] || claimStatus;
  const claimDetail = claimStatus === 'claimed'
    ? `Claimed${member.claimedByEmail ? ` by ${member.claimedByEmail}` : member.email ? ` by ${member.email}` : ''}`
    : claimStatus === 'pending'
      ? 'Waiting for admin approval'
      : member.syncSource === 'googleContacts'
        ? 'Unclaimed - synced from Google Contacts'
        : 'Unclaimed directory card';
  const syncBadge = member.syncSource === 'googleContacts'
    ? '<span class="fd-card-claim-badge synced">Google Contacts</span>'
    : '';
  const familyLabelBadge = member.syncSource === 'googleContacts'
    ? '<span class="fd-card-claim-badge family-label">Family label sync</span>'
    : '';
  const adminClaimBadges = isAdmin
    ? `<div class="fd-card-claim-badges" title="${claimDetail}">
        <span class="fd-card-claim-badge ${claimStatus}">${claimText}</span>
        ${syncBadge}
        ${familyLabelBadge}
      </div>`
    : '';

  const adminBadge = showAdmin
    ? `<button class="fd-admin-btn" style="position:absolute;top:10px;left:10px;font-size:.65rem;padding:4px 8px" onclick="openAdminEdit('${member.id}')">Edit</button>` : '';

  return `
    <div class="fd-card" data-name="${(member.displayName || '').toLowerCase()}" data-uid="${member.id}">
      ${member.role === 'admin' ? '<span class="fd-card-badge">Admin</span>' : ''}
      ${adminBadge}
      <img class="fd-card-photo" src="${photo}" alt="${member.displayName}" onerror="this.src='${defaultAvatar(member.displayName)}'">
      <h3 class="fd-card-name">${member.displayName || 'Family Member'}</h3>
      ${pageLink}
      ${adminClaimBadges}
      <div class="fd-card-info">${infoRows}</div>
      ${tagBadge}
    </div>`;
}

/* ── Build Birthday Card HTML ── */
function buildBirthdayCardHTML(member, daysLeft) {
  const p = member.privacy || {};
  const photo = member.photoURL || defaultAvatar(member.displayName);
  const bdayStr = formatBirthday(member.birthday);
  const isToday = daysLeft === 0;
  const age = calcAge(member.birthday);
  const ageStr = (p.showAge !== false && age !== null) ? `<span class="fd-birthday-age">Turning ${age + (isToday ? 0 : 1)}</span>` : '';

  return `
    <div class="fd-birthday-card ${isToday ? 'today' : ''}">
      <img class="fd-birthday-avatar" src="${photo}" alt="${member.displayName}" onerror="this.src='${defaultAvatar(member.displayName)}'">
      <div class="fd-birthday-info">
        <h4 class="fd-birthday-name">${member.displayName}</h4>
        <span class="fd-birthday-date">${bdayStr}</span>
        ${ageStr}
      </div>
      <div class="fd-birthday-countdown">
        <div class="fd-birthday-days">${isToday ? '🎂' : daysLeft}</div>
        <div class="fd-birthday-days-label">${isToday ? 'Today!' : (daysLeft === 1 ? 'day' : 'days')}</div>
      </div>
    </div>`;
}

// Expose globally
window.fdInit = fdInit;
window.fdSignIn = fdSignIn;
window.fdSignOut = fdSignOut;
window.fdToast = fdToast;
window.fdShowLoadError = fdShowLoadError;
window.fdClaimFamilyProfileByEmail = fdClaimFamilyProfileByEmail;
window.fetchApprovedMembers = fetchApprovedMembers;
window.fetchMyMemberRequests = fetchMyMemberRequests;
window.fetchAllMembers = fetchAllMembers;
window.fetchPendingMemberRequests = fetchPendingMemberRequests;
window.saveProfile = saveProfile;
window.submitPhotoAddRequest = submitPhotoAddRequest;
window.submitPhotoRemoveRequest = submitPhotoRemoveRequest;
window.adminApprove = adminApprove;
window.adminDelete = adminDelete;
window.adminUpdateProfile = adminUpdateProfile;
window.approveMemberRequest = approveMemberRequest;
window.rejectMemberRequest = rejectMemberRequest;
window.fdGetGoogleContactsAccessToken = fdGetGoogleContactsAccessToken;
window.fdGetGoogleDriveAccessToken = fdGetGoogleDriveAccessToken;
window.fdClearGoogleDriveAccessToken = fdClearGoogleDriveAccessToken;
window.fdPublicProfileUrl = fdPublicProfileUrl;
window.fdPublicProfileHref = fdPublicProfileHref;
window.fdResolvePublicProfile = fdResolvePublicProfile;
window.fdBuildPublicProfileUpdate = fdBuildPublicProfileUpdate;
window.syncDirectoryPublicProfileLinks = syncDirectoryPublicProfileLinks;
window.buildCardHTML = buildCardHTML;
window.buildBirthdayCardHTML = buildBirthdayCardHTML;
window.normalizeBirthday = normalizeBirthday;
window.isBirthdayYearOmitted = isBirthdayYearOmitted;
window.daysUntilBirthday = daysUntilBirthday;
window.formatBirthday = formatBirthday;
window.calcAge = calcAge;
window.defaultAvatar = defaultAvatar;
window.getFamilyRecordClaimStatus = getFamilyRecordClaimStatus;
window.syncPhotoTagLabelsForDirectoryMember = syncPhotoTagLabelsForDirectoryMember;
window.isClaimedFamilyRecord = isClaimedFamilyRecord;
window.isImportedFamilyRecord = isImportedFamilyRecord;
window.normalizeEmail = normalizeEmail;
window.normalizePhone = normalizePhone;
window.currentUser = null;
window.currentProfile = null;
window.isAdmin = false;

// Keep window globals in sync
Object.defineProperty(window, 'currentUser', { get: () => currentUser, set: v => { currentUser = v; } });
Object.defineProperty(window, 'currentProfile', { get: () => currentProfile, set: v => { currentProfile = v; } });
Object.defineProperty(window, 'isAdmin', { get: () => isAdmin, set: v => { isAdmin = v; } });
