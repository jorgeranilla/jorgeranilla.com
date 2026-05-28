from pathlib import Path
import math
import shutil
import textwrap

from PIL import Image
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "FSBO"
ASSET_DIR = OUT_DIR / "_buyer_flyer_assets"
PDF_PATH = OUT_DIR / "Umstead-Grove-Buyer-Flyer.pdf"

PAGE_W, PAGE_H = letter

GREEN = colors.HexColor("#183a2e")
GREEN_2 = colors.HexColor("#204b3d")
GOLD = colors.HexColor("#c9a84c")
GOLD_2 = colors.HexColor("#dfc56d")
CREAM = colors.HexColor("#f7f2e8")
PAPER = colors.HexColor("#fffdf8")
INK = colors.HexColor("#17231e")
MUTED = colors.HexColor("#6f746f")
WHITE = colors.white
LINE = colors.HexColor("#e4dccb")


def register_fonts():
    candidates = {
        "Georgia": r"C:\Windows\Fonts\georgia.ttf",
        "Georgia-Bold": r"C:\Windows\Fonts\georgiab.ttf",
        "Arial": r"C:\Windows\Fonts\arial.ttf",
        "Arial-Bold": r"C:\Windows\Fonts\arialbd.ttf",
        "Arial-Black": r"C:\Windows\Fonts\ariblk.ttf",
    }
    for name, path in candidates.items():
        if Path(path).exists():
            pdfmetrics.registerFont(TTFont(name, path))


def clean_assets():
    if ASSET_DIR.exists():
        shutil.rmtree(ASSET_DIR)
    ASSET_DIR.mkdir(parents=True, exist_ok=True)


def crop_cover(src, width_px, height_px, name, anchor_y=0.48):
    """Create a cropped image that fills the target aspect ratio."""
    img = Image.open(src).convert("RGB")
    src_w, src_h = img.size
    target_ratio = width_px / height_px
    src_ratio = src_w / src_h
    if src_ratio > target_ratio:
        new_w = int(src_h * target_ratio)
        left = (src_w - new_w) // 2
        box = (left, 0, left + new_w, src_h)
    else:
        new_h = int(src_w / target_ratio)
        top = max(0, min(src_h - new_h, int((src_h - new_h) * anchor_y)))
        box = (0, top, src_w, top + new_h)
    img = img.crop(box).resize((width_px, height_px), Image.Resampling.LANCZOS)
    out = ASSET_DIR / name
    img.save(out, quality=92)
    return str(out)


def fit_image(src, max_w_px, max_h_px, name):
    img = Image.open(src).convert("RGB")
    img.thumbnail((max_w_px, max_h_px), Image.Resampling.LANCZOS)
    out = ASSET_DIR / name
    img.save(out, quality=92)
    return str(out)


def rounded_rect(c, x, y, w, h, r, fill, stroke=None, stroke_width=1):
    c.setFillColor(fill)
    if stroke:
        c.setStrokeColor(stroke)
        c.setLineWidth(stroke_width)
    else:
        c.setStrokeColor(fill)
        c.setLineWidth(0)
    c.roundRect(x, y, w, h, r, fill=1, stroke=1 if stroke else 0)


def draw_para(c, text, x, y_top, w, h, style):
    p = Paragraph(text, style)
    p.wrapOn(c, w, h)
    p.drawOn(c, x, y_top - p.height)
    return p.height


def style(name, font="Arial", size=10, leading=None, color=INK, align=TA_LEFT, **kw):
    return ParagraphStyle(
        name,
        fontName=font,
        fontSize=size,
        leading=leading or size * 1.25,
        textColor=color,
        alignment=align,
        spaceAfter=0,
        **kw,
    )


S_BODY = style("body", size=9.2, leading=12.4, color=INK)
S_SMALL = style("small", size=7.5, leading=9.4, color=MUTED)
S_CARD = style("card", size=8.6, leading=11.2, color=INK)
S_WHITE = style("white", size=9, leading=11.5, color=WHITE)
S_WHITE_SMALL = style("whiteSmall", size=7.2, leading=9, color=colors.HexColor("#edf3ef"))
S_H2 = style("h2", font="Georgia-Bold", size=23, leading=27, color=GREEN)
S_H3 = style("h3", font="Arial-Bold", size=11, leading=13.5, color=GREEN)
S_CENTER = style("center", font="Arial-Bold", size=9, leading=11.5, color=GREEN, align=TA_CENTER)


