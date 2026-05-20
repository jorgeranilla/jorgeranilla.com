/**
 * umsteadgrove.js — Firebase Functions for the Umstead Grove FSBO site.
 *
 * Endpoints:
 *   POST /umsteadgrove-submit         — Buyer form + optional file upload
 *   GET  /umsteadgrove-leads          — List all leads (admin)
 *   PATCH /umsteadgrove-updateLead    — Update lead status/notes
 *   GET  /umsteadgrove-download       — Download uploaded pre-approval (admin)
 *   POST /umsteadgrove-sendUpdate     — Send bulk email update to consented leads
 */

const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const busboy = require('busboy');
const nodemailer = require('nodemailer');
const path = require('path');
const os = require('os');
const fs = require('fs');

// ─── SECRETS ─────────────────────────────────────────────────────────────────
const smtpHost     = defineSecret('UG_SMTP_HOST');
const smtpPort     = defineSecret('UG_SMTP_PORT');
const smtpUser     = defineSecret('UG_SMTP_USER');
const smtpPass     = defineSecret('UG_SMTP_PASS');
const sellerEmail  = defineSecret('UG_SELLER_EMAIL');
const adminPassword = defineSecret('UG_ADMIN_PASSWORD');

// ─── FIREBASE INIT ────────────────────────────────────────────────────────────
if (!admin.apps.length) admin.initializeApp();
const db      = admin.firestore();
const storage = admin.storage();

const COLLECTION   = 'umsteadgrove_leads';
const BUCKET_PREFIX = 'umsteadgrove/preapprovals/';
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME  = new Set(['application/pdf','image/jpeg','image/png']);
const ORIGIN = 'https://jorgeranilla.com';

const FUNCTION_OPTS = {
  region: 'us-central1',
  invoker: 'public',
  minInstances: 0,
  secrets: [smtpHost, smtpPort, smtpUser, smtpPass, sellerEmail, adminPassword],
};

// ─── CORS HELPER ─────────────────────────────────────────────────────────────
function cors(req, res) {
  res.set('Access-Control-Allow-Origin', ORIGIN);
  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(204).send(''); return true; }
  return false;
}

// ─── ADMIN AUTH HELPER ────────────────────────────────────────────────────────
function checkAdmin(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '').trim();
  return token === adminPassword.value();
}

// ─── MAILER ──────────────────────────────────────────────────────────────────
function getTransporter() {
  return nodemailer.createTransport({
    host: smtpHost.value(),
    port: parseInt(smtpPort.value(), 10),
    secure: parseInt(smtpPort.value(), 10) === 465,
    auth: { user: smtpUser.value(), pass: smtpPass.value() },
  });
}

// ─── EMAIL TEMPLATES ─────────────────────────────────────────────────────────
const EMAIL_STYLES = `
  font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto;
  background: #ffffff; border: 1px solid #e0ece4; border-radius: 12px; overflow: hidden;
`;
const HEADER_STYLE = `background: #1a3a2e; padding: 28px 32px; text-align: center;`;
const BODY_STYLE = `padding: 32px;`;
const FOOTER_STYLE = `background: #f0ece4; padding: 20px 32px; font-size: 12px; color: #7a7a7a; text-align: center;`;
const GOLD = '#c9a84c';
const GREEN = '#1a3a2e';

function emailWrap(title, body, footerExtra = '') {
  return `
  <div style="${EMAIL_STYLES}">
    <div style="${HEADER_STYLE}">
      <h1 style="color:${GOLD};font-size:22px;margin:0">Umstead Grove</h1>
      <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:6px 0 0">Durham, NC · For Sale By Owner</p>
    </div>
    <div style="${BODY_STYLE}">
      <h2 style="color:${GREEN};margin-top:0">${title}</h2>
      ${body}
    </div>
    <div style="${FOOTER_STYLE}">
      <p style="margin:0">Equal Housing Opportunity · 🏛️ Fair Housing Compliant</p>
      <p style="margin:6px 0 0">This email was sent regarding a property listing inquiry at Umstead Grove, Durham, NC.</p>
      ${footerExtra}
      <p style="margin:6px 0 0">Seller is not a licensed real estate agent. All information believed accurate but not guaranteed.</p>
    </div>
  </div>`;
}

