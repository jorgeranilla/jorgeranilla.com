/* ═══════════════════════════════════════════
   Family Directory – Firebase Logic
   Auth · Firestore · RBAC
═══════════════════════════════════════════ */

// Firebase config (jorgeranilla-site)
const firebaseConfig = {
  apiKey: "AIzaSyBxYkOQFnEfl88VfSmuYG9aRfkJBD1yNKM",
  authDomain: "jorgeranilla-site.firebaseapp.com",
  projectId: "jorgeranilla-site",
  storageBucket: "jorgeranilla-site.firebasestorage.app",
  messagingSenderId: "125483521813",
  appId: "1:125483521813:web:PLACEHOLDER"
};

/* ── Globals ── */
let app, auth, db, currentUser = null, currentProfile = null;
let isAdmin = false;
const COLLECTION = 'familyDirectory';

/* ── Init ── */
async function fdInit() {
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js');
  const { getAuth, onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider }
    = await import('https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js');
  const { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp }
    = await import('https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js');

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  // Store imports globally for use
  window._fb = {
    auth, db, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
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
    // First-time user — create pending profile
    const { setDoc, serverTimestamp } = window._fb;
    const newProfile = {
      uid: user.uid,
      displayName: user.displayName || '',
      email: user.email || '',
      photoURL: user.photoURL || '',
      phone: '',
      relationship: '',
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
  const { collection, getDocs, query, where, orderBy } = window._fb;
  const q = query(
    collection(db, COLLECTION),
    where('status', '==', 'approved'),
    orderBy('displayName')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/* ── Fetch All Members (Admin) ── */
async function fetchAllMembers() {
  const { collection, getDocs, orderBy, query } = window._fb;
  const q = query(collection(db, COLLECTION), orderBy('displayName'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/* ── Save Own Profile ── */
async function saveProfile(data) {
  if (!currentUser) return;
  const { doc, updateDoc, serverTimestamp } = window._fb;
  const ref = doc(db, COLLECTION, currentUser.uid);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  // Update local
  Object.assign(currentProfile, data);
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
  await updateDoc(doc(db, COLLECTION, uid), { ...data, updatedAt: serverTimestamp() });
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
function formatBirthday(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function daysUntilBirthday(dateStr) {
  if (!dateStr) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = dateStr.split('-').map(Number);
  let next = new Date(today.getFullYear(), m - 1, d);
  if (next < today) next.setFullYear(next.getFullYear() + 1);
  return Math.round((next - today) / 86400000);
}

function calcAge(dateStr) {
  if (!dateStr) return null;
  const birth = new Date(dateStr + 'T00:00:00');
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

  if (member.relationship) {
    infoRows += `<div class="fd-card-row">
      <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
      <span>${member.relationship}</span>
    </div>`;
  }

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

  if (member.city || member.country) {
    const loc = [member.city, member.country].filter(Boolean).join(', ');
    infoRows += `<div class="fd-card-row">
      <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
      <span>${loc}</span>
    </div>`;
  }

  if (p.showBirthday !== false && member.birthday) {
    const bdayStr = formatBirthday(member.birthday);
    const ageStr = (p.showAge !== false) ? ` · Age ${calcAge(member.birthday)}` : '';
    infoRows += `<div class="fd-card-row">
      <svg viewBox="0 0 24 24"><path d="M12 6c1.11 0 2-.9 2-2 0-.38-.1-.73-.29-1.03L12 0l-1.71 2.97c-.19.3-.29.65-.29 1.03 0 1.1.9 2 2 2zm4.6 9.99l-1.07-1.07-1.08 1.07c-1.3 1.3-3.58 1.31-4.89 0l-1.07-1.07-1.09 1.07C6.75 16.64 5.88 17 4.96 17c-.73 0-1.4-.23-1.96-.61V21c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-4.61c-.56.38-1.23.61-1.96.61-.92 0-1.79-.36-2.44-1.01zM18 9h-5V7h-2v2H6c-1.66 0-3 1.34-3 3v1.54c0 1.08.88 1.96 1.96 1.96.52 0 1.02-.2 1.38-.57l2.14-2.13 2.13 2.13c.74.74 2.03.74 2.77 0l2.14-2.13 2.13 2.13c.37.37.86.57 1.38.57 1.08 0 1.96-.88 1.96-1.96V12c.01-1.66-1.33-3-2.99-3z"/></svg>
      <span>${bdayStr}${ageStr}</span>
    </div>`;
  }

  const preferred = member.preferredContact
    ? `<div class="fd-card-preferred">✦ Preferred: ${member.preferredContact}</div>` : '';

  const adminBadge = showAdmin
    ? `<button class="fd-admin-btn" style="position:absolute;top:10px;left:10px;font-size:.65rem;padding:4px 8px" onclick="openAdminEdit('${member.id}')">Edit</button>` : '';

  return `
    <div class="fd-card" data-name="${(member.displayName || '').toLowerCase()}" data-uid="${member.id}">
      ${member.role === 'admin' ? '<span class="fd-card-badge">Admin</span>' : ''}
      ${adminBadge}
      <img class="fd-card-photo" src="${photo}" alt="${member.displayName}" onerror="this.src='${defaultAvatar(member.displayName)}'">
      <h3 class="fd-card-name">${member.displayName || 'Family Member'}</h3>
      <p class="fd-card-relation">${member.relationship || ''}</p>
      <div class="fd-card-info">${infoRows}</div>
      ${preferred}
    </div>`;
}

/* ── Build Birthday Card HTML ── */
function buildBirthdayCardHTML(member, daysLeft) {
  const p = member.privacy || {};
  const photo = member.photoURL || defaultAvatar(member.displayName);
  const bdayStr = formatBirthday(member.birthday);
  const isToday = daysLeft === 0;
  const ageStr = (p.showAge !== false) ? `<span class="fd-birthday-age">Turning ${calcAge(member.birthday) + (isToday ? 0 : 1)}</span>` : '';

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
window.buildCardHTML = buildCardHTML;
window.buildBirthdayCardHTML = buildBirthdayCardHTML;
window.daysUntilBirthday = daysUntilBirthday;
window.formatBirthday = formatBirthday;
window.calcAge = calcAge;
window.defaultAvatar = defaultAvatar;
window.currentUser = null;
window.currentProfile = null;
window.isAdmin = false;

// Keep window globals in sync
Object.defineProperty(window, 'currentUser', { get: () => currentUser, set: v => { currentUser = v; } });
Object.defineProperty(window, 'currentProfile', { get: () => currentProfile, set: v => { currentProfile = v; } });
Object.defineProperty(window, 'isAdmin', { get: () => isAdmin, set: v => { isAdmin = v; } });
