import { useState } from 'react';
import type { MonedaTarjeta, NewTarjetaCreditoInput, TarjetaCredito } from '../../types';
import { Modal } from '../common/Modal';

export function TarjetaForm({
  initial,
  onSubmit,
  onClose,
}: {
  initial?: TarjetaCredito;
  onSubmit: (input: NewTarjetaCreditoInput) => void;
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [moneda, setMoneda] = useState<MonedaTarjeta>(initial?.moneda ?? 'PEN');
  const [limite, setLimite] = useState(initial?.limite?.toString() ?? '');
  const [saldoActual, setSaldoActual] = useState(initial?.saldoActual?.toString() ?? '');
  const [diaCorte, setDiaCorte] = useState(initial?.diaCorte?.toString() ?? '');
  const [diaPago, setDiaPago] = useState(initial?.diaPago?.toString() ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      nombre: nombre.trim(),
      moneda,
      limite: parseFloat(limite) || 0,
      saldoActual: parseFloat(saldoActual) || 0,
      diaCorte: diaCorte ? Math.min(Math.max(parseInt(diaCorte, 10) || 1, 1), 31) : null,
      diaPago: diaPago ? Math.min(Math.max(parseInt(diaPago, 10) || 1, 1), 31) : null,
    });
    onClose();
  }

  return (
    <Modal title={initial ? 'Editar tarjeta' : 'Nueva tarjeta'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
          <input
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="BCP Visa Signature"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Moneda</label>
          <div className="flex gap-2">
            {(['PEN', 'USD'] as const).map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setMoneda(m)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition ${
                  moneda === m
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {m === 'PEN' ? 'Soles (S/)' : 'Dólares (US$)'}
              </button>
            ))}
          </div>
          {moneda === 'USD' && (
            <p className="text-xs text-slate-400 mt-1">
              Para tarjetas bimoneda con saldo en dólares. El equivalente en soles se calcula solo con el tipo de
              cambio del día (ver pestaña Tarjetas).
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Línea de crédito ({moneda === 'USD' ? 'US$' : 'S/'})
            </label>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={limite}
              onChange={(e) => setLimite(e.target.value)}
              placeholder="5000"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Deuda actual ({moneda === 'USD' ? 'US$' : 'S/'})
            </label>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={saldoActual}
              onChange={(e) => setSaldoActual(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Día de corte</label>
            <input
              type="number"
              min="1"
              max="31"
              value={diaCorte}
              onChange={(e) => setDiaCorte(e.target.value)}
              placeholder="5"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Día de pago</label>
            <input
              type="number"
              min="1"
              max="31"
              value={diaPago}
              onChange={(e) => setDiaPago(e.target.value)}
              placeholder="20"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
        <p className="text-xs text-slate-400 -mt-2">
          Días del 1 al 31 (los que aparecen en tu estado de cuenta). Si algún mes no existe ese día (ej. 31 en
          febrero), se usa el último día del mes. Déjalos vacíos si todavía no los sabes.
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700"
          >
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
}
