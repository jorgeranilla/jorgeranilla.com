const crypto = require('crypto');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const logger = require('firebase-functions/logger');
const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;
const FieldPath = admin.firestore.FieldPath;

const VIDEOS_COLLECTION = 'familyVideos';
const PLAYLISTS_COLLECTION = 'familyVideoPlaylists';
const SYNC_LOGS_COLLECTION = 'familyVideoSyncLogs';
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const DEFAULT_SYNC_SCHEDULE = '0 15 * * *';
const DEFAULT_SYNC_TIME_ZONE = 'America/New_York';
const DEFAULT_PLAYLIST_TITLE = 'Family Gallery';
const MAX_YOUTUBE_PAGE_SIZE = 50;
const FIRESTORE_IN_CHUNK_SIZE = 30;
const SOURCE_VIDEO_LIMIT = 1000;

const YOUTUBE_SYNC_SCHEDULE = cleanConfig(process.env.YOUTUBE_SYNC_SCHEDULE) || DEFAULT_SYNC_SCHEDULE;
const YOUTUBE_SYNC_TIME_ZONE = cleanConfig(process.env.YOUTUBE_SYNC_TIME_ZONE) || DEFAULT_SYNC_TIME_ZONE;

function cleanConfig(value) {
  return String(value || '').trim();
}

function cleanText(value, maxLength = 5000) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function cleanDescription(value, maxLength = 5000) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength);
}

function makeSlug(value) {
  return cleanText(value, 180)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'family-gallery';
}

function getRequiredConfig() {
  const apiKey = cleanConfig(process.env.YOUTUBE_API_KEY);
  const playlistId = cleanConfig(process.env.YOUTUBE_PLAYLIST_ID);
  const playlistTitle = cleanText(process.env.YOUTUBE_PLAYLIST_TITLE || DEFAULT_PLAYLIST_TITLE, 180);

  if (!apiKey) {
    throw new Error('Missing YOUTUBE_API_KEY environment variable.');
  }

  if (!playlistId) {
    throw new Error('Set YOUTUBE_PLAYLIST_ID to the Family Gallery playlist ID. The sync does not scan the full channel.');
  }

  return {
    apiKey,
    playlistId,
    playlistTitle,
    playlistSlug: makeSlug(playlistTitle)
  };
}

function buildYoutubeUrl(endpoint, params) {
  const url = new URL(`${YOUTUBE_API_BASE}/${endpoint}`);

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

async function youtubeGet(endpoint, params) {
  const response = await fetch(buildYoutubeUrl(endpoint, params));
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.error?.message || `YouTube ${endpoint} request failed.`;
    throw new Error(message);
  }

  return data;
}

function pickThumbnail(thumbnails) {
  const preferred = ['maxres', 'standard', 'high', 'medium', 'default'];
  for (const key of preferred) {
    const url = cleanConfig(thumbnails?.[key]?.url);
    if (url) return url;
  }
  return '';
}

async function fetchPlaylistMetadata(config) {
  const data = await youtubeGet('playlists', {
    key: config.apiKey,
    id: config.playlistId,
    part: 'snippet,contentDetails,status',
    maxResults: 1
  });

  const playlist = data.items?.[0];
  if (!playlist) {
    throw new Error(`Could not find YouTube playlist ${config.playlistId}.`);
  }

  const title = cleanText(playlist.snippet?.title || config.playlistTitle, 180);

  return {
    playlistId: config.playlistId,
    title,
    description: cleanText(playlist.snippet?.description, 2000),
    thumbnailUrl: pickThumbnail(playlist.snippet?.thumbnails),
    channelId: cleanConfig(playlist.snippet?.channelId),
    channelTitle: cleanText(playlist.snippet?.channelTitle, 200),
    publishedAt: cleanConfig(playlist.snippet?.publishedAt),
    itemCount: Number(playlist.contentDetails?.itemCount || 0),
    privacyStatus: cleanConfig(playlist.status?.privacyStatus),
    categorySlug: makeSlug(title),
    source: 'youtube-playlist',
    status: 'active'
  };
}

