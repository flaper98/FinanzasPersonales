import { formatIsoDate } from '../../lib/monthUtils';
import { totalItemProforma, totalProforma } from '../../lib/calculations';
import type { DatosEmpresa, Proforma } from '../../types';

function formatMonto(n: number): string {
  return n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 });
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
              onClick={() => window.print()}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700"
            >
              Descargar PDF
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-xl print:rounded-none print:shadow-none overflow-hidden border border-slate-200 print:border-0">
            <div className="bg-brand-600 text-white px-6 py-5 flex items-center justify-between">
              <div className="text-2xl font-bold tracking-wide">
                PROFORMA N.° {proforma.numero}
              </div>
              <div className="text-right text-sm shrink-0 ml-4">
                <div className="uppercase text-xs tracking-wide opacity-80">Fecha</div>
                <div className="font-semibold">{formatIsoDate(proforma.fecha)}</div>
              </div>
            </div>

            <div className="p-6 space-y-6 text-sm text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-lg p-3">
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Remitente</div>
                  <div className="font-semibold text-slate-800">{datosEmpresa.nombre || 'Tu empresa'}</div>
                  {datosEmpresa.ruc && <div>RUC: {datosEmpresa.ruc}</div>}
                  {datosEmpresa.direccion && <div>{datosEmpresa.direccion}</div>}
                  {datosEmpresa.telefono && <div>Tel: {datosEmpresa.telefono}</div>}
                  {datosEmpresa.celular && <div>Cel: {datosEmpresa.celular}</div>}
                  {datosEmpresa.email && <div>{datosEmpresa.email}</div>}
                </div>
                <div className="border border-slate-200 rounded-lg p-3">
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Destinatario</div>
                  <div className="font-semibold text-slate-800">{proforma.clienteNombre || '—'}</div>
                  {proforma.clienteRuc && <div>RUC: {proforma.clienteRuc}</div>}
                  {proforma.clienteDireccion && <div>{proforma.clienteDireccion}</div>}
                </div>
              </div>

              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase text-slate-500">
                    <th className="text-center px-3 py-2 border border-slate-200 w-12">Ítem</th>
                    <th className="text-center px-3 py-2 border border-slate-200 w-16">Cant.</th>
                    <th className="text-left px-3 py-2 border border-slate-200">Descripción</th>
                    <th className="text-right px-3 py-2 border border-slate-200 w-28">P. Unitario</th>
                    <th className="text-right px-3 py-2 border border-slate-200 w-28">P. Total</th>
                  </tr>
                </thead>
                <tbody>
                  {proforma.items.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2 border border-slate-200 text-center">
                        {(idx + 1).toString().padStart(2, '0')}
                      </td>
                      <td className="px-3 py-2 border border-slate-200 text-center">{item.cantidad}</td>
                      <td className="px-3 py-2 border border-slate-200 whitespace-pre-line">{item.descripcion}</td>
                      <td className="px-3 py-2 border border-slate-200 text-right">
                        {formatMonto(item.precioUnitario)}
                      </td>
                      <td className="px-3 py-2 border border-slate-200 text-right font-medium">
                        {formatMonto(totalItemProforma(item))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="px-3 py-2 border border-slate-200 text-right font-semibold">
                      Total
                    </td>
                    <td className="px-3 py-2 border border-slate-200 text-right font-bold">{formatMonto(total)}</td>
                  </tr>
                </tfoot>
              </table>

              {proforma.nota && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Notas</div>
                  <p className="whitespace-pre-line">{proforma.nota}</p>
                </div>
              )}

              {hayDatosBanco && (
                <div className="border-t border-slate-100 pt-4">
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Forma de pago</div>
                  {datosEmpresa.banco && <p className="mb-2">Cuenta corriente del banco {datosEmpresa.banco}</p>}
                  <div className="border border-slate-200 rounded-lg overflow-hidden text-sm">
                    <div className="flex">
                      <div className="bg-slate-50 px-3 py-1.5 font-medium w-48 shrink-0">Titular de la cuenta</div>
                      <div className="px-3 py-1.5">{datosEmpresa.nombre}</div>
                    </div>
                    {datosEmpresa.numeroCuenta && (
                      <div className="flex border-t border-slate-200">
                        <div className="bg-slate-50 px-3 py-1.5 font-medium w-48 shrink-0">Nro. de cuenta</div>
                        <div className="px-3 py-1.5">{datosEmpresa.numeroCuenta}</div>
                      </div>
                    )}
                    {datosEmpresa.numeroCci && (
                      <div className="flex border-t border-slate-200">
                        <div className="bg-slate-50 px-3 py-1.5 font-medium w-48 shrink-0">Nro. CCI</div>
                        <div className="px-3 py-1.5">{datosEmpresa.numeroCci}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            <div className="bg-slate-800 text-white px-6 py-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide">
                Proforma válida por {proforma.validezDias} días hábiles
              </p>
              <p className="text-sm font-semibold mt-1">{datosEmpresa.nombre}</p>
              <p className="text-xs opacity-80">
                {[
                  datosEmpresa.ruc && `RUC: ${datosEmpresa.ruc}`,
                  datosEmpresa.telefono,
                  datosEmpresa.celular,
                  datosEmpresa.email,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
