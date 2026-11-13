import { aplicarVariables } from '../../lib/documentos';
import type { DatosEmpresa, PlantillaDocumento } from '../../types';

/**
 * Una hoja A4 de un documento de cotización: membrete, cuerpo con las
 * variables ya reemplazadas y, al pie, firma y/o huella.
 */
export function DocumentoHoja({
  plantilla,
  valores,
  empresa,
}: {
  plantilla: PlantillaDocumento;
  valores: Record<string, string>;
  empresa: DatosEmpresa;
}) {
  const conPie = plantilla.firma || plantilla.huella;
  // Con huella, la firma va a un lado y la huella al otro; solo con firma, se ubica según la alineación elegida.
  const justificar = plantilla.huella
    ? plantilla.alineacionFirma === 'derecha'
      ? 'justify-between flex-row-reverse'
      : 'justify-between'
    : { izquierda: 'justify-start', centro: 'justify-center', derecha: 'justify-end' }[plantilla.alineacionFirma];

  return (
    <div className="doc-hoja doc-pagina bg-white shadow-xl print:shadow-none text-[13px] leading-normal text-black">
      {plantilla.membrete && <img src={plantilla.membrete} alt="" className="w-full max-h-36 object-contain mb-6" />}

      <div className="texto-rico" dangerouslySetInnerHTML={{ __html: aplicarVariables(plantilla.cuerpo, valores) }} />

      {conPie && (
        <div className={`mt-8 flex items-end gap-10 break-inside-avoid ${justificar}`}>
          {plantilla.firma && (
            <div className="w-64 text-center">
              {empresa.firma ? (
                <img src={empresa.firma} alt="Firma" className="h-20 mx-auto -mb-2 object-contain" />
              ) : (
                <div className="h-20" />
              )}
              <div
                className="texto-rico border-t border-dotted border-black pt-1"
                dangerouslySetInnerHTML={{ __html: aplicarVariables(plantilla.pieFirma, valores) }}
              />
            </div>
          )}
          {plantilla.huella && (
            <div className="w-40 text-center">
              <div className="mx-auto w-24 h-28 border-[3px] border-black grid place-items-center overflow-hidden bg-white">
                {empresa.huella && <img src={empresa.huella} alt="Huella" className="max-w-full max-h-full object-contain" />}
              </div>
              <div className="mt-2">Huella digital</div>
              <div>(índice derecho)</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
