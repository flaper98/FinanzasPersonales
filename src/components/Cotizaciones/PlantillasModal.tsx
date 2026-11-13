import { useState } from 'react';
import type { DatosEmpresa, PlantillaDocumento } from '../../types';
import { Modal } from '../common/Modal';
import { newId } from '../../lib/id';
import { plantillasIniciales } from '../../lib/documentos';
import { PlantillaForm } from './PlantillaForm';

function plantillaVacia(): PlantillaDocumento {
  return {
    id: newId(),
    nombre: '',
    membrete: '',
    cuerpo: '',
    firma: true,
    huella: false,
    alineacionFirma: 'centro',
    pieFirma: '{{NOMBRE}}<br>DNI: {{DNI}}',
    incluirPorDefecto: true,
  };
}

/** Lista de formatos de documentos (declaraciones juradas, cartas, anexos) con alta, edición, copia y baja. */
export function PlantillasModal({
  plantillas,
  empresa,
  onGuardar,
  onEliminar,
  onClose,
}: {
  plantillas: PlantillaDocumento[];
  empresa: DatosEmpresa;
  onGuardar: (plantilla: PlantillaDocumento) => void;
  onEliminar: (id: string) => void;
  onClose: () => void;
}) {
  const [editando, setEditando] = useState<PlantillaDocumento | null>(null);

  function restaurarOriginales() {
    const existentes = new Set(plantillas.map((p) => p.nombre));
    const faltantes = plantillasIniciales(newId).filter((p) => !existentes.has(p.nombre));
    if (faltantes.length === 0) {
      alert('Ya tienes todos los formatos de ejemplo.');
      return;
    }
    faltantes.forEach(onGuardar);
  }

  return (
    <Modal title="Plantillas de documentos" onClose={onClose} maxWidth="max-w-2xl">
      <p className="text-xs text-slate-400 mb-3">
        Los formatos que acompañan cada cotización. Los escribes una sola vez; la fecha, la entidad, tus datos, la firma y
        la huella se completan solos al generar cada cotización.
      </p>

      {plantillas.length === 0 ? (
        <p className="text-sm text-slate-500 py-6 text-center">No tienes plantillas.</p>
      ) : (
        <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
          {plantillas.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-800 truncate">{p.nombre}</div>
                <div className="text-xs text-slate-500">
                  {[p.firma && 'firma', p.huella && 'huella', p.membrete && 'membrete'].filter(Boolean).join(' · ') ||
                    'sin firma'}
                  {p.incluirPorDefecto ? ' · se incluye siempre' : ''}
                </div>
              </div>
              <button onClick={() => setEditando(p)} className="text-brand-600 hover:underline text-xs font-medium">
                Editar
              </button>
              <button
                onClick={() => onGuardar({ ...p, id: newId(), nombre: `${p.nombre} (copia)` })}
                className="text-brand-600 hover:underline text-xs font-medium"
              >
                Duplicar
              </button>
              <button
                onClick={() => confirm(`¿Eliminar la plantilla "${p.nombre}"?`) && onEliminar(p.id)}
                className="text-rose-600 hover:underline text-xs font-medium"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-between gap-2 pt-4 flex-wrap">
        <div className="flex gap-2">
          <button
            onClick={() => setEditando(plantillaVacia())}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700"
          >
            + Nueva plantilla
          </button>
          <button
            onClick={restaurarOriginales}
            title="Vuelve a agregar los formatos de Tahuania que borraste"
            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Formatos de ejemplo
          </button>
        </div>
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100">
          Listo
        </button>
      </div>

      {editando && (
        <PlantillaForm initial={editando} empresa={empresa} onSubmit={onGuardar} onClose={() => setEditando(null)} />
      )}
    </Modal>
  );
}
