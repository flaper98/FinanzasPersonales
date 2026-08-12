import { useState } from 'react';
import { Modal } from '../common/Modal';
import { simularAbonoCapital } from '../../lib/calculations';
import type { Prestamo } from '../../types';

function formatMonto(n: number): string {
  return n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 });
}

const MODALIDADES = [
  ['reducir_plazo', 'Reducir plazo'],
  ['reducir_cuota', 'Reducir cuota'],
] as const;

export function SimuladorAbonoModal({ prestamo, onClose }: { prestamo: Prestamo; onClose: () => void }) {
  const [monto, setMonto] = useState('');
  const [modalidad, setModalidad] = useState<'reducir_cuota' | 'reducir_plazo'>('reducir_plazo');
  const [verCronograma, setVerCronograma] = useState(false);

  const montoNum = parseFloat(monto) || 0;
  const resultado = montoNum > 0 ? simularAbonoCapital(prestamo, montoNum, modalidad) : null;

  return (
    <Modal title={`Simular abono a capital — ${prestamo.entidad}`} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Monto del abono extra</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={monto}
            onChange={(e) => {
              setMonto(e.target.value);
              setVerCronograma(false);
            }}
            placeholder="500.00"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="text-xs text-slate-400 mt-1">Capital pendiente actual: {formatMonto(prestamo.saldoCapital)}</p>
        </div>

        <div>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {MODALIDADES.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setModalidad(key);
                  setVerCronograma(false);
                }}
                className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  modalidad === key ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            {modalidad === 'reducir_plazo'
              ? 'La cuota mensual se mantiene igual y terminas de pagar antes.'
              : 'El número de cuotas se mantiene igual, pero cada una baja de monto.'}
          </p>
        </div>

        {!resultado && <p className="text-sm text-slate-400">Ingresa un monto para ver la simulación.</p>}

        {resultado && resultado.capitalTrasAbono <= 0 && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm text-emerald-700">
            Ese abono cubre todo el capital pendiente: liquidarías el préstamo por completo y te ahorrarías{' '}
            {formatMonto(resultado.interesOriginal)} en intereses que aún faltaban.
          </div>
        )}

        {resultado && resultado.capitalTrasAbono > 0 && (
          <>
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-600">{modalidad === 'reducir_plazo' ? 'Nuevo plazo' : 'Cuotas restantes'}</span>
                <span className="font-semibold text-slate-800">
                  {resultado.cuotasNuevo} {resultado.cuotasNuevo === 1 ? 'cuota' : 'cuotas'}
                  {modalidad === 'reducir_plazo' && (
                    <span className="text-slate-400 font-normal"> (antes {resultado.cuotasOriginal})</span>
                  )}
                </span>
              </div>
              {modalidad === 'reducir_cuota' && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Cuota mensual nueva</span>
                  <span className="font-semibold text-slate-800">
                    {formatMonto(resultado.cuotaMensualNueva)}{' '}
                    <span className="text-slate-400 font-normal">(antes {formatMonto(prestamo.cuotaMensual)})</span>
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600">Interés total si sigues así</span>
                <span className="font-semibold text-slate-800">{formatMonto(resultado.interesNuevo)}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-emerald-200">
                <span className="text-slate-600">Ahorro estimado en intereses</span>
                <span className="font-semibold text-emerald-700">{formatMonto(resultado.ahorroInteres)}</span>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setVerCronograma((v) => !v)}
                className="text-xs text-brand-600 hover:underline"
              >
                {verCronograma ? 'Ocultar cronograma nuevo' : 'Ver cronograma nuevo, cuota por cuota'}
              </button>
              {verCronograma && (
                <div className="mt-2 max-h-56 overflow-y-auto border border-slate-100 rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr className="text-left text-slate-500">
                        <th className="px-2 py-1 font-medium">#</th>
                        <th className="px-2 py-1 font-medium text-right">Capital</th>
                        <th className="px-2 py-1 font-medium text-right">Interés</th>
                        <th className="px-2 py-1 font-medium text-right">Cuota</th>
                        <th className="px-2 py-1 font-medium text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultado.cronogramaNuevo.map((c) => (
                        <tr key={c.numero} className="border-t border-slate-50">
                          <td className="px-2 py-1 text-slate-500">{c.numero}</td>
                          <td className="px-2 py-1 text-right">{formatMonto(c.capital)}</td>
                          <td className="px-2 py-1 text-right">{formatMonto(c.interes)}</td>
                          <td className="px-2 py-1 text-right font-medium">{formatMonto(c.cuota)}</td>
                          <td className="px-2 py-1 text-right text-slate-500">{formatMonto(c.saldo)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        <p className="text-xs text-slate-400">
          Estimado a partir de tu cuota, capital y cuotas restantes actuales, asumiendo una tasa mensual constante —
          no es el cálculo exacto del banco. Confirma con {prestamo.entidad} antes de abonar: algunos bancos cobran
          comisión por prepago o requieren pedir expresamente que se aplique a capital.
        </p>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
