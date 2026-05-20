const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");

const OUT_DIR = "C:/Projects/jorgeranilla.com/output/acc-revision";
const OUT = path.join(OUT_DIR, "ACC Community Discussion Presentation - Revised.pptx");

fs.mkdirSync(OUT_DIR, { recursive: true });

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Umstead Grove ACC";
pptx.company = "Umstead Grove HOA";
pptx.subject = "ACC Community Discussion";
pptx.title = "ACC Community Discussion Presentation";
pptx.lang = "en-US";
pptx.theme = {
  headFontFace: "Aptos Display",
  bodyFontFace: "Aptos",
  lang: "en-US",
};
pptx.margin = 0;
pptx.layout = "LAYOUT_WIDE";
pptx.defineLayout({ name: "ACC_WIDE", width: 13.333, height: 7.5 });
pptx.layout = "ACC_WIDE";

const C = {
  ink: "17212B",
  muted: "5E6B78",
  green: "2B6E62",
  sage: "DDEAE5",
  pale: "F5F8F6",
  gold: "C99A3F",
  line: "C9D8D2",
  white: "FFFFFF",
  softBlue: "EAF2F7",
  rust: "A8573F",
};

function addBg(slide) {
  slide.background = { color: "FBFCFA" };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 7.5, fill: { color: C.green }, line: { color: C.green } });
}

function addFooter(slide, source, idx) {
  slide.addShape(pptx.ShapeType.line, { x: 0.65, y: 6.94, w: 12.0, h: 0, line: { color: C.line, width: 1 } });
  slide.addText(source, { x: 0.65, y: 7.05, w: 10.9, h: 0.22, fontFace: "Aptos", fontSize: 9.5, color: C.muted, fit: "shrink" });
  slide.addText(String(idx), { x: 12.1, y: 7.02, w: 0.55, h: 0.25, fontFace: "Aptos", fontSize: 10, color: C.muted, align: "right" });
}

function title(slide, kicker, text, subtitle) {
  slide.addText(kicker.toUpperCase(), { x: 0.72, y: 0.45, w: 4.0, h: 0.25, fontFace: "Aptos", fontSize: 10.5, bold: true, color: C.green, charSpace: 1.1 });
  slide.addText(text, { x: 0.7, y: 0.78, w: 9.9, h: 0.62, fontFace: "Aptos Display", fontSize: 30, bold: true, color: C.ink, margin: 0 });
  if (subtitle) slide.addText(subtitle, { x: 0.72, y: 1.42, w: 10.8, h: 0.36, fontFace: "Aptos", fontSize: 13.5, color: C.muted, margin: 0 });
}

function bulletList(slide, items, x, y, w, fontSize = 18, color = C.ink, gap = 0.48) {
  items.forEach((item, i) => {
    slide.addShape(pptx.ShapeType.ellipse, { x, y: y + i * gap + 0.11, w: 0.09, h: 0.09, fill: { color: C.gold }, line: { color: C.gold } });
    slide.addText(item, { x: x + 0.22, y: y + i * gap, w, h: gap - 0.02, fontFace: "Aptos", fontSize, color, breakLine: false, fit: "shrink", valign: "mid" });
  });
}

function cover() {
  const s = pptx.addSlide();
  s.background = { color: "102922" };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: "102922" }, line: { color: "102922" } });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 5.78, w: 13.333, h: 1.72, fill: { color: "173B32", transparency: 0 }, line: { color: "173B32" } });
  s.addShape(pptx.ShapeType.line, { x: 0.9, y: 1.02, w: 1.4, h: 0, line: { color: C.gold, width: 4 } });
  s.addText("Umstead Grove HOA", { x: 0.9, y: 1.18, w: 3.6, h: 0.28, fontFace: "Aptos", fontSize: 12, color: "D9E7E0", bold: true });
  s.addText("ACC Community Meeting", { x: 0.85, y: 1.7, w: 9.9, h: 1.8, fontFace: "Aptos Display", fontSize: 48, color: C.white, bold: true, margin: 0, breakLine: false, fit: "shrink" });
  s.addText("A practical discussion about standards, review process, and homeowner feedback.", { x: 0.9, y: 3.55, w: 8.3, h: 0.48, fontFace: "Aptos", fontSize: 19, color: "CFE0D8", margin: 0 });
  s.addText("Welcome, neighbors", { x: 0.9, y: 6.25, w: 4.2, h: 0.36, fontFace: "Aptos", fontSize: 17, color: C.white, bold: true });
  s.addText("Organized, respectful, transparent", { x: 0.9, y: 6.67, w: 5.0, h: 0.28, fontFace: "Aptos", fontSize: 12.5, color: "CFE0D8" });
  s.addNotes("Welcome everyone. Set the tone: the ACC values community input and wants the meeting to stay organized, respectful, and grounded in the governing documents.");
}

