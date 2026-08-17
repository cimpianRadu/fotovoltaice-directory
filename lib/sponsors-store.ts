import 'server-only';

import { promises as fs } from 'fs';
import path from 'path';
import bundledSponsors from '@/data/sponsors.json';
import { SPONSOR_POSITIONS, type SponsorPosition } from './sponsor-positions';

/**
 * Sursa adevărului pentru parteneri e un singur fișier JSON din repo
 * (`data/sponsors.json`), pentru că site-ul public îl importă static la build —
 * exact disciplina care ține bundle-ul client mic. Un partener e o singură
 * intrare: bannerul și popup-ul dreapta-jos sunt doar plasări (`positions`),
 * popup-ul fiind plasarea `"popup"`.
 *
 * Panoul din /admin/sponsori nu schimbă asta, schimbă doar cine scrie
 * fișierul:
 *  - local (dev): direct pe disc, în working tree — se comportă ca o editare
 *    de mână, dev-ul o vede instant prin HMR, commit-ul rămâne pe fluxul
 *    normal de git;
 *  - pe Vercel: un commit pe branch prin API-ul GitHub, care pornește singur
 *    deploy-ul; schimbarea e live în ~2 minute, iar istoria git păstrează
 *    fiecare modificare de sponsor, cu mesaj care spune ce s-a schimbat.
 *  - pe Vercel FĂRĂ `GITHUB_TOKEN`: citim snapshotul din build și pagina
 *    devine doar de citit, cu instrucțiunile de configurare la vedere.
 *
 * Alternativa (o bază de date sau un tab de Sheets citit la runtime) ar fi
 * mutat un slot monetizat de pe date statice pe un fetch la fiecare vizită.
 */

const SPONSORS_PATH = 'data/sponsors.json';

const GH_REPO_FULL = process.env.GITHUB_REPO ?? 'cimpianRadu/fotovoltaice-directory';
const GH_BRANCH = process.env.GITHUB_BRANCH ?? 'main';

export interface BannerSponsor {
  slug: string;
  name: string;
  location: string;
  logo: string;
  baseUrl: string;
  active: boolean;
  positions: SponsorPosition[] | 'all';
  messages: { client: string; instalator?: string };
  /** Rândul amber din popup-ul dreapta-jos; bannerul nu îl afișează. */
  cta?: string;
  phone?: string;
  whatsapp?: string;
  facebook?: string;
}

export interface PopupConfig {
  rotationSeconds: number;
}

export interface SponsorData {
  popup: PopupConfig;
  sponsors: BannerSponsor[];
}

export type StoreMode = 'fs' | 'github' | 'bundled';

export interface StoreMeta {
  mode: StoreMode;
  writable: boolean;
  /** Setat când citirea din GitHub a picat și s-a căzut pe snapshotul din build. */
  error?: string;
}

export class SponsorValidationError extends Error {
  constructor(public issues: string[]) {
    super(issues.join('; '));
    this.name = 'SponsorValidationError';
  }
}

/** Branch-ul s-a mișcat între citire și salvare; clientul trebuie să reîncarce. */
export class SponsorConflictError extends Error {
  constructor() {
    super('Repo-ul s-a schimbat între citire și salvare.');
    this.name = 'SponsorConflictError';
  }
}

function resolveMode(): StoreMode {
  // Override explicit, folosit de scripturile de test ca să exerseze calea
  // GitHub de pe mașina locală (cu GITHUB_BRANCH pe un branch de probă).
  if (process.env.SPONSORS_STORE_MODE === 'github') return 'github';
  if (process.env.SPONSORS_STORE_MODE === 'fs') return 'fs';
  if (!process.env.VERCEL) return 'fs';
  return process.env.GITHUB_TOKEN ? 'github' : 'bundled';
}

const abs = (rel: string) => path.join(process.cwd(), rel);

/** Aceeași serializare ca fișierul existent: 2 spații + newline la final. */
const serialize = (value: unknown) => JSON.stringify(value, null, 2) + '\n';

interface GhError extends Error {
  status?: number;
}

