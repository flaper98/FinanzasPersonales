import { useState } from 'react';
import type { ItemPresupuesto, PresupuestoMensual } from '../../types';
import { Modal } from '../common/Modal';
import { totalItemsPresupuesto } from '../../lib/calculations';
import { newId } from '../../lib/id';

const inputClase =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

function formatMonto(n: number): string {
  return n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 });
}

function categoriaVacia(): ItemPresupuesto {
  return { id: newId(), nombre: '', monto: 0 };
}

export function PresupuestoMensualForm({
  initial,
  totalIngresosMes,
  onSubmit,
  onClose,
}: {
  initial: PresupuestoMensual;
  /** Total de ingresos del mes, para el atajo "usar total de ingresos". */
  totalIngresosMes: number;
  onSubmit: (input: PresupuestoMensual) => void;
  onClose: () => void;
}) {
  const [montoTotal, setMontoTotal] = useState(initial.montoTotal.toString());
  const [categorias, setCategorias] = useState<ItemPresupuesto[]>(
    initial.categorias.length ? initial.categorias : [categoriaVacia()],
  );

  function actualizarCategoria(id: string, cambios: Partial<ItemPresupuesto>) {
    setCategorias((prev) => prev.map((c) => (c.id === id ? { ...c, ...cambios } : c)));
  }

  function eliminarCategoria(id: string) {
    setCategorias((prev) => (prev.length > 1 ? prev.filter((c) => c.id !== id) : prev));
  }

  const montoTotalNum = parseFloat(montoTotal) || 0;
  const totalAsignado = totalItemsPresupuesto(categorias);
  const disponible = montoTotalNum - totalAsignado;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      montoTotal: montoTotalNum,
      categorias: categorias
        .filter((c) => c.nombre.trim() !== '')
        .map((c) => ({ ...c, nombre: c.nombre.trim() })),
    });
    onClose();
  }

  return (
    <Modal title="Editar presupuesto mensual" onClose={onClose} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Monto total del mes</label>
          <div className="flex gap-2">
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={montoTotal}
              onChange={(e) => setMontoTotal(e.target.value)}
              className={inputClase}
            />
            {totalIngresosMes > 0 && (
              <button
                type="button"
                onClick={() => setMontoTotal(totalIngresosMes.toString())}
                className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 whitespace-nowrap"
              >
                Usar ingresos ({formatMonto(totalIngresosMes)})
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-700">Categorías</p>
            <button
              type="button"
              onClick={() => setCategorias((prev) => [...prev, categoriaVacia()])}
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              + Agregar categoría
            </button>
          </div>
          <div className="space-y-2">
            {categorias.map((cat) => (
              <div key={cat.id} className="border border-slate-200 rounded-lg p-2 space-y-2">
                <input
                  value={cat.nombre}
                  onChange={(e) => actualizarCategoria(cat.id, { nombre: e.target.value })}
                  placeholder="Ej. Alquiler, comida, transporte, ahorro…"
                  className={`${inputClase} w-full`}
                />
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-slate-500">
                    Monto
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={cat.monto}
                      onChange={(e) => actualizarCategoria(cat.id, { monto: parseFloat(e.target.value) || 0 })}
                      className={`${inputClase} w-28`}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => eliminarCategoria(cat.id)}
                    disabled={categorias.length <= 1}
                    className="ml-auto text-rose-600 hover:underline text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-600">Monto total</span>
            <span className="font-medium text-slate-800">{formatMonto(montoTotalNum)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Repartido en categorías</span>
            <span className="font-medium text-slate-800">{formatMonto(totalAsignado)}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-200">
            <span className="text-slate-600">Sin repartir</span>
            <span className={`font-bold ${disponible < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatMonto(disponible)}
            </span>
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
