import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { siguienteNumeroProforma, totalProforma } from '../../lib/calculations';
import { formatIsoDate, monthKeyOfIso, monthLabel } from '../../lib/monthUtils';
import type { Proforma } from '../../types';
import { DatosEmpresaForm } from './DatosEmpresaForm';
import { ProformaForm } from './ProformaForm';
import { ProformaPreview } from './ProformaPreview';

function formatMonto(n: number): string {
  return n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 });
}

export function ProformasPage() {
  const {
    state,
    agregarProforma,
    actualizarProforma,
    eliminarProforma,
    actualizarDatosEmpresa,
    agregarIngresoDesdeProforma,
  } = useFinance();
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<Proforma | null>(null);
  const [viendo, setViendo] = useState<Proforma | null>(null);
  const [editandoEmpresa, setEditandoEmpresa] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const proformas = [...state.proformas].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const empresaIncompleta = !state.datosEmpresa.nombre;

  function handleAgregarAIngresos(p: Proforma) {
    agregarIngresoDesdeProforma(p);
    setMensaje(`Se agregó la proforma ${p.numero} a Ingresos de ${monthLabel(monthKeyOfIso(p.fecha))}, como NO COBRADO.`);
    setViendo(null);
  }

  function handleEliminar(p: Proforma) {
    eliminarProforma(p.id);
    setViendo(null);
    setMensaje(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Proformas</h2>
          <p className="text-sm text-slate-500 mt-1">Generá cotizaciones para tus clientes y descargalas en PDF.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditandoEmpresa(true)}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            Datos de mi empresa
          </button>
          <button
            onClick={() => setCreando(true)}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 whitespace-nowrap"
          >
            + Nueva proforma
          </button>
        </div>
      </div>

      {mensaje && (
        <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">{mensaje}</p>
      )}

      {empresaIncompleta && (
        <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
          Todavía no completaste "Datos de mi empresa" — aparecen como remitente en cada proforma.
        </p>
      )}

      {proformas.length === 0 ? (
        <p className="text-sm text-slate-500 py-8 text-center">
          No tienes proformas todavía. Creá una con "+ Nueva proforma".
        </p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 font-medium">N.º</th>
                <th className="text-left px-4 py-3 font-medium">Cliente</th>
                <th className="text-left px-4 py-3 font-medium">Fecha</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {proformas.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.numero}</td>
                  <td className="px-4 py-3 text-slate-600">{p.clienteNombre || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatIsoDate(p.fecha)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-700 whitespace-nowrap">
                    {formatMonto(totalProforma(p.items))}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => setViendo(p)}
                      className="text-brand-600 hover:underline text-xs font-medium mr-3"
                    >
                      Ver / PDF
                    </button>
                    <button
                      onClick={() => setEditando(p)}
                      className="text-brand-600 hover:underline text-xs font-medium mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleAgregarAIngresos(p)}
                      className="text-emerald-600 hover:underline text-xs font-medium mr-3"
                    >
                      → Ingresos
                    </button>
                    <button
                      onClick={() => confirm(`¿Eliminar la proforma ${p.numero}?`) && handleEliminar(p)}
                      className="text-rose-600 hover:underline text-xs font-medium"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creando && (
        <ProformaForm
          numeroSugerido={siguienteNumeroProforma(state.proformas)}
          onSubmit={(input) => agregarProforma(input)}
          onClose={() => setCreando(false)}
        />
      )}
      {editando && (
        <ProformaForm
          initial={editando}
          numeroSugerido={editando.numero}
          onSubmit={(input) => actualizarProforma(editando.id, input)}
          onClose={() => setEditando(null)}
        />
      )}
      {viendo && (
        <ProformaPreview
          proforma={viendo}
          datosEmpresa={state.datosEmpresa}
          onClose={() => setViendo(null)}
          onEditar={() => {
            setEditando(viendo);
            setViendo(null);
          }}
          onEliminar={() => handleEliminar(viendo)}
          onAgregarAIngresos={() => handleAgregarAIngresos(viendo)}
        />
      )}
      {editandoEmpresa && (
        <DatosEmpresaForm
          initial={state.datosEmpresa}
          onSubmit={(input) => actualizarDatosEmpresa(input)}
          onClose={() => setEditandoEmpresa(false)}
        />
      )}
    </div>
  );
}
