const PHOTO_TAGS_DRIVE_API_KEY = 'AIzaSyCadJTGnwhASQ-kj7p4AnGFAwXIIFChoSs';
const PHOTO_TAGS_MASTER_FOLDER_ID = '10ee3xB70t7S0cxqgEFoRQ9eMy4BIVjpJ';
const PHOTO_TAGS_COLLECTION = 'familyPhotoTags';
const PHOTO_TAGS_DRIVE_PAGE_SIZE = 200;
const PHOTO_TAGS_REQUEST_TIMEOUT_MS = 30000;
const PHOTO_TAGS_CONVERT_ENDPOINT = 'https://us-central1-jorgeranilla-site.cloudfunctions.net/convertFamilyPhotoUpload';
const PHOTO_TAGS_IMAGE_REPLACE_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,image/dng,image/x-adobe-dng,image/tiff,.jpg,.jpeg,.png,.webp,.heic,.heif,.dng,.tif,.tiff';
const PHOTO_TAGS_VIDEO_REPLACE_ACCEPT = 'video/quicktime,video/mp4,video/x-m4v,.mov,.mp4,.m4v';
const PHOTO_TAGS_MAX_REPLACE_UPLOAD_BYTES = 31 * 1024 * 1024;
const PHOTO_TAGS_REPLACE_REVIEW_REASON = 'Media file was replaced from the tag panel. Review and approve the existing tags.';
const PHOTO_TAGS_CONTENT_FIELDS = ['mimeType', 'type', 'md5Checksum', 'size'];
const PHOTO_TAGS_STANDARD_NAME_RE = /^(\d{4})\.(\d{2})\.(\d{2})_(\d{4})(\.[a-z0-9]+)$/i;
const PHOTO_TAGS_STATUS_LABELS = {
  approved: 'Approved',
  pending: 'Pending',
  'needs-review': 'Needs Retag',
  untagged: 'Untagged'
};
const PHOTO_TAG_CANONICAL_SLUGS = {
  'luis-fernando': 'luis-fernando-astocondor',
  'fernando-astocondor': 'luis-fernando-astocondor',
  'fernando-javier': 'fernando-pallete',
  'lorenzo-david': 'lorenzo-lu',
  'eugenio-jesus': 'eugenio-astocondor',
  'ernesto': 'ernesto-herrera',
  'luisa-cristina': 'luisa-astocondor',
  'monica-del-carmen': 'monica-astocondor',
  'paola-andrea': 'paola-pallete',
  'paola-andres': 'paola-pallete',
  'milagros': 'milagros-herrera',
  'adriana': 'adriana-astocondor',
  'alessandra': 'alessandra-briceno',
  'alessandra-prietto': 'alessandra-briceno',
  'paola-josefina': 'paola-ranilla',
  'victor-andres': 'victor-ranilla',
  'victor-andres-ranilla': 'victor-ranilla',
  'maria-eugenia': 'maria-ranilla',
  'maria-eugenia-ranilla': 'maria-ranilla',
  'shane': 'shane-ranilla',
  'jorge': 'jorge-ranilla',
  'jorge-luis': 'jorge-ranilla-cateriano',
  'jorge-luis-ranilla': 'jorge-ranilla-cateriano',
  'sylvia-ines': 'sylvia-astocondor',
  'sylvia-ines-astocondor': 'sylvia-astocondor',
  'sylvia-astocondor-salazar': 'sylvia-astocondor',
  'alyssa': 'alyssa-ranilla'
};

let photoTagMembers = [];
let photoTagFiles = [];
let photoTagRecords = new Map();
let photoTagFilter = 'all';
let photoTagSearch = '';

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

