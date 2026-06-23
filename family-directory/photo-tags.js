const PHOTO_TAGS_DRIVE_API_KEY = 'AIzaSyCadJTGnwhASQ-kj7p4AnGFAwXIIFChoSs';
const PHOTO_TAGS_FAMILY_FOLDER_ID = '10ee3xB70t7S0cxqgEFoRQ9eMy4BIVjpJ';
const PHOTO_TAGS_PEOPLE_FOLDER_ID = '1cGKKik8MCXTWG6Ulc3z3rXIFwVSXcb8K';
const PHOTO_TAGS_SOURCES = {
  family: {
    label: 'Family',
    folderLabel: 'Family folder',
    albumSlug: 'family',
    folderId: PHOTO_TAGS_FAMILY_FOLDER_ID,
    includeDirectoryMembers: true,
    profiles: []
  },
  people: {
    label: 'People',
    folderLabel: 'People folder',
    albumSlug: 'people',
    folderId: PHOTO_TAGS_PEOPLE_FOLDER_ID,
    includeDirectoryMembers: false,
    profiles: [
      {
        id: 'patricia-malca',
        name: 'Patricia Malca',
        slug: 'patricia-malca',
        aliases: ['patty']
      },
      {
        id: 'lucia-mendez',
        name: 'Lucia Mendez',
        slug: 'lucia-mendez',
        aliases: ['lucy']
      }
    ]
  }
};
const PHOTO_TAGS_COLLECTION = 'familyPhotoTags';
const PHOTO_TAG_SUGGESTIONS_COLLECTION = 'familyPhotoTagSuggestions';
const FAMILY_DIRECTORY_COLLECTION = 'familyDirectory';
const PHOTO_TAGS_DRIVE_PAGE_SIZE = 200;
const PHOTO_TAGS_REQUEST_TIMEOUT_MS = 30000;
const PHOTO_TAGS_CONVERT_ENDPOINT = 'https://us-central1-jorgeranilla-site.cloudfunctions.net/convertFamilyPhotoUpload';
const PHOTO_TAGS_IMAGE_REPLACE_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,image/dng,image/x-adobe-dng,image/tiff,.jpg,.jpeg,.png,.webp,.heic,.heif,.dng,.tif,.tiff';
const PHOTO_TAGS_MAX_REPLACE_UPLOAD_BYTES = 31 * 1024 * 1024;
const PHOTO_TAGS_REPLACE_REVIEW_REASON = 'Photo file was replaced from the tag panel. Review and approve the existing tags.';
const PHOTO_TAGS_DRAFT_STORAGE_KEY = 'photoTagDrafts:v1';
const PHOTO_TAGS_NEAR_DUPLICATE_TIME_MS = 2 * 60 * 1000;
const PHOTO_TAGS_NEAR_DUPLICATE_SIZE_BYTES = 250 * 1024;
const PHOTO_TAGS_NEAR_DUPLICATE_SIZE_RATIO = 0.03;
const PHOTO_TAGS_CONTENT_FIELDS = ['mimeType', 'type', 'md5Checksum', 'size'];
const PHOTO_TAGS_STANDARD_NAME_RE = /^(\d{4})\.(\d{2})\.(\d{2})_(\d{4})(\.[a-z0-9]+)$/i;
const PHOTO_TAGS_STATUS_LABELS = {
  approved: 'Approved',
  pending: 'Pending',
  draft: 'Draft',
  'needs-review': 'Needs Retag',
  untagged: 'Untagged'
};
const PHOTO_TAGS_FILTER_LABELS = {
  all: 'All',
  untagged: 'Untagged',
  tagged: 'Tagged',
  approved: 'Approved',
  'needs-review': 'Needs Retag',
  draft: 'Drafts',
  'needs-rename': 'Needs Rename',
  duplicates: 'Duplicates',
  suggestions: 'Suggestions'
};
const PHOTO_TAG_CANONICAL_SLUGS = {
  "luis-fernando": "luis-fernando-astocondor",
  "fernando-javier": "fernando-pallete",
  "lorenzo-david": "lorenzo-lu",
  "eugenio-jesus": "eugenio-astocondor",
  "eugenio-augusto": "eugenio-astocondor-salazar-lopez",
  "eugenio-augusto-astocondor": "eugenio-astocondor-salazar-lopez",
  "ernesto": "ernesto-herrera",
  "luisa-cristina": "luisa-astocondor",
  "monica-del-carmen": "monica-astocondor",
  "paola-andrea": "paola-pallete",
  "paola-andres": "paola-pallete",
  "milagros": "milagros-herrera",
  "adriana": "adriana-astocondor",
  "alessandra": "alessandra-briceno",
  "paola-josefina": "paola-ranilla",
  "victor-andres": "victor-ranilla",
  "victor-andres-ranilla": "victor-ranilla",
  "maria-eugenia": "maria-ranilla",
  "maria-eugenia-ranilla": "maria-ranilla",
  "maria-alcira": "alcira-astocondor-salazar-lopez",
  "maria-alcira-del-carmen-astocondor": "alcira-astocondor-salazar-lopez",
  "maria-carlota": "carlota-ruiz-guevara",
  "maria-carlota-ruiz": "carlota-ruiz-guevara",
  "maria-carlota-astocondor": "carlota-astocondor-salazar-lopez",
  "maria-carlota-astocondor-salazar-lopez": "carlota-astocondor-salazar-lopez",
  "maria-jesus-cateriano": "maria-jesus-cateriano-dongo",
  "shane": "shane-ranilla",
  "jorge": "jorge-ranilla",
  "jorge-luis": "jorge-ranilla-cateriano",
  "jorge-luis-ranilla": "jorge-ranilla-cateriano",
  "jorge-gelasio": "jorge-astocondor",
  "jorge-astocondor-fuertes": "jorge-astocondor",
  "sylvia": "sylvia-astocondor-salazar-lopez",
  "sylvia-ines": "sylvia-astocondor-salazar-lopez",
  "sylvia-ines-astocondor": "sylvia-astocondor-salazar-lopez",
  "sylvia-astocondor-salazar": "sylvia-astocondor-salazar-lopez",
  "alyssa": "alyssa-ranilla",
  "carolina": "carolina-ranilla",
  "fatima": "fatima-astocondor",
  "fatima-celeste": "fatima-astocondor",
  "fernando-jose": "fernando-astocondor",
  "gabriel": "gabriel-astocondor",
  "hector": "hector-briceno",
  "janet": "janet-ranilla-cateriano",
  "janet-cecilia": "janet-ranilla-cateriano",
  "oscar-alberto": "oscar-ranilla-cateriano",
  "raul-sergio-victor": "raul-ranilla-cateriano",
  "sebastian": "sebastian-astocondor",
  "sebastian-martin": "sebastian-astocondor",
  "alcira-isabel": "alcira-astocondor",
  "patty": "patricia-malca",
  "lucy": "lucia-mendez",
  'maria-carlota-ruiz-guevara': 'carlota-ruiz-guevara',
  'maria-alcira-del-carmen': 'alcira-astocondor-salazar-lopez',
  'luis-fernando-astocondor-salazar-lopez': 'fernando-astocondor-salazar-lopez'
};

function getInitialPhotoTagSource() {
  const source = new URLSearchParams(window.location.search).get('source') || 'family';
  return PHOTO_TAGS_SOURCES[source] ? source : 'family';
}

let photoTagSource = getInitialPhotoTagSource();
let photoTagMembers = [];
let photoTagFiles = [];
let photoTagRecords = new Map();
let photoTagSuggestions = [];
let photoTagFilter = 'all';
let photoTagSearch = '';
let photoTagSelected = new Set();
let photoTagDrafts = loadPhotoTagDrafts();
let photoTagDuplicateCache = null;
let photoTagBindingsReady = false;
let photoTagLoadRun = 0;

function updatePhotoTagLoading(message) {
  const loading = document.getElementById('fd-photo-tags-loading');
  const summary = document.getElementById('fd-photo-tag-summary');
  const label = loading?.querySelector('span');

  if (label) label.textContent = message;
  if (summary) summary.textContent = message;
}

function formatPhotoTagLoadError(error) {
  if (error?.name === 'AbortError') {
    return 'The Drive request took too long. Refresh the page and try again.';
  }

  return error?.message || 'Could not load photos or tags right now.';
}

function showPhotoTagLoadError(error) {
  const message = formatPhotoTagLoadError(error);
  const loading = document.getElementById('fd-photo-tags-loading');
  const summary = document.getElementById('fd-photo-tag-summary');
  const grid = document.getElementById('fd-photo-tag-grid');
  const empty = document.getElementById('fd-photo-tags-empty');

  if (loading) loading.style.display = 'none';
  if (summary) summary.textContent = message;
  if (grid) {
    grid.innerHTML = '<button type="button" class="fd-mini-btn secondary" style="max-width:180px;margin:0 auto" onclick="reloadPhotoTagData(true)">Retry loading</button>';
  }
  if (empty) {
    empty.style.display = 'block';
    const emptyText = empty.querySelector('p');
    if (emptyText) emptyText.textContent = message;
  }
}

function withPhotoTagTimeout(promise, message, timeoutMs = PHOTO_TAGS_REQUEST_TIMEOUT_MS) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
function loadPhotoTagDrafts() {
  try {
    const raw = window.sessionStorage?.getItem(PHOTO_TAGS_DRAFT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return new Map(Object.entries(parsed).filter(([, value]) => Array.isArray(value)));
  } catch (error) {
    console.warn('Could not load photo tag drafts:', error);
    return new Map();
  }
}

function persistPhotoTagDrafts() {
  try {
    const data = Object.fromEntries(photoTagDrafts.entries());
    window.sessionStorage?.setItem(PHOTO_TAGS_DRAFT_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Could not save photo tag drafts:', error);
  }
}

async function fetchPhotoTagJson(url, timeoutMessage) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PHOTO_TAGS_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    let data = {};

    try {
      data = await response.json();
    } catch (error) {
      if (response.ok) throw error;
    }

    return { response, data };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(timeoutMessage || 'The request took too long.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function showPhotoTagStartupError(error) {
  clearPhotoTagsStartupTimer();
  console.error('Photo tag startup error:', error);
  const detail = error?.message || 'Refresh the page and try again.';

  if (typeof window.fdShowLoadError === 'function') {
    window.fdShowLoadError('Could not start photo tags.', detail);
    return;
  }

  const loading = document.getElementById('fd-loading');
  if (!loading) return;

  loading.style.display = 'flex';
  loading.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'fd-auth-card';

  const title = document.createElement('h1');
  title.className = 'fd-auth-title';
  title.textContent = 'Could not start photo tags.';

  const body = document.createElement('p');
  body.className = 'fd-auth-sub';
  body.textContent = detail;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'fd-google-btn';
  button.textContent = 'Refresh Page';
  button.addEventListener('click', () => window.location.reload());

  card.append(title, body, button);
  loading.appendChild(card);
}

function clearPhotoTagsStartupTimer() {
  if (window.fdPhotoTagsStartupTimer) {
    clearTimeout(window.fdPhotoTagsStartupTimer);
    window.fdPhotoTagsStartupTimer = null;
  }
}

function getPhotoTagSourceConfig(source = photoTagSource) {
  return PHOTO_TAGS_SOURCES[source] || PHOTO_TAGS_SOURCES.family;
}

function getPhotoTagFolderId() {
  return getPhotoTagSourceConfig().folderId;
}

function getPhotoTagAlbumSlug() {
  return getPhotoTagSourceConfig().albumSlug;
}

function getPhotoTagFolderLabel() {
  return getPhotoTagSourceConfig().folderLabel;
}

function getPhotoTagSourceLabel() {
  return getPhotoTagSourceConfig().label;
}

function getPhotoTagYoutubeDocId(videoId) {
  const album = getPhotoTagAlbumSlug();
  return album === 'family' ? `yt_${videoId}` : `yt_${album}_${videoId}`;
}

function isPhotoTagCurrentAlbum(tag) {
  const albums = Array.isArray(tag?.albums) ? tag.albums : ['family'];
  return albums.includes(getPhotoTagAlbumSlug());
}

function onPageReady() {
  clearPhotoTagsStartupTimer();

  if (!window.isAdmin) {
    const restricted = document.getElementById('fd-photo-tags-restricted');
    const admin = document.getElementById('fd-photo-tags-admin');
    if (restricted) restricted.style.display = 'block';
    if (admin) admin.style.display = 'none';
    return;
  }

  const admin = document.getElementById('fd-photo-tags-admin');
  if (admin) admin.style.display = 'block';

  initPhotoTagger().catch(showPhotoTagStartupError);
}

async function initPhotoTagger() {
  if (!photoTagBindingsReady) {
    bindPhotoTagSources();
    bindPhotoTagFilters();
    bindPhotoTagSearch();
    photoTagBindingsReady = true;
  }

  updatePhotoTagSourceControls();
  await reloadPhotoTagData(true);
}

async function reloadPhotoTagData(loadRecords = false) {
  const loadRun = ++photoTagLoadRun;
  const shouldLoadRecords = loadRecords || !(photoTagRecords instanceof Map) || photoTagRecords.size === 0;

  photoTagDuplicateCache = null;
  updatePhotoTagLoading(`Loading ${getPhotoTagFolderLabel()} photos...`);

  const loading = document.getElementById('fd-photo-tags-loading');
  const grid = document.getElementById('fd-photo-tag-grid');
  const empty = document.getElementById('fd-photo-tags-empty');
  if (loading) loading.style.display = 'flex';
  if (grid) grid.innerHTML = '';
  if (empty) empty.style.display = 'none';

  try {
    const [members, records, files] = await Promise.all([
      withPhotoTagTimeout(loadPhotoTagMembers(), `Loading ${getPhotoTagSourceLabel()} tag list took too long.`),
      shouldLoadRecords ? withPhotoTagTimeout(loadPhotoTagRecords(), 'Loading saved photo tags took too long.') : Promise.resolve(photoTagRecords),
      withPhotoTagTimeout(loadPhotoTagFiles(), `Loading ${getPhotoTagFolderLabel()} photos took too long.`, 120000)
    ]);

    if (loadRun !== photoTagLoadRun) return;

    photoTagMembers = members;
    photoTagRecords = records instanceof Map ? records : new Map();
    photoTagFiles = files;

    updatePhotoTagLoading('Preparing photo tags...');
    reconcilePhotoTagFilesWithSavedNames();

    renderPhotoTags();

    if (shouldLoadRecords) {
      loadPhotoTagSuggestionsInBackground(loadRun);
    }
  } catch (error) {
    if (loadRun !== photoTagLoadRun) return;
    console.error('Photo tag load error:', error);
    showPhotoTagLoadError(error);
  }
}

async function loadPhotoTagSuggestionsInBackground(loadRun) {
  try {
    const suggestions = await withPhotoTagTimeout(
      loadPhotoTagSuggestions(),
      'Loading public tag suggestions took too long.'
    );

    if (loadRun !== photoTagLoadRun) return;
    photoTagSuggestions = suggestions;
    renderPhotoTags();
  } catch (error) {
    if (loadRun !== photoTagLoadRun) return;
    console.warn('Photo tag suggestions load warning:', error);
    photoTagSuggestions = [];
    renderPhotoTags();
  }
}

function bindPhotoTagSources() {
  document.querySelectorAll('[data-photo-source]').forEach(button => {
    button.addEventListener('click', () => switchPhotoTagSource(button.dataset.photoSource || 'family'));
  });
}

function updatePhotoTagSourceControls() {
  document.querySelectorAll('[data-photo-source]').forEach(button => {
    button.classList.toggle('active', button.dataset.photoSource === photoTagSource);
  });

  const subtitle = document.getElementById('fd-photo-tags-subtitle');
  if (subtitle) {
    subtitle.textContent = `Assign ${getPhotoTagFolderLabel()} photos to the people who appear in them`;
  }
}

async function switchPhotoTagSource(source) {
  if (!PHOTO_TAGS_SOURCES[source] || source === photoTagSource) return;

  photoTagSource = source;
  photoTagSelected.clear();
  photoTagFilter = 'all';
  photoTagSearch = '';

  const input = document.getElementById('fd-photo-search');
  if (input) input.value = '';

  document.querySelectorAll('.fd-filter-pill[data-filter]').forEach(button => {
    button.classList.toggle('active', button.dataset.filter === 'all');
  });

  const url = new URL(window.location.href);
  if (source === 'family') {
    url.searchParams.delete('source');
  } else {
    url.searchParams.set('source', source);
  }
  window.history.replaceState({}, '', url);

  updatePhotoTagSourceControls();
  await reloadPhotoTagData(false);
}
function bindPhotoTagFilters() {
  document.querySelectorAll('.fd-filter-pill[data-filter]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.fd-filter-pill[data-filter]').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      photoTagFilter = button.dataset.filter || 'all';
      renderPhotoTags();
    });
  });
}