function roleSlide() {
  const s = pptx.addSlide();
  addBg(s);
  title(s, "CC&R Article 13", "What the ACC is responsible for", "Exact language from the recorded Declaration, shown here to ground the discussion.");
  const quotes = [
    {
      head: "Review and approval",
      quote: "The Architectural Control Committee shall have the absolute and exclusive right to approve or disapprove Plans in its sole discretion and may approve or disapprove Plans based on purely aesthetic reasons, which in the sole discretion of the Architectural Control Committee shall be deemed sufficient.",
      cite: "CC&R Section 13.01"
    },
    {
      head: "Committee structure",
      quote: "The Architectural Control Committee shall be composed of three (3) persons (who need not be Members of the Association) appointed by the Board. A majority of the Architectural Control Committee may designate a representative to act for it.",
      cite: "CC&R Section 13.02(a)(i)"
    },
    {
      head: "Monitoring compliance",
      quote: "The ACC shall have the right to monitor construction of improvements and investigate compliance with the approved Plans and is hereby granted the right to enter upon any Lot in order to do so.",
      cite: "CC&R Section 13.02(b)"
    },
  ];
  quotes.forEach((q, i) => {
    const y = 2.02 + i * 1.42;
    s.addText(q.head, { x: 0.78, y, w: 2.45, h: 0.28, fontFace: "Aptos", fontSize: 13, color: C.green, bold: true });
    s.addText(`"${q.quote}"`, { x: 3.1, y: y - 0.06, w: 8.8, h: 0.75, fontFace: "Aptos", fontSize: 17.6, color: C.ink, margin: 0.02, fit: "shrink", breakLine: false });
    s.addText(q.cite, { x: 10.8, y: y + 0.72, w: 1.2, h: 0.2, fontFace: "Aptos", fontSize: 9.5, color: C.muted, italic: true, align: "right" });
    if (i < quotes.length - 1) s.addShape(pptx.ShapeType.line, { x: 0.78, y: y + 1.12, w: 11.2, h: 0, line: { color: C.line, width: 1 } });
  });
  addFooter(s, "Source: Umstead Grove Declaration of Covenants, Conditions and Restrictions - Recorded.pdf, Article 13.", 2);
  s.addNotes("Use this slide to explain the ACC's role without expanding beyond the governing documents. Emphasize that the role is review, consistency, and compliance with approved plans.");
}

