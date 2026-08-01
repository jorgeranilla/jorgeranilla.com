(function () {
  const DEFAULT_FIREBASE_CONFIG = {
    apiKey: 'AIzaSyBc0zrXLzr9Qhq9iuhXLAXOzbkQ13mEaU4',
    authDomain: 'jorgeranilla-site.firebaseapp.com',
    projectId: 'jorgeranilla-site',
    storageBucket: 'jorgeranilla-site.firebasestorage.app',
    messagingSenderId: '125483521813',
    appId: '1:125483521813:web:f48b02d491cb4c698ffb1c'
  };
  const CACHE_KEY = 'jrFamilyVideos:v2';
  const CACHE_TTL_MS = 10 * 60 * 1000;
  const PHOTO_COUNT_CACHE_KEY = 'jrFamilyPhotosCount:v1';
  const DRIVE_API_KEY = 'AIzaSyCadJTGnwhASQ-kj7p4AnGFAwXIIFChoSs';
  const FAMILY_PHOTOS_FOLDER_ID = '10ee3xB70t7S0cxqgEFoRQ9eMy4BIVjpJ';
  const DRIVE_PAGE_SIZE = 200;
  const MAX_VIDEOS = 200;

  let videos = [];
  let currentIndex = 0;

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function setLoading(isLoading) {
    const loading = document.getElementById('videos-loading');
    if (loading) loading.style.display = isLoading ? 'flex' : 'none';
  }

  function showError(message) {
    const error = document.getElementById('videos-error');
    if (!error) return;
    error.style.display = 'block';
    const text = error.querySelector('p');
    if (text) text.textContent = message;
  }

  function hideError() {
    const error = document.getElementById('videos-error');
    if (error) error.style.display = 'none';
  }

  function readCache() {
    try {
      const cached = JSON.parse(window.localStorage?.getItem(CACHE_KEY) || 'null');
      if (cached?.savedAt && Date.now() - cached.savedAt < CACHE_TTL_MS && Array.isArray(cached.videos)) {
        return cached;
      }
    } catch (error) {
      // Cache is optional; Firestore remains the source of truth.
    }
    return null;
  }

  function writeCache(data) {
    try {
      window.localStorage?.setItem(CACHE_KEY, JSON.stringify({
        ...data,
        savedAt: Date.now()
      }));
    } catch (error) {
      // A failed cache write should not affect the page.
    }
  }

  function readPhotoCountCache() {
    try {
      const cached = JSON.parse(window.localStorage?.getItem(PHOTO_COUNT_CACHE_KEY) || 'null');
      const count = Number(cached?.count);
      if (cached?.savedAt && Date.now() - cached.savedAt < CACHE_TTL_MS && Number.isFinite(count) && count > 0) {
        return count;
      }
    } catch (error) {
      // The photo count link can still work without a cached count.
    }
    return null;
  }

  function writePhotoCountCache(count) {
    const total = Number(count);
    if (!Number.isFinite(total) || total <= 0) return;

    try {
      window.localStorage?.setItem(PHOTO_COUNT_CACHE_KEY, JSON.stringify({
        count: total,
        savedAt: Date.now()
      }));
    } catch (error) {
      // Count caching is optional.
    }
  }

  function updatePhotoCountLink(photoCount) {
    const link = document.getElementById('photo-gallery-link');
    const count = document.getElementById('gallery-photo-count');
    if (!link || !count) return;

    if (Number.isFinite(Number(photoCount)) && Number(photoCount) > 0) {
      const total = Number(photoCount);
      count.textContent = `${total} photo${total === 1 ? '' : 's'}`;
    }

    link.style.display = 'inline-flex';
  }

  async function loadPhotoCount() {
    const cached = readPhotoCountCache();
    if (cached !== null) return cached;

    let pageToken = '';
    let total = 0;

    do {
      const params = new URLSearchParams({
        key: DRIVE_API_KEY,
        q: `'${FAMILY_PHOTOS_FOLDER_ID}' in parents and trashed = false`,
        fields: 'nextPageToken,files(id,mimeType)',
        pageSize: String(DRIVE_PAGE_SIZE)
      });
      if (pageToken) params.set('pageToken', pageToken);

      const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error?.message || 'Drive photo count unavailable.');

      total += (data.files || []).filter(file => String(file.mimeType || '').startsWith('image/')).length;
      pageToken = data.nextPageToken || '';
    } while (pageToken);

    writePhotoCountCache(total);
    return total;
  }

  function refreshPhotoCountLink() {
    updatePhotoCountLink(readPhotoCountCache());
    loadPhotoCount()
      .then(updatePhotoCountLink)
      .catch(error => {
        console.warn('Family photo count is unavailable.', error);
      });
  }

  function timestampToMillis(value) {
    if (typeof value?.toMillis === 'function') return value.toMillis();
    if (typeof value?.seconds === 'number') return value.seconds * 1000;
    const parsed = Date.parse(value || '');
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function dateOnlyToMillis(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return 0;
    const parsed = Date.parse(`${value}T00:00:00Z`);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function normalizePlaylist(docSnap) {
    const data = docSnap.data() || {};
    return {
      id: docSnap.id,
      title: data.title || 'Family Gallery',
      description: data.description || '',
      thumbnailUrl: data.thumbnailUrl || '',
      videoIds: Array.isArray(data.videoIds) ? data.videoIds : [],
      status: data.status || '',
      updatedMs: timestampToMillis(data.updatedAt || data.syncedAt)
    };
  }

  function normalizeVideo(docSnap) {
    const data = docSnap.data() || {};
    const sortTimestamp = Number(data.sortTimestamp || 0);
    const displayDate = data.sortDate || data.videoDate || data.publishedAt || '';
    const sortMs = Number.isFinite(sortTimestamp) && sortTimestamp > 0
      ? sortTimestamp
      : dateOnlyToMillis(data.sortDate || data.videoDate) || timestampToMillis(data.publishedAt);

    return {
      id: docSnap.id,
      youtubeId: data.youtubeId || '',
      title: data.title || data.youtubeId || 'Family video',
      description: data.description || '',
      thumbnailUrl: data.thumbnailUrl || (data.youtubeId ? `https://i.ytimg.com/vi/${encodeURIComponent(data.youtubeId)}/hqdefault.jpg` : ''),
      embedUrl: data.embedUrl || (data.youtubeId ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(data.youtubeId)}?rel=0` : ''),
      watchUrl: data.watchUrl || (data.youtubeId ? `https://www.youtube.com/watch?v=${encodeURIComponent(data.youtubeId)}` : ''),
      publishedAt: data.publishedAt || '',
      videoDate: data.videoDate || '',
      displayDate,
      sortDateSource: data.sortDateSource || '',
      playlistPosition: Number.isFinite(Number(data.playlistPosition)) ? Number(data.playlistPosition) : 999999,
      updatedMs: timestampToMillis(data.updatedAt || data.syncedAt),
      publishedMs: timestampToMillis(data.publishedAt),
      sortMs
    };
  }

  async function loadFromFirestore() {
    const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js');
    const { getFirestore, collection, getDocs, limit, query, where } = await import('https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js');

    const app = getApps().length ? getApps()[0] : initializeApp(DEFAULT_FIREBASE_CONFIG);
    const db = getFirestore(app);
    const playlistQuery = query(
      collection(db, 'familyVideoPlaylists'),
      where('status', 'in', ['active', 'empty']),
      limit(5)
    );
    const playlistSnapshot = await getDocs(playlistQuery);
    const playlists = playlistSnapshot.docs.map(normalizePlaylist)
      .sort((a, b) => (b.videoIds.length - a.videoIds.length) || a.title.localeCompare(b.title));
    const playlist = playlists[0] || {
      id: '',
      title: 'Family Gallery',
      description: '',
      videoIds: []
    };

    const videoConstraints = [
      where('status', '==', 'published'),
      limit(MAX_VIDEOS)
    ];
    if (playlist.id) {
      videoConstraints.unshift(where('sourcePlaylistId', '==', playlist.id));
    }

    const videosQuery = query(collection(db, 'familyVideos'), ...videoConstraints);
    const videosSnapshot = await getDocs(videosQuery);
    const loadedVideos = videosSnapshot.docs.map(normalizeVideo)
      .filter(video => video.youtubeId && video.embedUrl)
      .sort((a, b) => b.sortMs - a.sortMs || b.publishedMs - a.publishedMs || a.title.localeCompare(b.title));

    const data = {
      playlist,
      videos: loadedVideos,
      totalVideos: playlist.videoIds.length || loadedVideos.length
    };
    writeCache(data);
    return data;
  }

  function updateCount(videoCount) {
    const count = document.getElementById('video-count');
    if (!count) return;
    count.textContent = `${videoCount} video${videoCount === 1 ? '' : 's'}`;
    count.style.display = 'inline-block';
  }

  function formatDate(value) {
    let date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value || '')) {
      const [year, month, day] = value.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(value || '');
    }

    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function renderCategoryNav() {
    const nav = document.getElementById('video-category-nav');
    if (!nav) return;
    nav.innerHTML = '';
  }

  function renderVideos(data) {
    const sections = document.getElementById('video-sections');
    if (!sections) return;

    videos = data.videos || [];
    updateCount(Number(data.totalVideos || 0) || videos.length);
    renderCategoryNav();

    if (videos.length === 0) {
      sections.innerHTML = '<div class="gallery-error"><p>No videos have been synced from YouTube yet.</p></div>';
      return;
    }

    sections.innerHTML = `
      <section class="video-section" id="family-gallery-videos">
        <div class="gallery-grid video-grid">
          ${videos.map((video, index) => renderVideoCard(video, index)).join('')}
        </div>
      </section>
    `;

    sections.querySelectorAll('[data-video-index]').forEach(button => {
      button.addEventListener('click', () => openLightbox(Number(button.dataset.videoIndex || 0)));
    });
  }

  function renderVideoCard(video, index) {
    return `
      <button type="button" class="gallery-item gallery-item--video video-card" data-video-index="${index}" aria-label="Play ${escapeHtml(video.title)}">
        <img src="${escapeHtml(video.thumbnailUrl)}" alt="" loading="lazy">
        <span class="video-play-btn" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path fill="white" d="M8 5v14l11-7z"/></svg>
        </span>
      </button>
    `;
  }

  function initLightbox() {
    const lightbox = document.getElementById('video-lightbox');
    const close = document.getElementById('video-lightbox-close');
    const prev = document.getElementById('video-lightbox-prev');
    const next = document.getElementById('video-lightbox-next');

    if (!lightbox || !close || !prev || !next) return;

    close.addEventListener('click', closeLightbox);
    prev.addEventListener('click', () => shiftLightbox(-1));
    next.addEventListener('click', () => shiftLightbox(1));
    lightbox.addEventListener('click', event => {
      if (event.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', event => {
      if (!lightbox.classList.contains('active')) return;
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft') shiftLightbox(-1);
      if (event.key === 'ArrowRight') shiftLightbox(1);
    });
  }

  function openLightbox(index) {
    if (!videos[index]) return;
    currentIndex = index;
    showCurrentVideo();
    const lightbox = document.getElementById('video-lightbox');
    if (!lightbox) return;
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function showCurrentVideo() {
    const video = videos[currentIndex];
    const frame = document.getElementById('video-lightbox-frame');
    const description = document.getElementById('video-lightbox-description');
    const link = document.getElementById('video-lightbox-link');
    const counter = document.getElementById('video-lightbox-counter');
    if (!video || !frame || !link || !counter) return;

    frame.src = video.embedUrl;
    link.href = video.watchUrl || `https://www.youtube.com/watch?v=${encodeURIComponent(video.youtubeId)}`;
    counter.textContent = `${currentIndex + 1} / ${videos.length}`;
  }

  function shiftLightbox(direction) {
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= videos.length) return;
    currentIndex = nextIndex;
    showCurrentVideo();
  }

  function closeLightbox() {
    const lightbox = document.getElementById('video-lightbox');
    const frame = document.getElementById('video-lightbox-frame');
    if (lightbox) {
      lightbox.classList.remove('active');
      lightbox.setAttribute('aria-hidden', 'true');
    }
    if (frame) frame.src = '';
    document.body.style.overflow = '';
  }

  async function start() {
    setLoading(true);
    hideError();
    initLightbox();
    refreshPhotoCountLink();

    try {
      const cached = readCache();
      if (cached) {
        renderVideos(cached);
        setLoading(false);
        return;
      }

      const data = await loadFromFirestore();
      setLoading(false);
      renderVideos(data);
    } catch (error) {
      console.error('Videos load error:', error);
      setLoading(false);
      showError('Could not load videos right now. Please try refreshing the page.');
    }
  }

  start();
})();