function bindPhotoTagSearch() {
  const input = document.getElementById('fd-photo-search');
  if (!input) return;

  input.addEventListener('input', () => {
    photoTagSearch = input.value.trim().toLowerCase();
    renderPhotoTags();
  });
}

async function loadPhotoTagMembers() {
  const config = getPhotoTagSourceConfig();
  const tagMembers = [];

  if (config.includeDirectoryMembers) {
    const members = await fetchAllMembers();
    tagMembers.push(...members
      .filter(member => member.status === 'approved' && member.status !== 'claimed')
      .map(normalizeDirectoryMemberForPhotoTag)
      .filter(Boolean));
  }

  tagMembers.push(...(config.profiles || []).map(profile => {
    const rawPersonSlug = makePhotoTagSlug(profile.slug || profile.name || profile.id);
    const personSlug = canonicalPhotoTagSlug(rawPersonSlug);
    const alternatePersonSlugs = (profile.aliases || [])
      .map(alias => canonicalPhotoTagSlug(alias))
      .filter(alias => alias && alias !== personSlug);

    return {
      id: profile.id || personSlug,
      status: 'approved',
      displayName: profile.name,
      rawPersonSlug,
      personSlug,
      alternatePersonSlugs,
      tagKey: `people:${personSlug}`,
      tagLabel: profile.name,
      displayTagLabel: profile.name,
      source: 'people'
    };
  }));

  return disambiguateDuplicateMemberLabels(tagMembers
    .filter(member => member.tagKey && member.personSlug)
    .sort((a, b) => a.tagLabel.localeCompare(b.tagLabel, undefined, { sensitivity: 'base' })));
}
async function loadPhotoTagRecords() {
  const { collection, getDocs } = window._fb;
  const snapshot = await getDocs(collection(window._fb.db, PHOTO_TAGS_COLLECTION));
  const records = new Map();

  snapshot.docs.forEach(docSnap => {
    const data = docSnap.data() || {};
    records.set(docSnap.id, normalizePhotoTagRecord(docSnap.id, data));
  });

  return records;
}

function normalizePhotoTagSuggestion(docSnap) {
  const data = docSnap.data() || {};
  const target = data.target && typeof data.target === 'object' ? data.target : {};
  return {
    id: docSnap.id,
    ...data,
    target,
    selectedPeople: Array.isArray(data.selectedPeople) ? data.selectedPeople : [],
    peopleKeys: Array.isArray(data.peopleKeys) ? data.peopleKeys : [],
    peopleLabels: Array.isArray(data.peopleLabels) ? data.peopleLabels : [],
    otherNames: Array.isArray(data.otherNames) ? data.otherNames : []
  };
}

async function loadPhotoTagSuggestions() {
  const { collection, getDocs, query, where } = window._fb;
  const q = query(
    collection(window._fb.db, PHOTO_TAG_SUGGESTIONS_COLLECTION),
    where('status', '==', 'pending')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(normalizePhotoTagSuggestion);
}

async function loadPhotoTagFiles() {
  const files = [];
  let pageToken = '';
  let page = 0;

  updatePhotoTagLoading(`Loading ${getPhotoTagFolderLabel()} photos...`);

  do {
    page += 1;
    const q = encodeURIComponent(
      `'${getPhotoTagFolderId()}' in parents and ` +
      `mimeType contains 'image/' and ` +
      `trashed = false`
    );
    const params = [
      `q=${q}`,
      `key=${encodeURIComponent(PHOTO_TAGS_DRIVE_API_KEY)}`,
      'fields=nextPageToken,files(id,name,mimeType,createdTime,modifiedTime,md5Checksum,size,imageMediaMetadata(time))',
      'orderBy=createdTime desc',
      `pageSize=${PHOTO_TAGS_DRIVE_PAGE_SIZE}`
    ];

    if (pageToken) {
      params.push(`pageToken=${encodeURIComponent(pageToken)}`);
    }

    updatePhotoTagLoading(`Loading ${getPhotoTagFolderLabel()} photos... ${files.length} found`);

    const { response, data } = await fetchPhotoTagJson(
      `https://www.googleapis.com/drive/v3/files?${params.join('&')}`,
      `Drive page ${page} took too long.`
    );

    if (!response.ok || !data.files) {
      throw new Error(data.error?.message || 'Drive API error');
    }

    files.push(...data.files.map(file => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType || '',
      type: 'image',
      createdTime: file.createdTime || '',
      modifiedTime: file.modifiedTime || '',
      takenTime: file.imageMediaMetadata?.time || '',
      md5Checksum: file.md5Checksum || '',
      size: file.size || ''
    })));

    updatePhotoTagLoading(`Loading ${getPhotoTagFolderLabel()} photos... ${files.length} found`);
    pageToken = data.nextPageToken || '';
  } while (pageToken);

  updatePhotoTagLoading(`Preparing ${files.length} Drive photos...`);
  return sortPhotoTagFiles(assignPhotoTagSuggestedNames(files));
}

function parsePhotoTagDateKey(value) {
  const raw = String(value || '').trim();
  const dateParts = raw.match(/^(\d{4})[:.-](\d{2})[:.-](\d{2})/);

  if (dateParts) {
    return `${dateParts[1]}.${dateParts[2]}.${dateParts[3]}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';

  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, '0'),
    String(parsed.getDate()).padStart(2, '0')
  ].join('.');
}

function getPhotoTagFileExtension(file) {
  return '.jpg';
}

function parseYoutubeId(input) {
  const s = String(input || '').trim();
  let m = s.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  m = s.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  m = s.match(/embed\/([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  m = s.match(/shorts\/([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  return null;
}

function getPhotoTagTakenSortValue(file) {
  const raw = String(file?.takenTime || file?.createdTime || file?.modifiedTime || '').trim();
  const normalized = raw.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? Number.MAX_SAFE_INTEGER : parsed.getTime();
}

function getPhotoTagNameMatchValue(value) {
  return String(value || '').match(PHOTO_TAGS_STANDARD_NAME_RE);
}

function getPhotoTagNameMatch(file) {
  return getPhotoTagNameMatchValue(file?.name);
}

function isPhotoTagStandardNameValue(value) {
  return Boolean(getPhotoTagNameMatchValue(value));
}

function isPhotoTagStandardName(file) {
  const match = getPhotoTagNameMatch(file);
  if (!match) return false;

  return Boolean(file.suggestedName && file.name.toLowerCase() === file.suggestedName.toLowerCase());
}

function hasMatchingSavedPhotoTagFingerprint(file, tag) {
  return hasSavedDriveFingerprint(tag) && getChangedDriveFields(file, tag).length === 0;
}

function parsePhotoTagTimeMs(value) {
  const ms = Date.parse(value || '');
  return Number.isFinite(ms) ? ms : 0;
}

function isSavedPhotoTagRenameCurrentEnough(file, tag) {
  const savedModified = parsePhotoTagTimeMs(tag?.drive?.modifiedTime);
  const currentModified = parsePhotoTagTimeMs(file?.modifiedTime);
  if (!savedModified || !currentModified) return true;

  return currentModified <= savedModified + 1000;
}

function shouldTrustSavedPhotoTagName(file, tag) {
  if (!file || !tag || !hasSavedTagPeople(tag)) return false;
  if (tag.status !== 'approved') return false;
  if (hasUnresolvedTagPeople(tag)) return false;

  const savedName = String(tag.name || '').trim();
  const driveName = String(file.name || '').trim();

  if (!savedName || !driveName || savedName === driveName) return false;
  if (!isPhotoTagStandardNameValue(savedName) || isPhotoTagStandardNameValue(driveName)) return false;
  if (!isSavedPhotoTagRenameCurrentEnough(file, tag)) return false;

  return hasMatchingSavedPhotoTagFingerprint(file, tag);
}

function applySavedPhotoTagNameDuringDriveLag(file) {
  const tag = getPhotoTagRecord(file.id);
  if (!shouldTrustSavedPhotoTagName(file, tag)) return file;

  file.driveListedName = file.name;
  file.name = tag.name;
  file.driveRenameLag = true;
  return file;
}

function sortPhotoTagFiles(files) {
  return files.sort((a, b) => b.name.localeCompare(a.name, undefined, {
    numeric: true,
    sensitivity: 'base'
  }));
}

function reconcilePhotoTagFilesWithSavedNames() {
  photoTagFiles = sortPhotoTagFiles(assignPhotoTagSuggestedNames(photoTagFiles.map(applySavedPhotoTagNameDuringDriveLag)));
}
function assignPhotoTagSuggestedNames(files) {
  const maxSequenceByDate = new Map();
  const renameGroups = new Map();

  files.forEach(file => {
    const nameMatch = getPhotoTagNameMatch(file);

    if (nameMatch) {
      const dateKey = `${nameMatch[1]}.${nameMatch[2]}.${nameMatch[3]}`;
      const sequence = Number(nameMatch[4]);
      maxSequenceByDate.set(dateKey, Math.max(maxSequenceByDate.get(dateKey) || 0, sequence));
    }
  });

  files.forEach(file => {
    const dateKey = parsePhotoTagDateKey(file.takenTime || file.createdTime || file.modifiedTime);
    file.dateTakenKey = dateKey;

    if (!dateKey) {
      file.suggestedName = '';
      return;
    }

    const nameMatch = getPhotoTagNameMatch(file);
    if (nameMatch) {
      file.suggestedName = file.name;
      return;
    }

    if (!renameGroups.has(dateKey)) {
      renameGroups.set(dateKey, []);
    }

    renameGroups.get(dateKey).push(file);
  });

  renameGroups.forEach((group, dateKey) => {
    group
      .sort((a, b) =>
        getPhotoTagTakenSortValue(a) - getPhotoTagTakenSortValue(b) ||
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }) ||
        a.id.localeCompare(b.id)
      )
      .forEach((file, index) => {
        const sequence = (maxSequenceByDate.get(dateKey) || 0) + index + 1;
        file.suggestedName = `${dateKey}_${String(sequence).padStart(4, '0')}${getPhotoTagFileExtension(file)}`;
      });
  });

  return files;
}

function getPhotoTagRenameMessage(file) {
  if (isPhotoTagStandardName(file)) return '';
  if (shouldTrustSavedPhotoTagName(file, getPhotoTagRecord(file.id))) return '';

  if (!file.suggestedName) {
    return 'Rename this file before tagging. I could not find a date taken, so use YYYY.MM.DD_0001.ext.';
  }

  return `Rename this file in Google Drive before publishing tags: ${file.suggestedName}`;
}

async function patchGoogleDriveFileName(fileId, name, accessToken) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,modifiedTime`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name })
    }
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Google Drive rename failed.');
  }

  return data;
}

function isPhotoTagImageFile(file) {
  const mimeType = String(file?.type || file?.mimeType || '').toLowerCase();
  const fileName = String(file?.name || '').toLowerCase();
  return mimeType.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif|dng|tiff?)$/i.test(fileName);
}

function getPhotoTagMediaTypeFromMime(mimeType) {
  return 'image';
}

function isSupportedPhotoReplacement(file) {
  return isPhotoTagImageFile(file);
}

function getPhotoTagExtensionForMime(mimeType) {
  return '.jpg';
}

function replacePhotoTagFileExtension(name, extension) {
  const baseName = String(name || 'photo')
    .replace(/[\\/]+/g, '-')
    .replace(/\.[a-z0-9]+$/i, '')
    .trim() || 'photo';

  return `${baseName}${extension}`;
}