function withPhotoTagTimeout(promise, message, timeoutMs = PHOTO_TAGS_REQUEST_TIMEOUT_MS) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
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
function onPageReady() {
  if (!window.isAdmin) {
    const restricted = document.getElementById('fd-photo-tags-restricted');
    const admin = document.getElementById('fd-photo-tags-admin');
    if (restricted) restricted.style.display = 'block';
    if (admin) admin.style.display = 'none';
    return;
  }

  const admin = document.getElementById('fd-photo-tags-admin');
  if (admin) admin.style.display = 'block';

  initPhotoTagger();
}

async function initPhotoTagger() {
  bindPhotoTagFilters();
  bindPhotoTagSearch();
  updatePhotoTagLoading('Loading family members, saved tags, and Drive photos...');

  try {
    await Promise.all([
      withPhotoTagTimeout(loadPhotoTagMembers(), 'Loading family members took too long.'),
      withPhotoTagTimeout(loadPhotoTagRecords(), 'Loading saved photo tags took too long.'),
      withPhotoTagTimeout(loadPhotoTagFiles(), 'Loading Drive photos took too long.', 120000)
    ]);

    updatePhotoTagLoading('Preparing photo tags...');

    try {
      await syncRenamedPhotoTagMetadata();
      await syncComputedPhotoTagStatuses();
    } catch (syncError) {
      console.warn('Could not sync stale photo tag statuses:', syncError);
    }

    renderPhotoTags();
  } catch (error) {
    console.error('Photo tag load error:', error);
    const loading = document.getElementById('fd-photo-tags-loading');
    const summary = document.getElementById('fd-photo-tag-summary');
    const grid = document.getElementById('fd-photo-tag-grid');
    const empty = document.getElementById('fd-photo-tags-empty');
    const message = formatPhotoTagLoadError(error);

    if (loading) loading.style.display = 'none';
    if (summary) summary.textContent = message;
    if (grid) grid.innerHTML = '';
    if (empty) {
      empty.style.display = 'block';
      const emptyText = empty.querySelector('p');
      if (emptyText) emptyText.textContent = message;
    }
  }
}

function bindPhotoTagFilters() {
  document.querySelectorAll('.fd-filter-pill').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.fd-filter-pill').forEach(item => item.classList.remove('active'));
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
  const members = await fetchAllMembers();
  const approved = members
    .filter(member => member.status === 'approved' && member.status !== 'claimed')
    .map(member => {
      const rawPersonSlug = makePhotoTagSlug(member.displayName || member.email || member.id);
      const personSlug = canonicalPhotoTagSlug(rawPersonSlug);

      return {
        ...member,
        rawPersonSlug,
        personSlug,
        alternatePersonSlugs: rawPersonSlug && rawPersonSlug !== personSlug ? [rawPersonSlug] : [],
        tagKey: `member:${member.id}`,
        tagLabel: member.displayName || member.email || member.id
      };
    })
    .filter(member => member.tagKey && member.personSlug)
    .sort((a, b) => a.tagLabel.localeCompare(b.tagLabel, undefined, { sensitivity: 'base' }));

  photoTagMembers = disambiguateDuplicateMemberLabels(approved);
}

async function loadPhotoTagRecords() {
  const { collection, getDocs } = window._fb;
  const snapshot = await getDocs(collection(window._fb.db, PHOTO_TAGS_COLLECTION));

  photoTagRecords = new Map();
  snapshot.docs.forEach(docSnap => {
    const data = docSnap.data() || {};
    photoTagRecords.set(docSnap.id, normalizePhotoTagRecord(docSnap.id, data));
  });
}

