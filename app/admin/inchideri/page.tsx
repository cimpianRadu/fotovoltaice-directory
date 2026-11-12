import { getClosingCandidates } from '@/lib/inchideri';
import ClosingCard from './ClosingCard';

export const dynamic = 'force-dynamic';

// Cererile deschise despre care cineva a scris că omul a ales deja sau a
// renunțat (12 nov 2026). Nimic nu se închide singur: aici vezi motivul, citatul
// și cine mai e pe cerere, apoi decizi. Regulile sunt în lib/inchideri-rules.ts.

export default async function InchideriPage() {
  const candidates = await getClosingCandidates();
  const clear = candidates.filter((c) => c.clear);
  const check = candidates.filter((c) => !c.clear);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">De închis</h1>
        <p className="mt-1 max-w-3xl text-sm text-gray-500">
          Cereri încă deschise despre care o firmă sau clientul a scris că omul a ales deja altă firmă sau
          nu mai face investiția. Se citesc motivele de renunțare, jurnalul firmelor din portal și notițele
          clientului. Ce ține de firmă sau de preț („nu răspunde”, „scump”, „prea departe”) nu apare aici.
        </p>
      </div>

      {candidates.length === 0 && (
        <p className="rounded-xl border border-border bg-white p-6 text-sm text-gray-500">
          Nicio cerere deschisă nu pare de închis acum.
        </p>
      )}

      {clear.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Clare <span className="font-normal text-gray-500">({clear.length})</span>
          </h2>
          <p className="text-xs text-gray-500">
            Un singur fel de semnal, fără îndoieli în text și fără altă firmă încă în lucru pe cerere.
          </p>
          {clear.map((c) => (
            <ClosingCard key={c.leadId} candidate={c} />
          ))}
        </section>
      )}

      {check.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">
            De verificat <span className="font-normal text-gray-500">({check.length})</span>
          </h2>
          <p className="text-xs text-gray-500">
            Textul spune că se poate închide, dar altă firmă e încă pe cerere sau textul are o îndoială.
          </p>
          {check.map((c) => (
            <ClosingCard key={c.leadId} candidate={c} />
          ))}
        </section>
      )}
    </div>
  );
}
