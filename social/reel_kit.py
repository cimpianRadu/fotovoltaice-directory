"""Kit comun pentru reel-uri 1080x1920 (brand instalatori-fotovoltaice.ro).

Import din compose.py-ul fiecarei postari:
    sys.path.append(str(Path(__file__).parent.parent))
    from reel_kit import *
"""
import sys
from pathlib import Path

sys.path.append(str(Path.home() / ".claude/skills/pil-slide-composer/assets"))
from PIL import Image, ImageDraw
from slide_composer import Composer, BrandConfig

LOGO = Path("/Users/raducimpian/Projects/fotovoltaice-comerciale/public/logo.png")

AMBER = (245, 158, 11)
NAVY = (30, 58, 95)
NAVY_DEEP = (22, 42, 70)
CREAM = (250, 250, 249)
WHITE = (255, 255, 255)
RED = (185, 28, 28)
SUBTLE = (100, 116, 139)
DIVIDER = (203, 213, 225)

W, H = 1080, 1920
FOOTER_TOP = 1830
WORDMARK = "instalatori-fotovoltaice.ro"

c = Composer(BrandConfig(size=W, wordmark_text=""))


def stamp_brand(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    draw = ImageDraw.Draw(img)
    draw.rectangle([(0, FOOTER_TOP), (W, H)], fill=CREAM)
    draw.line([(0, FOOTER_TOP), (W, FOOTER_TOP)], fill=(226, 232, 240), width=1)
    logo = Image.open(LOGO).convert("RGBA")
    logo.thumbnail((52, 52), Image.LANCZOS)
    f = c.font(30, "bold")
    tw, th = c.measure(WORDMARK, f)
    total = logo.width + 16 + tw
    x0 = (W - total) // 2
    band_h = H - FOOTER_TOP
    img.alpha_composite(logo, (x0, FOOTER_TOP + (band_h - logo.height) // 2))
    draw = ImageDraw.Draw(img)
    draw.text((x0 + logo.width + 16, FOOTER_TOP + (band_h - th) // 2 - 6),
              WORDMARK, font=f, fill=NAVY)
    return img.convert("RGB")


def center_lines(draw, lines, y, font, fill, line_gap=14):
    lh = c.measure("Mg", font)[1] + line_gap
    for line in lines:
        c.text_centered(draw, line, y, font, fill)
        y += lh
    return y


def hook_slide(top, hero, tail, bg=AMBER, fg=NAVY, hero_fg=None,
               top_size=58, hero_size=200, tail_size=48):
    hero_fg = hero_fg or fg
    img = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(img)
    f_top, f_hero, f_tail = c.font(top_size, "bold"), c.font(hero_size, "bold"), c.font(tail_size, "bold")
    top_lines = c.wrap(top, f_top, 860)
    tail_lines = c.wrap(tail, f_tail, 860)
    h_hero = c.measure(hero, f_hero)[1]
    lh_top = c.measure("Mg", f_top)[1] + 14
    lh_tail = c.measure("Mg", f_tail)[1] + 14
    gap1, gap2 = 90, 110
    total = len(top_lines) * lh_top + gap1 + h_hero + gap2 + len(tail_lines) * lh_tail
    y = (FOOTER_TOP - total) // 2 - 30
    y = center_lines(d, top_lines, y, f_top, fg)
    y += gap1
    c.text_centered(d, hero, y, f_hero, hero_fg)
    y += h_hero + gap2
    center_lines(d, tail_lines, y, f_tail, fg)
    return img


def text_slide(label, title, body, bg=NAVY, fg=WHITE, accent=AMBER,
               body2=None, body2_color=None):
    """Slide de continut: label mic accent, titlu mare, corp de text."""
    img = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(img)
    f_label, f_title, f_body = c.font(46, "bold"), c.font(84, "bold"), c.font(46, "bold")
    title_lines = c.wrap(title, f_title, 900)
    body_lines = c.wrap(body, f_body, 860)
    lh_t = c.measure("Mg", f_title)[1] + 14
    lh_b = c.measure("Mg", f_body)[1] + 18
    total = 46 + 60 + len(title_lines) * lh_t + 70 + len(body_lines) * lh_b
    b2_lines = c.wrap(body2, f_body, 860) if body2 else []
    if b2_lines:
        total += 50 + len(b2_lines) * lh_b
    y = (FOOTER_TOP - total) // 2
    c.text_centered(d, label, y, f_label, accent)
    y += 46 + 60
    y = center_lines(d, title_lines, y, f_title, fg)
    y += 70
    y = center_lines(d, body_lines, y, f_body, fg, line_gap=18)
    if b2_lines:
        y += 50
        center_lines(d, b2_lines, y, f_body, body2_color or accent, line_gap=18)
    return img


def receipt_slide(headline, rows, net_label, net_value, disclaimer="",
                  bg=CREAM, fg=NAVY, accent=AMBER, row_size=44, net_size=64):
    img = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(img)
    margin = 90
    right = W - margin
    f_h = c.font(64, "bold")
    f_row = c.font(row_size, "bold")
    f_net = c.font(net_size, "bold")
    f_disc = c.font(30, "italic")
    row_h = 108
    h_lines = c.wrap(headline, f_h, W - 2 * margin)
    total = len(h_lines) * (c.measure("Mg", f_h)[1] + 12) + 90 + len(rows) * row_h + 40 + c.measure("Mg", f_net)[1] + (70 if disclaimer else 0)
    y = (FOOTER_TOP - total) // 2
    for line in h_lines:
        c.text_left(d, line, margin, y, f_h, fg)
        y += c.measure("Mg", f_h)[1] + 12
    y += 90
    for label, value in rows:
        c.text_left(d, label, margin, y, f_row, fg)
        c.text_right(d, value, right, y, f_row, fg)
        d.line([(margin, y + row_h - 26), (right, y + row_h - 26)], fill=DIVIDER, width=1)
        y += row_h
    y += 8
    d.line([(margin, y), (right, y)], fill=fg, width=3)
    y += 34
    c.text_left(d, net_label, margin, y, f_net, fg)
    c.text_right(d, net_value, right, y, f_net, accent)
    y += c.measure("Mg", f_net)[1] + 34
    if disclaimer:
        for line in c.wrap(disclaimer, f_disc, W - 2 * margin):
            c.text_left(d, line, margin, y, f_disc, SUBTLE)
            y += c.measure("Mg", f_disc)[1] + 10
    return img


def cta_slide(headline_lines, subline, bg=AMBER, fg=NAVY):
    img = Image.new("RGB", (W, H), bg).convert("RGBA")
    d = ImageDraw.Draw(img)
    logo = Image.open(LOGO).convert("RGBA")
    logo.thumbnail((120, 120), Image.LANCZOS)
    chip = 160
    d.rounded_rectangle([((W - chip) // 2, 420), ((W + chip) // 2, 420 + chip)], radius=38, fill=CREAM)
    img.alpha_composite(logo, ((W - logo.width) // 2, 420 + (chip - logo.height) // 2))
    img = img.convert("RGB")
    d = ImageDraw.Draw(img)
    y = center_lines(d, headline_lines, 720, c.font(84, "bold"), fg)
    f_btn = c.font(52, "bold")
    bw = c.measure(WORDMARK, f_btn)[0] + 100
    btn_x, btn_y = (W - bw) // 2, y + 90
    d.rounded_rectangle([(btn_x, btn_y), (btn_x + bw, btn_y + 110)], radius=55, fill=fg)
    tw, th = c.measure(WORDMARK, f_btn)
    d.text((btn_x + (bw - tw) // 2, btn_y + (110 - th) // 2 - 8), WORDMARK, font=f_btn, fill=bg)
    f_sub = c.font(40, "bold")
    y = btn_y + 170
    center_lines(d, c.wrap(subline, f_sub, 860), y, f_sub, fg)
    return img
