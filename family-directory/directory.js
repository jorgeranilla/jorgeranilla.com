/* ═══════════════════════════════════════════
   Family Directory – Firebase Logic
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
const COLLECTION = 'familyDirectory';
const GOOGLE_CONTACTS_SCOPE = 'https://www.googleapis.com/auth/contacts.readonly';

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

async function syncGoogleIdentity(user, profileRef, profileData) {
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
async function fdInit() {
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js');
  const { getAuth, onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider }
    = await import('https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js');
  const { getFirestore, collection, doc, documentId, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp }
    = await import('https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js');

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  // Store imports globally for use
  window._fb = {
    auth, db, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
    collection, doc, documentId, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, serverTimestamp
  };

  // Auth state listener
  onAuthStateChanged(auth, handleAuthState);
}

/* ── Auth State Handler ── */
async function handleAuthState(user) {
  const loadingEl = document.getElementById('fd-loading');
  const authGate = document.getElementById('fd-auth-gate');
  const appEl = document.getElementById('fd-app');
  const pendingEl = document.getElementById('fd-pending');

  if (!user) {
    currentUser = null;
    currentProfile = null;
    isAdmin = false;
    if (loadingEl) loadingEl.style.display = 'none';
    if (authGate) authGate.style.display = 'flex';
    if (appEl) appEl.classList.remove('active');
    if (pendingEl) pendingEl.style.display = 'none';
    return;
  }

  currentUser = user;
  if (loadingEl) loadingEl.style.display = 'flex';
  if (authGate) authGate.style.display = 'none';

  // Fetch user profile from Firestore
  const { doc, getDoc } = window._fb;
  const profileRef = doc(db, COLLECTION, user.uid);
  const profileSnap = await getDoc(profileRef);

  if (profileSnap.exists()) {
    currentProfile = { id: profileSnap.id, ...profileSnap.data() };
    const claimedProfile = await autoClaimExistingImport(user, profileRef, currentProfile);
    if (claimedProfile) currentProfile = claimedProfile;
    currentProfile = await syncGoogleIdentity(user, profileRef, currentProfile);
    isAdmin = currentProfile.role === 'admin';

    if (currentProfile.status !== 'approved' && !isAdmin) {
      // Pending approval
      if (loadingEl) loadingEl.style.display = 'none';
      if (pendingEl) {
        pendingEl.style.display = 'flex';
        const nameEl = pendingEl.querySelector('.fd-pending-name');
        if (nameEl) nameEl.textContent = user.displayName || user.email;
      }
      return;
    }

    // Approved - show app
    if (loadingEl) loadingEl.style.display = 'none';
    if (appEl) appEl.classList.add('active');
    updateNavUser();
    if (typeof onPageReady === 'function') onPageReady();
  } else {
    // First-time user — check for existing imported record to claim
    const { setDoc, serverTimestamp } = window._fb;
    let claimedProfile = null;
    const normalizedUserEmail = normalizeEmail(user.email);

    if (normalizedUserEmail) {
      try {
        const importDoc = await findClaimableProfileByEmail(user.email);
        if (importDoc) {
          const claimedData = mergeClaimedProfileData(user, importDoc);
          if (!claimedData.createdAt) claimedData.createdAt = serverTimestamp();
          await setDoc(profileRef, claimedData);
          await cleanupClaimedImport(importDoc, user.uid);
          claimedProfile = { id: user.uid, ...claimedData };
          console.log(`✅ Claimed imported profile "${importDoc.data().displayName}" → ${user.uid}`);
        }
      } catch (err) {
        console.warn('Could not search for imported records:', err);
      }
    }

    if (claimedProfile) {
      // Successfully claimed an imported profile — go straight in
      currentProfile = claimedProfile;
      isAdmin = currentProfile.role === 'admin';

      if (loadingEl) loadingEl.style.display = 'none';
      if (appEl) appEl.classList.add('active');
      updateNavUser();
      fdToast('Welcome! Your profile has been linked. 🎉');
      if (typeof onPageReady === 'function') onPageReady();
    } else {
      // No imported match found — create fresh pending profile
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

      if (loadingEl) loadingEl.style.display = 'none';
      if (pendingEl) {
        pendingEl.style.display = 'flex';
        const nameEl = pendingEl.querySelector('.fd-pending-name');
        if (nameEl) nameEl.textContent = user.displayName || user.email;
      }
    }
  }
}

/* ── Sign In ── */
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

function fdSignOut() {
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

/* ── Save Own Profile ── */
async function saveProfile(data) {
  if (!currentUser) return;
  const { doc, updateDoc, serverTimestamp } = window._fb;
  const ref = doc(db, COLLECTION, currentUser.uid);
  const payload = { ...data };
  if ('email' in payload) payload.emailLower = normalizeEmail(payload.email);
  await updateDoc(ref, { ...payload, updatedAt: serverTimestamp() });
  // Update local
  Object.assign(currentProfile, payload);
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
  const { doc, updateDoc, serverTimestamp } = window._fb;
  const payload = { ...data };
  if ('email' in payload) payload.emailLower = normalizeEmail(payload.email);
  await updateDoc(doc(db, COLLECTION, uid), { ...payload, updatedAt: serverTimestamp() });
}

/* ── Toast ── */
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
  const adminClaimBadges = isAdmin
    ? `<div class="fd-card-claim-badges" title="${claimDetail}">
        <span class="fd-card-claim-badge ${claimStatus}">${claimText}</span>
        ${syncBadge}
      </div>`
    : '';
  const syncNote = isAdmin && member.syncSource === 'googleContacts'
    ? '<div class="fd-card-sync-note">Family label sync</div>'
    : '';

  const adminBadge = showAdmin
    ? `<button class="fd-admin-btn" style="position:absolute;top:10px;left:10px;font-size:.65rem;padding:4px 8px" onclick="openAdminEdit('${member.id}')">Edit</button>` : '';

  return `
    <div class="fd-card" data-name="${(member.displayName || '').toLowerCase()}" data-uid="${member.id}">
      ${member.role === 'admin' ? '<span class="fd-card-badge">Admin</span>' : ''}
      ${adminBadge}
      <img class="fd-card-photo" src="${photo}" alt="${member.displayName}" onerror="this.src='${defaultAvatar(member.displayName)}'">
      <h3 class="fd-card-name">${member.displayName || 'Family Member'}</h3>
      ${adminClaimBadges}
      <div class="fd-card-info">${infoRows}</div>
      ${tagBadge}
      ${syncNote}
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
window.fetchApprovedMembers = fetchApprovedMembers;
window.fetchAllMembers = fetchAllMembers;
window.saveProfile = saveProfile;
window.adminApprove = adminApprove;
window.adminDelete = adminDelete;
window.adminUpdateProfile = adminUpdateProfile;
window.fdGetGoogleContactsAccessToken = fdGetGoogleContactsAccessToken;
window.buildCardHTML = buildCardHTML;
window.buildBirthdayCardHTML = buildBirthdayCardHTML;
window.normalizeBirthday = normalizeBirthday;
window.isBirthdayYearOmitted = isBirthdayYearOmitted;
window.daysUntilBirthday = daysUntilBirthday;
window.formatBirthday = formatBirthday;
window.calcAge = calcAge;
window.defaultAvatar = defaultAvatar;
window.getFamilyRecordClaimStatus = getFamilyRecordClaimStatus;
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
