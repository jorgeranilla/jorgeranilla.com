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
  
  // Make the function accessible globally so the HTML onclick works
  window.currentSlide = function(n) {
      showSlides(slideIndex = n);
  };

  let slideIndex = 1;
  showSlides(slideIndex);

  function showSlides(n) {
      let i;
      if (n > slides.length) {slideIndex = 1}    
      if (n < 1) {slideIndex = slides.length}
      
      // Hide all slides
      for (i = 0; i < slides.length; i++) {
          slides[i].classList.remove("active");
      }
      
      // Deactivate all dots
      for (i = 0; i < dots.length; i++) {
          dots[i].classList.remove("active");
      }
      
      // Show the current slide and activate the dot
      // (Arrays are 0-indexed, so we subtract 1)
      slides[slideIndex-1].classList.add("active");
      dots[slideIndex-1].classList.add("active");
  }
});