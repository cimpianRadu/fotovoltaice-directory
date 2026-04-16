# ANRE Portal API — Referință Tehnică

Portal public: https://portal.anre.ro/PublicLists/Atestate
Ultima verificare: 2026-04-16

## Overview

Portalul ANRE expune un API JSON public (Kendo UI grid) pentru registrul de atestate ale operatorilor economici din domeniul energiei. Nu necesită autentificare.

Total operatori economici atestați (aprilie 2026): **~9.609 înregistrări**

---

## API Endpoints

### 1. Căutare agent economic (autocomplete)

**GET** `https://portal.anre.ro/PublicLists/LicenteAutorizatii/GetAgenti`

Query params:
```
text=NUME_FIRMA                              # Text de căutare (case insensitive)
filter[logic]=and
filter[filters][0][value]=nume_firma         # lowercase
filter[filters][0][field]=Nume
filter[filters][0][operator]=startswith      # sau "contains"
filter[filters][0][ignoreCase]=true
```

**Response:** Array de obiecte
```json
[
  {"IdAgentEconomic": 12304, "Nume": "SIMTEL TEAM"},
  {"IdAgentEconomic": 16046, "Nume": "SIMTEL INDUSTRIAL CONTROL"}
]
```

**Note:**
- `startswith` e mai precis, `contains` returnează mai multe rezultate
- Numele pe ANRE poate diferi de cel din Registrul Comerțului (ex: "RESTART ENERGY INFRASTRUCTURE" vs "Restart Energy One")
- Unele firme au mai multe entități pe ANRE (sucursale, firme soră)

---

### 2. Obținere atestate per agent

**POST** `https://portal.anre.ro/PublicLists/Atestate/GetAtestate?menu=Energy`

Content-Type: `application/x-www-form-urlencoded`

Form data:
```
Agents[0].IdAgentEconomic=12304          # ID din pasul 1
AtestateTypes[0].IdTipAtestare=1         # 1 = "Atestare Agenți"
sort=                                     # opțional
page=1
pageSize=100                              # max testat: 500
group=
filter=
```

**Response:**
```json
{
  "Data": [
    {
      "NrCrt": 1,
      "Societate": "SIMTEL TEAM",
      "Sediu": "Splaiul Independentei...",
      "Localitate": "Bucuresti",
      "Judet": "Bucuresti",
      "TelefonFax": "0753183750",
      "Detaliu": "<table>...HTML cu atestate...</table>",
      "Menu": null
    }
  ],
  "Total": 1,
  "AggregateResults": null,
  "Errors": null
}
```

**Câmpul `Detaliu`** conține HTML cu un tabel:
```html
<table>
  <tr>
    <th>Nr. atestat</th>
    <th>Tip tarif</th>
    <th>Data emitere</th>
    <th>Data expirare</th>
    <th>Stare</th>
  </tr>
  <tr>
    <td>12431</td>
    <td>Tarif C2A</td>
    <td>13/03/2017</td>
    <td>13/03/2022</td>
    <td>Retras</td>
  </tr>
  <tr>
    <td>12431</td>
    <td>Tarif C2A*-vizare periodica</td>
    <td>13/03/2017</td>
    <td>22/02/2027</td>
    <td>Atestat</td>
  </tr>
</table>
```

**Parsare Detaliu:** regex pe `<td>` tags, grupuri de 5 (nr_atestat, tip_tarif, data_emitere, data_expirare, stare).

---

### 3. Listare completă (fără filtru agent)

Același endpoint POST, dar fără `Agents[0].IdAgentEconomic`:

```
AtestateTypes[0].IdTipAtestare=1
page=1
pageSize=500
```

Returnează toți agenții paginat. Total: ~9.609. Se pot descărca în batch-uri de 500 (20 pagini).

---

### 4. Export Excel

Pe interfață există buton "Export excel" care descarcă tot registrul filtrat.

---

## Tipuri de Atestate (relevante pentru fotovoltaice)

