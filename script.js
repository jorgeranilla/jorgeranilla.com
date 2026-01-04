document.addEventListener("DOMContentLoaded", () => {
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
    const pathParts = window.location.pathname.split("/").filter(p => p);
    const depth = pathParts.length - 1; // 0 for root, 1 for subfolders
    const homePrefix = depth > 0 ? "../" : "";
    
    const sectionHref = {
      "Family": `${homePrefix}family/my-story.html`,
      "Gallery": `${homePrefix}gallery/family.html`,
      "Professional": `${homePrefix}professional/at-a-glance.html`,
      "Blog": `${homePrefix}blog/latest-posts.html`
    };

    const homeLink = `<a href="${homePrefix}index.html">Home</a>`;
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