function agendaSlide() {
  const s = pptx.addSlide();
  addBg(s);
  title(s, "Meeting agenda", "Community forum topics", "The goal is discussion, feedback, and clarity around possible future ACC direction.");
  s.addText("Forum purpose", { x: 0.8, y: 1.95, w: 3.2, h: 0.3, fontFace: "Aptos", fontSize: 15, bold: true, color: C.green });
  s.addText("We want to honor the guidelines and covenants laid out by the governing documents while giving homeowners a voice in the community's future direction and aesthetic disposition.", {
    x: 0.82,
    y: 2.45,
    w: 5.05,
    h: 1.6,
    fontFace: "Aptos",
    fontSize: 20,
    color: C.ink,
    fit: "shrink",
    breakLine: false,
    margin: 0.02,
  });
  s.addText("These are discussion points, not final proposals or adopted rules.", {
    x: 0.82,
    y: 4.55,
    w: 5.0,
    h: 0.5,
    fontFace: "Aptos",
    fontSize: 17,
    bold: true,
    color: C.rust,
    fit: "shrink",
  });
  s.addShape(pptx.ShapeType.line, { x: 6.45, y: 1.92, w: 0, h: 4.05, line: { color: C.line, width: 1 } });
  s.addText("Planned topics", { x: 7.0, y: 1.95, w: 3.4, h: 0.3, fontFace: "Aptos", fontSize: 15, bold: true, color: C.green });
  [
    "Trash Enclosures",
    "Fire Safe Community",
    "Drainage Easements",
    "Aesthetic Preferences",
    "Approval for Softscaping",
  ].forEach((topic, i) => {
    const y = 2.43 + i * 0.66;
    s.addText(String(i + 1), { x: 7.02, y, w: 0.36, h: 0.36, fontFace: "Aptos", fontSize: 15.5, bold: true, color: C.green, align: "center" });
    s.addText(topic, { x: 7.55, y: y - 0.01, w: 4.2, h: 0.36, fontFace: "Aptos", fontSize: 20, color: C.ink, bold: i === 0, fit: "shrink" });
  });
  addFooter(s, "Agenda based on the ACC forum email to the Board and the five listed discussion topics.", 3);
  s.addNotes("Explain that this is intended as a forum-style discussion. The ACC is not presenting final proposals; community feedback is the primary goal.");
}

function structureSlide() {
  const s = pptx.addSlide();
  addBg(s);
  title(s, "Meeting structure", "A consistent path for each topic", "Each topic will be reviewed in the same order so the discussion stays clear, fair, and easy to follow.");
  const steps = [
    ["1", "Governing language", "Start with the relevant CCR, amendment, or ARC guideline language."],
    ["2", "Concerns to discuss", "Name the practical homeowner, access, appearance, or consistency concerns."],
    ["3", "Community feedback", "Invite comments, examples, and tradeoffs from neighbors."],
    ["4", "Follow-up path", "Capture items that may need Board, CAMS, legal, or future amendment review."],
  ];
  steps.forEach((st, i) => {
    const y = 1.98 + i * 1.04;
    s.addShape(pptx.ShapeType.roundRect, { x: 0.85, y, w: 11.35, h: 0.72, rectRadius: 0.07, fill: { color: i % 2 ? "F7FAF8" : C.pale }, line: { color: C.line, width: 0.7 } });
    s.addText(`${st[0]}. ${st[1]}`, { x: 1.15, y: y + 0.12, w: 3.2, h: 0.28, fontFace: "Aptos", fontSize: 16, bold: true, color: C.green, margin: 0 });
    s.addText(st[2], { x: 4.45, y: y + 0.12, w: 7.35, h: 0.32, fontFace: "Aptos", fontSize: 15.5, color: C.ink, margin: 0, fit: "shrink" });
  });
  addFooter(s, "Discussion format for live meeting facilitation.", 4);
  s.addNotes("Use this slide to explain the meeting flow. Each topic starts with governing language, then concerns, then community feedback, then follow-up items.");
}