async function convertPhotoTagUploadMedia(file) {
  const user = window.currentUser;

  if (!user || typeof user.getIdToken !== 'function') {
    throw new Error('Sign in again before converting this photo.');
  }

  const formData = new FormData();
  formData.append('media', file, file.name || 'photo');

  let response;
  try {
    response = await fetch(PHOTO_TAGS_CONVERT_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await user.getIdToken(true)}`
      },
      body: formData
    });
  } catch (error) {
    throw new Error(`Photo conversion request failed before the server responded. Check that Firebase Functions are deployed and allowed for this site. ${error.message || error}`);
  }

  if (!response.ok) {
    let message = 'Could not convert this photo.';

    try {
      const data = await response.json();
      message = data.error || message;
    } catch (error) {
      console.warn('Could not read conversion error response:', error);
    }

    throw new Error(message);
  }

  const blob = await response.blob();
  const mimeType = response.headers.get('X-Output-Mime-Type') || response.headers.get('Content-Type') || 'image/jpeg';
  const extension = getPhotoTagExtensionForMime(mimeType);
  const fileName = response.headers.get('X-Output-File-Name') || replacePhotoTagFileExtension(file.name, extension);

  return new File([blob], fileName, { type: mimeType });
}

async function preparePhotoTagReplacementUpload(selectedFile, driveFile) {
  if (!selectedFile || selectedFile.size <= 0) {
    throw new Error('Choose a photo first.');
  }

  if (selectedFile.size > PHOTO_TAGS_MAX_REPLACE_UPLOAD_BYTES) {
    throw new Error('Choose a photo under 31 MB.');
  }

  if (!isSupportedPhotoReplacement(selectedFile)) {
    throw new Error('Choose a JPEG, PNG, WebP, HEIC, HEIF, TIFF, or DNG photo.');
  }

  const convertedFile = await convertPhotoTagUploadMedia(selectedFile);
  const convertedType = getPhotoTagMediaTypeFromMime(convertedFile.type);
  if (convertedType !== 'image') {
    throw new Error('Choose a photo file to replace this photo.');
  }

  return new File([convertedFile], convertedFile.name, { type: convertedFile.type });
}

function buildDriveMultipartBody(metadata, fileBlob, mimeType) {
  const boundary = `photo_tag_boundary_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
    JSON.stringify(metadata),
    `\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
    fileBlob,
    `\r\n--${boundary}--`
  ], { type: `multipart/related; boundary=${boundary}` });

  return {
    body,
    contentType: `multipart/related; boundary=${boundary}`
  };
}

async function patchGoogleDriveFileContent(fileId, preparedFile, accessToken) {
  const mimeType = preparedFile.type || 'image/jpeg';
  const fields = 'id,name,mimeType,createdTime,modifiedTime,md5Checksum,size,imageMediaMetadata(time)';
  const multipart = buildDriveMultipartBody({
    name: preparedFile.name,
    mimeType
  }, preparedFile, mimeType);

  let response;
  try {
    response = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=multipart&fields=${encodeURIComponent(fields)}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': multipart.contentType
        },
        body: multipart.body
      }
    );
  } catch (error) {
    throw new Error(`Google Drive replacement request failed before Drive responded. ${error.message || error}`);
  }
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Google Drive media replacement failed.');
  }

  return data;
}

function getPhotoTagFileName(file) {
  return String(file?.name || '').trim();
}

function buildPhotoTagFileMetadataFields(file) {
  const fileName = getPhotoTagFileName(file);
  return {
    fileName,
    displayName: fileName,
    searchName: fileName.toLowerCase()
  };
}

function buildPhotoTagDriveMetadata(file, existingDrive = {}) {
  return {
    ...(existingDrive || {}),
    name: getPhotoTagFileName(file),
    mimeType: file.mimeType,
    type: file.type,
    createdTime: file.createdTime,
    modifiedTime: file.modifiedTime,
    takenTime: file.takenTime,
    suggestedName: file.suggestedName,
    md5Checksum: file.md5Checksum,
    size: file.size
  };
}

async function refreshPhotoTagRecordAfterReplacement(file, hadTags) {
  const tag = getPhotoTagRecord(file.id);
  if (!tag && !hadTags) return;

  const payload = {
    ...buildPhotoTagFileMetadataFields(file),
    name: file.name,
    mimeType: file.mimeType,
    type: file.type,
    drive: buildPhotoTagDriveMetadata(file, tag?.drive),
    updatedAt: window._fb.serverTimestamp()
  };

  if (hadTags) {
    payload.status = 'needs-review';
    payload.reviewReason = PHOTO_TAGS_REPLACE_REVIEW_REASON;
    payload.reviewCheckedAt = window._fb.serverTimestamp();
  }

  await window._fb.setDoc(
    window._fb.doc(window._fb.db, PHOTO_TAGS_COLLECTION, file.id),
    payload,
    { merge: true }
  );

  photoTagRecords.set(file.id, normalizePhotoTagRecord(file.id, {
    ...(tag || {}),
    ...payload,
    updatedAt: tag?.updatedAt
  }));
}

async function refreshPhotoTagRecordAfterDriveRename(file) {
  const tag = getPhotoTagRecord(file.id);
  if (!tag) return;

  const payload = {
    ...buildPhotoTagFileMetadataFields(file),
    name: file.name,
    drive: buildPhotoTagDriveMetadata(file, tag.drive),
    updatedAt: window._fb.serverTimestamp()
  };

  await window._fb.setDoc(
    window._fb.doc(window._fb.db, PHOTO_TAGS_COLLECTION, file.id),
    payload,
    { merge: true }
  );

  photoTagRecords.set(file.id, normalizePhotoTagRecord(file.id, {
    ...tag,
    ...payload,
    updatedAt: tag.updatedAt
  }));
}

function normalizePhotoTagRecord(id, data) {
  const people = Array.isArray(data.people) ? data.people : [];
  const peopleAliases = Array.isArray(data.peopleAliases) ? data.peopleAliases : [];
  const personIds = Array.isArray(data.personIds) ? data.personIds : [];
  const storedStatus = String(data.status || '').trim();
  const hasSavedPeople = people.length > 0 || peopleAliases.length > 0 || personIds.length > 0;

  return {
    id,
    ...data,
    people,
    peopleAliases,
    peopleLabels: Array.isArray(data.peopleLabels) ? data.peopleLabels : [],
    otherPeopleLabels: Array.isArray(data.otherPeopleLabels) ? data.otherPeopleLabels : [],
    personIds,
    albums: Array.isArray(data.albums) ? data.albums : ['family'],
    drive: data.drive && typeof data.drive === 'object' ? data.drive : {},
    status: storedStatus || (hasSavedPeople ? 'needs-review' : 'untagged'),
    _storedStatus: storedStatus
  };
}

function makePhotoTagSlug(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function canonicalPhotoTagSlug(value) {
  const slug = makePhotoTagSlug(value);
  return PHOTO_TAG_CANONICAL_SLUGS[slug] || slug;
}

function normalizeDirectoryMemberForPhotoTag(member = {}) {
  const id = String(member.id || member.uid || '').trim();
  const tagLabel = String(member.displayName || member.email || id).trim();
  const rawPersonSlug = makePhotoTagSlug(tagLabel || id);
  const personSlug = canonicalPhotoTagSlug(rawPersonSlug);

  if (!id || !tagLabel || !personSlug) return null;

  return {
    ...member,
    id,
    rawPersonSlug,
    personSlug,
    alternatePersonSlugs: rawPersonSlug && rawPersonSlug !== personSlug ? [rawPersonSlug] : [],
    tagKey: `member:${id}`,
    tagLabel
  };
}
function disambiguateDuplicateMemberLabels(members) {
  const counts = new Map();

  members.forEach(member => {
    const key = String(member.tagLabel || '').trim().toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return members.map(member => {
    const key = String(member.tagLabel || '').trim().toLowerCase();

    if ((counts.get(key) || 0) < 2) {
      return member;
    }

    const hint = member.email || member.city || member.id;
    return {
      ...member,
      displayTagLabel: hint ? `${member.tagLabel} (${hint})` : `${member.tagLabel} (${member.id})`
    };
  });
}

function uniquePhotoTagLabels(values) {
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

function escapePhotoTagHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function photoTagThumbnail(file, size = 600) {
  const version = file.modifiedTime || file.md5Checksum || '';
  const cacheBust = version ? `&v=${encodeURIComponent(version)}` : '';
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(file.id)}&sz=w${size}${cacheBust}`;
}

function getPhotoTagLabel(slug) {
  const member = photoTagMembers.find(item =>
    item.tagKey === slug ||
    item.personSlug === slug ||
    item.alternatePersonSlugs?.includes(slug) ||
    item.id === slug
  );
  return member?.tagLabel || slug;
}

function isMemberSelectedForTag(tag, member) {
  if (!tag) return false;

  return tag.people.includes(member.tagKey) ||
    tag.people.includes(member.personSlug) ||
    member.alternatePersonSlugs?.some(slug => tag.people.includes(slug)) ||
    tag.peopleAliases.includes(member.personSlug) ||
    member.alternatePersonSlugs?.some(slug => tag.peopleAliases.includes(slug)) ||
    tag.personIds.includes(member.id);
}

function hasSavedTagPeople(tag) {
  return Boolean(tag && (
    (Array.isArray(tag.people) && tag.people.length > 0) ||
    (Array.isArray(tag.peopleAliases) && tag.peopleAliases.length > 0) ||
    (Array.isArray(tag.personIds) && tag.personIds.length > 0)
  ));
}
function normalizePhotoTagPeopleKeys(keys) {
  const seen = new Set();
  const normalized = [];

  (keys || []).forEach(key => {
    const value = String(key || '').trim();
    if (!value || seen.has(value)) return;
    seen.add(value);
    normalized.push(value);
  });

  return normalized;
}

function getPhotoTagDraftKey(fileId, source = photoTagSource) {
  return `${source}:${fileId}`;
}

function getPhotoTagDraftPeople(fileId) {
  const draft = photoTagDrafts.get(getPhotoTagDraftKey(fileId));
  return Array.isArray(draft) ? draft : null;
}

function getSavedPhotoTagPeopleKeys(tag) {
  if (!hasSavedTagPeople(tag)) return [];

  const memberKeys = photoTagMembers
    .filter(member => isMemberSelectedForTag(tag, member))
    .map(member => member.tagKey);
  const knownKeys = new Set(photoTagMembers.map(member => member.tagKey));
  const directKeys = (tag.people || []).filter(key => knownKeys.has(key));

  return normalizePhotoTagPeopleKeys([...memberKeys, ...directKeys]);
}

function getEffectivePhotoTagPeople(fileId, tag = getPhotoTagRecord(fileId)) {
  const draft = getPhotoTagDraftPeople(fileId);
  return draft === null ? getSavedPhotoTagPeopleKeys(tag) : draft;
}

function getPhotoTagMembersForKeys(keys) {
  const keySet = new Set(keys || []);
  return photoTagMembers.filter(member => keySet.has(member.tagKey));
}

function haveSamePhotoTagPeople(a, b) {
  const left = normalizePhotoTagPeopleKeys(a).slice().sort();
  const right = normalizePhotoTagPeopleKeys(b).slice().sort();

  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function isPhotoTagDraftDirty(fileId, tag = getPhotoTagRecord(fileId)) {
  const draft = getPhotoTagDraftPeople(fileId);
  if (draft === null) return false;

  return !haveSamePhotoTagPeople(draft, getSavedPhotoTagPeopleKeys(tag));
}

function setPhotoTagDraftPeople(fileId, people) {
  const normalized = normalizePhotoTagPeopleKeys(people);
  const key = getPhotoTagDraftKey(fileId);

  if (haveSamePhotoTagPeople(normalized, getSavedPhotoTagPeopleKeys(getPhotoTagRecord(fileId)))) {
    photoTagDrafts.delete(key);
  } else {
    photoTagDrafts.set(key, normalized);
  }

  persistPhotoTagDrafts();
}

function clearPhotoTagDraft(fileId) {
  photoTagDrafts.delete(getPhotoTagDraftKey(fileId));
  persistPhotoTagDrafts();
}

function getPhotoTagChipPeople(fileId) {
  const chipsWrap = document.getElementById(`chips-${fileId}`);
  return normalizePhotoTagPeopleKeys(Array.from(chipsWrap?.querySelectorAll('.fd-person-chip.selected') || [])
    .map(chip => chip.dataset.personKey));
}

function updatePhotoTagDraftFromChips(fileId) {
  setPhotoTagDraftPeople(fileId, getPhotoTagChipPeople(fileId));
  renderBulkBar();
  renderPhotoTagSummary();
}

function getDirtyPhotoTagDraftFiles() {
  return photoTagFiles.filter(file => {
    const people = getEffectivePhotoTagPeople(file.id, getPhotoTagRecord(file.id));
    return people.length > 0 && isPhotoTagDraftDirty(file.id, getPhotoTagRecord(file.id));
  });
}

function getPhotoTagDraftCount() {
  return getDirtyPhotoTagDraftFiles().length;
}

function clearPhotoTagDrafts() {
  let cleared = 0;

  photoTagFiles.forEach(file => {
    if (getPhotoTagDraftPeople(file.id) !== null) {
      clearPhotoTagDraft(file.id);
      cleared++;
    }
  });

  fdToast(cleared ? `${cleared} draft${cleared !== 1 ? 's' : ''} cleared.` : 'No drafts to clear.');
  renderPhotoTags();
}

function getDriveFieldValue(source, field) {
  return String(source?.[field] || '').trim();
}

function hasSavedDriveFingerprint(tag) {
  const drive = tag?.drive || {};
  return PHOTO_TAGS_CONTENT_FIELDS.some(field => getDriveFieldValue(drive, field));
}

function getChangedDriveFields(file, tag) {
  const drive = tag?.drive || {};

  return PHOTO_TAGS_CONTENT_FIELDS.filter(field => {
    const saved = getDriveFieldValue(drive, field);
    const current = getDriveFieldValue(file, field);
    return saved && current && saved !== current;
  });
}

function hasUnresolvedTagPeople(tag) {
  if (!hasSavedTagPeople(tag)) return false;

  const selectedMembers = photoTagMembers.filter(member => isMemberSelectedForTag(tag, member));

  if (selectedMembers.length === 0) return true;

  const hasMissingSavedPerson = (tag.people || []).some(value =>
    !selectedMembers.some(member =>
      member.tagKey === value ||
      member.personSlug === value ||
      member.alternatePersonSlugs?.includes(value) ||
      member.id === value
    )
  );

  if (hasMissingSavedPerson) return true;

  return selectedMembers.some(member =>
    !tag.people.includes(member.tagKey) ||
    !tag.peopleAliases.includes(member.personSlug) ||
    !tag.personIds.includes(member.id)
  );
}

function getPhotoTagReviewReason(file, tag) {
  if (!hasSavedTagPeople(tag)) return '';

  if (hasUnresolvedTagPeople(tag)) {
    return 'One or more saved people no longer match an available tag profile. Review and publish again.';
  }

  if (!tag._storedStatus) {
    return 'This tag was saved before explicit approval tracking. Review and publish again.';
  }

  if (tag._storedStatus === 'approved') {
    if (!hasSavedDriveFingerprint(tag)) {
      return 'This approval is missing the Drive file fingerprint. Review and publish again.';
    }

    if (getChangedDriveFields(file, tag).length > 0) {
      return 'The Google Drive file changed after approval. Review and publish again.';
    }
  }

  if (tag.status === 'needs-review') {
    return tag.reviewReason || 'Review these tags before publishing.';
  }

  if (tag.name && file.name && tag.name !== file.name && !shouldTrustSavedPhotoTagName(file, tag)) {
    return 'File name changed since approval. Save and publish to refresh the saved metadata.';
  }

  return '';
}

function getPhotoTagRecord(fileId) {
  return photoTagRecords.get(fileId) || null;
}

function isYoutubePhotoTagRecord(tag) {
  return Boolean(tag && tag.source === 'youtube' && tag.youtubeId);
}

function getPhotoTagYoutubeVideos() {
  return Array.from(photoTagRecords.values())
    .filter(tag => isYoutubePhotoTagRecord(tag) && isPhotoTagCurrentAlbum(tag))
    .sort((a, b) => String(b.updatedAt?.seconds || b.approvedAt?.seconds || 0).localeCompare(String(a.updatedAt?.seconds || a.approvedAt?.seconds || 0)));
}

function getYoutubeVideoTagStatus(video) {
  if (!hasSavedTagPeople(video)) return 'untagged';
  if (hasUnresolvedTagPeople(video)) return 'needs-review';
  return video.status || 'approved';
}

function getVisiblePhotoTagYoutubeVideos() {
  return getPhotoTagYoutubeVideos().filter(video => {
    const tagged = hasSavedTagPeople(video);
    const status = getYoutubeVideoTagStatus(video);

    if (photoTagFilter === 'untagged' && tagged) return false;
    if (photoTagFilter === 'tagged' && !tagged) return false;
    if (photoTagFilter === 'approved' && status !== 'approved') return false;
    if (photoTagFilter === 'needs-review' && status !== 'needs-review') return false;
    if (photoTagFilter === 'draft') return false;
    if (photoTagFilter === 'needs-rename') return false;
    if (photoTagFilter === 'duplicates') return false;
    if (photoTagFilter === 'suggestions' && getPendingPhotoTagSuggestionsForTarget(video.id).length === 0) return false;

    if (!photoTagSearch) return true;

    const labels = uniquePhotoTagLabels([...(video.peopleLabels || []), ...(video.otherPeopleLabels || []), ...(video.people || []).map(getPhotoTagLabel)]).join(' ');
    return `${video.youtubeTitle || ''} ${video.youtubeId || ''} ${labels}`.toLowerCase().includes(photoTagSearch);
  });
}

function getPhotoTagSuggestionTargetId(suggestion) {
  return String(suggestion?.target?.id || '').trim();
}

function isPhotoTagSuggestionCurrentSource(suggestion) {
  const target = suggestion?.target || {};
  const albumSlug = String(target.albumSlug || '').trim() || 'family';
  return albumSlug === getPhotoTagAlbumSlug() || (!target.albumSlug && getPhotoTagAlbumSlug() === 'family');
}

function getPhotoTagSuggestionPeopleKeys(suggestion) {
  const selectedPeopleKeys = (Array.isArray(suggestion?.selectedPeople) ? suggestion.selectedPeople : [])
    .map(person => person?.tagKey)
    .filter(Boolean);

  return normalizePhotoTagPeopleKeys([
    ...(Array.isArray(suggestion?.peopleKeys) ? suggestion.peopleKeys : []),
    ...selectedPeopleKeys
  ]);
}

function getPhotoTagSuggestionPeopleLabels(suggestion) {
  const selectedPeopleLabels = (Array.isArray(suggestion?.selectedPeople) ? suggestion.selectedPeople : [])
    .map(person => person?.tagLabel)
    .filter(Boolean);

  return uniquePhotoTagLabels([
    ...(Array.isArray(suggestion?.peopleLabels) ? suggestion.peopleLabels : []),
    ...selectedPeopleLabels
  ]);
}

function getPhotoTagSuggestionOtherLabels(suggestion) {
  return uniquePhotoTagLabels(suggestion?.otherNames || []);
}

function getPhotoTagSuggestionHasNames(suggestion) {
  return getPhotoTagSuggestionPeopleKeys(suggestion).length > 0 ||
    getPhotoTagSuggestionPeopleLabels(suggestion).length > 0 ||
    getPhotoTagSuggestionOtherLabels(suggestion).length > 0;
}

function getPhotoTagAppliedLabelSet(tag) {
  const savedMemberLabels = getPhotoTagMembersForKeys(getSavedPhotoTagPeopleKeys(tag))
    .map(member => member.displayTagLabel || member.tagLabel);
  const directPeopleLabels = (Array.isArray(tag?.people) ? tag.people : []).map(getPhotoTagLabel);

  return new Set(uniquePhotoTagLabels([
    ...savedMemberLabels,
    ...directPeopleLabels,
    ...(Array.isArray(tag?.peopleLabels) ? tag.peopleLabels : []),
    ...(Array.isArray(tag?.otherPeopleLabels) ? tag.otherPeopleLabels : [])
  ]).map(normalizePhotoTagToken));
}

function isPhotoTagSuggestionAlreadyApplied(suggestion, target) {
  const tag = isYoutubePhotoTagRecord(target) ? target : getPhotoTagRecord(target?.id);
  if (!tag) return false;

  const suggestedPeople = getPhotoTagSuggestionPeopleKeys(suggestion);
  const suggestedPeopleLabels = getPhotoTagSuggestionPeopleLabels(suggestion);
  const suggestedOtherLabels = getPhotoTagSuggestionOtherLabels(suggestion);
  if (!getPhotoTagSuggestionHasNames(suggestion)) return false;

  const savedPeople = new Set(getSavedPhotoTagPeopleKeys(tag));
  const appliedLabels = getPhotoTagAppliedLabelSet(tag);
  const peopleApplied = suggestedPeople.every(key => {
    if (savedPeople.has(key)) return true;
    const person = getPhotoTagMemberOrSuggestionPerson(key, suggestion);
    return Boolean(person?.tagLabel && appliedLabels.has(normalizePhotoTagToken(person.tagLabel)));
  });
  const peopleLabelsApplied = suggestedPeopleLabels.every(label => appliedLabels.has(normalizePhotoTagToken(label)));
  const otherLabelsApplied = suggestedOtherLabels.every(label => appliedLabels.has(normalizePhotoTagToken(label)));

  return peopleApplied && peopleLabelsApplied && otherLabelsApplied;
}

function isPhotoTagSuggestionActionable(suggestion) {
  if (suggestion?.status !== 'pending') return false;
  if (!isPhotoTagSuggestionCurrentSource(suggestion)) return false;
  if (!getPhotoTagSuggestionHasNames(suggestion)) return false;

  const target = getPhotoTagTargetForSuggestion(suggestion);
  return Boolean(target && !isPhotoTagSuggestionAlreadyApplied(suggestion, target));
}

function getPendingPhotoTagSuggestionsForTarget(targetId) {
  return photoTagSuggestions.filter(suggestion =>
    getPhotoTagSuggestionTargetId(suggestion) === targetId &&
    isPhotoTagSuggestionActionable(suggestion)
  );
}

function getPendingPhotoTagSuggestionCount() {
  return photoTagSuggestions.filter(isPhotoTagSuggestionActionable).length;
}

function getSuggestionPersonByKey(suggestion, key) {
  return (suggestion?.selectedPeople || []).find(person => person.tagKey === key) || null;
}

function getPhotoTagMemberOrSuggestionPerson(key, suggestion) {
  const member = photoTagMembers.find(item => item.tagKey === key);
  if (member) return {
    tagKey: member.tagKey,
    tagLabel: member.tagLabel,
    personSlug: member.personSlug,
    personId: member.id
  };

  const person = getSuggestionPersonByKey(suggestion, key);
  if (!person) return null;

  return {
    tagKey: person.tagKey,
    tagLabel: person.tagLabel,
    personSlug: person.personSlug,
    personId: person.personId || person.id || ''
  };
}

function getPhotoTagMemberByKey(tagKey) {
  return photoTagMembers.find(member => member.tagKey === tagKey) || null;
}

function getPhotoTagMemberIdFromKey(tagKey) {
  const value = String(tagKey || '').trim();
  return value.startsWith('member:') ? value.slice('member:'.length) : '';
}

function sortPhotoTagMembersByLabel(members) {
  return members.sort((a, b) => a.tagLabel.localeCompare(b.tagLabel, undefined, { sensitivity: 'base' }));
}

function findPhotoTagMemberByName(name) {
  const normalized = normalizePhotoTagToken(name);
  if (!normalized) return null;

  return photoTagMembers.find(member => normalizePhotoTagToken(member.tagLabel) === normalized)
    || photoTagMembers.find(member => normalizePhotoTagToken(member.displayName) === normalized)
    || null;
}

function makePhotoTagOnlyMemberId(name) {
  const slug = makePhotoTagSlug(name) || 'person';
  const suffix = Math.random().toString(36).slice(2, 7);
  return `manual_phototag_${slug}_${Date.now()}_${suffix}`;
}

function buildPhotoTagOnlyMemberPayload(name, id) {
  return {
    uid: id,
    displayName: name,
    email: '',
    emailLower: '',
    phone: '',
    city: '',
    country: '',
    photoURL: '',
    birthday: '',
    address: '',
    preferredContact: 'email',
    role: 'member',
    status: 'approved',
    privacy: {
      showPhone: false,
      showEmail: false,
      showAddress: false,
      showBirthday: false,
      showAge: false
    },
    isPhotoTagOnly: true,
    createdFromPhotoTagSuggestion: true,
    syncSource: 'photoTagSuggestion',
    createdAt: window._fb.serverTimestamp(),
    updatedAt: window._fb.serverTimestamp()
  };
}

async function ensurePhotoTagOnlyMemberForName(name, preferredId = '') {
  const displayName = String(name || '').trim();
  if (!displayName) return null;

  const existingByName = findPhotoTagMemberByName(displayName);
  if (existingByName) return existingByName;

  const { doc, getDoc, setDoc } = window._fb;
  const id = String(preferredId || '').trim() || makePhotoTagOnlyMemberId(displayName);
  const ref = doc(window._fb.db, FAMILY_DIRECTORY_COLLECTION, id);
  const existingSnap = await getDoc(ref).catch(() => null);

  if (existingSnap?.exists?.()) {
    const existingMember = normalizeDirectoryMemberForPhotoTag({ id, ...existingSnap.data() });
    if (existingMember) {
      photoTagMembers = disambiguateDuplicateMemberLabels(sortPhotoTagMembersByLabel([
        ...photoTagMembers.filter(member => member.id !== existingMember.id),
        existingMember
      ]));
      return getPhotoTagMemberByKey(existingMember.tagKey) || existingMember;
    }
  }

  const payload = buildPhotoTagOnlyMemberPayload(displayName, id);
  await setDoc(ref, payload, { merge: true });

  const createdMember = normalizeDirectoryMemberForPhotoTag({ id, ...payload });
  if (!createdMember) return null;

  photoTagMembers = disambiguateDuplicateMemberLabels(sortPhotoTagMembersByLabel([
    ...photoTagMembers.filter(member => member.id !== createdMember.id),
    createdMember
  ]));

  return getPhotoTagMemberByKey(createdMember.tagKey) || createdMember;
}

async function resolvePhotoTagSuggestionMembers(suggestion) {
  const resolved = new Map();
  const addMember = member => {
    if (member?.tagKey) resolved.set(member.tagKey, member);
  };

  const selectedPeople = Array.isArray(suggestion?.selectedPeople) ? suggestion.selectedPeople : [];
  const peopleKeys = Array.isArray(suggestion?.peopleKeys) ? suggestion.peopleKeys : [];

  for (const key of peopleKeys) {
    const person = getSuggestionPersonByKey(suggestion, key);
    let member = getPhotoTagMemberByKey(key);

    if (!member && person?.tagLabel) {
      member = findPhotoTagMemberByName(person.tagLabel)
        || await ensurePhotoTagOnlyMemberForName(person.tagLabel, person.personId || person.id || getPhotoTagMemberIdFromKey(key));
    }

    addMember(member);
  }

  for (const person of selectedPeople) {
    const key = String(person?.tagKey || '').trim();
    if (key && resolved.has(key)) continue;

    let member = getPhotoTagMemberByKey(key);
    if (!member && person?.tagLabel) {
      member = findPhotoTagMemberByName(person.tagLabel)
        || await ensurePhotoTagOnlyMemberForName(person.tagLabel, person.personId || person.id || getPhotoTagMemberIdFromKey(key));
    }

    addMember(member);
  }

  const resolvedLabels = new Set(Array.from(resolved.values()).map(member => normalizePhotoTagToken(member.tagLabel)));

  for (const name of getPhotoTagSuggestionPeopleLabels(suggestion)) {
    const normalized = normalizePhotoTagToken(name);
    if (!normalized || resolvedLabels.has(normalized)) continue;

    const member = findPhotoTagMemberByName(name) || await ensurePhotoTagOnlyMemberForName(name);
    addMember(member);
    if (member?.tagLabel) resolvedLabels.add(normalizePhotoTagToken(member.tagLabel));
  }

  for (const name of uniquePhotoTagLabels(suggestion?.otherNames || [])) {
    const normalized = normalizePhotoTagToken(name);
    if (!normalized || resolvedLabels.has(normalized)) continue;

    const member = findPhotoTagMemberByName(name) || await ensurePhotoTagOnlyMemberForName(name);
    addMember(member);
    if (member?.tagLabel) resolvedLabels.add(normalizePhotoTagToken(member.tagLabel));
  }

  return Array.from(resolved.values());
}

function getMergedPhotoTagPeopleForSuggestion(tag, resolvedMembers) {
  return normalizePhotoTagPeopleKeys([
    ...getSavedPhotoTagPeopleKeys(tag),
    ...(resolvedMembers || []).map(member => member.tagKey)
  ]);
}

function getRemainingOtherPeopleLabelsAfterSuggestion(tag, resolvedMembers) {
  const resolvedLabels = new Set((resolvedMembers || []).map(member => normalizePhotoTagToken(member.tagLabel)));
  return uniquePhotoTagLabels(Array.isArray(tag?.otherPeopleLabels) ? tag.otherPeopleLabels : [])
    .filter(label => !resolvedLabels.has(normalizePhotoTagToken(label)));
}

function getPhotoTagDisplayLabels(tag, selectedMembersList = []) {
  const selectedLabels = selectedMembersList.map(member => member.displayTagLabel || member.tagLabel);
  const fallbackLabels = Array.isArray(tag?.peopleLabels) ? tag.peopleLabels : [];
  const otherLabels = Array.isArray(tag?.otherPeopleLabels) ? tag.otherPeopleLabels : [];
  return uniquePhotoTagLabels([
    ...(selectedLabels.length ? selectedLabels : fallbackLabels),
    ...otherLabels
  ]);
}

function renderPhotoTagSuggestionPanel(targetId) {
  const suggestions = getPendingPhotoTagSuggestionsForTarget(targetId);
  if (suggestions.length === 0) return '';

  return `
    <div class="fd-suggestion-panel">
      <p class="fd-suggestion-title">Public tag suggestion${suggestions.length !== 1 ? 's' : ''}</p>
      ${suggestions.map(suggestion => {
        const labels = uniquePhotoTagLabels([
          ...(Array.isArray(suggestion.peopleLabels) ? suggestion.peopleLabels : []),
          ...(Array.isArray(suggestion.otherNames) ? suggestion.otherNames : [])
        ]);
        const submitted = suggestion.createdAt?.toDate?.()?.toLocaleDateString?.() || '';
        return `
          <div class="fd-suggestion-item">
            <p>${escapePhotoTagHtml(labels.join(', ') || 'No names found')}</p>
            ${submitted ? `<span>Submitted ${escapePhotoTagHtml(submitted)}</span>` : ''}
            <div class="fd-suggestion-actions">
              <button type="button" class="fd-mini-btn suggestion" onclick="approvePhotoTagSuggestion('${escapePhotoTagHtml(suggestion.id)}')">Approve</button>
              <button type="button" class="fd-mini-btn secondary" onclick="rejectPhotoTagSuggestion('${escapePhotoTagHtml(suggestion.id)}')">Reject</button>
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

function getPhotoTagSuggestionById(suggestionId) {
  return photoTagSuggestions.find(suggestion => suggestion.id === suggestionId) || null;
}

function getPhotoTagTargetForSuggestion(suggestion) {
  const targetId = getPhotoTagSuggestionTargetId(suggestion);
  const file = photoTagFiles.find(item => item.id === targetId);
  if (file) return file;

  const record = getPhotoTagRecord(targetId);
  return isYoutubePhotoTagRecord(record) ? record : null;
}

async function markPhotoTagSuggestionReviewed(suggestionId, status) {
  await window._fb.setDoc(
    window._fb.doc(window._fb.db, PHOTO_TAG_SUGGESTIONS_COLLECTION, suggestionId),
    {
      status,
      reviewedAt: window._fb.serverTimestamp(),
      reviewedBy: currentUser?.email || currentUser?.uid || '',
      updatedAt: window._fb.serverTimestamp()
    },
    { merge: true }
  );
  photoTagSuggestions = photoTagSuggestions.filter(suggestion => suggestion.id !== suggestionId);
}

async function rejectPhotoTagSuggestion(suggestionId) {
  const suggestion = getPhotoTagSuggestionById(suggestionId);
  if (!suggestion) return;
  if (!window.confirm('Reject this public tag suggestion?')) return;

  try {
    await markPhotoTagSuggestionReviewed(suggestionId, 'rejected');
    fdToast('Suggestion rejected.');
    renderPhotoTags();
  } catch (error) {
    console.error('Suggestion reject error:', error);
    fdToast(error.message || 'Could not reject this suggestion.');
  }
}

async function approvePhotoTagSuggestion(suggestionId) {
  const suggestion = getPhotoTagSuggestionById(suggestionId);
  const target = getPhotoTagTargetForSuggestion(suggestion);
  if (!suggestion || !target) return fdToast('Could not find the photo or video for this suggestion.');

  const tag = getPhotoTagRecord(target.id) || target;

  try {
    const resolvedMembers = await resolvePhotoTagSuggestionMembers(suggestion);
    const mergedPeople = getMergedPhotoTagPeopleForSuggestion(tag, resolvedMembers);
    const otherPeopleLabels = getRemainingOtherPeopleLabelsAfterSuggestion(tag, resolvedMembers);

    if (mergedPeople.length === 0 && otherPeopleLabels.length === 0) {
      return fdToast('This suggestion has no names to approve.');
    }

    if (isYoutubePhotoTagRecord(target)) {
      await writeYoutubeTagRecordFromSuggestion(target, mergedPeople, otherPeopleLabels, suggestion);
    } else {
      await writePhotoTagRecord(target, mergedPeople, { otherPeopleLabels, suggestion });
    }

    await markPhotoTagSuggestionReviewed(suggestionId, 'approved');
    fdToast('Suggestion approved and published. New names were added as Photo Tags Only people.');
    renderPhotoTags();
  } catch (error) {
    console.error('Suggestion approve error:', error);
    fdToast(error.message || 'Could not approve this suggestion.');
  }
}
function getPhotoTagDriveRecordId(tag) {
  if (!tag || isYoutubePhotoTagRecord(tag)) return '';
  return String(tag.driveFileId || tag.id || '').trim();
}

function getMissingDrivePhotoTagRecords() {
  const currentDriveIds = new Set(photoTagFiles.map(file => file.id));
  return Array.from(photoTagRecords.values()).filter(tag => {
    if (!isPhotoTagCurrentAlbum(tag)) return false;
    const driveId = getPhotoTagDriveRecordId(tag);
    return Boolean(driveId && !currentDriveIds.has(driveId));
  });
}
function getPhotoTagFileByDriveId(fileId) {
  return photoTagFiles.find(file => file.id === fileId) || null;
}

function getRenamedDrivePhotoTagRecords() {
  return Array.from(photoTagRecords.values())
    .filter(tag => isPhotoTagCurrentAlbum(tag))
    .map(tag => {
      const driveId = getPhotoTagDriveRecordId(tag);
      return { tag, file: driveId ? getPhotoTagFileByDriveId(driveId) : null };
    })
    .filter(({ tag, file }) => {
      if (!file || isYoutubePhotoTagRecord(tag)) return false;
      if (!tag.name || !file.name || tag.name === file.name) return false;
      return !shouldTrustSavedPhotoTagName(file, tag);
    });
}

function buildPhotoTagDriveMetadataUpdate(file, tag = {}) {
  return {
    ...buildPhotoTagFileMetadataFields(file),
    name: file.name,
    mimeType: file.mimeType,
    type: file.type,
    drive: buildPhotoTagDriveMetadata(file, tag.drive),
    updatedAt: window._fb.serverTimestamp()
  };
}

async function refreshPhotoTagRecordFromDrive(file, tag) {
  const payload = buildPhotoTagDriveMetadataUpdate(file, tag);

  await window._fb.setDoc(
    window._fb.doc(window._fb.db, PHOTO_TAGS_COLLECTION, tag.id),
    payload,
    { merge: true }
  );

  photoTagRecords.set(tag.id, normalizePhotoTagRecord(tag.id, {
    ...tag,
    ...payload,
    updatedAt: tag.updatedAt
  }));
}

function isPhotoTagged(file) {
  const tag = getPhotoTagRecord(file.id);
  return getEffectivePhotoTagPeople(file.id, tag).length > 0;
}

function getPhotoTagStatus(file) {
  const tag = getPhotoTagRecord(file.id);

  if (isPhotoTagDraftDirty(file.id, tag)) return 'draft';
  if (!hasSavedTagPeople(tag)) return 'untagged';

  if (hasUnresolvedTagPeople(tag)) return 'needs-review';

  if (!tag._storedStatus) return 'needs-review';

  if (tag._storedStatus === 'approved') {
    if (!hasSavedDriveFingerprint(tag)) return 'needs-review';
    if (getChangedDriveFields(file, tag).length > 0) return 'needs-review';
  }

  if (tag.name && file.name && tag.name !== file.name && !shouldTrustSavedPhotoTagName(file, tag)) {
    return 'needs-review';
  }

  return tag.status || 'approved';
}
function normalizePhotoTagDuplicateName(value) {
  return String(value || '').trim().toLowerCase();
}

function getPhotoTagSizeBytes(file) {
  const size = Number(file?.size || 0);
  return Number.isFinite(size) && size > 0 ? size : 0;
}

function getPhotoTagTakenTimeMs(file) {
  const value = file?.takenTime || '';
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

function getPhotoTagDriveRecencyMs(file) {
  const value = file?.createdTime || file?.modifiedTime || file?.takenTime || '';
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

function isPhotoTagNearDuplicate(a, b) {
  if (!a || !b || a.id === b.id) return false;

  const aTime = getPhotoTagTakenTimeMs(a);
  const bTime = getPhotoTagTakenTimeMs(b);
  const aSize = getPhotoTagSizeBytes(a);
  const bSize = getPhotoTagSizeBytes(b);

  if (!aTime || !bTime || !aSize || !bSize) return false;

  const timeDiff = Math.abs(aTime - bTime);
  const sizeDiff = Math.abs(aSize - bSize);
  const ratioLimit = Math.min(aSize, bSize) * PHOTO_TAGS_NEAR_DUPLICATE_SIZE_RATIO;
  const sizeLimit = Math.max(PHOTO_TAGS_NEAR_DUPLICATE_SIZE_BYTES, ratioLimit);

  return timeDiff <= PHOTO_TAGS_NEAR_DUPLICATE_TIME_MS && sizeDiff <= sizeLimit;
}

function getPhotoTagNearDuplicateGroups() {
  const groups = [];

  photoTagFiles.forEach(file => {
    const matches = groups.filter(group => group.some(item => isPhotoTagNearDuplicate(item, file)));

    if (matches.length === 0) {
      groups.push([file]);
      return;
    }

    const merged = [file];
    matches.forEach(group => {
      group.forEach(item => merged.push(item));
      const index = groups.indexOf(group);
      if (index >= 0) groups.splice(index, 1);
    });

    const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
    groups.push(unique);
  });

  return groups.filter(group => group.length > 1);
}

function getPhotoTagDuplicateGroups() {
  if (photoTagDuplicateCache) return photoTagDuplicateCache;

  const byChecksum = new Map();
  const byName = new Map();

  photoTagFiles.forEach(file => {
    const checksum = String(file.md5Checksum || '').trim();
    if (checksum) {
      const key = `${checksum}:${file.size || ''}`;
      if (!byChecksum.has(key)) byChecksum.set(key, []);
      byChecksum.get(key).push(file);
    }

    const name = normalizePhotoTagDuplicateName(file.name);
    if (name) {
      if (!byName.has(name)) byName.set(name, []);
      byName.get(name).push(file);
    }
  });

  photoTagDuplicateCache = {
    exact: Array.from(byChecksum.values()).filter(group => group.length > 1),
    near: getPhotoTagNearDuplicateGroups(),
    name: Array.from(byName.values()).filter(group => group.length > 1)
  };

  return photoTagDuplicateCache;
}

function findPhotoTagDuplicateGroup(groups, file) {
  return groups.find(group => group.some(item => item.id === file.id));
}

function getPhotoTagDuplicateGroup(file) {
  if (!file) return null;
  const groups = getPhotoTagDuplicateGroups();
  const exact = findPhotoTagDuplicateGroup(groups.exact, file);
  if (exact) return { type: 'exact', files: exact };

  const near = findPhotoTagDuplicateGroup(groups.near, file);
  if (near) return { type: 'near', files: near };

  const sameName = findPhotoTagDuplicateGroup(groups.name, file);
  if (sameName) return { type: 'name', files: sameName };

  return null;
}

function getPhotoTagDuplicateCount() {
  const ids = new Set();
  const groups = getPhotoTagDuplicateGroups();
  [...groups.exact, ...groups.near, ...groups.name].forEach(group => {
    group.forEach(file => ids.add(file.id));
  });
  return ids.size;
}

function formatPhotoTagCount(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function getPhotoTagFilterLabel() {
  return PHOTO_TAGS_FILTER_LABELS[photoTagFilter] || 'Current filter';
}

function getPhotoTagVisibleSummary(visiblePhotoCount, visibleVideoCount, totalPhotoCount) {
  const filterLabel = getPhotoTagFilterLabel();
  const context = photoTagSearch
    ? 'matching search'
    : photoTagFilter === 'all'
      ? 'in this folder'
      : `in ${filterLabel}`;
  const totalNote = (photoTagFilter !== 'all' || photoTagSearch) && totalPhotoCount !== visiblePhotoCount
    ? ` (${totalPhotoCount} total)`
    : '';
  const videoText = visibleVideoCount > 0 ? ` + ${formatPhotoTagCount(visibleVideoCount, 'YouTube video')}` : '';

  return `${formatPhotoTagCount(visiblePhotoCount, 'photo')} ${context}${totalNote}${videoText}`;
}

function renderPhotoTagSummary(visible = getVisiblePhotoTagFiles(), visibleVideos = getVisiblePhotoTagYoutubeVideos()) {
  const summary = document.getElementById('fd-photo-tag-summary');
  if (!summary) return;

  const youtubeVideos = getPhotoTagYoutubeVideos();
  const taggedCount = photoTagFiles.filter(isPhotoTagged).length;
  const untaggedCount = Math.max(0, photoTagFiles.length - taggedCount);
  const needsReviewCount = photoTagFiles.filter(file => getPhotoTagStatus(file) === 'needs-review').length;
  const approvedCount = photoTagFiles.filter(file => getPhotoTagStatus(file) === 'approved').length;
  const needsRenameCount = photoTagFiles.filter(file => getPhotoTagRenameMessage(file)).length;
  const duplicateCount = getPhotoTagDuplicateCount();
  const draftCount = getPhotoTagDraftCount();
  const selectedCount = photoTagSelected.size;

  const chips = [
    { label: 'Working on', value: getPhotoTagVisibleSummary(visible.length, visibleVideos.length, photoTagFiles.length), variant: 'primary' },
    { label: 'Photos left', value: formatPhotoTagCount(untaggedCount, 'photo'), variant: untaggedCount > 0 ? 'warn' : 'done' },
    { label: 'Drafts ready', value: formatPhotoTagCount(draftCount, 'photo'), variant: draftCount > 0 ? 'info' : 'muted' },
    { label: 'Suggestions', value: String(getPendingPhotoTagSuggestionCount()), variant: getPendingPhotoTagSuggestionCount() > 0 ? 'info' : 'muted' },
    { label: 'Needs retag', value: formatPhotoTagCount(needsReviewCount, 'photo'), variant: needsReviewCount > 0 ? 'warn' : 'muted' },
    { label: 'Needs rename', value: formatPhotoTagCount(needsRenameCount, 'photo'), variant: needsRenameCount > 0 ? 'warn' : 'muted' },
    { label: 'Duplicates', value: formatPhotoTagCount(duplicateCount, 'photo'), variant: duplicateCount > 0 ? 'danger' : 'muted' },
    { label: 'Approved', value: `${approvedCount}/${photoTagFiles.length} photos`, variant: 'done' }
  ];

  if (selectedCount > 0) {
    chips.splice(1, 0, { label: 'Selected', value: formatPhotoTagCount(selectedCount, 'photo'), variant: 'info' });
  }

  if (youtubeVideos.length > 0) {
    chips.push({ label: 'YouTube', value: formatPhotoTagCount(youtubeVideos.length, 'video'), variant: 'muted' });
  }

  summary.innerHTML = chips.map(chip => `
    <span class="fd-summary-chip fd-summary-chip--${chip.variant}">
      <span class="fd-summary-chip-label">${escapePhotoTagHtml(chip.label)}</span>
      <strong>${escapePhotoTagHtml(chip.value)}</strong>
    </span>
  `).join('');
}

function getPhotoTagNewestDuplicateName(files) {
  return files
    .filter(file => getPhotoTagDriveRecencyMs(file))
    .sort((a, b) => getPhotoTagDriveRecencyMs(b) - getPhotoTagDriveRecencyMs(a))[0]?.name || '';
}

function getPhotoTagDuplicateMessage(file) {
  const group = getPhotoTagDuplicateGroup(file);
  if (!group) return '';

  const names = group.files
    .filter(item => item.id !== file.id)
    .slice(0, 3)
    .map(item => item.name)
    .join(', ');
  const suffix = group.files.length > 4 ? ` and ${group.files.length - 4} more` : '';
  const newestName = getPhotoTagNewestDuplicateName(group.files);
  const newestText = newestName ? ` Newest Drive copy: ${newestName}.` : '';

  if (group.type === 'exact') {
    return `Possible exact duplicate: ${group.files.length} Drive files share the same content fingerprint. Other copy: ${names}${suffix}.${newestText} Review thumbnails and choose which file to Move to Trash.`;
  }

  if (group.type === 'near') {
    return `Possible near duplicate: ${group.files.length} Drive files have photo-taken times within about 2 minutes and similar file sizes. Other copy: ${names}${suffix}.${newestText} Review thumbnails and choose which file to Move to Trash.`;
  }

  return `Possible duplicate name: ${group.files.length} Drive files have this same file name. Other copy: ${names}${suffix}. Review thumbnails and choose which file to Move to Trash.`;
}

function getVisiblePhotoTagFiles() {
  return photoTagFiles.filter(file => {
    const tag = getPhotoTagRecord(file.id);
    const tagged = isPhotoTagged(file);
    const status = getPhotoTagStatus(file);

    if (photoTagFilter === 'untagged' && tagged) return false;
    if (photoTagFilter === 'tagged' && !tagged) return false;
    if (photoTagFilter === 'approved' && status !== 'approved') return false;
    if (photoTagFilter === 'needs-review' && status !== 'needs-review') return false;
    if (photoTagFilter === 'draft' && status !== 'draft') return false;
    if (photoTagFilter === 'needs-rename' && !getPhotoTagRenameMessage(file)) return false;
    if (photoTagFilter === 'duplicates' && !getPhotoTagDuplicateGroup(file)) return false;
    if (photoTagFilter === 'suggestions' && getPendingPhotoTagSuggestionsForTarget(file.id).length === 0) return false;

    if (!photoTagSearch) return true;

    const draftLabels = getPhotoTagMembersForKeys(getEffectivePhotoTagPeople(file.id, tag))
      .map(member => member.displayTagLabel || member.tagLabel)
      .join(' ');
    const labels = draftLabels || uniquePhotoTagLabels([...(tag?.peopleLabels || []), ...(tag?.otherPeopleLabels || []), ...(tag?.people || []).map(getPhotoTagLabel)]).join(' ');
    return `${file.name} ${file.suggestedName || ''} ${labels}`.toLowerCase().includes(photoTagSearch);
  });
}

function renderPhotoTags() {
  photoTagDuplicateCache = null;
  const loading = document.getElementById('fd-photo-tags-loading');
  const grid = document.getElementById('fd-photo-tag-grid');
  const empty = document.getElementById('fd-photo-tags-empty');
  const summary = document.getElementById('fd-photo-tag-summary');

  if (loading) loading.style.display = 'none';
  if (!grid || !empty || !summary) return;

  const visible = getVisiblePhotoTagFiles();
  const visibleVideos = getVisiblePhotoTagYoutubeVideos();
  const totalVisible = visible.length + visibleVideos.length;

  renderPhotoTagSummary(visible, visibleVideos);

  grid.innerHTML = renderYoutubeAddCard() + visibleVideos.map(renderYoutubeVideoCard).join('') + visible.map(renderPhotoTagCard).join('');

  if (totalVisible === 0) {
    empty.style.display = 'block';
    renderBulkBar();
    return;
  }

  empty.style.display = 'none';
  renderBulkBar();
}

function renderPhotoTagCard(file) {
  const tag = getPhotoTagRecord(file.id);
  const selectedPeopleList = getEffectivePhotoTagPeople(file.id, tag);
  const selectedPeople = new Set(selectedPeopleList);
  const status = getPhotoTagStatus(file);
  const selectedMembersList = getPhotoTagMembersForKeys(selectedPeopleList);
  const statusText = PHOTO_TAGS_STATUS_LABELS[status] || status;
  const displayLabels = getPhotoTagDisplayLabels(tag || file, selectedMembersList);
  const labels = displayLabels.length
    ? displayLabels.join(', ')
    : selectedPeople.size
      ? Array.from(selectedPeople).map(getPhotoTagLabel).join(', ')
      : 'No people assigned yet';
  const reviewReason = getPhotoTagReviewReason(file, tag);
  const renameMessage = getPhotoTagRenameMessage(file);
  const duplicateMessage = getPhotoTagDuplicateMessage(file);
  const suggestionPanel = renderPhotoTagSuggestionPanel(file.id);
  const publishText = status === 'needs-review' ? 'Approve Tags' : 'Save & Publish';
  const renameButton = renameMessage && file.suggestedName
    ? `<button type="button" class="fd-mini-btn rename" onclick="renamePhotoTagFile('${escapePhotoTagHtml(file.id)}')">Rename in Drive</button>`
    : '';
  const replaceControl = file.type === 'image'
    ? `<input type='file' class='fd-replace-input' accept='${PHOTO_TAGS_IMAGE_REPLACE_ACCEPT}' onchange='replacePhotoTagFile(&#039;${escapePhotoTagHtml(file.id)}&#039;, this)'>
      <button type='button' class='fd-mini-btn replace' onclick='this.previousElementSibling.click()'>Replace Photo</button>`
    : '';
  const isSelected = photoTagSelected.has(file.id);

  return `
    <article class="fd-photo-tag-card${isSelected ? ' fd-selected' : ''}" data-file-id="${escapePhotoTagHtml(file.id)}">
      <input type="checkbox" class="fd-card-select" title="Select photo"
        ${isSelected ? 'checked' : ''}
        onchange="toggleCardSelection('${escapePhotoTagHtml(file.id)}', this.checked)">
      <img class="fd-photo-tag-preview" src="${photoTagThumbnail(file)}" alt="${escapePhotoTagHtml(file.name)}" loading="lazy">
      <div class="fd-photo-tag-body">
        <p class="fd-photo-tag-name">${escapePhotoTagHtml(file.name)}</p>
        <div class="fd-photo-tag-meta">
          <span class="fd-tag-status ${escapePhotoTagHtml(status)}">${escapePhotoTagHtml(statusText)}</span>
          <span class="fd-tag-status untagged">${escapePhotoTagHtml(file.type)}</span>
        </div>
        <p class="fd-tag-summary">${escapePhotoTagHtml(labels)}</p>
        ${renameMessage ? `<p class="fd-tag-rename-note">${escapePhotoTagHtml(renameMessage)}</p>` : ''}
        ${duplicateMessage ? `<p class="fd-tag-duplicate-note">${escapePhotoTagHtml(duplicateMessage)}</p>` : ''}
        ${reviewReason ? `<p class="fd-tag-review-note">${escapePhotoTagHtml(reviewReason)}</p>` : ''}
        ${suggestionPanel}

        <div class="fd-tagging-area">
          <input type="text"
            class="fd-tag-search-input fd-person-tag-input"
            placeholder="Type name or 'name, name2' + Enter"
            oninput="handleTagAutocomplete(this, '${escapePhotoTagHtml(file.id)}')"
            onfocus="handleTagAutocomplete(this, '${escapePhotoTagHtml(file.id)}')"
            onkeydown="handleTagAutocompleteKeydown(event, this, '${escapePhotoTagHtml(file.id)}')">
          <div class="fd-tag-suggestions" id="suggestions-${escapePhotoTagHtml(file.id)}"></div>
        </div>

        <div class="fd-person-chip-wrap" id="chips-${escapePhotoTagHtml(file.id)}" aria-label="People in this photo">
          ${selectedMembersList.map(member => `
            <button
              type="button"
              class="fd-person-chip selected"
              data-file-id="${escapePhotoTagHtml(file.id)}"
              data-person-key="${escapePhotoTagHtml(member.tagKey)}"
              onclick="removeTagChip(this)">
              ${escapePhotoTagHtml(member.displayTagLabel || member.tagLabel)}
            </button>
          `).join('')}
        </div>
        <div class="fd-photo-tag-actions">
          ${replaceControl}
          ${renameButton}
          <button type="button" class="fd-mini-btn" onclick="savePhotoTag('${escapePhotoTagHtml(file.id)}')">${escapePhotoTagHtml(publishText)}</button>
          <button type="button" class="fd-mini-btn secondary" onclick="clearPhotoTag('${escapePhotoTagHtml(file.id)}')">Clear Tags</button>
          <button type="button" class="fd-mini-btn danger" onclick="trashPhotoTagFile('${escapePhotoTagHtml(file.id)}')">Move Photo to Trash</button>
        </div>
      </div>
    </article>
  `;
}

function renderYoutubeVideoCard(video) {
  const recordId = video.id;
  const selectedPeople = new Set(video.people || []);
  const selectedMembersList = photoTagMembers.filter(member => isMemberSelectedForTag(video, member));
  const displayLabels = getPhotoTagDisplayLabels(video, selectedMembersList);
  const labels = displayLabels.length
    ? displayLabels.join(', ')
    : selectedPeople.size
      ? Array.from(selectedPeople).map(getPhotoTagLabel).join(', ')
      : 'No people assigned yet';
  const status = getYoutubeVideoTagStatus(video);
  const statusText = PHOTO_TAGS_STATUS_LABELS[status] || status;
  const youtubeId = video.youtubeId || '';
  const thumbnail = video.youtubeThumbnail || `https://i.ytimg.com/vi/${encodeURIComponent(youtubeId)}/hqdefault.jpg`;
  const title = video.youtubeTitle || `Video ID: ${youtubeId}`;
  const suggestionPanel = renderPhotoTagSuggestionPanel(recordId);

  return `
    <article class="fd-photo-tag-card fd-youtube-video-card" data-file-id="${escapePhotoTagHtml(recordId)}">
      <img class="fd-photo-tag-preview" src="${escapePhotoTagHtml(thumbnail)}" alt="${escapePhotoTagHtml(title)}" loading="lazy">
      <div class="fd-photo-tag-body">
        <p class="fd-photo-tag-name">${escapePhotoTagHtml(title)}</p>
        <div class="fd-photo-tag-meta">
          <span class="fd-tag-status ${escapePhotoTagHtml(status)}">${escapePhotoTagHtml(statusText)}</span>
          <span class="fd-tag-status untagged">YouTube video</span>
        </div>
        <p class="fd-tag-summary">${escapePhotoTagHtml(labels)}</p>
        ${suggestionPanel}

        <div class="fd-tagging-area">
          <input type="text"
            class="fd-tag-search-input fd-youtube-id-input"
            value="${escapePhotoTagHtml(youtubeId)}"
            placeholder="YouTube URL or video ID"
            oninput="handleExistingYoutubeUrlInput(this, '${escapePhotoTagHtml(recordId)}')">
        </div>
        <div class="fd-yt-existing-preview">
          <img class="fd-yt-preview-thumb fd-yt-existing-preview-thumb" src="${escapePhotoTagHtml(thumbnail)}" alt="YouTube thumbnail">
          <p class="fd-yt-preview-title fd-yt-existing-preview-title">${escapePhotoTagHtml(title)}</p>
        </div>

        <div class="fd-person-chip-wrap" id="chips-${escapePhotoTagHtml(recordId)}" aria-label="People in this video">
          ${selectedMembersList.map(member => `
            <button
              type="button"
              class="fd-person-chip selected"
              data-file-id="${escapePhotoTagHtml(recordId)}"
              data-person-key="${escapePhotoTagHtml(member.tagKey)}"
              onclick="removeTagChip(this)">
              ${escapePhotoTagHtml(member.displayTagLabel || member.tagLabel)}
            </button>
          `).join('')}
        </div>
        <div class="fd-tagging-area">
          <input type="text"
            class="fd-tag-search-input fd-person-tag-input"
            placeholder="Tag people..."
            oninput="handleTagAutocomplete(this, '${escapePhotoTagHtml(recordId)}')"
            onfocus="handleTagAutocomplete(this, '${escapePhotoTagHtml(recordId)}')"
            onkeydown="handleTagAutocompleteKeydown(event, this, '${escapePhotoTagHtml(recordId)}')">
          <div class="fd-tag-suggestions" id="suggestions-${escapePhotoTagHtml(recordId)}"></div>
        </div>
        <div class="fd-photo-tag-actions">
          <button type="button" class="fd-mini-btn" onclick="saveYoutubeVideoTags('${escapePhotoTagHtml(recordId)}')">Save &amp; Publish</button>
          <button type="button" class="fd-mini-btn danger" onclick="removeYoutubeVideo('${escapePhotoTagHtml(recordId)}')">Remove Video</button>
        </div>
      </div>
    </article>
  `;
}

function handleTagAutocomplete(input, fileId) {
  const suggestionsDiv = document.getElementById(`suggestions-${fileId}`);
  const chipsWrap = document.getElementById(`chips-${fileId}`);
  if (!suggestionsDiv || !chipsWrap) return;

  if (input.value.includes(',')) {
    parseBatchTagInput(input.value, fileId, true);
    return;
  }

  const term = input.value.trim().toLowerCase();

  const selectedKeys = Array.from(chipsWrap.querySelectorAll('.fd-person-chip.selected'))
    .map(chip => chip.dataset.personKey);

  const matches = photoTagMembers.filter(m => {
    if (selectedKeys.includes(m.tagKey)) return false;
    if (!term) return false;
    return (m.displayTagLabel || m.tagLabel).toLowerCase().includes(term);
  });

  if (matches.length === 0 || !term) {
    suggestionsDiv.style.display = 'none';
    suggestionsDiv.innerHTML = '';
    suggestionsDiv.dataset.highlightIndex = '-1';
    return;
  }

  suggestionsDiv.dataset.highlightIndex = '0';
  suggestionsDiv.innerHTML = matches.slice(0, 8).map((m, i) => `
    <div class="fd-tag-suggestion-item${i === 0 ? ' highlighted' : ''}"
         data-index="${i}"
         onclick="addTagChip('${fileId}', '${escapePhotoTagHtml(m.tagKey)}', '${escapePhotoTagHtml(m.displayTagLabel || m.tagLabel)}')">
      ${escapePhotoTagHtml(m.displayTagLabel || m.tagLabel)}
    </div>
  `).join('');

  suggestionsDiv.style.display = 'block';
}

function addTagChip(fileId, tagKey, displayLabel) {
  const chipsWrap = document.getElementById(`chips-${fileId}`);
  const input = document.querySelector(`.fd-photo-tag-card[data-file-id="${CSS.escape(fileId)}"] .fd-person-tag-input`);
  const suggestionsDiv = document.getElementById(`suggestions-${fileId}`);

  if (!chipsWrap) return;

  const exists = chipsWrap.querySelector(`[data-person-key="${CSS.escape(tagKey)}"]`);
  if (!exists) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fd-person-chip selected';
    btn.dataset.fileId = fileId;
    btn.dataset.personKey = tagKey;
    btn.textContent = displayLabel;
    btn.onclick = function() { removeTagChip(this); };
    chipsWrap.appendChild(btn);
  }

  if (input) {
    input.value = '';
    input.focus();
  }
  if (suggestionsDiv) {
    suggestionsDiv.style.display = 'none';
  }
  updatePhotoTagDraftFromChips(fileId);
}

function removeTagChip(button) {
  const fileId = button?.dataset?.fileId;
  button.remove();
  if (fileId) updatePhotoTagDraftFromChips(fileId);
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.fd-tagging-area')) {
    document.querySelectorAll('.fd-tag-suggestions').forEach(el => el.style.display = 'none');
  }
});

function handleTagAutocompleteKeydown(event, input, fileId) {
  const suggestionsDiv = document.getElementById(`suggestions-${fileId}`);
  const isOpen = suggestionsDiv && suggestionsDiv.style.display !== 'none' && suggestionsDiv.innerHTML.trim();
  const items = isOpen ? Array.from(suggestionsDiv.querySelectorAll('.fd-tag-suggestion-item')) : [];

  if (event.key === 'Enter') {
    event.preventDefault();
    if (input.value.includes(',')) {
      parseBatchTagInput(input.value, fileId);
      return;
    }
    if (isOpen && items.length > 0) {
      const idx = Math.max(0, parseInt(suggestionsDiv.dataset.highlightIndex || '0', 10));
      (items[idx] || items[0]).click();
    }
    return;
  }

  if (event.key === 'Tab' && isOpen && items.length > 0) {
    event.preventDefault();
    const idx = Math.max(0, parseInt(suggestionsDiv.dataset.highlightIndex || '0', 10));
    (items[idx] || items[0]).click();
    return;
  }

  if (event.key === 'Escape') {
    if (suggestionsDiv) suggestionsDiv.style.display = 'none';
    return;
  }

  if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && isOpen && items.length > 0) {
    event.preventDefault();
    let idx = parseInt(suggestionsDiv.dataset.highlightIndex || '0', 10);
    idx = event.key === 'ArrowDown'
      ? Math.min(idx + 1, items.length - 1)
      : Math.max(idx - 1, 0);
    suggestionsDiv.dataset.highlightIndex = String(idx);
    items.forEach((item, i) => item.classList.toggle('highlighted', i === idx));
  }
}

function normalizePhotoTagToken(value) {
  return String(value || '')
    .replace(/[-_]+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function getPhotoTagMemberBatchValues(member) {
  return [
    member.displayTagLabel,
    member.tagLabel,
    member.personSlug,
    member.tagKey,
    member.id
  ].filter(Boolean).map(normalizePhotoTagToken);
}

function findPhotoTagMemberForBatchToken(token, selectedKeys) {
  const normalized = normalizePhotoTagToken(token);
  if (!normalized) return null;

  const candidates = photoTagMembers.filter(member => !selectedKeys.includes(member.tagKey));
  return candidates.find(member => getPhotoTagMemberBatchValues(member).some(value => value === normalized))
    || candidates.find(member => getPhotoTagMemberBatchValues(member).some(value => value.includes(normalized)));
}

function parseBatchTagInput(rawValue, fileId, keepLastPartial = false) {
  const chipsWrap = document.getElementById(`chips-${fileId}`);
  const input = document.querySelector(`.fd-photo-tag-card[data-file-id="${CSS.escape(fileId)}"] .fd-person-tag-input`);
  const suggestionsDiv = document.getElementById(`suggestions-${fileId}`);
  if (!chipsWrap) return;

  const value = String(rawValue || '');
  const parts = value.split(',');
  const trailing = keepLastPartial && !value.endsWith(',') ? parts.pop() : '';
  const selectedKeys = Array.from(chipsWrap.querySelectorAll('.fd-person-chip.selected'))
    .map(chip => chip.dataset.personKey);

  parts.map(t => t.trim()).filter(Boolean).forEach(token => {
    const match = findPhotoTagMemberForBatchToken(token, selectedKeys);
    if (match && !chipsWrap.querySelector(`[data-person-key="${CSS.escape(match.tagKey)}"]`)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fd-person-chip selected';
      btn.dataset.fileId = fileId;
      btn.dataset.personKey = match.tagKey;
      btn.textContent = match.displayTagLabel || match.tagLabel;
      btn.onclick = function() { removeTagChip(this); };
      chipsWrap.appendChild(btn);
      selectedKeys.push(match.tagKey);
    }
  });

  if (input) {
    input.value = keepLastPartial ? trailing.trimStart() : '';
    input.focus();
  }
  if (suggestionsDiv) suggestionsDiv.style.display = 'none';
  updatePhotoTagDraftFromChips(fileId);
}

function buildPhotoTagPayload(file, selectedPeople, options = {}) {
  const normalizedPeople = normalizePhotoTagPeopleKeys(selectedPeople);
  const selectedPeopleDetails = normalizedPeople
    .map(key => getPhotoTagMemberOrSuggestionPerson(key, options.suggestion))
    .filter(Boolean);
  const otherPeopleLabels = uniquePhotoTagLabels(options.otherPeopleLabels || []);

  return {
    driveFileId: file.id,
    driveFolderId: getPhotoTagFolderId(),
    ...buildPhotoTagFileMetadataFields(file),
    name: file.name,
    mimeType: file.mimeType,
    type: file.type,
    people: normalizedPeople,
    peopleAliases: selectedPeopleDetails.map(person => person.personSlug).filter(Boolean),
    peopleLabels: selectedPeopleDetails.map(person => person.tagLabel).filter(Boolean),
    otherPeopleLabels,
    personIds: selectedPeopleDetails.map(person => person.personId).filter(Boolean),
    albums: [getPhotoTagAlbumSlug()],
    source: 'manual',
    status: 'approved',
    reviewReason: null,
    drive: buildPhotoTagDriveMetadata(file),
    approvedAt: window._fb.serverTimestamp(),
    updatedAt: window._fb.serverTimestamp()
  };
}

function updateLocalPhotoTagRecord(fileId, payload) {
  const existing = getPhotoTagRecord(fileId) || {};
  photoTagRecords.set(fileId, normalizePhotoTagRecord(fileId, {
    ...existing,
    ...payload,
    drive: {
      ...(existing.drive || {}),
      ...(payload.drive || {})
    }
  }));
}

function shouldPublishPhotoTag(file, selectedPeople) {
  const normalizedPeople = normalizePhotoTagPeopleKeys(selectedPeople);
  if (normalizedPeople.length === 0) return false;

  const tag = getPhotoTagRecord(file.id);
  if (getPhotoTagRenameMessage(file)) return true;
  if (!hasSavedTagPeople(tag)) return true;
  if (!haveSamePhotoTagPeople(normalizedPeople, getSavedPhotoTagPeopleKeys(tag))) return true;

  return getPhotoTagStatus(file) !== 'approved';
}

async function writePhotoTagRecord(file, selectedPeople, options = {}) {
  const payload = buildPhotoTagPayload(file, selectedPeople, options);

  if (!photoTagRecords.has(file.id)) {
    payload.createdAt = window._fb.serverTimestamp();
  }

  await window._fb.setDoc(
    window._fb.doc(window._fb.db, PHOTO_TAGS_COLLECTION, file.id),
    payload,
    { merge: true }
  );

  updateLocalPhotoTagRecord(file.id, payload);
  clearPhotoTagDraft(file.id);
  return payload;
}

async function savePhotoTag(fileId) {
  const file = photoTagFiles.find(item => item.id === fileId);
  const card = document.querySelector(`.fd-photo-tag-card[data-file-id="${CSS.escape(fileId)}"]`);
  if (!file || !card) return;

  const selectedPeople = getPhotoTagChipPeople(fileId);
  setPhotoTagDraftPeople(fileId, selectedPeople);

  if (selectedPeople.length === 0) {
    fdToast('Select at least one person before publishing.');
    return;
  }

  if (!shouldPublishPhotoTag(file, selectedPeople)) {
    clearPhotoTagDraft(file.id);
    fdToast('No tag changes to publish.');
    renderPhotoTags();
    return;
  }

  card.style.opacity = '.65';

  try {
    await writePhotoTagRecord(file, selectedPeople);
    fdToast('Photo tags published.');
    renderPhotoTags();
  } catch (error) {
    console.error('Photo tag save error:', error);
    fdToast('Could not save photo tags.');
    card.style.opacity = '';
  }
}

async function renamePhotoTagFile(fileId) {
  const file = photoTagFiles.find(item => item.id === fileId);
  const card = document.querySelector(`.fd-photo-tag-card[data-file-id="${CSS.escape(fileId)}"]`);

  if (!file || !card || !file.suggestedName) return;

  if (isPhotoTagStandardName(file)) {
    fdToast('This file already has the right name.');
    return;
  }

  const button = card.querySelector('.fd-mini-btn.rename');
  const originalText = button?.textContent || '';

  if (button) {
    button.disabled = true;
    button.textContent = 'Renaming...';
  }
  card.style.opacity = '.65';

  try {
    const accessToken = await window.fdGetGoogleDriveAccessToken();
    const renamed = await patchGoogleDriveFileName(file.id, file.suggestedName, accessToken);

    file.name = renamed.name || file.suggestedName;
    file.modifiedTime = renamed.modifiedTime || file.modifiedTime;
    photoTagFiles = sortPhotoTagFiles(assignPhotoTagSuggestedNames(photoTagFiles));

    await refreshPhotoTagRecordAfterDriveRename(file);

    fdToast('Google Drive file renamed.');
    renderPhotoTags();
  } catch (error) {
    console.error('Photo rename error:', error);
    fdToast(error.message || 'Could not rename Google Drive file.');
    card.style.opacity = '';
    if (button) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}

async function replacePhotoTagFile(fileId, input) {
  const selectedFile = input?.files?.[0];
  const file = photoTagFiles.find(item => item.id === fileId);
  const card = document.querySelector(`.fd-photo-tag-card[data-file-id='${CSS.escape(fileId)}']`);

  if (!selectedFile || !file || !card) return;

  if (!isSupportedPhotoReplacement(selectedFile)) {
    fdToast('Choose a JPEG, PNG, WebP, HEIC, HEIF, TIFF, or DNG photo.');
    input.value = '';
    return;
  }

  if (selectedFile.size > PHOTO_TAGS_MAX_REPLACE_UPLOAD_BYTES) {
    fdToast('Choose a photo under 31 MB.');
    input.value = '';
    return;
  }

  const confirmed = window.confirm(`Replace ${file.name} with ${selectedFile.name}? The backend will convert/compress it for the website, and existing tags will be kept but marked for review.`);
  if (!confirmed) {
    input.value = '';
    return;
  }

  const button = card.querySelector('.fd-mini-btn.replace');
  const originalText = button?.textContent || '';
  const hadTags = hasSavedTagPeople(getPhotoTagRecord(file.id));

  if (button) {
    button.disabled = true;
    button.textContent = 'Converting...';
  }
  card.style.opacity = '.65';

  try {
    const preparedFile = await preparePhotoTagReplacementUpload(selectedFile, file);

    if (button) button.textContent = 'Uploading...';

    const accessToken = await window.fdGetGoogleDriveAccessToken();
    const updated = await patchGoogleDriveFileContent(file.id, preparedFile, accessToken);

    file.name = updated.name || preparedFile.name;
    file.mimeType = updated.mimeType || preparedFile.type || 'image/jpeg';
    file.type = getPhotoTagMediaTypeFromMime(file.mimeType);
    file.createdTime = updated.createdTime || file.createdTime;
    file.modifiedTime = updated.modifiedTime || new Date().toISOString();
    file.takenTime = updated.imageMediaMetadata?.time || file.takenTime;
    file.md5Checksum = updated.md5Checksum || '';
    file.size = updated.size || String(preparedFile.size || '');

    photoTagFiles = sortPhotoTagFiles(assignPhotoTagSuggestedNames(photoTagFiles));

    await refreshPhotoTagRecordAfterReplacement(file, hadTags);
    clearPhotoTagDraft(file.id);

    fdToast(hadTags ? 'Photo replaced. Review and approve the tags.' : 'Photo replaced.');
    renderPhotoTags();
  } catch (error) {
    console.error('Photo replacement error:', error);
    fdToast(error.message || 'Could not replace this photo.');
    card.style.opacity = '';
    if (button) {
      button.disabled = false;
      button.textContent = originalText;
    }
  } finally {
    if (input) input.value = '';
  }
}

async function clearPhotoTag(fileId) {
  const file = photoTagFiles.find(item => item.id === fileId);
  const card = document.querySelector(`.fd-photo-tag-card[data-file-id="${CSS.escape(fileId)}"]`);

  if (!file || !card) return;

  const hasSavedTags = photoTagRecords.has(file.id);
  const hasDraftTags = getPhotoTagDraftPeople(file.id) !== null;

  if (!hasSavedTags && !hasDraftTags) {
    fdToast('No tags or draft to clear. Photo was not deleted from Drive.');
    return;
  }

  if (!window.confirm(`Clear tags for "${file.name}"?\n\nThis only removes the saved tags or draft for this photo. The Google Drive photo will not be deleted.`)) return;

  card.style.opacity = '.65';

  try {
    if (hasSavedTags) {
      await window._fb.deleteDoc(window._fb.doc(window._fb.db, PHOTO_TAGS_COLLECTION, file.id));
      photoTagRecords.delete(file.id);
    }
    clearPhotoTagDraft(file.id);

    fdToast('Tags cleared. Photo was not deleted from Drive.');
    renderPhotoTags();
  } catch (error) {
    console.error('Photo tag clear error:', error);
    fdToast('Could not clear photo tags. Photo was not deleted from Drive.');
    card.style.opacity = '';
  }
}

async function trashPhotoTagFile(fileId) {
  const file = photoTagFiles.find(item => item.id === fileId);
  if (!file) return;

  if (!window.confirm(`Move "${file.name}" to Drive Trash?\n\nTags will also be removed. You can restore the file from Google Drive Trash within 30 days.`)) return;

  const card = document.querySelector(`.fd-photo-tag-card[data-file-id="${CSS.escape(fileId)}"]`);
  if (card) card.style.opacity = '.65';

  try {
    const accessToken = await window.fdGetGoogleDriveAccessToken();
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ trashed: true })
      }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error?.message || 'Could not move file to Drive Trash.');
    }

    if (photoTagRecords.has(fileId)) {
      await window._fb.deleteDoc(window._fb.doc(window._fb.db, PHOTO_TAGS_COLLECTION, fileId));
      photoTagRecords.delete(fileId);
    }

    photoTagFiles = photoTagFiles.filter(f => f.id !== fileId);
    photoTagSelected.delete(fileId);
    clearPhotoTagDraft(fileId);
    fdToast(`"${file.name}" moved to Drive Trash.`);
    renderPhotoTags();
  } catch (error) {
    console.error('Trash photo error:', error);
    fdToast(error.message || 'Could not move file to Drive Trash.');
    if (card) card.style.opacity = '';
  }
}

