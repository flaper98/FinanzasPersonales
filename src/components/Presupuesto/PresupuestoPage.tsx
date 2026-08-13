import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { dashboardTotals, gananciaProyecto, resumenPresupuestoMensual, totalItemsPresupuesto } from '../../lib/calculations';
import { monthLabel } from '../../lib/monthUtils';
import type { PresupuestoProyecto } from '../../types';
import { PresupuestoMensualForm } from './PresupuestoMensualForm';
import { PresupuestoProyectoForm } from './PresupuestoProyectoForm';

function formatMonto(n: number): string {
  return n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 });
}

function BarraReparto({ pct, negativo }: { pct: number; negativo: boolean }) {
  return (
    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${negativo ? 'bg-rose-500' : 'bg-brand-500'}`}
        style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }}
      />
    </div>
  );
}

function SeccionMensual() {
  const { selectedMonth, selectedMonthKey, actualizarPresupuestoMensual } = useFinance();
  const [editando, setEditando] = useState(false);
  const resumen = resumenPresupuestoMensual(selectedMonth);
  const totalIngresosMes = dashboardTotals(selectedMonth).totalIngresos;
  const sobregirado = resumen.disponible < 0;
  const pct = resumen.montoTotal > 0 ? (resumen.totalAsignado / resumen.montoTotal) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-slate-500">
          Presupuesto de <span className="font-medium text-slate-700">{monthLabel(selectedMonthKey)}</span>: cuánto
          tenés para repartir este mes y en qué categorías planeás gastarlo.
        </p>
        <button
          onClick={() => setEditando(true)}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 whitespace-nowrap"
        >
          Editar presupuesto
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <BarraReparto pct={pct} negativo={sobregirado} />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 text-sm">
          <div>
            <div className="text-xs text-slate-400">Monto total</div>
            <div className="font-semibold text-slate-700">{formatMonto(resumen.montoTotal)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Repartido en categorías</div>
            <div className="font-semibold text-slate-700">{formatMonto(resumen.totalAsignado)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">{sobregirado ? 'Te pasaste por' : 'Sin repartir (ganancia)'}</div>
            <div className={`font-semibold ${sobregirado ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatMonto(Math.abs(resumen.disponible))}
            </div>
          </div>
        </div>

        {resumen.montoTotal === 0 ? (
          <p className="text-xs text-slate-400 mt-3">
            Todavía no configuraste el presupuesto de este mes. Usa "Editar presupuesto" para empezar.
          </p>
        ) : resumen.categorias.length === 0 ? (
          <p className="text-xs text-slate-400 mt-3">Sin categorías todavía — todo el monto está sin repartir.</p>
        ) : (
          <ul className="divide-y divide-slate-100 mt-3">
            {resumen.categorias.map((cat) => (
              <li key={cat.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-700">{cat.nombre}</span>
                <span className="font-medium text-slate-700">{formatMonto(cat.monto)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editando && (
        <PresupuestoMensualForm
          initial={resumen}
          totalIngresosMes={totalIngresosMes}
          onSubmit={(input) => actualizarPresupuestoMensual(input)}
          onClose={() => setEditando(false)}
        />
      )}
    </div>
  );
}

function TarjetaProyecto({
  proyecto,
  onEdit,
  onDelete,
  onEnviarIngreso,
  onEnviarEgresos,
}: {
  proyecto: PresupuestoProyecto;
  onEdit: () => void;
  onDelete: () => void;
  onEnviarIngreso: () => void;
  onEnviarEgresos: () => void;
}) {
  const ganancia = gananciaProyecto(proyecto);
  const totalCostos = totalItemsPresupuesto(proyecto.costos);
  const pct = proyecto.montoTotal > 0 ? (totalCostos / proyecto.montoTotal) * 100 : 0;
  const enPerdida = ganancia < 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold text-slate-800">{proyecto.nombre}</div>
        <div className="flex gap-3 text-xs font-medium shrink-0">
          <button onClick={onEdit} className="text-brand-600 hover:underline">
            Editar
          </button>
          <button
            onClick={() => confirm(`¿Eliminar el proyecto "${proyecto.nombre}"?`) && onDelete()}
            className="text-rose-600 hover:underline"
          >
            Eliminar
          </button>
        </div>
      </div>

      <BarraReparto pct={pct} negativo={enPerdida} />

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <div className="text-xs text-slate-400">Monto total</div>
          <div className="font-semibold text-slate-700">{formatMonto(proyecto.montoTotal)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Costos</div>
          <div className="font-semibold text-slate-700">{formatMonto(totalCostos)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Ganancia</div>
          <div className={`font-semibold ${enPerdida ? 'text-rose-600' : 'text-emerald-600'}`}>
            {formatMonto(ganancia)}
          </div>
        </div>
      </div>

      {proyecto.costos.length > 0 && (
        <ul className="divide-y divide-slate-100 border-t border-slate-100 pt-2">
          {proyecto.costos.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-1.5 text-sm">
              <span className="text-slate-600">{c.nombre}</span>
              <span className="text-slate-600">{formatMonto(c.monto)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-2 text-xs font-medium">
        <button onClick={onEnviarIngreso} className="text-emerald-600 hover:underline">
          → Enviar monto total a Ingresos
        </button>
        <button
          onClick={onEnviarEgresos}
          disabled={totalCostos === 0}
          className="text-rose-600 hover:underline disabled:opacity-30 disabled:cursor-not-allowed"
        >
          → Enviar costos a Egresos
        </button>
      </div>
    </div>
  );
}

function SeccionProyectos() {
  const {
    state,
    selectedMonthKey,
    agregarPresupuestoProyecto,
    actualizarPresupuestoProyecto,
    eliminarPresupuestoProyecto,
    agregarIngresoDesdeProyecto,
    agregarEgresosDesdeProyecto,
  } = useFinance();
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<PresupuestoProyecto | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  function handleEnviarIngreso(p: PresupuestoProyecto) {
    agregarIngresoDesdeProyecto(p);
    setMensaje(`Se agregó "${p.nombre}" a Ingresos de ${monthLabel(selectedMonthKey)}, como NO COBRADO.`);
  }

  function handleEnviarEgresos(p: PresupuestoProyecto) {
    agregarEgresosDesdeProyecto(p);
    setMensaje(`Se agregaron los costos de "${p.nombre}" a Egresos de ${monthLabel(selectedMonthKey)}, como NO PAGADO.`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-slate-500">
          Cuánto vas a cobrar por cada proyecto o trabajo, contra cuánto planeás gastar en costos, para ver la
          ganancia real.
        </p>
        <button
          onClick={() => setCreando(true)}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 whitespace-nowrap"
        >
          + Nuevo proyecto
        </button>
      </div>

      {mensaje && <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">{mensaje}</p>}

      {state.presupuestosProyecto.length > 0 && (
        <p className="text-xs text-slate-400">
          "Enviar a Ingresos/Egresos" los agrega al mes que tengas seleccionado arriba ({monthLabel(selectedMonthKey)}
          ) — cambialo desde el selector de mes si querés otro.
        </p>
      )}

      {state.presupuestosProyecto.length === 0 ? (
        <p className="text-sm text-slate-500 py-8 text-center">
          No tienes proyectos todavía. Creá uno, opcionalmente vinculado a una proforma.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {state.presupuestosProyecto.map((p) => (
            <TarjetaProyecto
              key={p.id}
              proyecto={p}
              onEdit={() => setEditando(p)}
              onDelete={() => eliminarPresupuestoProyecto(p.id)}
              onEnviarIngreso={() => handleEnviarIngreso(p)}
              onEnviarEgresos={() => handleEnviarEgresos(p)}
            />
          ))}
        </div>
      )}

      {creando && (
        <PresupuestoProyectoForm
          proformas={state.proformas}
          onSubmit={(input) => agregarPresupuestoProyecto(input)}
          onClose={() => setCreando(false)}
        />
      )}
      {editando && (
        <PresupuestoProyectoForm
          initial={editando}
          proformas={state.proformas}
          onSubmit={(input) => actualizarPresupuestoProyecto(editando.id, input)}
          onClose={() => setEditando(null)}
        />
      )}
    </div>
  );
}

export function PresupuestoPage() {
  const [modo, setModo] = useState<'mensual' | 'proyecto'>('mensual');

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Presupuesto</h2>
        <p className="text-sm text-slate-500 mt-1">
          Repartí un presupuesto en categorías y mirá cuánto te queda de ganancia.
        </p>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {(
          [
            ['mensual', 'Mensual'],
            ['proyecto', 'Por proyecto'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setModo(key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
              modo === key ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {modo === 'mensual' ? <SeccionMensual /> : <SeccionProyectos />}
    </div>
  );
}