async function loadPhotoTagFiles() {
  const files = [];
  let pageToken = '';
  let page = 0;

  updatePhotoTagLoading('Loading Drive photos...');

  do {
    page += 1;
    const q = encodeURIComponent(
      `'${PHOTO_TAGS_MASTER_FOLDER_ID}' in parents and ` +
      `(mimeType contains 'image/' or mimeType contains 'video/') and ` +
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

    updatePhotoTagLoading(`Loading Drive photos... ${files.length} found`);

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
      type: String(file.mimeType || '').startsWith('video/') ? 'video' : 'image',
      createdTime: file.createdTime || '',
      modifiedTime: file.modifiedTime || '',
      takenTime: file.imageMediaMetadata?.time || '',
      md5Checksum: file.md5Checksum || '',
      size: file.size || ''
    })));

    updatePhotoTagLoading(`Loading Drive photos... ${files.length} found`);
    pageToken = data.nextPageToken || '';
  } while (pageToken);

  updatePhotoTagLoading(`Preparing ${files.length} Drive photos...`);
  photoTagFiles = assignPhotoTagSuggestedNames(files).sort((a, b) => b.name.localeCompare(a.name, undefined, {
    numeric: true,
    sensitivity: 'base'
  }));
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
  const name = String(file?.name || '');
  const match = name.match(/\.([a-z0-9]+)$/i);
  if (match) return `.${match[1].toLowerCase()}`;
  if (file?.type === 'video') return '.mp4';
  return '.jpg';
}

function getPhotoTagTakenSortValue(file) {
  const raw = String(file?.takenTime || file?.createdTime || file?.modifiedTime || '').trim();
  const normalized = raw.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? Number.MAX_SAFE_INTEGER : parsed.getTime();
}

function getPhotoTagNameMatch(file) {
  return String(file?.name || '').match(PHOTO_TAGS_STANDARD_NAME_RE);
}

function isPhotoTagStandardName(file) {
  const match = getPhotoTagNameMatch(file);
  if (!match) return false;

  return Boolean(file.suggestedName && file.name.toLowerCase() === file.suggestedName.toLowerCase());
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

function isPhotoTagVideoFile(file) {
  const mimeType = String(file?.type || file?.mimeType || '').toLowerCase();
  const fileName = String(file?.name || '').toLowerCase();
  return mimeType.startsWith('video/') || /\.(mov|mp4|m4v)$/i.test(fileName);
}

function isPhotoTagImageFile(file) {
  const mimeType = String(file?.type || file?.mimeType || '').toLowerCase();
  const fileName = String(file?.name || '').toLowerCase();
  return mimeType.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif|dng|tiff?)$/i.test(fileName);
}

function getPhotoTagMediaTypeFromMime(mimeType) {
  return String(mimeType || '').startsWith('video/') ? 'video' : 'image';
}

function isSupportedPhotoReplacement(file, expectedType = 'image') {
  if (!file) return false;

  return expectedType === 'video'
    ? isPhotoTagVideoFile(file)
    : isPhotoTagImageFile(file);
}

