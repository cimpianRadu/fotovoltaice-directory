// Tipuri și constante din pipeline-ul de CRM, importabile din componente
// client. `lib/sheets` trage googleapis după el, deci NU se importă din client.
// Vezi disciplina de bundle din CLAUDE.md.

// Starea cererii = ce mai poți face cu ea. Valorile se stochează fără
// diacritice, ca să treacă curat prin query string; eticheta afișată e separată.
export const LEAD_STATUSES = [
  'noua',
  'valida',
  'ofertare',
  'castigata',
  'altundeva',
  'renuntat',
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  noua: 'nouă',
  valida: 'validă',
  ofertare: 'în ofertare',
  castigata: 'câștigată',
  altundeva: 'altundeva',
  renuntat: 'renunțat',
};

export const LEAD_STATUS_HINTS: Record<LeadStatus, string> = {
  noua: 'intrată, neverificată cu clientul',
  valida: 'am vorbit cu el, încă vrea ofertă',
  ofertare: 'o firmă discută deja cu el',
  castigata: 'a semnat, printr-o firmă de la noi',
  altundeva: 'și-a rezolvat în afara platformei',
  renuntat: 'nu mai face investiția',
};

// Ortogonal față de stare: o cerere poate fi „altundeva" ȘI necontactată, iar
// combinația aia e alarma, nu concurență pierdută. Gol = încă neverificat.
export const CONTACT_STATES = ['da', 'nu'] as const;
export type ContactState = (typeof CONTACT_STATES)[number] | '';

export interface LeadNote {
  date: string; // YYYY-MM-DD
  text: string;
}
