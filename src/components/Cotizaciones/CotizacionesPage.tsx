import { useState } from 'react';
import { DATOS_EMPRESA_VACIOS, useFinance } from '../../context/FinanceContext';
import { formatIsoDate, todayIso } from '../../lib/monthUtils';
import { valoresVariables, variablesFaltantes } from '../../lib/documentos';
import type { PaqueteCotizacion } from '../../types';
import { ProformaDocumento } from '../Proformas/ProformaDocumento';
import { DocumentoHoja } from './DocumentoHoja';
import { DocumentosPreview, type PaginaDocumento } from './DocumentosPreview';
import { PaqueteForm } from './PaqueteForm';
import { PlantillasModal } from './PlantillasModal';

type Formulario = { titulo: string; initial?: Partial<PaqueteCotizacion>; editandoId?: string };

/**
 * Respuestas a solicitudes de cotización: por cada correo que llega se carga
 * entidad, N.° de solicitud y fecha, y se generan de una vez la proforma y
 * todas las declaraciones juradas/cartas con firma y huella, en un solo PDF.
 */
export function CotizacionesPage() {
  const {
    state,
    guardarPlantillaDocumento,
    eliminarPlantillaDocumento,
    agregarPaqueteCotizacion,
    actualizarPaqueteCotizacion,
    eliminarPaqueteCotizacion,
  } = useFinance();
  const { empresas, plantillasDocumento: plantillas, paquetesCotizacion, proformas } = state;
  const [formulario, setFormulario] = useState<Formulario | null>(null);
  const [viendo, setViendo] = useState<PaqueteCotizacion | null>(null);
  const [verPlantillas, setVerPlantillas] = useState(false);

  const paquetes = [...paquetesCotizacion].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const empresaPrincipal = empresas[0] ?? DATOS_EMPRESA_VACIOS;
  const faltaDeclarante = !empresaPrincipal.dni || !empresaPrincipal.firma || !empresaPrincipal.huella;

  function empresaDe(p: PaqueteCotizacion) {
    return empresas.find((e) => e.id === p.empresaId) ?? empresaPrincipal;
  }

  function paginasDe(paquete: PaqueteCotizacion): { paginas: PaginaDocumento[]; avisos: string[] } {
    const empresa = empresaDe(paquete);
    const proforma = proformas.find((p) => p.id === paquete.proformaId) ?? null;
    const valores = valoresVariables(paquete, empresa, proforma);
    const seleccionadas = paquete.plantillaIds
      .map((id) => plantillas.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => !!p);

    const paginas: PaginaDocumento[] = [];
    if (proforma) {
      paginas.push({
        id: `proforma-${proforma.id}`,
        nombre: `Proforma ${proforma.numero}`,
        contenido: (
          <div className="doc-hoja-proforma doc-pagina">
            <ProformaDocumento proforma={proforma} datosEmpresa={empresa} />
          </div>
        ),
      });
    }
    for (const plantilla of seleccionadas) {
      paginas.push({
        id: plantilla.id,
        nombre: plantilla.nombre,
        contenido: <DocumentoHoja plantilla={plantilla} valores={valores} empresa={empresa} />,
      });
    }

    const avisos = variablesFaltantes(seleccionadas, valores).map(
      (v) => `Falta ${v}: sale resaltado en amarillo. ${v === 'N_SOLICITUD' || v === 'OBJETO' || v === 'CIUDAD' ? 'Edita la cotización para completarlo.' : 'Cárgalo en Proformas → "Mis empresas".'}`,
    );
    if (seleccionadas.some((p) => p.firma) && !empresa.firma) avisos.push('Tu empresa no tiene imagen de firma cargada.');
    if (seleccionadas.some((p) => p.huella) && !empresa.huella) avisos.push('Tu empresa no tiene imagen de huella cargada.');
    return { paginas, avisos };
  }

  function titulo(p: PaqueteCotizacion) {
    return `COTIZACION ${p.numeroSolicitud || 'S-N'} - ${p.entidad}`;
  }

  const vista = viendo ? paginasDe(viendo) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Cotizaciones</h2>
          <p className="text-sm text-slate-500 mt-1">
            Responde cada solicitud de cotización con todos sus documentos llenos, firmados y fechados en un clic.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setVerPlantillas(true)}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            Plantillas ({plantillas.length})
          </button>
          <button
            onClick={() => setFormulario({ titulo: 'Nueva cotización' })}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 whitespace-nowrap"
          >
            + Nueva cotización
          </button>
        </div>
      </div>

      {empresas.length === 0 ? (
        <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
          Primero registra tu persona/empresa en Proformas → "Mis empresas" (nombre, DNI, RUC, firma y huella).
        </p>
      ) : (
        faltaDeclarante && (
          <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
            Para que los documentos salgan completos, carga en Proformas → "Mis empresas" →{' '}
            <b>{empresaPrincipal.nombre}</b>: {[!empresaPrincipal.dni && 'DNI', !empresaPrincipal.firma && 'firma', !empresaPrincipal.huella && 'huella digital'].filter(Boolean).join(', ')}.
          </p>
        )
      )}

      {paquetes.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-8 text-center space-y-2">
          <p className="text-sm text-slate-600">Todavía no generaste ninguna cotización.</p>
          <p className="text-xs text-slate-400">
            Cuando te llegue el correo, toca "+ Nueva cotización", escribe el N.° de solicitud y listo: la fecha, tus
            datos, la firma y la huella se completan solos en todos los documentos.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Fecha</th>
                <th className="text-left px-4 py-3 font-medium">N.° solicitud</th>
                <th className="text-left px-4 py-3 font-medium">Entidad</th>
                <th className="text-left px-4 py-3 font-medium">Documentos</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paquetes.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatIsoDate(p.fecha)}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{p.numeroSolicitud || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{p.entidad}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {p.plantillaIds.length + (p.proformaId ? 1 : 0)}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => setViendo(p)} className="text-brand-600 hover:underline text-xs font-medium mr-3">
                      Ver / PDF
                    </button>
                    <button
                      onClick={() => setFormulario({ titulo: `Editar cotización ${p.numeroSolicitud}`, initial: p, editandoId: p.id })}
                      className="text-brand-600 hover:underline text-xs font-medium mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() =>
                        setFormulario({
                          titulo: 'Nueva cotización (copia)',
                          initial: { ...p, id: undefined, numeroSolicitud: '', fecha: todayIso(), proformaId: null },
                        })
                      }
                      title="Mismos datos y documentos, con fecha de hoy"
                      className="text-brand-600 hover:underline text-xs font-medium mr-3"
                    >
                      Duplicar
                    </button>
                    <button
                      onClick={() =>
                        confirm(`¿Eliminar la cotización ${p.numeroSolicitud || ''} de ${p.entidad}?`) &&
                        eliminarPaqueteCotizacion(p.id)
                      }
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

      {formulario && (
        <PaqueteForm
          titulo={formulario.titulo}
          initial={formulario.initial}
          empresas={empresas}
          plantillas={plantillas}
          proformas={proformas}
          anteriores={paquetesCotizacion}
          onSubmit={(input) => {
            if (formulario.editandoId) {
              actualizarPaqueteCotizacion(formulario.editandoId, input);
              setViendo({ ...input, id: formulario.editandoId });
            } else {
              const id = agregarPaqueteCotizacion(input);
              setViendo({ ...input, id });
            }
          }}
          onClose={() => setFormulario(null)}
        />
      )}

      {viendo && vista && (
        <DocumentosPreview
          titulo={titulo(viendo)}
          paginas={vista.paginas}
          avisos={vista.avisos}
          onClose={() => setViendo(null)}
          acciones={
            <button
              onClick={() => {
                setFormulario({ titulo: `Editar cotización ${viendo.numeroSolicitud}`, initial: viendo, editandoId: viendo.id });
                setViendo(null);
              }}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-white text-slate-700 hover:bg-slate-100"
            >
              Editar
            </button>
          }
        />
      )}

      {verPlantillas && (
        <PlantillasModal
          plantillas={plantillas}
          empresa={empresaPrincipal}
          onGuardar={guardarPlantillaDocumento}
          onEliminar={eliminarPlantillaDocumento}
          onClose={() => setVerPlantillas(false)}
        />
      )}
    </div>
  );
}
