import { NextResponse } from 'next/server';
import { saveCvbAlertToSheet } from '@/lib/sheets';

// Valorile vin dintr-un select cu opțiuni fixe; validăm server-side ca în
// Sheet să nu intre text liber (aceeași regulă ca la /api/ad-inquiry).
const ALLOWED_CAPACITATE = ['12', '13-15', '16-20', 'peste-20', 'nu-stiu'];
const ALLOWED_INVERTOR = [
  'huawei',
  'deye',
  'fronius',
  'goodwe',
  'growatt',
  'sungrow',
  'solaredge',
  'solax',
  'victron',
  'solis',
  'kstar',
  'alt-brand',
  'nu-stiu',
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, capacitate, invertor, sursa } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Adresa de email este invalidă.' }, { status: 400 });
    }
    if (capacitate && !ALLOWED_CAPACITATE.includes(capacitate)) {
      return NextResponse.json({ error: 'Capacitate invalidă.' }, { status: 400 });
    }
    if (invertor && !ALLOWED_INVERTOR.includes(invertor)) {
      return NextResponse.json({ error: 'Invertor invalid.' }, { status: 400 });
    }

    await saveCvbAlertToSheet({
      email: email.trim(),
      capacitate,
      invertor,
      sursa: typeof sursa === 'string' ? sursa.slice(0, 100) : '',
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Alerta CVB API error:', err);
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 });
  }
}
