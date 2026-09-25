import { formatIsoDate } from '../../lib/monthUtils';
import { totalItemProforma, totalProforma } from '../../lib/calculations';
import { montoEnLetrasSoles } from '../../lib/text';
import type { DatosEmpresa, Proforma } from '../../types';

function formatMonto(n: number): string {
  return n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 });
}

/** Número con 2 decimales y sin símbolo, para las celdas de la tabla ("1,250.00"). */
function formatNumero(n: number): string {
  return n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Quita caracteres inválidos para nombre de archivo en Windows/Mac/Linux. */
function nombreArchivoSeguro(texto: string): string {
  return texto.replace(/[\\/:*?"<>|]/g, '').trim();
}

/**
 * Anchos de las columnas fijas de la tabla de ítems (la de descripción ocupa el
 * resto). Se usan tanto en <colgroup> como para dibujar las líneas verticales
 * que recorren toda la altura del recuadro, aunque haya pocos ítems.
 */
const COL_NUM = '2.75rem';
const COL_CANT = '4.75rem';
const COL_PRECIO = '6.75rem';
const COL_TOTAL = '6.75rem';

const LINEA = 'linear-gradient(#000, #000)';
const lineasColumnas = {
  backgroundImage: [LINEA, LINEA, LINEA, LINEA].join(', '),
  backgroundRepeat: 'no-repeat',
  backgroundSize: '1px 100%',
  backgroundPosition: [
    `${COL_NUM} 0`,
    `calc(100% - ${COL_TOTAL} - ${COL_PRECIO} - ${COL_CANT}) 0`,
    `calc(100% - ${COL_TOTAL} - ${COL_PRECIO}) 0`,
    `calc(100% - ${COL_TOTAL}) 0`,
  ].join(', '),
} as const;

/** Lista de pares etiqueta/valor; omite los que no tienen valor. */
function Campos({ filas }: { filas: [string, string | undefined][] }) {
  return (
    <dl className="grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-1 content-start">
      {filas
        .filter(([, valor]) => valor)
        .map(([etiqueta, valor]) => (
          <div key={etiqueta} className="contents">
            <dt className="font-bold uppercase text-black">{etiqueta}</dt>
            <dd className="text-slate-700">{valor}</dd>
          </div>
        ))}
    </dl>
  );
}

/**
 * Vista de la proforma lista para imprimir. El botón "Descargar PDF" abre el
 * diálogo de impresión del navegador (elegir "Guardar como PDF" como
 * destino) — el CSS de impresión (ver index.css, clase `proforma-print`)
 * oculta todo lo demás de la app para que solo salga este documento.
 */
export function ProformaPreview({
  proforma,
  datosEmpresa,
  onClose,
  onEditar,
  onEliminar,
  onAgregarAIngresos,
}: {
  proforma: Proforma;
  datosEmpresa: DatosEmpresa;
  onClose: () => void;
  onEditar: () => void;
  onEliminar: () => void;
  onAgregarAIngresos: () => void;
}) {
  const total = totalProforma(proforma.items);
  const hayDatosBanco = datosEmpresa.banco || datosEmpresa.numeroCuenta || datosEmpresa.numeroCci;
  const esServicio = proforma.tipo === 'servicio';
  const totalHoras = proforma.items.reduce((sum, it) => sum + it.cantidad, 0);

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

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/60 overflow-y-auto print:bg-white print:static">
      <div className="min-h-full flex items-start justify-center p-4 print:p-0">
        <div className="w-full max-w-3xl print:max-w-none proforma-print">
          <div className="flex justify-end gap-2 mb-3 print:hidden flex-wrap">
            <button
              onClick={() => confirm(`¿Eliminar la proforma ${proforma.numero}?`) && onEliminar()}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-white text-rose-600 hover:bg-rose-50"
            >
              Eliminar
            </button>
            <button
              onClick={onEditar}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-white text-slate-700 hover:bg-slate-100"
            >
              Editar
            </button>
            <button
              onClick={onAgregarAIngresos}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Agregar a Ingresos
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-white text-slate-700 hover:bg-slate-100"
            >
              Cerrar
            </button>
            <button
              onClick={descargarPDF}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700"
            >
              Descargar PDF
            </button>
          </div>

          <div className="proforma-sheet bg-white rounded-xl shadow-xl print:rounded-none print:shadow-none border border-slate-200 print:border-0 p-8 print:p-0 flex flex-col text-xs text-slate-800">
            {/* Encabezado: datos del emisor + recuadro con RUC / tipo de documento / número */}
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <div className="text-xl font-bold text-black leading-tight">{datosEmpresa.nombre || 'Tu empresa'}</div>
                <div className="mt-2 space-y-0.5 text-slate-600 leading-snug">
                  {datosEmpresa.direccion && <div>{datosEmpresa.direccion}</div>}
                  {(datosEmpresa.telefono || datosEmpresa.celular) && (
                    <div>
                      {[
                        datosEmpresa.telefono && `Tel: ${datosEmpresa.telefono}`,
                        datosEmpresa.celular && `Cel: ${datosEmpresa.celular}`,
                      ]
                        .filter(Boolean)
                        .join('  ·  ')}
                    </div>
                  )}
                  {datosEmpresa.email && <div>{datosEmpresa.email}</div>}
                </div>
              </div>
              <div className="w-64 shrink-0 border border-black text-center">
                {datosEmpresa.ruc && <div className="py-2 text-base tracking-wide text-black">RUC {datosEmpresa.ruc}</div>}
                <div className="bg-neutral-200 py-2.5 text-lg font-bold tracking-widest text-black">PROFORMA</div>
                <div className="py-2 text-base tracking-wide text-black">N.° {proforma.numero}</div>
              </div>
            </div>

            {/* Cliente y datos del documento */}
            <div className="mt-6 grid grid-cols-[1fr_auto] gap-x-10">
              <Campos
                filas={[
                  ['Cliente', proforma.clienteNombre || '—'],
                  ['RUC', proforma.clienteRuc],
                  ['Atención', proforma.clienteContacto],
                  ['Cargo', proforma.clienteCargo],
                ]}
              />
              <Campos
                filas={[
                  ['Fecha emisión', formatIsoDate(proforma.fecha)],
                  ['Validez', `${proforma.validezDias} días hábiles`],
                  ['Moneda', 'SOLES'],
                ]}
              />
            </div>

            {/* Ítems: el recuadro crece para ocupar la página y los totales quedan al pie */}
            <div className="proforma-items mt-4 grow flex flex-col border border-black">
              <div className="grow" style={lineasColumnas}>
                <table className="w-full table-fixed border-collapse">
                  <colgroup>
                    <col style={{ width: COL_NUM }} />
                    <col />
                    <col style={{ width: COL_CANT }} />
                    <col style={{ width: COL_PRECIO }} />
                    <col style={{ width: COL_TOTAL }} />
                  </colgroup>
                  <thead>
                    <tr className="bg-black text-white text-[11px] uppercase tracking-wide">
                      <th className="px-2 py-1.5 text-center font-bold">N.°</th>
                      <th className="px-3 py-1.5 text-left font-bold">Descripción</th>
                      <th className="px-2 py-1.5 text-center font-bold">{esServicio ? 'Horas' : 'Cant.'}</th>
                      <th className="px-3 py-1.5 text-right font-bold">{esServicio ? 'Tarifa/Hora' : 'P. Unit.'}</th>
                      <th className="px-3 py-1.5 text-right font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proforma.items.map((item, idx) => (
                      <tr key={item.id} className="align-top break-inside-avoid">
                        <td className="px-2 py-1.5 text-center text-slate-600">{(idx + 1).toString().padStart(2, '0')}</td>
                        <td className="px-3 py-1.5 whitespace-pre-line break-words">{item.descripcion}</td>
                        <td className="px-2 py-1.5 text-center">{item.cantidad}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{formatNumero(item.precioUnitario)}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums font-medium">
                          {formatNumero(totalItemProforma(item))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex border-t border-black break-inside-avoid">
                <div className="flex-1 px-3 py-2.5 flex items-center tracking-wide text-black">
                  {montoEnLetrasSoles(total)}
                </div>
                <div
                  className="border-l border-black px-3 py-2 space-y-1"
                  style={{ width: `calc(${COL_PRECIO} + ${COL_TOTAL})` }}
                >
                  {esServicio && (
                    <div className="flex justify-between text-slate-600">
                      <span className="font-bold uppercase">Total horas</span>
                      <span className="tabular-nums">{totalHoras}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline text-black">
                    <span className="font-bold uppercase">Total</span>
                    <span className="text-base font-bold tabular-nums">{formatMonto(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notas / forma de pago y firma */}
            <div className="mt-6 grid grid-cols-[1fr_15rem] gap-x-10 break-inside-avoid">
              <div className="space-y-4">
                {proforma.nota && (
                  <div>
                    <div className="font-bold uppercase text-black mb-1">Notas</div>
                    <p className="whitespace-pre-line text-slate-700">{proforma.nota}</p>
                  </div>
                )}
                {hayDatosBanco && (
                  <div>
                    <div className="font-bold uppercase text-black mb-1">Forma de pago</div>
                    <Campos
                      filas={[
                        ['Banco', datosEmpresa.banco],
                        ['Titular', datosEmpresa.nombre],
                        ['Nro. cuenta', datosEmpresa.numeroCuenta],
                        ['Nro. CCI', datosEmpresa.numeroCci],
                      ]}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-end text-center">
                {datosEmpresa.firma && (
                  <img src={datosEmpresa.firma} alt="Firma" className="h-16 mx-auto mb-1 object-contain" />
                )}
                <div className="border-t border-black pt-1.5">
                  <div className="font-bold text-black">{datosEmpresa.nombre}</div>
                  {datosEmpresa.ruc && <div className="text-slate-600">RUC {datosEmpresa.ruc}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
