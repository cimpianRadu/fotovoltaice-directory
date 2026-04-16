import { NextResponse } from 'next/server';
import https from 'https';

const agent = new https.Agent({ rejectUnauthorized: false });

async function postAnre(url: string, body: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      agent,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Invalid JSON from ANRE')); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agentId');

  if (!agentId) {
    return NextResponse.json({ error: 'agentId is required' }, { status: 400 });
  }

  try {
    const formData = new URLSearchParams({
      'Agents[0].IdAgentEconomic': agentId,
      'AtestateTypes[0].IdTipAtestare': '1',
      'sort': '',
      'page': '1',
      'pageSize': '100',
      'group': '',
      'filter': '',
    });

    const raw = await postAnre(
      'https://portal.anre.ro/PublicLists/Atestate/GetAtestate?menu=Energy',
      formData.toString()
    ) as { Data?: Record<string, string | null>[] };

    // Parse the HTML "Detaliu" field into structured certificate data
    const results = (raw.Data || []).map((item: Record<string, string | null>) => {
      const certificates = parseDetaliu(item.Detaliu || '');
      return {
        societate: item.Societate,
        sediu: item.Sediu,
        localitate: item.Localitate,
        judet: item.Judet,
        telefon: item.TelefonFax,
        certificates,
      };
    });

    return NextResponse.json(results);
  } catch (err) {
    console.error('ANRE certificates error:', err);
    return NextResponse.json(
      { error: 'Nu s-au putut obține atestatele de la ANRE. Încercați din nou.' },
      { status: 502 }
    );
  }
}

function parseDetaliu(html: string) {
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  const cells: string[] = [];
  let match;

  while ((match = cellRegex.exec(html)) !== null) {
    cells.push(match[1].replace(/<[^>]*>/g, '').trim());
  }

  const certificates = [];
  // Group by 5: nr_atestat, tip_tarif, data_emitere, data_expirare, stare
  for (let i = 0; i + 4 < cells.length; i += 5) {
    certificates.push({
      nrAtestat: cells[i],
      tipTarif: cells[i + 1],
      dataEmitere: cells[i + 2],
      dataExpirare: cells[i + 3],
      stare: cells[i + 4],
    });
  }

  return certificates;
}
