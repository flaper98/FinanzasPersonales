import { createPortal } from 'react-dom';
import type { DatosEmpresa, Proforma } from '../../types';
import { ProformaDocumento } from './ProformaDocumento';

/** Quita caracteres inválidos para nombre de archivo en Windows/Mac/Linux. */
function nombreArchivoSeguro(texto: string): string {
  return texto.replace(/[\\/:*?"<>|]/g, '').trim();
}

const botonSecundario = 'px-4 py-2 text-sm font-medium rounded-lg bg-white text-slate-700 hover:bg-slate-100';

/**
 * Vista de la proforma lista para imprimir. El botón "Descargar PDF" abre el
 * diálogo de impresión del navegador (elegir "Guardar como PDF" como
 * destino) — el CSS de impresión (ver index.css, clase `proforma-print`)
 * oculta todo lo demás de la app para que solo salga este documento.
 *
 * Las acciones son opcionales: desde el formulario se abre como vista previa
 * de un borrador, solo con "Volver a editar" y "Descargar PDF". Se monta en
 * <body> (portal) para que, abierta desde un modal, el posicionamiento del
 * modal no interfiera con la impresión.
 */
export function ProformaPreview({
  proforma,
  datosEmpresa,
  onClose,
  textoCerrar = 'Cerrar',
  onEditar,
  onDuplicar,
  onEliminar,
  onAgregarAIngresos,
}: {
  proforma: Proforma;
  datosEmpresa: DatosEmpresa;
  onClose: () => void;
  textoCerrar?: string;
  onEditar?: () => void;
  onDuplicar?: () => void;
  onEliminar?: () => void;
  onAgregarAIngresos?: () => void;
}) {
  /**
   * El navegador usa el título de la pestaña como nombre sugerido al
   * "Guardar como PDF". Lo cambiamos justo antes de imprimir y lo
   * restauramos al cerrar el diálogo (evento `afterprint`), con un
   * temporizador de respaldo por si ese evento no llega a dispararse.
   */
  function descargarPDF() {
    const tituloOriginal = document.title;
    const cliente = proforma.clienteNombre ? `_${proforma.clienteNombre}` : '';
    document.title = nombreArchivoSeguro(`PROFORMA ${proforma.numero}${cliente}`);

    function restaurarTitulo() {
      document.title = tituloOriginal;
      window.removeEventListener('afterprint', restaurarTitulo);
    }
    window.addEventListener('afterprint', restaurarTitulo);
    window.setTimeout(restaurarTitulo, 10000);

    window.print();
  }

  return createPortal(
    <div className="fixed inset-0 z-40 bg-slate-900/60 overflow-y-auto print:bg-white print:static">
      <div className="min-h-full flex items-start justify-center p-4 print:p-0">
        <div className="w-full max-w-[52rem] print:max-w-none proforma-print">
          <div className="flex justify-end gap-2 mb-3 print:hidden flex-wrap">
            {onEliminar && (
              <button
                onClick={() => confirm(`¿Eliminar la proforma ${proforma.numero}?`) && onEliminar()}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-white text-rose-600 hover:bg-rose-50"
              >
                Eliminar
              </button>
            )}
            {onEditar && (
              <button onClick={onEditar} className={botonSecundario}>
                Editar
              </button>
            )}
            {onDuplicar && (
              <button onClick={onDuplicar} className={botonSecundario}>
                Duplicar
              </button>
            )}
            {onAgregarAIngresos && (
              <button
                onClick={onAgregarAIngresos}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Agregar a Ingresos
              </button>
            )}
            <button onClick={onClose} className={botonSecundario}>
              {textoCerrar}
            </button>
            <button
              onClick={descargarPDF}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700"
            >
              Descargar PDF
            </button>
          </div>

          <ProformaDocumento proforma={proforma} datosEmpresa={datosEmpresa} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
