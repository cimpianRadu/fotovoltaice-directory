// Piesele comune ale documentelor trimise firmelor din admin (comisionul,
// oferta de publicitate): foaia A4 cu antetul de brand, titlurile numerotate și
// etichetele de status. La print rămâne doar foaia; restul paginii are print:hidden.

export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block whitespace-nowrap rounded bg-slate-100 px-1.5 text-[0.9em] font-semibold text-[#1e3a5f]">
      {children}
    </span>
  );
}

export function H2({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="mt-6 mb-2 flex items-center gap-2 border-b border-slate-200 pb-1 text-base font-bold text-[#1e3a5f]">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#1e3a5f] text-[11px] text-white">
        {n}
      </span>
      {children}
    </h2>
  );
}

export function Sheet({ title, children }: { title: string; children: React.ReactNode }) {
  const luna = new Intl.DateTimeFormat('ro-RO', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Bucharest',
  }).format(new Date());

  return (
    <>
      <style>{`@page { size: A4; margin: 16mm 16mm 14mm; }`}</style>
      <article className="mx-auto max-w-[210mm] [print-color-adjust:exact] rounded-lg border border-slate-200 bg-white p-10 text-[14px] leading-relaxed text-slate-800 print:max-w-none print:border-0 print:p-0 print:text-[10.5pt]">
        <header className="mb-5 flex items-center justify-between border-b-[3px] border-[#f59e0b] pb-3">
          <div className="flex items-center gap-2.5 text-base font-bold text-[#1e3a5f]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" className="h-9" />
            Instalatori Fotovoltaice
          </div>
          <div className="text-right text-xs text-slate-500">
            instalatori-fotovoltaice.ro
            <br />
            {luna}
          </div>
        </header>

        <h1 className="mb-4 text-2xl font-bold text-[#1e3a5f]">{title}</h1>

        {children}

        <footer className="mt-6 border-t border-slate-200 pt-2 text-xs text-slate-500">
          <div>Radu Cîmpian · 0751 547 174 · contact@instalatori-fotovoltaice.ro</div>
        </footer>
      </article>
    </>
  );
}
