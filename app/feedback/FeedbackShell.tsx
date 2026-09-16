export function FeedbackShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="max-w-xl mx-auto px-4 py-10 sm:py-14">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
      <div className="mt-4 text-gray-700 leading-relaxed">{children}</div>
    </div>
  );
}

export function InvalidFeedbackLink() {
  return (
    <FeedbackShell title="Legătura nu mai este validă">
      <p>
        Linkul a expirat sau a fost modificat. Ne puteți scrie la{' '}
        <a href="mailto:contact@instalatori-fotovoltaice.ro" className="text-primary-dark underline">
          contact@instalatori-fotovoltaice.ro
        </a>{' '}
        și vă trimitem unul nou.
      </p>
    </FeedbackShell>
  );
}
