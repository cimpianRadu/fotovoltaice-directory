// Badge shown on firms that appear on the AFM Casa Verde Fotovoltaice
// validated-installers list (2024 snapshot). Cross-checked by CUI.
export default function CasaVerdeBadge({ className = '' }: { className?: string }) {
  return (
    <span
      title="Apare pe lista AFM de instalatori validați Casa Verde Fotovoltaice (sesiunea 2024)"
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 ${className}`}
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3.5 11 12 4l8.5 7" />
        <path d="M6 10v10h12V10" />
        <path d="m9 14.8 2 2 4-4" />
      </svg>
      Casa Verde
    </span>
  );
}