function toggleCardSelection(fileId, checked) {
  if (checked) {
    photoTagSelected.add(fileId);
  } else {
    photoTagSelected.delete(fileId);
  }
  const card = document.querySelector(`.fd-photo-tag-card[data-file-id="${CSS.escape(fileId)}"]`);
  if (card) card.classList.toggle('fd-selected', checked);
  renderBulkBar();
  renderPhotoTagSummary();
}

function selectAllVisible() {
  getVisiblePhotoTagFiles().forEach(file => photoTagSelected.add(file.id));
  renderPhotoTags();
}

function clearSelection() {
  photoTagSelected.clear();
  renderPhotoTags();
}

function renderBulkBar() {
  let bar = document.getElementById('fd-bulk-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'fd-bulk-bar';
    document.body.appendChild(bar);
  }

  const selectedCount = photoTagSelected.size;
  const draftCount = getPhotoTagDraftCount();

  if (selectedCount === 0 && draftCount === 0) {
    bar.classList.remove('active');
    bar.innerHTML = '';
    return;
  }

  const selectedText = selectedCount > 0 ? `${selectedCount} selected` : '';
  const draftText = draftCount > 0 ? `${draftCount} draft${draftCount !== 1 ? 's' : ''}` : '';
  const countText = [selectedText, draftText].filter(Boolean).join(' + ');
  const selectionButtons = selectedCount > 0 ? `
    <button type="button" class="fd-bulk-link" onclick="clearSelection()">Clear selection</button>
    <button type="button" class="fd-bulk-secondary-btn" id="fd-bulk-rename-btn" onclick="renameSelected()">Rename Selected</button>
    <button type="button" class="fd-bulk-publish-btn" id="fd-bulk-publish-btn" onclick="publishSelected()">Save &amp; Publish Selected</button>
  ` : '';
  const draftButtons = draftCount > 0 ? `
    <button type="button" class="fd-bulk-publish-btn" id="fd-bulk-draft-publish-btn" onclick="publishDrafts()">Save Drafts</button>
    <button type="button" class="fd-bulk-link" onclick="clearPhotoTagDrafts()">Clear drafts</button>
  ` : '';

  bar.innerHTML = `
    <span class="fd-bulk-count">${countText}</span>
    <button type="button" class="fd-bulk-link" onclick="selectAllVisible()">Select all visible</button>
    ${selectionButtons}
    ${draftButtons}
  `;
  bar.classList.add('active');
}

