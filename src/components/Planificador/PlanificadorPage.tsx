import { useFinance } from '../../context/FinanceContext';
import { resumenPlanificador, resumenTarjeta, tarjetaIdDesdeValor, valorParaTarjeta } from '../../lib/calculations';
import { formatIsoDate, monthLabel } from '../../lib/monthUtils';
import type { Egreso, TarjetaCredito } from '../../types';

function formatMonto(n: number): string {
  return n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 });
}

/** Vista resumida y de solo lectura de cada tarjeta (la edición vive en la pestaña Tarjetas). */
function ResumenTarjetasCompacto() {
  const { state, selectedMonth } = useFinance();
  if (state.tarjetasCredito.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">💳 Tarjetas de crédito</h3>
      <ul className="divide-y divide-slate-100">
        {state.tarjetasCredito.map((t) => {
          const resumen = resumenTarjeta(t, selectedMonth);
          const sobregirado = resumen.disponible < 0;
          return (
            <li key={t.id} className="py-2 flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-700 truncate">{t.nombre}</span>
              <span className={`font-semibold whitespace-nowrap ${sobregirado ? 'text-rose-600' : 'text-emerald-600'}`}>
                Disponible {formatMonto(resumen.disponible)}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-slate-400 mt-2">Edita límites, deuda y fechas desde la pestaña Tarjetas.</p>
    </div>
  );
}

function SelectorFuente({
  egreso,
  ingresos,
  tarjetas,
  onChange,
}: {
  egreso: Egreso;
  ingresos: Array<{ id: string; detalle: string }>;
  tarjetas: TarjetaCredito[];
  onChange: (valor: string | null) => void;
}) {
  const valor = egreso.tarjetaId ? valorParaTarjeta(egreso.tarjetaId) : (egreso.ingresoId ?? '');
  return (
    <select
      value={valor}
      onChange={(e) => onChange(e.target.value || null)}
      className="rounded-lg border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
    >
      <option value="">Sin asignar</option>
      {tarjetas.map((t) => (
        <option key={t.id} value={valorParaTarjeta(t.id)}>
          💳 {t.nombre}
        </option>
      ))}
      {ingresos.map((i) => (
        <option key={i.id} value={i.id}>
          {i.detalle}
        </option>
      ))}
    </select>
  );
}

function FilaEgreso({
  egreso,
  ingresos,
  tarjetas,
  onChange,
}: {
  egreso: Egreso;
  ingresos: Array<{ id: string; detalle: string }>;
  tarjetas: TarjetaCredito[];
  onChange: (valor: string | null) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <div className="font-medium text-slate-800 truncate">{egreso.detalle}</div>
        <div className="text-xs text-slate-400">
          {formatMonto(egreso.monto)} · Vence {formatIsoDate(egreso.fecha)}
        </div>
      </div>
      <SelectorFuente egreso={egreso} ingresos={ingresos} tarjetas={tarjetas} onChange={onChange} />
    </li>
  );
}

export function PlanificadorPage() {
  const { state, selectedMonth, selectedMonthKey, asignarFuentePago } = useFinance();
  const resumen = resumenPlanificador(selectedMonth);
  const ingresosParaSelector = (selectedMonth?.ingresos ?? []).map((i) => ({ id: i.id, detalle: i.detalle }));
  const tarjetasParaSelector = state.tarjetasCredito;

  const gruposPorTarjeta = new Map<string, Egreso[]>();
  for (const e of resumen.aCargarTarjeta) {
    const key = e.tarjetaId ?? '';
    gruposPorTarjeta.set(key, [...(gruposPorTarjeta.get(key) ?? []), e]);
  }

  const totalIngresos = resumen.asignaciones.reduce((s, a) => s + a.ingreso.monto, 0);
  const totalAsignado = resumen.asignaciones.reduce((s, a) => s + a.totalAsignado, 0);

  if ((selectedMonth?.ingresos.length ?? 0) === 0 && (selectedMonth?.egresos.length ?? 0) === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Planificador de deudas — {monthLabel(selectedMonthKey)}</h2>
        <p className="text-sm text-slate-500 py-8 text-center">
          Este mes todavía no tiene ingresos ni egresos. Agrégalos desde las pestañas Ingresos y Egresos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Planificador de deudas — {monthLabel(selectedMonthKey)}</h2>
        <p className="text-sm text-slate-500 mt-1">
          Elige con qué ingreso planeas pagar cada egreso (o si lo vas a cargar a la tarjeta de crédito), para saber
          cuánto de cada uno ya está comprometido.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Ingresos totales</div>
          <div className="text-lg font-bold mt-1 text-slate-700">{formatMonto(totalIngresos)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Comprometido</div>
          <div className="text-lg font-bold mt-1 text-slate-700">{formatMonto(totalAsignado)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Egresos sin asignar</div>
          <div className="text-lg font-bold mt-1 text-amber-600">{formatMonto(resumen.totalSinAsignar)}</div>
        </div>
      </div>

      <ResumenTarjetasCompacto />

      {resumen.asignaciones.length === 0 && (
        <p className="text-sm text-slate-500 py-4 text-center">
          Todavía no tienes ingresos este mes. Agrega uno desde la pestaña Ingresos para empezar a planificar.
        </p>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {resumen.asignaciones.map(({ ingreso, egresosAsignados, totalAsignado, disponible }) => {
          const pct = ingreso.monto > 0 ? Math.min((totalAsignado / ingreso.monto) * 100, 100) : 0;
          const sobreasignado = disponible < 0;
          return (
            <div key={ingreso.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-slate-800">{ingreso.detalle}</div>
                  <div className="text-xs text-slate-400">
                    {formatMonto(ingreso.monto)} ·{' '}
                    <span className={ingreso.estado === 'COBRADO' ? 'text-emerald-600' : 'text-amber-600'}>
                      {ingreso.estado}
                    </span>
                  </div>
                </div>
                <div className={`text-right text-sm font-semibold ${sobreasignado ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {sobreasignado ? `Sobrepasado ${formatMonto(Math.abs(disponible))}` : `Disponible ${formatMonto(disponible)}`}
                </div>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mt-3">
                <div
                  className={`h-full rounded-full transition-all ${sobreasignado ? 'bg-rose-500' : 'bg-brand-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {egresosAsignados.length === 0 ? (
                <p className="text-xs text-slate-400 mt-3">Sin egresos asignados todavía.</p>
              ) : (
                <ul className="divide-y divide-slate-100 mt-2">
                  {egresosAsignados.map((egreso) => (
                    <FilaEgreso
                      key={egreso.id}
                      egreso={egreso}
                      ingresos={ingresosParaSelector}
                      tarjetas={tarjetasParaSelector}
                      onChange={(valor) => asignarFuentePago(egreso.id, valor)}
                    />
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-purple-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-1">💳 A pagar con tarjeta de crédito</h3>
        <p className="text-xs text-slate-400 mb-2">
          Egresos que planeas cargar a la tarjeta. Se sumarán al monto del próximo estado de cuenta, no a ningún
          ingreso de este mes.
        </p>
        {resumen.aCargarTarjeta.length === 0 ? (
          <p className="text-sm text-slate-400 py-2">No hay egresos marcados para pagar con tarjeta.</p>
        ) : (
          <div className="space-y-3">
            {tarjetasParaSelector
              .filter((t) => gruposPorTarjeta.has(t.id))
              .map((t) => (
                <div key={t.id}>
                  <div className="text-xs font-semibold text-slate-500 mb-1">💳 {t.nombre}</div>
                  <ul className="divide-y divide-slate-100">
                    {gruposPorTarjeta.get(t.id)!.map((egreso) => (
                      <FilaEgreso
                        key={egreso.id}
                        egreso={egreso}
                        ingresos={ingresosParaSelector}
                        tarjetas={tarjetasParaSelector}
                        onChange={(valor) => asignarFuentePago(egreso.id, valor)}
                      />
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-1">Sin asignar</h3>
        <p className="text-xs text-slate-400 mb-2">
          Egresos que todavía no tienen un ingreso asignado ni están marcados para pagar con tarjeta.
        </p>
        {resumen.sinAsignar.length === 0 ? (
          <p className="text-sm text-emerald-600 py-2">Todos los egresos ya están asignados.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {resumen.sinAsignar.map((egreso) => (
              <FilaEgreso
                key={egreso.id}
                egreso={egreso}
                ingresos={ingresosParaSelector}
                tarjetas={tarjetasParaSelector}
                onChange={(valor) => asignarFuentePago(egreso.id, valor)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
