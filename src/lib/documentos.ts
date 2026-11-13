import type { DatosEmpresa, PaqueteCotizacion, PlantillaDocumento, Proforma } from '../types';
import { totalProforma } from './calculations';
import { sanitizarHtml } from './html';
import { montoEnLetrasSoles } from './text';

/**
 * Documentos que acompañan cada respuesta a una solicitud de cotización
 * (declaraciones juradas, cartas, anexos). Cada plantilla tiene datos
 * variables entre llaves dobles — {{FECHA_LARGA}}, {{DNI}}, … — que se
 * completan con los datos de la empresa y de la cotización al generarla.
 */

export const VARIABLES_DOCUMENTO: { clave: string; descripcion: string; grupo: 'Tus datos' | 'Cotización' | 'Fecha' }[] = [
  { clave: 'NOMBRE', descripcion: 'Quien firma (ej. RIVALDO OROCHE VASQUEZ)', grupo: 'Tus datos' },
  { clave: 'DNI', descripcion: 'DNI', grupo: 'Tus datos' },
  { clave: 'RUC', descripcion: 'RUC', grupo: 'Tus datos' },
  { clave: 'RAZON_SOCIAL', descripcion: 'Nombre / razón social de la empresa', grupo: 'Tus datos' },
  { clave: 'DOMICILIO', descripcion: 'Domicilio', grupo: 'Tus datos' },
  { clave: 'CELULAR', descripcion: 'Celular', grupo: 'Tus datos' },
  { clave: 'EMAIL', descripcion: 'Correo', grupo: 'Tus datos' },
  { clave: 'BANCO', descripcion: 'Banco', grupo: 'Tus datos' },
  { clave: 'CUENTA', descripcion: 'N.° de cuenta', grupo: 'Tus datos' },
  { clave: 'CCI', descripcion: 'CCI', grupo: 'Tus datos' },
  { clave: 'ENTIDAD', descripcion: 'Entidad (ej. Municipalidad Distrital de Tahuania)', grupo: 'Cotización' },
  { clave: 'ENTIDAD_MAYUS', descripcion: 'Entidad en MAYÚSCULAS', grupo: 'Cotización' },
  { clave: 'CIUDAD', descripcion: 'Ciudad (ej. TAHUANIA-BOLOGNESI)', grupo: 'Cotización' },
  { clave: 'N_SOLICITUD', descripcion: 'N.° de solicitud de cotización', grupo: 'Cotización' },
  { clave: 'OBJETO', descripcion: 'Servicio o bien cotizado', grupo: 'Cotización' },
  { clave: 'MONTO', descripcion: 'Total de la proforma (S/ 9,500.00)', grupo: 'Cotización' },
  { clave: 'MONTO_LETRAS', descripcion: 'Total en letras', grupo: 'Cotización' },
  { clave: 'FECHA', descripcion: '13/11/2026', grupo: 'Fecha' },
  { clave: 'FECHA_LARGA', descripcion: '13 de noviembre del 2026', grupo: 'Fecha' },
  { clave: 'FECHA_LARGA_MAYUS', descripcion: '13 DE NOVIEMBRE DEL 2026', grupo: 'Fecha' },
  { clave: 'DIA', descripcion: '13', grupo: 'Fecha' },
  { clave: 'MES', descripcion: 'noviembre', grupo: 'Fecha' },
  { clave: 'MES_MAYUS', descripcion: 'NOVIEMBRE', grupo: 'Fecha' },
  { clave: 'ANIO', descripcion: '2026', grupo: 'Fecha' },
];

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function formatMonto(n: number): string {
  return n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 });
}

/** Valor de cada variable para una cotización concreta. */
export function valoresVariables(
  paquete: Pick<PaqueteCotizacion, 'entidad' | 'ciudad' | 'numeroSolicitud' | 'fecha' | 'objeto'>,
  empresa: DatosEmpresa,
  proforma: Proforma | null,
): Record<string, string> {
  const [anio, mes, dia] = paquete.fecha.split('-');
  const nombreMes = MESES[Number(mes) - 1] ?? '';
  const fechaLarga = `${Number(dia)} de ${nombreMes} del ${anio}`;
  const total = proforma ? totalProforma(proforma.items) : null;
  return {
    NOMBRE: empresa.representante || empresa.nombre,
    DNI: empresa.dni,
    RUC: empresa.ruc,
    RAZON_SOCIAL: empresa.nombre,
    DOMICILIO: empresa.domicilio || empresa.direccion,
    CELULAR: empresa.celular,
    EMAIL: empresa.email,
    BANCO: empresa.banco,
    CUENTA: empresa.numeroCuenta,
    CCI: empresa.numeroCci,
    ENTIDAD: paquete.entidad,
    ENTIDAD_MAYUS: paquete.entidad.toUpperCase(),
    CIUDAD: paquete.ciudad,
    N_SOLICITUD: paquete.numeroSolicitud,
    OBJETO: paquete.objeto,
    MONTO: total === null ? '' : formatMonto(total),
    MONTO_LETRAS: total === null ? '' : montoEnLetrasSoles(total),
    FECHA: `${dia}/${mes}/${anio}`,
    FECHA_LARGA: fechaLarga,
    FECHA_LARGA_MAYUS: fechaLarga.toUpperCase(),
    DIA: String(Number(dia)),
    MES: nombreMes,
    MES_MAYUS: nombreMes.toUpperCase(),
    ANIO: anio,
  };
}

