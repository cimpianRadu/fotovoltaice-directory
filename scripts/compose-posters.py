#!/usr/bin/env python3
"""
Compune cele două poze ale săptămânii: cazul din Timiș și rezumatul
săptămânal (luni dimineață, pe săptămâna încheiată luni-duminică). Fiecare caracter e randat de PIL, deci cifrele
sunt exacte și tipografia identică între ediții.

Rezumatul își ia cifrele din `node scripts/weekly-summary.mjs --json`,
nu din text scris de mână, ca ediția să nu poată rămâne în urma realității.

Usage:
  python3 scripts/compose-posters.py                 # ambele, 4:5 + story 9:16
  python3 scripts/compose-posters.py --doar-caz
  python3 scripts/compose-posters.py --doar-rezumat --de 2026-08-10 --pana 2026-08-16
"""

import json
import subprocess
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONT = '/System/Library/Fonts/Avenir Next.ttc'
# Indicii din Avenir Next.ttc, verificați cu getname(): 0 = Bold, 7 = Regular.
# Restul sunt cursive; un index greșit dă toată poza în italic.
IDX_BOLD, IDX_REGULAR = 0, 7
AMBER = (245, 158, 11)
NAVY = (30, 58, 95)
DEEP = (22, 42, 70)
LIGHT = (250, 250, 249)
MUTED = (139, 155, 176)
GREEN = (16, 122, 87)


def font(size, bold=True):
    return ImageFont.truetype(FONT, size, index=IDX_BOLD if bold else IDX_REGULAR)


def center(draw, y, text, f, fill, W):
    w = draw.textbbox((0, 0), text, font=f)[2]
    draw.text(((W - w) / 2, y), text, font=f, fill=fill)
    return y + draw.textbbox((0, 0), text, font=f)[3]


def poster(size, blocks, footer=None, bg=DEEP):
    """blocks = listă de (text, size, color, spacing_after)."""
    W, H = size
    img = Image.new('RGB', size, bg)
    d = ImageDraw.Draw(img)

    total = 0
    for text, s, _c, gap in blocks:
        f = font(s)
        total += d.textbbox((0, 0), text or 'X', font=f)[3] + gap
    y = (H - total) / 2

    for text, s, c, gap in blocks:
        f = font(s)
        if text:
            y = center(d, y, text, f, c, W) + gap
        else:
            y += gap

    if footer:
        f = font(int(W * 0.030))
        w = d.textbbox((0, 0), footer, font=f)[2]
        d.text(((W - w) / 2, H - int(H * 0.075)), footer, font=f, fill=MUTED)
    return img


def render_case(outdir: Path):
    """Cazul din Timiș, cifrele recitite din calculator pe 11 august.

    Prima versiune (7 aug) avea 11.180 lei, interval 10.385 - 13.411 și 4,2 ani.
    Curba de preț lua atunci prețurile VoltGrid cu TVA 9%, cotă ieșită din uz
    pentru panouri din 1 august 2025, deci mediana ieșea prea mică (commit
    2e3f079). Cifrele de mai jos sunt cele pe care le arată calculatorul live
    pentru `?segment=rezidential&consum=450&unitate=lei&judet=Timiș` și sunt
    aceleași pe care le spune reelul publicat pe 12 august; dacă se schimbă
    iar curba, se schimbă și aici, altfel poza contrazice reelul.
    """
    rows = [
        ('Sistem potrivit', '3,3 kW'),
        ('Cost estimat', '11.527 lei'),
        ('Interval real', '11.180 - 14.890 lei'),
        ('Produce', '4.158 kWh/an'),
        ('Economie', '2.703 lei/an'),
        ('Amortizare', '4,3 ani'),
    ]

    for name, (W, H) in {'4x5': (1080, 1350), 'story': (1080, 1920)}.items():
        img = Image.new('RGB', (W, H), DEEP)
        d = ImageDraw.Draw(img)

        f_kicker = font(int(W * 0.040))
        f_title = font(int(W * 0.072))
        f_sub = font(int(W * 0.038))
        f_k = font(int(W * 0.042))
        f_v = font(int(W * 0.052))

        top = int(H * 0.16)
        y = center(d, top, 'CASĂ ÎN TIMIȘ', f_kicker, AMBER, W) + int(H * 0.024)
        y = center(d, y, 'factură de 450 lei', f_title, LIGHT, W) + 6
        y = center(d, y, 'pe lună', f_title, LIGHT, W) + int(H * 0.055)

        pad = int(W * 0.10)
        for k, v in rows:
            d.text((pad, y), k, font=f_k, fill=MUTED)
            vw = d.textbbox((0, 0), v, font=f_v)[2]
            color = AMBER if k == 'Amortizare' else LIGHT
            d.text((W - pad - vw, y - 6), v, font=f_v, fill=color)
            y += int(H * 0.052)
            d.line([(pad, y - 10), (W - pad, y - 10)], fill=(255, 255, 255, 30), width=2)

        y += int(H * 0.030)
        center(d, y, 'Calculează pentru factura ta.', f_sub, AMBER, W)

        f_foot = font(int(W * 0.030))
        foot = 'instalatori-fotovoltaice.ro'
        fw = d.textbbox((0, 0), foot, font=f_foot)[2]
        d.text(((W - fw) / 2, H - int(H * 0.085)), foot, font=f_foot, fill=MUTED)

        out = outdir / f'poza-caz-timis-{name}.png'
        img.save(out)
        print(f'  {out.relative_to(ROOT)}')


