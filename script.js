// Capture script source immediately before it becomes null in callbacks
const appScriptSource = document.currentScript ? document.currentScript.src : null;

document.addEventListener("DOMContentLoaded", () => {
  /* ===========================
     Dynamic Greeting Update
  =========================== */
  (function updateGreeting() {
    const greetingText = document.getElementById('greeting-text');
    const currentDate = document.getElementById('current-date');
    const usdPenEl = document.getElementById('usd-pen');
    const usdEurEl = document.getElementById('usd-eur');

    if (greetingText && currentDate) {
      const now = new Date();
      const hour = now.getHours();

      // Always English greetings
      let greeting;
      if (hour < 12) {
        greeting = 'Good Morning';
      } else if (hour < 18) {
        greeting = 'Good Afternoon';
      } else {
        greeting = 'Good Evening';
      }

      // Always English date format
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const locale = 'en-US';
      const dateString = now.toLocaleDateString(locale, options);

      // Update elements
      greetingText.textContent = greeting;
      currentDate.textContent = dateString;
    }

    // Fetch currency exchange rates
    if (usdPenEl && usdEurEl) {
      // Using exchangerate-api.com free tier (no API key needed for basic usage)
      fetch('https://api.exchangerate-api.com/v4/latest/USD')
        .then(response => response.json())
        .then(data => {
          const penRate = data.rates.PEN;
          const eurRate = data.rates.EUR;

          usdPenEl.textContent = `USD/PEN: ${penRate.toFixed(2)}`;
          usdEurEl.textContent = `USD/EUR: ${eurRate.toFixed(2)}`;
        })
        .catch(error => {
          console.error('Error fetching currency rates:', error);
          usdPenEl.textContent = 'USD/PEN: N/A';
          usdEurEl.textContent = 'USD/EUR: N/A';
        });
    }
  })();

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

    // Detect if current page is Spanish
    const isSpanishPage = document.documentElement.lang === 'es' || document.body.getAttribute('data-lang') === 'es';

    // Pre-compute all navigation links to ensure they're evaluated correctly
    const familyLinks = {
      myStory: buildSectionLink('family', 'my-story.html'),
      theKids: buildSectionLink('family', 'the-kids.html'),
      heritageRoots: buildSectionLink('family', 'heritage-roots.html'),
      familyTree: buildSectionLink('family', 'family-tree.html'),
      ancestry: buildSectionLink('family', 'ancestry.html'),
      familyDirectory: buildSectionLink('family-directory', 'index.html'),
      familyLogin: buildSectionLink('family', 'family-login.html')
    };

    // Labels based on language - User requested English labels ALWAYS
    const navLabels = {
      family: 'Family',
      myStory: 'My Story',
      theKids: 'The Kids',
      heritageRoots: 'Heritage & Roots',
      familyTree: 'Family Tree',
      ancestry: 'Ancestry'
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
      const isOpening = !nav.classList.contains('mobile-open');
      nav.classList.toggle('mobile-open');

      // Expand all dropdowns when opening, collapse when closing
      if (window.innerWidth <= 900) {
        const dropdownItems = document.querySelectorAll('.dropdown-item');
        dropdownItems.forEach(item => {
          if (isOpening) {
            item.classList.add('active');
          } else {
            item.classList.remove('active');
          }
        });
      }
    };

    // Header HTML with dynamic paths
    const headerHTML = `
    <header class="site-header">
        <a href="${homeHref}" class="brand-container" aria-label="Go to homepage">
            <img src="${imagesPrefix}jr-logo.png" alt="JR Logo" class="logo-mark"> 
            <div class="logo-text">
                <h1 class="name">JORGE RANILLA</h1>
                <span class="tagline">FAMILY &nbsp;·&nbsp; HERITAGE &nbsp;·&nbsp; MEMORIES</span>
            </div>
        </a>

        <!-- Mobile Menu Toggle -->
        <button class="menu-toggle" aria-label="Toggle navigation" onclick="toggleMobileMenu()">
            <svg viewBox="0 0 44 24" width="44" height="24" style="display: block; margin: 0 auto;">
                <!-- Hamburger Lines on the Left (shortened to make room for loop) -->
                <path fill="currentColor" d="M2 5h16v-2H2v2zm0 7h16v-2H2v2zm0 7h11v-2H2v2z"/>
                
                <!-- Search Loop (Magnifying Glass) on the Right, overlapping slightly -->
                <path fill="currentColor" transform="translate(14, 0) scale(1.1)" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.5px; margin-top: 2px;">MENU</span>
        </button>

        <nav class="main-nav" id="mainNav" aria-label="Primary">
          <ul class="nav-links">
            <li><a href="${homeHref}">Home</a></li>

            <li class="dropdown-item">
              <span class="dropdown-toggle">${navLabels.family} ▾</span>
              <ul class="dropdown-menu">
                <li><a href="${familyLinks.myStory}">${navLabels.myStory}</a></li>
                <li><a href="${familyLinks.theKids}">${navLabels.theKids}</a></li>
                <li><a href="${familyLinks.heritageRoots}">${navLabels.heritageRoots}</a></li>
                <li><a href="${familyLinks.familyTree}">${navLabels.familyTree}</a></li>
                <li><a href="${familyLinks.ancestry}">${navLabels.ancestry}</a></li>
                <li><a href="${familyLinks.familyDirectory}">Family Directory 🔒</a></li>
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
              <span class="dropdown-toggle">Blog ▾</span>
              <ul class="dropdown-menu">
                <li><a href="${blogLinks.latestPosts}">Latest Posts</a></li>
                <li><a href="${blogLinks.familyUpdates}">Family Updates</a></li>
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
          </ul>
          
          <div class="nav-extras">
              <!-- Search Icon -->
              <button class="search-icon-btn" aria-label="Search site" onclick="openSearchModal()">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              </button>

              <!-- Family Members Login (Lock Icon) -->
              <button class="search-icon-btn" aria-label="Family Members Login" title="Family Members Login" onclick="window.location.href='${familyLinks.familyLogin}'">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
              </button>

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


      // Mobile Dropdown Accordion Logic
      const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
      dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function (e) {
          if (window.innerWidth <= 900) {
            // Toggle the submenu
            const parent = this.closest('.dropdown-item');
            parent.classList.toggle('active');
          }
        });
      });
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
     Dynamic Breadcrumbs with Full Hierarchy
     - Reads <body data-section="Family" data-title="My Story">
     - Uses PAGE_HIERARCHY map for accurate paths
     - Non-clickable parents shown in gray
  =========================== */
  (function buildBreadcrumbs() {
    const el = document.getElementById("breadcrumbs");
    if (!el) return;

    // Calculate depth and paths
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
    if (scriptDir && pageDir.startsWith(scriptDir)) {
      const relativePath = pageDir.substring(scriptDir.length);
      depth = relativePath.split('/').filter(p => p).length;
    }
    const homePrefix = depth > 0 ? "../" : "";

    const path = window.location.pathname.split("/").pop() || "index.html";
    const file = decodeURIComponent(path).toLowerCase();

    // Page Hierarchy Map - defines full breadcrumb path for each page
    const PAGE_HIERARCHY = {
      // Family section - Heritage & Roots subsection
      'heritage-roots.html': ['Family', 'Heritage & Roots'],
      'extended-family.html': ['Family', 'Heritage & Roots', 'Extended Family'],
      'family-tree.html': ['Family', 'Heritage & Roots', 'Family Tree'],
      'ancestry.html': ['Family', 'Heritage & Roots', 'Ancestry'],

      // Family section - Individual bio pages (under Heritage & Roots)
      'jorge-ranilla.html': ['Family', 'Heritage & Roots', 'Jorge'],
      'shane-ranilla.html': ['Family', 'Heritage & Roots', 'Shane'],
      'alyssa-ranilla.html': ['Family', 'Heritage & Roots', 'Alyssa'],
      'victor-andres-ranilla.html': ['Family', 'Heritage & Roots', 'Victor Andres'],
      'maria-eugenia-ranilla.html': ['Family', 'Heritage & Roots', 'Maria Eugenia'],
      'jorge-luis-ranilla.html': ['Family', 'Heritage & Roots', 'Jorge Luis'],
      'sylvia-ines-astocondor.html': ['Family', 'Heritage & Roots', 'Sylvia Ines'],

      // Family section - Extended family bio pages
      'sergio-raul-ranilla.html': ['Family', 'Heritage & Roots', 'Extended Family', 'Sergio Raul'],
      'maria-jesus-cateriano.html': ['Family', 'Heritage & Roots', 'Extended Family', 'Maria Jesus'],
      'eugenio-astocondor.html': ['Family', 'Heritage & Roots', 'Extended Family', 'Eugenio'],
      'alcira-victoria-lopez.html': ['Family', 'Heritage & Roots', 'Extended Family', 'Alcira Victoria'],
      'eugenio-augusto-astocondor.html': ['Family', 'Heritage & Roots', 'Extended Family', 'Eugenio Augusto'],
      'maria-alcira-del-carmen-astocondor.html': ['Family', 'Heritage & Roots', 'Extended Family', 'Maria Alcira'],
      'maria-carlota-ruiz.html': ['Family', 'Heritage & Roots', 'Extended Family', 'Maria Carlota'],
      'victoriano-cateriano.html': ['Family', 'Heritage & Roots', 'Extended Family', 'Victoriano Cateriano'],
      'lucila-dongo-salcedo.html': ['Family', 'Heritage & Roots', 'Extended Family', 'Lucila Dongo Salcedo'],

      // Family section - Other pages
      'my-story.html': ['Family', 'My Story'],
      'the-kids.html': ['Family', 'The Kids'],

      // Spanish versions - mirror English hierarchy
      'heritage-roots-es.html': ['Family', 'Heritage & Roots'],
      'extended-family-es.html': ['Family', 'Heritage & Roots', 'Extended Family'],
      'ancestry-es.html': ['Family', 'Heritage & Roots', 'Ancestry'],
      'my-story-es.html': ['Family', 'My Story'],
      'the-kids-es.html': ['Family', 'The Kids'],
      'jorge-ranilla-es.html': ['Family', 'Heritage & Roots', 'Jorge'],
      'shane-ranilla-es.html': ['Family', 'Heritage & Roots', 'Shane'],
      'alyssa-ranilla-es.html': ['Family', 'Heritage & Roots', 'Alyssa'],
      'victor-andres-ranilla-es.html': ['Family', 'Heritage & Roots', 'Victor Andres'],
      'maria-eugenia-ranilla-es.html': ['Family', 'Heritage & Roots', 'Maria Eugenia'],
      'jorge-luis-ranilla-es.html': ['Family', 'Heritage & Roots', 'Jorge Luis'],
      'sylvia-ines-astocondor-es.html': ['Family', 'Heritage & Roots', 'Sylvia Ines'],

      // Gallery section - Travel pages
      'travel.html': ['Gallery', 'Travel'],
      'cancun.html': ['Gallery', 'Travel', 'Mexico', 'Cancun'],
      'cozumel.html': ['Gallery', 'Travel', 'Mexico', 'Cozumel'],
      'lima.html': ['Gallery', 'Travel', 'Peru', 'Lima'],
      'cusco.html': ['Gallery', 'Travel', 'Peru', 'Cusco'],
      'tokyo.html': ['Gallery', 'Travel', 'Japan', 'Tokyo'],
      'osaka.html': ['Gallery', 'Travel', 'Japan', 'Osaka'],
      'nagoya.html': ['Gallery', 'Travel', 'Japan', 'Nagoya'],

      // Gallery section - Other pages
      'family.html': ['Gallery', 'Family'],
      'portraits.html': ['Gallery', 'Portraits'],

      // Professional section
      'at-a-glance.html': ['Professional', 'At a Glance'],
      'resume.html': ['Professional', 'Resume'],
      'portfolio.html': ['Professional', 'Portfolio'],

      // Baptism pages (English & Spanish, main + godparent subpages)
      'baptism.html': ["Alyssa's Baptism"],
      'baptism-es.html': ["Alyssa's Baptism"],
      'baptism-godfather.html': ["Alyssa's Baptism", "Letter to Godfather"],
      'baptism-godfather-es.html': ["Alyssa's Baptism", "Letter to Godfather"],
      'baptism-godmother.html': ["Alyssa's Baptism", "Letter to Godmother"],
      'baptism-godmother-es.html': ["Alyssa's Baptism", "Letter to Godmother"],

      // Blog section
      'latest-posts.html': ['Blog', 'Latest Posts'],
      'family-updates.html': ['Blog', 'Family Updates']
    };

    // Pages that have actual landing pages (these can be clickable)
    const CLICKABLE_PAGES = {
      'Heritage & Roots': `${homePrefix}family/heritage-roots.html`,
      'Extended Family': `${homePrefix}family/extended-family.html`,
      'Travel': `${homePrefix}gallery/travel.html`,
      'Family Directory': `${homePrefix}family-directory/index.html`,
      'Family': null, // Has submenu items but no dedicated page
      'Gallery': null,
      'Professional': null,
      'Blog': null,
      'Mexico': null,
      'Peru': null,
      'Japan': null
    };

    const homeHref = depth > 0 ? "../".repeat(depth) + "index.html" : "index.html";
    const homeLink = `<a href="${homeHref}">Home</a>`;
    const sep = `<span class="separator">/</span>`;

    // Home page handling
    if (file === "index.html" || file === "") {
      el.innerHTML = `<span class="current-page">Home</span>`;
      return;
    }

    // Special handling for es.html
    if (file === "es.html") {
      const body = document.body;
      const dataTitle = (body.dataset.title || "Inicio").trim();
      el.innerHTML = `${homeLink} ${sep} <span class="current-page">${dataTitle}</span>`;
      return;
    }

    // Check if we have hierarchy data for this page
    if (PAGE_HIERARCHY[file]) {
      const hierarchy = PAGE_HIERARCHY[file];
      let breadcrumbHTML = homeLink;

      // Build breadcrumb from hierarchy
      hierarchy.forEach((item, index) => {
        const isLast = index === hierarchy.length - 1;

        if (isLast) {
          // Current page - always non-clickable and styled
          breadcrumbHTML += ` ${sep} <span class="current-page">${item}</span>`;
        } else {
          // Parent item - check if it has a clickable page
          const itemLink = CLICKABLE_PAGES[item];

          if (itemLink) {
            // Has a landing page - make it clickable
            breadcrumbHTML += ` ${sep} <a href="${itemLink}">${item}</a>`;
          } else {
            // Menu-only parent - non-clickable gray text
            breadcrumbHTML += ` ${sep} <span class="breadcrumb-parent">${item}</span>`;
          }
        }
      });

      el.innerHTML = breadcrumbHTML;
      return;
    }

    // Fallback: Use data attributes if no hierarchy mapping
    const body = document.body;
    const dataTitle = (body.dataset.title || "").trim();
    const dataSection = (body.dataset.section || "").trim();

    let currentTitle = dataTitle || "Page";
    if (!dataTitle) {
      const base = file.replace(".html", "").replace(/[-_]+/g, " ");
      currentTitle = base.replace(/\b\w/g, c => c.toUpperCase());
    }

    if (dataSection) {
      el.innerHTML = `${homeLink} ${sep} <span class="breadcrumb-parent">${dataSection}</span> ${sep} <span class="current-page">${currentTitle}</span>`;
    } else {
      el.innerHTML = `${homeLink} ${sep} <span class="current-page">${currentTitle}</span>`;
    }
  })();


  /* ===========================
       Social Rail (desktop hover edge)
    =========================== */
  const rail = document.querySelector(".social-rail");
  if (rail) {
    // Check if we are on the Home page
    const isHomePage = document.body.getAttribute('data-title') === 'Home';

    if (isHomePage) {
      // Permanently show on homepage
      rail.classList.add("show");
    } else {
      // Hide/Show on hover for all other pages
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

  /* ===========================
     Footer Ambient Audio
     - Static-site friendly: remembers on/off and current time between pages.
  =========================== */
  (function setupFooterAmbientAudio() {
    const mobileMediaQuery = window.matchMedia('(max-width: 900px), (pointer: coarse)');
    if (mobileMediaQuery.matches) return;

    function getRootAssetUrl(assetPath) {
      let scriptUrl = appScriptSource;

      if (!scriptUrl) {
        const scripts = document.querySelectorAll('script[src*="script.js"]');
        if (scripts.length > 0) scriptUrl = scripts[0].src;
      }

      if (scriptUrl) {
        const cleanScriptUrl = scriptUrl.split('?')[0];
        const scriptDir = cleanScriptUrl.substring(0, cleanScriptUrl.lastIndexOf('/') + 1);
        return new URL(assetPath, scriptDir).href;
      }

      return assetPath;
    }

    const footer = document.querySelector('.site-footer');
    if (!footer || document.getElementById('ambientToggle')) return;

    footer.insertAdjacentHTML('afterbegin', `
      <button class="ambient-footer-corner-toggle" id="ambientToggle" type="button" aria-label="Pause ambient music" aria-pressed="true" title="Pause ambient music">
        <svg class="ambient-icon ambient-icon-sound" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 16.5 12zm-2.5-9.5v2.06A8 8 0 0 1 14 19.44v2.06A10 10 0 0 0 14 2.5z" />
        </svg>
        <svg class="ambient-icon ambient-icon-muted" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 9v6h4l5 5V4L7 9H3zm15.3 3 3.1-3.1-1.4-1.4-3.1 3.1-3.1-3.1-1.4 1.4 3.1 3.1-3.1 3.1 1.4 1.4 3.1-3.1 3.1 3.1 1.4-1.4-3.1-3.1z" />
        </svg>
      </button>`);

    const audio = document.createElement('audio');
    const source = document.createElement('source');
    audio.id = 'ambientAudio';
    audio.loop = true;
    audio.preload = 'auto';
    audio.playsInline = true;
    audio.setAttribute('playsinline', '');
    source.src = getRootAssetUrl('audio/ambient.mp3');
    source.type = 'audio/mpeg';
    audio.appendChild(source);
    document.body.appendChild(audio);

    const toggle = document.getElementById('ambientToggle');
    const enabledKey = 'ambientAudioEnabled';
    const timeKey = 'ambientAudioTime';
    const savedAtKey = 'ambientAudioSavedAt';
    const sessionStateKey = 'jorgeAmbientAudioSessionState';
    const windowStateKey = 'jorgeAmbientAudioState';
    const minimumUsefulTime = 0.35;
    let isAttemptingPlay = false;
    let hasSuccessfullyPlayed = false;
    let ambientSaveTimer = null;
    audio.volume = 0.18;

    function readWindowState() {
      try {
        const data = JSON.parse(window.name || '{}');
        return data && data[windowStateKey] ? data[windowStateKey] : null;
      } catch (error) {
        return null;
      }
    }

    function writeWindowState(state) {
      try {
        let data = {};
        try {
          data = JSON.parse(window.name || '{}') || {};
        } catch (error) {
          data = {};
        }
        data[windowStateKey] = state;
        window.name = JSON.stringify(data);
      } catch (error) {
        // Some browsers may restrict window.name; localStorage still handles normal cases.
      }
    }

    function readSavedState() {
      const states = [];

      try {
        const localTime = parseFloat(localStorage.getItem(timeKey) || '0');
        const localSavedAt = parseInt(localStorage.getItem(savedAtKey) || '0', 10);
        const localEnabledValue = localStorage.getItem(enabledKey);
        states.push({
          enabled: localEnabledValue !== 'false',
          time: Number.isFinite(localTime) ? localTime : 0,
          savedAt: Number.isFinite(localSavedAt) ? localSavedAt : 0
        });
      } catch (error) {
        // localStorage can be restricted in some browsing modes.
      }

      try {
        const sessionState = JSON.parse(sessionStorage.getItem(sessionStateKey) || 'null');
        if (sessionState) states.push(sessionState);
      } catch (error) {
        // sessionStorage is a same-tab backup when localStorage is flaky.
      }

      const windowState = readWindowState();
      if (windowState) states.push(windowState);

      if (states.length > 0) {
        const usefulStates = states.filter(state => Number.isFinite(state.time) && state.time > minimumUsefulTime);
        const candidateStates = usefulStates.length > 0 ? usefulStates : states;

        return candidateStates.reduce((latestState, state) => {
          return (state.savedAt || 0) > (latestState.savedAt || 0) ? state : latestState;
        });
      }

      return { enabled: true, time: 0, savedAt: 0 };
    }

    function getCurrentOrPreservedTime() {
      const currentTimeIsUseful = Number.isFinite(audio.currentTime) && audio.currentTime > minimumUsefulTime;
      if (currentTimeIsUseful) {
        return {
          time: audio.currentTime,
          savedAt: Date.now()
        };
      }

      const previousState = readSavedState();
      return {
        time: previousState.time || 0,
        savedAt: previousState.savedAt || Date.now()
      };
    }

    function writeSavedState(enabled, preserveTimeIfEmpty = true) {
      const timing = preserveTimeIfEmpty
        ? getCurrentOrPreservedTime()
        : {
          time: Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
          savedAt: Date.now()
        };

      const state = {
        enabled,
        time: timing.time,
        savedAt: timing.savedAt
      };

      try {
        localStorage.setItem(enabledKey, enabled ? 'true' : 'false');
        localStorage.setItem(timeKey, String(state.time));
        localStorage.setItem(savedAtKey, String(state.savedAt));
      } catch (error) {
        // window.name fallback below still helps in privacy-restricted contexts.
      }

      try {
        sessionStorage.setItem(sessionStateKey, JSON.stringify(state));
      } catch (error) {
        // window.name fallback below still helps in privacy-restricted contexts.
      }

      writeWindowState(state);
    }

    let userDisabledAmbient = readSavedState().enabled === false;

    function setPlaying(isPlaying) {
      toggle.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
      toggle.setAttribute('aria-label', isPlaying ? 'Pause ambient music' : 'Play ambient music');
      toggle.setAttribute('title', isPlaying ? 'Pause ambient music' : 'Play ambient music');
    }

    function saveCurrentTime() {
      const currentTimeIsUseful = Number.isFinite(audio.currentTime) && audio.currentTime > minimumUsefulTime;
      if (currentTimeIsUseful) {
        writeSavedState(!userDisabledAmbient, false);
      } else if (hasSuccessfullyPlayed) {
        writeSavedState(!userDisabledAmbient);
      }
    }

    function startSaveHeartbeat() {
      if (ambientSaveTimer) return;
      ambientSaveTimer = window.setInterval(saveCurrentTime, 1000);
    }

    function stopSaveHeartbeat() {
      if (!ambientSaveTimer) return;
      window.clearInterval(ambientSaveTimer);
      ambientSaveTimer = null;
    }

    function getSavedPlaybackTime() {
      const state = readSavedState();
      const savedTime = parseFloat(state.time || '0');
      if (!(savedTime > 0)) return 0;

      const savedAt = parseInt(state.savedAt || '0', 10);
      const elapsed = savedAt > 0 ? Math.max(0, (Date.now() - savedAt) / 1000) : 0;
      const candidateTime = savedTime + elapsed;

      if (audio.duration && Number.isFinite(audio.duration) && audio.duration > 0) {
        return candidateTime % audio.duration;
      }

      return candidateTime;
    }

    function restoreSavedTime() {
      const savedTime = getSavedPlaybackTime();
      if (savedTime > 0 && (!audio.duration || savedTime < audio.duration)) {
        if (Math.abs(audio.currentTime - savedTime) > 1.5) audio.currentTime = savedTime;
      }
    }

    async function playAmbient(force = false) {
      if (isAttemptingPlay || (!force && userDisabledAmbient)) return false;
      isAttemptingPlay = true;

      try {
        const savedTime = getSavedPlaybackTime();
        if (savedTime > 0) audio.currentTime = savedTime;

        await audio.play();

        // Mobile Safari often ignores currentTime changes before play() resolves. Force it again.
        if (savedTime > 0 && (!audio.duration || savedTime < audio.duration)) {
          if (Math.abs(audio.currentTime - savedTime) > 1.5) {
            audio.currentTime = savedTime;
          }
        }

        hasSuccessfullyPlayed = true;
        userDisabledAmbient = false;
        writeSavedState(true);
        setPlaying(true);
        startSaveHeartbeat();
        removeInteractionStartListeners();
        return true;
      } catch (error) {
        setPlaying(false);
        return false;
      } finally {
        isAttemptingPlay = false;
      }
    }

    function startAfterFirstInteraction() {
      if (userDisabledAmbient || !audio.paused) return;
      playAmbient();
    }

    const interactionEvents = ['click', 'touchend', 'pointerdown', 'keydown', 'touchstart'];

    function addInteractionStartListeners() {
      interactionEvents.forEach(eventName => {
        document.addEventListener(eventName, startAfterFirstInteraction, { passive: true });
      });
    }

    function removeInteractionStartListeners() {
      interactionEvents.forEach(eventName => {
        document.removeEventListener(eventName, startAfterFirstInteraction);
      });
    }

    audio.addEventListener('loadedmetadata', restoreSavedTime);
    audio.addEventListener('timeupdate', saveCurrentTime);
    audio.addEventListener('playing', () => {
      hasSuccessfullyPlayed = true;
      writeSavedState(true);
      startSaveHeartbeat();
    });
    audio.addEventListener('pause', () => {
      saveCurrentTime();
      stopSaveHeartbeat();
    });
    audio.addEventListener('error', () => {
      audio.pause();
      stopSaveHeartbeat();
      setPlaying(false);
      toggle.classList.add('is-unavailable');
      toggle.setAttribute('aria-label', 'Ambient music unavailable');
      toggle.setAttribute('title', 'Ambient music unavailable');
    });

    window.addEventListener('beforeunload', () => {
      saveCurrentTime();
      writeSavedState(!userDisabledAmbient);
    });

    window.addEventListener('pagehide', () => {
      saveCurrentTime();
      writeSavedState(!userDisabledAmbient);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        saveCurrentTime();
        writeSavedState(!userDisabledAmbient);
      }
    });

    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

      try {
        const url = new URL(href, window.location.href);
        if (url.origin === window.location.origin) {
          saveCurrentTime();
          writeSavedState(!userDisabledAmbient);
        }
      } catch (error) {
        saveCurrentTime();
        writeSavedState(!userDisabledAmbient);
      }
    }, true);

    toggle.addEventListener('click', async () => {
      if (toggle.classList.contains('is-unavailable')) return;

      if (audio.paused) {
        await playAmbient(true);
      } else {
        audio.pause();
        saveCurrentTime();
        stopSaveHeartbeat();
        userDisabledAmbient = true;
        writeSavedState(false);
        setPlaying(false);
      }
    });

    // Browsers may block audible autoplay on first visit. When blocked, the
    // footer icon remains ready for one-tap playback.
    if (!userDisabledAmbient) {
      playAmbient();
      addInteractionStartListeners();
    } else {
      setPlaying(false);
    }
  })();
});