function updateBulkBarProgress(label) {
  const buttons = [
    document.getElementById('fd-bulk-publish-btn'),
    document.getElementById('fd-bulk-draft-publish-btn')
  ].filter(Boolean);

  buttons.forEach(btn => {
    if (label) {
      btn.dataset.originalText = btn.dataset.originalText || btn.textContent;
      btn.textContent = label;
      btn.disabled = true;
    } else {
      btn.textContent = btn.dataset.originalText || (btn.id === 'fd-bulk-draft-publish-btn' ? 'Save Drafts' : 'Save & Publish Selected');
      btn.disabled = false;
      delete btn.dataset.originalText;
    }
  });
}

function updateBulkRenameProgress(label) {
  const btn = document.getElementById('fd-bulk-rename-btn');
  if (!btn) return;
  if (label) {
    btn.textContent = label;
    btn.disabled = true;
  } else {
    btn.textContent = 'Rename Selected';
    btn.disabled = false;
  }
}

function getSelectedPhotoTagFiles() {
  return Array.from(photoTagSelected)
    .map(fileId => photoTagFiles.find(file => file.id === fileId))
    .filter(Boolean);
}

function getPhotoTagFilesNeedingRename(files) {
  return files.filter(file => getPhotoTagRenameMessage(file) && file.suggestedName && !isPhotoTagStandardName(file));
}

