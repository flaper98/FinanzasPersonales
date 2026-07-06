import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { alertasVencimiento, dashboardTotals } from '../../lib/calculations';
import { monthLabel } from '../../lib/monthUtils';
import { SummaryCards } from './SummaryCards';
import { AlertsPanel } from './AlertsPanel';

function formatMonto(n: number): string {
  return n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 });
}

function SaldoInicialEditor() {
  const { selectedMonth, actualizarSaldoInicial } = useFinance();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState('');
  const saldoInicial = selectedMonth?.saldoInicial ?? 0;

  function empezarEdicion() {
    setValor(saldoInicial.toString());
    setEditando(true);
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    actualizarSaldoInicial(parseFloat(valor) || 0);
    setEditando(false);
  }

  if (editando) {
    return (
      <form onSubmit={guardar} className="flex items-center gap-2 text-sm">
        <label className="text-slate-500">Monto actual (con el que empiezas el mes):</label>
        <input
          autoFocus
          type="number"
          step="0.01"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="w-32 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          className="px-3 py-1 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={() => setEditando(false)}
          className="px-3 py-1 rounded-lg text-slate-500 text-xs hover:bg-slate-100"
        >
          Cancelar
        </button>
      </form>
    );
  }

  return (
    <button onClick={empezarEdicion} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600">
      <span>Monto actual:</span>
      <span className="font-semibold text-slate-700">{formatMonto(saldoInicial)}</span>
      <span className="text-xs underline">editar</span>
    </button>
  );
}

export function Dashboard() {
  const { selectedMonth, selectedMonthKey } = useFinance();
  const totals = dashboardTotals(selectedMonth);
  const alertas = alertasVencimiento(selectedMonth);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-slate-800">{monthLabel(selectedMonthKey)}</h2>
        <SaldoInicialEditor />
      </div>
      <SummaryCards totals={totals} />
      <AlertsPanel alertas={alertas} />

      {(selectedMonth?.egresos.length ?? 0) === 0 && (selectedMonth?.ingresos.length ?? 0) === 0 && (
        <div className="text-center text-slate-500 text-sm py-10">
          Este mes todavía no tiene movimientos. Agrégalos desde las pestañas Ingresos y Egresos.
        </div>
      )}
    </div>
  );
}
