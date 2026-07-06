import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { agruparMontoPorDetalle, totalPorTipo, totalIngresos } from '../../lib/calculations';
import { monthLabelShort, sortedMonthKeys } from '../../lib/monthUtils';

const PALETTE = ['#2563eb', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

function formatMonto(n: number): string {
  return n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 });
}

export function GraficosPage() {
  const { state, selectedMonth, selectedMonthKey } = useFinance();

  const categoriaData = useMemo(
    () => agruparMontoPorDetalle(selectedMonth?.egresos ?? []).slice(0, 8),
    [selectedMonth],
  );

  const historicoData = useMemo(() => {
    return sortedMonthKeys(Object.keys(state.months)).map((key) => {
      const month = state.months[key];
      return {
        mes: monthLabelShort(key),
        Ingresos: totalIngresos(month.ingresos),
        Egresos: month.egresos.reduce((s, e) => s + e.monto, 0),
      };
    });
  }, [state.months]);

  const fijoVsNoFijo = useMemo(() => {
    const totales = totalPorTipo(selectedMonth?.egresos ?? []);
    return [
      { tipo: 'FIJO', monto: totales.FIJO },
      { tipo: 'NO FIJO', monto: totales['NO FIJO'] },
    ];
  }, [selectedMonth]);

  const sinDatosCategoria = categoriaData.length === 0;
  const sinDatosFijo = fijoVsNoFijo.every((d) => d.monto === 0);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-800">Gráficos — {monthLabelShort(selectedMonthKey)}</h2>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Gasto por detalle (mes actual)</h3>
          {sinDatosCategoria ? (
            <p className="text-sm text-slate-400 text-center py-16">Sin egresos este mes.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoriaData}
                  dataKey="monto"
                  nameKey="detalle"
                  cx="38%"
                  cy="50%"
                  outerRadius={90}
                >
                  {categoriaData.map((_, idx) => (
                    <Cell key={idx} fill={PALETTE[idx % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatMonto(value)} />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Egresos FIJO vs NO FIJO (mes actual)</h3>
          {sinDatosFijo ? (
            <p className="text-sm text-slate-400 text-center py-16">Sin egresos este mes.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={fijoVsNoFijo}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="tipo" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => formatMonto(value)} />
                <Bar dataKey="monto" radius={[6, 6, 0, 0]}>
                  {fijoVsNoFijo.map((d, idx) => (
                    <Cell key={idx} fill={d.tipo === 'FIJO' ? '#2563eb' : '#8b5cf6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Histórico: ingresos vs egresos</h3>
        {historicoData.length < 2 ? (
          <p className="text-sm text-slate-400 text-center py-16">
            Necesitas al menos dos meses registrados para ver la evolución histórica.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicoData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => formatMonto(value)} />
              <Legend />
              <Line type="monotone" dataKey="Ingresos" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Egresos" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
