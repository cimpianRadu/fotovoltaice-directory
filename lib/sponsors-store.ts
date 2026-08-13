import 'server-only';

import { promises as fs } from 'fs';
import path from 'path';
import bundledSponsors from '@/data/sponsors.json';
import bundledPartners from '@/data/partners.json';
import { SPONSOR_POSITIONS, type SponsorPosition } from './sponsor-positions';

/**
 * Sursa adevărului pentru parteneri rămâne perechea de fișiere JSON din repo
 * (`data/sponsors.json` + `data/partners.json`), pentru că site-ul public le
 * importă static la build — exact disciplina care ține bundle-ul client mic.
 *
 * Panoul din /admin/sponsori nu schimbă asta, schimbă doar cine scrie
 * fișierele:
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
const PARTNERS_PATH = 'data/partners.json';

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
  phone?: string;
  whatsapp?: string;
  facebook?: string;
}

export interface CarouselPartner {
  slug: string;
  name: string;
  description: string;
  cta: string;
  logo: string;
  url: string;
  active: boolean;
}

export interface CarouselFile {
  maxActive: number;
  rotationSeconds: number;
  partners: CarouselPartner[];
}

export interface SponsorData {
  sponsors: BannerSponsor[];
  carousel: CarouselFile;
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

/** Aceeași serializare ca fișierele existente: 2 spații + newline la final. */
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

function parseData(sponsorsRaw: string, partnersRaw: string): SponsorData {
  return {
    sponsors: (JSON.parse(sponsorsRaw) as { sponsors: BannerSponsor[] }).sponsors,
    carousel: JSON.parse(partnersRaw) as CarouselFile,
  };
}

function bundledData(): SponsorData {
  // Clonă, ca nimeni să nu poată muta din greșeală singletonul importat.
  return structuredClone({
    sponsors: bundledSponsors.sponsors as BannerSponsor[],
    carousel: bundledPartners as CarouselFile,
  });
}

