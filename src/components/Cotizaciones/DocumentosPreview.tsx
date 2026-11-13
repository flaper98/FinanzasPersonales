import { useState, type ReactNode } from 'react';
import { createPortal, flushSync } from 'react-dom';

export interface PaginaDocumento {
  id: string;
  /** Nombre del documento (botón "Descargar solo este" y nombre sugerido del PDF). */
  nombre: string;
  contenido: ReactNode;
}

/** Quita caracteres inválidos para nombre de archivo en Windows/Mac/Linux. */
function nombreArchivoSeguro(texto: string): string {
  return texto.replace(/[\\/:*?"<>|]/g, '').trim();
}

/**
 * Muestra los documentos de una cotización, uno debajo del otro, y los
 * imprime ("Guardar como PDF") todos juntos en un solo archivo o de a uno.
 * Usa el mismo CSS de impresión que las proformas (clase `proforma-print`,
 * ver index.css); `docs-print` ajusta los márgenes para varias hojas.
 */
export function DocumentosPreview({
  titulo,
  paginas,
  avisos,
  onClose,
  acciones,
}: {
  titulo: string;
  paginas: PaginaDocumento[];
  /** Mensajes a mostrar arriba (ej. datos que faltan cargar). */
  avisos?: string[];
  onClose: () => void;
  acciones?: ReactNode;
}) {
  /** Id de la única página a imprimir, o null para imprimir todas. */
  const [soloId, setSoloId] = useState<string | null>(null);

  /**
   * El navegador usa el título de la pestaña como nombre sugerido del PDF:
   * se cambia justo antes de imprimir y se restaura al cerrar el diálogo.
   */
  function imprimir(pagina: PaginaDocumento | null) {
    const tituloOriginal = document.title;
    flushSync(() => setSoloId(pagina?.id ?? null));
    document.title = nombreArchivoSeguro(pagina ? `${pagina.nombre} - ${titulo}` : titulo);

    function restaurar() {
      document.title = tituloOriginal;
      setSoloId(null);
      window.removeEventListener('afterprint', restaurar);
    }
    window.addEventListener('afterprint', restaurar);
    window.setTimeout(restaurar, 10000);
    window.print();
  }

  const visibles = soloId ? paginas.filter((p) => p.id === soloId) : paginas;

  return createPortal(
    <div className="fixed inset-0 z-40 bg-slate-900/60 overflow-y-auto print:bg-white print:static">
      <div className="min-h-full flex items-start justify-center p-4 print:p-0">
        <div className="proforma-print docs-print w-full max-w-[52rem] print:max-w-none">
          <div className="sticky top-0 z-10 -mx-4 px-4 py-3 mb-3 bg-slate-900/80 backdrop-blur print:hidden">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-white min-w-0">
                <div className="font-semibold truncate">{titulo}</div>
                <div className="text-xs text-slate-300">
                  {paginas.length} documento{paginas.length === 1 ? '' : 's'} · se descargan juntos en un solo PDF
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {acciones}
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-white text-slate-700 hover:bg-slate-100"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => imprimir(null)}
                  disabled={paginas.length === 0}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  Descargar todo (PDF)
                </button>
              </div>
            </div>
            {avisos && avisos.length > 0 && (
              <div className="mt-2 rounded-lg bg-amber-50 text-amber-800 text-xs px-3 py-2 space-y-0.5">
                {avisos.map((a) => (
                  <div key={a}>⚠️ {a}</div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6 print:space-y-0">
            {visibles.map((pagina) => (
              <div key={pagina.id} className="doc-envoltura">
                <div className="flex items-center justify-between mb-2 print:hidden">
                  <span className="text-sm font-medium text-white">{pagina.nombre}</span>
                  <button
                    onClick={() => imprimir(pagina)}
                    className="text-xs font-medium text-white/90 hover:text-white underline"
                  >
                    Descargar solo este
                  </button>
                </div>
                {pagina.contenido}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
