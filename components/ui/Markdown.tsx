'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownProps {
  content: string;
}

export default function Markdown({ content }: MarkdownProps) {
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
        a: ({ href, children }) => (
          <a href={href} className="text-primary-dark hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary/30 pl-4 my-4 text-gray-500 italic">{children}</blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
