/* Directory Profile member request review tools */

let fdPendingMemberRequests = [];

function fdIndexEscape(value) {
  return String(value || '').replace(/[&<>"]/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  }[ch]));
}

function fdRequestInputId(requestId, field) {
  return `fd-request-${requestId}-${field}`.replace(/[^a-zA-Z0-9_-]/g, '-');
}

function fdIndexRequestDate(value) {
  const date = value?.toDate?.() || (value?.seconds ? new Date(value.seconds * 1000) : null);
  return date ? date.toLocaleString() : '';
}

function fdMemberRequestTypeLabel(type) {
  return {
    profile_update: 'Profile Update',
    photo_add: 'Add Photo or Video',
    photo_remove: 'Remove Photo Tag'
  }[type] || 'Member Request';
}

function fdMemberRequestStatusText(request) {
  const pieces = [
    fdMemberRequestTypeLabel(request.type),
    request.memberName || request.memberEmail || request.memberId,
    fdIndexRequestDate(request.createdAt)
  ].filter(Boolean);

  return pieces.join(' - ');
}

async function loadMemberRequestCount() {
  if (!window.isAdmin || typeof fetchPendingMemberRequests !== 'function') return;

  try {
    fdPendingMemberRequests = await fetchPendingMemberRequests();
    const countEl = document.getElementById('fd-member-request-count');
    if (countEl) countEl.textContent = fdPendingMemberRequests.length;
  } catch (error) {
    console.warn('Could not load member request count:', error);
  }
}

function fdProfileRequestInput(request, field, label, type = 'text') {
  const payload = request.payload || {};
  const id = fdRequestInputId(request.id, field);
  const value = payload[field] || '';

  return `
    <div class="fd-field">
      <label for="${id}">${fdIndexEscape(label)}</label>
      <input type="${type}" id="${id}" value="${fdIndexEscape(value)}">
    </div>
  `;
}

function renderProfileRequestEditor(request) {
  const payload = request.payload || {};
  const privacy = payload.privacy || {};
  const photoNotice = payload.photoURL
    ? '<p style="font-size:.78rem;color:#6b7280;margin:6px 0 0">A profile photo update is included in this request.</p>'
    : '';

  return `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px">
      ${fdProfileRequestInput(request, 'displayName', 'Full Name')}
      ${fdProfileRequestInput(request, 'email', 'Email', 'email')}
      ${fdProfileRequestInput(request, 'phone', 'Phone')}
      ${fdProfileRequestInput(request, 'birthday', 'Birthday', 'date')}
      ${fdProfileRequestInput(request, 'address', 'Address')}
      ${fdProfileRequestInput(request, 'city', 'City')}
      ${fdProfileRequestInput(request, 'country', 'Country')}
      <div class="fd-field">
        <label for="${fdRequestInputId(request.id, 'preferredContact')}">Preferred Contact</label>
        <select id="${fdRequestInputId(request.id, 'preferredContact')}" style="width:100%;padding:10px;border:1px solid #e9e9e9;border-radius:8px;background:#fafafa">
          ${['email', 'phone', 'text', 'whatsapp'].map(option => `
            <option value="${option}" ${payload.preferredContact === option ? 'selected' : ''}>${fdIndexEscape(option)}</option>
          `).join('')}
        </select>
      </div>
    </div>
    ${photoNotice}
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-top:12px;background:#f8f9fa;border:1px solid #eee;border-radius:10px;padding:10px">
      ${[
        ['showPhone', 'Show phone', privacy.showPhone !== false],
        ['showEmail', 'Show email', privacy.showEmail !== false],
        ['showAddress', 'Show address', privacy.showAddress === true],
        ['showBirthday', 'Show birthday', privacy.showBirthday !== false],
        ['showAge', 'Show age', privacy.showAge === true]
      ].map(([field, label, checked]) => `
        <label style="display:flex;align-items:center;gap:8px;font-size:.82rem;color:#4b5563">
          <input type="checkbox" id="${fdRequestInputId(request.id, field)}" ${checked ? 'checked' : ''} style="width:auto;margin:0;accent-color:#CD5C5C">
          ${label}
        </label>
      `).join('')}
    </div>
  `;
}

function collectProfileRequestPayload(request) {
  const original = request.payload || {};
  const value = field => document.getElementById(fdRequestInputId(request.id, field))?.value?.trim() || '';
  const checked = field => document.getElementById(fdRequestInputId(request.id, field))?.checked === true;

  return {
    ...original,
    displayName: value('displayName'),
    email: value('email'),
    phone: value('phone'),
    birthday: value('birthday'),
    address: value('address'),
    city: value('city'),
    country: value('country'),
    preferredContact: value('preferredContact') || 'email',
    privacy: {
      showPhone: checked('showPhone'),
      showEmail: checked('showEmail'),
      showAddress: checked('showAddress'),
      showBirthday: checked('showBirthday'),
      showAge: checked('showAge')
    }
  };
}

function renderPhotoRequestEditor(request) {
  const payload = request.payload || {};
  const thumbnail = payload.thumbnailUrl || '';

  if (request.type === 'photo_remove') {
    return `
      <div style="display:flex;gap:12px;align-items:center;background:#fff7f7;border:1px solid #f4d5d5;border-radius:12px;padding:12px">
        ${thumbnail ? `<img src="${fdIndexEscape(thumbnail)}" alt="" style="width:82px;height:62px;object-fit:cover;border-radius:8px;background:#eee">` : ''}
        <div>
          <strong style="color:#2c3e50">${fdIndexEscape(payload.photoName || payload.photoId || 'Tagged media')}</strong>
          <p style="margin:4px 0 0;color:#777;font-size:.82rem">This removes only this member's tag from the photo or video. The media stays published.</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="fd-field">
      <label for="${fdRequestInputId(request.id, 'url')}">Google Drive or YouTube link</label>
      <input type="url" id="${fdRequestInputId(request.id, 'url')}" value="${fdIndexEscape(payload.url)}">
    </div>
    <div class="fd-field">
      <label for="${fdRequestInputId(request.id, 'title')}">Title or description</label>
      <input type="text" id="${fdRequestInputId(request.id, 'title')}" value="${fdIndexEscape(payload.title || payload.photoName)}">
    </div>
    <div class="fd-field">
      <label for="${fdRequestInputId(request.id, 'notes')}">Member note</label>
      <textarea id="${fdRequestInputId(request.id, 'notes')}" rows="3">${fdIndexEscape(payload.notes || payload.reason)}</textarea>
    </div>
  `;
}

function collectPhotoAddRequestPayload(request) {
  const original = request.payload || {};
  const value = field => document.getElementById(fdRequestInputId(request.id, field))?.value?.trim() || '';
  const url = value('url');

  return {
    ...original,
    url,
    title: value('title'),
    notes: value('notes'),
    mediaType: /youtu/i.test(url) ? 'video' : (original.mediaType || 'photo')
  };
}

function renderMemberRequests() {
  const list = document.getElementById('fd-member-requests-list');
  if (!list) return;

  if (!fdPendingMemberRequests.length) {
    list.innerHTML = '<p style="color:#999;text-align:center;padding:20px">No pending member requests.</p>';
    return;
  }

  list.innerHTML = fdPendingMemberRequests.map(request => `
    <div style="border:1px solid #ececec;border-radius:14px;padding:16px;margin-bottom:14px;background:#fff;box-shadow:0 8px 24px rgba(0,0,0,.04)">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px">
        <div>
          <strong style="display:block;color:#2c3e50;font-size:.98rem">${fdIndexEscape(fdMemberRequestStatusText(request))}</strong>
          <span style="color:#8a8f98;font-size:.78rem">${fdIndexEscape(request.memberEmail || request.memberId || '')}</span>
        </div>
        <span style="background:#eef6ff;border:1px solid #cfe5ff;color:#285f9d;border-radius:999px;padding:5px 9px;font-size:.72rem;font-weight:700;text-transform:uppercase;white-space:nowrap">
          ${fdIndexEscape(request.status || 'pending')}
        </span>
      </div>
      ${request.type === 'profile_update' ? renderProfileRequestEditor(request) : renderPhotoRequestEditor(request)}
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px">
        <button class="fd-admin-btn" style="background:#7f8c8d" onclick="rejectDirectoryMemberRequest('${fdIndexEscape(request.id)}')">Reject</button>
        <button class="fd-admin-btn" style="background:#27ae60" onclick="approveDirectoryMemberRequest('${fdIndexEscape(request.id)}')">Approve</button>
      </div>
    </div>
  `).join('');
}

async function openMemberRequestsModal() {
  const modal = document.getElementById('fd-member-requests-modal');
  const list = document.getElementById('fd-member-requests-list');
  if (!modal || !list) return;

  modal.classList.add('active');
  list.innerHTML = '<p style="color:#999;text-align:center;padding:20px">Loading member requests...</p>';

  try {
    fdPendingMemberRequests = await fetchPendingMemberRequests();
    const countEl = document.getElementById('fd-member-request-count');
    if (countEl) countEl.textContent = fdPendingMemberRequests.length;
    renderMemberRequests();
  } catch (error) {
    console.error('Could not load member requests:', error);
    list.innerHTML = '<p style="color:#999;text-align:center;padding:20px">Member requests could not be loaded.</p>';
  }
}

function closeMemberRequestsModal() {
  document.getElementById('fd-member-requests-modal')?.classList.remove('active');
}

async function approveDirectoryMemberRequest(requestId) {
  const request = fdPendingMemberRequests.find(item => item.id === requestId);
  if (!request) return;

  const approveButton = globalThis.event?.target || null;
  if (approveButton) approveButton.disabled = true;

  try {
    const overrides = {};
    if (request.type === 'profile_update') {
      overrides.payload = collectProfileRequestPayload(request);
    } else if (request.type === 'photo_add') {
      overrides.payload = collectPhotoAddRequestPayload(request);
    }

    const result = await approveMemberRequest(requestId, overrides);
    fdToast(result?.publishStatus === 'approved_manual_followup'
      ? 'Request approved. Manual photo follow-up is still needed.'
      : 'Member request approved.');
    await openMemberRequestsModal();
    if (typeof onPageReady === 'function') onPageReady();
  } catch (error) {
    console.error(error);
    fdToast(error.message || 'Could not approve this request.');
  } finally {
    if (approveButton) approveButton.disabled = false;
  }
}

async function rejectDirectoryMemberRequest(requestId) {
  const request = fdPendingMemberRequests.find(item => item.id === requestId);
  if (!request) return;

  const note = window.prompt('Optional note for this rejection:') || '';

  try {
    await rejectMemberRequest(requestId, note);
    fdToast('Member request rejected.');
    await openMemberRequestsModal();
    if (typeof onPageReady === 'function') onPageReady();
  } catch (error) {
    console.error(error);
    fdToast(error.message || 'Could not reject this request.');
  }
}

window.loadMemberRequestCount = loadMemberRequestCount;
window.openMemberRequestsModal = openMemberRequestsModal;
window.closeMemberRequestsModal = closeMemberRequestsModal;
window.approveDirectoryMemberRequest = approveDirectoryMemberRequest;
window.rejectDirectoryMemberRequest = rejectDirectoryMemberRequest;
