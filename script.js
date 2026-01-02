document.addEventListener("DOMContentLoaded", () => {
  const rail = document.querySelector(".social-rail");
  if (!rail) return;

  const EDGE = 18; // px from left edge to trigger
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
});