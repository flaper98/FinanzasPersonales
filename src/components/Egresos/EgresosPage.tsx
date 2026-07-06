import { useMemo, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import type { Egreso } from '../../types';
import { formatIsoDate, ordenarPorFecha } from '../../lib/monthUtils';
import { cuotasPorPagar } from '../../lib/calculations';
import { EgresoForm } from './EgresoForm';

function formatMonto(n: number): string {
  return n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 });
}

type Filtro = 'TODOS' | 'FIJO' | 'NO FIJO';

export function EgresosPage() {
  const { selectedMonth, agregarEgreso, actualizarEgreso, eliminarEgreso, alternarPagado } = useFinance();
  const [editando, setEditando] = useState<Egreso | null>(null);
  const [creando, setCreando] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>('TODOS');

  const egresos = selectedMonth?.egresos ?? [];
  const visibles = useMemo(() => {
    const filtrados = filtro === 'TODOS' ? egresos : egresos.filter((e) => e.tipo === filtro);
    return ordenarPorFecha(filtrados, (e) => e.fecha);
  }, [egresos, filtro]);
  const total = visibles.reduce((s, e) => s + e.monto, 0);
  const detalleIngresoPorId = new Map((selectedMonth?.ingresos ?? []).map((i) => [i.id, i.detalle]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-slate-800">Egresos</h2>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {(['TODOS', 'FIJO', 'NO FIJO'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  filtro === f ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCreando(true)}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700"
          >
            + Agregar egreso
          </button>
        </div>
      </div>

      {visibles.length === 0 ? (
        <p className="text-sm text-slate-500 py-8 text-center">No hay egresos registrados en este filtro.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Detalle</th>
                <th className="text-right px-4 py-3 font-medium">Monto</th>
                <th className="text-left px-4 py-3 font-medium">Fecha</th>
                <th className="text-left px-4 py-3 font-medium">Tipo</th>
                <th className="text-center px-4 py-3 font-medium">Cuotas</th>
                <th className="text-center px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibles.map((e) => {
                const porPagar = cuotasPorPagar(e.cuotasTotales, e.cuotaActual);
                return (
                  <tr key={e.id} className={`hover:bg-slate-50 ${e.finalizado ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {e.detalle}
                      {e.finalizado && (
                        <span className="ml-2 text-xs font-normal text-slate-400">(finalizado)</span>
                      )}
                      {e.ingresoId && detalleIngresoPorId.has(e.ingresoId) && (
                        <div className="text-xs font-normal text-slate-400">
                          Se paga con: {detalleIngresoPorId.get(e.ingresoId)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-rose-600 font-semibold whitespace-nowrap">
                      {formatMonto(e.monto)}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatIsoDate(e.fecha)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          e.tipo === 'FIJO' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {e.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600 whitespace-nowrap">
                      {e.cuotasTotales === 'siempre'
                        ? 'siempre'
                        : `${e.cuotaActual} / ${e.cuotasTotales} (faltan ${porPagar})`}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => alternarPagado(e.id)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                          e.accion === 'PAGADO'
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        }`}
                        title="Un clic para alternar Pagado / No Pagado"
                      >
                        {e.accion}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setEditando(e)}
                        className="text-brand-600 hover:underline text-xs font-medium mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => confirm(`¿Eliminar "${e.detalle}"?`) && eliminarEgreso(e.id)}
                        className="text-rose-600 hover:underline text-xs font-medium"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-semibold">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3 text-right text-rose-700">{formatMonto(total)}</td>
                <td colSpan={5} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {creando && <EgresoForm onSubmit={(input) => agregarEgreso(input)} onClose={() => setCreando(false)} />}
      {editando && (
        <EgresoForm
          initial={editando}
          onSubmit={(input) => actualizarEgreso(editando.id, input)}
          onClose={() => setEditando(null)}
        />
      )}
    </div>
  );
}