async function renameSelected() {
  const needsRename = getPhotoTagFilesNeedingRename(getSelectedPhotoTagFiles());
  if (needsRename.length === 0) {
    fdToast('No selected photos need Drive rename.');
    return;
  }

  updateBulkRenameProgress(`Renaming... (0/${needsRename.length})`);

  try {
    const accessToken = await window.fdGetGoogleDriveAccessToken();
    let renamed = 0;
    let failed = 0;

    for (const file of needsRename) {
      try {
        const result = await patchGoogleDriveFileName(file.id, file.suggestedName, accessToken);
        file.name = result.name || file.suggestedName;
        file.modifiedTime = result.modifiedTime || file.modifiedTime;
        await refreshPhotoTagRecordAfterDriveRename(file);
        renamed++;
      } catch (error) {
        console.warn(`Rename failed for ${file.name}:`, error);
        failed++;
      }
      updateBulkRenameProgress(`Renaming... (${renamed + failed}/${needsRename.length})`);
    }

    photoTagFiles = sortPhotoTagFiles(assignPhotoTagSuggestedNames(photoTagFiles));

    fdToast(failed > 0
      ? `${renamed} renamed, ${failed} failed.`
      : `${renamed} photo${renamed !== 1 ? 's' : ''} renamed in Drive.`);
    renderPhotoTags();
  } catch (error) {
    fdToast(error.message || 'Could not get Drive access to rename files.');
    updateBulkRenameProgress(null);
  }
}
function getSelectedPhotoTagPublishItems() {
  return Array.from(photoTagSelected)
    .map(fileId => photoTagFiles.find(file => file.id === fileId))
    .filter(Boolean)
    .map(file => ({
      file,
      selectedPeople: getEffectivePhotoTagPeople(file.id, getPhotoTagRecord(file.id))
    }));
}

