import { useState } from 'react';
import type { AlineacionFirma, DatosEmpresa, PlantillaDocumento } from '../../types';
import { Modal } from '../common/Modal';
import { EditorTexto } from '../common/EditorTexto';
import { CampoImagen } from '../Proformas/DatosEmpresaForm';
import { VARIABLES_DOCUMENTO, valoresVariables, variablesFaltantes } from '../../lib/documentos';
import { sanitizarHtml } from '../../lib/html';
import { todayIso } from '../../lib/monthUtils';
import { DocumentoHoja } from './DocumentoHoja';
import { DocumentosPreview } from './DocumentosPreview';

const inputClase =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

const VARIABLES_EDITOR = VARIABLES_DOCUMENTO.map((v) => ({
  clave: v.clave,
  descripcion: `${v.grupo}: ${v.descripcion}`,
}));

export function PlantillaForm({
  initial,
  empresa,
  onSubmit,
  onClose,
}: {
  initial: PlantillaDocumento;
  /** Para la vista previa (firma, huella y datos reales). */
  empresa: DatosEmpresa;
  onSubmit: (plantilla: PlantillaDocumento) => void;
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState(initial.nombre);
  const [membrete, setMembrete] = useState(initial.membrete);
  const [cuerpo, setCuerpo] = useState(initial.cuerpo);
  const [firma, setFirma] = useState(initial.firma);
  const [huella, setHuella] = useState(initial.huella);
  const [alineacionFirma, setAlineacionFirma] = useState<AlineacionFirma>(initial.alineacionFirma);
  const [pieFirma, setPieFirma] = useState(initial.pieFirma);
  const [incluirPorDefecto, setIncluirPorDefecto] = useState(initial.incluirPorDefecto);
  const [previsualizando, setPrevisualizando] = useState(false);

  function armar(): PlantillaDocumento {
    return {
      id: initial.id,
      nombre: nombre.trim() || 'Documento sin nombre',
      membrete,
      cuerpo: sanitizarHtml(cuerpo),
      firma,
      huella,
      alineacionFirma,
      pieFirma: sanitizarHtml(pieFirma),
      incluirPorDefecto,
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(armar());
    onClose();
  }

  // Vista previa con tus datos reales, la fecha de hoy y una entidad de ejemplo.
  const valoresEjemplo = valoresVariables(
    {
      entidad: 'Municipalidad Distrital de Tahuania',
      ciudad: 'TAHUANIA-BOLOGNESI',
      numeroSolicitud: '0000',
      fecha: todayIso(),
      objeto: 'Servicio de ejemplo',
    },
    empresa,
    null,
  );

  return (
    <Modal title={initial.nombre ? `Editar: ${initial.nombre}` : 'Nueva plantilla'} onClose={onClose} maxWidth="max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del documento</label>
          <input
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Declaración jurada de ..."
            className={inputClase}
          />
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700 mb-1">Contenido</p>
          <p className="text-xs text-slate-400 mb-2">
            Copia y pega el texto del formato (desde Word también funciona). Donde va algo que cambia en cada cotización,
            usa <b>+ Dato</b> en la barra: por ejemplo <code className="bg-slate-100 px-1 rounded">{'{{FECHA_LARGA}}'}</code>{' '}
            se completa solo con la fecha de la cotización.
          </p>
          <EditorTexto
            valor={cuerpo}
            onChange={setCuerpo}
            variables={VARIABLES_EDITOR}
            minAlto="22rem"
            fuente="Arial, Helvetica, sans-serif"
            placeholder="Yo, {{NOMBRE}} con D.N.I. Nº {{DNI}} ..."
          />
        </div>

        <div className="border-t border-slate-100 pt-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Firma y huella al pie</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={firma}
                onChange={(e) => setFirma(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Firma
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={huella}
                onChange={(e) => setHuella(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Huella digital
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              Firma a la
              <select
                value={alineacionFirma}
                onChange={(e) => setAlineacionFirma(e.target.value as AlineacionFirma)}
                className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
              >
                <option value="izquierda">izquierda</option>
                <option value="centro">centro</option>
                <option value="derecha">derecha</option>
              </select>
            </label>
          </div>
          {firma && (
            <div className="mt-3">
              <p className="text-xs font-medium text-slate-500 mb-1">Texto bajo la línea de firma</p>
              <EditorTexto
                valor={pieFirma}
                onChange={setPieFirma}
                variables={VARIABLES_EDITOR}
                minAlto="3.5rem"
                fuente="Arial, Helvetica, sans-serif"
                placeholder="DNI N.º {{DNI}}"
              />
            </div>
          )}
        </div>

        <CampoImagen
          titulo="Membrete (opcional)"
          ayuda="Imagen del encabezado de la entidad (escudo, logo y nombre), si el formato lo lleva. Puedes recortarla de una captura del documento original."
          nombre="membrete"
          valor={membrete}
          onChange={setMembrete}
          maxAncho={1400}
          maxAlto={400}
        />

        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer border-t border-slate-100 pt-4">
          <input
            type="checkbox"
            checked={incluirPorDefecto}
            onChange={(e) => setIncluirPorDefecto(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Incluir siempre en las cotizaciones nuevas
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => setPrevisualizando(true)}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Vista previa
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700"
          >
            Guardar
          </button>
        </div>
      </form>

      {previsualizando && (
        <DocumentosPreview
          titulo={`Vista previa - ${nombre || 'plantilla'}`}
          avisos={variablesFaltantes([armar()], valoresEjemplo).map(
            (v) => `Falta cargar ${v} en tu empresa (sale resaltado en amarillo).`,
          )}
          paginas={[
            {
              id: initial.id,
              nombre: nombre || 'Documento',
              contenido: <DocumentoHoja plantilla={armar()} valores={valoresEjemplo} empresa={empresa} />,
            },
          ]}
          onClose={() => setPrevisualizando(false)}
        />
      )}
    </Modal>
  );
}
