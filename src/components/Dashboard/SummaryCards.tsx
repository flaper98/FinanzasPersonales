import type { DashboardTotals } from '../../lib/calculations';

function formatMonto(n: number): string {
  return n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 });
}

function ProgressBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <div className="flex items-center justify-between text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
        <span>{label}</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
      <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

export function SummaryCards({ totals }: { totals: DashboardTotals }) {
  const desglose = [
    { label: 'Ingresos totales', value: formatMonto(totals.totalIngresos), tone: 'text-slate-700' },
    { label: 'Cobrado', value: formatMonto(totals.montoCobrado), tone: 'text-emerald-600' },
    { label: 'Por cobrar', value: formatMonto(totals.montoPorCobrar), tone: 'text-amber-600' },
    { label: 'Egresos totales', value: formatMonto(totals.totalEgresos), tone: 'text-slate-700' },
    { label: 'Pagado', value: formatMonto(totals.montoPagado), tone: 'text-rose-600' },
    { label: 'Pendiente', value: formatMonto(totals.montoPendiente), tone: 'text-amber-600' },
  ];

  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="bg-slate-900 rounded-xl shadow-sm p-5">
          <div className="text-xs font-medium text-slate-300 uppercase tracking-wide">
            Saldo real (actual + cobrado − pagado)
          </div>
          <div className={`text-3xl font-bold mt-1 ${totals.saldoReal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatMonto(totals.saldoReal)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Se actualiza al marcar Cobrado/Pagado</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Balance proyectado (mes completo)
          </div>
          <div className={`text-3xl font-bold mt-1 ${totals.balanceProyectado >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatMonto(totals.balanceProyectado)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Monto actual + ingresos totales − egresos totales, sin importar el estado
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {desglose.map((c) => (
          <div key={c.label} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{c.label}</div>
            <div className={`text-lg font-bold mt-1 ${c.tone}`}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <ProgressBar label="% de ingresos cobrados" pct={totals.pctCobrado} />
        <ProgressBar label="% de egresos pagados" pct={totals.pctPagado} />
      </div>
    </div>
  );
}