PROPERTY = {
    "title": "UmsteadGrove.com",
    "address": "1008 Umstead Grove Way, Durham, NC 27712",
    "price": "$531,330",
    "phone": "864-625-6743",
    "email": "jorgeranilla@gmail.com",
    "website": "umsteadgrove.com",
    "stats": [
        ("4", "Beds"),
        ("3", "Baths"),
        ("2,670", "Sq Ft"),
        ("2024", "Built"),
        ("2-car", "Garage"),
    ],
    "hero": "Move-in ready 2024 home in an intimate North Durham community, with 4 bedrooms, flexible main-level space, a loft, private fenced yard, and meaningful owner upgrades already completed.",
}


UPGRADES = [
    ("Private fenced yard", "Full vinyl privacy fence enclosing the backyard.", "$7,000"),
    ("Outdoor living", "Expanded concrete patio plus patio enclosure with rails.", "$12,000"),
    ("Everyday utility", "Trash enclosure, concrete pad, mesh gutter guards.", "$4,200"),
    ("Laundry + drop zone", "Utility sink, hanging rack, added storage, hooks, bench, shoe storage.", "$2,200"),
    ("Comfort + lighting", "Remote-control ceiling fans and under-cabinet LED kitchen lighting.", "$1,200"),
]


HIGHLIGHTS = [
    ("Main-level flex space", "Great for guests, multigenerational needs, a quiet office, or anyone who prefers fewer stairs."),
    ("Gourmet kitchen", "Slate cabinetry, ice white quartz counters, large island, stainless appliances, and LED under-cabinet lighting."),
    ("Energy-efficient 2024 build", "Spray foam insulation, tankless gas water heater, smart-home features, and modern systems."),
    ("Finished garage + gym", "Professionally finished garage and a dedicated home gym setup that conveys with the sale."),
    ("Private outdoor space", "Covered patio, screened/enclosed area, expanded hardscape, and full privacy fence."),
    ("Buyer-friendly FSBO", "Buyer agents welcome; seller-paid concessions available. Contact owner directly for details."),
]


NEARBY = [
    ("Publix at Latta Park", "~1 mi / ~3 min"),
    ("Easley Elementary", "~1.1 mi / ~4 min"),
    ("Eno River access", "~4 mi / ~8 min"),
    ("Duke University & Hospital", "~7 mi / ~12 min"),
    ("Downtown Durham", "~8 mi / ~15 min"),
    ("RTP / RDU Airport", "~17 mi / ~20 min"),
    ("Costco", "within ~7 mi / ~12 min"),
    ("Planned Target redevelopment", "~6 mi / planned"),
]


COMPS = [
    ("This home", "$531,330", "4 / 3", "2,670", "$199", "Yes"),
    ("3000 Farndale Trce", "$525,000", "4 / 2.5", "2,366", "$222", "No"),
    ("1113 Umstead Grove Way", "$515,000", "4 / 2.5", "2,569", "$200", "No"),
    ("1105 Umstead Grove Way", "$535,000", "5 / 3.5", "3,355", "$159", "Yes"),
]


