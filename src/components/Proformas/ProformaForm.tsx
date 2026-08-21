import { useState } from 'react';
import type { ItemProforma, NewProformaInput, Proforma, TipoProforma } from '../../types';
import { Modal } from '../common/Modal';
import { totalItemProforma, totalProforma } from '../../lib/calculations';
import { newId } from '../../lib/id';
import { todayIso } from '../../lib/monthUtils';

const inputClase =
  'w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

function formatMonto(n: number): string {
  return n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 });
}

function itemVacio(): ItemProforma {
  return { id: newId(), descripcion: '', cantidad: 1, precioUnitario: 0 };
}

export function ProformaForm({
  initial,
  numeroSugerido,
  onSubmit,
  onClose,
}: {
  initial?: Proforma;
  numeroSugerido: string;
  onSubmit: (input: NewProformaInput) => void;
  onClose: () => void;
}) {
  const [numero, setNumero] = useState(initial?.numero ?? numeroSugerido);
  const [fecha, setFecha] = useState(initial?.fecha ?? todayIso());
  const [validezDias, setValidezDias] = useState(initial?.validezDias?.toString() ?? '15');
  const [tipo, setTipo] = useState<TipoProforma>(initial?.tipo ?? 'productos');
  const esServicio = tipo === 'servicio';
  const [clienteNombre, setClienteNombre] = useState(initial?.clienteNombre ?? '');
  const [clienteRuc, setClienteRuc] = useState(initial?.clienteRuc ?? '');
  const [clienteContacto, setClienteContacto] = useState(initial?.clienteContacto ?? '');
  const [clienteCargo, setClienteCargo] = useState(initial?.clienteCargo ?? '');
  const [items, setItems] = useState<ItemProforma[]>(initial?.items?.length ? initial.items : [itemVacio()]);
  const [nota, setNota] = useState(initial?.nota ?? '');

  function actualizarItem(id: string, cambios: Partial<ItemProforma>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...cambios } : it)));
  }

  function eliminarItem(id: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      numero: numero.trim(),
      fecha,
      validezDias: parseInt(validezDias, 10) || 0,
      tipo,
      clienteNombre: clienteNombre.trim(),
      clienteRuc: clienteRuc.trim(),
      clienteContacto: clienteContacto.trim(),
      clienteCargo: clienteCargo.trim(),
      items: items
        .filter((it) => it.descripcion.trim() !== '')
        .map((it) => ({ ...it, descripcion: it.descripcion.trim() })),
      nota: nota.trim(),
    });
    onClose();
  }

  return (
    <Modal title={initial ? 'Editar proforma' : 'Nueva proforma'} onClose={onClose} maxWidth="max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Número</label>
            <input
              required
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="041-2026"
              className={inputClase}
            />
            <p className="text-xs text-slate-400 mt-1">Correlativo-año. Se sugiere solo el siguiente disponible.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
            <input required type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputClase} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Válida por (días hábiles)</label>
            <input
              type="number"
              min="1"
              value={validezDias}
              onChange={(e) => setValidezDias(e.target.value)}
              className={inputClase}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de proforma</label>
          <div className="flex gap-2">
            {(
              [
                ['productos', '📦 Productos / bienes'],
                ['servicio', '⏱️ Servicio por horas'],
              ] as const
            ).map(([valor, etiqueta]) => (
              <button
                type="button"
                key={valor}
                onClick={() => setTipo(valor)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition ${
                  tipo === valor
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {etiqueta}
              </button>
            ))}
          </div>
          {esServicio && (
            <p className="text-xs text-slate-400 mt-1">
              Cada ítem se cobra por horas trabajadas × tarifa por hora, en vez de cantidad × precio unitario.
            </p>
          )}
        </div>

        <div className="border-t border-slate-100 pt-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Cliente (destinatario)</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Nombre / Razón social</label>
              <input
                required
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                className={inputClase}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">RUC</label>
              <input value={clienteRuc} onChange={(e) => setClienteRuc(e.target.value)} className={inputClase} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Dirigido a</label>
              <input
                value={clienteContacto}
                onChange={(e) => setClienteContacto(e.target.value)}
                placeholder="Nombre de la persona de contacto"
                className={inputClase}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Cargo</label>
              <input
                value={clienteCargo}
                onChange={(e) => setClienteCargo(e.target.value)}
                placeholder="Gerente General"
                className={inputClase}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-700">Ítems</p>
            <button
              type="button"
              onClick={() => setItems((prev) => [...prev, itemVacio()])}
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              + Agregar ítem
            </button>
          </div>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="border border-slate-200 rounded-lg p-2 space-y-2">
                <textarea
                  value={item.descripcion}
                  onChange={(e) => actualizarItem(item.id, { descripcion: e.target.value })}
                  placeholder={
                    esServicio
                      ? 'Qué se va a hacer (podés usar varias líneas)'
                      : 'Descripción (podés usar varias líneas)'
                  }
                  rows={2}
                  className={`${inputClase} w-full resize-y`}
                />
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <label className="flex items-center gap-1.5 text-xs text-slate-500">
                    {esServicio ? 'Horas' : 'Cant.'}
                    <input
                      type="number"
                      min="0"
                      step={esServicio ? '0.5' : '1'}
                      value={item.cantidad}
                      onChange={(e) => actualizarItem(item.id, { cantidad: parseFloat(e.target.value) || 0 })}
                      className={`${inputClase} w-16`}
                    />
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-500">
                    {esServicio ? 'Tarifa/hora' : 'P. unitario'}
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.precioUnitario}
                      onChange={(e) => actualizarItem(item.id, { precioUnitario: parseFloat(e.target.value) || 0 })}
                      className={`${inputClase} w-24`}
                    />
                  </label>
                  <div className="ml-auto text-sm font-medium text-slate-700 whitespace-nowrap">
                    Total: {formatMonto(totalItemProforma(item))}
                  </div>
                  <button
                    type="button"
                    onClick={() => eliminarItem(item.id)}
                    disabled={items.length <= 1}
                    className="text-rose-600 hover:underline text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end items-center gap-3 mt-2 text-sm">
            {esServicio && (
              <span className="text-slate-500">
                Total horas: {items.reduce((sum, it) => sum + it.cantidad, 0)}
              </span>
            )}
            <span className="font-semibold text-slate-800">Total: {formatMonto(totalProforma(items))}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notas adicionales (opcional)</label>
          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            rows={2}
            placeholder="Condiciones especiales, tiempo de entrega, etc."
            className={`${inputClase} resize-y`}
          />
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
