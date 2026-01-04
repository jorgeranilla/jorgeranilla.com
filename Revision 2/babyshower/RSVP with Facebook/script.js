// Countdown: Feb 22, 2026 @ 4:00 PM (local time)
const EVENT_DATE_LOCAL = "2026-02-22T16:00:00";
const note = document.getElementById("countdown-note");

function pad(n) { return String(n).padStart(2, "0"); }

function updateCountdown() {
  const target = new Date(EVENT_DATE_LOCAL).getTime();
  const now = Date.now();
  const diff = target - now;

  const d = document.getElementById("cd-days");
  const h = document.getElementById("cd-hours");
  const m = document.getElementById("cd-mins");
  const s = document.getElementById("cd-secs");

  if (!d || !h || !m || !s) return;

  if (Number.isNaN(target)) {
    d.textContent = "--";
    h.textContent = "--";
    m.textContent = "--";
    s.textContent = "--";
    if (note) note.textContent = "Countdown date is not set correctly.";
    return;
  }

  if (diff <= 0) {
    d.textContent = "00";
    h.textContent = "00";
    m.textContent = "00";
    s.textContent = "00";
    if (note) note.textContent = "It’s baby shower time! 🎉";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);

  d.textContent = pad(days);
  h.textContent = pad(hours);
  m.textContent = pad(mins);
  s.textContent = pad(secs);

  if (note) note.textContent = "";
}

updateCountdown();
setInterval(updateCountdown, 1000);