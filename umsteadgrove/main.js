/* ─── CONFIG-DRIVEN RENDER ──────────────────────────────────────────────────── */
(function () {
  const C = SITE_CONFIG;
  const P = C.property;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));

  // Meta
  document.getElementById('meta-title').textContent = C.site.title;
  document.getElementById('meta-desc').setAttribute('content', C.site.description);
  document.getElementById('og-title').setAttribute('content', C.site.title);
  document.getElementById('og-image').setAttribute('content', C.site.ogImage);
  document.getElementById('og-url').setAttribute('content', C.site.url);
  document.querySelector('meta[name=theme-color]').setAttribute('content', C.site.themeColor);

  // Hero
  document.getElementById('hero-address').textContent = `${P.address}, ${P.city}, ${P.state} ${P.zip}`;
  document.getElementById('hero-price').textContent = P.price;
  document.getElementById('stat-beds').textContent = P.beds;
  document.getElementById('stat-baths').textContent = P.baths;
  document.getElementById('stat-sqft').textContent = P.sqft;
  document.getElementById('stat-lot').textContent = P.lotSize;
  document.getElementById('stat-year').textContent = P.yearBuilt;

  // Seller concession badge
  if (C.sellerConcession && C.sellerConcession.offer) {
    const badge = document.getElementById('hero-concession-badge');
    document.getElementById('hero-concession-text').textContent = `Seller offering ${C.sellerConcession.offer}`;
    badge.style.display = 'block';
  }

  // Email pre-approval mailto link
  const emailLink = document.getElementById('cta-email-preapproval');
  emailLink.href = `mailto:${C.seller.email}?subject=Pre-Approval Letter – ${P.address}&body=Hello,%0A%0APlease find my pre-approval letter attached.%0A%0AThank you.`;

  // Seller contact sidebar
  document.getElementById('seller-email-display').textContent = C.seller.email;
  document.getElementById('seller-email-link').href = `mailto:${C.seller.email}`;
  document.getElementById('seller-contact-info').textContent =
    `${C.seller.name} · ${C.seller.email}` + (C.seller.phone ? ` · ${C.seller.phone}` : '');

  // Highlights
  const hGrid = document.getElementById('highlights-grid');
  C.highlights.forEach(h => {
    hGrid.innerHTML += `
      <div class="highlight-card reveal">
        <div class="highlight-icon">${h.icon}</div>
        <h3>${h.title}</h3>
        <p>${h.desc}</p>
      </div>`;
  });
  if (C.ownerUpgrades) {
    document.getElementById('upgrade-summary').innerHTML = `
      <div class="upgrade-total">
        <span>Owner upgrades included</span>
        <strong>${esc(C.ownerUpgrades.total)}</strong>
      </div>
      <div class="upgrade-list">
        ${C.ownerUpgrades.items.map(item => `
          <div>
            <span>${esc(item.label)}</span>
            <strong>${esc(item.value)}</strong>
          </div>
        `).join('')}
      </div>
      <p>${esc(C.ownerUpgrades.note)}</p>`;
  }

  // Gallery
  const gGrid = document.getElementById('gallery-grid');
  C.gallery.forEach((img, i) => {
    gGrid.innerHTML += `
      <div class="gallery-item reveal" data-index="${i}" role="button" tabindex="0" aria-label="View ${img.alt}">
        <img src="${img.src}" alt="${img.alt}" loading="${i > 1 ? 'lazy' : 'eager'}">
        <div class="gallery-caption">${img.caption}</div>
      </div>`;
  });

  // Neighborhood
  document.getElementById('neighborhood-desc').textContent = C.neighborhood.description;
  const pList = document.getElementById('proximity-list');
  C.neighborhood.nearbyPoints.forEach(pt => {
    pList.innerHTML += `
      <li class="reveal">
        <span class="proximity-name">📍 ${pt.name}</span>
        <span class="proximity-dist">${pt.distance}</span>
      </li>`;
  });
  if (C.neighborhood.communityFacts) {
    document.getElementById('community-facts').innerHTML =
      C.neighborhood.communityFacts.map(item => `
        <div>
          <span>${esc(item.label)}</span>
          <strong>${esc(item.value)}</strong>
        </div>
      `).join('');
  }
  if (C.neighborhood.googleMapsEmbed) {
    document.getElementById('map-container').innerHTML =
      `<iframe title="Map of Umstead Grove in Durham, NC" src="${C.neighborhood.googleMapsEmbed}" width="100%" height="320" style="border:0;border-radius:12px" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
  }

  // Market context
  if (C.marketComparison) {
    const M = C.marketComparison;
    document.getElementById('market-updated').textContent = `Updated ${M.updated}`;
    document.getElementById('market-intro').textContent = M.intro;
    document.getElementById('market-grid').innerHTML = `
      <article class="market-card featured">
        <span class="market-pill">This home</span>
        <h3>${esc(M.subject.price)} · ${esc(M.subject.sqft)} sq ft · ${esc(M.subject.pricePerSqft)}/sq ft</h3>
        <p>${esc(M.subject.note)}</p>
      </article>
      <div class="market-comps">
        ${M.comps.map(home => `
          <div class="market-comp-row">
            <strong>${esc(home.label)}</strong>
            <span>${esc(home.price)} · ${esc(home.sqft)} sq ft · ${esc(home.pricePerSqft)}/sq ft</span>
          </div>
        `).join('')}
      </div>`;
    document.getElementById('market-takeaways').innerHTML =
      M.takeaways.map(item => `<li>${esc(item)}</li>`).join('');
    document.getElementById('market-disclaimer').textContent = M.disclaimer;
  }

  // Disclosures
  const dList = document.getElementById('disclosure-list');
  if (dList && C.disclosures) {
    C.disclosures.availableItems.forEach(item => {
      dList.innerHTML += `<li>${item}</li>`;
    });
    document.getElementById('disclosure-notes').textContent = C.disclosures.notes;
  }

  // Seller Improvements callout
  if (C.sellerConcession && document.querySelector('.disclosure-grid')) {
    const improvementsHtml = `
      <div class="disclosure-card reveal" style="border-left-color:var(--green-mid)">
        <h3>🔨 Seller Improvements Since Purchase</h3>
        <ul>
          <li>Garage professionally finished and freshly painted</li>
          <li>Back patio extended and screened covered area added</li>
          <li>Full vinyl privacy fence installed</li>
          <li>Enclosed structure built for garbage &amp; recycling bins</li>
          <li>Dedicated home gym included with sale</li>
        </ul>
        <p style="font-size:0.85rem;color:var(--text-light);margin-top:12px">
          🎁 <strong style="color:var(--green-dark)">Seller's Concession:</strong> ${C.sellerConcession.detail}
        </p>
      </div>`;
    document.querySelector('.disclosure-grid').insertAdjacentHTML('beforeend', improvementsHtml);
  }

  // HOA
  const hoaList = document.getElementById('hoa-list');
  const H = C.hoa;
  if (hoaList && H.hasHoa) {
    const hoaItems = [
      `HOA: ${H.hoaName}`,
      `Monthly Fee: ${H.monthlyFee}`,
      `Managed by: ${H.managementCo}`,
      `Includes: ${H.includes.join(', ')}`,
      `Documents: ${H.documents}`,
    ];
    hoaItems.forEach(item => { hoaList.innerHTML += `<li>${item}</li>`; });
  } else if (hoaList) {
    hoaList.innerHTML = '<li>No HOA</li>';
  }

  // FAQ
  const faqList = document.getElementById('faq-list');
  if (faqList) {
    C.faq.forEach((item, i) => {
      faqList.innerHTML += `
      <div class="faq-item reveal" id="faq-item-${i}">
        <button class="faq-q" aria-expanded="false" aria-controls="faq-a-${i}">
          <span>${item.q}</span>
          <span class="faq-arrow">▾</span>
        </button>
        <div class="faq-a" id="faq-a-${i}">
          <div class="faq-a-inner">${item.a}</div>
        </div>
      </div>`;
    });
  }

  // Footer
  document.getElementById('footer-copy').textContent =
    `© ${new Date().getFullYear()} For Sale By Owner — ${P.address}, ${P.city}, ${P.state}. Equal Housing Opportunity 🏛️`;
})();

/* ─── NAV ───────────────────────────────────────────────────────────────────── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

const hamburger = document.getElementById('hamburger');
const navMobile = document.getElementById('nav-mobile');
hamburger.addEventListener('click', () => navMobile.classList.toggle('open'));
navMobile.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navMobile.classList.remove('open')));

/* ─── FAQ ACCORDION ─────────────────────────────────────────────────────────── */
document.addEventListener('click', e => {
  const btn = e.target.closest('.faq-q');
  if (!btn) return;
  const item = btn.closest('.faq-item');
  const answer = item.querySelector('.faq-a');
  const isOpen = item.classList.contains('open');
  // Close all
  document.querySelectorAll('.faq-item.open').forEach(i => {
    i.classList.remove('open');
    i.querySelector('.faq-a').style.maxHeight = '0';
    i.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
  });
  if (!isOpen) {
    item.classList.add('open');
    answer.style.maxHeight = answer.scrollHeight + 'px';
    btn.setAttribute('aria-expanded', 'true');
  }
});

/* ─── GALLERY LIGHTBOX ──────────────────────────────────────────────────────── */
let lbIndex = 0;
const gallery = SITE_CONFIG.gallery;
const lb = document.getElementById('lightbox');
const lbImg = document.getElementById('lb-img');
const lbCaption = document.getElementById('lb-caption');

function openLightbox(index) {
  lbIndex = index;
  const item = gallery[index];
  lbImg.src = item.src;
  lbImg.alt = item.alt;
  lbCaption.textContent = item.caption;
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  lb.classList.remove('open');
  document.body.style.overflow = '';
}
function navLightbox(dir) {
  lbIndex = (lbIndex + dir + gallery.length) % gallery.length;
  openLightbox(lbIndex);
}

document.addEventListener('click', e => {
  const item = e.target.closest('.gallery-item');
  if (item) { openLightbox(parseInt(item.dataset.index)); return; }
  if (e.target === lb) closeLightbox();
});
document.getElementById('lb-close').addEventListener('click', closeLightbox);
document.getElementById('lb-prev').addEventListener('click', () => navLightbox(-1));
document.getElementById('lb-next').addEventListener('click', () => navLightbox(1));
document.addEventListener('keydown', e => {
  if (!lb.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') navLightbox(-1);
  if (e.key === 'ArrowRight') navLightbox(1);
});

/* ─── FILE UPLOAD ───────────────────────────────────────────────────────────── */
const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('f-upload');
const fileNameEl = document.getElementById('upload-file-name');
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

uploadZone.addEventListener('click', () => fileInput.click());
uploadZone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('dragover'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) validateAndSetFile(file);
});
fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) validateAndSetFile(fileInput.files[0]);
});

function validateAndSetFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    showToast('Only PDF, JPG, or PNG files are accepted.', 'error');
    fileInput.value = '';
    fileNameEl.textContent = '';
    return;
  }
  if (file.size > MAX_SIZE) {
    showToast('File is too large. Maximum size is 10 MB.', 'error');
    fileInput.value = '';
    fileNameEl.textContent = '';
    return;
  }
  fileNameEl.textContent = `✓ ${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
}

/* ─── FORM VALIDATION & SUBMISSION ─────────────────────────────────────────── */
const form = document.getElementById('buyer-form');

form.addEventListener('submit', async e => {
  e.preventDefault();
  if (!validateForm()) return;

  const submitBtn = document.getElementById('submit-btn');
  const submitLabel = document.getElementById('submit-label');
  submitBtn.disabled = true;
  submitLabel.innerHTML = '<span class="spinner"></span>';

  // Analytics event
  gtag_event('form_submit', { event_category: 'lead', event_label: 'buyer_registration' });

  try {
    const data = buildFormData();
    const res = await fetch('/api/umsteadgrove/submit', {
      method: 'POST',
      body: data,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || 'Submission failed.');

    form.reset();
    fileNameEl.textContent = '';
    document.getElementById('success-banner').classList.add('show');
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('✅ Submission received! Check your email.');
  } catch (err) {
    showToast(err.message || 'Something went wrong. Please try again or email directly.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitLabel.textContent = 'Submit Buyer Information';
  }
});

function buildFormData() {
  const fd = new FormData();
  const fields = ['fullName','email','phone','contactPreference','preApprovalStatus',
    'lenderName','budget','hasBuyerAgent','agentName','agentContact',
    'showingDateTime','message','consentUpdates','ackNoContract','ackNoSensitive','ackPrivacy'];
  fields.forEach(f => {
    const el = form.elements[f];
    if (!el) return;
    if (el.type === 'checkbox') fd.append(f, el.checked ? 'true' : 'false');
    else fd.append(f, el.value);
  });
  const file = fileInput.files[0];
  if (file) fd.append('preApprovalFile', file);
  return fd;
}

function validateForm() {
  let ok = true;
  const required = ['f-name','f-email','f-phone','f-contact-pref','f-preapproved','f-agent'];
  required.forEach(id => {
    const el = document.getElementById(id);
    const errId = { 'f-name': 'err-name', 'f-email': 'err-email', 'f-phone': 'err-phone' }[id];
    if (!el.value.trim()) {
      el.classList.add('error');
      if (errId) document.getElementById(errId)?.classList.add('show');
      ok = false;
    } else {
      el.classList.remove('error');
      if (errId) document.getElementById(errId)?.classList.remove('show');
    }
  });
  // Email format
  const emailEl = document.getElementById('f-email');
  if (emailEl.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
    emailEl.classList.add('error');
    document.getElementById('err-email').classList.add('show');
    ok = false;
  }
  // Required checkboxes
  const reqChecks = ['chk-no-contract','chk-no-sensitive','chk-privacy'];
  const allChecked = reqChecks.every(id => document.getElementById(id).checked);
  if (!allChecked) {
    document.getElementById('err-checkboxes').classList.add('show');
    ok = false;
  } else {
    document.getElementById('err-checkboxes').classList.remove('show');
  }
  return ok;
}

// Clear error on input
['f-name','f-email','f-phone'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', () => {
    document.getElementById(id).classList.remove('error');
  });
});

/* ─── ANALYTICS HELPERS ─────────────────────────────────────────────────────── */
function gtag_event(action, params = {}) {
  try { window.gtag && window.gtag('event', action, params); } catch(_) {}
}
// Track CTA clicks
['cta-showing','cta-info','cta-email-preapproval','cta-tour','nav-cta-btn'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', () => {
    gtag_event('cta_click', { event_category: 'engagement', event_label: id });
  });
});

/* ─── SCROLL REVEAL ─────────────────────────────────────────────────────────── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); } });
}, { threshold: 0.1 });
// Observe all .reveal elements (including dynamically injected ones from IIFE)
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ─── TOAST ─────────────────────────────────────────────────────────────────── */
let toastTimer;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = type === 'error' ? 'show error' : 'show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = ''; }, 4000);
}
