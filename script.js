document.addEventListener("DOMContentLoaded", () => {
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
