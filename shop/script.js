/* ================================================
   JORGE RANILLA SHOP — Store JS
   Cart: localStorage  |  Products: fetch from JSON
================================================ */

/* ─── CART STORAGE ───────────────────────────── */
const CART_KEY = 'jr_shop_cart';

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(product, size, qty = 1) {
  const cart = getCart();
  const key = `${product.id}__${size}`;
  const existing = cart.find(i => i.key === key);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      key,
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size,
      qty
    });
  }
  saveCart(cart);
  showToast(`${product.name} added to cart`);
}

function removeFromCart(key) {
  const cart = getCart().filter(i => i.key !== key);
  saveCart(cart);
}

function updateQty(key, delta) {
  const cart = getCart();
  const item = cart.find(i => i.key === key);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart(cart);
}

function cartTotal() {
  return getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
}

function cartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

function updateCartBadge() {
  document.querySelectorAll('.cart-badge').forEach(el => {
    const count = cartCount();
    el.textContent = count;
    el.classList.toggle('visible', count > 0);
  });
}

/* ─── TOAST ──────────────────────────────────── */
function showToast(msg) {
  let toast = document.getElementById('shop-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'shop-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2500);
}

/* ─── PRODUCT LOADING ────────────────────────── */
async function loadProducts() {
  try {
    const r = await fetch('data/products.json');
    if (!r.ok) throw new Error('fetch failed');
    return await r.json();
  } catch (e) {
    console.error('Could not load products.json', e);
    return [];
  }
}

/* ─── STOREFRONT (index.html) ────────────────── */
async function initStorefront() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  const products = await loadProducts();
  window._shopProducts = products;

  renderProductGrid(products, grid);
  initFilters(products, grid);
}

function renderProductGrid(products, grid) {
  grid.innerHTML = products.length === 0
    ? `<p style="color:var(--ink-muted);padding:40px 0;">No products found.</p>`
    : products.map(p => productCardHTML(p)).join('');

  // Quick-add buttons
  grid.querySelectorAll('.card-quick-add').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.id;
      const product = window._shopProducts.find(p => p.id === id);
      if (!product) return;
      if (product.sizes.length === 1) {
        addToCart(product, product.sizes[0]);
      } else {
        openQuickAdd(product);
      }
    });
  });
}

function productCardHTML(p) {
  const badgeMap = { 'New': '', 'Bestseller': 'bestseller', 'Limited': 'limited' };
  const badgeClass = p.badge ? badgeMap[p.badge] || '' : '';
  return `
    <a class="product-card" href="product.html?id=${p.id}">
      <div class="card-image-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
        ${p.badge ? `<span class="card-badge ${badgeClass}">${p.badge}</span>` : ''}
        <div class="card-actions">
          <button class="card-quick-add" data-id="${p.id}" aria-label="Quick add ${p.name}">Quick Add</button>
        </div>
      </div>
      <div class="card-info">
        <div class="card-category">${p.category}</div>
        <div class="card-name">${p.name}</div>
        <div class="card-price">$${p.price}</div>
      </div>
    </a>`;
}

function initFilters(products, grid) {
  const bar = document.getElementById('filter-bar');
  if (!bar) return;

  bar.addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    bar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const cat = btn.dataset.cat;
    const filtered = cat === 'all' ? products : products.filter(p => p.category === cat);
    renderProductGrid(filtered, grid);
  });
}

/* ─── QUICK-ADD MODAL ────────────────────────── */
function openQuickAdd(product) {
  let modal = document.getElementById('quick-add-modal');
  if (!modal) {
    modal = createQuickAddModal();
    document.body.appendChild(modal);
  }

  modal.querySelector('.modal-product-name').textContent = product.name;
  modal.querySelector('.modal-product-price').textContent = `$${product.price}`;

  const sizeGrid = modal.querySelector('.modal-sizes');
  sizeGrid.innerHTML = product.sizes.map(s =>
    `<button class="size-btn" data-size="${s}">${s}</button>`
  ).join('');

  let selectedSize = null;
  sizeGrid.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sizeGrid.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedSize = btn.dataset.size;
    });
  });

  const addBtn = modal.querySelector('.modal-add-btn');
  addBtn.onclick = () => {
    if (!selectedSize) { showToast('Please select a size'); return; }
    addToCart(product, selectedSize);
    closeModal(modal);
  };

  modal.classList.add('open');
}