async function ghFetch<T>(pathname: string, init?: RequestInit): Promise<T> {
  const token = process.env.GITHUB_TOKEN;
  const res = await fetch(`https://api.github.com${pathname}`, {
    ...init,
    headers: {
      // Fără token, citirile pe repo public merg anonim; un `Bearer undefined`
      // ar transforma lipsa tokenului în 401 pe toate cererile.
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      // GitHub refuză cererile fără User-Agent, iar fetch-ul din Node nu pune unul.
      'User-Agent': 'instalatori-fotovoltaice-admin',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err: GhError = new Error(
      `GitHub ${init?.method ?? 'GET'} ${pathname}: ${res.status} ${body.slice(0, 200)}`,
    );
    err.status = res.status;
    throw err;
  }
  // 204 nu are corp; nu apare pe rutele folosite aici, dar nu ne bazăm pe asta.
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

async function ghReadFile(filePath: string, ref: string): Promise<string> {
  const data = await ghFetch<{ content: string }>(
    `/repos/${GH_REPO_FULL}/contents/${filePath}?ref=${encodeURIComponent(ref)}`,
  );
  return Buffer.from(data.content, 'base64').toString('utf8');
}

function parseData(raw: string): SponsorData {
  return JSON.parse(raw) as SponsorData;
}

function bundledData(): SponsorData {
  // Clonă, ca nimeni să nu poată muta din greșeală singletonul importat.
  return structuredClone(bundledSponsors as unknown as SponsorData);
}

export async function readSponsorData(): Promise<{ data: SponsorData; meta: StoreMeta }> {
  const mode = resolveMode();

  if (mode === 'fs') {
    const raw = await fs.readFile(abs(SPONSORS_PATH), 'utf8');
    return { data: parseData(raw), meta: { mode, writable: true } };
  }

  if (mode === 'github') {
    try {
      const raw = await ghReadFile(SPONSORS_PATH, GH_BRANCH);
      return { data: parseData(raw), meta: { mode, writable: true } };
    } catch (err) {
      // Token expirat sau fără permisiuni: pagina rămâne utilă ca vizualizare
      // a datelor din build, cu eroarea la vedere, în loc să crape.
      const message = err instanceof Error ? err.message : String(err);
      console.error('Sponsor store: citirea din GitHub a picat:', message);
      return { data: bundledData(), meta: { mode: 'bundled', writable: false, error: message } };
    }
  }

  return { data: bundledData(), meta: { mode: 'bundled', writable: false } };
}

// ---------- validare + normalizare ----------

const isHttpUrl = (value: string) => {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
};

const clean = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

/**
 * Construiește obiectele câmp cu câmp, ca un client stricat (sau ostil) să nu
 * poată strecura chei străine în fișierul din repo. Slug-urile sunt chei de
 * analytics și de preview, deci nu se pot schimba de aici: setul primit
 * trebuie să fie exact setul existent, iar ordinea rămâne cea din fișier.
 */
function validateAndNormalize(input: SponsorData, current: SponsorData): SponsorData {
  const issues: string[] = [];

  const bySlug = new Map<string, BannerSponsor>();
  for (const item of input.sponsors ?? []) {
    const slug = clean(item?.slug);
    if (!slug) {
      issues.push('partener fără slug');
      continue;
    }
    if (bySlug.has(slug)) issues.push(`${slug}: slug duplicat`);
    bySlug.set(slug, item);
  }
  const currentSlugs = new Set(current.sponsors.map((c) => c.slug));
  for (const slug of bySlug.keys()) {
    if (!currentSlugs.has(slug)) issues.push(`${slug}: nu există în fișier (adăugarea se face din cod)`);
  }
  for (const slug of currentSlugs) {
    if (!bySlug.has(slug)) issues.push(`${slug}: lipsește din payload (ștergerea se face din cod)`);
  }

  const sponsors: BannerSponsor[] = current.sponsors.map((cur) => {
    const raw = bySlug.get(cur.slug);
    if (!raw) return cur;
    const where = cur.slug;

    const name = clean(raw.name);
    if (!name) issues.push(`${where}: numele nu poate fi gol`);

    const baseUrl = clean(raw.baseUrl);
    if (!isHttpUrl(baseUrl)) issues.push(`${where}: site-ul trebuie să fie un URL http(s) valid`);

    const messagesClient = clean(raw.messages?.client);
    if (!messagesClient) issues.push(`${where}: mesajul pentru clienți nu poate fi gol`);
    const messagesInstalator = clean(raw.messages?.instalator);

    const cta = clean(raw.cta);

    const phone = clean(raw.phone);
    if (phone && !/^[+\d][\d\s]{7,19}$/.test(phone))
      issues.push(`${where}: telefonul are format neașteptat (cifre și spații, ex: 0763 990 097)`);

    const whatsapp = clean(raw.whatsapp);
    if (whatsapp && !/^\d{8,15}$/.test(whatsapp))
      issues.push(`${where}: WhatsApp = doar cifre cu prefix de țară, fără + sau spații (ex: 40763990097)`);

    const facebook = clean(raw.facebook);
    if (facebook && !isHttpUrl(facebook)) issues.push(`${where}: linkul de Facebook trebuie să fie URL complet`);

    let positions: BannerSponsor['positions'];
    if (raw.positions === 'all') {
      positions = 'all';
    } else if (Array.isArray(raw.positions)) {
      const valid = raw.positions.filter((p): p is SponsorPosition =>
        (SPONSOR_POSITIONS as readonly string[]).includes(p),
      );
      const invalid = raw.positions.filter((p) => !(SPONSOR_POSITIONS as readonly string[]).includes(p));
      if (invalid.length > 0) issues.push(`${where}: plasări necunoscute: ${invalid.join(', ')}`);
      if (valid.length === 0) issues.push(`${where}: cel puțin o plasare (sau „toate")`);
      // Ordinea canonică, ca diff-urile pe fișier să nu depindă de ordinea bifării.
      positions = SPONSOR_POSITIONS.filter((p) => valid.includes(p));
    } else {
      issues.push(`${where}: plasări lipsă`);
      positions = cur.positions;
    }

    // Cine apare în popup are nevoie de rândul CTA; restul îl pot lăsa gol.
    const inPopup = positions === 'all' || positions.includes('popup');
    if (inPopup && !cta) issues.push(`${where}: CTA-ul de popup nu poate fi gol cât timp popup-ul e bifat`);

    // Ordinea cheilor e cea din fișierul existent: obiectul se serializează
    // înapoi în git, iar o ordine diferită ar umple diff-urile cu reordonări.
    return {
      slug: cur.slug,
      name,
      location: clean(raw.location),
      logo: cur.logo, // logo-ul cere fișier în repo, se schimbă din cod
      baseUrl,
      active: Boolean(raw.active),
      positions,
      // Mesajul de instalatori gol dispare din fișier de tot: componenta cade
      // atunci pe mesajul de clienți, pe când un string gol s-ar afișa gol.
      messages: messagesInstalator
        ? { client: messagesClient, instalator: messagesInstalator }
        : { client: messagesClient },
      ...(cta ? { cta } : {}),
      ...(phone ? { phone } : {}),
      ...(whatsapp ? { whatsapp } : {}),
      ...(facebook ? { facebook } : {}),
    };
  });

  const rotationSeconds = Number(input.popup?.rotationSeconds);
  if (!Number.isInteger(rotationSeconds) || rotationSeconds < 5 || rotationSeconds > 120)
    issues.push('popup: rotația trebuie să fie un întreg între 5 și 120 de secunde');

  if (issues.length > 0) throw new SponsorValidationError(issues);

  return { popup: { rotationSeconds }, sponsors };
}

// ---------- diff pentru mesajul de commit și pentru UI ----------

function changedFields(a: object, b: object): string[] {
  const ra = a as Record<string, unknown>;
  const rb = b as Record<string, unknown>;
  const keys = new Set([...Object.keys(ra), ...Object.keys(rb)]);
  return [...keys].filter((key) => JSON.stringify(ra[key]) !== JSON.stringify(rb[key]));
}

export function summarizeChanges(current: SponsorData, next: SponsorData): string[] {
  const changes: string[] = [];

  const before = new Map(current.sponsors.map((s) => [s.slug, s]));
  for (const item of next.sponsors) {
    const prev = before.get(item.slug);
    if (!prev) continue;
    const fields = changedFields(prev, item);
    if (fields.length === 0) continue;
    if (prev.active !== item.active) {
      const rest = fields.filter((f) => f !== 'active');
      changes.push(
        `${item.slug}: ${item.active ? 'activat' : 'dezactivat'}${rest.length ? ` + ${rest.join(', ')}` : ''}`,
      );
    } else {
      changes.push(`${item.slug}: ${fields.join(', ')}`);
    }
  }

  if (current.popup.rotationSeconds !== next.popup.rotationSeconds)
    changes.push(`popup: rotație ${current.popup.rotationSeconds}s→${next.popup.rotationSeconds}s`);

  return changes;
}

function commitMessage(changes: string[]): string {
  const subject =
    changes.length === 1 && changes[0].length <= 60
      ? `Sponsori din admin: ${changes[0]}`
      : 'Sponsori: modificări din /admin/sponsori';
  const body = changes.length > 1 ? `\n\n${changes.map((c) => `- ${c}`).join('\n')}` : '';
  return subject + body;
}

// ---------- scriere ----------

export type WriteResult =
  | { changed: false; mode: StoreMode }
  | { changed: true; mode: 'fs'; changes: string[] }
  | { changed: true; mode: 'github'; changes: string[]; commitSha: string; commitUrl: string };

export async function writeSponsorData(input: SponsorData): Promise<WriteResult> {
  const mode = resolveMode();
  if (mode === 'bundled') {
    throw new Error('GITHUB_TOKEN lipsește pe Vercel, nu am unde salva. Vezi instrucțiunile de pe pagină.');
  }

  // Starea curentă se citește chiar acum, nu se ia din client: diff-ul (și,
  // pe GitHub, părintele commit-ului) trebuie ancorate în ce există efectiv.
  let current: SponsorData;
  let headSha = '';
  if (mode === 'github') {
    const ref = await ghFetch<{ object: { sha: string } }>(
      `/repos/${GH_REPO_FULL}/git/ref/${encodeURIComponent(`heads/${GH_BRANCH}`)}`,
    );
    headSha = ref.object.sha;
    current = parseData(await ghReadFile(SPONSORS_PATH, headSha));
  } else {
    current = parseData(await fs.readFile(abs(SPONSORS_PATH), 'utf8'));
  }

  const next = validateAndNormalize(input, current);
  const changes = summarizeChanges(current, next);
  if (changes.length === 0) return { changed: false, mode };

  const content = serialize({ popup: next.popup, sponsors: next.sponsors });

  if (mode === 'fs') {
    await fs.writeFile(abs(SPONSORS_PATH), content);
    return { changed: true, mode, changes };
  }

  const headCommit = await ghFetch<{ tree: { sha: string } }>(
    `/repos/${GH_REPO_FULL}/git/commits/${headSha}`,
  );
  const tree = await ghFetch<{ sha: string }>(`/repos/${GH_REPO_FULL}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({
      base_tree: headCommit.tree.sha,
      tree: [{ path: SPONSORS_PATH, mode: '100644', type: 'blob', content }],
    }),
  });
  const commit = await ghFetch<{ sha: string; html_url: string }>(
    `/repos/${GH_REPO_FULL}/git/commits`,
    {
      method: 'POST',
      body: JSON.stringify({ message: commitMessage(changes), tree: tree.sha, parents: [headSha] }),
    },
  );
  try {
    await ghFetch(`/repos/${GH_REPO_FULL}/git/refs/${encodeURIComponent(`heads/${GH_BRANCH}`)}`, {
      method: 'PATCH',
      body: JSON.stringify({ sha: commit.sha, force: false }),
    });
  } catch (err) {
    // Non fast-forward: cineva a împins între citire și salvare. Commit-ul
    // rămâne orfan (GitHub îl curăță singur), clientul reîncarcă și reaplică.
    if ((err as GhError).status === 422 || (err as GhError).status === 409)
      throw new SponsorConflictError();
    throw err;
  }

  return { changed: true, mode, changes, commitSha: commit.sha, commitUrl: commit.html_url };
}
