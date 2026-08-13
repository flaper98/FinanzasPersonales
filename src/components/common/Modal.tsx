import type { ReactNode } from 'react';

export function Modal({
  title,
  onClose,
  children,
  maxWidth = 'max-w-md',
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Clase Tailwind de ancho máximo, ej. "max-w-3xl" para formularios con más contenido. */
  maxWidth?: string;
}) {
  return (
    <div className="fixed inset-0 z-20 bg-slate-900/50 grid place-items-center p-4" onClick={onClose}>
      <div
        className={`bg-white rounded-xl shadow-xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 grid place-items-center rounded-lg hover:bg-slate-100 text-slate-500"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
