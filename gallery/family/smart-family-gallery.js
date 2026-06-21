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
    publicTagOptionsEndpoint: 'https://us-central1-jorgeranilla-site.cloudfunctions.net/familyPhotoTagOptions',
    tagSuggestionEndpoint: 'https://us-central1-jorgeranilla-site.cloudfunctions.net/submitFamilyPhotoTagSuggestion',
    suggestionLimitPerBrowserPerDay: 20,
    emptyText: 'No photos yet - check back soon!',
    errorText: "Couldn't load photos right now. Please try refreshing the page.",
    photoAlt: 'Family photo',
    videoAlt: 'Family video',
    fallbackNotice: ''
  };
  const TAG_CONTENT_FIELDS = ['mimeType', 'type', 'md5Checksum', 'size'];
  const GRID_THUMB_SIZE = 600;
  const LIGHTBOX_THUMB_SIZE = 2400;
  const MAX_DIRECT_PAGE_BUTTONS = 10;
  const PAGE_BUTTON_WINDOW = 2;

  let config = {};
  let allFiles = [];
  let currentPage = 0;
  let lightboxIdx = 0;
  let lightboxReady = false;
  let publicTagOptions = [];
  let publicTagOptionsLoaded = false;
  let publicTagOptionsLoading = null;
  let publicTagOptionsError = '';
  let activeSuggestionFile = null;
  let activeSuggestionKeys = new Set();

  function mergeConfig(nextConfig) {
    config = { ...DEFAULTS, ...(nextConfig || {}) };
  }

  function compareFilesByName(a, b) {
    return b.name.localeCompare(a.name, undefined, {
      numeric: true,
      sensitivity: 'base'
    });
  }

  function toGalleryDateMs(year, month, day, hour = 0, minute = 0, second = 0) {
    const y = Number(year);
    const m = Number(month);
    const d = Number(day);
    const h = Number(hour || 0);
    const min = Number(minute || 0);
    const s = Number(second || 0);

    if (!y || m < 1 || m > 12 || d < 1 || d > 31 || h < 0 || h > 23 || min < 0 || min > 59 || s < 0 || s > 59) {
      return 0;
    }

    const ms = Date.UTC(y, m - 1, d, h, min, s);
    const date = new Date(ms);
    if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
      return 0;
    }

    return ms;
  }

  function parseGalleryFilenameDateMs(value) {
    const match = String(value || '').match(/(?:^|[^\d])(\d{4})[.\-_](\d{2})[.\-_](\d{2})(?:[^\d]*(\d{2})[.\-:]?(\d{2}))?/);
    if (!match) return 0;

    return toGalleryDateMs(match[1], match[2], match[3], match[4] || 0, match[5] || 0);
  }

  function parseGalleryMetadataDateMs(value) {
    const raw = String(value || '').trim();
    if (!raw) return 0;

    const exif = raw.match(/^(\d{4})[:.-](\d{2})[:.-](\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
    if (exif) {
      return toGalleryDateMs(exif[1], exif[2], exif[3], exif[4] || 0, exif[5] || 0, exif[6] || 0);
    }

    const parsed = Date.parse(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function getGallerySortMs(file) {
    const curatedNameDate = parseGalleryFilenameDateMs(file.name || file.youtubeTitle || '');
    if (curatedNameDate) return curatedNameDate;

    return parseGalleryMetadataDateMs(file.takenTime) ||
      parseGalleryMetadataDateMs(file.createdTime) ||
      parseGalleryMetadataDateMs(file.modifiedTime) ||
      0;
  }

  function compareFilesByGalleryDate(a, b) {
    const aTime = getGallerySortMs(a);
    const bTime = getGallerySortMs(b);
    if (aTime !== bTime) return bTime - aTime;
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

  function uniqueLabels(values) {
    const seen = new Set();
    const labels = [];

    (values || []).forEach(value => {
      const label = String(value || '').trim();
      const key = label.toLowerCase();
      if (!label || seen.has(key)) return;
      seen.add(key);
      labels.push(label);
    });

    return labels;
  }

  function getApprovedTagLabels(file) {
    const tag = file?.tags || file || {};
    return uniqueLabels([
      ...(Array.isArray(tag.peopleLabels) ? tag.peopleLabels : []),
      ...(Array.isArray(tag.otherPeopleLabels) ? tag.otherPeopleLabels : [])
    ]);
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
        'fields=nextPageToken,files(id,name,mimeType,createdTime,modifiedTime,md5Checksum,size,imageMediaMetadata(time))',
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
        takenTime: file.imageMediaMetadata?.time || '',
        md5Checksum: file.md5Checksum || '',
        size: file.size || ''
      })));

      pageToken = data.nextPageToken || '';
    } while (pageToken);

    return files;
  }

  async function loadApprovedTags() {
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
          peopleLabels: Array.isArray(data.peopleLabels) ? data.peopleLabels : [],
          otherPeopleLabels: Array.isArray(data.otherPeopleLabels) ? data.otherPeopleLabels : [],
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
        const createdIso = data.createdAt?.toDate?.()?.toISOString?.() || '';
        const updatedIso = data.updatedAt?.toDate?.()?.toISOString?.() || '';
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
          peopleLabels: Array.isArray(data.peopleLabels) ? data.peopleLabels : [],
          otherPeopleLabels: Array.isArray(data.otherPeopleLabels) ? data.otherPeopleLabels : [],
          albums: Array.isArray(data.albums) ? data.albums : [],
          createdTime: approvedIso || createdIso || updatedIso,
          modifiedTime: updatedIso || approvedIso || createdIso,
          takenTime: data.takenTime || data.videoDate || ''
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
    const [masterFiles, youtubeVideos, tags] = await Promise.all([
      fetchDriveFolder(config.masterFolderId),
      loadYoutubeVideos(),
      loadApprovedTags()
    ]);

    const masterFilesWithTags = masterFiles.map(file => {
      const tag = tags.get(file.id);
      return isApprovedTagCurrentForFile(file, tag) ? { ...file, tags: tag } : file;
    });

    if (config.mode === 'all') {
      return [...masterFilesWithTags, ...youtubeVideos].sort(compareFilesByGalleryDate);
    }

    const taggedDriveFiles = masterFilesWithTags
      .filter(file => file.tags && matchesConfiguredGallery(file.tags));

    const filteredYoutubeVideos = youtubeVideos.filter(video => matchesConfiguredGallery(video));

    return [...taggedDriveFiles, ...filteredYoutubeVideos].sort(compareFilesByGalleryDate);
  }

  function getSuggestionDayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function makeBrowserSuggestionId() {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID().replace(/[^a-zA-Z0-9_-]/g, '');
    }

    const bytes = new Uint8Array(18);
    if (window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(bytes);
      return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 18)}`;
  }

  function readSuggestionUsage() {
    const key = 'jrFamilyTagSuggestions:v1';
    const day = getSuggestionDayKey();
    let usage = {};

    try {
      usage = JSON.parse(window.localStorage?.getItem(key) || '{}') || {};
    } catch (error) {
      usage = {};
    }

    if (!usage.browserId) usage.browserId = makeBrowserSuggestionId();
    if (usage.day !== day) {
      usage.day = day;
      usage.count = 0;
    }

    usage.count = Math.max(0, Number(usage.count || 0));

    try {
      window.localStorage?.setItem(key, JSON.stringify(usage));
    } catch (error) {}

    return usage;
  }

  function writeSuggestionUsage(usage) {
    try {
      window.localStorage?.setItem('jrFamilyTagSuggestions:v1', JSON.stringify(usage));
    } catch (error) {}
  }

  function getSuggestionRemaining() {
    const usage = readSuggestionUsage();
    return Math.max(0, Number(config.suggestionLimitPerBrowserPerDay || 20) - usage.count);
  }

  function recordSuggestionSubmission(remaining) {
    const usage = readSuggestionUsage();
    const limit = Number(config.suggestionLimitPerBrowserPerDay || 20);

    if (Number.isFinite(Number(remaining))) {
      usage.count = Math.max(0, limit - Number(remaining));
    } else {
      usage.count = Math.min(limit, usage.count + 1);
    }

    writeSuggestionUsage(usage);
  }

  async function loadPublicTagOptions() {
    if (publicTagOptionsLoaded) return publicTagOptions;
    if (publicTagOptionsLoading) return publicTagOptionsLoading;

    publicTagOptionsError = '';
    publicTagOptionsLoading = fetch(config.publicTagOptionsEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Could not load the family tag list.');
        publicTagOptions = Array.isArray(data.options) ? data.options : [];
        if (data.limitPerBrowserPerDay) config.suggestionLimitPerBrowserPerDay = data.limitPerBrowserPerDay;
        publicTagOptionsLoaded = true;
        return publicTagOptions;
      })
      .catch(error => {
        publicTagOptionsError = error.message || 'Could not load the family name list.';
        publicTagOptions = [];
        throw error;
      })
      .finally(() => {
        publicTagOptionsLoading = null;
      });

    return publicTagOptionsLoading;
  }

  function ensureSuggestionModal() {
    let modal = document.getElementById('tagSuggestionModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'tagSuggestionModal';
    modal.className = 'tag-suggest-modal';
    modal.innerHTML = `
      <div class="tag-suggest-dialog" role="dialog" aria-modal="true" aria-labelledby="tagSuggestTitle">
        <div class="tag-suggest-header">
          <h3 id="tagSuggestTitle">Who\'s in this photo?</h3>
          <button type="button" class="tag-suggest-close" id="tagSuggestClose" aria-label="Close">&times;</button>
        </div>
        <div class="tag-suggest-search-wrap">
          <svg class="tag-suggest-search-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <input type="text" id="tagSuggestSearch" autocomplete="off" placeholder="Type a name to search...">
        </div>
        <div class="tag-suggest-results" id="tagSuggestResults" style="display:none"></div>
        <div class="tag-suggest-selected" id="tagSuggestSelected"></div>
        <details class="tag-suggest-other-wrap">
          <summary>Name not in the directory?</summary>
          <textarea id="tagSuggestOther" rows="2" placeholder="Add free-text names here, separated by commas."></textarea>
        </details>
        <div class="tag-suggest-footer">
          <p class="tag-suggest-limit" id="tagSuggestLimit"></p>
          <p class="tag-suggest-message" id="tagSuggestMessage" role="status"></p>
          <div class="tag-suggest-actions">
            <button type="button" class="tag-suggest-secondary" id="tagSuggestCancel">Cancel</button>
            <button type="button" class="tag-suggest-submit" id="tagSuggestSubmit">Submit</button>
          </div>
        </div>
      </div>`;

    document.body.appendChild(modal);
    modal.addEventListener('click', event => {
      if (event.target === modal) closeSuggestionModal();
    });
    modal.querySelector('#tagSuggestClose').addEventListener('click', closeSuggestionModal);
    modal.querySelector('#tagSuggestCancel').addEventListener('click', closeSuggestionModal);
    modal.querySelector('#tagSuggestSubmit').addEventListener('click', submitTagSuggestion);
    modal.querySelector('#tagSuggestSearch').addEventListener('input', renderSuggestionOptions);

    return modal;
  }

  function setSuggestionMessage(message, isError = false) {
    const messageEl = document.getElementById('tagSuggestMessage');
    if (!messageEl) return;
    messageEl.textContent = message || '';
    messageEl.classList.toggle('is-error', Boolean(isError));
  }

  function updateSuggestionLimitText() {
    const limitEl = document.getElementById('tagSuggestLimit');
    const submit = document.getElementById('tagSuggestSubmit');
    if (!limitEl || !submit) return;

    const remaining = getSuggestionRemaining();
    limitEl.textContent = `${remaining} suggestion${remaining === 1 ? '' : 's'} left from this browser today.`;
    submit.disabled = remaining <= 0;
  }

  function renderSuggestionOptions() {
    const results = document.getElementById('tagSuggestResults');
    const search = document.getElementById('tagSuggestSearch');
    if (!results || !search) return;

    const term = search.value.trim().toLowerCase();

    // Only show results when user has typed something
    if (!term) {
      results.innerHTML = '';
      results.style.display = 'none';
      return;
    }

    results.style.display = 'grid';

    const matches = publicTagOptions
      .filter(option => !activeSuggestionKeys.has(option.tagKey))
      .filter(option => String(option.tagLabel || '').toLowerCase().includes(term))
      .slice(0, 6);

    if (matches.length === 0) {
      const emptyText = publicTagOptionsError || 'No matching names.';
      results.innerHTML = `<p class="tag-suggest-empty">${escapeHtml(emptyText)}</p>`;
      return;
    }

    results.innerHTML = matches.map(option => `
      <button type="button" class="tag-suggest-option" data-tag-key="${escapeHtml(option.tagKey)}">
        ${escapeHtml(option.tagLabel)}
      </button>
    `).join('');

    results.querySelectorAll('.tag-suggest-option').forEach(button => {
      button.addEventListener('click', () => {
        activeSuggestionKeys.add(button.dataset.tagKey);
        search.value = '';
        renderSelectedSuggestionPeople();
        renderSuggestionOptions();
      });
    });
  }

  function renderSelectedSuggestionPeople() {
    const selected = document.getElementById('tagSuggestSelected');
    if (!selected) return;

    const items = Array.from(activeSuggestionKeys)
      .map(key => publicTagOptions.find(option => option.tagKey === key))
      .filter(Boolean);

    if (items.length === 0) {
      selected.innerHTML = '';
      return;
    }

    selected.innerHTML = items.map(option => `
      <button type="button" class="tag-suggest-chip" data-tag-key="${escapeHtml(option.tagKey)}">
        ${escapeHtml(option.tagLabel)} <span aria-hidden="true">&times;</span>
      </button>
    `).join('');

    selected.querySelectorAll('.tag-suggest-chip').forEach(button => {
      button.addEventListener('click', () => {
        activeSuggestionKeys.delete(button.dataset.tagKey);
        renderSelectedSuggestionPeople();
        renderSuggestionOptions();
      });
    });
  }

  function parseOtherSuggestionNames(value) {
    return uniqueLabels(String(value || '')
      .split(/[,\n]/)
      .map(name => name.trim())
      .filter(Boolean))
      .slice(0, 10);
  }

  function renderApprovedTagsInModal(file) {
    // No longer shown in modal — tags are shown in the lightbox tag bar instead
  }

  function closeSuggestionModal() {
    const modal = document.getElementById('tagSuggestionModal');
    if (modal) modal.classList.remove('active');
    activeSuggestionFile = null;
    activeSuggestionKeys = new Set();
  }

  async function openSuggestionModal(file) {
    activeSuggestionFile = file;
    activeSuggestionKeys = new Set();
    const modal = ensureSuggestionModal();
    const search = modal.querySelector('#tagSuggestSearch');
    const other = modal.querySelector('#tagSuggestOther');
    const results = modal.querySelector('#tagSuggestResults');
    if (search) search.value = '';
    if (other) other.value = '';
    if (results) { results.innerHTML = ''; results.style.display = 'none'; }

    renderSelectedSuggestionPeople();
    updateSuggestionLimitText();
    setSuggestionMessage('');
    modal.classList.add('active');

    // Focus the search input after a short delay for mobile
    setTimeout(() => search && search.focus(), 80);

    // Preload tag options in background (no loading message cluttering UI)
    loadPublicTagOptions().catch(() => {});
  }

  function buildSuggestionTarget(file) {
    return {
      id: file.id,
      type: file.type === 'video' ? 'video' : 'image',
      source: file.youtubeId ? 'youtube' : 'drive',
      name: file.name || file.youtubeTitle || '',
      youtubeId: file.youtubeId || '',
      albumSlug: config.albumSlug || '',
      galleryMode: config.mode || 'all',
      pageUrl: window.location.href.split('#')[0]
    };
  }

  async function submitTagSuggestion() {
    const submit = document.getElementById('tagSuggestSubmit');
    const other = document.getElementById('tagSuggestOther');
    if (!activeSuggestionFile || !submit) return;

    if (getSuggestionRemaining() <= 0) {
      setSuggestionMessage('This browser has reached today\'s suggestion limit.', true);
      return;
    }

    const selectedPeople = Array.from(activeSuggestionKeys)
      .map(key => publicTagOptions.find(option => option.tagKey === key))
      .filter(Boolean)
      .map(option => ({
        tagKey: option.tagKey,
        tagLabel: option.tagLabel,
        personSlug: option.personSlug,
        personId: option.personId || option.id
      }));
    const otherNames = parseOtherSuggestionNames(other?.value || '');

    if (selectedPeople.length === 0 && otherNames.length === 0) {
      setSuggestionMessage('Choose a family name or add an Other name before submitting.', true);
      return;
    }

    const usage = readSuggestionUsage();
    submit.disabled = true;
    submit.textContent = 'Submitting...';
    setSuggestionMessage('');

    try {
      const response = await fetch(config.tagSuggestionEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          browserId: usage.browserId,
          target: buildSuggestionTarget(activeSuggestionFile),
          selectedPeople,
          otherNames
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not submit this suggestion.');

      recordSuggestionSubmission(data.remaining);
      activeSuggestionKeys = new Set();
      if (other) other.value = '';
      renderSelectedSuggestionPeople();
      renderSuggestionOptions();
      updateSuggestionLimitText();
      setSuggestionMessage('Thank you. Your tag suggestion was sent for review and will appear only if approved by the family admin.');
    } catch (error) {
      setSuggestionMessage(error.message || 'Could not submit this suggestion.', true);
    } finally {
      submit.textContent = 'Submit Suggestion';
      submit.disabled = getSuggestionRemaining() <= 0;
    }
  }

  function ensureLightboxTagBar() {
    const lb = document.getElementById('lightbox');
    if (!lb) return null;

    let bar = document.getElementById('lightboxTagBar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'lightboxTagBar';
      bar.className = 'lightbox-tag-bar';
      bar.innerHTML = `
        <div class="lightbox-tag-names" id="lightboxTagNames"></div>
        <button type="button" class="lightbox-suggest-btn" id="lightboxSuggestTags">
          <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14l4-4h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm4 8H8v-.57c0-1.33 2.67-2 4-2s4 .67 4 2V14z"/></svg>
          Suggest tags
        </button>`;
      lb.appendChild(bar);

      bar.querySelector('#lightboxSuggestTags').addEventListener('click', event => {
        event.stopPropagation();
        if (activeSuggestionFile) openSuggestionModal(activeSuggestionFile);
      });
    }

    return bar;
  }

  function renderLightboxSuggestControl(file) {
    activeSuggestionFile = file;
    const bar = ensureLightboxTagBar();
    if (!bar) return;

    const namesEl = bar.querySelector('#lightboxTagNames');
    if (!namesEl) return;

    const labels = getApprovedTagLabels(file);
    if (labels.length) {
      namesEl.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
        ${labels.map(l => `<span>${escapeHtml(l)}</span>`).join('')}`;
      namesEl.style.display = 'flex';
    } else {
      namesEl.innerHTML = '';
      namesEl.style.display = 'none';
    }
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

  function getPaginationItems(currentPageIndex, totalPages) {
    if (totalPages <= MAX_DIRECT_PAGE_BUTTONS) {
      return Array.from({ length: totalPages }, (_, index) => index);
    }

    const pages = new Set([0, totalPages - 1]);
    const start = Math.max(1, currentPageIndex - PAGE_BUTTON_WINDOW);
    const end = Math.min(totalPages - 2, currentPageIndex + PAGE_BUTTON_WINDOW);

    for (let index = start; index <= end; index += 1) {
      pages.add(index);
    }

    if (currentPageIndex <= PAGE_BUTTON_WINDOW + 2) {
      for (let index = 1; index <= Math.min(totalPages - 2, MAX_DIRECT_PAGE_BUTTONS - 2); index += 1) {
        pages.add(index);
      }
    }

    if (currentPageIndex >= totalPages - PAGE_BUTTON_WINDOW - 3) {
      for (let index = Math.max(1, totalPages - MAX_DIRECT_PAGE_BUTTONS + 1); index < totalPages - 1; index += 1) {
        pages.add(index);
      }
    }

    const sorted = Array.from(pages).sort((a, b) => a - b);
    const items = [];

    sorted.forEach((pageIndex, index) => {
      if (index > 0 && pageIndex - sorted[index - 1] > 1) {
        items.push('ellipsis');
      }
      items.push(pageIndex);
    });

    return items;
  }

  function ensurePageNumbersContainer(pagination, nextBtn) {
    let pageNumbers = document.getElementById('page-numbers');
    if (!pageNumbers) {
      pageNumbers = document.createElement('div');
      pageNumbers.id = 'page-numbers';
      pageNumbers.className = 'page-numbers';
      pagination.insertBefore(pageNumbers, nextBtn);
    }
    return pageNumbers;
  }

  function renderPageNumbers(page, totalPages, pagination, nextBtn) {
    const pageNumbers = ensurePageNumbersContainer(pagination, nextBtn);
    pageNumbers.innerHTML = '';

    getPaginationItems(page, totalPages).forEach(item => {
      if (item === 'ellipsis') {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'page-ellipsis';
        ellipsis.textContent = '...';
        pageNumbers.appendChild(ellipsis);
        return;
      }

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'page-number-btn';
      button.textContent = String(item + 1);
      button.disabled = item === page;
      if (item === page) button.setAttribute('aria-current', 'page');
      button.addEventListener('click', () => renderPage(item));
      pageNumbers.appendChild(button);
    });
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
      prevBtn.innerHTML = '&lsaquo;';
      nextBtn.innerHTML = '&rsaquo;';
      prevBtn.setAttribute('aria-label', 'Previous page');
      nextBtn.setAttribute('aria-label', 'Next page');
      prevBtn.title = 'Previous page';
      nextBtn.title = 'Next page';

      if (totalPages > 1) {
        pagination.style.display = 'flex';
        indicator.textContent = `${page + 1} / ${totalPages}`;
        renderPageNumbers(page, totalPages, pagination, nextBtn);
        prevBtn.disabled = page === 0;
        nextBtn.disabled = page >= totalPages - 1;
      } else {
        pagination.style.display = 'none';
        const pageNumbers = document.getElementById('page-numbers');
        if (pageNumbers) pageNumbers.innerHTML = '';
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
      renderLightboxSuggestControl(file);
      return;
    }

    video.src = '';
    video.style.display = 'none';
    img.style.display = 'block';
    img.src = driveThumb(file.id, LIGHTBOX_THUMB_SIZE, file.modifiedTime || file.md5Checksum);
    img.alt = file.name || config.photoAlt;
    renderLightboxSuggestControl(file);
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