function createQuickAddModal() {
  const overlay = document.createElement('div');
  overlay.id = 'quick-add-modal';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-panel">
      <div class="modal-header">
        <div>
          <div class="product-category-label">Select Size</div>
          <div class="product-name modal-product-name" style="font-size:20px;margin-bottom:4px;"></div>
          <div class="product-price-display modal-product-price" style="font-size:16px;margin:0;padding:0;border:none;"></div>
        </div>
        <button class="modal-close" aria-label="Close">&#215;</button>
      </div>
      <div class="size-grid modal-sizes"></div>
      <button class="btn-primary modal-add-btn" style="width:100%;justify-content:center;margin-top:16px;">
        Add to Cart
      </button>
    </div>`;
  overlay.querySelector('.modal-close').addEventListener('click', () => closeModal(overlay));
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(overlay); });
  return overlay;
}

function closeModal(modal) { modal.classList.remove('open'); }

/* ─── PRODUCT DETAIL (product.html) ──────────── */
async function initProductDetail() {
  const wrap = document.getElementById('product-detail-root');
  if (!wrap) return;

  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  if (!id) { wrap.innerHTML = '<p>Product not found.</p>'; return; }

  const products = await loadProducts();
  const product = products.find(p => p.id === id);
  if (!product) { wrap.innerHTML = '<p>Product not found.</p>'; return; }

  document.title = `${product.name} — Bloomsai Co.`;

  wrap.innerHTML = productDetailHTML(product);
  initDetailInteractions(product);
}

function productDetailHTML(p) {
  return `
    <div class="product-detail">
      <div class="product-gallery">
        <div class="gallery-main">
          <img src="${p.image}" alt="${p.name}" id="gallery-main-img" />
        </div>
      </div>

      <div class="product-info-panel">
        <div class="product-breadcrumb">
          <a href="index.html">Shop</a>
          <span>/</span>
          <span>${p.category}</span>
        </div>

        <div class="product-category-label">${p.category}</div>
        <h1 class="product-name">${p.name}</h1>
        <div class="product-price-display">$${p.price}</div>
        <p class="product-desc">${p.description}</p>

        ${p.sizes.length > 1 ? `
        <div class="size-label">
          Size
          <span class="size-guide">Size Guide</span>
        </div>
        <div class="size-grid" id="size-selector">
          ${p.sizes.map(s => `<button class="size-btn" data-size="${s}">${s}</button>`).join('')}
        </div>` : ''}

        <div class="add-to-cart-row">
          <div class="qty-control">
            <button class="qty-btn" id="qty-minus">&#8722;</button>
            <div class="qty-value" id="qty-value">1</div>
            <button class="qty-btn" id="qty-plus">&#43;</button>
          </div>
          <button class="btn-add-cart" id="add-to-cart-btn">Add to Cart</button>
        </div>

        <div class="accordion">
          <div class="accordion-item">
            <button class="accordion-trigger" data-acc="details">
              Details & Materials
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14" stroke-width="1.5"/></svg>
            </button>
            <div class="accordion-body" id="acc-details">
              <ul>${(p.details || []).map(d => `<li>${d}</li>`).join('')}</ul>
            </div>
          </div>
          <div class="accordion-item">
            <button class="accordion-trigger" data-acc="shipping">
              Shipping & Returns
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14" stroke-width="1.5"/></svg>
            </button>
            <div class="accordion-body" id="acc-shipping">
              <ul>
                <li>Free shipping on orders over $75</li>
                <li>Standard shipping: 5–7 business days</li>
                <li>Express shipping: 2–3 business days</li>
                <li>30-day hassle-free returns on unworn items</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

function initDetailInteractions(product) {
  let selectedSize = product.sizes.length === 1 ? product.sizes[0] : null;
  let qty = 1;

  // Size selector
  const sizeGrid = document.getElementById('size-selector');
  if (sizeGrid) {
    sizeGrid.querySelectorAll('.size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sizeGrid.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedSize = btn.dataset.size;
      });
    });
  }

  // Qty
  document.getElementById('qty-minus')?.addEventListener('click', () => {
    qty = Math.max(1, qty - 1);
    document.getElementById('qty-value').textContent = qty;
  });
  document.getElementById('qty-plus')?.addEventListener('click', () => {
    qty++;
    document.getElementById('qty-value').textContent = qty;
  });

  // Add to cart
  document.getElementById('add-to-cart-btn')?.addEventListener('click', () => {
    if (!selectedSize) { showToast('Please select a size'); return; }
    addToCart(product, selectedSize, qty);
    const btn = document.getElementById('add-to-cart-btn');
    btn.textContent = '✓ Added';
    btn.classList.add('added');
    setTimeout(() => { btn.textContent = 'Add to Cart'; btn.classList.remove('added'); }, 2000);
  });

  // Accordion
  document.querySelectorAll('.accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const id = trigger.dataset.acc;
      const body = document.getElementById(`acc-${id}`);
      const isOpen = body.classList.contains('open');
      // Close all
      document.querySelectorAll('.accordion-body').forEach(b => b.classList.remove('open'));
      document.querySelectorAll('.accordion-trigger').forEach(t => t.classList.remove('open'));
      if (!isOpen) { body.classList.add('open'); trigger.classList.add('open'); }
    });
  });
}

