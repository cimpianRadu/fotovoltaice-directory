// Campania de parteneri furnizori (23 nov 2026): tabelul `campanie_furnizori`
// din Neon, citit de /admin/campanie. Rutina locală scrie în el prin
// scripts/campanie-furnizori.mjs; butoanele lui Radu trec prin
// /api/admin/campanie. Ținta, ritmul și textele: data/campanie-furnizori.json.

import 'server-only';
import { db } from './db';
import config from '@/data/campanie-furnizori.json';

export const CAMPANIE_TINTA: number = config.tinta;

export type Pas = 'fu1' | 'fu2' | 'fu3';
export const PASI: Pas[] = ['fu1', 'fu2', 'fu3'];

export type StatusCampanie = 'activ' | 'a_raspuns' | 'oprit' | 'respins' | 'semnat' | 'refuzat' | 'manual';

export interface FirmaCampanie {
  id: number;
  firma: string;
  email: string;
  sursa: 'outbound' | 'inbound';
  subiect: string;
  primulEmail: string;
  plan: Record<Pas, string | null>;
  trimis: Record<Pas, string | null>;
  status: StatusCampanie;
  raspunsLa: string | null;
  raspunsDupa: 'email' | Pas | null;
  nota: string;
}

type Row = Record<string, string | number | null>;

function mapRow(r: Row): FirmaCampanie {
  const s = (k: string) => (r[k] == null ? null : String(r[k]));
  return {
    id: Number(r.id),
    firma: String(r.firma),
    email: String(r.email),
    sursa: r.sursa === 'inbound' ? 'inbound' : 'outbound',
    subiect: String(r.subiect),
    primulEmail: String(r.primul_email),
    plan: { fu1: s('fu1_plan'), fu2: s('fu2_plan'), fu3: s('fu3_plan') },
    trimis: { fu1: s('fu1_trimis'), fu2: s('fu2_trimis'), fu3: s('fu3_trimis') },
    status: String(r.status) as StatusCampanie,
    raspunsLa: s('raspuns_la'),
    raspunsDupa: (s('raspuns_dupa') as FirmaCampanie['raspunsDupa']) ?? null,
    nota: String(r.nota ?? ''),
  };
}

/** Datele ies ca text (AAAA-LL-ZZ), ca fusul orar al funcției să nu mute ziua. */
export async function getCampanie(): Promise<FirmaCampanie[]> {
  const rows = (await db()`
    SELECT id, firma, email, sursa, subiect, primul_email::text,
           fu1_plan::text, fu1_trimis::text, fu2_plan::text, fu2_trimis::text, fu3_plan::text, fu3_trimis::text,
           status, raspuns_la::text, raspuns_dupa, nota
    FROM campanie_furnizori ORDER BY primul_email DESC, id`) as Row[];
  return rows.map(mapRow);
}

/** Ultimul mesaj trimis firmei: primul email sau un follow-up. */
export function ultimulPas(f: FirmaCampanie): 'email' | Pas {
  return [...PASI].reverse().find((p) => f.trimis[p]) ?? 'email';
}

/** Următorul follow-up, doar pentru firmele active. */
export function urmatorul(f: FirmaCampanie): { pas: Pas; data: string } | null {
  if (f.status !== 'activ') return null;
  const pas = PASI.find((p) => !f.trimis[p]);
  return pas && f.plan[pas] ? { pas, data: f.plan[pas]! } : null;
}

export interface MetriciCampanie {
  contactate: number;
  emailuriTrimise: number;
  followUpTrimise: number;
  auRaspuns: number;
  semnate: number;
  refuzate: number;
  respinse: number;
  inCurs: number;
  faraRaspunsLaFinal: number;
  raspunsuriPePas: Record<'email' | Pas, number>;
  parteneri: number;
}

/** Cifrele campaniei. Ratele se calculează pe firmele contactate de noi (outbound). */
export function metrici(firme: FirmaCampanie[]): MetriciCampanie {
  const out = firme.filter((f) => f.sursa === 'outbound');
  const raspunsuriPePas = { email: 0, fu1: 0, fu2: 0, fu3: 0 };
  let followUpTrimise = 0;
  for (const f of out) {
    followUpTrimise += PASI.filter((p) => f.trimis[p]).length;
    if (f.raspunsDupa) raspunsuriPePas[f.raspunsDupa] += 1;
  }
  return {
    contactate: out.length,
    emailuriTrimise: out.length + followUpTrimise,
    followUpTrimise,
    auRaspuns: out.filter((f) => f.raspunsLa).length,
    semnate: out.filter((f) => f.status === 'semnat').length,
    refuzate: out.filter((f) => f.status === 'refuzat').length,
    respinse: out.filter((f) => f.status === 'respins').length,
    inCurs: out.filter((f) => f.status === 'activ' && !f.trimis.fu3).length,
    faraRaspunsLaFinal: out.filter((f) => f.status === 'activ' && f.trimis.fu3).length,
    raspunsuriPePas,
    parteneri: firme.filter((f) => f.status === 'semnat').length,
  };
}

export type ActiuneCampanie = 'reia' | 'oprit' | 'a_raspuns' | 'semnat' | 'refuzat';
export const ACTIUNI: ActiuneCampanie[] = ['reia', 'oprit', 'a_raspuns', 'semnat', 'refuzat'];

/**
 * Butoanele din /admin/campanie. „a_raspuns”, „semnat” și „refuzat” notează și
 * răspunsul, dacă rutina nu l-a prins încă (după ultimul mesaj trimis).
 */
export async function aplicaActiune(id: number, actiune: ActiuneCampanie): Promise<void> {
  const sql = db();
  const [row] = (await sql`
    SELECT id, firma, email, sursa, subiect, primul_email::text,
           fu1_plan::text, fu1_trimis::text, fu2_plan::text, fu2_trimis::text, fu3_plan::text, fu3_trimis::text,
           status, raspuns_la::text, raspuns_dupa, nota
    FROM campanie_furnizori WHERE id = ${id}`) as Row[];
  if (!row) throw new Error('Firma nu există.');
  const f = mapRow(row);
  if (actiune === 'reia' || actiune === 'oprit') {
    const status = actiune === 'reia' ? 'activ' : 'oprit';
    await sql`UPDATE campanie_furnizori SET status = ${status}, actualizat_la = now() WHERE id = ${id}`;
    return;
  }
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Bucharest' }).format(new Date());
  const raspunsLa = f.raspunsLa ?? today;
  const raspunsDupa = f.raspunsDupa ?? ultimulPas(f);
  await sql`
    UPDATE campanie_furnizori
    SET status = ${actiune}, raspuns_la = ${raspunsLa}, raspuns_dupa = ${raspunsDupa}, actualizat_la = now()
    WHERE id = ${id}`;
}
