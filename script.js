// Capture script source immediately before it becomes null in callbacks
const appScriptSource = document.currentScript ? document.currentScript.src : null;

document.addEventListener("DOMContentLoaded", () => {
  /* ===========================
     Shared Header & Social Rail Injection
     - Calculates relative paths based on current page depth
  =========================== */
  (function injectSharedHeader() {
    // Calculate depth relative to the script location (which is at project root)
    // Fallback search if currentScript was null (e.g. if loaded initially as module or some other edge case)
    let scriptUrl = appScriptSource;
    if (!scriptUrl) {
      // Fallback: try to find script by filename if capture failed
      const scripts = document.querySelectorAll('script[src*="script.js"]');
      if (scripts.length > 0) {
        scriptUrl = scripts[0].src;
      }
    }

    if (scriptUrl) scriptUrl = scriptUrl.split('?')[0];
    const scriptDir = scriptUrl ? scriptUrl.substring(0, scriptUrl.lastIndexOf('/')) : '';

    const pageUrl = window.location.href.split('?')[0].split('#')[0];
    const pageDir = pageUrl.substring(0, pageUrl.lastIndexOf('/'));

    let depth = 0;
    if (pageDir.startsWith(scriptDir)) {
      const relativePath = pageDir.substring(scriptDir.length);
      depth = relativePath.split('/').filter(p => p).length;
    }

    // Current section is the immediate parent directory (if any)
    // We assume the strict structure: root -> section -> file
    const currentSection = depth > 0 ? pageDir.split('/').pop() : null;

    const prefix = depth > 0 ? "../".repeat(depth) : "";
    const homeHref = depth > 0 ? prefix + "index.html" : "index.html";
    const imagesPrefix = depth > 0 ? prefix + "images/" : "images/";

    // Helper function to build section links
    function buildSectionLink(section, file) {
      if (currentSection === section) {
        // Same section - use relative path (no prefix needed)
        return file;
      } else {
        // Different section or root - use prefix
        // On root: prefix = "", so returns "family/my-story.html"
        // On subdirectory: prefix = "../", so returns "../family/my-story.html"
        return prefix + section + "/" + file;
      }
    }

    // Pre-compute all navigation links to ensure they're evaluated correctly
    const familyLinks = {
      myStory: buildSectionLink('family', 'my-story.html'),
      theKids: buildSectionLink('family', 'the-kids.html'),
      heritageRoots: buildSectionLink('family', 'heritage-roots.html'),
      familyTree: buildSectionLink('family', 'family-tree.html'),
      ancestry: buildSectionLink('family', 'ancestry.html')
    };
    const galleryLinks = {
      family: buildSectionLink('gallery', 'family.html'),
      portraits: buildSectionLink('gallery', 'portraits.html'),
      travel: buildSectionLink('gallery', 'travel.html')
    };
    const professionalLinks = {
      atAGlance: buildSectionLink('professional', 'at-a-glance.html'),
      resume: buildSectionLink('professional', 'resume.html'),
      portfolio: buildSectionLink('professional', 'portfolio.html')
    };
    const blogLinks = {
      latestPosts: buildSectionLink('blog', 'latest-posts.html'),
      familyUpdates: buildSectionLink('blog', 'family-updates.html')
    };

    // Social Rail HTML
    const socialRailHTML = `
    <div class="social-rail" aria-label="Social media links">
      <!-- Instagram -->
      <a href="https://www.instagram.com/jorgeranilla" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      </a>

      <!-- Facebook -->
      <a href="https://www.facebook.com/jorgelranilla" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </a>

      <!-- LinkedIn -->
      <a href="https://www.linkedin.com/in/jorgeranilla" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      </a>

      <!-- X (Twitter) -->
      <a href="https://x.com/jorgeranilla" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>

      <!-- YouTube -->
      <a href="https://www.youtube.com/@jorgeranilla" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      </a>
    </div>`;

    // Mobile Menu Toggle Function
    window.toggleMobileMenu = function () {
      const nav = document.getElementById('mainNav');
      nav.classList.toggle('mobile-open');
    };

    // Header HTML with dynamic paths
    const headerHTML = `
    <header class="site-header">
        <a href="${homeHref}" class="brand-container" aria-label="Go to homepage">
            <img src="${imagesPrefix}jr-logo.png" alt="JR Logo" class="logo-mark"> 
            <div class="logo-text">
                <h1 class="name">JORGE RANILLA</h1>
                <span class="tagline">H O M E &nbsp; P A G E</span>
            </div>
        </a>

        <!-- Mobile Menu Toggle -->
        <button class="menu-toggle" aria-label="Toggle navigation" onclick="toggleMobileMenu()">
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
        </button>

        <nav class="main-nav" id="mainNav" aria-label="Primary">
          <ul class="nav-links">
            <li><a href="${homeHref}">Home</a></li>

            <li class="dropdown-item">
              <span class="dropdown-toggle">Family ▾</span>
              <ul class="dropdown-menu">
                <li><a href="${familyLinks.myStory}">My Story</a></li>
                <li><a href="${familyLinks.theKids}">The Kids</a></li>
                <li><a href="${familyLinks.heritageRoots}">Heritage & Roots</a></li>
                <li><a href="${familyLinks.familyTree}">Family Tree</a></li>
                <li><a href="${familyLinks.ancestry}">Ancestry</a></li>
              </ul>
            </li>

            <li class="dropdown-item">
              <span class="dropdown-toggle">Gallery ▾</span>
              <ul class="dropdown-menu">
                <li><a href="${galleryLinks.family}">Family</a></li>
                <li><a href="${galleryLinks.portraits}">Portraits</a></li>
                <li><a href="${galleryLinks.travel}">Travel</a></li>
              </ul>
            </li>

            <li class="dropdown-item">
              <span class="dropdown-toggle">Professional ▾</span>
              <ul class="dropdown-menu">
                <li><a href="${professionalLinks.atAGlance}">At a Glance</a></li>
                <li><a href="${professionalLinks.resume}">Resume</a></li>
                <li><a href="${professionalLinks.portfolio}">Portfolio</a></li>
              </ul>
            </li>

            <li class="dropdown-item">
              <span class="dropdown-toggle">Blog ▾</span>
              <ul class="dropdown-menu">
                <li><a href="${blogLinks.latestPosts}">Latest Posts</a></li>
                <li><a href="${blogLinks.familyUpdates}">Family Updates</a></li>
              </ul>
            </li>
          </ul>
          
          <div class="nav-extras">
              <!-- Search Icon -->
              <button class="search-icon-btn" aria-label="Search site" onclick="openSearchModal()">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              </button>

              <!-- Language Toggle -->
              <div class="language-toggle">
                <a href="${homeHref}" class="lang-link active" aria-label="English" title="English">
                  <img src="https://flagcdn.com/us.svg" alt="USA Flag" class="flag-icon">
                </a>
                <a href="${prefix}es.html" class="lang-link" aria-label="Español" title="Español">
                  <img src="https://flagcdn.com/pe.svg" alt="Peru Flag" class="flag-icon">
                </a>
              </div>
          </div>
        </nav>
    </header>`;

    // Inject social rail if placeholder exists
    const socialRailPlaceholder = document.getElementById("social-rail-placeholder");
    if (socialRailPlaceholder) {
      socialRailPlaceholder.outerHTML = socialRailHTML;
    }

    // Inject header if placeholder exists
    const headerPlaceholder = document.getElementById("header-placeholder");
    if (headerPlaceholder) {
      headerPlaceholder.outerHTML = headerHTML;

      // Update language toggle active state for Spanish page
      const isSpanish = document.body.dataset.lang === 'es';
      if (isSpanish) {
        const enLink = document.querySelector('.lang-link[aria-label="English"]');
        const esLink = document.querySelector('.lang-link[aria-label="Español"]');
        if (enLink && esLink) {
          enLink.classList.remove('active');
          esLink.classList.add('active');
        }
      }
    }

    // Inject search modal
    const searchModalHTML = `
    <div id="searchModal" class="search-modal">
      <div class="search-modal-content">
        <div class="search-header">
          <input type="text" id="searchInput" class="search-input" placeholder="Search the site..." autocomplete="off">
          <button class="search-close-btn" onclick="closeSearchModal()" aria-label="Close search">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        <div id="searchResults" class="search-results">
          <p class="search-hint">Start typing to search across all pages...</p>
        </div>
      </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', searchModalHTML);

    // Inject WhatsApp floating button (if not dismissed in this session)
    const whatsappDismissed = sessionStorage.getItem('whatsappDismissed') === 'true';

    if (!whatsappDismissed && !document.getElementById('whatsappContainer')) {
      // Saved position logic
      let savedPos = { x: 0, y: 0 };
      try {
        const saved = sessionStorage.getItem('whatsappPos');
        if (saved) savedPos = JSON.parse(saved);
      } catch (e) { }

      const whatsappButtonHTML = `
      <div class="whatsapp-container" id="whatsappContainer" style="position: fixed; bottom: 30px; right: 30px; z-index: 9998; display: flex; flex-direction: column; align-items: flex-end; touch-action: none; transform: translate3d(${savedPos.x}px, ${savedPos.y}px, 0);">
        <button class="whatsapp-close" id="whatsappClose" aria-label="Close WhatsApp chat">✕</button>
        <a href="https://wa.me/18646256743?text=Hi%20Jorge%2C%20I%27m%20reaching%20out%20from%20your%20website!" 
           class="whatsapp-float" 
           target="_blank" 
           rel="noopener noreferrer" 
           aria-label="Chat on WhatsApp"
           draggable="false"
           style="position: relative; bottom: 0; right: 0;">
          <svg viewBox="0 0 24 24" aria-hidden="true" draggable="false">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      </div>`;

      document.body.insertAdjacentHTML('beforeend', whatsappButtonHTML);

      // Elements
      const whatsappCloseBtn = document.getElementById('whatsappClose');
      const whatsappContainer = document.getElementById('whatsappContainer');
      const whatsappFloat = whatsappContainer.querySelector('.whatsapp-float');

      if (whatsappCloseBtn && whatsappContainer) {
        // Close logic
        whatsappCloseBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          whatsappContainer.style.display = 'none';
          sessionStorage.setItem('whatsappDismissed', 'true');
        });

        // Drag Logic
        let isDragging = false;
        let hasMoved = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = typeof savedPos.x === 'number' ? savedPos.x : 0;
        let yOffset = typeof savedPos.y === 'number' ? savedPos.y : 0;

        whatsappContainer.addEventListener('mousedown', dragStart);
        whatsappContainer.addEventListener('touchstart', dragStart, { passive: false });

        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('touchend', dragEnd);

        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag, { passive: false });

        function dragStart(e) {
          if (e.target === whatsappCloseBtn) return;

          hasMoved = false;

          let clientX, clientY;
          if (e.type === 'touchstart') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
          } else {
            clientX = e.clientX;
            clientY = e.clientY;
          }

          initialX = clientX - xOffset;
          initialY = clientY - yOffset;

          if (e.target.closest('.whatsapp-float') || e.target === whatsappContainer) {
            isDragging = true;
          }
        }

        function dragEnd(e) {
          initialX = currentX;
          initialY = currentY;
          isDragging = false;

          if (hasMoved) {
            // Save position end of drag
            sessionStorage.setItem('whatsappPos', JSON.stringify({ x: xOffset, y: yOffset }));
          }
        }

        function drag(e) {
          if (isDragging) {
            e.preventDefault();
            hasMoved = true;

            let clientX, clientY;
            if (e.type === 'touchmove') {
              clientX = e.touches[0].clientX;
              clientY = e.touches[0].clientY;
            } else {
              clientX = e.clientX;
              clientY = e.clientY;
            }

            currentX = clientX - initialX;
            currentY = clientY - initialY;

            xOffset = currentX;
            yOffset = currentY;

            setTranslate(currentX, currentY, whatsappContainer);
          }
        }

        function setTranslate(xPos, yPos, el) {
          el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
        }

        // Prevent click if dragged
        whatsappFloat.addEventListener('click', (e) => {
          if (hasMoved) {
            e.preventDefault();
            hasMoved = false;
          }
        });
      }
    }

    // Inject footer
    if (!document.querySelector('footer.site-footer')) {
      const footerHTML = `
      <footer class="site-footer">
        <div class="footer-content">
          <p class="copyright">© 2026 Website created by Jorge Ranilla. All rights reserved.</p>
        </div>
      </footer>`;
      document.body.insertAdjacentHTML('beforeend', footerHTML);
    }

    // Inject back-to-top button
    const backToTopHTML = `
    <button class="back-to-top" id="backToTop" aria-label="Back to top">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
      </svg>
    </button>`;

    document.body.insertAdjacentHTML('beforeend', backToTopHTML);

    // Back to top button functionality
    const backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
      // Show/hide button based on scroll position
      // Only show if page has significant content (600px threshold)
      window.addEventListener('scroll', () => {
        if (window.pageYOffset > 600) {
          backToTopBtn.classList.add('show');
        } else {
          backToTopBtn.classList.remove('show');
        }
      });

      // Scroll to top when clicked
      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    }
  })();

  /* ===========================
     Dynamic Breadcrumbs (no JS edits per page)
     - Reads <body data-section="Family" data-title="My Story">
  =========================== */
  (function buildBreadcrumbs() {
    const el = document.getElementById("breadcrumbs");
    if (!el) return;

    const body = document.body;
    const dataTitle = (body.dataset.title || "").trim();
    const dataSection = (body.dataset.section || "").trim();

    const path = window.location.pathname.split("/").pop() || "index.html";
    const file = decodeURIComponent(path).toLowerCase();

    // Calculate depth robustly using script location (works for local files and subfolders)
    let scriptUrl = appScriptSource;
    if (!scriptUrl) {
      const scripts = document.querySelectorAll('script[src*="script.js"]');
      if (scripts.length > 0) scriptUrl = scripts[0].src;
    }

    if (scriptUrl) scriptUrl = scriptUrl.split('?')[0];
    const scriptDir = scriptUrl ? scriptUrl.substring(0, scriptUrl.lastIndexOf('/')) : '';

    const pageUrl = window.location.href.split('?')[0].split('#')[0];
    const pageDir = pageUrl.substring(0, pageUrl.lastIndexOf('/'));

    let depth = 0;
    // Only calculate depth if we can pinpoint the script location (project root)
    if (scriptDir && pageDir.startsWith(scriptDir)) {
      const relativePath = pageDir.substring(scriptDir.length);
      depth = relativePath.split('/').filter(p => p).length;
    }
    const homePrefix = depth > 0 ? "../" : "";

    const sectionHref = {
      "Family": `${homePrefix}family/my-story.html`,
      "Gallery": `${homePrefix}gallery/family.html`,
      "Professional": `${homePrefix}professional/at-a-glance.html`,
      "Blog": `${homePrefix}blog/latest-posts.html`
    };

    // Build home link - ensure it points to root index.html
    // If we are at root (depth 0), link is just "index.html"
    // If we are deeper (depth > 0), link is "../index.html" or "../../index.html" etc.
    const homeHref = depth > 0 ? "../".repeat(depth) + "index.html" : "index.html";
    const homeLink = `<a href="${homeHref}">Home</a>`;
    const sep = `<span class="separator">/</span>`;

    // Decide current title
    let currentTitle = dataTitle || "Home";
    if (file !== "index.html" && !dataTitle) {
      // fallback: turn filename into words
      const base = file.replace(".html", "").replace(/[-_]+/g, " ");
      currentTitle = base.replace(/\b\w/g, c => c.toUpperCase());
    }

    // Home page or forced Home title: show only HOME text
    if (file === "index.html" || file === "" || currentTitle === "Home") {
      // If it's literally the index file, just show text "Home"
      if (file === "index.html" || file === "") {
        el.innerHTML = `<span class="current-page">Home</span>`;
      } else {
        // If it's another page named "Home" (like a sub-index), link back to main home
        el.innerHTML = `${homeLink} ${sep} <span class="current-page">Construction</span>`;
      }
      return;
    }

    // Special fix for "es.html" construction page which might be detecting as "Home"
    if (file === "es.html") {
      el.innerHTML = `${homeLink} ${sep} <span class="current-page">Construcción</span>`;
      return;
    }

    // Section landing page (family.html etc): Home / SECTION
    if (dataSection && file === (sectionHref[dataSection] || "").toLowerCase()) {
      el.innerHTML = `${homeLink} ${sep} <span class="current-page">${dataSection}</span>`;
      return;
    }

    // Subpage with section: Home / SECTION / TITLE
    // Don't make section clickable since menu categories don't have landing pages
    if (dataSection) {
      el.innerHTML = `${homeLink} ${sep} <span style="color: #888;">${dataSection}</span> ${sep} <span class="current-page">${currentTitle}</span>`;
      return;
    }

    // Fallback: Home / TITLE
    el.innerHTML = `${homeLink} ${sep} <span class="current-page">${currentTitle}</span>`;
  })();


  /* ===========================
       Social Rail (desktop hover edge)
    =========================== */
  const rail = document.querySelector(".social-rail");
  if (rail) {
    const EDGE = 18;   // px from left edge to trigger show
    const HIDE_X = 120; // if mouse goes past this and not hovering rail, hide

    function show() {
      rail.classList.add("show");
    }
    function hide() {
      rail.classList.remove("show");
    }

    document.addEventListener("mousemove", (e) => {
      if (e.clientX <= EDGE) {
        show();
      } else if (e.clientX > HIDE_X && !rail.matches(":hover")) {
        hide();
      }
    });

    rail.addEventListener("mouseenter", show);
    rail.addEventListener("mouseleave", hide);
  }

  /* ===========================
     Hero Carousel Logic with Swipe Support
  =========================== */
  const slides = document.querySelectorAll(".slide");
  const dots = document.querySelectorAll(".dot");

  if (slides.length && dots.length) {
    let slideIndex = 1;
    let touchStartX = 0;
    let touchEndX = 0;
    let mouseStartX = 0;
    let mouseEndX = 0;
    let isDragging = false;

    // Function to show specific slide
    window.currentSlide = function (n) {
      showSlides(slideIndex = n);
    };

    // Function to change slide by offset (for arrows)
    window.changeSlide = function (n) {
      showSlides(slideIndex += n);
    };

    function showSlides(n) {
      if (n > slides.length) slideIndex = 1;
      if (n < 1) slideIndex = slides.length;

      slides.forEach(s => s.classList.remove("active"));
      dots.forEach(d => d.classList.remove("active"));

      const s = slides[slideIndex - 1];
      const d = dots[slideIndex - 1];
      if (s) s.classList.add("active");
      if (d) d.classList.add("active");
    }

    // Touch event handlers for mobile swipe
    const carousel = document.querySelector(".hero-carousel");

    if (carousel) {
      // Touch events
      carousel.addEventListener('touchstart', (e) => {
        if (e.target.closest('.carousel-dots')) return;
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      carousel.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      }, { passive: true });

      // Mouse events for desktop swipe
      carousel.addEventListener('mousedown', (e) => {
        if (e.target.closest('.carousel-dots')) return;
        isDragging = true;
        mouseStartX = e.clientX;
        carousel.style.cursor = 'grabbing';
      });

      carousel.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
      });

      carousel.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        mouseEndX = e.clientX;
        carousel.style.cursor = 'grab';
        handleMouseSwipe();
      });

      carousel.addEventListener('mouseleave', () => {
        if (isDragging) {
          isDragging = false;
          carousel.style.cursor = 'grab';
        }
      });

      // Set initial cursor
      carousel.style.cursor = 'grab';
    }

    function handleSwipe() {
      const swipeThreshold = 50; // minimum distance for swipe
      const diff = touchStartX - touchEndX;

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          // Swiped left - go to next slide
          changeSlide(1);
        } else {
          // Swiped right - go to previous slide
          changeSlide(-1);
        }
      }
    }

    function handleMouseSwipe() {
      const swipeThreshold = 50; // minimum distance for swipe
      const diff = mouseStartX - mouseEndX;

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          // Dragged left - go to next slide
          changeSlide(1);
        } else {
          // Dragged right - go to previous slide
          changeSlide(-1);
        }
      }
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        changeSlide(-1);
      } else if (e.key === 'ArrowRight') {
        changeSlide(1);
      }
    });

    showSlides(slideIndex);
  }
});

