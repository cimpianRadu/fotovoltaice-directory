import type { NewLead } from '@/lib/sheets';
import {
  getFinancingLabel, getYesNoLabel, getTimelineLabel, getRoofTypeLabel, getPhaseLabel,
  getConnectionLabel,
} from '@/lib/utils-shared';

// Text plain, fără emoji și fără markdown — mesajul se lipește în WhatsApp
// (care ignoră **bold** cu asteriscuri simple în multe clienți) și în alte
// canale (SMS, Signal). Structura pe rânduri e singura formatare pe care ne
// putem baza.
function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Bucharest',
  });
}

function fmtNoteDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
}

// Un rând „Label: valoare" numai dacă valoarea există. Așa mesajul nu are
// linii goale gen „Consum lunar:" pe cererile vechi la care câmpul nu era în
// formular.
function line(label: string, value: string | undefined | null): string | null {
  const v = (value ?? '').trim();
  return v ? `${label}: ${v}` : null;
}

export function formatLeadForShare(lead: NewLead): string {
  const segmentLabel = lead.segment === 'rezidential' ? 'Rezidențial' : 'Comercial';
  const header = `Cerere ofertă panouri fotovoltaice — ${fmtDate(lead.timestamp)}`;

  const locatie = [
    `Segment: ${segmentLabel}`,
    line('Tip proiect', lead.tipProiect),
    line('Județ', lead.judet),
    line('Localitate', lead.localitate),
  ].filter(Boolean);

  const specs = [
    line('Putere estimată', lead.putere ? `${lead.putere} kW` : ''),
    line('Suprafață disponibilă', lead.suprafata ? `${lead.suprafata} mp` : ''),
    line('Consum lunar', lead.consumLunar ? `${lead.consumLunar} kWh` : ''),
    line('Tip acoperiș', lead.tipAcoperis ? getRoofTypeLabel(lead.tipAcoperis) : ''),
    line('Fazare', lead.fazare ? getPhaseLabel(lead.fazare) : ''),
    line('Branșament', lead.bransament ? getConnectionLabel(lead.bransament) : ''),
    line('Baterie de stocare', lead.stocare ? getYesNoLabel(lead.stocare) : ''),
    line('Stație de încărcare', lead.wallbox ? getYesNoLabel(lead.wallbox) : ''),
    line('Termen dorit', lead.termen ? getTimelineLabel(lead.termen) : ''),
    line('Finanțare', lead.finantare ? getFinancingLabel(lead.finantare) : ''),
    line('Poze', lead.poze),
  ].filter(Boolean);

  const contactLines = [
    lead.numeContact,
    lead.numeCompanie,
    lead.telefon,
    lead.email,
  ]
    .map((s) => (s || '').trim())
    .filter(Boolean);

  const parts: string[] = [header, '', ...(locatie as string[])];

  if (specs.length) {
    parts.push('', ...(specs as string[]));
  }

  if (contactLines.length) {
    parts.push('', 'Contact:', ...contactLines);
  }

  if (lead.preselectedCompany?.trim()) {
    parts.push('', `Firma solicitată inițial: ${lead.preselectedCompany.trim()}`);
  }

  if (lead.mesaj?.trim()) {
    parts.push('', 'Mesajul clientului:', lead.mesaj.trim());
  }

  if (lead.notes?.length) {
    parts.push('', 'Note interne CRM:');
    for (const n of lead.notes) {
      const day = fmtNoteDate(n.date);
      const when = [day, n.time].filter(Boolean).join(' ');
      parts.push(when ? `${when} — ${n.text}` : n.text);
    }
  }

  return parts.join('\n');
}
