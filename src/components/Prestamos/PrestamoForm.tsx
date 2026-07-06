import { useState } from 'react';
import type { NewPrestamoInput, Prestamo } from '../../types';
import { Modal } from '../common/Modal';

export function PrestamoForm({
  initial,
  onSubmit,
  onClose,
}: {
  initial?: Prestamo;
  onSubmit: (input: NewPrestamoInput) => void;
  onClose: () => void;
}) {
  const [entidad, setEntidad] = useState(initial?.entidad ?? '');
  const [detalle, setDetalle] = useState(initial?.detalle ?? '');
  const [cuotaMensual, setCuotaMensual] = useState(initial?.cuotaMensual?.toString() ?? '');
  const [cuotasTotales, setCuotasTotales] = useState(initial?.cuotasTotales?.toString() ?? '');
  const [cuotaActual, setCuotaActual] = useState(initial?.cuotaActual?.toString() ?? '0');
  const [saldoCapital, setSaldoCapital] = useState(initial?.saldoCapital?.toString() ?? '');
  const [interesPendiente, setInteresPendiente] = useState(initial?.interesPendiente?.toString() ?? '');
  const [tasaTCEA, setTasaTCEA] = useState(initial?.tasaTCEA?.toString() ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      entidad: entidad.trim(),
      detalle: detalle.trim(),
      cuotaMensual: parseFloat(cuotaMensual) || 0,
      cuotasTotales: parseInt(cuotasTotales, 10) || 0,
      cuotaActual: parseInt(cuotaActual, 10) || 0,
      saldoCapital: parseFloat(saldoCapital) || 0,
      interesPendiente: parseFloat(interesPendiente) || 0,
      tasaTCEA: parseFloat(tasaTCEA) || 0,
    });
    onClose();
  }

  return (
    <Modal title={initial ? 'Editar préstamo' : 'Nuevo préstamo'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Entidad</label>
            <input
              required
              value={entidad}
              onChange={(e) => setEntidad(e.target.value)}
              placeholder="MiBanco"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Detalle</label>
            <input
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              placeholder="Capital de trabajo"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cuota mensual</label>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={cuotaMensual}
              onChange={(e) => setCuotaMensual(e.target.value)}
              placeholder="663.90"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">TCEA (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={tasaTCEA}
              onChange={(e) => setTasaTCEA(e.target.value)}
              placeholder="46.39"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cuotas totales</label>
            <input
              required
              type="number"
              min="1"
              value={cuotasTotales}
              onChange={(e) => setCuotasTotales(e.target.value)}
              placeholder="24"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cuota actual (ya pagadas)</label>
            <input
              type="number"
              min="0"
              value={cuotaActual}
              onChange={(e) => setCuotaActual(e.target.value)}
              placeholder="5"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Saldo capital pendiente</label>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={saldoCapital}
              onChange={(e) => setSaldoCapital(e.target.value)}
              placeholder="9430.01"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Interés total pendiente</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={interesPendiente}
              onChange={(e) => setInteresPendiente(e.target.value)}
              placeholder="3184.77"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
        <p className="text-xs text-slate-400 -mt-2">
          Copia estos montos del cronograma de cuotas de tu banco (saldo del préstamo y la suma de "Int. Comp."
          restante). Actualízalos cada vez que te llegue un estado de cuenta nuevo.
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
