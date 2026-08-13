import { useEffect, useMemo, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import type { Egreso } from '../../types';
import { formatIsoDate, ordenarPorFecha } from '../../lib/monthUtils';
import { cuotasPorPagar, tarjetaIdDesdeValor, valorParaTarjeta } from '../../lib/calculations';
import { EgresoForm } from './EgresoForm';
import { Pagination } from '../common/Pagination';

const POR_PAGINA = 15;
const SIN_ASIGNAR = 'SIN_ASIGNAR';

function formatMonto(n: number): string {
  return n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 });
}

type Filtro = 'TODOS' | 'FIJO' | 'NO FIJO';

export function EgresosPage() {
  const { selectedMonth, state, agregarEgreso, actualizarEgreso, eliminarEgreso, alternarPagado } = useFinance();
  const [editando, setEditando] = useState<Egreso | null>(null);
  const [creando, setCreando] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>('TODOS');
  const [fuentePago, setFuentePago] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);

  const ingresosDelMes = selectedMonth?.ingresos ?? [];
  const egresos = selectedMonth?.egresos ?? [];
  const visibles = useMemo(() => {
    let filtrados = filtro === 'TODOS' ? egresos : egresos.filter((e) => e.tipo === filtro);
    if (fuentePago === SIN_ASIGNAR) {
      filtrados = filtrados.filter((e) => !e.tarjetaId && !e.ingresoId);
    } else if (fuentePago) {
      const tarjetaId = tarjetaIdDesdeValor(fuentePago);
      filtrados = tarjetaId
        ? filtrados.filter((e) => e.tarjetaId === tarjetaId)
        : filtrados.filter((e) => e.ingresoId === fuentePago);
    }
    const termino = busqueda.trim().toLowerCase();
    if (termino) filtrados = filtrados.filter((e) => e.detalle.toLowerCase().includes(termino));
    return ordenarPorFecha(filtrados, (e) => e.fecha);
  }, [egresos, filtro, fuentePago, busqueda]);
  const total = visibles.reduce((s, e) => s + e.monto, 0);
  const detalleIngresoPorId = new Map(ingresosDelMes.map((i) => [i.id, i.detalle]));
  const detallePrestamoPorId = new Map(state.prestamos.map((p) => [p.id, p.entidad]));
  const detalleTarjetaPorId = new Map(state.tarjetasCredito.map((t) => [t.id, t.nombre]));
  const totalPaginas = Math.max(Math.ceil(visibles.length / POR_PAGINA), 1);
  const paginaSegura = Math.min(pagina, totalPaginas);
  const paginados = visibles.slice((paginaSegura - 1) * POR_PAGINA, paginaSegura * POR_PAGINA);
  const hayFiltrosActivos = filtro !== 'TODOS' || fuentePago !== '' || busqueda !== '';

  useEffect(() => {
    setPagina(1);
  }, [busqueda, filtro, fuentePago, selectedMonth?.key]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-slate-800">Egresos</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por detalle…"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
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
          <select
            value={fuentePago}
            onChange={(e) => setFuentePago(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Cómo se paga: todos</option>
            <option value={SIN_ASIGNAR}>Sin asignar</option>
            {state.tarjetasCredito.map((t) => (
              <option key={t.id} value={valorParaTarjeta(t.id)}>
                💳 {t.nombre}
              </option>
            ))}
            {ingresosDelMes.map((i) => (
              <option key={i.id} value={i.id}>
                {i.detalle}
              </option>
            ))}
          </select>
          <button
            onClick={() => setCreando(true)}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 whitespace-nowrap"
          >
            + Agregar egreso
          </button>
        </div>
      </div>

      {visibles.length === 0 ? (
        <p className="text-sm text-slate-500 py-8 text-center">
          {hayFiltrosActivos
            ? 'Ningún egreso coincide con la búsqueda/filtro.'
            : 'No hay egresos registrados en este filtro.'}
        </p>
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
              {paginados.map((e) => {
                const porPagar = cuotasPorPagar(e.cuotasTotales, e.cuotaActual);
                return (
                  <tr key={e.id} className={`hover:bg-slate-50 ${e.finalizado ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {e.detalle}
                      {e.finalizado && (
                        <span className="ml-2 text-xs font-normal text-slate-400">(finalizado)</span>
                      )}
                      {e.tarjetaId && detalleTarjetaPorId.has(e.tarjetaId) ? (
                        <div className="text-xs font-normal text-slate-400">
                          💳 Se carga a: {detalleTarjetaPorId.get(e.tarjetaId)}
                        </div>
                      ) : (
                        e.ingresoId &&
                        detalleIngresoPorId.has(e.ingresoId) && (
                          <div className="text-xs font-normal text-slate-400">
                            Se paga con: {detalleIngresoPorId.get(e.ingresoId)}
                          </div>
                        )
                      )}
                      {e.prestamoId && detallePrestamoPorId.has(e.prestamoId) && (
                        <div className="text-xs font-normal text-purple-500">
                          🏦 Cuota de: {detallePrestamoPorId.get(e.prestamoId)}
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
          <Pagination pagina={paginaSegura} totalPaginas={totalPaginas} onChange={setPagina} />
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
