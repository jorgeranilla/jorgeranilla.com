document.addEventListener("DOMContentLoaded", () => {
  /* ===========================
     1. Social Rail Logic
  =========================== */
  const rail = document.querySelector(".social-rail");
  if (rail) {
    const EDGE = 18; 
    let visible = false;

    function show() {
      if (visible) return;
      rail.classList.add("show");
      visible = true;
    }

    function hide() {
      if (!visible) return;
      rail.classList.remove("show");
      visible = false;
    }

    document.addEventListener("mousemove", (e) => {
      if (e.clientX <= EDGE) show();
      else if (!rail.matches(":hover")) hide();
    });

    rail.addEventListener("mouseenter", show);
    rail.addEventListener("mouseleave", hide);
  }

  /* ===========================
     2. Hero Carousel Logic
  =========================== */
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  
  // Only run if carousel exists on this page
  if (slides.length > 0) {
      window.currentSlide = function(n) {
          showSlides(slideIndex = n);
      };

      let slideIndex = 1;
      showSlides(slideIndex);

      function showSlides(n) {
          let i;
          if (n > slides.length) {slideIndex = 1}    
          if (n < 1) {slideIndex = slides.length}
          
          for (i = 0; i < slides.length; i++) {
              slides[i].classList.remove("active");
          }
          
          for (i = 0; i < dots.length; i++) {
              dots[i].classList.remove("active");
          }
          
          slides[slideIndex-1].classList.add("active");
          dots[slideIndex-1].classList.add("active");
      }
  }
});