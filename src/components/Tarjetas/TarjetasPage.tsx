import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { resumenTarjeta } from '../../lib/calculations';
import { formatIsoDate, ordenarPorFecha } from '../../lib/monthUtils';
import { useTipoCambio } from '../../lib/useTipoCambio';
import type { TarjetaCredito } from '../../types';
import { TarjetaForm } from './TarjetaForm';

function formatMonto(n: number): string {
  return n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 });
}

function formatUSD(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}

function BadgeDiasPago({ dias }: { dias: number }) {
  const texto = dias === 0 ? 'Vence hoy' : dias === 1 ? 'Vence mañana' : `Vence en ${dias} días`;
  const clase =
    dias <= 3
      ? 'bg-rose-100 text-rose-700'
      : dias <= 7
        ? 'bg-amber-100 text-amber-700'
        : 'bg-slate-100 text-slate-600';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${clase}`}>{texto}</span>;
}

function TipoCambioBanner({
  tc,
  override,
  onOverrideChange,
}: {
  tc: ReturnType<typeof useTipoCambio>;
  override: string;
  onOverrideChange: (valor: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-700">💱 Tipo de cambio USD → PEN</h3>
          {tc.error ? (
            <p className="text-xs text-rose-600 mt-1">
              {tc.error} Podés ingresar el tipo de cambio a mano mientras tanto.
            </p>
          ) : tc.valor ? (
            <p className="text-xs text-slate-400 mt-1">
              Referencial, no el de tu banco (que suele tener su propio margen). Actualizado{' '}
              {tc.actualizado ? formatIsoDate(tc.actualizado.slice(0, 10)) : ''} — se refresca ~1 vez al día.
            </p>
          ) : (
            <p className="text-xs text-slate-400 mt-1">{tc.cargando ? 'Consultando…' : 'Todavía sin datos.'}</p>
          )}
        </div>
        <div className="flex items-end gap-2 shrink-0">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">S/ por US$</label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={override}
              onChange={(e) => onOverrideChange(e.target.value)}
              placeholder={tc.valor ? tc.valor.toFixed(3) : '—'}
              className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            type="button"
            onClick={() => tc.actualizar()}
            disabled={tc.cargando}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            {tc.cargando ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TarjetaCard({
  tarjeta,
  tipoCambio,
  onEdit,
  onDelete,
}: {
  tarjeta: TarjetaCredito;
  tipoCambio: number | null;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { selectedMonth } = useFinance();
  const [verGastos, setVerGastos] = useState(false);
  const esUSD = tarjeta.moneda === 'USD';
  const tcListo = !esUSD || (tipoCambio !== null && tipoCambio > 0);
  const resumen = resumenTarjeta(tarjeta, selectedMonth, tipoCambio ?? undefined);
  const sobregirado = resumen.disponible < 0;

  const gastosDelMes = ordenarPorFecha(
    (selectedMonth?.egresos ?? []).filter((e) => e.tarjetaId === tarjeta.id),
    (e) => e.fecha,
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-4">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="font-semibold text-slate-800 flex items-center gap-2">
          💳 {tarjeta.nombre}
          {esUSD && (
            <span className="text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">US$</span>
          )}
        </div>
        <div className="flex gap-3 text-xs font-medium">
          <button onClick={onEdit} className="text-brand-600 hover:underline">
            Editar
          </button>
          <button
            onClick={() => confirm(`¿Eliminar la tarjeta "${tarjeta.nombre}"?`) && onDelete()}
            className="text-rose-600 hover:underline"
          >
            Eliminar
          </button>
        </div>
      </div>

      {!tcListo ? (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
          Esperando el tipo de cambio (arriba) para calcular el equivalente en soles. Mientras tanto: deuda US${' '}
          {formatUSD(tarjeta.saldoActual)}.
        </p>
      ) : (
        <>
          <div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${sobregirado ? 'bg-rose-500' : 'bg-purple-500'}`}
                style={{ width: `${resumen.pctUsado}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <div className="text-xs text-slate-400">Deuda actual</div>
              <div className="font-semibold text-slate-700">
                {esUSD ? formatUSD(tarjeta.saldoActual) : formatMonto(tarjeta.saldoActual)}
              </div>
              {esUSD && <div className="text-xs text-slate-400">≈ {formatMonto(resumen.saldoActualPEN)}</div>}
            </div>
            <div>
              <div className="text-xs text-slate-400">Por cargar este mes</div>
              <div className="font-semibold text-slate-700">{formatMonto(resumen.montoPorCargar)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Deuda proyectada</div>
              <div className="font-semibold text-slate-700">{formatMonto(resumen.deudaProyectada)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Disponible</div>
              <div className={`font-semibold ${sobregirado ? 'text-rose-600' : 'text-emerald-600'}`}>
                {formatMonto(resumen.disponible)}
              </div>
            </div>
          </div>
        </>
      )}

      {(tarjeta.diaCorte || tarjeta.diaPago) && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 border-t border-slate-100 pt-3">
          {tarjeta.diaCorte && resumen.proximaFechaCorte && (
            <span>
              Cierra el <span className="font-medium text-slate-700">{formatIsoDate(resumen.proximaFechaCorte)}</span>
            </span>
          )}
          {tarjeta.diaPago && resumen.proximaFechaPago && (
            <span className="flex items-center gap-1.5">
              Paga el <span className="font-medium text-slate-700">{formatIsoDate(resumen.proximaFechaPago)}</span>
              {resumen.diasParaPago !== null && <BadgeDiasPago dias={resumen.diasParaPago} />}
            </span>
          )}
        </div>
      )}

      {tarjeta.limite === 0 && <p className="text-xs text-slate-400">Todavía no configuraste la línea de crédito.</p>}

      <div className="border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => setVerGastos((v) => !v)}
          className="text-xs font-medium text-brand-600 hover:underline"
        >
          {verGastos ? 'Ocultar' : 'Ver'} gastos cargados este mes ({gastosDelMes.length})
        </button>
        {verGastos &&
          (gastosDelMes.length === 0 ? (
            <p className="text-sm text-slate-400 mt-2">Ningún egreso de este mes está cargado a esta tarjeta.</p>
          ) : (
            <ul className="divide-y divide-slate-100 mt-2">
              {gastosDelMes.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium text-slate-800 truncate">{e.detalle}</div>
                    <div className="text-xs text-slate-400">{formatIsoDate(e.fecha)}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold text-rose-600">{formatMonto(e.monto)}</div>
                    <span
                      className={`text-xs font-medium ${e.accion === 'PAGADO' ? 'text-emerald-600' : 'text-amber-600'}`}
                    >
                      {e.accion}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ))}
      </div>
    </div>
  );
}

export function TarjetasPage() {
  const { state, agregarTarjeta, actualizarTarjeta, eliminarTarjeta } = useFinance();
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<TarjetaCredito | null>(null);
  const [overrideTC, setOverrideTC] = useState('');

  const hayUSD = state.tarjetasCredito.some((t) => t.moneda === 'USD');
  const tc = useTipoCambio(hayUSD);
  const overrideNum = parseFloat(overrideTC);
  const tipoCambioEfectivo = overrideNum > 0 ? overrideNum : (tc.valor ?? null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Tarjetas de crédito</h2>
          <p className="text-sm text-slate-500 mt-1">
            Línea de crédito, deuda, fechas de corte/pago y gastos cargados a cada tarjeta, en un solo lugar.
          </p>
        </div>
        <button
          onClick={() => setCreando(true)}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 whitespace-nowrap"
        >
          + Agregar tarjeta
        </button>
      </div>

      {hayUSD && <TipoCambioBanner tc={tc} override={overrideTC} onOverrideChange={setOverrideTC} />}

      {state.tarjetasCredito.length === 0 ? (
        <p className="text-sm text-slate-500 py-8 text-center">
          No tienes tarjetas registradas. Agrega una con los datos de tu último estado de cuenta.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {state.tarjetasCredito.map((t) => (
            <TarjetaCard
              key={t.id}
              tarjeta={t}
              tipoCambio={tipoCambioEfectivo}
              onEdit={() => setEditando(t)}
              onDelete={() => eliminarTarjeta(t.id)}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400">
        Para cargar un gasto a una tarjeta, asígnala desde el formulario de Egresos ("Cómo lo vas a pagar") o desde la
        pestaña Planificador.
      </p>

      {creando && <TarjetaForm onSubmit={(input) => agregarTarjeta(input)} onClose={() => setCreando(false)} />}
      {editando && (
        <TarjetaForm
          initial={editando}
          onSubmit={(input) => actualizarTarjeta(editando.id, input)}
          onClose={() => setEditando(null)}
        />
      )}
    </div>
  );
}