async function fetchPlaylistItems(config) {
  const items = [];
  let pageToken = '';

  do {
    const data = await youtubeGet('playlistItems', {
      key: config.apiKey,
      playlistId: config.playlistId,
      part: 'snippet,contentDetails,status',
      maxResults: MAX_YOUTUBE_PAGE_SIZE,
      pageToken
    });

    (data.items || []).forEach(item => {
      const videoId = cleanConfig(item.contentDetails?.videoId || item.snippet?.resourceId?.videoId);
      if (!videoId) return;

      items.push({
        videoId,
        playlistId: config.playlistId,
        playlistItemId: cleanConfig(item.id),
        playlistPosition: Number.isFinite(Number(item.snippet?.position)) ? Number(item.snippet.position) : null,
        playlistItemPublishedAt: cleanConfig(item.snippet?.publishedAt),
        videoPublishedAt: cleanConfig(item.contentDetails?.videoPublishedAt || item.snippet?.publishedAt)
      });
    });

    pageToken = cleanConfig(data.nextPageToken);
  } while (pageToken);

  return items;
}

function chunk(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

async function fetchVideoDetails(apiKey, videoIds) {
  const details = new Map();
  const uniqueVideoIds = [...new Set(videoIds)].filter(Boolean);

  for (const ids of chunk(uniqueVideoIds, MAX_YOUTUBE_PAGE_SIZE)) {
    const data = await youtubeGet('videos', {
      key: apiKey,
      id: ids.join(','),
      part: 'snippet,contentDetails,status',
      maxResults: MAX_YOUTUBE_PAGE_SIZE
    });

    (data.items || []).forEach(video => {
      if (video.id) details.set(video.id, video);
    });
  }

  return details;
}

function toVideoDocId(videoId) {
  return `yt_${videoId}`;
}

function makeWatchUrl(videoId) {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

function makeEmbedUrl(videoId) {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0`;
}

function toValidIsoDate(year, month, day) {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return '';
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return '';

  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return '';
  return date.toISOString().slice(0, 10);
}

function isoDateToSortTimestamp(isoDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate || '')) return 0;
  const parsed = Date.parse(`${isoDate}T00:00:00Z`);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseTitleDate(title) {
  const text = cleanText(title, 300);
  if (!text) return '';

  const yearFirst = text.match(/(?:^|[^\d])((?:19|20)\d{2})[.\-/_ ](0?[1-9]|1[0-2])[.\-/_ ](0?[1-9]|[12]\d|3[01])(?:[^\d]|$)/);
  if (yearFirst) return toValidIsoDate(yearFirst[1], yearFirst[2], yearFirst[3]);

  const monthFirst = text.match(/(?:^|[^\d])(0?[1-9]|1[0-2])[.\-/_ ](0?[1-9]|[12]\d|3[01])[.\-/_ ]((?:19|20)\d{2})(?:[^\d]|$)/);
  if (monthFirst) return toValidIsoDate(monthFirst[3], monthFirst[1], monthFirst[2]);

  const monthNames = {
    jan: 1,
    january: 1,
    feb: 2,
    february: 2,
    mar: 3,
    march: 3,
    apr: 4,
    april: 4,
    may: 5,
    jun: 6,
    june: 6,
    jul: 7,
    july: 7,
    aug: 8,
    august: 8,
    sep: 9,
    sept: 9,
    september: 9,
    oct: 10,
    october: 10,
    nov: 11,
    november: 11,
    dec: 12,
    december: 12
  };
  const monthPattern = Object.keys(monthNames).join('|');
  const monthNameFirst = text.match(new RegExp(`(?:^|[^a-z])(${monthPattern})\\.?\\s+(0?[1-9]|[12]\\d|3[01])(?:st|nd|rd|th)?[,]?\\s+((?:19|20)\\d{2})(?:[^\\d]|$)`, 'i'));
  if (monthNameFirst) {
    return toValidIsoDate(monthNameFirst[3], monthNames[monthNameFirst[1].toLowerCase()], monthNameFirst[2]);
  }

  const dayFirst = text.match(new RegExp(`(?:^|[^\\d])(0?[1-9]|[12]\\d|3[01])(?:st|nd|rd|th)?\\s+(${monthPattern})\\.?[,]?\\s+((?:19|20)\\d{2})(?:[^\\d]|$)`, 'i'));
  if (dayFirst) {
    return toValidIsoDate(dayFirst[3], monthNames[dayFirst[2].toLowerCase()], dayFirst[1]);
  }

  return '';
}

function resolveVideoDate(title, publishedAt) {
  const titleDate = parseTitleDate(title);
  if (titleDate) {
    return {
      videoDate: titleDate,
      sortDate: titleDate,
      sortDateSource: 'title',
      sortTimestamp: isoDateToSortTimestamp(titleDate)
    };
  }

  const publishedMs = Date.parse(publishedAt || '');
  if (Number.isFinite(publishedMs)) {
    const publishedDate = new Date(publishedMs).toISOString().slice(0, 10);
    return {
      videoDate: '',
      sortDate: publishedDate,
      sortDateSource: 'youtube-published-at',
      sortTimestamp: publishedMs
    };
  }

  return {
    videoDate: '',
    sortDate: '',
    sortDateSource: '',
    sortTimestamp: 0
  };
}

function getWebsiteStatus(youtubeStatus = {}) {
  const privacyStatus = cleanConfig(youtubeStatus.privacyStatus);
  const uploadStatus = cleanConfig(youtubeStatus.uploadStatus);
  const embeddable = youtubeStatus.embeddable !== false;

  if (!['public', 'unlisted'].includes(privacyStatus)) return 'hidden';
  if (uploadStatus && uploadStatus !== 'processed') return 'hidden';
  if (!embeddable) return 'hidden';
  return 'published';
}

function hashObject(value) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(value))
    .digest('hex');
}

function normalizeVideoRecord(detail, playlistItem, playlist) {
  const snippet = detail.snippet || {};
  const status = detail.status || {};
  const contentDetails = detail.contentDetails || {};
  const videoId = cleanConfig(detail.id || playlistItem.videoId);
  if (!videoId) return null;

  const title = cleanText(snippet.title, 300);
  const publishedAt = cleanConfig(snippet.publishedAt || playlistItem.videoPublishedAt || playlistItem.playlistItemPublishedAt);
  const videoDate = resolveVideoDate(title, publishedAt);
  const websiteStatus = getWebsiteStatus(status);
  const metadata = {
    source: 'youtube',
    sourcePlaylistId: playlist.playlistId,
    sourcePlaylistTitle: playlist.title,
    primaryPlaylistId: playlist.playlistId,
    primaryPlaylistTitle: playlist.title,
    primaryCategorySlug: playlist.categorySlug,
    youtubeId: videoId,
    title,
    description: cleanDescription(snippet.description, 5000),
    channelId: cleanConfig(snippet.channelId || playlist.channelId),
    channelTitle: cleanText(snippet.channelTitle || playlist.channelTitle, 200),
    publishedAt,
    videoDate: videoDate.videoDate,
    sortDate: videoDate.sortDate,
    sortDateSource: videoDate.sortDateSource,
    sortTimestamp: videoDate.sortTimestamp,
    thumbnailUrl: pickThumbnail(snippet.thumbnails),
    duration: cleanConfig(contentDetails.duration),
    definition: cleanConfig(contentDetails.definition),
    dimension: cleanConfig(contentDetails.dimension),
    privacyStatus: cleanConfig(status.privacyStatus),
    uploadStatus: cleanConfig(status.uploadStatus),
    embeddable: status.embeddable !== false,
    license: cleanConfig(status.license),
    madeForKids: Boolean(status.madeForKids),
    playlistIds: [playlist.playlistId],
    playlistTitles: [playlist.title],
    playlists: [{
      playlistId: playlist.playlistId,
      title: playlist.title,
      categorySlug: playlist.categorySlug,
      playlistItemId: playlistItem.playlistItemId,
      playlistPosition: playlistItem.playlistPosition,
      playlistItemPublishedAt: playlistItem.playlistItemPublishedAt
    }],
    playlistItemId: playlistItem.playlistItemId,
    playlistPosition: playlistItem.playlistPosition,
    playlistItemPublishedAt: playlistItem.playlistItemPublishedAt,
    watchUrl: makeWatchUrl(videoId),
    embedUrl: makeEmbedUrl(videoId),
    status: websiteStatus,
    hiddenReason: websiteStatus === 'hidden'
      ? 'This YouTube video is not public, is not processed, or cannot be embedded.'
      : ''
  };

  return {
    docId: toVideoDocId(videoId),
    videoId,
    metadata,
    hash: hashObject(metadata)
  };
}

async function fetchConfiguredPlaylistVideos(config) {
  const playlist = await fetchPlaylistMetadata(config);
  const playlistItems = await fetchPlaylistItems(config);
  const uniqueItems = [];
  const seenVideoIds = new Set();

  playlistItems.forEach(item => {
    if (seenVideoIds.has(item.videoId)) return;
    seenVideoIds.add(item.videoId);
    uniqueItems.push(item);
  });

  const details = await fetchVideoDetails(config.apiKey, uniqueItems.map(item => item.videoId));
  const videos = [];
  const missingDetails = [];

  uniqueItems.forEach(item => {
    const detail = details.get(item.videoId);
    if (!detail) {
      missingDetails.push(item.videoId);
      return;
    }

    const video = normalizeVideoRecord(detail, item, playlist);
    if (video) videos.push(video);
  });

  playlist.videoIds = uniqueItems.map(item => item.videoId);
  playlist.itemCount = uniqueItems.length;
  playlist.status = uniqueItems.length ? 'active' : 'empty';
  playlist.playlistHash = hashObject({
    title: playlist.title,
    description: playlist.description,
    thumbnailUrl: playlist.thumbnailUrl,
    channelId: playlist.channelId,
    channelTitle: playlist.channelTitle,
    publishedAt: playlist.publishedAt,
    itemCount: playlist.itemCount,
    privacyStatus: playlist.privacyStatus,
    categorySlug: playlist.categorySlug,
    status: playlist.status,
    videoIds: playlist.videoIds
  });

  return {
    playlist,
    videos,
    videosChecked: playlistItems.length,
    uniqueVideosChecked: uniqueItems.length,
    duplicatePlaylistItemsSkipped: Math.max(0, playlistItems.length - uniqueItems.length),
    missingDetails
  };
}

async function loadExistingDocs(collectionName, docIds) {
  const existing = new Map();
  const ids = [...new Set(docIds)].filter(Boolean);

  for (const idChunk of chunk(ids, FIRESTORE_IN_CHUNK_SIZE)) {
    const snapshot = await db
      .collection(collectionName)
      .where(FieldPath.documentId(), 'in', idChunk)
      .get();

    snapshot.docs.forEach(docSnap => existing.set(docSnap.id, docSnap.data() || {}));
  }

  return existing;
}

async function commitSetWrites(collectionName, writes) {
  for (const writeChunk of chunk(writes, 450)) {
    const batch = db.batch();
    writeChunk.forEach(write => {
      batch.set(db.collection(collectionName).doc(write.docId), write.payload, { merge: true });
    });
    await batch.commit();
  }
}

async function writePlaylistDoc(playlist, summary) {
  const ref = db.collection(PLAYLISTS_COLLECTION).doc(playlist.playlistId);
  const snap = await ref.get();
  const current = snap.data() || {};
  const payload = {
    ...playlist,
    syncedAt: FieldValue.serverTimestamp()
  };

  if (!snap.exists) {
    await ref.set({
      ...payload,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    summary.newPlaylistsAdded += 1;
    return;
  }

  if (current.playlistHash === playlist.playlistHash) return;

  const previousIds = new Set(Array.isArray(current.videoIds) ? current.videoIds : []);
  const nextIds = new Set(Array.isArray(playlist.videoIds) ? playlist.videoIds : []);
  const membershipChanged = previousIds.size !== nextIds.size
    || [...previousIds].some(videoId => !nextIds.has(videoId));

  if (membershipChanged) summary.playlistMembershipChanges += 1;

  await ref.set({
    ...payload,
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
  summary.updatedPlaylists += 1;
}

async function writeVideoDocs(videos, summary) {
  const existing = await loadExistingDocs(
    VIDEOS_COLLECTION,
    videos.map(video => video.docId)
  );
  const writes = [];

  videos.forEach(video => {
    const current = existing.get(video.docId);
    const payload = {
      ...video.metadata,
      metadataHash: video.hash,
      syncedAt: FieldValue.serverTimestamp()
    };

    if (!current) {
      writes.push({
        docId: video.docId,
        payload: {
          ...payload,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        }
      });
      summary.newVideosAdded += 1;
      return;
    }

    if (current.metadataHash === video.hash) {
      summary.unchangedVideos += 1;
      return;
    }

    writes.push({
      docId: video.docId,
      payload: {
        ...payload,
        updatedAt: FieldValue.serverTimestamp()
      }
    });
    summary.updatedVideos += 1;
  });

  await commitSetWrites(VIDEOS_COLLECTION, writes);
}

async function hideRemovedPlaylistVideos(config, currentVideoIds, summary) {
  const current = new Set(currentVideoIds);
  const snapshot = await db
    .collection(VIDEOS_COLLECTION)
    .where('sourcePlaylistId', '==', config.playlistId)
    .limit(SOURCE_VIDEO_LIMIT)
    .get();
  const writes = [];

  snapshot.docs.forEach(docSnap => {
    const data = docSnap.data() || {};
    if (!data.youtubeId || current.has(data.youtubeId) || data.status === 'hidden') return;

    writes.push({
      docId: docSnap.id,
      payload: {
        status: 'hidden',
        hiddenReason: 'Removed from the configured Family Gallery YouTube playlist.',
        updatedAt: FieldValue.serverTimestamp(),
        syncedAt: FieldValue.serverTimestamp()
      }
    });
  });

  await commitSetWrites(VIDEOS_COLLECTION, writes);
  summary.sourceVideoDocsRead = snapshot.size;
  summary.videosHidden = writes.length;
  summary.sourceVideoLimited = snapshot.size >= SOURCE_VIDEO_LIMIT;
}

async function writeSyncLog(summary) {
  await db.collection(SYNC_LOGS_COLLECTION).doc(summary.logId).set({
    ...summary,
    endedAt: FieldValue.serverTimestamp()
  }, { merge: true });
}

async function runYoutubeVideoSync() {
  const startedAt = new Date();
  const logId = `sync_${startedAt.toISOString().replace(/[^0-9]/g, '').slice(0, 14)}`;
  const summary = {
    logId,
    status: 'success',
    startTime: Timestamp.fromDate(startedAt),
    startTimeIso: startedAt.toISOString(),
    schedule: YOUTUBE_SYNC_SCHEDULE,
    timeZone: YOUTUBE_SYNC_TIME_ZONE,
    sourcePlaylistId: '',
    sourcePlaylistTitle: '',
    videosChecked: 0,
    uniqueVideosChecked: 0,
    duplicatePlaylistItemsSkipped: 0,
    newVideosAdded: 0,
    updatedVideos: 0,
    unchangedVideos: 0,
    videosHidden: 0,
    newPlaylistsAdded: 0,
    updatedPlaylists: 0,
    playlistMembershipChanges: 0,
    sourceVideoDocsRead: 0,
    sourceVideoLimited: false,
    errors: []
  };

  try {
    const config = getRequiredConfig();
    summary.sourcePlaylistId = config.playlistId;

    const fetched = await fetchConfiguredPlaylistVideos(config);
    summary.sourcePlaylistTitle = fetched.playlist.title;
    summary.videosChecked = fetched.videosChecked;
    summary.uniqueVideosChecked = fetched.uniqueVideosChecked;
    summary.duplicatePlaylistItemsSkipped = fetched.duplicatePlaylistItemsSkipped;
    if (fetched.missingDetails.length) {
      summary.errors.push(`Missing details for ${fetched.missingDetails.length} playlist item(s).`);
    }

    await writePlaylistDoc(fetched.playlist, summary);
    await writeVideoDocs(fetched.videos, summary);
    await hideRemovedPlaylistVideos(
      config,
      fetched.videos.map(video => video.videoId),
      summary
    );

    await writeSyncLog(summary);
    logger.info('YouTube family video sync complete.', summary);
    return summary;
  } catch (error) {
    summary.status = 'error';
    summary.errors.push(cleanText(error.message || String(error), 1000));
    await writeSyncLog(summary);
    logger.error('YouTube family video sync failed.', summary);
    throw error;
  }
}

exports.syncFamilyVideosFromYouTube = onSchedule({
  region: 'us-central1',
  schedule: YOUTUBE_SYNC_SCHEDULE,
  timeZone: YOUTUBE_SYNC_TIME_ZONE,
  timeoutSeconds: 300,
  memory: '512MiB',
  minInstances: 0
}, runYoutubeVideoSync);

exports._runYoutubeVideoSync = runYoutubeVideoSync;
