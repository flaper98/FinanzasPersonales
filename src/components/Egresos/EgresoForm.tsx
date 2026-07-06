import { useState } from 'react';
import type { Egreso, NewEgresoInput, TipoEgreso } from '../../types';
import { Modal } from '../common/Modal';
import { useFinance } from '../../context/FinanceContext';
import { TARJETA_CREDITO } from '../../lib/calculations';
import { todayIso } from '../../lib/monthUtils';

export function EgresoForm({
  initial,
  onSubmit,
  onClose,
}: {
  initial?: Egreso;
  onSubmit: (input: NewEgresoInput) => void;
  onClose: () => void;
}) {
  const [detalle, setDetalle] = useState(initial?.detalle ?? '');
  const [monto, setMonto] = useState(initial?.monto?.toString() ?? '');
  const [fecha, setFecha] = useState(initial?.fecha ?? todayIso());
  const [tipo, setTipo] = useState<TipoEgreso>(initial?.tipo ?? 'FIJO');
  const [siempre, setSiempre] = useState(
    initial ? initial.cuotasTotales === 'siempre' : false,
  );
  const [cuotasTotales, setCuotasTotales] = useState(
    initial && typeof initial.cuotasTotales === 'number' ? initial.cuotasTotales.toString() : '1',
  );
  const [cuotaActual, setCuotaActual] = useState(
    initial && typeof initial.cuotaActual === 'number' ? initial.cuotaActual.toString() : '0',
  );
  const [accion, setAccion] = useState(initial?.accion ?? 'NO PAGADO');
  const [metodoPago, setMetodoPago] = useState<string>(
    initial?.pagoConTarjeta ? TARJETA_CREDITO : (initial?.ingresoId ?? ''),
  );
  const [prestamoId, setPrestamoId] = useState(initial?.prestamoId ?? '');
  const { selectedMonth, state } = useFinance();
  const ingresosDisponibles = selectedMonth?.ingresos ?? [];
  const prestamosDisponibles = state.prestamos;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pagoConTarjeta = metodoPago === TARJETA_CREDITO;
    onSubmit({
      detalle: detalle.trim(),
      monto: parseFloat(monto) || 0,
      fecha,
      tipo,
      cuotasTotales: siempre ? 'siempre' : parseInt(cuotasTotales, 10) || 1,
      cuotaActual: siempre ? 'siempre' : parseInt(cuotaActual, 10) || 0,
      accion,
      ingresoId: pagoConTarjeta ? null : metodoPago || null,
      pagoConTarjeta,
      prestamoId: prestamoId || null,
    });
    onClose();
  }

  return (
    <Modal title={initial ? 'Editar egreso' : 'Nuevo egreso'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Detalle</label>
          <input
            required
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
            placeholder="Pago Mi Banco"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Monto</label>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="664"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
            <input
              required
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de egreso</label>
          <div className="flex gap-2">
            {(['FIJO', 'NO FIJO'] as const).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setTipo(t)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition ${
                  tipo === t
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-slate-600 mb-2">
            <input type="checkbox" checked={siempre} onChange={(e) => setSiempre(e.target.checked)} />
            Recurrente sin fin ("siempre" — luz, internet, streaming, etc.)
          </label>
          {!siempre && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cuotas totales</label>
                <input
                  type="number"
                  min="1"
                  value={cuotasTotales}
                  onChange={(e) => setCuotasTotales(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cuota actual</label>
                <input
                  type="number"
                  min="0"
                  value={cuotaActual}
                  onChange={(e) => setCuotaActual(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
          <div className="flex gap-2">
            {(['NO PAGADO', 'PAGADO'] as const).map((a) => (
              <button
                type="button"
                key={a}
                onClick={() => setAccion(a)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition ${
                  accion === a
                    ? a === 'PAGADO'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cómo lo vas a pagar</label>
          <select
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Sin asignar</option>
            <option value={TARJETA_CREDITO}>💳 Tarjeta de crédito</option>
            {ingresosDisponibles.map((i) => (
              <option key={i.id} value={i.id}>
                {i.detalle} (S/ {i.monto.toLocaleString('es-PE')})
              </option>
            ))}
          </select>
        </div>

        {prestamosDisponibles.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">¿Es la cuota de un préstamo?</label>
            <select
              value={prestamoId}
              onChange={(e) => setPrestamoId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">No</option>
              {prestamosDisponibles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.entidad}
                  {p.detalle ? ` — ${p.detalle}` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">
              Si lo vinculas, marcar este egreso como Pagado descuenta capital e interés de ese préstamo
              automáticamente.
            </p>
          </div>
        )}

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
