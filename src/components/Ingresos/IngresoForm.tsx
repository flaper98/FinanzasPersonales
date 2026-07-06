import { useState } from 'react';
import type { Ingreso, NewIngresoInput } from '../../types';
import { Modal } from '../common/Modal';

export function IngresoForm({
  initial,
  onSubmit,
  onClose,
}: {
  initial?: Ingreso;
  onSubmit: (input: NewIngresoInput) => void;
  onClose: () => void;
}) {
  const [detalle, setDetalle] = useState(initial?.detalle ?? '');
  const [monto, setMonto] = useState(initial?.monto?.toString() ?? '');
  const [sinFecha, setSinFecha] = useState(initial ? initial.fecha === null : false);
  const [fecha, setFecha] = useState(initial?.fecha ?? '');
  const [fijo, setFijo] = useState(initial?.fijo ?? false);
  const [estado, setEstado] = useState(initial?.estado ?? 'NO COBRADO');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      detalle: detalle.trim(),
      monto: parseFloat(monto) || 0,
      fecha: sinFecha ? null : fecha || null,
      fijo,
      estado,
    });
    onClose();
  }

  return (
    <Modal title={initial ? 'Editar ingreso' : 'Nuevo ingreso'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Detalle</label>
          <input
            required
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
            placeholder="Sueldo NTTDATA"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Monto</label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="2850"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
          <input
            type="date"
            disabled={sinFecha}
            value={fecha ?? ''}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50"
          />
          <label className="flex items-center gap-2 mt-2 text-sm text-slate-600">
            <input type="checkbox" checked={sinFecha} onChange={(e) => setSinFecha(e.target.checked)} />
            Aún por definir
          </label>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={fijo} onChange={(e) => setFijo(e.target.checked)} />
            Fijo (ej. sueldo mensual: se arrastra automáticamente al crear un nuevo mes)
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
          <div className="flex gap-2">
            {(['NO COBRADO', 'COBRADO'] as const).map((e) => (
              <button
                type="button"
                key={e}
                onClick={() => setEstado(e)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition ${
                  estado === e
                    ? e === 'COBRADO'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

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
