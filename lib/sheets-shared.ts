// Tipuri și constante din pipeline-ul de CRM, importabile din componente
// client. `lib/sheets` trage googleapis după el, deci NU se importă din client.
// Vezi disciplina de bundle din CLAUDE.md.

export const LEAD_STATUSES = ['nou', 'sunat', 'hot', 'cold', 'contract'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export interface LeadNote {
  date: string; // YYYY-MM-DD
  text: string;
}
