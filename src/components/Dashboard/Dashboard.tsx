import { useFinance } from '../../context/FinanceContext';
import { alertasVencimiento, dashboardTotals } from '../../lib/calculations';
import { monthLabel } from '../../lib/monthUtils';
import { SummaryCards } from './SummaryCards';
import { AlertsPanel } from './AlertsPanel';

export function Dashboard() {
  const { selectedMonth, selectedMonthKey } = useFinance();
  const totals = dashboardTotals(selectedMonth);
  const alertas = alertasVencimiento(selectedMonth);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-800">{monthLabel(selectedMonthKey)}</h2>
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
