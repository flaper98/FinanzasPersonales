import type { CSSProperties, ReactNode } from 'react';
import { formatIsoDate } from '../../lib/monthUtils';
import { totalItemProforma, totalProforma } from '../../lib/calculations';
import { montoEnLetrasSoles } from '../../lib/text';
import { htmlVacio, sanitizarHtml } from '../../lib/html';
import { fuenteCss, partesDescripcion, sumarDiasHabiles, tinte } from '../../lib/proformaDiseno';
import type { DatosEmpresa, ItemProforma, Proforma } from '../../types';

/**
 * La hoja de la proforma tal como se imprime, en sus tres diseños. Solo
 * dibuja: los botones (Descargar PDF, Editar, …) están en ProformaPreview.
 *
 * El color de acento llega como variables CSS (--ac, --ac-suave, --ac-medio)
 * para usarlo desde Tailwind con `bg-[var(--ac)]`, etc.
 */

function formatMonto(n: number): string {
  return n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 });
}

/** Número con 2 decimales y sin símbolo, para las celdas de la tabla ("1,250.00"). */
function formatNumero(n: number): string {
  return n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Todo lo que los tres diseños necesitan, ya calculado y filtrado según los checks de la proforma. */
function datosDocumento(proforma: Proforma, empresa: DatosEmpresa) {
  const op = proforma.opciones;
  const total = totalProforma(proforma.items);
  const esServicio = proforma.tipo === 'servicio';
  const telefonos = [empresa.telefono && `Tel. ${empresa.telefono}`, empresa.celular && `Cel. ${empresa.celular}`]
    .filter(Boolean)
    .join('  ·  ');
  const introduccion = op.introduccion && !htmlVacio(proforma.introduccion) ? sanitizarHtml(proforma.introduccion) : '';
  const notas = op.notas && !htmlVacio(proforma.nota) ? sanitizarHtml(proforma.nota) : '';
  const hayBanco = op.datosBancarios && !!(empresa.banco || empresa.numeroCuenta || empresa.numeroCci);
  return {
    op,
    total,
    esServicio,
    totalHoras: proforma.items.reduce((sum, it) => sum + it.cantidad, 0),
    logo: op.logo ? empresa.logo : '',
    contacto: op.contactoEmisor ? [empresa.direccion, telefonos, empresa.email].filter(Boolean) : [],
    atencion: op.atencionCliente ? proforma.clienteContacto : '',
    cargo: op.atencionCliente ? proforma.clienteCargo : '',
    fechaEmision: formatIsoDate(proforma.fecha),
    validez: op.validez && proforma.validezDias > 0 ? `${proforma.validezDias} días hábiles` : '',
    validaHasta:
      op.validez && proforma.validezDias > 0
        ? formatIsoDate(sumarDiasHabiles(proforma.fecha, proforma.validezDias))
        : '',
    letras: op.montoEnLetras ? montoEnLetrasSoles(total) : '',
    introduccion,
    notas,
    hayBanco,
    hayPie: !!notas || hayBanco || op.firma,
    colCantidad: esServicio ? 'Horas' : 'Cant.',
    colPrecio: esServicio ? 'Tarifa/Hora' : 'P. Unit.',
  };
}
type Datos = ReturnType<typeof datosDocumento>;

function TextoRico({ html, className = '' }: { html: string; className?: string }) {
  return <div className={`texto-rico ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Primera línea del ítem como título, el resto como detalle en gris. */
function Descripcion({ item }: { item: ItemProforma }) {
  const { titulo, detalle } = partesDescripcion(item.descripcion);
  return (
    <>
      <div className="font-semibold text-slate-900 leading-snug">{titulo}</div>
      {detalle && <div className="mt-1 whitespace-pre-line text-slate-500 leading-relaxed">{detalle}</div>}
    </>
  );
}

/** Lista de pares etiqueta/valor; omite los que no tienen valor. */
function Campos({ filas, claseEtiqueta }: { filas: [string, string | undefined][]; claseEtiqueta: string }) {
  return (
    <dl className="grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-1 content-start">
      {filas
        .filter(([, valor]) => valor)
        .map(([etiqueta, valor]) => (
          <div key={etiqueta} className="contents">
            <dt className={claseEtiqueta}>{etiqueta}</dt>
            <dd className="text-slate-700">{valor}</dd>
          </div>
        ))}
    </dl>
  );
}

function Logo({ src }: { src: string }) {
  return src ? <img src={src} alt="Logo" className="max-h-16 max-w-[9rem] object-contain shrink-0" /> : null;
}

function BloqueFirma({ empresa, claseLinea }: { empresa: DatosEmpresa; claseLinea: string }) {
  return (
    <div className="flex flex-col justify-end text-center">
      {empresa.firma ? (
        <img src={empresa.firma} alt="Firma" className="h-16 mx-auto mb-1 object-contain" />
      ) : (
        <div className="h-16" />
      )}
      <div className={`border-t pt-1.5 ${claseLinea}`}>
        <div className="font-semibold text-slate-900">{empresa.nombre}</div>
        {empresa.ruc && <div className="text-slate-500">RUC {empresa.ruc}</div>}
      </div>
    </div>
  );
}

/** Términos, forma de pago y firma, al pie de la hoja. */
function Pie({
  d,
  empresa,
  claseEtiqueta,
  claseBanco,
  claseLineaFirma,
}: {
  d: Datos;
  empresa: DatosEmpresa;
  claseEtiqueta: string;
  claseBanco: string;
  claseLineaFirma: string;
}) {
  if (!d.hayPie) return null;
  return (
    <div className="grid grid-cols-[1fr_14rem] gap-x-10 break-inside-avoid">
      <div className="space-y-4 min-w-0">
        {d.notas && (
          <div>
            <div className={`${claseEtiqueta} mb-1.5`}>Términos y condiciones</div>
            <TextoRico html={d.notas} className="text-slate-600" />
          </div>
        )}
        {d.hayBanco && (
          <div className={claseBanco}>
            <div className={`${claseEtiqueta} mb-1.5`}>Forma de pago</div>
            <Campos
              claseEtiqueta="font-medium text-slate-500"
              filas={[
                ['Banco', empresa.banco],
                ['Titular', empresa.nombre],
                ['N.° de cuenta', empresa.numeroCuenta],
                ['CCI', empresa.numeroCci],
              ]}
            />
          </div>
        )}
      </div>
      {d.op.firma ? <BloqueFirma empresa={empresa} claseLinea={claseLineaFirma} /> : <div />}
    </div>
  );
}

/* ───────────────────────────── Clásico ───────────────────────────── */

const COL_NUM = '2.75rem';
const COL_CANT = '4.5rem';
const COL_PRECIO = '6.5rem';
const COL_TOTAL = '6.75rem';

/** Líneas verticales entre columnas que recorren toda la altura del recuadro aunque haya pocos ítems. */
const lineasColumnas: CSSProperties = {
  backgroundImage: Array(4).fill('linear-gradient(#000, #000)').join(', '),
  backgroundRepeat: 'no-repeat',
  backgroundSize: '1px 100%',
  backgroundPosition: [
    `${COL_NUM} 0`,
    `calc(100% - ${COL_TOTAL} - ${COL_PRECIO} - ${COL_CANT}) 0`,
    `calc(100% - ${COL_TOTAL} - ${COL_PRECIO}) 0`,
    `calc(100% - ${COL_TOTAL}) 0`,
  ].join(', '),
};

function Clasico({ proforma, empresa, d }: { proforma: Proforma; empresa: DatosEmpresa; d: Datos }) {
  const etiqueta = 'font-bold uppercase text-black';
  return (
    <>
      <header className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-4 min-w-0">
          <Logo src={d.logo} />
          <div className="min-w-0">
            <div className="text-[20px] font-bold text-black leading-tight">{empresa.nombre || 'Tu empresa'}</div>
            <div className="mt-1.5 space-y-0.5 text-slate-600 leading-snug">
              {d.contacto.map((linea) => (
                <div key={linea}>{linea}</div>
              ))}
            </div>
          </div>
        </div>
        <div className="w-60 shrink-0 border-2 border-black text-center text-black">
          {empresa.ruc && <div className="py-2 text-[14px] tracking-wide">R.U.C. {empresa.ruc}</div>}
          <div className="bg-neutral-200 py-2.5 text-[17px] font-bold tracking-[0.2em]">PROFORMA</div>
          <div className="py-2 text-[14px] tracking-wide">N.° {proforma.numero}</div>
        </div>
      </header>

      <section className="mt-5 border border-black px-3 py-2.5 grid grid-cols-[1fr_auto] gap-x-10">
        <Campos
          claseEtiqueta={etiqueta}
          filas={[
            ['Señor(es)', proforma.clienteNombre || '—'],
            ['RUC', proforma.clienteRuc],
            ['Atención', d.atencion],
            ['Cargo', d.cargo],
          ]}
        />
        <Campos
          claseEtiqueta={etiqueta}
          filas={[
            ['Fecha emisión', d.fechaEmision],
            ['Validez', d.validez],
            ['Moneda', 'SOLES'],
          ]}
        />
      </section>

      {d.introduccion && <TextoRico html={d.introduccion} className="mt-4 text-slate-700" />}

      {/* El recuadro de ítems crece para ocupar la hoja y deja los totales al pie. */}
      <section className="proforma-items mt-4 grow flex flex-col border border-black">
        <div className="grow" style={lineasColumnas}>
          <table className="w-full table-fixed border-collapse">
            <colgroup>
              <col style={{ width: COL_NUM }} />
              <col />
              <col style={{ width: COL_CANT }} />
              <col style={{ width: COL_PRECIO }} />
              <col style={{ width: COL_TOTAL }} />
            </colgroup>
            <thead>
              <tr className="bg-black text-white text-[10px] uppercase tracking-wider">
                <th className="px-2 py-2 text-center font-bold">N.°</th>
                <th className="px-3 py-2 text-left font-bold">Descripción</th>
                <th className="px-2 py-2 text-center font-bold">{d.colCantidad}</th>
                <th className="px-3 py-2 text-right font-bold">{d.colPrecio}</th>
                <th className="px-3 py-2 text-right font-bold">Importe</th>
              </tr>
            </thead>
            <tbody>
              {proforma.items.map((item, idx) => (
                <tr key={item.id} className="align-top break-inside-avoid">
                  <td className="px-2 py-2.5 text-center text-slate-600">{String(idx + 1).padStart(2, '0')}</td>
                  <td className="px-3 py-2.5 break-words">
                    <Descripcion item={item} />
                  </td>
                  <td className="px-2 py-2.5 text-center tabular-nums">{item.cantidad}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatNumero(item.precioUnitario)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-black">
                    {formatNumero(totalItemProforma(item))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex border-t border-black break-inside-avoid">
          <div className="flex-1 px-3 py-2.5 flex items-center tracking-wide text-black">{d.letras}</div>
          <div className="border-l border-black px-3 py-2 space-y-1" style={{ width: `calc(${COL_PRECIO} + ${COL_TOTAL})` }}>
            {d.esServicio && (
              <div className="flex justify-between text-slate-600">
                <span className="font-bold uppercase">Total horas</span>
                <span className="tabular-nums">{d.totalHoras}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline text-black">
              <span className="font-bold uppercase">Total</span>
              <span className="text-[15px] font-bold tabular-nums">{formatMonto(d.total)}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6">
        <Pie
          d={d}
          empresa={empresa}
          claseEtiqueta={etiqueta}
          claseBanco="border border-black px-3 py-2.5"
          claseLineaFirma="border-black"
        />
      </div>
    </>
  );
}

/* ───────────────────────────── Moderno ───────────────────────────── */

function Moderno({ proforma, empresa, d }: { proforma: Proforma; empresa: DatosEmpresa; d: Datos }) {
  const etiqueta = 'text-[9.5px] font-bold uppercase tracking-[0.16em] text-[var(--ac)]';
  return (
    <>
      <div className="h-1.5 rounded-full bg-[var(--ac)]" />

      <header className="mt-7 flex items-start justify-between gap-8">
        <div className="flex items-center gap-4 min-w-0">
          <Logo src={d.logo} />
          <div className="min-w-0">
            <div className="text-[21px] font-bold text-slate-900 leading-tight tracking-tight">
              {empresa.nombre || 'Tu empresa'}
            </div>
            {d.contacto.length > 0 && (
              <div className="mt-1.5 space-y-0.5 text-slate-500 leading-snug">
                {d.contacto.map((linea) => (
                  <div key={linea}>{linea}</div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[30px] font-extrabold tracking-tight leading-none text-[var(--ac)]">PROFORMA</div>
          <div className="mt-2 text-[14px] font-semibold text-slate-700 tabular-nums">N.° {proforma.numero}</div>
          {empresa.ruc && (
            <div className="mt-2 inline-block rounded-full bg-[var(--ac-suave)] px-3 py-1 text-[10.5px] font-semibold text-[var(--ac)] tabular-nums">
              RUC {empresa.ruc}
            </div>
          )}
        </div>
      </header>

      <section className="mt-7 grid grid-cols-[1.5fr_1fr] gap-4">
        <div className="rounded-xl bg-[var(--ac-suave)] px-4 py-3.5">
          <div className={etiqueta}>Cliente</div>
          <div className="mt-1 text-[14px] font-semibold text-slate-900 leading-snug">{proforma.clienteNombre || '—'}</div>
          <div className="mt-1 space-y-0.5 text-slate-600">
            {proforma.clienteRuc && <div>RUC {proforma.clienteRuc}</div>}
            {d.atencion && (
              <div>
                Atención: <span className="font-medium text-slate-800">{d.atencion}</span>
                {d.cargo && <span className="text-slate-500"> · {d.cargo}</span>}
              </div>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 px-4 py-3.5">
          <div className={etiqueta}>Detalles</div>
          <dl className="mt-1.5 space-y-1">
            {(
              [
                ['Emisión', d.fechaEmision],
                ['Validez', d.validez],
                ['Válida hasta', d.validaHasta],
                ['Moneda', 'Soles (PEN)'],
              ] as const
            )
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="font-medium text-slate-800 text-right">{v}</dd>
                </div>
              ))}
          </dl>
        </div>
      </section>

      {d.introduccion && <TextoRico html={d.introduccion} className="mt-6 text-slate-700 leading-relaxed" />}

      <table className="mt-6 w-full border-separate border-spacing-0">
        <thead>
          <tr className="text-[9.5px] uppercase tracking-[0.12em] text-white">
            <th className="w-12 whitespace-nowrap bg-[var(--ac)] rounded-l-lg px-2 py-2.5 text-center font-semibold">N.°</th>
            <th className="bg-[var(--ac)] px-3 py-2.5 text-left font-semibold">Descripción</th>
            <th className="w-16 bg-[var(--ac)] px-3 py-2.5 text-center font-semibold">{d.colCantidad}</th>
            <th className="w-24 bg-[var(--ac)] px-3 py-2.5 text-right font-semibold">{d.colPrecio}</th>
            <th className="w-28 bg-[var(--ac)] rounded-r-lg px-3 py-2.5 text-right font-semibold">Importe</th>
          </tr>
        </thead>
        <tbody>
          {proforma.items.map((item, idx) => (
            <tr key={item.id} className="align-top break-inside-avoid">
              <td className="border-b border-slate-200 px-3 py-3 text-center font-semibold text-slate-400 tabular-nums">
                {String(idx + 1).padStart(2, '0')}
              </td>
              <td className="border-b border-slate-200 px-3 py-3">
                <Descripcion item={item} />
              </td>
              <td className="border-b border-slate-200 px-3 py-3 text-center tabular-nums">{item.cantidad}</td>
              <td className="border-b border-slate-200 px-3 py-3 text-right tabular-nums text-slate-600">
                {formatNumero(item.precioUnitario)}
              </td>
              <td className="border-b border-slate-200 px-3 py-3 text-right tabular-nums font-semibold text-slate-900">
                {formatNumero(totalItemProforma(item))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="mt-5 flex items-start justify-between gap-8 break-inside-avoid">
        <div className="pt-2 text-[10.5px] tracking-wide text-slate-500">
          {d.letras && (
            <>
              <span className={etiqueta}>Importe en letras</span>
              <div className="mt-1 font-medium text-slate-700">{d.letras}</div>
            </>
          )}
        </div>
        <div className="w-64 shrink-0 space-y-2">
          {d.esServicio && (
            <div className="flex justify-between px-4 text-slate-600">
              <span>Total horas</span>
              <span className="font-semibold tabular-nums">{d.totalHoras}</span>
            </div>
          )}
          <div className="rounded-xl bg-[var(--ac)] px-4 py-3 flex items-center justify-between text-white">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-90">Total</span>
            <span className="text-[20px] font-bold tabular-nums">{formatMonto(d.total)}</span>
          </div>
        </div>
      </section>

      <div className="grow min-h-8" />

      <Pie
        d={d}
        empresa={empresa}
        claseEtiqueta={etiqueta}
        claseBanco="rounded-lg border-l-4 border-[var(--ac)] bg-slate-50 px-4 py-3"
        claseLineaFirma="border-slate-400"
      />
    </>
  );
}

/* ─────────────────────────── Minimalista ─────────────────────────── */

function Minimalista({ proforma, empresa, d }: { proforma: Proforma; empresa: DatosEmpresa; d: Datos }) {
  const etiqueta = 'text-[9px] font-medium uppercase tracking-[0.2em] text-slate-400';
  return (
    <>
      <header className="flex items-end justify-between gap-8 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-4 min-w-0">
          <Logo src={d.logo} />
          <div className="min-w-0">
            <div className="text-[19px] font-semibold tracking-tight text-slate-900 leading-tight">
              {empresa.nombre || 'Tu empresa'}
            </div>
            {d.contacto.length > 0 && (
              <div className="mt-1.5 space-y-0.5 text-slate-500 leading-snug">
                {d.contacto.map((linea) => (
                  <div key={linea}>{linea}</div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[34px] font-light tracking-tight leading-none text-[var(--ac)]">Proforma</div>
          <div className="mt-2 text-slate-600 tracking-wide tabular-nums">N.° {proforma.numero}</div>
          {empresa.ruc && <div className="text-slate-400 tabular-nums">RUC {empresa.ruc}</div>}
        </div>
      </header>

      <section className="mt-6 grid grid-cols-3 gap-6">
        <div>
          <div className={etiqueta}>Cliente</div>
          <div className="mt-1.5 font-semibold text-slate-900 leading-snug">{proforma.clienteNombre || '—'}</div>
          {proforma.clienteRuc && <div className="text-slate-500">RUC {proforma.clienteRuc}</div>}
        </div>
        <div>
          {d.atencion && (
            <>
              <div className={etiqueta}>Atención</div>
              <div className="mt-1.5 font-medium text-slate-800">{d.atencion}</div>
              {d.cargo && <div className="text-slate-500">{d.cargo}</div>}
            </>
          )}
        </div>
        <div className="text-right">
          <div className={etiqueta}>Emisión</div>
          <div className="mt-1.5 text-slate-800">{d.fechaEmision}</div>
          {d.validaHasta && <div className="text-slate-500">Válida hasta el {d.validaHasta}</div>}
          <div className="text-slate-500">Soles (PEN)</div>
        </div>
      </section>

      {d.introduccion && <TextoRico html={d.introduccion} className="mt-8 text-slate-700 leading-relaxed" />}

      <table className="mt-8 w-full border-collapse">
        <thead>
          <tr className={`${etiqueta} border-b border-slate-900`}>
            <th className="w-10 pb-2 text-left font-medium">N.°</th>
            <th className="pb-2 text-left font-medium">Descripción</th>
            <th className="w-16 pb-2 text-center font-medium">{d.colCantidad}</th>
            <th className="w-24 pb-2 text-right font-medium">{d.colPrecio}</th>
            <th className="w-28 pb-2 text-right font-medium">Importe</th>
          </tr>
        </thead>
        <tbody>
          {proforma.items.map((item, idx) => (
            <tr key={item.id} className="align-top border-b border-slate-100 break-inside-avoid">
              <td className="py-3.5 text-slate-400 tabular-nums">{String(idx + 1).padStart(2, '0')}</td>
              <td className="py-3.5 pr-4">
                <Descripcion item={item} />
              </td>
              <td className="py-3.5 text-center tabular-nums">{item.cantidad}</td>
              <td className="py-3.5 text-right tabular-nums text-slate-500">{formatNumero(item.precioUnitario)}</td>
              <td className="py-3.5 text-right tabular-nums text-slate-900">{formatNumero(totalItemProforma(item))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="mt-5 flex justify-end break-inside-avoid">
        <div className="w-80 text-right">
          {d.esServicio && (
            <div className="flex justify-between text-slate-500 mb-2">
              <span className={etiqueta}>Total horas</span>
              <span className="tabular-nums">{d.totalHoras}</span>
            </div>
          )}
          <div className="flex items-baseline justify-between border-t-2 border-[var(--ac)] pt-2.5">
            <span className={etiqueta}>Total</span>
            <span className="text-[24px] font-light tabular-nums text-slate-900">{formatMonto(d.total)}</span>
          </div>
          {d.letras && <div className="mt-1 text-[10px] tracking-wide text-slate-400">{d.letras}</div>}
        </div>
      </section>

      <div className="grow min-h-10" />

      <Pie d={d} empresa={empresa} claseEtiqueta={etiqueta} claseBanco="" claseLineaFirma="border-slate-300" />
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────── */

export function ProformaDocumento({ proforma, datosEmpresa }: { proforma: Proforma; datosEmpresa: DatosEmpresa }) {
  const d = datosDocumento(proforma, datosEmpresa);
  const acento = proforma.colorAcento || '#2563eb';
  const estilo = {
    fontFamily: fuenteCss(proforma.fuente),
    '--ac': acento,
    '--ac-suave': tinte(acento, 0.08),
    '--ac-medio': tinte(acento, 0.2),
  } as CSSProperties;

  let contenido: ReactNode;
  if (proforma.diseno === 'moderno') contenido = <Moderno proforma={proforma} empresa={datosEmpresa} d={d} />;
  else if (proforma.diseno === 'minimalista') contenido = <Minimalista proforma={proforma} empresa={datosEmpresa} d={d} />;
  else contenido = <Clasico proforma={proforma} empresa={datosEmpresa} d={d} />;

  return (
    <div
      style={estilo}
      className="proforma-sheet bg-white rounded-xl shadow-xl print:rounded-none print:shadow-none border border-slate-200 print:border-0 p-10 print:p-0 flex flex-col text-[11.5px] leading-normal text-slate-700"
    >
      {contenido}
    </div>
  );
}