def draw_page_base(c, page_no, title=None):
    c.setFillColor(PAPER)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(GREEN)
    c.rect(0, PAGE_H - 18, PAGE_W, 18, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, PAGE_H - 20, PAGE_W, 2, fill=1, stroke=0)
    c.setFillColor(GREEN)
    c.rect(0, 0, PAGE_W, 30, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("Georgia-Bold", 9)
    c.drawString(36, 11, "UmsteadGrove.com")
    c.setFillColor(colors.HexColor("#e8efe9"))
    c.setFont("Arial", 7.5)
    c.drawCentredString(PAGE_W / 2, 11, PROPERTY["address"])
    c.drawRightString(PAGE_W - 36, 11, f"{page_no}")
    if title:
        c.setFont("Georgia-Bold", 22)
        c.setFillColor(GREEN)
        c.drawString(44, PAGE_H - 58, title)
        c.setStrokeColor(GOLD)
        c.setLineWidth(1.2)
        c.line(44, PAGE_H - 67, PAGE_W - 44, PAGE_H - 67)


def draw_metric_card(c, x, y, w, h, value, label, fill=WHITE):
    rounded_rect(c, x, y, w, h, 10, fill, LINE, 0.8)
    c.setFillColor(GREEN)
    c.setFont("Arial-Black", 17)
    c.drawCentredString(x + w / 2, y + h - 28, value)
    c.setFillColor(MUTED)
    c.setFont("Arial-Bold", 7.5)
    c.drawCentredString(x + w / 2, y + 13, label.upper())


def cover_page(c, assets):
    c.setFillColor(GREEN)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.drawImage(assets["exterior_cover"], 0, 265, PAGE_W, 527, mask="auto")
    c.setFillColor(colors.Color(0, 0, 0, alpha=0.38))
    c.rect(0, 265, PAGE_W, 527, fill=1, stroke=0)
    c.setFillColor(colors.Color(24 / 255, 58 / 255, 46 / 255, alpha=0.96))
    c.rect(0, 0, PAGE_W, 310, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, 307, PAGE_W, 4, fill=1, stroke=0)

    c.setFillColor(GOLD_2)
    c.setFont("Georgia-Bold", 18)
    c.drawCentredString(PAGE_W / 2, 735, "SERIOUS BUYER INFORMATION PACKET")
    c.setFillColor(WHITE)
    c.setFont("Georgia-Bold", 54)
    c.drawCentredString(PAGE_W / 2, 665, PROPERTY["title"])
    c.setFont("Arial-Bold", 14)
    c.drawCentredString(PAGE_W / 2, 631, PROPERTY["address"])

    c.setFont("Arial-Black", 42)
    c.setFillColor(GOLD_2)
    c.drawString(44, 224, PROPERTY["price"])
    c.setFillColor(colors.HexColor("#e8efe9"))
    c.setFont("Arial-Bold", 11)
    c.drawString(48, 205, "For Sale By Owner | Buyer Agents Welcome")
    c.setFont("Arial", 9.5)
    draw_para(c, PROPERTY["hero"], 48, 184, 332, 58, S_WHITE)

    x0, y0 = 48, 86
    card_w = 61
    for i, (value, label) in enumerate(PROPERTY["stats"]):
        draw_metric_card(c, x0 + i * (card_w + 8), y0, card_w, 62, value, label, colors.HexColor("#fffaf0"))

    rounded_rect(c, 424, 78, 132, 158, 14, WHITE, GOLD, 2)
    c.drawImage(str(ROOT / "FSBO" / "qr-code.png"), 442, 105, 96, 96, mask="auto")
    c.setFillColor(GREEN)
    c.setFont("Arial-Bold", 9.5)
    c.drawCentredString(490, 91, "Scan for photos")
    c.setFillColor(WHITE)
    c.setFont("Arial-Bold", 13)
    c.drawCentredString(PAGE_W / 2, 42, f"{PROPERTY['phone']}  |  {PROPERTY['email']}")


def overview_page(c, assets):
    draw_page_base(c, 2, "Why This Home Stands Out")
    c.drawImage(assets["kitchen"], 44, 424, 249, 205, mask="auto")
    c.drawImage(assets["living"], 319, 424, 249, 205, mask="auto")
    c.setFillColor(CREAM)
    c.rect(44, 398, 524, 30, fill=1, stroke=0)
    draw_para(
        c,
        "Builder/floor-plan imagery shown for layout and finish reference; exterior and in-person condition should be verified during showing.",
        58,
        418,
        496,
        18,
        S_SMALL,
    )

    y = 355
    for idx, (heading, body) in enumerate(HIGHLIGHTS):
        col = idx % 2
        row = idx // 2
        x = 44 + col * 274
        yy = y - row * 91
        rounded_rect(c, x, yy, 250, 72, 10, WHITE, LINE, 0.8)
        c.setFillColor(GOLD)
        c.circle(x + 19, yy + 50, 5, fill=1, stroke=0)
        c.setFillColor(GREEN)
        c.setFont("Arial-Bold", 10.5)
        c.drawString(x + 34, yy + 46, heading)
        draw_para(c, body, x + 34, yy + 34, 200, 38, S_CARD)

    rounded_rect(c, 44, 62, 524, 74, 12, GREEN, None)
    c.setFillColor(GOLD_2)
    c.setFont("Georgia-Bold", 15)
    c.drawString(66, 110, "Bottom line")
    draw_para(
        c,
        "A newer 4-bedroom home with the flexibility buyers usually want after closing: private outdoor living, appliance package, functional storage, comfort upgrades, and useful first-floor flex space already in place.",
        66,
        96,
        462,
        42,
        S_WHITE,
    )


def upgrades_page(c):
    draw_page_base(c, 3, "Owner Upgrades Included")
    rounded_rect(c, 44, 602, 524, 85, 14, GREEN, None)
    c.setFillColor(GOLD_2)
    c.setFont("Arial-Black", 32)
    c.drawString(66, 635, "$26,600")
    c.setFillColor(WHITE)
    c.setFont("Arial-Bold", 13)
    c.drawString(246, 652, "Approximate seller-paid upgrades")
    draw_para(
        c,
        "Meaningful improvements completed after purchase, so buyers can enjoy upgraded outdoor living, daily function, and comfort from day one.",
        246,
        635,
        288,
        36,
        S_WHITE_SMALL,
    )

    y = 530
    for i, (heading, body, value) in enumerate(UPGRADES):
        rounded_rect(c, 44, y - i * 84, 524, 62, 10, WHITE, LINE, 0.8)
        c.setFillColor(GOLD)
        c.setFont("Arial-Black", 17)
        c.drawRightString(548, y - i * 84 + 22, value)
        c.setFillColor(GREEN)
        c.setFont("Arial-Bold", 12)
        c.drawString(66, y - i * 84 + 35, heading)
        draw_para(c, body, 66, y - i * 84 + 21, 350, 22, S_CARD)

    rounded_rect(c, 44, 76, 524, 72, 12, CREAM, GOLD, 1.2)
    c.setFillColor(GREEN)
    c.setFont("Arial-Bold", 12)
    c.drawString(66, 122, "Also included")
    draw_para(
        c,
        "Refrigerator, stove, washer, dryer, and the full home gym setup. Seller-paid concessions are available; call owner directly for details.",
        66,
        108,
        462,
        36,
        S_BODY,
    )


def market_page(c):
    draw_page_base(c, 4, "Pricing & Market Context")
    draw_para(
        c,
        "The original realtor report was prepared to help price the home. For buyers, the useful takeaway is simple: the current asking price sits inside multiple value signals while offering a 2024 build, 4 bedrooms, flexible living space, and owner-paid upgrades.",
        44,
        690,
        524,
        46,
        S_BODY,
    )

    rounded_rect(c, 44, 588, 252, 70, 12, GREEN, None)
    c.setFillColor(GOLD_2)
    c.setFont("Arial-Black", 25)
    c.drawCentredString(170, 620, "$531,330")
    c.setFillColor(WHITE)
    c.setFont("Arial-Bold", 9)
    c.drawCentredString(170, 602, "CURRENT ASKING PRICE")

    rounded_rect(c, 316, 588, 252, 70, 12, CREAM, GOLD, 1.2)
    c.setFillColor(GREEN)
    c.setFont("Arial-Black", 24)
    c.drawCentredString(442, 620, "$199 / sq ft")
    c.setFont("Arial-Bold", 9)
    c.drawCentredString(442, 602, "BASED ON 2,670 SQ FT")

    # Range bar
    c.setFillColor(GREEN)
    c.setFont("Arial-Bold", 12)
    c.drawString(44, 545, "Realtor market range from report")
    bar_x, bar_y, bar_w, bar_h = 64, 503, 484, 18
    c.setStrokeColor(LINE)
    c.setLineWidth(1)
    c.roundRect(bar_x, bar_y, bar_w, bar_h, 9, fill=0, stroke=1)
    c.setFillColor(GOLD)
    c.roundRect(bar_x, bar_y, bar_w, bar_h, 9, fill=1, stroke=0)
    labels = [("$488K", bar_x), ("$520K", bar_x + bar_w * 0.485), ("$554K", bar_x + bar_w)]
    c.setFillColor(GREEN)
    c.setFont("Arial-Bold", 9)
    for label, x in labels:
        c.drawCentredString(x, bar_y - 17, label)
    price_x = bar_x + bar_w * ((531.33 - 488) / (554 - 488))
    c.setFillColor(GREEN)
    c.circle(price_x, bar_y + bar_h / 2, 8, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Arial-Bold", 6.5)
    c.drawCentredString(price_x, bar_y + 6, "LIST")

    sources = [
        ("Black Knight estimate", "$544K", "Range: $522.2K - $565.8K"),
        ("Redfin range signal", "$536.4K", "From original report summary"),
        ("DASH CMA range", "$518.9K", "Range: $486.8K - $553.2K"),
        ("Closed comp average", "$551.3K", "Avg. sold price, 3 selected comps"),
    ]
    for i, (label, value, note) in enumerate(sources):
        x = 44 + (i % 2) * 274
        y = 407 - (i // 2) * 86
        rounded_rect(c, x, y, 250, 64, 10, WHITE, LINE, 0.8)
        c.setFillColor(GREEN)
        c.setFont("Arial-Bold", 10)
        c.drawString(x + 18, y + 42, label)
        c.setFillColor(GOLD)
        c.setFont("Arial-Black", 20)
        c.drawString(x + 18, y + 16, value)
        draw_para(c, note, x + 108, y + 33, 120, 24, S_SMALL)

    c.setFillColor(GREEN)
    c.setFont("Arial-Bold", 12)
    c.drawString(44, 250, "Active neighborhood comparison")
    headers = ["Property", "Price", "Beds/Baths", "Sq Ft", "$/Sq Ft", "Main Flex"]
    widths = [160, 78, 74, 60, 66, 62]
    x0, y0 = 44, 219
    c.setFillColor(GREEN)
    c.rect(x0, y0, sum(widths), 24, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Arial-Bold", 7.5)
    x = x0
    for h, w in zip(headers, widths):
        c.drawCentredString(x + w / 2, y0 + 8, h)
        x += w
    y = y0 - 25
    for r, row in enumerate(COMPS):
        c.setFillColor(CREAM if r == 0 else WHITE)
        c.rect(x0, y, sum(widths), 25, fill=1, stroke=0)
        c.setStrokeColor(LINE)
        c.line(x0, y, x0 + sum(widths), y)
        x = x0
        c.setFillColor(GREEN if r == 0 else INK)
        c.setFont("Arial-Bold" if r == 0 else "Arial", 7.6)
        for val, w in zip(row, widths):
            c.drawCentredString(x + w / 2, y + 8, val)
            x += w
        y -= 25

    draw_para(
        c,
        "Market data changes quickly and is not an appraisal. Buyer should independently verify comparable sales, measurements, schools, HOA, taxes, and all property condition details during due diligence.",
        44,
        82,
        524,
        24,
        S_SMALL,
    )


def location_page(c, assets):
    draw_page_base(c, 5, "Location, Layout & Daily Life")
    c.drawImage(assets["lot"], 44, 470, 250, 147, mask="auto")
    c.drawImage(assets["floor"], 318, 470, 250, 147, mask="auto")
    c.setFillColor(CREAM)
    c.rect(44, 446, 524, 28, fill=1, stroke=0)
    draw_para(c, "Lot and floor plan references for buyer orientation; all dimensions and assignments should be verified.", 58, 465, 496, 16, S_SMALL)

    draw_para(
        c,
        "Umstead Grove is a small 50-home community surrounded by natural forest, with quick access to everyday shopping, parks, Duke, Downtown Durham, RTP, and RDU.",
        44,
        410,
        524,
        40,
        S_BODY,
    )

    for i, (place, distance) in enumerate(NEARBY):
        x = 44 + (i % 2) * 274
        y = 347 - (i // 2) * 56
        rounded_rect(c, x, y, 250, 40, 9, WHITE, LINE, 0.8)
        c.setFillColor(GOLD)
        c.circle(x + 17, y + 22, 4, fill=1, stroke=0)
        c.setFillColor(GREEN)
        c.setFont("Arial-Bold", 8.8)
        c.drawString(x + 31, y + 24, place)
        c.setFillColor(MUTED)
        c.setFont("Arial", 8)
        c.drawString(x + 31, y + 11, distance)

    rounded_rect(c, 44, 84, 524, 76, 12, GREEN, None)
    c.setFillColor(GOLD_2)
    c.setFont("Georgia-Bold", 15)
    c.drawString(66, 132, "Buyer notes")
    draw_para(
        c,
        "HOA is listed at approximately $94/month. Property report notes minimal flood hazard zone X and no foreclosure history. School proximity includes Easley Elementary, Carrington Middle, and Riverside High; buyer should verify assignment and ratings.",
        66,
        118,
        462,
        42,
        S_WHITE_SMALL,
    )


def next_steps_page(c, assets):
    draw_page_base(c, 6, "Ready for a Serious Look?")
    c.drawImage(assets["patio"], 44, 462, 250, 160, mask="auto")
    c.drawImage(assets["suite"], 318, 462, 250, 160, mask="auto")

    rounded_rect(c, 44, 350, 250, 78, 12, WHITE, LINE, 0.8)
    c.setFillColor(GREEN)
    c.setFont("Arial-Bold", 12)
    c.drawString(66, 398, "Schedule a showing")
    draw_para(c, "Contact the owner directly. Pre-approval is encouraged for serious buyers before submitting an offer.", 66, 382, 202, 38, S_CARD)

    rounded_rect(c, 318, 350, 250, 78, 12, WHITE, LINE, 0.8)
    c.setFillColor(GREEN)
    c.setFont("Arial-Bold", 12)
    c.drawString(340, 398, "Submit an offer")
    draw_para(c, "Work with your buyer's agent or real estate attorney to prepare a North Carolina Offer to Purchase and Contract.", 340, 382, 202, 38, S_CARD)

    rounded_rect(c, 44, 213, 524, 104, 14, CREAM, GOLD, 1.2)
    c.setFillColor(GREEN)
    c.setFont("Georgia-Bold", 18)
    c.drawString(66, 280, "Request the buyer packet")
    draw_para(
        c,
        "Available upon request: NC Residential Property Disclosure Statement, HOA documents and CC&Rs, survey if available, and additional showing details. The home was built in 2024 and remains subject to applicable builder warranties; buyer should verify coverage.",
        66,
        258,
        448,
        54,
        S_BODY,
    )

    rounded_rect(c, 78, 64, 456, 112, 16, GREEN, None)
    rounded_rect(c, 95, 80, 84, 84, 8, WHITE, GOLD, 1.4)
    c.drawImage(str(ROOT / "FSBO" / "qr-code.png"), 103, 88, 68, 68, mask="auto")
    c.setFillColor(GOLD_2)
    c.setFont("Georgia-Bold", 23)
    c.drawString(204, 132, "UmsteadGrove.com")
    c.setFillColor(WHITE)
    c.setFont("Arial-Bold", 13)
    c.drawString(204, 108, PROPERTY["phone"])
    c.setFont("Arial", 10)
    c.drawString(204, 91, PROPERTY["email"])


def build():
    register_fonts()
    clean_assets()
    assets = {
        "exterior_cover": crop_cover(ROOT / "images" / "exterior-front.jpg", 1200, 1000, "exterior_cover.jpg", 0.42),
        "kitchen": crop_cover(ROOT / "images" / "kitchen-island.jpg", 900, 680, "kitchen.jpg", 0.48),
        "living": crop_cover(ROOT / "images" / "open-concept-kitchen-living.jpg", 900, 680, "living.jpg", 0.48),
        "lot": crop_cover(ROOT / "images" / "lot-location.jpg", 900, 530, "lot.jpg", 0.5),
        "floor": crop_cover(ROOT / "images" / "floor-plan.jpg", 900, 530, "floor.jpg", 0.5),
        "patio": crop_cover(ROOT / "images" / "dining-area-patio-view.jpg", 900, 580, "patio.jpg", 0.48),
        "suite": crop_cover(ROOT / "images" / "owners-suite.jpg", 900, 580, "suite.jpg", 0.48),
    }

    c = canvas.Canvas(str(PDF_PATH), pagesize=letter)
    c.setTitle("Umstead Grove Buyer Flyer")
    c.setAuthor("Umstead Grove FSBO")
    c.setSubject("Buyer-facing home flyer for 1008 Umstead Grove Way")

    cover_page(c, assets)
    c.showPage()
    overview_page(c, assets)
    c.showPage()
    upgrades_page(c)
    c.showPage()
    market_page(c)
    c.showPage()
    location_page(c, assets)
    c.showPage()
    next_steps_page(c, assets)
    c.save()
    print(PDF_PATH)


if __name__ == "__main__":
    build()
