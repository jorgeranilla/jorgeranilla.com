import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {
  ref,
  onValue,
  set,
  update,
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';
import { auth, db } from './firebase.js';
import { ADMIN_UID, LOCATION_PATH } from './config.js';

const loginForm = document.querySelector('#login-form');
const loginError = document.querySelector('#login-error');
const adminPanel = document.querySelector('#admin-panel');
const currentStatus = document.querySelector('#current-status');
const lastUpdate = document.querySelector('#last-update');
const duration = document.querySelector('#duration');
const startSharing = document.querySelector('#start-sharing');
const stopSharing = document.querySelector('#stop-sharing');
const adminMessage = document.querySelector('#admin-message');
const logout = document.querySelector('#logout');
const locationRef = ref(db, LOCATION_PATH);
const googleProvider = new GoogleAuthProvider();

let watchId = null;
let refreshTimer = null;
let activeExpiresAt = null;

function setMessage(message) {
  adminMessage.textContent = message;
}

function formatTimestamp(timestamp) {
  if (typeof timestamp !== 'number') {
    return 'Never';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(timestamp));
}

function isActiveLocation(location) {
  return Boolean(
    location &&
      location.active === true &&
      typeof location.expiresAt === 'number' &&
      location.expiresAt > Date.now(),
  );
}

function isAdmin(user) {
  return user?.uid === ADMIN_UID;
}

function savePosition(position) {
  const now = Date.now();
  const coords = position.coords;

  return set(locationRef, {
    active: true,
    lat: coords.latitude,
    lng: coords.longitude,
    accuracy: typeof coords.accuracy === 'number' ? coords.accuracy : null,
    updatedAt: now,
    expiresAt: activeExpiresAt,
  });
}

function requestSinglePosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 30000,
    });
  });
}

function clearLocalWatch() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  if (refreshTimer !== null) {
    window.clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

async function stopLocationSharing(message = 'Location sharing stopped.') {
  clearLocalWatch();
  activeExpiresAt = null;

  await update(locationRef, {
    active: false,
    lat: null,
    lng: null,
    accuracy: null,
    updatedAt: Date.now(),
    expiresAt: null,
  });

  setMessage(message);
}

async function startLocationSharing() {
  if (!navigator.geolocation) {
    setMessage('Geolocation is not available in this browser.');
    return;
  }

  clearLocalWatch();
  setMessage('Requesting precise location permission...');
  activeExpiresAt = Date.now() + Number(duration.value);

  try {
    const firstPosition = await requestSinglePosition();
    await savePosition(firstPosition);

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        savePosition(position).catch(() => setMessage('Could not save the latest location update.'));
      },
      (error) => setMessage(error.message || 'Location sharing failed.'),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 30000,
      },
    );

    refreshTimer = window.setInterval(async () => {
      if (!activeExpiresAt || activeExpiresAt <= Date.now()) {
        await stopLocationSharing('Location sharing expired.');
        return;
      }

      try {
        const position = await requestSinglePosition();
        await savePosition(position);
      } catch (error) {
        setMessage(error.message || 'Could not refresh location.');
      }
    }, 45000);

    setMessage('Location sharing is active.');
  } catch (error) {
    clearLocalWatch();
    setMessage(error.message || 'Location permission was not granted.');
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginError.textContent = '';

  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
      await signInWithRedirect(auth, googleProvider);
      return;
    }

    loginError.textContent = error.message || 'Google sign-in failed.';
  }
});

getRedirectResult(auth).catch((error) => {
  loginError.textContent = error.message || 'Google sign-in failed.';
});

startSharing.addEventListener('click', startLocationSharing);
stopSharing.addEventListener('click', () => {
  stopLocationSharing().catch((error) => setMessage(error.message || 'Could not stop sharing.'));
});
logout.addEventListener('click', () => {
  clearLocalWatch();
  signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    loginForm.classList.remove('hidden');
    adminPanel.classList.add('hidden');
    return;
  }

  if (!isAdmin(user)) {
    await signOut(auth);
    loginError.textContent = 'This account is not allowed to manage location sharing.';
    return;
  }

  loginForm.classList.add('hidden');
  adminPanel.classList.remove('hidden');
});

onValue(locationRef, (snapshot) => {
  const location = snapshot.val();
  currentStatus.textContent = isActiveLocation(location) ? 'Active' : 'Inactive';
  lastUpdate.textContent = formatTimestamp(location?.updatedAt);
});
