import type { AlertaVencimiento } from '../../lib/calculations';
import { formatIsoDate } from '../../lib/monthUtils';

function mensajeUrgencia(dias: number, vencido: boolean): string {
  if (vencido) return `Vencido hace ${Math.abs(dias)} día${Math.abs(dias) === 1 ? '' : 's'}`;
  if (dias === 0) return 'Vence hoy';
  return `Vence en ${dias} día${dias === 1 ? '' : 's'}`;
}

export function AlertsPanel({ alertas }: { alertas: AlertaVencimiento[] }) {
  if (alertas.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-sm">
        Sin vencimientos próximos. Todo al día.
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-amber-900 mb-3">⚠ Vencimientos próximos</h3>
      <ul className="space-y-2">
        {alertas.map(({ egreso, diasRestantes, vencido }) => (
          <li
            key={egreso.id}
            className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${
              vencido ? 'bg-rose-100 text-rose-900' : 'bg-white text-amber-900 border border-amber-200'
            }`}
          >
            <div>
              <span className="font-medium">{egreso.detalle}</span>
              <span className="text-slate-500"> · {formatIsoDate(egreso.fecha)}</span>
            </div>
            <span className="font-semibold whitespace-nowrap">{mensajeUrgencia(diasRestantes, vencido)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
