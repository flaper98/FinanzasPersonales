import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { analisisAbonoCapital, resumenPrestamo } from '../../lib/calculations';
import type { Prestamo } from '../../types';
import { PrestamoForm } from './PrestamoForm';

function formatMonto(n: number): string {
  return n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 });
}

function AnalisisPrestamo({ prestamo }: { prestamo: Prestamo }) {
  const { selectedMonth } = useFinance();
  const analisis = analisisAbonoCapital(selectedMonth, prestamo);

  if (analisis.sugerencias.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        Ningún ingreso de este mes tiene plata libre todavía (o ya asignaste todo en el Planificador). En cuanto te
        sobre algo, aparecerá aquí como candidato para un abono extra a capital.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        Con lo que ya tienes comprometido en el Planificador, estos ingresos todavía tienen plata libre este mes.
        Aplicarla como <span className="font-medium">abono extraordinario a capital</span> (no solo la cuota normal)
        reduce el saldo que sigue generando interés:
      </p>
      <ul className="divide-y divide-slate-100">
        {analisis.sugerencias.map((s) => (
          <li key={s.ingreso.id} className="flex items-center justify-between py-2 text-sm">
            <span className="text-slate-700">{s.ingreso.detalle}</span>
            <span className="font-semibold text-emerald-600">{formatMonto(s.disponible)} libres</span>
          </li>
        ))}
      </ul>
      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-600">Total disponible para abonar</span>
          <span className="font-semibold text-slate-800">{formatMonto(analisis.totalDisponible)}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-slate-600">Interés estimado que te ahorrarías</span>
          <span className="font-semibold text-emerald-700">≈ {formatMonto(analisis.ahorroEstimado)}</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Estimado según la proporción interés/capital de tu cronograma actual, no es el cálculo exacto del banco.
          Antes de abonar, confirma con {prestamo.entidad} que el abono se aplica a capital y no solo adelanta
          cuotas.
        </p>
      </div>
    </div>
  );
}

function PrestamoCard({
  prestamo,
  onEdit,
  onDelete,
}: {
  prestamo: Prestamo;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const resumen = resumenPrestamo(prestamo);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-4">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <div className="font-semibold text-slate-800">{prestamo.entidad}</div>
          {prestamo.detalle && <div className="text-xs text-slate-400">{prestamo.detalle}</div>}
        </div>
        <div className="flex gap-3 text-xs font-medium">
          <button onClick={onEdit} className="text-brand-600 hover:underline">
            Editar
          </button>
          <button
            onClick={() => confirm(`¿Eliminar el préstamo de "${prestamo.entidad}"?`) && onDelete()}
            className="text-rose-600 hover:underline"
          >
            Eliminar
          </button>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>
            Cuota {prestamo.cuotaActual}/{prestamo.cuotasTotales}
          </span>
          <span>{resumen.cuotasRestantes} cuotas restantes</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${resumen.progresoPct}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <div className="text-xs text-slate-400">Cuota mensual</div>
          <div className="font-semibold text-slate-700">{formatMonto(prestamo.cuotaMensual)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Capital pendiente</div>
          <div className="font-semibold text-slate-700">{formatMonto(prestamo.saldoCapital)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Interés pendiente</div>
          <div className="font-semibold text-slate-700">{formatMonto(prestamo.interesPendiente)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Total pendiente</div>
          <div className="font-semibold text-slate-800">{formatMonto(resumen.totalPendiente)}</div>
        </div>
      </div>

      {prestamo.tasaTCEA > 0 && <div className="text-xs text-slate-400">TCEA: {prestamo.tasaTCEA}% anual</div>}

      <div className="border-t border-slate-100 pt-3">
        <h4 className="text-sm font-semibold text-slate-700 mb-2">💡 Análisis: cómo reducir esta deuda</h4>
        <AnalisisPrestamo prestamo={prestamo} />
      </div>
    </div>
  );
}

export function PrestamosPage() {
  const { state, agregarPrestamo, actualizarPrestamo, eliminarPrestamo } = useFinance();
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<Prestamo | null>(null);

  const prestamos = [...state.prestamos].sort(
    (a, b) => resumenPrestamo(b).ratioInteres - resumenPrestamo(a).ratioInteres,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Préstamos</h2>
          <p className="text-sm text-slate-500 mt-1">
            Créditos a cuotas fijas (bancos, financieras), separados de tus egresos del mes a mes.
          </p>
        </div>
        <button
          onClick={() => setCreando(true)}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 whitespace-nowrap"
        >
          + Agregar préstamo
        </button>
      </div>

      {prestamos.length > 1 && (
        <p className="text-xs text-slate-400">
          Ordenados de mayor a menor interés pendiente por sol de capital: si tienes que elegir a cuál abonarle
          primero, prioriza el de arriba.
        </p>
      )}

      {prestamos.length === 0 ? (
        <p className="text-sm text-slate-500 py-8 text-center">
          No tienes préstamos registrados. Agrega uno con los datos de tu cronograma de cuotas.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {prestamos.map((p) => (
            <PrestamoCard
              key={p.id}
              prestamo={p}
              onEdit={() => setEditando(p)}
              onDelete={() => eliminarPrestamo(p.id)}
            />
          ))}
        </div>
      )}

      {creando && <PrestamoForm onSubmit={(input) => agregarPrestamo(input)} onClose={() => setCreando(false)} />}
      {editando && (
        <PrestamoForm
          initial={editando}
          onSubmit={(input) => actualizarPrestamo(editando.id, input)}
          onClose={() => setEditando(null)}
        />
      )}
    </div>
  );
}
