/* ═══════════════════════════════════════════
   Alyssa Live – Self-contained Firebase + WebRTC
   Now lives entirely in /live/ folder
═══════════════════════════════════════════ */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';

// ── Firebase Config ──
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBc0zrXLzr9Qhq9iuhXLAXOzbkQ13mEaU4',
  authDomain: 'jorgeranilla-site.firebaseapp.com',
  databaseURL: 'https://jorgeranilla-site-default-rtdb.firebaseio.com',
  projectId: 'jorgeranilla-site',
  storageBucket: 'jorgeranilla-site.firebasestorage.app',
  messagingSenderId: '125483521813',
  appId: '1:125483521813:web:f48b02d491cb4c698ffb1c',
};

const app = initializeApp(FIREBASE_CONFIG);
const db = getDatabase(app);

// ── Constants ──
const LIVE_PATH = 'publicLive/alyssa';
const LIVE_FUNCTIONS = {
  createAlyssaLiveStream: 'https://createalyssalivestream-mfmiftigaq-uc.a.run.app',
  extendAlyssaLiveStream: 'https://extendalyssalivestream-mfmiftigaq-uc.a.run.app',
  stopAlyssaLiveStream: 'https://stopalyssalivestream-mfmiftigaq-uc.a.run.app',
};
const RETRY_DELAY_MS = 2 * 60 * 1000;

// ── DOM References ──
const status = document.querySelector('#live-status');
const badge = document.querySelector('#live-badge');
const streamWrap = document.querySelector('#live-stream-wrap');
const video = document.querySelector('#live-video');
const meta = document.querySelector('#live-meta');

// ── State ──
let expirationTimer;
let peerConnection;
let mediaSessionId;
let extendTimer;
let retryTimer;
let retryAfter = 0;
let activeAttemptId = 0;

// ── Helpers ──

function isActiveLive(data) {
  return Boolean(
    data &&
      data.active === true &&
      typeof data.expiresAt === 'number' &&
      data.expiresAt > Date.now(),
  );
}

function formatUpdatedAt(timestamp) {
  if (typeof timestamp !== 'number') return 'Streaming now';

  return `Streaming now · Updated ${new Intl.DateTimeFormat('en-US', {
    timeStyle: 'short',
    timeZone: 'America/New_York',
  }).format(new Date(timestamp))} ET`;
}

async function callLiveFunction(name, payload) {
  const response = await fetch(LIVE_FUNCTIONS[name], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Live stream is unavailable.');
  }

  return data;
}

// ── Peer Connection ──

async function stopPeerConnection() {
  window.clearTimeout(expirationTimer);
  window.clearTimeout(extendTimer);
  window.clearTimeout(retryTimer);
  extendTimer = null;
  retryTimer = null;

  const sessionToStop = mediaSessionId;
  mediaSessionId = null;

  if (peerConnection) {
    peerConnection.getSenders().forEach((sender) => {
      if (sender.track) sender.track.stop();
    });
    peerConnection.getReceivers().forEach((receiver) => {
      if (receiver.track) receiver.track.stop();
    });
    peerConnection.close();
    peerConnection = null;
  }

  video.srcObject = null;

  if (sessionToStop) {
    callLiveFunction('stopAlyssaLiveStream', { mediaSessionId: sessionToStop }).catch(() => {});
  }
}

function showInactive() {
  activeAttemptId += 1;
  retryAfter = 0;
  stopPeerConnection();
  status.textContent = 'Alyssa is not live right now.';
  badge.hidden = true;
  streamWrap.hidden = true;
  meta.textContent = 'Streaming now';
}

// ── Stream Extension ──

function scheduleExtend() {
  window.clearTimeout(extendTimer);

  extendTimer = window.setTimeout(async () => {
    if (!mediaSessionId) return;

    try {
      const result = await callLiveFunction('extendAlyssaLiveStream', { mediaSessionId });
      mediaSessionId = result.mediaSessionId || mediaSessionId;
      scheduleExtend();
    } catch (error) {
      showInactive();
    }
  }, 4 * 60 * 1000);
}

// ── SDP Munging ──
// Fix "Incompatible send direction" by ensuring all media sections
// in the remote answer have directions compatible with our recvonly offer.

function fixSdpDirections(sdp) {
  if (!sdp) return sdp;

  // Replace any 'a=sendrecv' or 'a=sendonly' in the answer with 'a=sendonly'
  // since our offer uses 'recvonly', the valid answer direction is 'sendonly'.
  // Also handle 'a=inactive' gracefully.
  const lines = sdp.split('\r\n');
  const fixed = lines.map((line) => {
    // If the answer says sendrecv, change to sendonly (we only receive)
    if (line === 'a=sendrecv') {
      return 'a=sendonly';
    }
    // If the answer says recvonly, that's incompatible with our recvonly — fix to sendonly
    if (line === 'a=recvonly') {
      return 'a=sendonly';
    }
    return line;
  });

  return fixed.join('\r\n');
}

// ── WebRTC Stream Setup ──

async function startWebRtcStream(attemptId) {
  await stopPeerConnection();

  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  });

  peerConnection = pc;
  const remoteStream = new MediaStream();
  video.srcObject = remoteStream;

  // Add receive-only transceivers for audio and video
  pc.addTransceiver('audio', { direction: 'recvonly' });
  pc.addTransceiver('video', { direction: 'recvonly' });

  // Nest requires a data channel to be present
  pc.createDataChannel('data');

  pc.addEventListener('track', (event) => {
    remoteStream.addTrack(event.track);
  });

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const result = await callLiveFunction('createAlyssaLiveStream', {
    offerSdp: offer.sdp,
  });

  // Guard against stale attempts
  if (attemptId !== activeAttemptId) {
    await stopPeerConnection();
    return;
  }

  mediaSessionId = result.mediaSessionId;

  // Fix SDP direction mismatches before setting remote description
  const fixedSdp = fixSdpDirections(result.answerSdp);

  await pc.setRemoteDescription({
    type: 'answer',
    sdp: fixedSdp,
  });

  scheduleExtend();
}

// ── UI State ──

function showActive(data) {
  activeAttemptId += 1;
  const attemptId = activeAttemptId;
  const waitMs = retryAfter - Date.now();

  status.textContent = 'Alyssa is live right now 💛';
  badge.hidden = false;
  streamWrap.hidden = false;
  meta.textContent = formatUpdatedAt(data.updatedAt);

  window.clearTimeout(expirationTimer);
  expirationTimer = window.setTimeout(showInactive, Math.max(0, data.expiresAt - Date.now()));

  if (waitMs > 0) {
    status.textContent = `Alyssa is live right now. Stream will retry in ${Math.ceil(waitMs / 1000)} seconds.`;
    retryTimer = window.setTimeout(() => {
      if (attemptId === activeAttemptId) showActive(data);
    }, waitMs);
    return;
  }

  startWebRtcStream(attemptId).catch((error) => {
    if (attemptId !== activeAttemptId) return;
    status.textContent = error.message || 'Alyssa is not live right now.';
    badge.hidden = true;
    streamWrap.hidden = true;
    retryAfter = Date.now() + RETRY_DELAY_MS;
    retryTimer = window.setTimeout(() => {
      if (attemptId === activeAttemptId) showActive(data);
    }, RETRY_DELAY_MS);
  });
}

// ── Firebase Listener ──

onValue(ref(db, LIVE_PATH), (snapshot) => {
  const liveData = snapshot.val();

  if (!isActiveLive(liveData)) {
    showInactive();
    return;
  }

  showActive(liveData);
});

window.addEventListener('pagehide', stopPeerConnection);
