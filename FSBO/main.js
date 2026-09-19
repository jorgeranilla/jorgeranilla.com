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
  const titleEl = document.getElementById('meta-title') || document.querySelector('title');
  if (titleEl) titleEl.textContent = C.site.title;
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


  // Seller contact sidebar
  const emailDisplayEl = document.getElementById('seller-email-display');
  const emailLinkEl = document.getElementById('seller-email-link');
  if (emailDisplayEl && emailLinkEl && C.seller.email) {
    emailDisplayEl.textContent = C.seller.email;
    emailLinkEl.href = `mailto:${C.seller.email}`;
  }
  const nameEl = document.getElementById('seller-name-display');
  if (nameEl) nameEl.textContent = C.seller.name;
  const phoneDisplayEl = document.getElementById('seller-phone-display');
  const phoneLinkEl = document.getElementById('seller-phone-link');
  if (phoneDisplayEl && C.seller.phone) {
    phoneDisplayEl.textContent = C.seller.phone;
    if (phoneLinkEl) phoneLinkEl.href = `tel:${C.seller.phone.replace(/\D/g,'')}`;
  } else if (phoneLinkEl) {
    phoneLinkEl.style.display = 'none';
  }

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
function syncNavChrome() {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}
syncNavChrome();
window.addEventListener('scroll', syncNavChrome, { passive: true });

const hamburger = document.getElementById('hamburger');
const navMobile = document.getElementById('nav-mobile');
function setMobileMenu(open) {
  navMobile.classList.toggle('open', open);
  nav.classList.toggle('menu-open', open);
  hamburger.setAttribute('aria-expanded', String(open));
}
hamburger.setAttribute('aria-expanded', 'false');
hamburger.addEventListener('click', () => setMobileMenu(!navMobile.classList.contains('open')));
navMobile.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMobileMenu(false)));
window.addEventListener('resize', () => {
  if (window.innerWidth > 768) setMobileMenu(false);
}, { passive: true });

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

function showLightboxImage(src, alt, caption) {
  lbImg.src = src;
  lbImg.alt = alt;
  lbCaption.textContent = caption;
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function openLightbox(index) {
  lbIndex = index;
  const item = gallery[index];
  showLightboxImage(item.src, item.alt, item.caption);
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
  const planItem = e.target.closest('.plan-lot-item');
  if (planItem) {
    showLightboxImage(planItem.dataset.lightboxSrc, planItem.dataset.lightboxAlt, planItem.dataset.lightboxCaption);
    return;
  }
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

/* ─── ANALYTICS HELPERS ─────────────────────────────────────────────────────── */
function gtag_event(action, params = {}) {
  try { window.gtag && window.gtag('event', action, params); } catch(_) {}
}
// Track CTA clicks
['cta-showing','cta-info','cta-tour','nav-cta-btn'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', () => {
    gtag_event('cta_click', { event_category: 'engagement', event_label: id });
  });
});

/* ─── SCROLL REVEAL ─────────────────────────────────────────────────────────── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); } });
}, { threshold: 0.08 });

function observeRevealElements() {
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => revealObserver.observe(el));
}
// Observe on load and after a short delay (captures dynamically rendered items)
observeRevealElements();
setTimeout(observeRevealElements, 100);

/* ─── TOAST ─────────────────────────────────────────────────────────────────── */
let toastTimer;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = type === 'error' ? 'show error' : 'show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = ''; }, 4000);
}
