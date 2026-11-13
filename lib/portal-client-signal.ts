// Ce știm de la client după ce firma a trimis oferta (13 nov 2026).
//
// De ce: din 47 de cereri ofertate de la 1 septembrie, 39 nu aveau niciun semn
// de la client, iar firmele au spus-o pe nume: „nu mai primim feedback după
// ofertare, efort irosit”. Întrebarea „Ați găsit o ofertă bună?” pleacă deja,
// pe email (lib/verificare-status) și pe WhatsApp (lib/whatsapp-verificare),
// dar răspunsul ajungea doar la noi. Rândul ăsta îl pune pe cardul firmei,
// inclusiv tăcerea: „întrebat pe 14 noiembrie, încă nu a răspuns” e tot un
// răspuns pentru cine a muncit la o ofertă.
//
// Ce NU arată:
//  - „am semnat” și „am ales altă firmă”: cererea se închide, iar cardul are
//    deja rândul lui pentru asta (closedLeadNotice);
//  - „nu m-a contactat nicio firmă”: contrazice statusul firmei și se lămurește
//    de noi, la telefon, nu printr-un rând pe card;
//  - o întrebare pusă înainte ca firma să fi trimis oferta: nu era despre ea.
//
// Atenție la WhatsApp: marcajul se scrie când se deschide mesajul din
// /admin/cereri, nu când pleacă. Cine îl deschide și nu-l trimite lasă pe card
// o întrebare care n-a existat.
//
// Fără importuri: îl folosesc și pagina portalului (server) și cardul.

export interface ClientSignal {
  /** `intrebat` = întrebat, fără răspuns; `se_decide` = a răspuns că încă se decide. */
  kind: 'intrebat' | 'se_decide';
  /** Rândul de pe card, gata de afișat. */
  text: string;
}

function ms(iso: string | undefined | null): number {
  const t = Date.parse(iso || '');
  return Number.isNaN(t) ? 0 : t;
}

function fmtDay(at: number): string {
  return new Date(at).toLocaleDateString('ro-RO', {
    timeZone: 'Europe/Bucharest',
    day: 'numeric',
    month: 'long',
  });
}

export function clientSignalFor(input: {
  /** De când contează întrebarea: data ofertei firmei sau, fără ea, a revendicării. */
  since: string;
  /** Când a fost întrebat clientul „ați găsit o ofertă bună?”: email, retrimitere, WhatsApp. */
  askedAt: (string | undefined | null)[];
  /** `Leads!AT`, în forma „cod ISO [firmă]”. */
  raspunsClient: string;
}): ClientSignal | null {
  const since = ms(input.since);
  if (!since) return null;
  const asks = input.askedAt.map(ms).filter((t) => t >= since);
  if (asks.length === 0) return null;
  const lastAsk = Math.max(...asks);

  const [code = '', at = ''] = (input.raspunsClient || '').split(' ');
  const answeredAt = ms(at);
  if (answeredAt >= lastAsk) {
    if (code === 'decid') {
      return { kind: 'se_decide', text: `Clientul ne-a spus pe ${fmtDay(answeredAt)} că încă se decide.` };
    }
    // Restul răspunsurilor la această întrebare fie închid cererea, fie se
    // lămuresc de noi; pe card nu apare nimic.
    if (code === 'semnat' || code === 'altafirma' || code === 'necontactat') return null;
  }
  return {
    kind: 'intrebat',
    text: `Am întrebat clientul pe ${fmtDay(lastAsk)} dacă a ales o ofertă. Încă nu a răspuns.`,
  };
}