function getDraftPhotoTagPublishItems() {
  return getDirtyPhotoTagDraftFiles().map(file => ({
    file,
    selectedPeople: getEffectivePhotoTagPeople(file.id, getPhotoTagRecord(file.id))
  }));
}

async function publishPhotoTagItems(items, emptyMessage) {
  const candidates = items
    .map(item => ({
      file: item.file,
      selectedPeople: normalizePhotoTagPeopleKeys(item.selectedPeople)
    }))
    .filter(item => item.file && item.selectedPeople.length > 0 && shouldPublishPhotoTag(item.file, item.selectedPeople));

  if (candidates.length === 0) {
    fdToast(emptyMessage || 'No tag changes to publish.');
    updateBulkBarProgress(null);
    return;
  }

  const needsRename = getPhotoTagFilesNeedingRename(candidates.map(item => item.file));
  const failedRenameIds = new Set();
  const failedPublishIds = new Set();

  if (needsRename.length > 0) {
    updateBulkBarProgress(`Renaming... (0/${needsRename.length})`);

    try {
      const accessToken = await window.fdGetGoogleDriveAccessToken();
      let done = 0;

      for (const file of needsRename) {
        try {
          const result = await patchGoogleDriveFileName(file.id, file.suggestedName, accessToken);
          file.name = result.name || file.suggestedName;
          file.modifiedTime = result.modifiedTime || file.modifiedTime;
        } catch (err) {
          console.warn(`Rename failed for ${file.name}:`, err);
          failedRenameIds.add(file.id);
        }

        done++;
        updateBulkBarProgress(`Renaming... (${done}/${needsRename.length})`);
      }

      photoTagFiles = sortPhotoTagFiles(assignPhotoTagSuggestedNames(photoTagFiles));
    } catch (tokenErr) {
      fdToast(tokenErr.message || 'Could not get Drive access to rename files.');
      updateBulkBarProgress(null);
      return;
    }
  }

  const publishQueue = candidates.filter(item => !failedRenameIds.has(item.file.id));

  if (publishQueue.length === 0) {
    fdToast(`No photos published because ${failedRenameIds.size} rename${failedRenameIds.size !== 1 ? 's' : ''} failed.`);
    updateBulkBarProgress(null);
    renderPhotoTags();
    return;
  }

  let published = 0;

  for (const { file, selectedPeople } of publishQueue) {
    updateBulkBarProgress(`Publishing... (${published}/${publishQueue.length})`);

    try {
      await writePhotoTagRecord(file, selectedPeople);
      published++;
    } catch (err) {
      console.error(`Publish failed for ${file.name}:`, err);
      failedPublishIds.add(file.id);
    }
  }

  photoTagSelected = new Set([...failedRenameIds, ...failedPublishIds]);

  const failed = failedPublishIds.size;
  const skippedRenameCount = failedRenameIds.size;
  const skippedText = skippedRenameCount > 0 ? `, ${skippedRenameCount} skipped for rename failure` : '';
  const msg = failed > 0 || skippedRenameCount > 0
    ? `${published} published, ${failed} failed${skippedText}.`
    : `${published} photo${published !== 1 ? 's' : ''} published.`;

  fdToast(msg);
  renderPhotoTags();
}

async function publishSelected() {
  if (photoTagSelected.size === 0) return;
  updateBulkBarProgress('Starting...');
  await publishPhotoTagItems(getSelectedPhotoTagPublishItems(), 'No selected photos have tag changes to publish.');
}

async function publishDrafts() {
  updateBulkBarProgress('Starting...');
  await publishPhotoTagItems(getDraftPhotoTagPublishItems(), 'No draft tag changes to publish.');
}

function renderYoutubeAddCard() {
  return `
    <article class="fd-photo-tag-card fd-yt-add-card" id="fd-yt-add-card" data-file-id="yt-new">
      <button type="button" class="fd-yt-add-header" aria-expanded="false" aria-controls="fd-yt-add-body" onclick="toggleYoutubeAddCard(this)">
        <svg viewBox="0 0 24 24" width="20" height="20"><path fill="#f44336" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-2.75 12.38 12.38 0 0 0-8.71 3.19A12.26 12.26 0 0 0 3.5 16.3a11.93 11.93 0 0 0 .28 2.55A4.83 4.83 0 0 1 6.56 22h10.88a4.83 4.83 0 0 1 2.78-3.15A12.27 12.27 0 0 0 22 10.8a12.16 12.16 0 0 0-2.41-4.11zM10 15V9l5 3-5 3z"/></svg>
        Add YouTube Video
      </button>
      <div class="fd-photo-tag-body" id="fd-yt-add-body" style="display:none">
        <div class="fd-tagging-area" style="margin-top:8px">
          <input type="url"
            id="fd-yt-url-input"
            class="fd-tag-search-input"
            placeholder="Paste YouTube URL or video ID..."
            oninput="handleYoutubeUrlInput(this)">
        </div>
        <div id="fd-yt-preview" style="display:none">
          <img id="fd-yt-preview-thumb" class="fd-yt-preview-thumb" src="" alt="YouTube thumbnail">
          <p id="fd-yt-preview-title" class="fd-yt-preview-title"></p>
        </div>
        <div class="fd-person-chip-wrap" id="chips-yt-new" aria-label="People in this video"></div>
        <div class="fd-tagging-area">
          <input type="text"
            class="fd-tag-search-input fd-person-tag-input"
            placeholder="Tag people..."
            oninput="handleTagAutocomplete(this, 'yt-new')"
            onfocus="handleTagAutocomplete(this, 'yt-new')"
            onkeydown="handleTagAutocompleteKeydown(event, this, 'yt-new')">
          <div class="fd-tag-suggestions" id="suggestions-yt-new"></div>
        </div>
        <div class="fd-photo-tag-actions">
          <button type="button" class="fd-mini-btn" id="fd-yt-save-btn" onclick="submitYoutubeVideo()" disabled>Save &amp; Publish</button>
          <button type="button" class="fd-mini-btn secondary" onclick="clearYoutubeCard()">Clear</button>
        </div>
      </div>
    </article>
  `;
}

