import { useState } from 'react';
import { DATOS_EMPRESA_VACIOS } from '../../context/FinanceContext';
import type { DatosEmpresa, Proforma } from '../../types';
import { Modal } from '../common/Modal';
import { DatosEmpresaForm } from './DatosEmpresaForm';

/** Lista de las empresas desde las que emites proformas, con alta, edición y baja. */
export function EmpresasModal({
  empresas,
  proformas,
  onAgregar,
  onActualizar,
  onEliminar,
  onClose,
}: {
  empresas: DatosEmpresa[];
  proformas: Proforma[];
  onAgregar: (input: DatosEmpresa) => void;
  onActualizar: (id: string, input: DatosEmpresa) => void;
  onEliminar: (id: string) => void;
  onClose: () => void;
}) {
  const [editando, setEditando] = useState<DatosEmpresa | null>(null);

  function eliminar(e: DatosEmpresa) {
    const usadas = proformas.filter((p) => p.empresaId === e.id).length;
    const aviso = usadas
      ? `\n\nTiene ${usadas} proforma(s): no se borran, pero se mostrarán con otra de tus empresas.`
      : '';
    if (confirm(`¿Eliminar la empresa "${e.nombre}"?${aviso}`)) onEliminar(e.id);
  }

  return (
    <Modal title="Mis empresas" onClose={onClose} maxWidth="max-w-xl">
      <p className="text-xs text-slate-400 mb-3">
        Al crear una proforma eliges desde qué empresa la emites: su nombre, RUC, logo, cuenta bancaria y firma salen en
        el documento.
      </p>

      {empresas.length === 0 ? (
        <p className="text-sm text-slate-500 py-6 text-center">Todavía no registraste ninguna empresa.</p>
      ) : (
        <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
          {empresas.map((e) => {
            const usadas = proformas.filter((p) => p.empresaId === e.id).length;
            return (
              <li key={e.id} className="flex items-center gap-3 px-3 py-2.5">
                <div className="w-12 h-10 shrink-0 rounded bg-slate-50 border border-slate-200 grid place-items-center overflow-hidden">
                  {e.logo ? (
                    <img src={e.logo} alt="" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <span className="text-sm font-semibold text-slate-400">{e.nombre.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-800 truncate">{e.nombre || 'Sin nombre'}</div>
                  <div className="text-xs text-slate-500">
                    {e.ruc ? `RUC ${e.ruc}` : 'Sin RUC'} · {usadas} proforma{usadas === 1 ? '' : 's'}
                  </div>
                </div>
                <button onClick={() => setEditando(e)} className="text-brand-600 hover:underline text-xs font-medium">
                  Editar
                </button>
                <button onClick={() => eliminar(e)} className="text-rose-600 hover:underline text-xs font-medium">
                  Eliminar
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex justify-between gap-2 pt-4">
        <button
          onClick={() => setEditando(DATOS_EMPRESA_VACIOS)}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700"
        >
          + Agregar empresa
        </button>
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100">
          Listo
        </button>
      </div>

      {editando && (
        <DatosEmpresaForm
          initial={editando}
          onSubmit={(input) => (editando.id ? onActualizar(editando.id, input) : onAgregar(input))}
          onClose={() => setEditando(null)}
        />
      )}
    </Modal>
  );
}
