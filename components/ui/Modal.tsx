'use client';

import { useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Lățimea maximă, ca clasă Tailwind. */
  width?: string;
}

export default function Modal({ open, onClose, title, children, width = 'max-w-lg' }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const downOnBackdrop = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    } else {
      dialog.close();
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      // Click pe fundalul întunecat închide: acolo ținta e chiar dialogul. Și
      // apăsarea trebuie să fi început tot acolo, altfel o selecție de text
      // trasă din modal până pe fundal l-ar închide.
      onMouseDown={(e) => {
        downOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && downOnBackdrop.current) onClose();
      }}
      className={`fixed inset-0 z-50 w-full ${width} mx-auto my-auto p-0 rounded-xl shadow-2xl backdrop:bg-black/50 open:flex open:flex-col`}
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Închide"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-4 overflow-y-auto max-h-[70vh]">{children}</div>
    </dialog>
  );
}
