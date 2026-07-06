import { useEffect, useMemo, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import type { Ingreso } from '../../types';
import { formatIsoDate, ordenarPorFecha } from '../../lib/monthUtils';
import { IngresoForm } from './IngresoForm';
import { Pagination } from '../common/Pagination';

const POR_PAGINA = 15;

function formatMonto(n: number): string {
  return n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 });
}

export function IngresosPage() {
  const { selectedMonth, agregarIngreso, actualizarIngreso, eliminarIngreso, alternarCobrado } = useFinance();
  const [editando, setEditando] = useState<Ingreso | null>(null);
  const [creando, setCreando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const ingresos = selectedMonth?.ingresos ?? [];
  const visibles = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    const filtrados = termino ? ingresos.filter((i) => i.detalle.toLowerCase().includes(termino)) : ingresos;
    return ordenarPorFecha(filtrados, (i) => i.fecha);
  }, [ingresos, busqueda]);
  const total = visibles.reduce((s, i) => s + i.monto, 0);
  const totalPaginas = Math.max(Math.ceil(visibles.length / POR_PAGINA), 1);
  const paginaSegura = Math.min(pagina, totalPaginas);
  const paginados = visibles.slice((paginaSegura - 1) * POR_PAGINA, paginaSegura * POR_PAGINA);

  useEffect(() => {
    setPagina(1);
  }, [busqueda, selectedMonth?.key]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-slate-800">Ingresos</h2>
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por detalle…"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            onClick={() => setCreando(true)}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 whitespace-nowrap"
          >
            + Agregar ingreso
          </button>
        </div>
      </div>

      {visibles.length === 0 ? (
        <p className="text-sm text-slate-500 py-8 text-center">
          {busqueda ? 'Ningún ingreso coincide con la búsqueda.' : 'No hay ingresos registrados este mes.'}
        </p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Detalle</th>
                <th className="text-right px-4 py-3 font-medium">Monto</th>
                <th className="text-left px-4 py-3 font-medium">Fecha</th>
                <th className="text-center px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginados.map((i) => (
                <tr key={i.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {i.detalle}
                    {i.fijo && (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        Fijo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-600 font-semibold whitespace-nowrap">
                    {formatMonto(i.monto)}
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatIsoDate(i.fecha)}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => alternarCobrado(i.id)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                        i.estado === 'COBRADO'
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      }`}
                      title="Un clic para alternar Cobrado / No Cobrado"
                    >
                      {i.estado}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => setEditando(i)}
                      className="text-brand-600 hover:underline text-xs font-medium mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => confirm(`¿Eliminar "${i.detalle}"?`) && eliminarIngreso(i.id)}
                      className="text-rose-600 hover:underline text-xs font-medium"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-semibold">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3 text-right text-emerald-700">{formatMonto(total)}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
          <Pagination pagina={paginaSegura} totalPaginas={totalPaginas} onChange={setPagina} />
        </div>
      )}

      {creando && (
        <IngresoForm onSubmit={(input) => agregarIngreso(input)} onClose={() => setCreando(false)} />
      )}
      {editando && (
        <IngresoForm
          initial={editando}
          onSubmit={(input) => actualizarIngreso(editando.id, input)}
          onClose={() => setEditando(null)}
        />
      )}
    </div>
  );
}
