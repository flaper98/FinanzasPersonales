import { useState } from 'react';
import type { ItemPresupuesto, NewPresupuestoProyectoInput, PresupuestoProyecto, Proforma } from '../../types';
import { Modal } from '../common/Modal';
import { totalItemsPresupuesto, totalProforma } from '../../lib/calculations';
import { newId } from '../../lib/id';

const inputClase =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

function formatMonto(n: number): string {
  return n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 });
}

function costoVacio(): ItemPresupuesto {
  return { id: newId(), nombre: '', monto: 0 };
}

export function PresupuestoProyectoForm({
  initial,
  proformas,
  onSubmit,
  onClose,
}: {
  initial?: PresupuestoProyecto;
  proformas: Proforma[];
  onSubmit: (input: NewPresupuestoProyectoInput) => void;
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [proformaId, setProformaId] = useState(initial?.proformaId ?? '');
  const [montoTotal, setMontoTotal] = useState(initial?.montoTotal?.toString() ?? '');
  const [costos, setCostos] = useState<ItemPresupuesto[]>(initial?.costos?.length ? initial.costos : [costoVacio()]);

  function elegirProforma(id: string) {
    setProformaId(id);
    const proforma = proformas.find((p) => p.id === id);
    if (!proforma) return;
    if (!nombre.trim()) setNombre(`Proforma ${proforma.numero}${proforma.clienteNombre ? ` - ${proforma.clienteNombre}` : ''}`);
    if (!montoTotal || parseFloat(montoTotal) === 0) setMontoTotal(totalProforma(proforma.items).toString());
  }

  function actualizarCosto(id: string, cambios: Partial<ItemPresupuesto>) {
    setCostos((prev) => prev.map((c) => (c.id === id ? { ...c, ...cambios } : c)));
  }

  function eliminarCosto(id: string) {
    setCostos((prev) => (prev.length > 1 ? prev.filter((c) => c.id !== id) : prev));
  }

  const montoTotalNum = parseFloat(montoTotal) || 0;
  const totalCostos = totalItemsPresupuesto(costos);
  const ganancia = montoTotalNum - totalCostos;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      nombre: nombre.trim(),
      proformaId: proformaId || null,
      montoTotal: montoTotalNum,
      costos: costos
        .filter((c) => c.nombre.trim() !== '')
        .map((c) => ({ ...c, nombre: c.nombre.trim() })),
    });
    onClose();
  }

  return (
    <Modal title={initial ? 'Editar proyecto' : 'Nuevo proyecto'} onClose={onClose} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {proformas.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Vincular a una proforma (opcional)</label>
            <select value={proformaId} onChange={(e) => elegirProforma(e.target.value)} className={inputClase}>
              <option value="">Ninguna — proyecto libre</option>
              {proformas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.numero} {p.clienteNombre ? `— ${p.clienteNombre}` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">
              Al elegirla, completa nombre y monto total con los de la proforma (podés ajustarlos igual).
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del proyecto</label>
            <input
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Instalación UPS Municipalidad"
              className={inputClase}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Monto total a cobrar</label>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={montoTotal}
              onChange={(e) => setMontoTotal(e.target.value)}
              className={inputClase}
            />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-700">Costos</p>
            <button
              type="button"
              onClick={() => setCostos((prev) => [...prev, costoVacio()])}
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              + Agregar costo
            </button>
          </div>
          <div className="space-y-2">
            {costos.map((costo) => (
              <div key={costo.id} className="border border-slate-200 rounded-lg p-2 space-y-2">
                <input
                  value={costo.nombre}
                  onChange={(e) => actualizarCosto(costo.id, { nombre: e.target.value })}
                  placeholder="Ej. Materiales, mano de obra, transporte…"
                  className={`${inputClase} w-full`}
                />
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-slate-500">
                    Monto
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={costo.monto}
                      onChange={(e) => actualizarCosto(costo.id, { monto: parseFloat(e.target.value) || 0 })}
                      className={`${inputClase} w-28`}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => eliminarCosto(costo.id)}
                    disabled={costos.length <= 1}
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
            <span className="text-slate-600">Total costos</span>
            <span className="font-medium text-slate-800">{formatMonto(totalCostos)}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-200">
            <span className="text-slate-600">Ganancia</span>
            <span className={`font-bold ${ganancia < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatMonto(ganancia)}
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
