---
name: guide-update
description: Actualizează flag-uri, date, sau metadata pe ghiduri existente (publishedAt, unpublished, titlu, metaDescription). Folosește când user-ul cere update la un ghid existent.
---

# Update Ghid Existent

Actualizează ghiduri existente din `data/guides.json`.

## Ce se poate actualiza
- `publishedAt` — schimbă data publicării
- `unpublished: true/false` — publică/depublică un ghid
- `title` — actualizează titlul (menține keyword + an)
- `metaDescription` — actualizează meta description (max 160 chars)
- `heroDescription` — actualizează descrierea hero
- `sections` — editează/adaugă/șterge secțiuni
- `faq` — editează/adaugă/șterge întrebări FAQ
- `relatedSpecializations` — actualizează specializările asociate
- `author` — schimbă autorul

## Workflow
1. Citește `data/guides.json`
2. Identifică ghidul după slug sau titlu
3. Aplică modificările cerute
4. Salvează `data/guides.json`
5. Confirmă modificările user-ului

## Comenzi comune
- `/guide-update publish slug-ghid` — setează `unpublished: false` și `publishedAt` la data curentă
- `/guide-update unpublish slug-ghid` — setează `unpublished: true`
- `/guide-update date slug-ghid 2026-04-15` — schimbă data publicării

## Reguli
- Nu modifica conținutul fără confirmarea user-ului
- Păstrează structura JSON validă
- Titlurile trebuie să conțină anul curent (2026) și keyword-ul principal
- Meta descriptions max 160 caractere
