const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');

const nestClientId = defineSecret('NEST_CLIENT_ID');
const nestClientSecret = defineSecret('NEST_CLIENT_SECRET');
const nestRefreshToken = defineSecret('NEST_REFRESH_TOKEN');

const PROJECT_ID = '70c7c784-2713-4d3f-89ce-5cacd4004f5b';
const DEVICE_NAME = 'enterprises/70c7c784-2713-4d3f-89ce-5cacd4004f5b/devices/AVPHwEtzAI3OCBONTIKycx-K7ex40XAFp35o1-A_ZvHkoDoaobHLmMjroLNK5BlzesK5QGv9GumO-WWo2hlVB5hhECznlQ';
const LIVE_PATH = 'publicLive/alyssa';
const LIVE_STATUS_URL = `https://jorgeranilla-site-default-rtdb.firebaseio.com/${LIVE_PATH}.json`;
const ALLOWED_ORIGINS = new Set([
  'https://jorgeranilla.com',
  'https://www.jorgeranilla.com',
]);
const CREATE_STREAM_MIN_INTERVAL_MS = 15 * 1000;
const CREATE_STREAM_RATE_LIMIT_BACKOFF_MS = 10 * 60 * 1000;

let nextCreateStreamAt = 0;

function sendCors(req, res) {
  const origin = req.get('origin');

  if (ALLOWED_ORIGINS.has(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
  }

  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return true;
  }

  return false;
}

function rejectUnlessPost(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return true;
  }

  return false;
}

async function requireActiveLive() {
  const response = await fetch(LIVE_STATUS_URL);

  if (!response.ok) {
    throw new Error('Live status is unavailable.');
  }

  const live = await response.json();

  if (!live || live.active !== true || typeof live.expiresAt !== 'number' || live.expiresAt <= Date.now()) {
    throw new Error('Alyssa is not live right now.');
  }
}

async function getAccessToken() {
  const response = await fetch('https://www.googleapis.com/oauth2/v4/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: nestClientId.value().trim(),
      client_secret: nestClientSecret.value().trim(),
      refresh_token: nestRefreshToken.value().trim(),
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Could not refresh Nest access token.');
  }

  return data.access_token;
}

async function executeNestCommand(command, params) {
  const accessToken = await getAccessToken();
  const response = await fetch(`https://smartdevicemanagement.googleapis.com/v1/${DEVICE_NAME}:executeCommand`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ command, params }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error?.message || 'Nest live stream request failed.');
  }

  return data.results || {};
}

function isRateLimitError(error) {
  return /rate.?limit|rate.?limited|resource has been exhausted|quota/i.test(error.message || '');
}

function rejectIfCreateStreamCoolingDown() {
  const waitMs = nextCreateStreamAt - Date.now();

  if (waitMs > 0) {
    const waitSeconds = Math.ceil(waitMs / 1000);
    throw new Error(`Nest is cooling down. Please try again in ${waitSeconds} seconds.`);
  }
}

function makeHandler(handler) {
  return onRequest({
    region: 'us-central1',
    invoker: 'public',
    minInstances: 0,
    secrets: [nestClientId, nestClientSecret, nestRefreshToken],
  }, async (req, res) => {
    if (sendCors(req, res) || rejectUnlessPost(req, res)) return;

    try {
      await requireActiveLive();
      const result = await handler(req);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message || 'Live stream is unavailable.' });
    }
  });
}

exports.createAlyssaLiveStream = makeHandler(async (req) => {
  const offerSdp = req.body?.offerSdp;

  if (typeof offerSdp !== 'string' || offerSdp.length < 20) {
    throw new Error('Missing WebRTC offer.');
  }

  rejectIfCreateStreamCoolingDown();
  nextCreateStreamAt = Date.now() + CREATE_STREAM_MIN_INTERVAL_MS;

  try {
    return await executeNestCommand('sdm.devices.commands.CameraLiveStream.GenerateWebRtcStream', {
      offerSdp,
    });
  } catch (error) {
    if (isRateLimitError(error)) {
      nextCreateStreamAt = Date.now() + CREATE_STREAM_RATE_LIMIT_BACKOFF_MS;
      throw new Error('Nest is rate limiting the stream. Please wait a few minutes before trying again.');
    }

    nextCreateStreamAt = Date.now() + CREATE_STREAM_MIN_INTERVAL_MS;
    throw error;
  }
});

exports.extendAlyssaLiveStream = makeHandler(async (req) => {
  const mediaSessionId = req.body?.mediaSessionId;

  if (typeof mediaSessionId !== 'string' || mediaSessionId.length < 8) {
    throw new Error('Missing media session.');
  }

  return executeNestCommand('sdm.devices.commands.CameraLiveStream.ExtendWebRtcStream', {
    mediaSessionId,
  });
});

exports.stopAlyssaLiveStream = makeHandler(async (req) => {
  const mediaSessionId = req.body?.mediaSessionId;

  if (typeof mediaSessionId !== 'string' || mediaSessionId.length < 8) {
    return {};
  }

  return executeNestCommand('sdm.devices.commands.CameraLiveStream.StopWebRtcStream', {
    mediaSessionId,
  });
});