function getPhotoTagExtensionForMime(mimeType) {
  return String(mimeType || '').toLowerCase().startsWith('video/') ? '.mp4' : '.jpg';
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
    throw new Error('Sign in again before converting this media file.');
  }

  const formData = new FormData();
  formData.append('media', file, file.name || 'media');

  const response = await fetch(PHOTO_TAGS_CONVERT_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await user.getIdToken(true)}`
    },
    body: formData
  });

  if (!response.ok) {
    let message = 'Could not convert this media file.';

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
    throw new Error('Choose a media file first.');
  }

  if (selectedFile.size > PHOTO_TAGS_MAX_REPLACE_UPLOAD_BYTES) {
    throw new Error('Choose a media file under 31 MB.');
  }

  const expectedType = driveFile?.type === 'video' ? 'video' : 'image';
  if (!isSupportedPhotoReplacement(selectedFile, expectedType)) {
    throw new Error(expectedType === 'video'
      ? 'Choose a MOV, MP4, or M4V video.'
      : 'Choose a JPEG, PNG, WebP, HEIC, HEIF, TIFF, or DNG photo.');
  }

  const convertedFile = await convertPhotoTagUploadMedia(selectedFile);
  const convertedType = getPhotoTagMediaTypeFromMime(convertedFile.type);
  if (convertedType !== expectedType) {
    throw new Error(expectedType === 'video'
      ? 'Choose a video file to replace this video.'
      : 'Choose a photo file to replace this photo.');
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

  const response = await fetch(
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
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Google Drive media replacement failed.');
  }

  return data;
}

async function refreshPhotoTagRecordAfterReplacement(file, hadTags) {
  const tag = getPhotoTagRecord(file.id);
  if (!tag && !hadTags) return;

  const payload = {
    name: file.name,
    mimeType: file.mimeType,
    type: file.type,
    drive: {
      ...(tag?.drive || {}),
      mimeType: file.mimeType,
      type: file.type,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
      takenTime: file.takenTime,
      suggestedName: file.suggestedName,
      md5Checksum: file.md5Checksum,
      size: file.size
    },
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
    name: file.name,
    drive: {
      ...tag.drive,
      mimeType: file.mimeType,
      type: file.type,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
      takenTime: file.takenTime,
      suggestedName: file.suggestedName,
      md5Checksum: file.md5Checksum,
      size: file.size
    },
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

  if (tag.name && file.name && tag.name !== file.name) {
    return 'File name changed since approval. Save and publish to refresh the saved metadata.';
  }

  return '';
}

function getPhotoTagRecord(fileId) {
  return photoTagRecords.get(fileId) || null;
}

function isPhotoTagged(file) {
  const tag = getPhotoTagRecord(file.id);
  return hasSavedTagPeople(tag);
}

function getPhotoTagStatus(file) {
  const tag = getPhotoTagRecord(file.id);
  if (!hasSavedTagPeople(tag)) return 'untagged';

  if (hasUnresolvedTagPeople(tag)) return 'needs-review';

  if (!tag._storedStatus) return 'needs-review';

  if (tag._storedStatus === 'approved') {
    if (!hasSavedDriveFingerprint(tag)) return 'needs-review';
    if (getChangedDriveFields(file, tag).length > 0) return 'needs-review';
  }

  return tag.status || 'approved';
}

async function syncComputedPhotoTagStatuses() {
  const updates = [];

  photoTagFiles.forEach(file => {
    const tag = getPhotoTagRecord(file.id);
    if (!hasSavedTagPeople(tag)) return;

    const computedStatus = getPhotoTagStatus(file);
    const storedStatus = tag._storedStatus || '';

    if (computedStatus !== 'needs-review' || storedStatus === 'needs-review') return;

    const reviewReason = getPhotoTagReviewReason(file, tag) || 'Review these tags before publishing.';

    updates.push(
      window._fb.setDoc(
        window._fb.doc(window._fb.db, PHOTO_TAGS_COLLECTION, file.id),
        {
          status: 'needs-review',
          reviewReason,
          reviewCheckedAt: window._fb.serverTimestamp()
        },
        { merge: true }
      ).then(() => {
        photoTagRecords.set(file.id, normalizePhotoTagRecord(file.id, {
          ...tag,
          status: 'needs-review',
          reviewReason
        }));
      })
    );
  });

  if (updates.length > 0) {
    await Promise.all(updates);
  }
}

async function syncRenamedPhotoTagMetadata() {
  const updates = [];

  photoTagFiles.forEach(file => {
    const tag = getPhotoTagRecord(file.id);
    if (!hasSavedTagPeople(tag)) return;
    if (tag.status !== 'approved') return;
    if (hasUnresolvedTagPeople(tag)) return;
    if (getChangedDriveFields(file, tag).length > 0) return;
    if (!tag.name || !file.name || tag.name === file.name) return;

    const payload = {
      name: file.name,
      mimeType: file.mimeType,
      type: file.type,
      drive: {
        ...tag.drive,
        mimeType: file.mimeType,
        type: file.type,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        md5Checksum: file.md5Checksum,
        size: file.size
      },
      updatedAt: window._fb.serverTimestamp()
    };

    updates.push(
      window._fb.setDoc(
        window._fb.doc(window._fb.db, PHOTO_TAGS_COLLECTION, file.id),
        payload,
        { merge: true }
      ).then(() => {
        photoTagRecords.set(file.id, normalizePhotoTagRecord(file.id, {
          ...tag,
          ...payload,
          updatedAt: tag.updatedAt
        }));
      })
    );
  });

  if (updates.length > 0) {
    await Promise.all(updates);
  }
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
    if (photoTagFilter === 'needs-rename' && !getPhotoTagRenameMessage(file)) return false;

    if (!photoTagSearch) return true;

    const labels = tag?.peopleLabels?.join(' ') || tag?.people?.map(getPhotoTagLabel).join(' ') || '';
    return `${file.name} ${file.suggestedName || ''} ${labels}`.toLowerCase().includes(photoTagSearch);
  });
}

function renderPhotoTags() {
  const loading = document.getElementById('fd-photo-tags-loading');
  const grid = document.getElementById('fd-photo-tag-grid');
  const empty = document.getElementById('fd-photo-tags-empty');
  const summary = document.getElementById('fd-photo-tag-summary');

  if (loading) loading.style.display = 'none';
  if (!grid || !empty || !summary) return;

  const visible = getVisiblePhotoTagFiles();
  const taggedCount = photoTagFiles.filter(isPhotoTagged).length;
  const untaggedCount = photoTagFiles.length - taggedCount;
  const needsReviewCount = photoTagFiles.filter(file => getPhotoTagStatus(file) === 'needs-review').length;
  const approvedCount = photoTagFiles.filter(file => getPhotoTagStatus(file) === 'approved').length;
  const needsRenameCount = photoTagFiles.filter(file => getPhotoTagRenameMessage(file)).length;

  summary.textContent = `${photoTagFiles.length} photos in Family folder · ${taggedCount} tagged · ${untaggedCount} untagged`;

  summary.textContent = `${photoTagFiles.length} photos in Family folder - ${approvedCount} approved - ${needsReviewCount} need retag - ${needsRenameCount} need rename - ${untaggedCount} untagged`;

  if (visible.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  grid.innerHTML = visible.map(renderPhotoTagCard).join('');
}

function renderPhotoTagCard(file) {
  const tag = getPhotoTagRecord(file.id);
  const selectedPeople = new Set(tag?.people || []);
  const status = getPhotoTagStatus(file);
  const selectedMembersList = photoTagMembers.filter(m => isMemberSelectedForTag(tag, m));
  const statusText = PHOTO_TAGS_STATUS_LABELS[status] || status;
  const labels = selectedMembersList.length
    ? selectedMembersList.map(member => member.displayTagLabel || member.tagLabel).join(', ')
    : tag?.peopleLabels?.length
      ? tag.peopleLabels.join(', ')
      : selectedPeople.size
        ? Array.from(selectedPeople).map(getPhotoTagLabel).join(', ')
        : 'No people assigned yet';
  const reviewReason = getPhotoTagReviewReason(file, tag);
  const renameMessage = getPhotoTagRenameMessage(file);
  const publishText = status === 'needs-review' ? 'Approve Tags' : 'Save & Publish';
  const renameButton = renameMessage && file.suggestedName
    ? `<button type="button" class="fd-mini-btn rename" onclick="renamePhotoTagFile('${escapePhotoTagHtml(file.id)}')">Rename in Drive</button>`
    : '';
  const replaceLabel = file.type === 'video' ? 'Video' : 'Photo';
  const replaceAccept = file.type === 'video' ? PHOTO_TAGS_VIDEO_REPLACE_ACCEPT : PHOTO_TAGS_IMAGE_REPLACE_ACCEPT;
  const replaceControl = file.type === 'image' || file.type === 'video'
    ? `<input type='file' class='fd-replace-input' accept='${replaceAccept}' onchange='replacePhotoTagFile(&#039;${escapePhotoTagHtml(file.id)}&#039;, this)'>
      <button type='button' class='fd-mini-btn replace' onclick='this.previousElementSibling.click()'>Replace ${replaceLabel}</button>`
    : '';

  return `
    <article class="fd-photo-tag-card" data-file-id="${escapePhotoTagHtml(file.id)}">
      <img class="fd-photo-tag-preview" src="${photoTagThumbnail(file)}" alt="${escapePhotoTagHtml(file.name)}" loading="lazy">
      <div class="fd-photo-tag-body">
        <p class="fd-photo-tag-name">${escapePhotoTagHtml(file.name)}</p>
        <div class="fd-photo-tag-meta">
          <span class="fd-tag-status ${escapePhotoTagHtml(status)}">${escapePhotoTagHtml(statusText)}</span>
          <span class="fd-tag-status untagged">${escapePhotoTagHtml(file.type)}</span>
        </div>
        <p class="fd-tag-summary">${escapePhotoTagHtml(labels)}</p>
        ${renameMessage ? `<p class="fd-tag-rename-note">${escapePhotoTagHtml(renameMessage)}</p>` : ''}
        ${reviewReason ? `<p class="fd-tag-review-note">${escapePhotoTagHtml(reviewReason)}</p>` : ''}

        <div class="fd-tagging-area">
          <input type="text" 
            class="fd-tag-search-input" 
            placeholder="Type name to tag..." 
            oninput="handleTagAutocomplete(this, '${escapePhotoTagHtml(file.id)}')"
            onfocus="handleTagAutocomplete(this, '${escapePhotoTagHtml(file.id)}')">
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
          <button type="button" class="fd-mini-btn secondary" onclick="clearPhotoTag('${escapePhotoTagHtml(file.id)}')">Clear</button>
        </div>
      </div>
    </article>
  `;
}

function handleTagAutocomplete(input, fileId) {
  const suggestionsDiv = document.getElementById(`suggestions-${fileId}`);
  const chipsWrap = document.getElementById(`chips-${fileId}`);
  if (!suggestionsDiv || !chipsWrap) return;

  const term = input.value.trim().toLowerCase();
  
  const selectedKeys = Array.from(chipsWrap.querySelectorAll('.fd-person-chip.selected'))
    .map(chip => chip.dataset.personKey);

  const matches = photoTagMembers.filter(m => {
    if (selectedKeys.includes(m.tagKey)) return false;
    if (!term) return false;

    const label = (m.displayTagLabel || m.tagLabel).toLowerCase();
    return label.includes(term);
  });

  if (matches.length === 0 || !term) {
    suggestionsDiv.style.display = 'none';
    suggestionsDiv.innerHTML = '';
    return;
  }

  suggestionsDiv.innerHTML = matches.slice(0, 8).map(m => `
    <div class="fd-tag-suggestion-item" 
         onclick="addTagChip('${fileId}', '${escapePhotoTagHtml(m.tagKey)}', '${escapePhotoTagHtml(m.displayTagLabel || m.tagLabel)}')">
      ${escapePhotoTagHtml(m.displayTagLabel || m.tagLabel)}
    </div>
  `).join('');
  
  suggestionsDiv.style.display = 'block';
}

function addTagChip(fileId, tagKey, displayLabel) {
  const chipsWrap = document.getElementById(`chips-${fileId}`);
  const input = document.querySelector(`.fd-photo-tag-card[data-file-id="${CSS.escape(fileId)}"] .fd-tag-search-input`);
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
}

function removeTagChip(button) {
  button.remove();
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.fd-tagging-area')) {
    document.querySelectorAll('.fd-tag-suggestions').forEach(el => el.style.display = 'none');
  }
});

async function savePhotoTag(fileId) {
  const file = photoTagFiles.find(item => item.id === fileId);
  const card = document.querySelector(`.fd-photo-tag-card[data-file-id="${CSS.escape(fileId)}"]`);
  if (!file || !card) return;

  const selectedChips = Array.from(card.querySelectorAll('.fd-person-chip.selected'));
  const selectedPeople = selectedChips.map(chip => chip.dataset.personKey).filter(Boolean);

  if (selectedPeople.length === 0) {
    fdToast('Select at least one person before publishing.');
    return;
  }

  const selectedMembers = selectedPeople
    .map(key => photoTagMembers.find(member => member.tagKey === key))
    .filter(Boolean);

  const payload = {
    driveFileId: file.id,
    driveFolderId: PHOTO_TAGS_MASTER_FOLDER_ID,
    name: file.name,
    mimeType: file.mimeType,
    type: file.type,
    people: selectedPeople,
    peopleAliases: selectedMembers.map(member => member.personSlug),
    peopleLabels: selectedMembers.map(member => member.tagLabel),
    personIds: selectedMembers.map(member => member.id),
    albums: ['family'],
    source: 'manual',
    status: 'approved',
    reviewReason: null,
    drive: {
      mimeType: file.mimeType,
      type: file.type,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
      takenTime: file.takenTime,
      suggestedName: file.suggestedName,
      md5Checksum: file.md5Checksum,
      size: file.size
    },
    approvedAt: window._fb.serverTimestamp(),
    updatedAt: window._fb.serverTimestamp()
  };

  if (!photoTagRecords.has(file.id)) {
    payload.createdAt = window._fb.serverTimestamp();
  }

  card.style.opacity = '.65';

  try {
    await window._fb.setDoc(
      window._fb.doc(window._fb.db, PHOTO_TAGS_COLLECTION, file.id),
      payload,
      { merge: true }
    );

    photoTagRecords.set(file.id, normalizePhotoTagRecord(file.id, payload));
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
    photoTagFiles = assignPhotoTagSuggestedNames(photoTagFiles).sort((a, b) => b.name.localeCompare(a.name, undefined, {
      numeric: true,
      sensitivity: 'base'
    }));

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

  if (!isSupportedPhotoReplacement(selectedFile, file.type === 'video' ? 'video' : 'image')) {
    fdToast(file.type === 'video' ? 'Choose a MOV, MP4, or M4V video.' : 'Choose a JPEG, PNG, WebP, HEIC, HEIF, TIFF, or DNG photo.');
    input.value = '';
    return;
  }

  if (selectedFile.size > PHOTO_TAGS_MAX_REPLACE_UPLOAD_BYTES) {
    fdToast('Choose a media file under 31 MB.');
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
    button.textContent = file.type === 'video' ? 'Compressing...' : 'Converting...';
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

    photoTagFiles = assignPhotoTagSuggestedNames(photoTagFiles).sort((a, b) => b.name.localeCompare(a.name, undefined, {
      numeric: true,
      sensitivity: 'base'
    }));

    await refreshPhotoTagRecordAfterReplacement(file, hadTags);

    fdToast(hadTags ? 'Media replaced. Review and approve the tags.' : 'Media replaced.');
    renderPhotoTags();
  } catch (error) {
    console.error('Media replacement error:', error);
    fdToast(error.message || 'Could not replace this media file.');
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

  card.style.opacity = '.65';

  try {
    if (photoTagRecords.has(file.id)) {
      await window._fb.deleteDoc(window._fb.doc(window._fb.db, PHOTO_TAGS_COLLECTION, file.id));
      photoTagRecords.delete(file.id);
    }

    fdToast('Photo tags cleared.');
    renderPhotoTags();
  } catch (error) {
    console.error('Photo tag clear error:', error);
    fdToast('Could not clear photo tags.');
    card.style.opacity = '';
  }
}

window.handleTagAutocomplete = handleTagAutocomplete;
window.addTagChip = addTagChip;
window.removeTagChip = removeTagChip;
window.savePhotoTag = savePhotoTag;
window.renamePhotoTagFile = renamePhotoTagFile;
window.replacePhotoTagFile = replacePhotoTagFile;
window.clearPhotoTag = clearPhotoTag;

if (typeof fdInit === 'function') {
  fdInit().catch(showPhotoTagStartupError);
} else {
  showPhotoTagStartupError(new Error('Family directory script did not load.'));
}
