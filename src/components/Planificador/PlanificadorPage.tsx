import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { resumenPlanificador, resumenTarjeta, valorParaTarjeta } from '../../lib/calculations';
import { formatIsoDate, monthLabel, ordenarPorFecha } from '../../lib/monthUtils';
import { useTipoCambio } from '../../lib/useTipoCambio';
import type { Egreso, TarjetaCredito } from '../../types';

function formatMonto(n: number): string {
  return n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 });
}

/** Vista resumida y de solo lectura de cada tarjeta (la edición vive en la pestaña Tarjetas). */
function ResumenTarjetasCompacto() {
  const { state, selectedMonth } = useFinance();
  const hayUSD = state.tarjetasCredito.some((t) => t.moneda === 'USD');
  const tc = useTipoCambio(hayUSD);
  if (state.tarjetasCredito.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">💳 Tarjetas de crédito</h3>
      <ul className="divide-y divide-slate-100">
        {state.tarjetasCredito.map((t) => {
          const esUSD = t.moneda === 'USD';
          const tcListo = !esUSD || tc.valor !== null;
          const resumen = resumenTarjeta(t, selectedMonth, tc.valor ?? undefined);
          const sobregirado = resumen.disponible < 0;
          return (
            <li key={t.id} className="py-2 flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-700 truncate">{t.nombre}</span>
              {tcListo ? (
                <span
                  className={`font-semibold whitespace-nowrap ${sobregirado ? 'text-rose-600' : 'text-emerald-600'}`}
                >
                  Disponible {formatMonto(resumen.disponible)}
                </span>
              ) : (
                <span className="text-xs text-slate-400 whitespace-nowrap">Esperando tipo de cambio…</span>
              )}
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

/**
 * Encabezado de sección consistente: ícono + título + contador, para escanear la página de un
 * vistazo. Es un `<div>` (no `<h3>`) porque una de las secciones lo usa dentro de un `<button>`
 * colapsable, y los encabezados no son contenido válido ahí.
 */
function EncabezadoSeccion({ icono, titulo, contador }: { icono: string; titulo: string; contador: number }) {
  return (
    <div className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
      <span aria-hidden>{icono}</span>
      {titulo}
      <span className="text-slate-400 font-normal">({contador})</span>
    </div>
  );
}

export function PlanificadorPage() {
  const { state, selectedMonth, selectedMonthKey, asignarFuentePago } = useFinance();
  const resumen = resumenPlanificador(selectedMonth);
  const ingresosParaSelector = (selectedMonth?.ingresos ?? []).map((i) => ({ id: i.id, detalle: i.detalle }));
  const tarjetasParaSelector = state.tarjetasCredito;
  const [mostrarSinGastos, setMostrarSinGastos] = useState(false);

  const gruposPorTarjeta = new Map<string, Egreso[]>();
  for (const e of resumen.aCargarTarjeta) {
    const key = e.tarjetaId ?? '';
    gruposPorTarjeta.set(key, [...(gruposPorTarjeta.get(key) ?? []), e]);
  }

  const totalIngresos = resumen.asignaciones.reduce((s, a) => s + a.ingreso.monto, 0);
  const totalAsignado = resumen.asignaciones.reduce((s, a) => s + a.totalAsignado, 0);

  // Separa los ingresos que ya tienen algún egreso asignado (lo relevante para revisar) de los que
  // todavía están libres, para no mezclar tarjetas llenas de contenido con tarjetas vacías.
  const asignacionesConGastos = resumen.asignaciones
    .filter((a) => a.egresosAsignados.length > 0)
    .sort((a, b) => b.totalAsignado - a.totalAsignado);
  const asignacionesSinGastos = resumen.asignaciones
    .filter((a) => a.egresosAsignados.length === 0)
    .sort((a, b) => b.ingreso.monto - a.ingreso.monto);

  const sinAsignarOrdenado = ordenarPorFecha(resumen.sinAsignar, (e) => e.fecha);

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

      {/* Lo que necesita una decisión va primero: egresos sin asignar, ordenados por lo más urgente (fecha de vencimiento). */}
      <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-4">
        <EncabezadoSeccion icono="⚠️" titulo="Sin asignar" contador={sinAsignarOrdenado.length} />
        <p className="text-xs text-slate-400 mt-1 mb-2">
          Egresos que todavía no tienen un ingreso asignado ni están marcados para pagar con tarjeta, del más urgente
          al menos urgente.
        </p>
        {sinAsignarOrdenado.length === 0 ? (
          <p className="text-sm text-emerald-600 py-2">Todos los egresos ya están asignados.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {sinAsignarOrdenado.map((egreso) => (
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

      {/* Ya decidido, pero vale la pena revisarlo: lo que planeas cargar a cada tarjeta. */}
      {tarjetasParaSelector.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-purple-200 p-4">
          <EncabezadoSeccion icono="💳" titulo="A pagar con tarjeta de crédito" contador={resumen.aCargarTarjeta.length} />
          <p className="text-xs text-slate-400 mt-1 mb-2">
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
                      {ordenarPorFecha(gruposPorTarjeta.get(t.id)!, (e) => e.fecha).map((egreso) => (
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
      )}

      {/* Ya decidido y en orden: revisión detallada por ingreso, el más comprometido primero. */}
      {asignacionesConGastos.length > 0 && (
        <div>
          <EncabezadoSeccion icono="✅" titulo="Ingresos con egresos asignados" contador={asignacionesConGastos.length} />
          <div className="grid md:grid-cols-2 gap-4 mt-2">
            {asignacionesConGastos.map(({ ingreso, egresosAsignados, totalAsignado, disponible }) => {
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

                  <ul className="divide-y divide-slate-100 mt-2">
                    {ordenarPorFecha(egresosAsignados, (e) => e.fecha).map((egreso) => (
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
              );
            })}
          </div>
        </div>
      )}

      {/* Pura referencia, sin nada que decidir todavía: colapsado por defecto para no tapar lo importante. */}
      {asignacionesSinGastos.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <button
            type="button"
            onClick={() => setMostrarSinGastos((v) => !v)}
            className="w-full flex items-center justify-between gap-2 text-left"
          >
            <EncabezadoSeccion icono="⚪" titulo="Ingresos sin egresos asignados" contador={asignacionesSinGastos.length} />
            <span className="text-xs font-medium text-brand-600 whitespace-nowrap">
              {mostrarSinGastos ? 'Ocultar ▲' : 'Mostrar ▾'}
            </span>
          </button>
          {mostrarSinGastos && (
            <>
              <p className="text-xs text-slate-400 mt-2 mb-2">
                Tienen su monto completo disponible. Para usarlos, elige este ingreso desde el selector de cualquier
                egreso de arriba.
              </p>
              <ul className="divide-y divide-slate-100">
                {asignacionesSinGastos.map(({ ingreso, disponible }) => (
                  <li key={ingreso.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <div className="min-w-0 truncate">
                      <span className="text-slate-700">{ingreso.detalle}</span>{' '}
                      <span className={`text-xs ${ingreso.estado === 'COBRADO' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {ingreso.estado}
                      </span>
                    </div>
                    <span className="font-semibold text-emerald-600 whitespace-nowrap">
                      Disponible {formatMonto(disponible)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
