# Instalatori Fotovoltaice

Piață cu două laturi între oameni care vor panouri fotovoltaice și firmele care le montează. Latura de cerere se alimentează din căutare (Google, ghiduri), latura de ofertă din Facebook și din directorul de firme. Glosarul de mai jos fixează limbajul comun; deciziile și cifrele stau în `docs/` și în memorie.

## Language

### Latura de cerere

**Cerere**:
Solicitarea publică, anonimizată, a unei persoane sau firme care vrea o instalație fotovoltaică. Forma vizibilă pe `/cereri`, fără date de contact.
_Avoid_: Lead (în comunicarea publică), solicitare, request

**Lead**:
Aceeași solicitare, cu datele de contact complete. Termen intern, folosit în Sheets, în scripturi și în cod.
_Avoid_: Cerere (în context intern), prospect, contact

**Client**:
Persoana sau firma care a lăsat o cerere pentru că vrea panouri montate. Cumpără o instalație, nu cumpără nimic de la platformă.
_Avoid_: Beneficiar, utilizator, solicitant

**Segment**:
Împărțirea unei cereri în rezidențial sau comercial, după tipul clientului, nu după putere.
_Avoid_: Categorie, tip client

### Latura de ofertă

**Firmă**:
Instalatorul listat în director. Singura parte care plătește.
_Avoid_: Partener, furnizor, vendor

**Listare**:
Profilul unei firme în director. Gratuită, și rămâne gratuită.
_Avoid_: Profil, pagină de firmă, înregistrare

**Revendicare**:
Acțiunea prin care o firmă își asumă o cerere din feedul public. Nu îi dă automat datele de contact.
_Avoid_: Claim, alocare, preluare

**Exclusivitate pe județ**:
Abonamentul lunar prin care o singură firmă primește toate cererile dintr-un județ, cu datele de contact, în momentul în care intră. Se vinde per județ, lunar, fără angajament.
_Avoid_: Abonament, pachet, premium, sponsorizare

**Județ liber**:
Județ pentru care exclusivitatea nu e încă vândută. Starea implicită a tuturor județelor.
_Avoid_: Județ disponibil, slot liber

### Distribuție și conținut

**Distribuire**:
Trecerea unei cereri către o firmă, cu datele de contact. Se face telefonic, un apel per cerere.
_Avoid_: Trimitere, alocare, matching

**Ghid**:
Articol lung publicat pe `/ghid`, scris pentru căutare. Motorul laturii de cerere.
_Avoid_: Articol, blog post, postare

**Postare**:
Conținut social, pe Facebook și canalele derivate. Motorul laturii de ofertă.
_Avoid_: Reel, content, material

**Studiu de caz**:
Articol despre un montaj real al unei firme, cu materialele ei. Gratuit în primele sloturi, produs plătit mai târziu.
_Avoid_: Testimonial, referință, portofoliu
