const UMAMI_API_BASE = 'https://api.umami.is/v1';
const WEBSITE_ID = '49a078c7-23dc-4a96-9c37-73bb15e9b7ba';
const REVALIDATE_SECONDS = 3600;

async function umamiFetch<T>(
  path: string,
  params: Record<string, string | number> = {},
): Promise<T> {
  const apiKey = process.env.UMAMI_API_KEY;
  if (!apiKey) throw new Error('UMAMI_API_KEY missing');

  const url = new URL(`${UMAMI_API_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  const res = await fetch(url.toString(), {
    headers: { 'x-umami-api-key': apiKey, accept: 'application/json' },
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!res.ok) {
    throw new Error(`Umami ${res.status} on ${path}: ${await res.text().catch(() => res.statusText)}`);
  }
  return res.json() as Promise<T>;
}

export type StatsBlock = {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
};

export type StatsResponse = StatsBlock & {
  comparison?: StatsBlock;
};

export type MetricRow = { x: string; y: number };

export type MetricType =
  | 'url'
  | 'path'
  | 'referrer'
  | 'title'
  | 'query'
  | 'event'
  | 'browser'
  | 'os'
  | 'device'
  | 'country'
  | 'region'
  | 'city'
  | 'language'
  | 'host';

export async function getStats(startAt: number, endAt: number) {
  return umamiFetch<StatsResponse>(`/websites/${WEBSITE_ID}/stats`, { startAt, endAt });
}

export async function getMetrics(
  startAt: number,
  endAt: number,
  type: MetricType = 'path',
  limit = 30,
) {
  return umamiFetch<MetricRow[]>(`/websites/${WEBSITE_ID}/metrics`, {
    startAt,
    endAt,
    type,
    limit,
  });
}

export type RangePreset = 'this-month' | 'last-month' | 'last-30d' | 'last-7d';

export function resolveRange(preset: RangePreset): { startAt: number; endAt: number; label: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  switch (preset) {
    case 'this-month': {
      const startAt = new Date(y, m, 1).getTime();
      const endAt = now.getTime();
      return { startAt, endAt, label: 'Luna curentă' };
    }
    case 'last-month': {
      const startAt = new Date(y, m - 1, 1).getTime();
      const endAt = new Date(y, m, 1).getTime() - 1;
      return { startAt, endAt, label: 'Luna trecută' };
    }
    case 'last-30d': {
      const endAt = now.getTime();
      const startAt = endAt - 30 * 24 * 60 * 60 * 1000;
      return { startAt, endAt, label: 'Ultimele 30 zile' };
    }
    case 'last-7d': {
      const endAt = now.getTime();
      const startAt = endAt - 7 * 24 * 60 * 60 * 1000;
      return { startAt, endAt, label: 'Ultimele 7 zile' };
    }
  }
}

export function formatDuration(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0s';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export function pctDelta(current: number, prev: number): { value: number; sign: '+' | '-' | '' } {
  if (!prev) return { value: 0, sign: '' };
  const diff = ((current - prev) / prev) * 100;
  if (Math.abs(diff) < 0.5) return { value: 0, sign: '' };
  return { value: Math.abs(Math.round(diff)), sign: diff > 0 ? '+' : '-' };
}
