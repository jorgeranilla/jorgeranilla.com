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

// ===== RSVP -> Google Forms (Seamless Submission) =====
const rsvpForm = document.getElementById("rsvpForm");
const rsvpStatus = document.getElementById("rsvpStatus");

// YOUR GOOGLE FORM ID
const GOOGLE_FORM_ID = "1FAIpQLSdi4C22oLlX6bOUN7bE35m47pnYjnYk0oNPjTfQvVhdwz40tA";

// YOUR GOOGLE FORM ENTRY IDs
const GOOGLE_FORM_ENTRIES = {
  attending: "entry.877086558",    // Yes/No
  names: "entry.1498135098",       // Name
  contact: "entry.2606285",        // Phone/Email
  comments: "entry.2109756448"     // Comments
};

function formResponseUrl(formId) {
  return `https://docs.google.com/forms/d/e/${formId}/formResponse`;
}

async function submitToGoogleForms(url, payload) {
  // mode: "no-cors" allows submission without redirecting the user
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

    const fd = new FormData(rsvpForm);
    // Google Forms expects the exact strings "Yes, I'll be there" or "Sorry, can't make it"
    const attending = (fd.get("attending") || "").toString().trim();
    const names = (fd.get("names") || "").toString().trim();
    const contact = (fd.get("contact") || "").toString().trim();
    const comments = (fd.get("comments") || "").toString().trim();

    if (!attending || !names || !contact) {
      rsvpStatus.textContent = "Please complete all required fields.";
      rsvpStatus.style.color = "red";
      return;
    }

    // Map your form inputs to Google's entry IDs
    const payload = {};
    payload[GOOGLE_FORM_ENTRIES.attending] = attending;
    payload[GOOGLE_FORM_ENTRIES.names] = names;
    payload[GOOGLE_FORM_ENTRIES.contact] = contact;
    payload[GOOGLE_FORM_ENTRIES.comments] = comments;

    try {
      rsvpStatus.textContent = "Sending...";
      rsvpStatus.style.color = "inherit";
      
      await submitToGoogleForms(formResponseUrl(GOOGLE_FORM_ID), payload);

      rsvpForm.reset();
      rsvpStatus.textContent = "Thank you! Your RSVP has been sent. 💌";
      rsvpStatus.style.color = "green";
      rsvpStatus.style.fontWeight = "bold";
    } catch (err) {
      rsvpStatus.textContent = "Error sending. Please text us instead.";
      rsvpStatus.style.color = "red";
    }
  });
}