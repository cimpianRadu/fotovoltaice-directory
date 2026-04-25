import { NextResponse } from 'next/server';
import { lookupAnreForListing } from '@/lib/anre';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = (searchParams.get('name') || '').trim();
  const judet = (searchParams.get('judet') || '').trim();

  if (!name || !judet) {
    return NextResponse.json({ matched: false }, { status: 200 });
  }

  const { firm, certs } = lookupAnreForListing(name, judet);
  if (!firm) {
    return NextResponse.json({ matched: false }, { status: 200 });
  }

  return NextResponse.json({
    matched: true,
    firmName: firm.societate,
    judet: firm.judet,
    certs,
  });
}