const topics = [
  {
    name: "Trash Enclosures",
    time: "Priority #1",
    source: "ARC Guidelines C.24; CC&R Section 4.06 Utility Easements",
    quote: "Garbage can enclosures shall be comprised of an installed or securely anchored wood or reinforced white vinyl/PVC lattice screen(s) no taller than 4 1/2 feet. Garbage/trash can area screens, shall be of a width to completely hide garbage cans and its contents from the street.",
    concerns: [
      "Curb appeal and consistent screening",
      "Sightlines from front and corner lots",
      "Placement in drainage or utility easements",
      "Access for service, maintenance, and utilities",
    ],
    notes: "Possible prompts if needed: Should future enclosures fully block street view from multiple angles? Should vinyl/PVC become the clearer standard? How should easement placement be checked before approval?"
  },
  {
    name: "Fire Safe Community",
    time: "8 min",
    source: "CC&R Section 7.20 Storage or Use of Open-Flame Devices",
    quote: "Owners, and their residents, tenants, and guests, shall at all times be in compliance with the Fire Code of the North Carolina State Building Code.",
    concerns: ["Safe placement of grills and fire pits", "Open flames near homes, fences, and common areas", "Dry-season reminders", "Insurance and neighboring-property concerns"],
    notes: "Possible prompts if needed: Would clearer reminders help? Should open flames near homes, fences, or common areas receive additional guidance?"
  },
  {
    name: "Drainage Easements",
    time: "9 min",
    source: "CC&R drainage/easement language; ARC Guidelines D.3 Fine Grading and Mounding",
    quote: "No building or other structure shall be placed or permitted to remain on any Lot which may damage or interfere with the use, maintenance, repair, accessibility, or replacement of such drainage facilities and appurtenances.",
    concerns: ["Stormwater flow between lots", "Utility and maintenance access", "Landscaping, grading, and mounding impacts", "Documentation needed before approval"],
    notes: "Possible prompts if needed: Which projects create the biggest drainage concerns? Should drainage-impacting work require extra documentation or survey information?"
  },
  {
    name: "Aesthetic Preferences",
    time: "8 min",
    source: "ARC Guidelines C.1 General Principles; C.13 Gutters and Downspouts",
    quote: "The Guidelines promote those qualities in Umstead Grove that enhance the attractiveness and functional utility of the community. Gutters and downspouts require the prior written approval of the Committee and will be considered if the finish matches the color of the dwelling unit.",
    concerns: ["Community vision and aesthetic direction", "Color matching and visible exterior items", "Neighbor input during review", "Consistency without overcorrecting"],
    notes: "Possible prompts if needed: What aesthetic direction do homeowners want for the community? When should nearby neighbor feedback be considered?"
  },
  {
    name: "Approval for Softscaping",
    time: "9 min",
    source: "ARC Guidelines A.1 Design Review Process; D.1 Landscaping",
    quote: "Soft-scaping is defined as gardening, planting flowers, shrubs, trees, decorative edging and other natural decorative elements do not require ARC approval.",
    concerns: ["Current exemption vs. possible clarification", "Drainage, easement, and visibility impacts", "Tree removal and replacement expectations", "Examples that help homeowners self-select"],
    notes: "Possible prompts if needed: Should any softscaping require approval if it affects drainage, easements, or visibility? What examples would make the rule easier to understand?"
  },
];

function topicSlide(t, n, slideNo) {
  const s = pptx.addSlide();
  addBg(s);
  title(s, `Topic ${n}`, t.name, t.time);
  s.addText("Governing language", { x: 0.78, y: 1.88, w: 4.9, h: 0.3, fontFace: "Aptos", fontSize: 15, bold: true, color: C.green });
  s.addText(`"${t.quote}"`, { x: 0.78, y: 2.35, w: 5.9, h: 3.2, fontFace: "Aptos", fontSize: 20.5, color: C.ink, margin: 0.02, fit: "shrink", breakLine: false, valign: "mid" });
  s.addShape(pptx.ShapeType.line, { x: 6.95, y: 1.95, w: 0, h: 4.1, line: { color: C.line, width: 1.1 } });
  s.addText("Concerns to discuss", { x: 7.42, y: 1.88, w: 4.5, h: 0.3, fontFace: "Aptos", fontSize: 15, bold: true, color: C.green });
  bulletList(s, t.concerns, 7.46, 2.44, 4.7, 20.5, C.ink, 0.66);
  s.addText(`Source: ${t.source}`, { x: 0.78, y: 6.25, w: 11.45, h: 0.34, fontFace: "Aptos", fontSize: 12.5, color: C.muted, italic: true, fit: "shrink" });
  addFooter(s, "Questions removed from slide content and retained as optional facilitator notes.", slideNo);
  s.addNotes(`${t.name}. ${t.notes}`);
}