function buyerConfirmationEmail(lead) {
  const showingLine = lead.showingDateTime
    ? `<p><strong>Showing Requested:</strong> ${new Date(lead.showingDateTime).toLocaleString('en-US', { dateStyle:'full', timeStyle:'short' })}</p>`
    : '';
  return emailWrap('Thank You for Your Interest!', `
    <p>Hi ${lead.fullName},</p>
    <p>We've received your buyer registration and ${lead.showingDateTime ? 'showing request' : 'inquiry'} for the property at <strong>Umstead Grove, Durham, NC</strong>. The seller will follow up within <strong>24 hours</strong>.</p>
    <div style="background:#f0f8f4;border-left:4px solid ${GOLD};border-radius:8px;padding:16px;margin:20px 0">
      <p style="margin:0;font-weight:bold;color:${GREEN}">What happens next?</p>
      <ul style="margin:8px 0 0;padding-left:20px;color:#4a4a4a">
        <li>The seller will review your information</li>
        <li>${lead.showingDateTime ? 'Your showing request will be confirmed or an alternate time proposed' : 'The seller will reach out to answer your questions'}</li>
        <li>You'll hear back via your preferred contact method: <strong>${lead.contactPreference || 'email'}</strong></li>
      </ul>
    </div>
    ${showingLine}
    <p style="font-size:13px;color:#7a7a7a;margin-top:24px;border-top:1px solid #eee;padding-top:16px">
      <strong>Important:</strong> This confirmation does not constitute an offer, contract, or guarantee of a showing.
      Your information will only be used for communications related to this property sale.
      ${lead.consentUpdates ? 'You opted in to future property updates. Reply STOP to any email to opt out.' : ''}
    </p>
  `);
}

function sellerNotificationEmail(lead) {
  return emailWrap('New Buyer Inquiry — Action Required', `
    <p>A new buyer has submitted their information for <strong>Umstead Grove</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      ${[
        ['Name', lead.fullName], ['Email', lead.email], ['Phone', lead.phone],
        ['Pre-Approval', lead.preApprovalStatus], ['Lender', lead.lenderName || '—'],
        ['Budget', lead.budget || '—'], ['Buyer Agent', lead.hasBuyerAgent],
        ['Agent Name', lead.agentName || '—'], ['Showing Requested', lead.showingDateTime || '—'],
        ['Consented to Updates', lead.consentUpdates ? 'Yes' : 'No'],
        ['File Uploaded', lead.fileUploaded ? 'Yes — see admin panel' : 'No'],
        ['Message', lead.message || '—'],
      ].map(([k,v]) => `
        <tr style="border-bottom:1px solid #eee">
          <td style="padding:8px 12px;font-weight:600;color:${GREEN};width:40%">${k}</td>
          <td style="padding:8px 12px;color:#4a4a4a">${v}</td>
        </tr>`).join('')}
    </table>
    <p><a href="https://jorgeranilla.com/umsteadgrove/admin.html" style="background:${GREEN};color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold">Open Admin Panel →</a></p>
  `);
}

function priceUpdateEmail(to, name, newPrice, note = '') {
  return emailWrap('Price Update — Umstead Grove', `
    <p>Hi ${name},</p>
    <p>We wanted to let you know that the price for the property at <strong>Umstead Grove, Durham, NC</strong> has been updated.</p>
    <div style="background:#f0f8f4;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
      <p style="margin:0;color:#7a7a7a;font-size:14px">NEW LIST PRICE</p>
      <p style="margin:8px 0 0;font-size:36px;font-weight:bold;color:${GOLD}">${newPrice}</p>
    </div>
    ${note ? `<p>${note}</p>` : ''}
    <p>If you'd like to schedule a showing or have questions, please reply to this email or visit the property page.</p>
    <a href="https://jorgeranilla.com/umsteadgrove" style="background:${GREEN};color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">View Property →</a>
  `, '<p style="margin:6px 0 0">You received this because you opted in to property updates. Reply STOP to unsubscribe.</p>');
}

function openHouseEmail(to, name, date, time, address) {
  return emailWrap('Open House Announcement — Umstead Grove', `
    <p>Hi ${name},</p>
    <p>We're excited to announce an <strong>Open House</strong> at Umstead Grove!</p>
    <div style="background:#1a3a2e;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
      <p style="margin:0;color:${GOLD};font-size:20px;font-weight:bold">🏡 Open House</p>
      <p style="margin:8px 0 0;color:white;font-size:18px">${date}</p>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.8)">${time}</p>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:14px">${address}</p>
    </div>
    <p>No appointment needed. Come tour the home and meet the seller directly!</p>
    <a href="https://jorgeranilla.com/umsteadgrove" style="background:${GOLD};color:${GREEN};padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold">View Property Details →</a>
  `, '<p style="margin:6px 0 0">You received this because you opted in to property updates. Reply STOP to unsubscribe.</p>');
}

function showingConfirmEmail(lead, confirmedDateTime) {
  return emailWrap('Showing Confirmed — Umstead Grove', `
    <p>Hi ${lead.fullName},</p>
    <p>Your showing at <strong>Umstead Grove, Durham, NC</strong> has been confirmed!</p>
    <div style="background:#e8f5e9;border-radius:12px;padding:24px;margin:20px 0">
      <p style="margin:0;font-size:18px;font-weight:bold;color:${GREEN}">📅 ${confirmedDateTime}</p>
    </div>
    <p>Please arrive a few minutes early. Questions? Reply to this email.</p>
    <p style="font-size:13px;color:#7a7a7a;margin-top:20px">Confirming a showing does not constitute an offer or contract.</p>
  `);
}