const PATRON_VARIABLE = /\{\{\s*([A-Z_]+)\s*\}\}/g;

function escaparHtml(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Limpia el HTML de la plantilla y reemplaza sus variables. Una variable sin
 * valor (ej. DNI no cargado) sale resaltada como [DNI] para que se note antes
 * de enviar el documento, en vez de quedar en blanco sin que nadie lo vea.
 */
export function aplicarVariables(html: string, valores: Record<string, string>): string {
  return sanitizarHtml(html).replace(PATRON_VARIABLE, (original, clave: string) => {
    if (!(clave in valores)) return original;
    const valor = valores[clave];
    return valor
      ? escaparHtml(valor)
      : `<span style="background:#fde68a;color:#92400e;padding:0 2px">[${clave}]</span>`;
  });
}

/** Variables que la plantilla usa pero que no tienen valor (para avisar antes de generar). */
export function variablesFaltantes(plantillas: PlantillaDocumento[], valores: Record<string, string>): string[] {
  const faltan = new Set<string>();
  for (const p of plantillas) {
    for (const texto of [p.cuerpo, p.pieFirma]) {
      for (const [, clave] of texto.matchAll(PATRON_VARIABLE)) {
        if (clave in valores && !valores[clave]) faltan.add(clave);
      }
    }
  }
  return [...faltan];
}

/* ─────────────────────── Plantillas iniciales ─────────────────────── */

const BORDE = 'border:1px solid #000;padding:4px 8px';
const CASILLA = 'border:1px solid #000;padding:4px 0;width:2.6em;text-align:center';

/** Formatos que se cargan la primera vez, copiados de los que pide la Municipalidad de Tahuania. Son editables. */
export function plantillasIniciales(nuevoId: () => string): PlantillaDocumento[] {
  return [
    {
      id: nuevoId(),
      nombre: 'Anexo - DJ de parentesco y nepotismo',
      membrete: '',
      cuerpo: [
        '<p style="text-align:center"><b>ANEXO</b></p>',
        '<p style="text-align:center"><b>DECLARACIÓN JURADA DE PARENTESCO Y NEPOTISMO</b></p>',
        '<p><br></p>',
        '<p style="text-align:justify">Yo, {{NOMBRE}} con D.N.I. Nº {{DNI}} y domicilio actual en {{DOMICILIO}}.</p>',
        '<p><br></p>',
        '<p><b>DECLARO BAJO JURAMENTO:</b></p>',
        '<table style="border-collapse:collapse;width:100%"><tbody><tr>',
        '<td style="width:22%;vertical-align:middle">',
        `<table style="border-collapse:collapse"><tbody><tr><td style="${CASILLA}"><b>NO</b></td><td style="${CASILLA}"><b>SI</b></td></tr>`,
        `<tr><td style="${CASILLA}"><b>X</b></td><td style="${CASILLA}"></td></tr></tbody></table>`,
        '</td>',
        '<td style="text-align:justify">Tengo parentesco hasta el cuarto grado de consanguinidad, segundo de afinidad, vínculo conyugal, de convivencia o unión de hecho con funcionarios o directivos de la {{ENTIDAD}} o miembros del Comité.</td>',
        '</tr></tbody></table>',
        '<p><br></p>',
        '<p>En el caso de haber marcado como <b>SI</b>, señale lo siguiente.</p>',
        '<p><br></p>',
        '<table style="border-collapse:collapse;width:100%"><tbody>',
        `<tr><td style="${BORDE};width:45%">Nombre completo de la persona con la que es pariente o tiene vínculo de afinidad, conyugal, de convivencia o unión de hecho, en la entidad.</td><td style="${BORDE}"></td></tr>`,
        `<tr><td style="${BORDE}">Cargo que ocupa</td><td style="${BORDE}"></td></tr>`,
        `<tr><td style="${BORDE}">El grado de parentesco</td><td style="${BORDE}"></td></tr>`,
        '</tbody></table>',
        '<p><br></p>',
        '<p>Por lo que suscribo la presente en honor a la verdad.</p>',
        '<p><br></p>',
        '<p>Dado en la ciudad de, {{CIUDAD}} a los {{DIA}} días del mes de {{MES_MAYUS}} del {{ANIO}}.</p>',
      ].join(''),
      firma: true,
      huella: true,
      alineacionFirma: 'izquierda',
      pieFirma: '(Firma y Sello)<br>DNI: {{DNI}}',
      incluirPorDefecto: true,
    },
    {
      id: nuevoId(),
      nombre: 'Declaración jurada de servicios',
      membrete: '',
      cuerpo: [
        '<p style="text-align:center"><b>{{ENTIDAD_MAYUS}}</b></p>',
        '<p style="text-align:center"><b>OFICINA DE ABASTECIMIENTO Y SERVICIOS AUXILIARES</b></p>',
        '<p><br></p>',
        '<p>SEÑORES:<br><b>OFICINA DE ABASTECIMIENTO Y SERVICIOS AUXILIARES.</b><br><b>{{ENTIDAD_MAYUS}}</b><br>Presente. -</p>',
        '<p><br></p>',
        '<p style="text-align:justify">Es grato dirigirme a usted, para hacer de su conocimiento que luego de haber examinado los documentos proporcionados y conociendo todos los alcances y las condiciones detalladas en dichos documentos declaro bajo juramento:</p>',
        '<ol>',
        '<li style="text-align:justify">Cumplir con el perfil y experiencia requerida en los Términos de Referencia; comprometiéndome a ofrecer el servicio en la forma, lugar, plazos, y características específicas.</li>',
        '<li style="text-align:justify">No tener impedimento para contratar con el Estado, conforme al artículo 11 de la Ley de Contrataciones del Estado.</li>',
        '<li style="text-align:justify">No tener parentesco en el segundo grado de afinidad y cuarto grado de consanguinidad con directivos que tengan facultad de decisión en ámbito de la Provincia de Atalaya.</li>',
        '<li style="text-align:justify">Ser responsable de la veracidad de los documentos e información que presento para formalizar la relación contractual, sometiéndome a la verificación posterior de su veracidad y en caso de haber proporcionado información, documento, formatos y/o declaraciones falsas, se me podrá aplicar las sanciones administrativas y/o penales correspondientes.</li>',
        '<li style="text-align:justify">No haber incurrido y me obligo a no incurrir en actos de corrupción, así como respetar el principio de integridad.</li>',
        '<li style="text-align:justify">No estar incurso en las prohibiciones e incompatibilidades establecidas en la Ley 27588.</li>',
        '<li style="text-align:justify">Conocer las sanciones contenidas en la Ley de Contrataciones del Estado y su Reglamento, así como las disposiciones aplicables en la Ley N° 27444, Ley del procedimiento Administrativo General.</li>',
        '<li style="text-align:justify">No tener inhabilitación vigente para prestar servicios en el Estado, conforme al Registro Nacional de Sanciones de Destitución y Despido – RNSDD.</li>',
        '</ol>',
        '<p style="text-align:justify">Por otro lado, durante la ejecución de mis servicios y en cumplimiento a mis obligaciones contractuales me comprometo a:</p>',
        '<ol style="list-style-type:lower-alpha">',
        '<li style="text-align:justify">No divulgar ningún tipo de información a terceros (documentos, comunicaciones electrónicas y otros)</li>',
        '<li style="text-align:justify">Utilizar y conservar los materiales, herramientas de trabajo y/o mobiliario que me sean otorgados, salvo el desgaste normal de los mismos; comprometiéndome a resarcir de manera pecuniaria a la Entidad en proporción al daño ocasionado.</li>',
        '<li style="text-align:justify">No utilizar para beneficio personal o de terceros, los productos y/o documentos que realice, cuyos derechos de elaboración y/o producción son cedidos como propiedad intelectual de la {{ENTIDAD}}.</li>',
        '</ol>',
        '<p><br></p>',
        '<p style="text-align:right">ATALAYA {{FECHA_LARGA_MAYUS}}</p>',
      ].join(''),
      firma: true,
      huella: false,
      alineacionFirma: 'derecha',
      pieFirma: 'DNI N.º {{DNI}}<br>RUC N° {{RUC}}',
      incluirPorDefecto: true,
    },
    {
      id: nuevoId(),
      nombre: 'DJ de cumplir con el plazo de ejecución',
      membrete: '',
      cuerpo: [
        '<p><br></p>',
        '<p style="text-align:center"><font size="4"><u>DECLARACION JURADA DE CUMPLIR CON EL PLAZO DE EJECUCION DE LA PRESTACION</u></font></p>',
        '<p><br></p>',
        '<p>Mediante el presente suscrito, declaro bajo juramento:</p>',
        '<p style="text-align:justify">Yo {{NOMBRE}}, identificado con DNI N° {{DNI}} con RUC {{RUC}}, con pleno conocimiento de las condiciones que exigen los Términos de Referencia, DECLARO BAJO JURAMENTO:</p>',
        '<p><br></p>',
        '<ul>',
        '<li style="text-align:justify">El servicio cotizado cumple con los TÉRMINOS DE REFERENCIA solicitadas por su representada para la realización de la cotización en mención.</li>',
        '<li style="text-align:justify">De cumplir con el plazo de ejecución de (Forma mensual) según lo estipulado en el Termino de Referencia.</li>',
        '</ul>',
        '<p><br></p>',
        '<p style="text-align:justify">Para mayor conformidad, me afirmo y ratifico en lo expresado, en señal de los cuales firmo el presente documento.</p>',
        '<p><br></p><p><br></p>',
        '<p style="text-align:right">Fecha&nbsp;&nbsp;{{FECHA}}</p>',
      ].join(''),
      firma: true,
      huella: false,
      alineacionFirma: 'centro',
      pieFirma: '{{NOMBRE}}<br>RUC: {{RUC}}<br>DNI: {{DNI}}',
      incluirPorDefecto: true,
    },
    {
      id: nuevoId(),
      nombre: 'Carta de autorización (pago con abono en cuenta - CCI)',
      membrete: '',
      cuerpo: [
        '<p style="text-align:right">{{CIUDAD}}, {{FECHA_LARGA}}</p>',
        '<p><br></p>',
        '<p style="text-align:center"><b><u>CARTA DE AUTORIZACIÓN PARA EL PAGO CON ABONOS EN CUENTA BANCARIA DEL PROVEEDOR</u></b></p>',
        '<p><br></p>',
        '<p>Señores:<br><b>{{ENTIDAD_MAYUS}}</b><br>OFICINA DE ABASTECIMIENTO Y SERVICIOS AUXILIARES<br>Presente.-</p>',
        '<p><br></p>',
        '<p><b>Asunto:</b> Autorización para el pago con abonos en cuenta.</p>',
        '<p><br></p>',
        '<p style="text-align:justify">Por medio de la presente, comunico a ustedes que el número del Código de Cuenta Interbancario (CCI) de mi representada es el <b>{{CCI}}</b>, agradeciéndoles se sirvan disponer lo conveniente para que los pagos a nombre de mi representada sean abonados en la cuenta que corresponde al indicado CCI en el banco <b>{{BANCO}}</b>.</p>',
        '<p style="text-align:justify">Asimismo, dejo constancia que el comprobante de pago a ser emitido por mi representada, una vez cumplida o atendida la correspondiente Orden de Compra y/o de Servicio o las prestaciones en bienes y/o servicios materia del contrato pertinente, quedará cancelado para todos sus efectos mediante la sola acreditación del importe del referido comprobante de pago a favor de la cuenta en la entidad bancaria a que se refiere el primer párrafo de la presente.</p>',
        '<p><br></p>',
        '<table style="border-collapse:collapse">',
        '<tbody>',
        `<tr><td style="${BORDE}"><b>RUC</b></td><td style="${BORDE}">{{RUC}}</td></tr>`,
        `<tr><td style="${BORDE}"><b>Razón social</b></td><td style="${BORDE}">{{RAZON_SOCIAL}}</td></tr>`,
        `<tr><td style="${BORDE}"><b>Banco</b></td><td style="${BORDE}">{{BANCO}}</td></tr>`,
        `<tr><td style="${BORDE}"><b>N.° de cuenta</b></td><td style="${BORDE}">{{CUENTA}}</td></tr>`,
        `<tr><td style="${BORDE}"><b>CCI</b></td><td style="${BORDE}">{{CCI}}</td></tr>`,
        '</tbody></table>',
        '<p><br></p>',
        '<p>Atentamente,</p>',
      ].join(''),
      firma: true,
      huella: false,
      alineacionFirma: 'centro',
      pieFirma: '{{NOMBRE}}<br>DNI: {{DNI}}<br>RUC: {{RUC}}',
      incluirPorDefecto: true,
    },
  ];
}
