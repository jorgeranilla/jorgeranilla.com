const PHOTO_TAGS_DRIVE_API_KEY = 'AIzaSyCadJTGnwhASQ-kj7p4AnGFAwXIIFChoSs';
const PHOTO_TAGS_MASTER_FOLDER_ID = '10ee3xB70t7S0cxqgEFoRQ9eMy4BIVjpJ';
const PHOTO_TAGS_COLLECTION = 'familyPhotoTags';
const PHOTO_TAGS_DRIVE_PAGE_SIZE = 200;

let photoTagMembers = [];
let photoTagFiles = [];
let photoTagRecords = new Map();
let photoTagFilter = 'all';
let photoTagSearch = '';

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

  try {
    await Promise.all([
      loadPhotoTagMembers(),
      loadPhotoTagRecords(),
      loadPhotoTagFiles()
    ]);

    renderPhotoTags();
  } catch (error) {
    console.error('Photo tag load error:', error);
    const loading = document.getElementById('fd-photo-tags-loading');
    const summary = document.getElementById('fd-photo-tag-summary');

    if (loading) loading.style.display = 'none';
    if (summary) summary.textContent = 'Could not load photos or tags right now.';
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
    .map(member => ({
      ...member,
      tagSlug: makePhotoTagSlug(member.displayName || member.email || member.id),
      tagLabel: member.displayName || member.email || member.id
    }))
    .filter(member => member.tagSlug)
    .sort((a, b) => a.tagLabel.localeCompare(b.tagLabel, undefined, { sensitivity: 'base' }));

  photoTagMembers = approved;
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

  do {
    const q = encodeURIComponent(
      `'${PHOTO_TAGS_MASTER_FOLDER_ID}' in parents and ` +
      `(mimeType contains 'image/' or mimeType contains 'video/') and ` +
      `trashed = false`
    );
    const params = [
      `q=${q}`,
      `key=${encodeURIComponent(PHOTO_TAGS_DRIVE_API_KEY)}`,
      'fields=nextPageToken,files(id,name,mimeType,createdTime,modifiedTime,md5Checksum,size)',
      'orderBy=createdTime desc',
      `pageSize=${PHOTO_TAGS_DRIVE_PAGE_SIZE}`
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
      mimeType: file.mimeType || '',
      type: String(file.mimeType || '').startsWith('video/') ? 'video' : 'image',
      createdTime: file.createdTime || '',
      modifiedTime: file.modifiedTime || '',
      md5Checksum: file.md5Checksum || '',
      size: file.size || ''
    })));

    pageToken = data.nextPageToken || '';
  } while (pageToken);

  photoTagFiles = files.sort((a, b) => b.name.localeCompare(a.name, undefined, {
    numeric: true,
    sensitivity: 'base'
  }));
}

function normalizePhotoTagRecord(id, data) {
  return {
    id,
    ...data,
    people: Array.isArray(data.people) ? data.people : [],
    peopleLabels: Array.isArray(data.peopleLabels) ? data.peopleLabels : [],
    personIds: Array.isArray(data.personIds) ? data.personIds : [],
    albums: Array.isArray(data.albums) ? data.albums : ['family'],
    status: data.status || 'approved'
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

function escapePhotoTagHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function photoTagThumbnail(file, size = 600) {
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(file.id)}&sz=w${size}`;
}

function getPhotoTagLabel(slug) {
  const member = photoTagMembers.find(item => item.tagSlug === slug);
  return member?.tagLabel || slug;
}

function getPhotoTagRecord(fileId) {
  return photoTagRecords.get(fileId) || null;
}

function isPhotoTagged(file) {
  const tag = getPhotoTagRecord(file.id);
  return Boolean(tag && tag.people.length > 0);
}

function getPhotoTagStatus(file) {
  const tag = getPhotoTagRecord(file.id);
  if (!tag || tag.people.length === 0) return 'untagged';
  return tag.status || 'approved';
}

function getVisiblePhotoTagFiles() {
  return photoTagFiles.filter(file => {
    const tag = getPhotoTagRecord(file.id);
    const tagged = isPhotoTagged(file);
    const status = getPhotoTagStatus(file);

    if (photoTagFilter === 'untagged' && tagged) return false;
    if (photoTagFilter === 'tagged' && !tagged) return false;
    if (photoTagFilter === 'approved' && status !== 'approved') return false;

    if (!photoTagSearch) return true;

    const labels = tag?.peopleLabels?.join(' ') || tag?.people?.map(getPhotoTagLabel).join(' ') || '';
    return `${file.name} ${labels}`.toLowerCase().includes(photoTagSearch);
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

  summary.textContent = `${photoTagFiles.length} photos in Family folder · ${taggedCount} tagged · ${untaggedCount} untagged`;

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
  const statusText = status === 'approved' ? 'Approved' : status === 'pending' ? 'Pending' : 'Untagged';
  const labels = selectedPeople.size
    ? Array.from(selectedPeople).map(getPhotoTagLabel).join(', ')
    : 'No people assigned yet';

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
        <div class="fd-person-chip-wrap" aria-label="People in this photo">
          ${photoTagMembers.map(member => `
            <button
              type="button"
              class="fd-person-chip${selectedPeople.has(member.tagSlug) ? ' selected' : ''}"
              data-file-id="${escapePhotoTagHtml(file.id)}"
              data-person-slug="${escapePhotoTagHtml(member.tagSlug)}"
              onclick="togglePhotoTagPerson(this)">
              ${escapePhotoTagHtml(member.tagLabel)}
            </button>
          `).join('')}
        </div>
        <div class="fd-photo-tag-actions">
          <button type="button" class="fd-mini-btn" onclick="savePhotoTag('${escapePhotoTagHtml(file.id)}')">Save & Publish</button>
          <button type="button" class="fd-mini-btn secondary" onclick="clearPhotoTag('${escapePhotoTagHtml(file.id)}')">Clear</button>
        </div>
      </div>
    </article>
  `;
}

function togglePhotoTagPerson(button) {
  button.classList.toggle('selected');
}

async function savePhotoTag(fileId) {
  const file = photoTagFiles.find(item => item.id === fileId);
  const card = document.querySelector(`.fd-photo-tag-card[data-file-id="${CSS.escape(fileId)}"]`);
  if (!file || !card) return;

  const selectedChips = Array.from(card.querySelectorAll('.fd-person-chip.selected'));
  const selectedPeople = selectedChips.map(chip => chip.dataset.personSlug).filter(Boolean);

  if (selectedPeople.length === 0) {
    fdToast('Select at least one person before publishing.');
    return;
  }

  const selectedMembers = selectedPeople
    .map(slug => photoTagMembers.find(member => member.tagSlug === slug))
    .filter(Boolean);

  const payload = {
    driveFileId: file.id,
    driveFolderId: PHOTO_TAGS_MASTER_FOLDER_ID,
    name: file.name,
    mimeType: file.mimeType,
    type: file.type,
    people: selectedPeople,
    peopleLabels: selectedMembers.map(member => member.tagLabel),
    personIds: selectedMembers.map(member => member.id),
    albums: ['family'],
    source: 'manual',
    status: 'approved',
    drive: {
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
      md5Checksum: file.md5Checksum,
      size: file.size
    },
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

window.togglePhotoTagPerson = togglePhotoTagPerson;
window.savePhotoTag = savePhotoTag;
window.clearPhotoTag = clearPhotoTag;

fdInit();
