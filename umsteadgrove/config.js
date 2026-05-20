/**
 * UMSTEAD GROVE FSBO — SITE CONFIGURATION
 * =========================================
 * Edit this file to update property details, seller contact info,
 * and site copy across all pages without touching HTML or backend code.
 *
 * Instructions:
 *  1. Fill in all [PLACEHOLDER] values before going live.
 *  2. Replace the photo paths with your actual property photos.
 *  3. Set SELLER_EMAIL to your real email address.
 *  4. Adjust PROPERTY details to match your home's actual specs.
 */

const SITE_CONFIG = {

  // ─── PROPERTY ────────────────────────────────────────────────────────────────
  property: {
    address:      "Umstead Grove",
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
    style:        "Chatham plan",
    county:       "Durham",
    subdivision:  "Umstead Grove",
    parcelId:     "[PARCEL ID PLACEHOLDER]",
    taxYear:      "2024",
    annualTaxes:  "[ANNUAL TAX AMOUNT]",           // e.g. "$5,840"
    schoolDistrict: "",
    elementarySchool: "",
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
    { icon: "🍳", title: "Gourmet Kitchen + Appliances", desc: "Slate cabinetry, ice white quartz countertops, stainless appliances, a large island, refrigerator, stove, washer, and dryer are all part of the package." },
    { icon: "🌱", title: "2024 Energy-Efficient Build", desc: "Built in 2024 with energy-efficient features designed for lower utility costs, better comfort, improved indoor air quality, and peace of mind." },
    { icon: "🌿", title: "Covered Patio & Private Yard", desc: "The covered patio has been enhanced with expanded outdoor living, screened coverage, and a full vinyl privacy fence." },
    { icon: "🏋️", title: "Finished Garage + Home Gym", desc: "The attached garage has been professionally finished and painted, and a dedicated home gym setup is included with the sale." },
    { icon: "📍", title: "North Durham Convenience", desc: "Close to Publix at Latta Park, Costco, Eno River access, Duke, Downtown Durham, RTP, RDU, and the planned Target-anchored redevelopment at the former Northgate Mall." },
  ],

  ownerUpgrades: {
    total: "$20,200",
    items: [
      { label: "Full vinyl privacy fence", value: "$7,000" },
      { label: "Patio enclosure with rails", value: "$6,000" },
      { label: "Extended concrete patio", value: "$6,000" },
      { label: "Trash enclosure with concrete pad", value: "$1,200" },
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
      note: "Main-level bedroom, home gym, finished garage, extended patio, privacy fence, seller concession, and approximately $20,200 in owner upgrades.",
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
      "Includes approximately $20,200 in seller-paid outdoor and utility upgrades, plus a finished garage and included home gym.",
    ],
    disclaimer: "Nearby listings and pricing change frequently. Buyer should verify current MLS details, measurements, and availability.",
  },

  sellerConcession: {
    offer:  "$10,000 toward buyer's closing costs",
    detail: "Seller is offering $10,000 toward the buyer's closing costs, making it easier to get into this home with less out-of-pocket at settlement. Ask for details when submitting your inquiry.",
  },

  // ─── GALLERY ─────────────────────────────────────────────────────────────────
  gallery: [
    { src: "house.png",       alt: "Exterior front view",     caption: "Craftsman exterior with covered porch" },
    { src: "living_room.png", alt: "Living room",             caption: "Open-concept living room with stone fireplace" },
    { src: "kitchen.png",     alt: "Chef's kitchen",          caption: "Chef's kitchen with quartz island" },
    { src: "bedroom.png",     alt: "Owner's suite",           caption: "Spacious owner's suite with tray ceiling" },
    { src: "bathroom.png",    alt: "Owner's bathroom",        caption: "Spa-like owner's bath" },
    { src: "backyard.png",    alt: "Backyard deck",           caption: "Private backyard with expanded deck" },
    // Add more: { src: "photo7.jpg", alt: "Description", caption: "Caption" }
  ],

  // ─── NEIGHBORHOOD ────────────────────────────────────────────────────────────
  neighborhood: {
    description: "Umstead Grove is an intimate 50-home community surrounded by natural forests, with quick access to everyday shopping, outdoor escapes, Downtown Durham dining, Duke, RTP, RDU, and planned retail growth near the former Northgate Mall.",
    nearbyPoints: [
      { name: "Publix at Latta Park",        distance: "~1 mi / ~3 min" },
      { name: "Costco",                      distance: "within ~7 mi / ~12 min" },
      { name: "Eno River State Park access", distance: "~4 mi / ~8 min" },
      { name: "Duke University & Hospital",  distance: "within ~7 mi / ~12 min" },
      { name: "Downtown Durham",             distance: "~8 mi / ~15 min" },
      { name: "Former Northgate Mall Target redevelopment", distance: "~6 mi / planned" },
      { name: "RTP / RDU Airport",           distance: "~17–25 min" },
    ],
    walkScore:    "[XX]",
    transitScore: "[XX]",
    bikeScore:    "[XX]",
    googleMapsEmbed: "https://www.google.com/maps?q=Umstead%20Grove%20Way%2C%20Durham%2C%20NC%2027712&output=embed",
    communityFacts: [
      { label: "Community", value: "Intimate 50-home neighborhood" },
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
      q: "Is the seller offering any closing cost assistance?",
      a: "Yes! The seller is offering $10,000 toward the buyer's closing costs. This can significantly reduce the amount you need to bring to closing and is a great opportunity for buyers looking to preserve cash after the purchase."
    },
    {
      q: "What improvements have been made to the home?",
      a: "The sellers have invested meaningfully in this home since purchase. Key upgrades include: a fully finished and freshly painted attached garage; a significantly extended back patio with a screened covered area; a full vinyl privacy fence enclosing the backyard; a purpose-built enclosed structure for garbage and recycling bins; and a dedicated home gym that conveys with the property."
    },
    {
      q: "Does the home gym convey with the sale?",
      a: "Yes — the home gym is included in the sale. Buyers enjoy a fully equipped workout space from day one, with no need to purchase or move gym equipment."
    },
    {
      q: "Is this home listed on the MLS?",
      a: "No. This is a direct For Sale By Owner listing. Buyer's agents are welcome and will be considered for a negotiated buyer's agent commission. Please inquire."
    },
    {
      q: "Is there a buyer's agent commission offered?",
      a: "The seller is open to discussing a buyer's agent commission. Please inquire via the contact form or email for current terms."
    },
    {
      q: "Can I request a showing?",
      a: "Absolutely. Use the form below to request a showing and we'll confirm available times within 24 hours."
    },
    {
      q: "Do I need to be pre-approved to tour the home?",
      a: "Pre-approval is encouraged but not required to schedule a showing. We do ask that serious buyers be prepared to provide a pre-approval letter prior to submitting an offer."
    },
    {
      q: "How do I submit an offer?",
      a: "Please work with your real estate attorney or agent to prepare a North Carolina Offer to Purchase and Contract (Standard Form 2-T). Completed offers may be sent directly to the seller via the email listed on this page."
    },
    {
      q: "Are there any known issues with the home?",
      a: "The NC Residential Property Disclosure Statement is available upon request. The seller encourages all buyers to conduct a thorough independent home inspection during the due diligence period."
    },
    {
      q: "What is included in the sale?",
      a: "The refrigerator, stove, washer, dryer, and dedicated home gym setup are included with the sale. Other inclusions such as garage door openers, window treatments, and related items can be confirmed in the purchase agreement."
    },
    {
      q: "What makes the location convenient?",
      a: "Umstead Grove gives you a quiet, intimate 50-home setting with quick access to everyday essentials and major Durham destinations. Publix at Latta Park recently opened nearby, and the former Northgate Mall site is planned for a Target-anchored redevelopment. Plans and tenant details can change, so buyers should verify current project status independently."
    },
    {
      q: "When is the seller hoping to close?",
      a: "The seller is flexible on closing timeline. A 30–45 day close is preferred, but terms are open to negotiation based on buyer needs."
    },
  ],

  // ─── SELLER / CONTACT ────────────────────────────────────────────────────────
  seller: {
    name:           "Jorge Ranilla",
    email:          "jorgeranilla@gmail.com",       // ← THIS IS USED IN ALL EMAILS
    phone:          "864-625-6743",
    preferredContact: "email",                  // "email" or "phone"
  },

  // ─── SITE META ───────────────────────────────────────────────────────────────
  site: {
    title:       "Umstead Grove | $549,900 | Durham, NC | For Sale By Owner",
    description: "Move-in ready home for sale by owner in Durham, NC. Seller offering $10,000 toward closing costs. Features include home gym, finished garage, screened patio, and vinyl privacy fence. Request a showing today.",
    url:         "https://jorgeranilla.com/umsteadgrove",
    ogImage:     "https://jorgeranilla.com/umsteadgrove/house.png",
    themeColor:  "#1a3a2e",
    accentColor: "#c9a84c",
  },

};

// Export for use across scripts
if (typeof module !== "undefined") module.exports = SITE_CONFIG;