function toggleYoutubeAddCard(toggle) {
  const body = document.getElementById('fd-yt-add-body');
  if (!body) return;
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  const button = toggle || document.querySelector('#fd-yt-add-card .fd-yt-add-header');
  if (button) button.setAttribute('aria-expanded', String(!isOpen));
}
function handleYoutubeUrlInput(input) {
  const videoId = parseYoutubeId(input.value);
  const preview = document.getElementById('fd-yt-preview');
  const previewThumb = document.getElementById('fd-yt-preview-thumb');
  const previewTitle = document.getElementById('fd-yt-preview-title');
  const saveBtn = document.getElementById('fd-yt-save-btn');

  if (!videoId) {
    if (preview) preview.style.display = 'none';
    if (saveBtn) saveBtn.disabled = true;
    return;
  }

  if (previewThumb) previewThumb.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  if (previewTitle) previewTitle.textContent = `Video ID: ${videoId}`;
  if (preview) preview.style.display = 'block';
  if (saveBtn) saveBtn.disabled = false;

  fetchYoutubeTitle(videoId).then(title => {
    if (title && previewTitle) previewTitle.textContent = title;
  }).catch(() => {});
}

async function fetchYoutubeTitle(videoId) {
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent('https://www.youtube.com/watch?v=' + videoId)}&format=json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return data.title || null;
}

async function submitYoutubeVideo() {
  const urlInput = document.getElementById('fd-yt-url-input');
  const saveBtn = document.getElementById('fd-yt-save-btn');
  const chipsWrap = document.getElementById('chips-yt-new');
  const previewTitle = document.getElementById('fd-yt-preview-title');
  const previewThumb = document.getElementById('fd-yt-preview-thumb');

  const videoId = parseYoutubeId(urlInput?.value);
  if (!videoId) return fdToast('Please enter a valid YouTube URL.');

  const docId = getPhotoTagYoutubeDocId(videoId);
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving...'; }

  const selectedChips = Array.from(chipsWrap?.querySelectorAll('.fd-person-chip.selected') || []);
  const selectedPeople = selectedChips.map(chip => chip.dataset.personKey).filter(Boolean);
  if (selectedPeople.length === 0) {
    fdToast('Select at least one person before publishing the YouTube video.');
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save & Publish'; }
    return;
  }
  const selectedMembers = selectedPeople.map(key => photoTagMembers.find(m => m.tagKey === key)).filter(Boolean);

  const title = previewTitle?.textContent || '';
  const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  const payload = {
    youtubeId: videoId,
    youtubeThumbnail: thumbnail,
    youtubeTitle: title,
    type: 'video',
    mimeType: 'video/youtube',
    source: 'youtube',
    people: selectedPeople,
    peopleAliases: selectedMembers.map(m => m.personSlug),
    peopleLabels: selectedMembers.map(m => m.tagLabel),
    personIds: selectedMembers.map(m => m.id),
    albums: [getPhotoTagAlbumSlug()],
    status: 'approved',
    reviewReason: null,
    approvedAt: window._fb.serverTimestamp(),
    updatedAt: window._fb.serverTimestamp(),
    createdAt: window._fb.serverTimestamp()
  };

  try {
    await window._fb.setDoc(
      window._fb.doc(window._fb.db, PHOTO_TAGS_COLLECTION, docId),
      payload,
      { merge: true }
    );
    photoTagRecords.set(docId, normalizePhotoTagRecord(docId, payload));
    fdToast('YouTube video saved and published.');
    clearYoutubeCard();
    renderPhotoTags();
  } catch (err) {
    console.error('YouTube save error:', err);
    fdToast(err.message || 'Could not save YouTube video.');
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save & Publish'; }
  }
}

function handleExistingYoutubeUrlInput(input, recordId) {
  const card = document.querySelector(`.fd-photo-tag-card[data-file-id="${CSS.escape(recordId)}"]`);
  const videoId = parseYoutubeId(input.value);
  const previewThumb = card?.querySelector('.fd-yt-existing-preview-thumb');
  const previewTitle = card?.querySelector('.fd-yt-existing-preview-title');

  if (!previewTitle) return;

  if (!videoId) {
    previewTitle.textContent = 'Enter a valid YouTube URL or video ID.';
    previewTitle.dataset.youtubeTitle = '';
    return;
  }

  if (previewThumb) previewThumb.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  previewTitle.textContent = `Video ID: ${videoId}`;
  previewTitle.dataset.youtubeTitle = '';

  fetchYoutubeTitle(videoId).then(title => {
    if (title && previewTitle) {
      previewTitle.textContent = title;
      previewTitle.dataset.youtubeTitle = title;
    }
  }).catch(() => {});
}

async function writeYoutubeTagRecordFromSuggestion(video, selectedPeople, otherPeopleLabels = [], suggestion = null) {
  const normalizedPeople = normalizePhotoTagPeopleKeys(selectedPeople);
  const selectedPeopleDetails = normalizedPeople
    .map(key => getPhotoTagMemberOrSuggestionPerson(key, suggestion))
    .filter(Boolean);
  const payload = {
    youtubeId: video.youtubeId,
    youtubeThumbnail: video.youtubeThumbnail || `https://i.ytimg.com/vi/${encodeURIComponent(video.youtubeId || '')}/hqdefault.jpg`,
    youtubeTitle: video.youtubeTitle || '',
    type: 'video',
    mimeType: 'video/youtube',
    source: 'youtube',
    people: normalizedPeople,
    peopleAliases: selectedPeopleDetails.map(person => person.personSlug).filter(Boolean),
    peopleLabels: selectedPeopleDetails.map(person => person.tagLabel).filter(Boolean),
    otherPeopleLabels: uniquePhotoTagLabels(otherPeopleLabels),
    personIds: selectedPeopleDetails.map(person => person.personId).filter(Boolean),
    albums: Array.isArray(video.albums) && video.albums.length ? video.albums : [getPhotoTagAlbumSlug()],
    status: 'approved',
    reviewReason: null,
    approvedAt: window._fb.serverTimestamp(),
    updatedAt: window._fb.serverTimestamp(),
    createdAt: video.createdAt || window._fb.serverTimestamp()
  };

  await window._fb.setDoc(
    window._fb.doc(window._fb.db, PHOTO_TAGS_COLLECTION, video.id),
    payload,
    { merge: true }
  );

  photoTagRecords.set(video.id, normalizePhotoTagRecord(video.id, {
    ...video,
    ...payload,
    updatedAt: video.updatedAt
  }));
}
async function saveYoutubeVideoTags(recordId) {
  const video = getPhotoTagRecord(recordId);
  const card = document.querySelector(`.fd-photo-tag-card[data-file-id="${CSS.escape(recordId)}"]`);
  if (!video || !card || !isYoutubePhotoTagRecord(video)) return;

  const idInput = card.querySelector('.fd-youtube-id-input');
  const selectedChips = Array.from(card.querySelectorAll('.fd-person-chip.selected'));
  const selectedPeople = selectedChips.map(chip => chip.dataset.personKey).filter(Boolean);
  const youtubeId = parseYoutubeId(idInput?.value || video.youtubeId);

  if (!youtubeId) {
    fdToast('Enter a valid YouTube URL or video ID.');
    return;
  }

  if (selectedPeople.length === 0) {
    fdToast('Select at least one person before publishing the YouTube video.');
    return;
  }

  const button = card.querySelector('.fd-mini-btn:not(.danger)');
  const originalText = button?.textContent || '';
  const selectedMembers = selectedPeople.map(key => photoTagMembers.find(member => member.tagKey === key)).filter(Boolean);
  const previewTitle = card.querySelector('.fd-yt-existing-preview-title');
  let title = previewTitle?.dataset.youtubeTitle || previewTitle?.textContent || video.youtubeTitle || '';

  if (!title || title.startsWith('Video ID:') || youtubeId !== video.youtubeId) {
    title = await fetchYoutubeTitle(youtubeId).catch(() => null) || `Video ID: ${youtubeId}`;
  }

  const newDocId = getPhotoTagYoutubeDocId(youtubeId);
  const thumbnail = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
  const payload = {
    youtubeId,
    youtubeThumbnail: thumbnail,
    youtubeTitle: title,
    type: 'video',
    mimeType: 'video/youtube',
    source: 'youtube',
    people: selectedPeople,
    peopleAliases: selectedMembers.map(member => member.personSlug),
    peopleLabels: selectedMembers.map(member => member.tagLabel),
    personIds: selectedMembers.map(member => member.id),
    albums: [getPhotoTagAlbumSlug()],
    status: 'approved',
    reviewReason: null,
    approvedAt: window._fb.serverTimestamp(),
    updatedAt: window._fb.serverTimestamp(),
    createdAt: video.createdAt || window._fb.serverTimestamp()
  };

  if (button) {
    button.disabled = true;
    button.textContent = 'Saving...';
  }
  card.style.opacity = '.65';

  try {
    await window._fb.setDoc(
      window._fb.doc(window._fb.db, PHOTO_TAGS_COLLECTION, newDocId),
      payload,
      { merge: true }
    );

    if (newDocId !== recordId) {
      await window._fb.deleteDoc(window._fb.doc(window._fb.db, PHOTO_TAGS_COLLECTION, recordId));
      photoTagRecords.delete(recordId);
    }

    photoTagRecords.set(newDocId, normalizePhotoTagRecord(newDocId, payload));
    fdToast(newDocId === recordId ? 'YouTube video tags published.' : 'YouTube video replaced and published.');
    renderPhotoTags();
  } catch (error) {
    console.error('YouTube video update error:', error);
    fdToast(error.message || 'Could not save YouTube video.');
    card.style.opacity = '';
    if (button) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}

async function removeYoutubeVideo(recordId) {
  const video = getPhotoTagRecord(recordId);
  if (!video || !isYoutubePhotoTagRecord(video)) return;

  const title = video.youtubeTitle || video.youtubeId || 'this YouTube video';
  if (!window.confirm(`Remove "${title}" from the website?\n\nThis deletes the Photo Tags record only. It will not delete anything from YouTube.`)) return;

  const card = document.querySelector(`.fd-photo-tag-card[data-file-id="${CSS.escape(recordId)}"]`);
  if (card) card.style.opacity = '.65';

  try {
    await window._fb.deleteDoc(window._fb.doc(window._fb.db, PHOTO_TAGS_COLLECTION, recordId));
    photoTagRecords.delete(recordId);
    fdToast('YouTube video removed from the website.');
    renderPhotoTags();
  } catch (error) {
    console.error('YouTube video remove error:', error);
    fdToast(error.message || 'Could not remove YouTube video.');
    if (card) card.style.opacity = '';
  }
}

async function cleanMissingDriveRecords() {
  const missingRecords = getMissingDrivePhotoTagRecords();
  const renamedRecords = getRenamedDrivePhotoTagRecords();

  if (missingRecords.length === 0 && renamedRecords.length === 0) {
    fdToast('No missing or renamed Drive photo records found.');
    return;
  }

  const sections = [];

  if (missingRecords.length > 0) {
    const examples = missingRecords
      .slice(0, 6)
      .map(record => record.name || record.driveFileId || record.id)
      .join('\n');
    const more = missingRecords.length > 6 ? `\n...and ${missingRecords.length - 6} more` : '';
    sections.push(`Delete ${missingRecords.length} Firestore photo tag record${missingRecords.length !== 1 ? 's' : ''} whose Drive photo is no longer in the ${getPhotoTagFolderLabel()}:\n${examples}${more}`);
  }

  if (renamedRecords.length > 0) {
    const examples = renamedRecords
      .slice(0, 6)
      .map(({ tag, file }) => `${tag.name || tag.id} -> ${file.name}`)
      .join('\n');
    const more = renamedRecords.length > 6 ? `\n...and ${renamedRecords.length - 6} more` : '';
    sections.push(`Refresh ${renamedRecords.length} Firestore photo tag record${renamedRecords.length !== 1 ? 's' : ''} whose Drive file name changed:\n${examples}${more}`);
  }

  const confirmed = window.confirm(
    `${sections.join('\n\n')}\n\nThis will not delete any Google Drive or YouTube files.`
  );

  if (!confirmed) return;

  try {
    let deleted = 0;
    let refreshed = 0;

    for (const record of missingRecords) {
      await window._fb.deleteDoc(window._fb.doc(window._fb.db, PHOTO_TAGS_COLLECTION, record.id));
      photoTagRecords.delete(record.id);
      deleted++;
    }

    for (const { tag, file } of renamedRecords) {
      await refreshPhotoTagRecordFromDrive(file, tag);
      refreshed++;
    }

    const parts = [];
    if (deleted > 0) parts.push(`${deleted} missing Drive record${deleted !== 1 ? 's' : ''} deleted from Firestore`);
    if (refreshed > 0) parts.push(`${refreshed} renamed Drive record${refreshed !== 1 ? 's' : ''} refreshed`);
    fdToast(parts.length ? `${parts.join('; ')}.` : 'No Drive records changed.');
    renderPhotoTags();
  } catch (error) {
    console.error('Drive record cleanup error:', error);
    fdToast(error.message || 'Could not clean or refresh Drive records.');
  }
}

function clearYoutubeCard() {
  const urlInput = document.getElementById('fd-yt-url-input');
  const preview = document.getElementById('fd-yt-preview');
  const chipsWrap = document.getElementById('chips-yt-new');
  const saveBtn = document.getElementById('fd-yt-save-btn');

  if (urlInput) urlInput.value = '';
  if (preview) preview.style.display = 'none';
  if (chipsWrap) chipsWrap.innerHTML = '';
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Save & Publish'; }

  document.querySelectorAll('#fd-yt-add-card .fd-tag-suggestions').forEach(el => {
    el.style.display = 'none';
    el.innerHTML = '';
  });
}

window.handleTagAutocomplete = handleTagAutocomplete;
window.handleTagAutocompleteKeydown = handleTagAutocompleteKeydown;
window.parseBatchTagInput = parseBatchTagInput;
window.addTagChip = addTagChip;
window.removeTagChip = removeTagChip;
window.savePhotoTag = savePhotoTag;
window.renamePhotoTagFile = renamePhotoTagFile;
window.replacePhotoTagFile = replacePhotoTagFile;
window.clearPhotoTag = clearPhotoTag;
window.trashPhotoTagFile = trashPhotoTagFile;
window.toggleCardSelection = toggleCardSelection;
window.selectAllVisible = selectAllVisible;
window.renameSelected = renameSelected;
window.clearSelection = clearSelection;
window.publishSelected = publishSelected;
window.publishDrafts = publishDrafts;
window.clearPhotoTagDrafts = clearPhotoTagDrafts;
window.toggleYoutubeAddCard = toggleYoutubeAddCard;
window.handleExistingYoutubeUrlInput = handleExistingYoutubeUrlInput;
window.saveYoutubeVideoTags = saveYoutubeVideoTags;
window.removeYoutubeVideo = removeYoutubeVideo;
window.handleYoutubeUrlInput = handleYoutubeUrlInput;
window.submitYoutubeVideo = submitYoutubeVideo;
window.clearYoutubeCard = clearYoutubeCard;
window.cleanMissingDriveRecords = cleanMissingDriveRecords;
window.reloadPhotoTagData = reloadPhotoTagData;
window.approvePhotoTagSuggestion = approvePhotoTagSuggestion;
window.rejectPhotoTagSuggestion = rejectPhotoTagSuggestion;

if (typeof fdInit === 'function') {
  fdInit().catch(showPhotoTagStartupError);
} else {
  showPhotoTagStartupError(new Error('Family directory script did not load.'));
}
