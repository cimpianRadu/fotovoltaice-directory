#!/usr/bin/env python3
"""Posterul cu prețurile de kit, 4:5 și story.

Înlocuiește reelul #21 până când acela poate fi refăcut: cifrele lui sunt în
banda de voce, deci cer voce regenerată, iar postarea nu are de ce să aștepte.

Cifrele NU se scriu de mână. Vin din data/kit-prices.json, câmpul
`pretCuTva21Ron`, produs de scripts/normalize-kit-prices.mjs, și sunt filtrate
pe on-grid, cu montaj inclus, în stoc. Scriptul refuză să compună poza dacă
prețurile nu sunt normalizate, ca să nu repete greșeala din 3 august, când
tabelele comparau baze de TVA diferite.

    python3 scripts/compose-kit-poster.py
"""

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONT = '/System/Library/Fonts/Avenir Next.ttc'
IDX_BOLD, IDX_REGULAR = 0, 7
AMBER = (245, 158, 11)
DEEP = (22, 42, 70)
LIGHT = (250, 250, 249)
MUTED = (139, 155, 176)

OUTDIR = ROOT / 'social' / '2026-08-11-kit-pret-poster'


def font(size, bold=True):
    return ImageFont.truetype(FONT, size, index=IDX_BOLD if bold else IDX_REGULAR)


def center(draw, y, text, f, fill, W):
    w = draw.textbbox((0, 0), text, font=f)[2]
    draw.text(((W - w) / 2, y), text, font=f, fill=fill)
    return y + draw.textbbox((0, 0), text, font=f)[3]


def minime():
    """Cel mai mic preț cu montaj, pe fiecare putere, la TVA 21%, doar în stoc."""
    date = json.loads((ROOT / 'data' / 'kit-prices.json').read_text(encoding='utf-8'))
    if not date.get('tvaNormalizatLa'):
        sys.exit('Prețurile nu sunt normalizate. Rulează scripts/normalize-kit-prices.mjs --write.')

    rezultat = []
    for kw in (3, 5, 10):
        candidati = []
        for sursa in date['sources']:
            for p in sursa.get('produse', []):
                if p.get('unitate') != 'kW' or p.get('tip') != 'on-grid':
                    continue
                if p.get('includeMontaj') != 'da' or p.get('includeBaterie'):
                    continue
                if not p.get('pretCuTva21Ron') or abs((p.get('marime') or 0) - kw) >= 0.35:
                    continue
                # Un „de la X lei" pe un produs epuizat e o promisiune goală.
                if (p.get('stoc') or '').startswith('stoc epuizat'):
                    continue
                candidati.append((p['pretCuTva21Ron'], sursa['store']))
        if not candidati:
            sys.exit(f'Nicio ofertă comparabilă la {kw} kW. Verifică scrape-ul.')
        pret, magazin = min(candidati)
        rezultat.append((f'{kw} kW', f'{round(pret):,}'.replace(',', '.') + ' lei', magazin))
    return rezultat


def main():
    OUTDIR.mkdir(parents=True, exist_ok=True)
    rows = minime()
    magazine = len({m for _, _, m in rows})
    print('Cifre folosite (TVA 21%, montaj inclus, în stoc):')
    for putere, pret, magazin in rows:
        print(f'  {putere:>6}  {pret:>12}   {magazin}')

    for name, (W, H) in {'4x5': (1080, 1350), 'story': (1080, 1920)}.items():
        img = Image.new('RGB', (W, H), DEEP)
        d = ImageDraw.Draw(img)

        f_kicker = font(int(W * 0.038))
        f_title = font(int(W * 0.070))
        f_k = font(int(W * 0.050))
        f_v = font(int(W * 0.058))
        f_note = font(int(W * 0.028), bold=False)
        f_cta = font(int(W * 0.036))

        top = int(H * 0.185)
        y = center(d, top, 'PREȚURI REALE, AUGUST 2026', f_kicker, AMBER, W) + int(H * 0.026)
        y = center(d, y, 'Kit fotovoltaic', f_title, LIGHT, W) + 8
        y = center(d, y, 'cu montaj', f_title, LIGHT, W) + int(H * 0.070)

        pad = int(W * 0.11)
        for putere, pret, _magazin in rows:
            d.text((pad, y + 4), putere, font=f_k, fill=MUTED)
            vw = d.textbbox((0, 0), pret, font=f_v)[2]
            d.text((W - pad - vw, y), pret, font=f_v, fill=LIGHT)
            y += int(H * 0.070)
            d.line([(pad, y - 14), (W - pad, y - 14)], fill=(255, 255, 255, 30), width=2)

        y += int(H * 0.028)
        y = center(d, y, 'de la, cu TVA 21% inclus', f_note, MUTED, W) + int(H * 0.045)
        center(d, y, 'Vezi toate prețurile pe site.', f_cta, AMBER, W)

        foot = 'instalatori-fotovoltaice.ro'
        fw = d.textbbox((0, 0), foot, font=f_note)[2]
        d.text(((W - fw) / 2, H - int(H * 0.085)), foot, font=f_note, fill=MUTED)

        out = OUTDIR / f'poza-kit-pret-{name}.png'
        img.save(out)
        print(f'  {out.relative_to(ROOT)}  ({W}x{H})')


if __name__ == '__main__':
    main()