| Tip tarif | Descriere | Relevanță instalări PV |
|---|---|---|
| **C2A** | Proiectare + executare instalații electrice exterioare (medie/înaltă tensiune) | **ESENȚIAL** pentru proiecte comerciale/industriale >50 kWp |
| **C1A** | Proiectare instalații electrice exterioare | Proiectare, nu execuție |
| **C2B** | Executare instalații electrice interioare | Complementar, nu suficient singur |
| **C1B** | Proiectare instalații electrice interioare | Proiectare interioară |
| **B** | Executare instalații electrice de joasă tensiune | Suficient pentru rezidențial/IMM mic (<50 kWp) |
| **Bp** | Executare instalații electrice de joasă tensiune (parțial) | Similar cu B |
| **A3** | Proiectare instalații electrice | Proiectare generală |
| **E1** | Verificare instalații electrice (proiecte) | Verificare, nu execuție |
| **E2** | Verificare instalații electrice (execuție) | Verificare, nu execuție |
| **D1** | Proiectare rețele electrice | Rețele de distribuție |
| **D2** | Executare rețele electrice | Rețele de distribuție |

### Variante cu sufixe
- `*-vizare periodica` = atestat reînnoit prin vizare (e valid, mai important decât originalul)
- `Vizare` = la fel, reînnoire

### Stări posibile
- **Atestat** = valid, activ
- **Expirat** = a expirat, nu a fost reînnoit
- **Retras** = retras de ANRE sau de titular
- **ScosDinEvidenta** = eliminat din registru

---

## Rezultatele verificării noastre (2026-04-16)

### 28 firme cu ANRE-C2A confirmat (din 45 în director)

Simtel Team, Energomontaj, Romsir-Impex, Renovatio Solar, MRB Electric, Alfa Energetic Esco, StratoSpark, Genway, Eurotehnica IT&C, FomCo Solar, Electro-Alfa International, Ensys Renewable, Veltol Holding, Wiren Romania, Volta X Solar, Elsaco Solutions, Visual Fan (Allview), inoSOLAR, Greentech Professionals, Flexik Automation, Altige Impex, EXE Green Holding, Mapa Rom Invest, Prima Electro Construct, Astra Electric, Darcom Energy, Expert Energy, VOLT EVSE Distribution.

### 17 fără C2A

**Pe ANRE cu alte atestate:**
- EnergoBit (A3, E1, E2, D1)
- ENEVO Group (A3, E1, E2, D1, D2)
- Waldevar Energy (A3, E1, E2, D1, D2)
- EEBC (D1, E1, Be, A3, D2, E2)
- Restart Energy One (A3, E1, E2, D1, D2 — firma soră Infrastructure are C2A)
- Photon Energy Engineering (C1A)
- Electrica Serv (C2A expirat)
- Ecosolaris (B)
- Rominstal Solar (B)
- East Solar Electric (B vizare)
- Greenvolt Next (B vizare)
- Sun Power Center (B)
- P Plus 2002 (B)
- Carpat Energy (B)
- 2K Solution (B)

**Negăsite pe ANRE:**
- Solargroup Energy RO

---

## Idei pentru pagina /verificare-anre

### Funcționalitate
1. Input: nume firmă (autocomplete din API GetAgenti)
2. Selectare agent din rezultate
3. Afișare atestate cu status vizual (valid/expirat/retras)
4. Highlight pe C2A/B (cele relevante pentru instalări)
5. Explicație user-friendly ce înseamnă fiecare tip

### Considerații tehnice
- API-ul ANRE nu are CORS headers → trebuie proxy server-side (Next.js API route)
- SSL certificate issues pe portal.anre.ro → curl cu `-k` flag, în Node: `NODE_TLS_REJECT_UNAUTHORIZED=0` sau custom agent
- Caching: rezultatele se pot cache 24h (atestatele nu se schimbă des)
- Rate limiting: necunoscut, dar API-ul pare să suporte request-uri rapide

### SEO value
- Keywords: "verificare atestat ANRE", "verificare instalator fotovoltaic", "registru ANRE atestate"
- Zero competiție pe aceste keywords — nimeni nu oferă asta user-friendly
- Potențial de backlinks de la forumuri/bloguri energie
