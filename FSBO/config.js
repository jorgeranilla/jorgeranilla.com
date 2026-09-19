/**
 * UMSTEAD GROVE FSBO — SITE CONFIGURATION
 * =========================================
 * Edit this file to update property details, seller contact info,
 * and site copy across the static page.
 *
 * Instructions:
 *  1. Fill in all [PLACEHOLDER] values before going live.
 *  2. Replace the photo paths with your actual property photos.
 *  3. Set seller contact details.
 *  4. Adjust PROPERTY details to match your home's actual specs.
 */

const SITE_CONFIG = {

  // ─── PROPERTY ────────────────────────────────────────────────────────────────
  property: {
    address:      "1008 Umstead Grove Way",
    city:         "Durham",
    state:        "NC",
    zip:          "27712",
    price:        "$531,330",
    priceShort:   "$531.3K",
    sellerConcession: "$10,000 toward buyer's closing costs",
    beds:         "5",
    baths:        "3",
    sqft:         "2,670",
    lotSize:      "Fenced",
    yearBuilt:    "2024",
    garage:       "2-car attached",
    style:        "Floor plan",
    county:       "Durham",
    subdivision:  "Umstead Grove",
    parcelId:     "[PARCEL ID PLACEHOLDER]",
    taxYear:      "2024",
    annualTaxes:  "[ANNUAL TAX AMOUNT]",           // e.g. "$5,840"
    schoolDistrict: "Durham Public Schools",
    elementarySchool: "Easley Elementary nearby; buyers should verify assignment",
    middleSchool:    "",
    highSchool:      "",
    mlsDisclaimer: "This is a For Sale By Owner listing. No MLS number.",
  },

  // ─── HOA ─────────────────────────────────────────────────────────────────────
  hoa: {
    hasHoa: true,
    hoaName:          "Umstead Grove HOA",
    monthlyFee:       "$94/month",
    annualFee:        "$1,128/year",
    managementCo:     "CAMS – Community Association Management Services",
    managementPhone:  "[HOA Phone]",
    managementEmail:  "[HOA Email]",
    includes:         ["Common area maintenance", "Neighborhood greenway access", "Street lighting"],
    restrictions:     "[Contact seller for full HOA documents and CC&Rs]",
    documents:        "[Available upon request]",
  },

  // ─── HIGHLIGHTS ──────────────────────────────────────────────────────────────
  highlights: [
    { icon: "🛏️", title: "Main-Level Bedroom", desc: "A rare first-floor bedroom gives the home real flexibility for guests, multigenerational living, a quiet office, or anyone who wants fewer stairs in daily life." },
    { icon: "🍳", title: "Gourmet Kitchen + Appliances", desc: "Slate cabinetry, ice white quartz countertops, under-cabinet LED lighting, stainless appliances, a large island, refrigerator, stove, washer, and dryer are all part of the package." },
    { icon: "🌱", title: "Spray Foam Insulation", desc: "Built with spray foam insulation for a tighter, more comfortable home than traditional fiberglass insulation, helping reduce drafts, air leakage, and energy waste." },
    { icon: "🌿", title: "Covered Patio & Private Yard", desc: "The covered patio has been enhanced with expanded outdoor living, screened coverage, and a full vinyl privacy fence." },
    { icon: "🏋️", title: "Finished Garage + Home Gym", desc: "The attached garage has been professionally finished and painted, and a dedicated home gym setup is included with the sale." },
    { icon: "🧺", title: "Functional Laundry + Drop Zone", desc: "Laundry has been upgraded with a utility sink, added wire storage, wood shelving, a hanging rack, and basket space. A garage-entry drop zone adds hooks, bench seating, and shoe storage for everyday organization." },
    { icon: "🌀", title: "Remote-Control Ceiling Fans", desc: "Modern ceiling fans with remote controls are installed in the bedrooms, family room, and loft for comfort and easy day-to-day use." },
    { icon: "📍", title: "School + North Durham Convenience", desc: "Close to Easley Elementary School (~1.1 mi / ~4 min), Publix at Latta Park, Costco, Eno River access, Duke, Downtown Durham, RTP, RDU, and the planned Target-anchored redevelopment at the former Northgate Mall." },
  ],

  ownerUpgrades: {
    total: "$26,600",
    items: [
      { label: "Full vinyl privacy fence", value: "$7,000" },
      { label: "Patio enclosure with rails", value: "$6,000" },
      { label: "Extended concrete patio", value: "$6,000" },
      { label: "Trash enclosure with concrete pad", value: "$1,200" },
      { label: "Mesh gutter guards", value: "$3,000" },
      { label: "Functional laundry with utility sink, hanging rack, and added storage", value: "$1,800" },
      { label: "Modern remote-control ceiling fans in bedrooms, family room, and loft", value: "$900" },
      { label: "Garage-entry drop zone with hooks, bench, and shoe storage", value: "$400" },
      { label: "Under-cabinet LED lighting", value: "$300" },
    ],
    note: "Approximate seller-paid upgrade values; buyer should verify condition and scope during due diligence.",
  },
  // ─── SELLER CONCESSION (shown in hero & FAQ) ─────────────────────────────────
  marketComparison: {
    updated: "May 19, 2026",
    intro: "Several other 2024 homes are on the market in this intimate 50-home community. This home is positioned to stand out on usable layout, livable square footage, and first-floor flexibility.",
    subject: {
      label: "This home",
      price: "$531,330",
      beds: "5",
      baths: "3",
      sqft: "2,670",
      pricePerSqft: "$199",
      mainLevelBedroom: "Yes",
      note: "Main-level bedroom, spray foam insulation, remote-control ceiling fans, functional laundry, home gym, finished garage, extended patio, privacy fence, seller concession, and approximately $26,600 in owner upgrades.",
    },
    comps: [
      {
        label: "3000 Farndale Trce",
        price: "$525,000",
        beds: "4",
        baths: "2.5",
        sqft: "2,366",
        pricePerSqft: "$222",
        mainLevelBedroom: "No",
      },
      {
        label: "1113 Umstead Grove Way",
        price: "$515,000",
        beds: "4",
        baths: "2.5",
        sqft: "2,569",
        pricePerSqft: "$200",
        mainLevelBedroom: "No",
      },
      {
        label: "1105 Umstead Grove Way",
        price: "$535,000",
        beds: "5",
        baths: "3.5",
        sqft: "3,355",
        pricePerSqft: "$159",
        mainLevelBedroom: "Yes",
      },
    ],
    takeaways: [
      "Priced around $199 per square foot while offering more space than two nearby active 2024 listings.",
      "Includes a rare main-level bedroom for guests, multigenerational needs, or a private office.",
      "Includes approximately $26,600 in seller-paid outdoor, kitchen, laundry, comfort, and organization upgrades, plus a finished garage and included home gym.",
    ],
    disclaimer: "Nearby listings and pricing change frequently. Buyer should verify current MLS details, measurements, and availability.",
  },

  sellerConcession: {
    offer:  "$10,000 toward buyer's closing costs",
    detail: "Seller is offering $10,000 toward the buyer's closing costs, making it easier to get into this home with less out-of-pocket at settlement. Ask for details when submitting your inquiry.",
  },

  // ─── GALLERY ─────────────────────────────────────────────────────────────────
  gallery: [
    { src: "images/exterior-front.jpg", alt: "Exterior front view", caption: "Craftsman exterior · 2-car garage" },
    { src: "images/open-concept-kitchen-living.jpg", alt: "Open-concept kitchen and living area", caption: "Open-concept kitchen and living · Natural light" },
    { src: "images/kitchen-island.jpg", alt: "Gourmet kitchen with island", caption: "Kitchen · Slate cabinets · Quartz island · LED under-cabinet lighting" },
    { src: "images/dining-area-patio-view.jpg", alt: "Dining area with patio access", caption: "Dining area · Patio access · Tree views" },
    { src: "images/home-office.jpg", alt: "Home office", caption: "Home office · Bright work-from-home space" },
    { src: "images/main-level-bedroom.jpg", alt: "Main-level bedroom", caption: "Main-level bedroom · Flexible first-floor space" },
    { src: "images/upstairs-loft.jpg", alt: "Upstairs loft", caption: "Upstairs loft · Flexible living space" },
    { src: "images/owners-suite.jpg", alt: "Owner's suite", caption: "Owner's suite · Spacious retreat" },
    { src: "images/owners-bathroom.jpg", alt: "Owner's bathroom", caption: "Owner's bath · Double vanity · Walk-in shower" },
    { src: "images/bedroom-1.jpg", alt: "Bedroom 1", caption: "Bedroom 1 · Natural light" },
    { src: "images/bedroom-2.jpg", alt: "Bedroom 2", caption: "Bedroom 2 · Carpet flooring" },
    { src: "images/bedroom-3.jpg", alt: "Bedroom 3", caption: "Bedroom 3 · Secondary bedroom" },
  ],
  neighborhood: {
    description: "Umstead Grove is an intimate 50-home community surrounded by natural forests, with quick access to Easley Elementary School, everyday shopping, outdoor escapes, Downtown Durham dining, Duke, RTP, RDU, and planned retail growth near the former Northgate Mall.",
    nearbyPoints: [
      { name: "Publix at Latta Park",        distance: "~1 mi / ~3 min" },
      { name: "Easley Elementary School",    distance: "~1.1 mi / ~4 min" },
      { name: "Costco",                      distance: "within ~7 mi / ~12 min" },
      { name: "Eno River State Park access", distance: "~4 mi / ~8 min" },
      { name: "Duke University & Hospital",  distance: "within ~7 mi / ~12 min" },
      { name: "Downtown Durham",             distance: "~8 mi / ~15 min" },
      { name: "Former Northgate Mall Target redevelopment", distance: "~6 mi / planned" },
      { name: "RTP / RDU Airport",           distance: "~17 mi / ~20 min" },
    ],
    walkScore:    "[XX]",
    transitScore: "[XX]",
    bikeScore:    "[XX]",
    googleMapsEmbed: "https://www.google.com/maps?q=1008%20Umstead%20Grove%20Way%2C%20Durham%2C%20NC%2027712&output=embed",
    communityFacts: [
      { label: "Community", value: "Intimate 50-home neighborhood" },
      { label: "Nearby elementary", value: "Easley Elementary (~1.1 mi / ~4 min)" },
      { label: "School ranking", value: "Easley is one of the top-ranked elementary schools in Durham County; buyers should verify current rankings." },
      { label: "HOA", value: "CAMS – Community Association Management Services" },
      { label: "HOA dues", value: "$94/month" },
    ],
  },

  // ─── DISCLOSURES ─────────────────────────────────────────────────────────────
  disclosures: {
    availableItems: [
      "NC Residential Property Disclosure Statement (available upon request)",
      "Lead-Based Paint Disclosure (if applicable — home built after 1978, so N/A)",
      "HOA documents and CC&Rs (available upon request)",
      "Survey (available upon request)",
    ],
    notes: "Buyer's due diligence period will be negotiated in the purchase agreement. Seller makes no representations beyond the NC Disclosure Statement. All information is believed accurate but not guaranteed.",
  },

  // ─── FAQ ─────────────────────────────────────────────────────────────────────
  faq: [
    {
      q: "Is the seller offering closing cost assistance?",
      a: "The seller is including $10,000 toward the buyer's closing costs as part of the purchase agreement — a straightforward way to reduce what you bring to the table at closing."
    },
    {
      q: "Can I work with a buyer's agent?",
      a: "Absolutely — buyer's agents are welcome. Agents interested in scheduling a showing are invited to reach out to the seller directly to discuss terms. We're happy to work with your representation."
    },
    {
      q: "What improvements have been made to the home?",
      a: "The sellers have invested meaningfully in this home since purchase. Key upgrades include: a fully finished and freshly painted attached garage; a significantly extended back patio with a screened covered area; a full vinyl privacy fence enclosing the backyard; a purpose-built enclosed structure for garbage and recycling bins; mesh gutter guards; under-cabinet LED kitchen lighting; a functional laundry setup with utility sink, hanging rack, and added storage; modern remote-control ceiling fans in the bedrooms, family room, and loft; a garage-entry drop zone; and a dedicated home gym that conveys with the property. Total approximate upgrade value: $26,600."
    },
    {
      q: "Does the home gym convey with the sale?",
      a: "Yes — the home gym is included in the sale. Buyers enjoy a fully equipped workout space from day one, with no need to purchase or move gym equipment."
    },
    {
      q: "Is this home listed on the MLS?",
      a: "No — this is a direct For Sale By Owner listing. Buyer's agents are welcome. Reach out to the seller to discuss co-op terms."
    },
    {
      q: "Can I request a showing?",
      a: "Absolutely. Call or text Jorge directly at 864-625-6743 and the seller will confirm available times within 24 hours."
    },
    {
      q: "Do I need to be pre-approved to tour?",
      a: "Pre-approval is encouraged but not required to schedule a showing. Serious buyers should be prepared to provide a pre-approval letter prior to submitting an offer."
    },
    {
      q: "How do I submit an offer?",
      a: "Please work with your real estate attorney or buyer's agent to prepare a North Carolina Offer to Purchase and Contract (Standard Form 2-T). Completed offers may be sent directly to the seller via the email listed on this page."
    },
    {
      q: "Are there any known issues with the home?",
      a: "The NC Residential Property Disclosure Statement is available upon request. The home was built in 2024 and is under the builder's structural warranty. The seller encourages all buyers to conduct a thorough independent home inspection during the due diligence period."
    },
    {
      q: "What is included in the sale?",
      a: "Included: refrigerator, stove, washer, dryer, and the full home gym setup. Other items such as garage door openers, window treatments, and fixtures can be confirmed in the purchase agreement."
    },
    {
      q: "What makes the location stand out?",
      a: "Umstead Grove is an intimate 50-home community surrounded by natural forests, with quick access to Publix at Latta Park (~1 mi), Costco (~7 mi), Duke University & Hospital (~7 mi), Downtown Durham (~8 mi), Eno River State Park (~4 mi), and RTP/RDU Airport (~17–25 min). The former Northgate Mall site is also planned for a Target-anchored redevelopment."
    },
    {
      q: "When is the seller hoping to close?",
      a: "A 30–45 day close is preferred, but the seller is very flexible. If a buyer wishes to choose a longer closing period to lock in the best possible interest rate for their home, we are more than happy to accommodate and adjust the closing date accordingly."
    },
  ],

  // ─── SELLER / CONTACT ────────────────────────────────────────────────────────
  seller: {
    name:           "Jorge Ranilla",
    email:          "jorgeranilla@gmail.com",
    phone:          "864-625-6743",
    preferredContact: "phone",
  },

  // ─── SITE META ───────────────────────────────────────────────────────────────
  site: {
    title:       "Umstead Grove | $531,330 | Durham, NC | For Sale By Owner",
    description: "Move-in ready home for sale by owner in Durham, NC. Seller offering $10,000 toward closing costs. Features include spray foam insulation, functional laundry with utility sink, remote-control ceiling fans, under-cabinet LED lighting, home gym, finished garage, screened patio, and vinyl privacy fence. Call or text the seller to request a showing.",
    url:         "https://umsteadgrove.com",
    ogImage:     "https://umsteadgrove.com/images/exterior-front.jpg",
    themeColor:  "#1a3a2e",
    accentColor: "#c9a84c",
  },

};

// Export for use across scripts
if (typeof module !== "undefined") module.exports = SITE_CONFIG;
