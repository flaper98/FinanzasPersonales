import type { DisenoProforma, OpcionesProforma } from '../types';

export const OPCIONES_PROFORMA_DEFAULT: OpcionesProforma = {
  contactoEmisor: true,
  atencionCliente: true,
  validez: true,
  montoEnLetras: true,
  notas: true,
  datosBancarios: true,
  firma: true,
};

export const DISENOS_PROFORMA: { valor: DisenoProforma; etiqueta: string; descripcion: string }[] = [
  { valor: 'clasico', etiqueta: 'Clásico', descripcion: 'Blanco y negro, recuadros marcados' },
  { valor: 'moderno', etiqueta: 'Moderno', descripcion: 'Acentos de color, bordes redondeados' },
  { valor: 'minimalista', etiqueta: 'Minimalista', descripcion: 'Sin recuadros, líneas finas' },
];

export const OPCIONES_PROFORMA_ETIQUETAS: [keyof OpcionesProforma, string][] = [
  ['contactoEmisor', 'Mis datos de contacto'],
  ['atencionCliente', 'Atención / cargo del cliente'],
  ['validez', 'Validez'],
  ['montoEnLetras', 'Monto en letras'],
  ['notas', 'Notas'],
  ['datosBancarios', 'Datos bancarios (forma de pago)'],
  ['firma', 'Firma'],
];

/** Clases de Tailwind de cada diseño, para que ProformaPreview use una sola estructura. */
export interface TemaProforma {
  nombreEmpresa: string;
  /** Recuadro RUC / PROFORMA / N.° del encabezado. */
  recuadro: string;
  recuadroTitulo: string;
  etiqueta: string;
  /** Contenedor de la tabla de ítems. */
  items: string;
  /** Color de las líneas verticales entre columnas, o null para no dibujarlas. */
  colorLineas: string | null;
  thead: string;
  /** Borde que separa los ítems de los totales (y el de la caja de totales). */
  bordeTotales: string;
  cajaTotal: string;
  lineaFirma: string;
  /** Franja decorativa arriba de la hoja, o null. */
  franjaSuperior: string | null;
}

export const TEMAS_PROFORMA: Record<DisenoProforma, TemaProforma> = {
  clasico: {
    nombreEmpresa: 'text-xl font-bold text-black',
    recuadro: 'w-64 border border-black',
    recuadroTitulo: 'bg-neutral-200 text-black',
    etiqueta: 'font-bold uppercase text-black',
    items: 'border border-black',
    colorLineas: '#000',
    thead: 'bg-black text-white',
    bordeTotales: 'border-black',
    cajaTotal: '',
    lineaFirma: 'border-black',
    franjaSuperior: null,
  },
  moderno: {
    nombreEmpresa: 'text-2xl font-extrabold text-brand-700',
    recuadro: 'w-64 rounded-lg overflow-hidden border border-brand-600',
    recuadroTitulo: 'bg-brand-600 text-white',
    etiqueta: 'font-bold uppercase text-brand-700',
    items: 'border border-slate-300 rounded-lg overflow-hidden',
    colorLineas: '#cbd5e1',
    thead: 'bg-brand-600 text-white',
    bordeTotales: 'border-slate-300',
    cajaTotal: 'bg-brand-50',
    lineaFirma: 'border-brand-600',
    franjaSuperior: 'h-2 bg-brand-600 rounded-full mb-6',
  },
  minimalista: {
    nombreEmpresa: 'text-2xl font-light tracking-wide text-slate-900',
    recuadro: 'w-56 border-l-2 border-slate-900 text-left pl-4',
    recuadroTitulo: 'text-slate-900',
    etiqueta: 'font-semibold uppercase text-slate-400 text-[10px] tracking-wider',
    items: 'border-y border-slate-300',
    colorLineas: null,
    thead: 'border-b border-slate-300 text-slate-500',
    bordeTotales: 'border-slate-300',
    cajaTotal: '',
    lineaFirma: 'border-slate-400',
    franjaSuperior: null,
  },
};
