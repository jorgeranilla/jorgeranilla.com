import { ref, onValue } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';
import { db } from '../locator/shared/firebase.js';

const LIVE_PATH = 'publicLive/alyssa';
const LIVE_FUNCTIONS = {
  createAlyssaLiveStream: 'https://createalyssalivestream-mfmiftigaq-uc.a.run.app',
  extendAlyssaLiveStream: 'https://extendalyssalivestream-mfmiftigaq-uc.a.run.app',
  stopAlyssaLiveStream: 'https://stopalyssalivestream-mfmiftigaq-uc.a.run.app',
};

const status = document.querySelector('#live-status');
const badge = document.querySelector('#live-badge');
const streamWrap = document.querySelector('#live-stream-wrap');
const video = document.querySelector('#live-video');
const meta = document.querySelector('#live-meta');

let expirationTimer;
let peerConnection;
let mediaSessionId;
let extendTimer;
let activeAttemptId = 0;

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

  return `Streaming now · Updated ${new Intl.DateTimeFormat(undefined, {
    timeStyle: 'short',
  }).format(new Date(timestamp))}`;
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

async function stopPeerConnection() {
  window.clearTimeout(expirationTimer);
  window.clearTimeout(extendTimer);
  extendTimer = null;

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
  stopPeerConnection();
  status.textContent = 'Alyssa is not live right now.';
  badge.hidden = true;
  streamWrap.hidden = true;
  meta.textContent = 'Streaming now';
}

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

async function startWebRtcStream(attemptId) {
  await stopPeerConnection();

  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  });

  peerConnection = pc;
  const remoteStream = new MediaStream();
  video.srcObject = remoteStream;

  pc.addTransceiver('audio', { direction: 'recvonly' });
  pc.addTransceiver('video', { direction: 'recvonly' });
  pc.createDataChannel('data');

  pc.addEventListener('track', (event) => {
    remoteStream.addTrack(event.track);
  });

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const result = await callLiveFunction('createAlyssaLiveStream', {
    offerSdp: offer.sdp,
  });

  if (attemptId !== activeAttemptId) {
    await stopPeerConnection();
    return;
  }

  mediaSessionId = result.mediaSessionId;
  await pc.setRemoteDescription({
    type: 'answer',
    sdp: result.answerSdp,
  });

  scheduleExtend();
}

function showActive(data) {
  activeAttemptId += 1;
  const attemptId = activeAttemptId;

  status.textContent = 'Alyssa is live right now 💛';
  badge.hidden = false;
  streamWrap.hidden = false;
  meta.textContent = formatUpdatedAt(data.updatedAt);

  startWebRtcStream(attemptId).catch((error) => {
    if (attemptId !== activeAttemptId) return;
    status.textContent = error.message || 'Alyssa is not live right now.';
    badge.hidden = true;
    streamWrap.hidden = true;
  });

  window.clearTimeout(expirationTimer);
  expirationTimer = window.setTimeout(showInactive, Math.max(0, data.expiresAt - Date.now()));
}

onValue(ref(db, LIVE_PATH), (snapshot) => {
  const liveData = snapshot.val();

  if (!isActiveLive(liveData)) {
    showInactive();
    return;
  }

  showActive(liveData);
});

window.addEventListener('pagehide', stopPeerConnection);