function trashDiscussionSlide(slideNo) {
  const s = pptx.addSlide();
  addBg(s);
  title(s, "Trash Enclosures", "Additional discussion points", "These points carry forward the fuller trash enclosure conversation from the earlier draft.");
  s.addText("Screening standards", { x: 0.78, y: 1.9, w: 4.2, h: 0.3, fontFace: "Aptos", fontSize: 15, bold: true, color: C.green });
  bulletList(s, [
    "Should future enclosures fully screen cans from street view from multiple angles?",
    "Should corner lots have clearer front and side sightline expectations?",
    "Should vinyl/PVC-style enclosures become the clearer standard moving forward?",
    "Should alternative wood or lattice styles remain available if they screen effectively?",
    "How should prior single-panel approvals be handled going forward?",
  ], 0.84, 2.38, 5.55, 16.5, C.ink, 0.58);

  s.addShape(pptx.ShapeType.line, { x: 6.8, y: 1.95, w: 0, h: 4.2, line: { color: C.line, width: 1.1 } });
  s.addText("Placement and flexibility", { x: 7.25, y: 1.9, w: 4.2, h: 0.3, fontFace: "Aptos", fontSize: 15, bold: true, color: C.green });
  bulletList(s, [
    "Confirm drainage, utility, and access easements before approval.",
    "Avoid blocking utility service or future maintenance access.",
    "Recognize that cans may still be stored in garages or behind homes.",
    "Balance consistency, appearance, cost, and practical homeowner options.",
  ], 7.31, 2.38, 4.65, 16.5, C.ink, 0.64);

  s.addText("Goal: gather homeowner feedback before deciding whether clearer standards should be drafted.", {
    x: 0.84,
    y: 6.18,
    w: 10.8,
    h: 0.34,
    fontFace: "Aptos",
    fontSize: 15.5,
    bold: true,
    color: C.rust,
    fit: "shrink",
  });
  addFooter(s, "Trash enclosure prompts carried forward from the previous presentation draft.", slideNo);
  s.addNotes("Use this slide to discuss the fuller trash enclosure points from the previous deck: full screening from street view, corner-lot sightlines, prior single-panel approvals, vinyl/PVC consistency, alternative styles, garage/behind-home storage, and easement/access concerns.");
}

function thankYou(slideNo) {
  const s = pptx.addSlide();
  addBg(s);
  title(s, "Thank you", "Helping reviews move smoothly", "Complete information and realistic planning help the volunteer review process work better for everyone.");
  const items = [
    ["Volunteer service", "ACC members serve the community in a volunteer role; patience and complete information help reviews stay fair."],
    ["Submit a complete package", "Include surveys, dimensions, colors, photos, material samples, plot plans, contractor information, and required support."],
    ["Plan around the timeline", "The governing documents allow up to 45 days for review of complete applications; complex requests may need clarification."],
    ["Wait for written approval", "Please wait for formal written approval before scheduling contractors, ordering materials, or beginning work."],
  ];
  items.forEach((it, i) => {
    const x = i % 2 === 0 ? 0.85 : 6.65;
    const y = i < 2 ? 2.05 : 4.05;
    s.addText(it[0], { x, y, w: 4.9, h: 0.32, fontFace: "Aptos", fontSize: 18, color: C.green, bold: true });
    s.addText(it[1], { x, y: y + 0.48, w: 4.95, h: 0.82, fontFace: "Aptos", fontSize: 15.5, color: C.ink, fit: "shrink", breakLine: false });
  });
  s.addShape(pptx.ShapeType.roundRect, { x: 0.85, y: 6.05, w: 11.1, h: 0.52, rectRadius: 0.05, fill: { color: C.sage }, line: { color: C.sage } });
  s.addText("ACC email: umsteadgroveacc@gmail.com", { x: 1.12, y: 6.18, w: 5.4, h: 0.22, fontFace: "Aptos", fontSize: 15.5, color: C.green, bold: true });
  s.addText("For ARC questions, applications, and follow-up documentation.", { x: 6.55, y: 6.18, w: 4.9, h: 0.22, fontFace: "Aptos", fontSize: 12.5, color: C.ink });
  addFooter(s, "Closing reminder for homeowners.", slideNo);
  s.addNotes("Thank everyone for participating. Remind homeowners that the ACC email is available for questions, applications, and follow-up documentation.");
}

cover();
roleSlide();
agendaSlide();
structureSlide();
topics.forEach((topic, i) => {
  if (i === 0) {
    topicSlide(topic, i + 1, 5);
    trashDiscussionSlide(6);
  } else {
    topicSlide(topic, i + 1, i + 6);
  }
});
thankYou(topics.length + 6);

pptx.writeFile({ fileName: OUT });
console.log(OUT);
