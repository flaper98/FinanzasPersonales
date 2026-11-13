import { useState } from 'react';
import type { DatosEmpresa, NewPaqueteCotizacionInput, PaqueteCotizacion, PlantillaDocumento, Proforma } from '../../types';
import { Modal } from '../common/Modal';
import { totalProforma } from '../../lib/calculations';
import { todayIso } from '../../lib/monthUtils';
import { valoresVariables, variablesFaltantes } from '../../lib/documentos';

const inputClase =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

function formatMonto(n: number): string {
  return n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 });
}

export function PaqueteForm({
  initial,
  titulo,
  empresas,
  plantillas,
  proformas,
  anteriores,
  onSubmit,
  onClose,
}: {
  /** Cotización a editar, o datos de partida (ej. al duplicar); sin `id` es una nueva. */
  initial?: Partial<PaqueteCotizacion>;
  titulo: string;
  empresas: DatosEmpresa[];
  plantillas: PlantillaDocumento[];
  proformas: Proforma[];
  /** Cotizaciones anteriores: sugieren entidades y recuerdan la ciudad de cada una. */
  anteriores: PaqueteCotizacion[];
  onSubmit: (input: NewPaqueteCotizacionInput) => void;
  onClose: () => void;
}) {
  const ultima = [...anteriores].sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
  const [empresaId, setEmpresaId] = useState(initial?.empresaId ?? ultima?.empresaId ?? empresas[0]?.id ?? '');
  const [entidad, setEntidad] = useState(initial?.entidad ?? ultima?.entidad ?? '');
  const [ciudad, setCiudad] = useState(initial?.ciudad ?? ultima?.ciudad ?? '');
  const [numeroSolicitud, setNumeroSolicitud] = useState(initial?.numeroSolicitud ?? '');
  const [fecha, setFecha] = useState(initial?.fecha ?? todayIso());
  const [objeto, setObjeto] = useState(initial?.objeto ?? '');
  const [proformaId, setProformaId] = useState<string | null>(initial?.proformaId ?? null);
  const [plantillaIds, setPlantillaIds] = useState<string[]>(
    initial?.plantillaIds ?? plantillas.filter((p) => p.incluirPorDefecto).map((p) => p.id),
  );

  const empresa = empresas.find((e) => e.id === empresaId) ?? empresas[0];
  const proforma = proformas.find((p) => p.id === proformaId) ?? null;
  const proformasOrdenadas = [...proformas].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const entidadesConocidas = [
    ...new Set([...anteriores.map((a) => a.entidad), ...proformas.map((p) => p.clienteNombre)].filter(Boolean)),
  ];
  const seleccionadas = plantillas.filter((p) => plantillaIds.includes(p.id));
  const faltantes = empresa
    ? variablesFaltantes(seleccionadas, valoresVariables({ entidad, ciudad, numeroSolicitud, fecha, objeto }, empresa, proforma))
    : [];

  /** Al elegir una entidad ya usada, recupera la ciudad que usaste con ella. */
  function cambiarEntidad(valor: string) {
    setEntidad(valor);
    const previa = anteriores.find((a) => a.entidad.toLowerCase() === valor.trim().toLowerCase() && a.ciudad);
    if (previa) setCiudad(previa.ciudad);
  }

  function cambiarProforma(id: string) {
    const p = proformas.find((x) => x.id === id) ?? null;
    setProformaId(p?.id ?? null);
    if (p && !entidad) cambiarEntidad(p.clienteNombre);
    if (p && !objeto) setObjeto(p.items[0]?.descripcion.split('\n')[0] ?? '');
  }

  function alternarPlantilla(id: string, incluir: boolean) {
    // Se mantiene el orden de la lista de plantillas, no el orden en que se marcaron.
    setPlantillaIds((prev) => plantillas.map((p) => p.id).filter((pid) => (pid === id ? incluir : prev.includes(pid))));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      empresaId,
      entidad: entidad.trim(),
      ciudad: ciudad.trim(),
      numeroSolicitud: numeroSolicitud.trim(),
      fecha,
      objeto: objeto.trim(),
      proformaId,
      plantillaIds,
    });
    onClose();
  }

  return (
    <Modal title={titulo} onClose={onClose} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {empresas.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Empresa / persona que cotiza</label>
            <select value={empresaId} onChange={(e) => setEmpresaId(e.target.value)} className={inputClase}>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                  {e.ruc ? ` — RUC ${e.ruc}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">N.° de solicitud</label>
            <input
              value={numeroSolicitud}
              onChange={(e) => setNumeroSolicitud(e.target.value)}
              placeholder="3264"
              autoFocus
              className={inputClase}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de los documentos</label>
            <input required type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputClase} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ciudad</label>
            <input
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              placeholder="TAHUANIA-BOLOGNESI"
              className={inputClase}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Entidad que pide la cotización</label>
          <input
            required
            list="entidades-conocidas"
            value={entidad}
            onChange={(e) => cambiarEntidad(e.target.value)}
            placeholder="Municipalidad Distrital de Tahuania"
            className={inputClase}
          />
          <datalist id="entidades-conocidas">
            {entidadesConocidas.map((e) => (
              <option key={e} value={e} />
            ))}
          </datalist>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Proforma (opcional)</label>
            <select value={proformaId ?? ''} onChange={(e) => cambiarProforma(e.target.value)} className={inputClase}>
              <option value="">Sin proforma</option>
              {proformasOrdenadas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.numero} · {p.clienteNombre || 'sin cliente'} · {formatMonto(totalProforma(p.items))}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">Sale como primera hoja y aporta el monto.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Servicio / bien (opcional)</label>
            <input
              value={objeto}
              onChange={(e) => setObjeto(e.target.value)}
              placeholder="Mantenimiento del servidor web"
              className={inputClase}
            />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Documentos a generar</p>
          {plantillas.length === 0 ? (
            <p className="text-xs text-slate-400">No tienes plantillas: créalas en "Plantillas".</p>
          ) : (
            <div className="space-y-1.5">
              {plantillas.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={plantillaIds.includes(p.id)}
                    onChange={(e) => alternarPlantilla(p.id, e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  {p.nombre}
                </label>
              ))}
            </div>
          )}
        </div>

        {faltantes.length > 0 && (
          <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
            Faltan datos que usan estos documentos: <b>{faltantes.join(', ')}</b>. Los de tu persona/empresa se cargan en
            Proformas → "Mis empresas"; saldrán resaltados en amarillo hasta que los completes.
          </p>
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
            Guardar y ver documentos
          </button>
        </div>
      </form>
    </Modal>
  );
}
