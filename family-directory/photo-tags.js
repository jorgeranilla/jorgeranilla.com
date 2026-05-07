const PHOTO_TAGS_DRIVE_API_KEY = 'AIzaSyCadJTGnwhASQ-kj7p4AnGFAwXIIFChoSs';
const PHOTO_TAGS_MASTER_FOLDER_ID = '10ee3xB70t7S0cxqgEFoRQ9eMy4BIVjpJ';
const PHOTO_TAGS_COLLECTION = 'familyPhotoTags';
const PHOTO_TAGS_DRIVE_PAGE_SIZE = 200;
const PHOTO_TAGS_CONTENT_FIELDS = ['mimeType', 'type', 'md5Checksum', 'size'];
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

    await syncComputedPhotoTagStatuses();
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
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(file.id)}&sz=w${size}`;
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

function getVisiblePhotoTagFiles() {
  return photoTagFiles.filter(file => {
    const tag = getPhotoTagRecord(file.id);
    const tagged = isPhotoTagged(file);
    const status = getPhotoTagStatus(file);

    if (photoTagFilter === 'untagged' && tagged) return false;
    if (photoTagFilter === 'tagged' && !tagged) return false;
    if (photoTagFilter === 'approved' && status !== 'approved') return false;
    if (photoTagFilter === 'needs-review' && status !== 'needs-review') return false;

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
  const needsReviewCount = photoTagFiles.filter(file => getPhotoTagStatus(file) === 'needs-review').length;
  const approvedCount = photoTagFiles.filter(file => getPhotoTagStatus(file) === 'approved').length;

  summary.textContent = `${photoTagFiles.length} photos in Family folder · ${taggedCount} tagged · ${untaggedCount} untagged`;

  summary.textContent = `${photoTagFiles.length} photos in Family folder - ${approvedCount} approved - ${needsReviewCount} need retag - ${untaggedCount} untagged`;

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
  const publishText = status === 'needs-review' ? 'Approve Tags' : 'Save & Publish';

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
window.clearPhotoTag = clearPhotoTag;

fdInit();
