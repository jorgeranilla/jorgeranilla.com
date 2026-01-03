// Mobile menu
const toggle = document.querySelector(".nav-toggle");
const links = document.querySelector(".nav-links");

if (toggle && links) {
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  links.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

// Countdown: Feb 24, 2026 @ 4:00 PM (local time)
const EVENT_DATE_LOCAL = "2026-02-24T16:00:00";
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

// ===== RSVP -> Google Forms (stays on page, no redirect) =====
const rsvpForm = document.getElementById("rsvpForm");
const rsvpStatus = document.getElementById("rsvpStatus");

/**
 * STEP 1: Paste your Google Form ID below.
 * Your form URL looks like:
 * https://docs.google.com/forms/d/e/FORM_ID/viewform
 */
const GOOGLE_FORM_ID = "PASTE_YOUR_FORM_ID_HERE";

/**
 * STEP 2: Paste your Google Forms entry IDs (name="entry.########") for each question.
 * You already gave me one:
 * - attending: entry.877086558
 *
 * You still need to add 3 more entry ids for:
 * - names
 * - contact
 * - comments
 */
const GOOGLE_FORM_ENTRIES = {
  attending: "entry.877086558",    // Can you attend?
  names: "entry.REPLACE_ME_1",     // What are the names of people attending?
  contact: "entry.REPLACE_ME_2",   // Best contact phone number or email?
  comments: "entry.REPLACE_ME_3"   // Comments and/or questions
};

function formResponseUrl(formId) {
  return `https://docs.google.com/forms/d/e/${formId}/formResponse`;
}

async function submitToGoogleForms(url, payload) {
  // no-cors keeps the visitor on your page (Google blocks reading the response, but it submits)
  await fetch(url, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(payload).toString()
  });
}

if (rsvpForm) {
  rsvpForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!GOOGLE_FORM_ID || GOOGLE_FORM_ID.includes("PASTE_YOUR_FORM_ID_HERE")) {
      rsvpStatus.textContent = "Setup needed: paste your Google Form ID into script.js (GOOGLE_FORM_ID).";
      return;
    }

    const missingEntry =
      Object.values(GOOGLE_FORM_ENTRIES).some(v => !v || v.includes("REPLACE_ME"));

    if (missingEntry) {
      rsvpStatus.textContent =
        "Setup needed: paste the remaining Google Form entry IDs (names, contact, comments) into script.js.";
      return;
    }

    const fd = new FormData(rsvpForm);
    const attending = (fd.get("attending") || "").toString().trim();
    const names = (fd.get("names") || "").toString().trim();
    const contact = (fd.get("contact") || "").toString().trim();
    const comments = (fd.get("comments") || "").toString().trim();

    if (!attending || !names || !contact) {
      rsvpStatus.textContent = "Please complete: Can you attend, Names attending, and Best contact.";
      return;
    }

    const payload = {};
    payload[GOOGLE_FORM_ENTRIES.attending] = attending;
    payload[GOOGLE_FORM_ENTRIES.names] = names;
    payload[GOOGLE_FORM_ENTRIES.contact] = contact;
    payload[GOOGLE_FORM_ENTRIES.comments] = comments;

    try {
      rsvpStatus.textContent = "Sending…";
      await submitToGoogleForms(formResponseUrl(GOOGLE_FORM_ID), payload);

      rsvpForm.reset();
      rsvpStatus.textContent = "Thank you! Your RSVP was sent.";
    } catch (err) {
      rsvpStatus.textContent =
        "Something blocked the submission. Please try again.";
    }
  });
}