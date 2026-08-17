'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownProps {
  content: string;
  /**
   * Slug-ul paginii gazdă. Linkurile din text către /cere-oferta îl primesc ca
   * `?sursa=`, la fel ca butoanele din InstallerCta: un link pus în mijlocul
   * unui articol e cel mai intenționat click de pe pagină și n-are rost să fie
   * singurul pe care nu îl putem atribui.
   */
  linkSource?: string;
}

export default function Markdown({ content, linkSource }: MarkdownProps) {
  function resolveHref(href?: string): string | undefined {
    if (!href || !linkSource) return href;
    // Doar linkurile fără query propriu: dacă autorul a pus deja parametri, îi respectăm.
    if (href !== '/cere-oferta') return href;
    return `/cere-oferta?sursa=${encodeURIComponent(linkSource)}`;
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h3: ({ children }) => (
          <h3 className="text-base font-bold text-gray-900 mt-6 mb-2">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-sm font-bold text-gray-900 mt-4 mb-2">{children}</h4>
        ),
        p: ({ children }) => (
          <p className="text-gray-600 leading-relaxed text-sm mb-3">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-gray-800">{children}</strong>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-600 mb-4 ml-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-600 mb-4 ml-1">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="leading-relaxed">{children}</li>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-4 rounded-lg border border-border">
            <table className="w-full text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-surface text-left">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="px-4 py-2.5 font-semibold text-gray-900 border-b border-border text-xs uppercase tracking-wide">{children}</th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-2.5 text-gray-600 border-b border-border/50">{children}</td>
        ),
        tr: ({ children }) => (
          <tr className="hover:bg-surface/50 transition-colors">{children}</tr>
        ),
        // Tab nou doar pentru linkurile externe. Înainte plecau toate acolo,
        // inclusiv cele interne, ceea ce rupea inutil parcursul spre formular.
        a: ({ href, children }) => {
          const resolved = resolveHref(href);
          const isInternal = resolved?.startsWith('/') ?? false;
          return (
            <a
              href={resolved}
              className="text-primary-dark hover:underline"
              {...(isInternal ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
            >
              {children}
            </a>
          );
        },
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary/30 pl-4 my-4 text-gray-500 italic">{children}</blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
