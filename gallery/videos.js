(function () {
  const DEFAULT_FIREBASE_CONFIG = {
    apiKey: 'AIzaSyBc0zrXLzr9Qhq9iuhXLAXOzbkQ13mEaU4',
    authDomain: 'jorgeranilla-site.firebaseapp.com',
    projectId: 'jorgeranilla-site',
    storageBucket: 'jorgeranilla-site.firebasestorage.app',
    messagingSenderId: '125483521813',
    appId: '1:125483521813:web:f48b02d491cb4c698ffb1c'
  };
  const CACHE_KEY = 'jrFamilyVideos:v1';
  const CACHE_TTL_MS = 10 * 60 * 1000;
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

  function timestampToMillis(value) {
    if (typeof value?.toMillis === 'function') return value.toMillis();
    if (typeof value?.seconds === 'number') return value.seconds * 1000;
    const parsed = Date.parse(value || '');
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
    return {
      id: docSnap.id,
      youtubeId: data.youtubeId || '',
      title: data.title || data.youtubeId || 'Family video',
      description: data.description || '',
      thumbnailUrl: data.thumbnailUrl || (data.youtubeId ? `https://i.ytimg.com/vi/${encodeURIComponent(data.youtubeId)}/hqdefault.jpg` : ''),
      embedUrl: data.embedUrl || (data.youtubeId ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(data.youtubeId)}?rel=0` : ''),
      watchUrl: data.watchUrl || (data.youtubeId ? `https://www.youtube.com/watch?v=${encodeURIComponent(data.youtubeId)}` : ''),
      publishedAt: data.publishedAt || '',
      playlistPosition: Number.isFinite(Number(data.playlistPosition)) ? Number(data.playlistPosition) : 999999,
      updatedMs: timestampToMillis(data.updatedAt || data.syncedAt),
      publishedMs: timestampToMillis(data.publishedAt)
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
      .sort((a, b) => a.playlistPosition - b.playlistPosition || b.publishedMs - a.publishedMs || a.title.localeCompare(b.title));

    const data = { playlist, videos: loadedVideos };
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
    const date = new Date(value || '');
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function renderCategoryNav(playlist) {
    const nav = document.getElementById('video-category-nav');
    if (!nav) return;
    nav.innerHTML = `
      <a class="video-category-chip active" href="#family-gallery-videos">
        ${escapeHtml(playlist.title || 'Family Gallery')}
      </a>
    `;
  }

  function renderVideos(data) {
    const sections = document.getElementById('video-sections');
    if (!sections) return;

    videos = data.videos || [];
    updateCount(videos.length);
    renderCategoryNav(data.playlist || {});

    if (videos.length === 0) {
      sections.innerHTML = '<div class="gallery-error"><p>No videos have been synced from the Family Gallery playlist yet.</p></div>';
      return;
    }

    const playlist = data.playlist || {};
    sections.innerHTML = `
      <section class="video-section" id="family-gallery-videos">
        <div class="video-section-heading">
          <div>
            <h3>${escapeHtml(playlist.title || 'Family Gallery')}</h3>
            <p>${escapeHtml(playlist.description || 'Videos from the Family Gallery playlist on YouTube.')}</p>
          </div>
        </div>
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
    const date = formatDate(video.publishedAt);
    return `
      <button type="button" class="gallery-item gallery-item--video video-card" data-video-index="${index}">
        <img src="${escapeHtml(video.thumbnailUrl)}" alt="${escapeHtml(video.title)}" loading="lazy">
        <span class="video-play-btn" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path fill="white" d="M8 5v14l11-7z"/></svg>
        </span>
        <span class="video-card-caption">
          <span>${escapeHtml(video.title)}</span>
          ${date ? `<small>${escapeHtml(date)}</small>` : ''}
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
    const title = document.getElementById('video-lightbox-title');
    const link = document.getElementById('video-lightbox-link');
    const counter = document.getElementById('video-lightbox-counter');
    if (!video || !frame || !title || !link || !counter) return;

    frame.src = `${video.embedUrl}${video.embedUrl.includes('?') ? '&' : '?'}autoplay=1`;
    title.textContent = video.title;
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
