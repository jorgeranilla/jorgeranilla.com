document.addEventListener("DOMContentLoaded", () => {
  /* ===========================
     Shared Header & Social Rail Injection
     - Calculates relative paths based on current page depth
  =========================== */
  (function injectSharedHeader() {
    // Calculate depth for relative paths based on the current page location
    // Get the current page's pathname
    const pathname = (window.location.pathname || '').split('?')[0].split('#')[0];

    // Normalize the path and split into parts
    let normalizedPath = pathname.replace(/\\/g, '/');
    if (normalizedPath.startsWith('/')) {
      normalizedPath = normalizedPath.substring(1);
    }

    // Split path and filter out drive letters and empty parts
    const pathParts = normalizedPath.split('/').filter(p => p && !p.match(/^[A-Z]:$/));

    // Find the project root folder (either "Cursor" for local dev or "jorgeranilla.com" for GitHub)
    let rootIndex = pathParts.indexOf('Cursor');
    if (rootIndex === -1) {
      rootIndex = pathParts.indexOf('jorgeranilla.com');
    }

    // Get parts after project root folder
    const relativePathParts = rootIndex !== -1 ? pathParts.slice(rootIndex + 1) : pathParts;

    // Remove the filename (last part) to get just the directory structure
    const dirParts = relativePathParts.slice(0, -1);

    // Depth = number of directories we're nested in relative to project root
    // Root (Cursor/index.html or jorgeranilla.com/index.html): dirParts = [] → depth = 0
    // Subdirectory (Cursor/family/my-story.html): dirParts = ["family"] → depth = 1
    const depth = dirParts.length;

    // Current section is the immediate parent directory (if any)
    const currentSection = depth > 0 ? dirParts[dirParts.length - 1] : null;

    const prefix = depth > 0 ? "../" : "";
    const homeHref = depth > 0 ? "../index.html" : "index.html";
    const imagesPrefix = depth > 0 ? "../images/" : "images/";

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
          <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3Zm-5 4.5A5.5 5.5 0 1 1 6.5 14 5.5 5.5 0 0 1 12 8.5Zm0 2A3.5 3.5 0 1 0 15.5 14 3.5 3.5 0 0 0 12 10.5ZM18 6.8a.9.9 0 1 1-.9.9.9.9 0 0 1 .9-.9Z"/>
        </svg>
      </a>

      <!-- Facebook -->
      <a href="https://www.facebook.com/jorgelranilla" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5h1.7V5a23 23 0 0 0-2.5-.1c-2.5 0-4.2 1.5-4.2 4.3V11H7.5v3h2.6v8h3.4Z"/>
        </svg>
      </a>

      <!-- LinkedIn -->
      <a href="https://www.linkedin.com/in/jorgeranilla" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4.98 3.5A2.5 2.5 0 1 0 5 8.5a2.5 2.5 0 0 0-.02-5ZM3 9h4v12H3zM9 9h3.8v1.7h.1c.5-.9 1.8-1.9 3.7-1.9 4 0 4.7 2.6 4.7 6V21h-4v-5.3c0-1.3 0-3-1.9-3s-2.2 1.4-2.2 2.9V21H9z"/>
        </svg>
      </a>

      <!-- X (Twitter icon) -->
      <a href="https://x.com/jorgeranilla" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 22.43.36a9 9 0 0 1-2.88 1.1A4.52 4.52 0 0 0 16.11 0c-2.5 0-4.52 2.24-4.52 5a5 5 0 0 0 .12 1.14A12.94 12.94 0 0 1 1.64.88a4.93 4.93 0 0 0-.61 2.51c0 1.73.86 3.26 2.17 4.15A4.4 4.4 0 0 1 .96 6.9v.06c0 2.42 1.66 4.44 3.86 4.9a4.52 4.52 0 0 1-2.04.08c.58 1.9 2.27 3.28 4.27 3.32A9.06 9.06 0 0 1 0 19.54 12.8 12.8 0 0 0 6.92 22c8.3 0 12.84-7.16 12.84-13.37 0-.2 0-.39-.01-.58A9.4 9.4 0 0 0 23 3Z"/>
        </svg>
      </a>

      <!-- YouTube -->
      <a href="https://www.youtube.com/@jorgeranilla" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.7 4.6 12 4.6 12 4.6s-5.7 0-7.5.5A3 3 0 0 0 2.4 7.2 31.6 31.6 0 0 0 2 12a31.6 31.6 0 0 0 .4 4.8 3 3 0 0 0 2.1 2.1c1.8.5 7.5.5 7.5.5s5.7 0 7.5-.5a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 22 12a31.6 31.6 0 0 0-.4-4.8ZM10 15.5v-7l6 3.5-6 3.5Z"/>
        </svg>
      </a>
    </div>`;

    // Header HTML with dynamic paths
    const headerHTML = `
    <header class="site-header">
        <div class="brand-container">
            <img src="${imagesPrefix}jr-logo.png" alt="JR Logo" class="logo-mark"> 
            <div class="logo-text">
                <h1 class="name">JORGE RANILLA</h1>
                <span class="tagline">H O M E &nbsp; P A G E</span>
            </div>
        </div>

        <nav class="main-nav" aria-label="Primary">
          <ul class="nav-links">
            <li><a href="${homeHref}">Home</a></li>

            <li class="dropdown-item">
              <span class="dropdown-toggle">Family ▾</span>
              <ul class="dropdown-menu">
                <li><a href="${familyLinks.myStory}">My Story</a></li>
                <li><a href="${familyLinks.theKids}">The Kids</a></li>
                <li><a href="${familyLinks.heritageRoots}">Heritage & Roots</a></li>
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

    // Calculate depth: count how many directory levels we're nested
    // Normalize pathname by removing leading slash
    let pathname = window.location.pathname;
    if (pathname.startsWith('/')) {
      pathname = pathname.substring(1);
    }
    const pathParts = pathname.split("/").filter(p => p);

    // Depth = number of directories (total parts minus 1 for the filename)
    // For root index.html: pathParts = ["index.html"], depth = 0
    // For family/my-story.html: pathParts = ["family", "my-story.html"], depth = 1
    const depth = pathParts.length > 1 ? pathParts.length - 1 : 0;
    const homePrefix = depth > 0 ? "../" : "";

    const sectionHref = {
      "Family": `${homePrefix}family/my-story.html`,
      "Gallery": `${homePrefix}gallery/family.html`,
      "Professional": `${homePrefix}professional/at-a-glance.html`,
      "Blog": `${homePrefix}blog/latest-posts.html`
    };

    // Build home link - ensure it points to root index.html
    const homeHref = depth > 0 ? "../index.html" : "index.html";
    const homeLink = `<a href="${homeHref}">Home</a>`;
    const sep = `<span class="separator">/</span>`;

    // Decide current title
    let currentTitle = dataTitle || "Home";
    if (file !== "index.html" && !dataTitle) {
      // fallback: turn filename into words
      const base = file.replace(".html", "").replace(/[-_]+/g, " ");
      currentTitle = base.replace(/\b\w/g, c => c.toUpperCase());
    }

    // Home page: show only HOME
    if (file === "index.html" || file === "") {
      el.innerHTML = `<span class="current-page">Home</span>`;
      return;
    }

    // Section landing page (family.html etc): Home / SECTION
    if (dataSection && file === (sectionHref[dataSection] || "").toLowerCase()) {
      el.innerHTML = `${homeLink} ${sep} <span class="current-page">${dataSection}</span>`;
      return;
    }

    // Subpage with section: Home / SECTION / TITLE
    if (dataSection && sectionHref[dataSection]) {
      el.innerHTML = `${homeLink} ${sep} <a href="${sectionHref[dataSection]}">${dataSection}</a> ${sep} <span class="current-page">${currentTitle}</span>`;
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
     Hero Carousel Logic
  =========================== */
  const slides = document.querySelectorAll(".slide");
  const dots = document.querySelectorAll(".dot");

  if (slides.length && dots.length) {
    let slideIndex = 1;

    window.currentSlide = function (n) {
      showSlides(slideIndex = n);
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

    showSlides(slideIndex);
  }
});