export async function readSponsorData(): Promise<{ data: SponsorData; meta: StoreMeta }> {
  const mode = resolveMode();

  if (mode === 'fs') {
    const [s, p] = await Promise.all([
      fs.readFile(abs(SPONSORS_PATH), 'utf8'),
      fs.readFile(abs(PARTNERS_PATH), 'utf8'),
    ]);
    return { data: parseData(s, p), meta: { mode, writable: true } };
  }

  if (mode === 'github') {
    try {
      const [s, p] = await Promise.all([
        ghReadFile(SPONSORS_PATH, GH_BRANCH),
        ghReadFile(PARTNERS_PATH, GH_BRANCH),
      ]);
      return { data: parseData(s, p), meta: { mode, writable: true } };
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
 * poată strecura chei străine în fișierele din repo. Slug-urile sunt chei de
 * analytics și de preview, deci nu se pot schimba de aici: setul primit
 * trebuie să fie exact setul existent, iar ordinea rămâne cea din fișier.
 */
function validateAndNormalize(input: SponsorData, current: SponsorData): SponsorData {
  const issues: string[] = [];

  const bySlug = <T extends { slug: string }>(list: T[], label: string, currentList: { slug: string }[]) => {
    const map = new Map<string, T>();
    for (const item of list ?? []) {
      const slug = clean(item?.slug);
      if (!slug) {
        issues.push(`${label}: intrare fără slug`);
        continue;
      }
      if (map.has(slug)) issues.push(`${label} ${slug}: slug duplicat`);
      map.set(slug, item);
    }
    const currentSlugs = new Set(currentList.map((c) => c.slug));
    for (const slug of map.keys()) {
      if (!currentSlugs.has(slug)) issues.push(`${label} ${slug}: nu există în fișier (adăugarea se face din cod)`);
    }
    for (const slug of currentSlugs) {
      if (!map.has(slug)) issues.push(`${label} ${slug}: lipsește din payload (ștergerea se face din cod)`);
    }
    return map;
  };

  const sponsorsIn = bySlug(input.sponsors, 'banner', current.sponsors);
  const partnersIn = bySlug(input.carousel?.partners, 'popup', current.carousel.partners);

  const sponsors: BannerSponsor[] = current.sponsors.map((cur) => {
    const raw = sponsorsIn.get(cur.slug);
    if (!raw) return cur;
    const where = `banner ${cur.slug}`;

    const name = clean(raw.name);
    if (!name) issues.push(`${where}: numele nu poate fi gol`);

    const baseUrl = clean(raw.baseUrl);
    if (!isHttpUrl(baseUrl)) issues.push(`${where}: site-ul trebuie să fie un URL http(s) valid`);

    const messagesClient = clean(raw.messages?.client);
    if (!messagesClient) issues.push(`${where}: mesajul pentru clienți nu poate fi gol`);
    const messagesInstalator = clean(raw.messages?.instalator);

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

    // Ordinea cheilor e cea din fișierele existente: obiectul se serializează
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
      ...(phone ? { phone } : {}),
      ...(whatsapp ? { whatsapp } : {}),
      ...(facebook ? { facebook } : {}),
    };
  });

  const partners: CarouselPartner[] = current.carousel.partners.map((cur) => {
    const raw = partnersIn.get(cur.slug);
    if (!raw) return cur;
    const where = `popup ${cur.slug}`;

    const name = clean(raw.name);
    if (!name) issues.push(`${where}: numele nu poate fi gol`);
    const description = clean(raw.description);
    if (!description) issues.push(`${where}: descrierea nu poate fi goală`);
    const cta = clean(raw.cta);
    if (!cta) issues.push(`${where}: CTA-ul nu poate fi gol`);
    const url = clean(raw.url);
    if (!isHttpUrl(url)) issues.push(`${where}: URL-ul trebuie să fie http(s) valid`);

    return { slug: cur.slug, name, description, cta, logo: cur.logo, url, active: Boolean(raw.active) };
  });

  const maxActive = Number(input.carousel?.maxActive);
  if (!Number.isInteger(maxActive) || maxActive < 1 || maxActive > 20)
    issues.push('popup: „max activi" trebuie să fie un întreg între 1 și 20');
  const rotationSeconds = Number(input.carousel?.rotationSeconds);
  if (!Number.isInteger(rotationSeconds) || rotationSeconds < 5 || rotationSeconds > 120)
    issues.push('popup: rotația trebuie să fie un întreg între 5 și 120 de secunde');

  if (issues.length > 0) throw new SponsorValidationError(issues);

  return { sponsors, carousel: { maxActive, rotationSeconds, partners } };
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

  const walk = <T extends { slug: string; active: boolean }>(
    label: string,
    from: T[],
    to: T[],
  ) => {
    const before = new Map(from.map((s) => [s.slug, s]));
    for (const item of to) {
      const prev = before.get(item.slug);
      if (!prev) continue;
      const fields = changedFields(prev, item);
      if (fields.length === 0) continue;
      if (prev.active !== item.active) {
        const rest = fields.filter((f) => f !== 'active');
        changes.push(
          `${label} ${item.slug}: ${item.active ? 'activat' : 'dezactivat'}${rest.length ? ` + ${rest.join(', ')}` : ''}`,
        );
      } else {
        changes.push(`${label} ${item.slug}: ${fields.join(', ')}`);
      }
    }
  };

  walk('banner', current.sponsors, next.sponsors);
  walk('popup', current.carousel.partners, next.carousel.partners);

  if (current.carousel.maxActive !== next.carousel.maxActive)
    changes.push(`popup: maxActive ${current.carousel.maxActive}→${next.carousel.maxActive}`);
  if (current.carousel.rotationSeconds !== next.carousel.rotationSeconds)
    changes.push(`popup: rotație ${current.carousel.rotationSeconds}s→${next.carousel.rotationSeconds}s`);

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
    const [s, p] = await Promise.all([
      ghReadFile(SPONSORS_PATH, headSha),
      ghReadFile(PARTNERS_PATH, headSha),
    ]);
    current = parseData(s, p);
  } else {
    const [s, p] = await Promise.all([
      fs.readFile(abs(SPONSORS_PATH), 'utf8'),
      fs.readFile(abs(PARTNERS_PATH), 'utf8'),
    ]);
    current = parseData(s, p);
  }

  const next = validateAndNormalize(input, current);
  const changes = summarizeChanges(current, next);
  if (changes.length === 0) return { changed: false, mode };

  const files: { path: string; content: string }[] = [];
  const nextSponsors = serialize({ sponsors: next.sponsors });
  if (nextSponsors !== serialize({ sponsors: current.sponsors }))
    files.push({ path: SPONSORS_PATH, content: nextSponsors });
  const nextCarousel = serialize(next.carousel);
  if (nextCarousel !== serialize(current.carousel))
    files.push({ path: PARTNERS_PATH, content: nextCarousel });

  if (mode === 'fs') {
    await Promise.all(files.map((f) => fs.writeFile(abs(f.path), f.content)));
    return { changed: true, mode, changes };
  }

  const headCommit = await ghFetch<{ tree: { sha: string } }>(
    `/repos/${GH_REPO_FULL}/git/commits/${headSha}`,
  );
  const tree = await ghFetch<{ sha: string }>(`/repos/${GH_REPO_FULL}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({
      base_tree: headCommit.tree.sha,
      tree: files.map((f) => ({ path: f.path, mode: '100644', type: 'blob', content: f.content })),
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