function followUpEmail(lead) {
  return emailWrap('Following Up — Umstead Grove', `
    <p>Hi ${lead.fullName},</p>
    <p>Thank you for your interest in Umstead Grove! We wanted to follow up and see if you have any questions or would like to schedule a showing.</p>
    <p>The property is still available. We'd love to hear from you.</p>
    <a href="https://jorgeranilla.com/umsteadgrove#contact" style="background:${GREEN};color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">Request a Showing →</a>
  `, '<p>You received this because you submitted a buyer inquiry for Umstead Grove. Reply STOP to unsubscribe.</p>');
}

// ─── PARSE MULTIPART HELPER ───────────────────────────────────────────────────
function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const fields = {};
    let fileBuffer = null;
    let fileMime = null;
    let fileName = null;
    let fileSize = 0;
    let fileTooLarge = false;

    const bb = busboy({ headers: req.headers, limits: { fileSize: MAX_FILE_BYTES + 1 } });

    bb.on('field', (name, val) => { fields[name] = val; });
    bb.on('file', (name, file, info) => {
      if (name !== 'preApprovalFile') { file.resume(); return; }
      if (!ALLOWED_MIME.has(info.mimeType)) { file.resume(); return; }
      fileMime = info.mimeType;
      fileName = path.basename(info.filename);
      const chunks = [];
      file.on('data', chunk => {
        fileSize += chunk.length;
        if (fileSize > MAX_FILE_BYTES) { fileTooLarge = true; file.destroy(); return; }
        chunks.push(chunk);
      });
      file.on('close', () => {
        if (!fileTooLarge) fileBuffer = Buffer.concat(chunks);
      });
    });
    bb.on('close', () => resolve({ fields, fileBuffer, fileMime, fileName, fileTooLarge }));
    bb.on('error', reject);
    req.pipe(bb);
  });
}

// ─── SUBMIT ENDPOINT ──────────────────────────────────────────────────────────
exports.umsteadgroveSubmit = onRequest(FUNCTION_OPTS, async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only.' });

  let parsed;
  try { parsed = await parseMultipart(req); }
  catch (e) { return res.status(400).json({ error: 'Could not parse request.' }); }

  const { fields, fileBuffer, fileMime, fileName, fileTooLarge } = parsed;

  if (fileTooLarge) return res.status(400).json({ error: 'File exceeds 10 MB limit.' });

  // Basic server-side validation
  if (!fields.fullName?.trim()) return res.status(400).json({ error: 'Name is required.' });
  if (!fields.email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return res.status(400).json({ error: 'Valid email required.' });
  if (!fields.phone?.trim()) return res.status(400).json({ error: 'Phone is required.' });
  if (fields.ackNoContract !== 'true' || fields.ackPrivacy !== 'true')
    return res.status(400).json({ error: 'Required acknowledgements missing.' });

  // Spam check: honeypot field should be empty
  if (fields._honey?.trim()) return res.status(200).json({ ok: true }); // silent discard

  // Store file in Firebase Storage
  let fileUploaded = false;
  let fileStoragePath = null;
  if (fileBuffer && fileMime) {
    const leadRef = db.collection(COLLECTION).doc();
    const ext = fileMime === 'application/pdf' ? '.pdf' : fileMime === 'image/jpeg' ? '.jpg' : '.png';
    fileStoragePath = `${BUCKET_PREFIX}${leadRef.id}${ext}`;
    const bucket = storage.bucket();
    const file = bucket.file(fileStoragePath);
    await file.save(fileBuffer, { metadata: { contentType: fileMime, metadata: { originalName: fileName } } });
    // No public URL — access via signed URL only
    fileUploaded = true;
  }

  // Save lead to Firestore
  const lead = {
    fullName:         fields.fullName.trim(),
    email:            fields.email.trim().toLowerCase(),
    phone:            fields.phone.trim(),
    contactPreference: fields.contactPreference || '',
    preApprovalStatus: fields.preApprovalStatus || '',
    lenderName:       fields.lenderName || '',
    budget:           fields.budget || '',
    hasBuyerAgent:    fields.hasBuyerAgent || '',
    agentName:        fields.agentName || '',
    agentContact:     fields.agentContact || '',
    showingDateTime:  fields.showingDateTime || '',
    message:          fields.message || '',
    consentUpdates:   fields.consentUpdates === 'true',
    ackNoContract:    fields.ackNoContract === 'true',
    ackNoSensitive:   fields.ackNoSensitive === 'true',
    ackPrivacy:       fields.ackPrivacy === 'true',
    fileUploaded,
    fileStoragePath,
    leadStatus:       'New',
    notes:            '',
    dateSubmitted:    admin.firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection(COLLECTION).add(lead);

  // Send emails (non-blocking)
  const mailer = getTransporter();
  const sEmail = sellerEmail.value();

  await Promise.allSettled([
    // Confirmation to buyer
    mailer.sendMail({
      from: `"Umstead Grove Seller" <${smtpUser.value()}>`,
      to: lead.email,
      subject: 'Your Inquiry Has Been Received — Umstead Grove, Durham NC',
      html: buyerConfirmationEmail(lead),
    }),
    // Notification to seller
    mailer.sendMail({
      from: `"Umstead Grove Inquiry" <${smtpUser.value()}>`,
      to: sEmail,
      replyTo: lead.email,
      subject: `New Buyer Inquiry: ${lead.fullName} — Umstead Grove`,
      html: sellerNotificationEmail(lead),
    }),
  ]);

  res.json({ ok: true, leadId: docRef.id });
});

// ─── LIST LEADS (ADMIN) ───────────────────────────────────────────────────────
exports.umsteadgroveLeads = onRequest(FUNCTION_OPTS, async (req, res) => {
  if (cors(req, res)) return;
  if (!checkAdmin(req)) return res.status(401).json({ error: 'Unauthorized.' });

  const snap = await db.collection(COLLECTION).orderBy('dateSubmitted', 'desc').get();
  const leads = snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      dateSubmitted: data.dateSubmitted?.toDate?.().toISOString() || '',
      fileStoragePath: undefined, // Don't expose
    };
  });
  res.json({ leads });
});