/* ─── CART PAGE (cart.html) ──────────────────── */
function initCartPage() {
  const root = document.getElementById('cart-root');
  if (!root) return;
  renderCartPage(root);
}

function renderCartPage(root) {
  const cart = getCart();

  if (cart.length === 0) {
    root.innerHTML = `
      <div class="cart-empty">
        <svg viewBox="0 0 24 24" fill="none"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke-width="1"/><line x1="3" y1="6" x2="21" y2="6" stroke-width="1"/><path d="M16 10a4 4 0 01-8 0" stroke-width="1"/></svg>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything yet.</p>
        <a href="index.html" class="btn-primary" style="margin-top:8px;text-align:center;">Continue Shopping</a>
      </div>`;
    return;
  }

  const subtotal = cartTotal();
  const shipping = subtotal >= 75 ? 0 : 8;
  const total = subtotal + shipping;

  root.innerHTML = `
    <div class="cart-layout">
      <div class="cart-items-col">
        <h1 class="cart-title">
          Cart
          <span class="cart-count-label">${cartCount()} item${cartCount() !== 1 ? 's' : ''}</span>
        </h1>
        <div id="cart-items-list">
          ${cart.map(item => cartItemHTML(item)).join('')}
        </div>
      </div>

      <div class="cart-summary-col">
        <div class="cart-summary">
          <div class="summary-title">Order Summary</div>
          <div class="summary-row">
            <span>Subtotal</span>
            <span>$${subtotal.toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>Shipping</span>
            <span>${shipping === 0 ? '<span style="color:#1a6b3c;font-weight:600;">Free</span>' : '$' + shipping.toFixed(2)}</span>
          </div>
          <div class="summary-row total">
            <span>Total</span>
            <span>$${total.toFixed(2)}</span>
          </div>
          <button class="btn-checkout" onclick="handleCheckout()">Proceed to Checkout</button>
          <p class="summary-note">Taxes calculated at checkout.<br>Free shipping on orders over $75.</p>
        </div>
        <a href="index.html" class="section-link" style="margin-top:16px;display:flex;">
          ← Continue Shopping
        </a>
      </div>
    </div>`;

  // Attach cart interactions
  document.getElementById('cart-items-list').addEventListener('click', e => {
    const removeBtn = e.target.closest('.cart-remove');
    const qtyBtn = e.target.closest('.cart-qty-btn');
    if (removeBtn) {
      const key = removeBtn.dataset.key;
      removeFromCart(key);
      renderCartPage(root);
    }
    if (qtyBtn) {
      const key = qtyBtn.dataset.key;
      const delta = parseInt(qtyBtn.dataset.delta);
      updateQty(key, delta);
      renderCartPage(root);
    }
  });
}

function cartItemHTML(item) {
  return `
    <div class="cart-item" data-key="${item.key}">
      <div class="cart-item-image">
        <img src="${item.image}" alt="${item.name}" />
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-meta">Size: ${item.size}</div>
        <div class="cart-item-price-line">$${item.price} each</div>
        <div class="cart-item-qty">
          <button class="cart-qty-btn" data-key="${item.key}" data-delta="-1" aria-label="Decrease quantity">&#8722;</button>
          <div class="cart-qty-val">${item.qty}</div>
          <button class="cart-qty-btn" data-key="${item.key}" data-delta="1" aria-label="Increase quantity">&#43;</button>
        </div>
      </div>
      <div class="cart-item-controls">
        <div class="cart-line-total">$${(item.price * item.qty).toFixed(2)}</div>
        <button class="cart-remove" data-key="${item.key}">Remove</button>
      </div>
    </div>`;
}

function handleCheckout() {
  const cart = getCart();
  if (cart.length === 0) return;

  const lines = cart.map(i => `${i.qty}x ${i.name} (${i.size}) — $${(i.price * i.qty).toFixed(2)}`).join('%0A');
  const total = cartTotal().toFixed(2);
  const subject = `Bloomsai Co. — Order Request`;
  const body = `Hello,%0A%0AI'd like to place an order:%0A%0A${lines}%0A%0AOrder Total: $${total}%0A%0APlease let me know how to proceed.`;
  window.location.href = `mailto:hello@jorgeranilla.com?subject=${encodeURIComponent(subject)}&body=${body}`;
}

/* ─── INIT ───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  initStorefront();
  initProductDetail();
  initCartPage();
});
