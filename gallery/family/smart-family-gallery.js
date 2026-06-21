(function () {
  const DEFAULT_FIREBASE_CONFIG = {
    apiKey: 'AIzaSyBc0zrXLzr9Qhq9iuhXLAXOzbkQ13mEaU4',
    authDomain: 'jorgeranilla-site.firebaseapp.com',
    projectId: 'jorgeranilla-site',
    storageBucket: 'jorgeranilla-site.firebasestorage.app',
    messagingSenderId: '125483521813',
    appId: '1:125483521813:web:f48b02d491cb4c698ffb1c'
  };

  const DEFAULTS = {
    driveApiKey: 'AIzaSyCadJTGnwhASQ-kj7p4AnGFAwXIIFChoSs',
    masterFolderId: '10ee3xB70t7S0cxqgEFoRQ9eMy4BIVjpJ',
    mode: 'all',
    personSlug: '',
    personAliases: [],
    albumSlug: '',
    pageSize: 25,
    drivePageSize: 200,
    tagCollection: 'familyPhotoTags',
    firebaseConfig: DEFAULT_FIREBASE_CONFIG,
    emptyText: 'No photos yet - check back soon!',
    errorText: "Couldn't load photos right now. Please try refreshing the page.",
    photoAlt: 'Family photo',
    videoAlt: 'Family video',
    fallbackNotice: ''
  };
  const TAG_CONTENT_FIELDS = ['mimeType', 'type', 'md5Checksum', 'size'];
  const GRID_THUMB_SIZE = 600;
  const LIGHTBOX_THUMB_SIZE = 2400;

  let config = {};
  let allFiles = [];
  let currentPage = 0;
  let lightboxIdx = 0;
  let lightboxReady = false;

  function mergeConfig(nextConfig) {
    config = { ...DEFAULTS, ...(nextConfig || {}) };
  }

  function compareFilesByName(a, b) {
    return b.name.localeCompare(a.name, undefined, {
      numeric: true,
      sensitivity: 'base'
    });
  }

  function compareFilesByCreatedTime(a, b) {
    const aTime = String(a.createdTime || '');
    const bTime = String(b.createdTime || '');
    if (bTime > aTime) return 1;
    if (bTime < aTime) return -1;
    return compareFilesByName(a, b);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getType(mimeType) {
    return String(mimeType || '').startsWith('video/') ? 'video' : 'image';
  }

  function driveThumb(fileId, size, version = '') {
    const cacheBust = version ? `&v=${encodeURIComponent(version)}` : '';
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w${size}${cacheBust}`;
  }

  function getDriveFieldValue(source, field) {
    return String(source?.[field] || '').trim();
  }

  function hasSavedDriveFingerprint(tag) {
    const drive = tag?.drive || {};
    return TAG_CONTENT_FIELDS.some(field => getDriveFieldValue(drive, field));
  }

  function isApprovedTagCurrentForFile(file, tag) {
    if (!tag || tag.status !== 'approved') return false;
    if (!hasSavedDriveFingerprint(tag)) return false;

    return TAG_CONTENT_FIELDS.every(field => {
      const saved = getDriveFieldValue(tag.drive, field);
      const current = getDriveFieldValue(file, field);
      return !saved || !current || saved === current;
    });
  }

  async function fetchDriveFolder(folderId) {
    if (!folderId) return [];

    const files = [];
    let pageToken = '';

    do {
      const q = encodeURIComponent(
        `'${folderId}' in parents and ` +
        `mimeType contains 'image/' and ` +
        `trashed = false`
      );

      const params = [
        `q=${q}`,
        `key=${encodeURIComponent(config.driveApiKey)}`,
        'fields=nextPageToken,files(id,name,mimeType,createdTime,modifiedTime,md5Checksum,size)',
        'orderBy=createdTime desc',
        `pageSize=${encodeURIComponent(config.drivePageSize)}`
      ];

      if (pageToken) {
        params.push(`pageToken=${encodeURIComponent(pageToken)}`);
      }

      const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.join('&')}`);
      const data = await response.json();

      if (!response.ok || !data.files) {
        throw new Error(data.error?.message || 'Drive API error');
      }

      files.push(...data.files.map(file => ({
        id: file.id,
        name: file.name,
        type: getType(file.mimeType),
        mimeType: file.mimeType,
        createdTime: file.createdTime || '',
        modifiedTime: file.modifiedTime || '',
        md5Checksum: file.md5Checksum || '',
        size: file.size || ''
      })));

      pageToken = data.nextPageToken || '';
    } while (pageToken);

    return files.sort(compareFilesByName);
  }

  async function loadApprovedTags() {
    if (config.mode === 'all') return new Map();

    try {
      const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js');
      const { getFirestore, collection, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js');

      const app = getApps().length ? getApps()[0] : initializeApp(config.firebaseConfig);
      const db = getFirestore(app);
      const approvedQuery = query(
        collection(db, config.tagCollection),
        where('status', '==', 'approved')
      );
      const snapshot = await getDocs(approvedQuery);
      const tags = new Map();

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data() || {};
        tags.set(docSnap.id, {
          ...data,
          id: docSnap.id,
          people: Array.isArray(data.people) ? data.people : [],
          peopleAliases: Array.isArray(data.peopleAliases) ? data.peopleAliases : [],
          personIds: Array.isArray(data.personIds) ? data.personIds : [],
          albums: Array.isArray(data.albums) ? data.albums : [],
          drive: data.drive && typeof data.drive === 'object' ? data.drive : {},
          status: data.status || ''
        });
      });

      return tags;
    } catch (error) {
      console.warn('Family photo tags are unavailable; showing no tagged photos for filtered galleries.', error);
      return new Map();
    }
  }

  async function loadYoutubeVideos() {
    try {
      const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js');
      const { getFirestore, collection, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js');

      const app = getApps().length ? getApps()[0] : initializeApp(config.firebaseConfig);
      const db = getFirestore(app);
      const q = query(
        collection(db, config.tagCollection),
        where('source', '==', 'youtube'),
        where('status', '==', 'approved')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(docSnap => {
        const data = docSnap.data() || {};
        const videoId = data.youtubeId || '';
        const approvedIso = data.approvedAt?.toDate?.()?.toISOString?.() || '';
        return {
          id: docSnap.id,
          youtubeId: videoId,
          youtubeThumbnail: data.youtubeThumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          youtubeTitle: data.youtubeTitle || '',
          name: data.youtubeTitle || videoId || docSnap.id,
          type: 'video',
          mimeType: 'video/youtube',
          source: 'youtube',
          people: Array.isArray(data.people) ? data.people : [],
          peopleAliases: Array.isArray(data.peopleAliases) ? data.peopleAliases : [],
          personIds: Array.isArray(data.personIds) ? data.personIds : [],
          albums: Array.isArray(data.albums) ? data.albums : [],
          createdTime: approvedIso,
          modifiedTime: approvedIso
        };
      }).filter(video => video.youtubeId);
    } catch (err) {
      console.warn('Could not load YouTube videos from Firestore:', err);
      return [];
    }
  }

  function matchesConfiguredGallery(tag) {
    if (!tag) return false;

    if (config.mode === 'person') {
      if (config.albumSlug && !(tag.albums || []).includes(config.albumSlug)) return false;

      const PERSON_ALIAS_MAP = {
        'luis-fernando': ['luis-fernando-astocondor'],
        'fernando-javier': ['fernando-pallete', 'fernando-javier-pallete'],
        'lorenzo-david': ['lorenzo-lu', 'lorenzo-david-lu'],
        'eugenio-jesus': ['eugenio-astocondor', 'eugenio-jesus-astocondor'],
        'ernesto': ['ernesto-herrera'],
        'luisa-cristina': ['luisa-astocondor'],
        'monica-del-carmen': ['monica-astocondor'],
        'paola-andrea': ['paola-pallete'],
        'milagros': ['milagros-herrera'],
        'adriana': ['adriana-astocondor'],
        'alessandra': ['alessandra-briceno'],
        'paola-josefina': ['paola-ranilla'],
        'victor-andres-ranilla': ['victor-ranilla'],
        'maria-eugenia-ranilla': ['maria-ranilla'],
        'shane-ranilla': ['shane-ranilla'],
        'jorge-ranilla': ['jorge-ranilla'],
        'jorge-luis-ranilla': ['jorge-ranilla-cateriano'],
        'sylvia-ines-astocondor': ['sylvia-astocondor'],
        'eugenio-astocondor': ['eugenio-astocondor-salazar'],
        'alyssa-ranilla': ['alyssa-ranilla']
      };
      const STRICT_PERSON_ALIASES = {
        'eugenio-astocondor': ['eugenio-astocondor-salazar']
      };

      const aliases = STRICT_PERSON_ALIASES[config.personSlug]
        ? [...STRICT_PERSON_ALIASES[config.personSlug]]
        : [config.personSlug, ...config.personAliases].filter(Boolean);

      aliases.slice().forEach(alias => {
        (PERSON_ALIAS_MAP[alias] || []).forEach(mappedAlias => {
          if (mappedAlias && !aliases.includes(mappedAlias)) {
            aliases.push(mappedAlias);
          }
        });
      });

      const tagPeople = [
        ...(Array.isArray(tag.people) ? tag.people : []),
        ...(Array.isArray(tag.peopleAliases) ? tag.peopleAliases : []),
        ...(Array.isArray(tag.personIds) ? tag.personIds : [])
      ];

      return aliases.some(alias => tagPeople.includes(alias));
    }

    if (config.mode === 'album') {
      return (tag.albums || []).includes(config.albumSlug);
    }

    return true;
  }

  async function resolveGalleryFiles() {
    const [masterFiles, youtubeVideos] = await Promise.all([
      fetchDriveFolder(config.masterFolderId),
      loadYoutubeVideos()
    ]);

    if (config.mode === 'all') {
      return [...masterFiles, ...youtubeVideos].sort(compareFilesByCreatedTime);
    }

    const tags = await loadApprovedTags();

    const taggedDriveFiles = masterFiles
      .filter(file => {
        const tag = tags.get(file.id);
        return isApprovedTagCurrentForFile(file, tag) && matchesConfiguredGallery(tag);
      })
      .map(file => ({ ...file, tags: tags.get(file.id) }));

    const filteredYoutubeVideos = youtubeVideos.filter(video => matchesConfiguredGallery(video));

    return [...taggedDriveFiles, ...filteredYoutubeVideos].sort(compareFilesByCreatedTime);
  }

  function setLoading(isLoading) {
    const loading = document.getElementById('gallery-loading');
    if (loading) loading.style.display = isLoading ? 'flex' : 'none';
  }

  function showError(message) {
    const error = document.getElementById('gallery-error');
    if (!error) return;

    error.style.display = 'block';
    const text = error.querySelector('p');
    if (text) text.textContent = message;
  }

  function updateCountBadge() {
    const badge = document.getElementById('photo-count');
    if (!badge) return;

    const imgs = allFiles.filter(file => file.type === 'image').length;
    const vids = allFiles.filter(file => file.type === 'video').length;
    let label = `${imgs} photo${imgs !== 1 ? 's' : ''}`;

    if (vids > 0) {
      label += ` · ${vids} video${vids !== 1 ? 's' : ''}`;
    }

    badge.textContent = label;
    badge.style.display = 'inline-block';
  }

  function renderPage(page) {
    currentPage = page;

    const gallery = document.getElementById('gallery');
    const pagination = document.getElementById('gallery-pagination');
    const indicator = document.getElementById('page-indicator');
    const prevBtn = document.getElementById('page-prev');
    const nextBtn = document.getElementById('page-next');

    if (!gallery) return;

    gallery.innerHTML = '';

    const totalPages = Math.ceil(allFiles.length / config.pageSize);
    const start = page * config.pageSize;
    const slice = allFiles.slice(start, start + config.pageSize);

    slice.forEach((file, localIdx) => {
      const globalIdx = start + localIdx;
      const thumb = file.youtubeId
        ? (file.youtubeThumbnail || `https://i.ytimg.com/vi/${encodeURIComponent(file.youtubeId)}/hqdefault.jpg`)
        : driveThumb(file.id, GRID_THUMB_SIZE, file.modifiedTime || file.md5Checksum);
      const item = document.createElement('div');
      item.className = `gallery-item${file.type === 'video' ? ' gallery-item--video' : ''}`;

      if (file.type === 'video') {
        item.innerHTML = `
          <img src="${thumb}" alt="${escapeHtml(config.videoAlt)}" loading="lazy">
          <div class="video-play-btn" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path fill="white" d="M8 5v14l11-7z"/></svg>
          </div>`;
      } else {
        item.innerHTML = `<img src="${thumb}" alt="${escapeHtml(config.photoAlt)}" loading="lazy">`;
      }

      item.addEventListener('click', () => openLightbox(globalIdx));
      gallery.appendChild(item);
    });

    if (pagination && indicator && prevBtn && nextBtn) {
      if (totalPages > 1) {
        pagination.style.display = 'flex';
        indicator.textContent = `Page ${page + 1} of ${totalPages}`;
        prevBtn.disabled = page === 0;
        nextBtn.disabled = page >= totalPages - 1;
      } else {
        pagination.style.display = 'none';
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function changePage(dir) {
    const totalPages = Math.ceil(allFiles.length / config.pageSize);
    const next = currentPage + dir;

    if (next >= 0 && next < totalPages) {
      renderPage(next);
    }
  }

  function initLightbox() {
    if (lightboxReady) return;

    const lb = document.getElementById('lightbox');
    const close = document.getElementById('lightboxClose');
    const next = document.getElementById('lightboxNext');
    const prev = document.getElementById('lightboxPrev');

    if (!lb || !close || !next || !prev) return;

    close.addEventListener('click', closeLightbox);
    next.addEventListener('click', () => shiftLightbox(1));
    prev.addEventListener('click', () => shiftLightbox(-1));
    lb.addEventListener('click', event => {
      if (event.target === lb) closeLightbox();
    });
    document.addEventListener('keydown', event => {
      if (!lb.classList.contains('active')) return;
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowRight') shiftLightbox(1);
      if (event.key === 'ArrowLeft') shiftLightbox(-1);
    });

    lightboxReady = true;
  }

  function openLightbox(globalIdx) {
    lightboxIdx = globalIdx;
    showItem();

    const lb = document.getElementById('lightbox');
    if (!lb) return;

    lb.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function showItem() {
    const file = allFiles[lightboxIdx];
    const img = document.getElementById('lightboxImg');
    const video = document.getElementById('lightboxVideo');
    const counter = document.getElementById('lightboxCounter');

    if (!file || !img || !video || !counter) return;

    counter.textContent = `${lightboxIdx + 1} / ${allFiles.length}`;

    if (file.youtubeId) {
      img.style.display = 'none';
      video.style.display = 'block';
      video.src = `https://www.youtube.com/embed/${encodeURIComponent(file.youtubeId)}?autoplay=1&rel=0`;
      return;
    }

    video.src = '';
    video.style.display = 'none';
    img.style.display = 'block';
    img.src = driveThumb(file.id, LIGHTBOX_THUMB_SIZE, file.modifiedTime || file.md5Checksum);
    img.alt = file.name || config.photoAlt;
  }

  function shiftLightbox(dir) {
    const next = lightboxIdx + dir;

    if (next < 0 || next >= allFiles.length) return;

    lightboxIdx = next;
    showItem();
  }

  function closeLightbox() {
    const lb = document.getElementById('lightbox');
    const video = document.getElementById('lightboxVideo');

    if (lb) lb.classList.remove('active');
    if (video) video.src = '';

    document.body.style.overflow = '';
  }

  async function start(nextConfig) {
    mergeConfig(nextConfig || window.JRFamilyGalleryConfig);
    window.changePage = changePage;
    setLoading(true);

    try {
      allFiles = await resolveGalleryFiles();
      setLoading(false);

      if (allFiles.length === 0) {
        showError(config.emptyText);
        return;
      }

      updateCountBadge();
      renderPage(0);
      initLightbox();
    } catch (error) {
      console.error('Gallery load error:', error);
      setLoading(false);
      showError(config.errorText);
    }
  }

  window.changePage = changePage;
  window.JRFamilyGallery = {
    start,
    changePage
  };
})();
