'use client';

import { useState } from 'react';

interface FooterAccordionProps {
  title: string;
  children: React.ReactNode;
}

export default function FooterAccordion({ title, children }: FooterAccordionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-700 sm:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3 sm:hidden"
      >
        <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400">
          {title}
        </h4>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <h4 className="hidden sm:block font-semibold text-sm uppercase tracking-wider mb-3 text-gray-400">
        {title}
      </h4>
      <div className={`${open ? 'block' : 'hidden'} sm:block pb-4 sm:pb-0`}>
        {children}
      </div>
    </div>
  );
}
