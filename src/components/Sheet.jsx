import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './Icons.jsx';

/** Feuille modale ancrée en bas (mobile) / centrée (desktop). */
export default function Sheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="backdrop-enter absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className="sheet-enter pb-safe relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-md sm:rounded-3xl dark:bg-slate-900">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white/90 px-5 pt-3 pb-2 backdrop-blur dark:bg-slate-900/90">
          <div className="absolute top-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-slate-300 sm:hidden dark:bg-slate-700" />
          <h2 className="mt-2 text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="mt-2 rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Fermer">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 pb-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