// ─── UPDATE LEAD (ADMIN) ──────────────────────────────────────────────────────
exports.umsteadgroveUpdateLead = onRequest(FUNCTION_OPTS, async (req, res) => {
  if (cors(req, res)) return;
  if (!checkAdmin(req)) return res.status(401).json({ error: 'Unauthorized.' });
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'PATCH only.' });

  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'Lead ID required.' });

  const { leadStatus, notes } = req.body;
  const allowed = ['New','Contacted','Showing Scheduled','Viewed','Follow-Up','Offer Received','Not Interested'];
  if (leadStatus && !allowed.includes(leadStatus))
    return res.status(400).json({ error: 'Invalid status.' });

  await db.collection(COLLECTION).doc(id).update({
    ...(leadStatus ? { leadStatus } : {}),
    ...(notes !== undefined ? { notes } : {}),
  });
  res.json({ ok: true });
});

// ─── DOWNLOAD PRE-APPROVAL (ADMIN) ───────────────────────────────────────────
exports.umsteadgroveDownload = onRequest(FUNCTION_OPTS, async (req, res) => {
  if (cors(req, res)) return;
  if (!checkAdmin(req)) return res.status(401).json({ error: 'Unauthorized.' });

  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'Lead ID required.' });

  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists || !doc.data().fileStoragePath)
    return res.status(404).json({ error: 'No file found.' });

  const [url] = await storage.bucket().file(doc.data().fileStoragePath)
    .getSignedUrl({ action: 'read', expires: Date.now() + 15 * 60 * 1000 }); // 15 min
  res.redirect(url);
});

// ─── SEND BULK UPDATE (ADMIN) ─────────────────────────────────────────────────
exports.umsteadgroveSendUpdate = onRequest(FUNCTION_OPTS, async (req, res) => {
  if (cors(req, res)) return;
  if (!checkAdmin(req)) return res.status(401).json({ error: 'Unauthorized.' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only.' });

  const { type, payload } = req.body;
  // type: 'price_update' | 'open_house' | 'follow_up' | 'status_update'

  const snap = await db.collection(COLLECTION).where('consentUpdates', '==', true).get();
  const leads = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  const mailer = getTransporter();
  let sent = 0;

  for (const lead of leads) {
    let html, subject;
    if (type === 'price_update') {
      subject = `Price Update — Umstead Grove, Durham NC`;
      html = priceUpdateEmail(lead.email, lead.fullName, payload.newPrice, payload.note);
    } else if (type === 'open_house') {
      subject = `Open House — Umstead Grove, Durham NC`;
      html = openHouseEmail(lead.email, lead.fullName, payload.date, payload.time, payload.address);
    } else if (type === 'follow_up') {
      subject = `Following Up — Umstead Grove`;
      html = followUpEmail(lead);
    } else if (type === 'showing_confirm') {
      subject = `Showing Confirmed — Umstead Grove`;
      html = showingConfirmEmail(lead, payload.confirmedDateTime);
    } else {
      continue;
    }
    await mailer.sendMail({
      from: `"Umstead Grove Seller" <${smtpUser.value()}>`,
      to: lead.email,
      subject,
      html,
    }).catch(() => {});
    sent++;
  }
  res.json({ ok: true, sent });
});