def weekly_numbers(de, pana):
    cmd = ['node', str(ROOT / 'scripts' / 'weekly-summary.mjs'), '--json']
    if de:
        cmd += ['--de', de]
    if pana:
        cmd += ['--pana', pana]
    return json.loads(subprocess.run(cmd, capture_output=True, text=True, cwd=ROOT).stdout)


def render_weekly(outdir: Path, de=None, pana=None):
    n = weekly_numbers(de, pana)
    if n['cereriNoi'] == 0:
        print('  ⚠️  zero cereri în interval, poza nu are ce spune. Sar peste.')
        return

    luni = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie',
            'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie']
    d1, d2 = n['de'], n['pana']
    zi1, luna1 = int(d1[8:10]), int(d1[5:7])
    zi2, luna2 = int(d2[8:10]), int(d2[5:7])
    # Săptămâna care se termină în luna următoare se scrie cu ambele luni,
    # altfel „31 - 6 septembrie" ar sugera un interval care nu există.
    if luna1 == luna2:
        titlu = f"{zi1} - {zi2} {luni[luna2 - 1]}"
    else:
        titlu = f"{zi1} {luni[luna1 - 1]} - {zi2} {luni[luna2 - 1]}"

    # Eticheta seriei: a câta luni a lunii e ziua de început, aceeași numerotare
    # ca folderele din social/ (`2026-08-w2-10-16`) și ca `SeriesCover` din reel.
    # Numerotăm săptămâna RAPORTATĂ, nu ziua postării: postarea de luni vorbește
    # despre săptămâna încheiată duminică.
    eticheta = f"SĂPTĂMÂNA {(zi1 - 1) // 7 + 1} DIN {luni[luna1 - 1].upper()}"

    rows = [
        (str(n['cereriNoi']), 'cereri noi', LIGHT),
        (str(n['preluate']), 'preluate de firme', LIGHT),
        (str(n['disponibile']), 'încă disponibile', AMBER),
    ]
    # Ediția din 10 august a promis public cifra de oferte trimise. Marcajul din
    # portal o produce de pe 14 august, deci o arătăm de îndată ce există; e
    # singura cifră care spune dacă bucla se închide, nu doar dacă intră cereri.
    if n.get('oferteTrimise'):
        rows.append((str(n['oferteTrimise']), 'ajunse la ofertă trimisă', GREEN))

    for name, (W, H) in {'4x5': (1080, 1350), 'story': (1080, 1920)}.items():
        img = Image.new('RGB', (W, H), NAVY)
        d = ImageDraw.Draw(img)

        f_kicker = font(int(W * 0.038))
        f_title = font(int(W * 0.064))
        dens = len(rows) >= 4
        f_num = font(int(W * (0.112 if dens else 0.135)))
        f_lbl = font(int(W * (0.037 if dens else 0.040)))
        f_note = font(int(W * 0.034))
        gap_row = int(H * (0.022 if dens else 0.028))

        # Capul de afiș al seriei, identic cu coperta reelului: eticheta
        # săptămânii, întrebarea care se repetă de la o ediție la alta, apoi
        # intervalul. Recurența e ce face postarea recunoscută în feed.
        top = int(H * 0.09)
        y = center(d, top, eticheta, f_kicker, AMBER, W) + int(H * 0.016)
        y = center(d, y, 'Ce e nou?', f_title, LIGHT, W) + int(H * 0.014)
        y = center(d, y, titlu, f_note, MUTED, W) + int(H * 0.034)

        for num, lbl, col in rows:
            y = center(d, y, num, f_num, col, W) + 2
            y = center(d, y, lbl, f_lbl, MUTED, W) + gap_row

        y += int(H * 0.010)
        center(d, y, 'Cereri noi apar în fiecare zi.', f_note, LIGHT, W)

        f_foot = font(int(W * 0.030))
        foot = 'instalatori-fotovoltaice.ro/cereri'
        fw = d.textbbox((0, 0), foot, font=f_foot)[2]
        d.text(((W - fw) / 2, H - int(H * 0.085)), foot, font=f_foot, fill=MUTED)

        out = outdir / f'poza-rezumat-{name}.png'
        img.save(out)
        print(f'  {out.relative_to(ROOT)}')

    (outdir / 'cifre.json').write_text(json.dumps(n, indent=2, ensure_ascii=False))
    print(f"  cifre: {n['cereriNoi']} noi, {n['preluate']} preluate, {n['disponibile']} disponibile, "
          f"{n['oferteTrimise']} oferte")


if __name__ == '__main__':
    args = sys.argv[1:]
    flag = lambda k: args[args.index(f'--{k}') + 1] if f'--{k}' in args else None

    if '--doar-rezumat' not in args:
        out = ROOT / 'social' / '2026-08-w2-10-16' / '2026-08-13-caz-timis'
        out.mkdir(parents=True, exist_ok=True)
        print('Cazul din Timiș:')
        render_case(out)

    if '--doar-caz' not in args:
        out = ROOT / 'social' / '2026-08-w3-17-23' / '2026-08-17-rezumat-10-16-aug'
        out.mkdir(parents=True, exist_ok=True)
        print('Rezumatul săptămânal:')
        render_weekly(out, flag('de'), flag('pana'))
