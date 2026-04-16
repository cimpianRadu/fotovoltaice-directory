import { NextResponse } from 'next/server';
import https from 'https';

const agent = new https.Agent({ rejectUnauthorized: false });

async function fetchAnre(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    https.get(url, { agent }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Invalid JSON from ANRE')); }
      });
    }).on('error', reject);
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');

  if (!text || text.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const params = new URLSearchParams({
      text,
      'filter[logic]': 'and',
      'filter[filters][0][value]': text.toLowerCase(),
      'filter[filters][0][field]': 'Nume',
      'filter[filters][0][operator]': 'contains',
      'filter[filters][0][ignoreCase]': 'true',
    });

    const data = await fetchAnre(
      `https://portal.anre.ro/PublicLists/LicenteAutorizatii/GetAgenti?${params}`
    );

    return NextResponse.json(data);
  } catch (err) {
    console.error('ANRE search error:', err);
    return NextResponse.json(
      { error: 'Nu s-a putut contacta portalul ANRE. Încercați din nou.' },
      { status: 502 }
    );
  }
}
