'use client';

import BugIcon from './BugIcon';
import { openReportIssue, type ReportKind } from '@/lib/report-issue-client';

/**
 * Butonul cu gândac. Deschide fereastra montată în layout (ReportIssueDialog).
 * Fișier identic în cele trei proiecte.
 *
 * - `footer`: gândac + „Raportează o problemă”, pe fundalul închis al footer-ului
 * - `icon`:   doar gândacul, pentru antetul chat-ului
 * - `link`:   text mic cu gândac, pe pagina unei clinici/firme
 */
export default function ReportIssueButton({
  variant = 'footer',
  kind,
  subject,
  source,
  label,
  className = '',
}: {
  variant?: 'footer' | 'icon' | 'link';
  kind?: ReportKind;
  subject?: string;
  source: string;
  label?: string;
  className?: string;
}) {
  const open = () => openReportIssue({ kind, subject, source });

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={open}
        aria-label={label || 'Raportează o problemă'}
        title={label || 'Raportează o problemă'}
        className={`rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 ${className}`}
      >
        <BugIcon className="h-4 w-4" />
      </button>
    );
  }

  if (variant === 'link') {
    return (
      <button
        type="button"
        onClick={open}
        className={`inline-flex items-center gap-1.5 text-left text-sm text-slate-500 underline-offset-2 transition hover:text-slate-800 hover:underline ${className}`}
      >
        <BugIcon className="h-4 w-4 shrink-0" />
        {label || 'Ai văzut o informație greșită? Spune-ne'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      className={`inline-flex items-center gap-1.5 transition-colors hover:text-gray-200 ${className}`}
    >
      <BugIcon className="h-4 w-4" />
      {label || 'Raportează o problemă'}
    </button>
  );
}
