import type { DisenoProforma, FuenteProforma, OpcionesProforma, Proforma } from '../types';

export const OPCIONES_PROFORMA_DEFAULT: OpcionesProforma = {
  logo: true,
  contactoEmisor: true,
  atencionCliente: true,
  validez: true,
  introduccion: true,
  montoEnLetras: true,
  notas: true,
  datosBancarios: true,
  firma: true,
};

export const COLOR_ACENTO_DEFAULT = '#2563eb';

export const INTRODUCCION_DEFAULT =
  '<p>De nuestra consideración:</p><p>Por medio de la presente le hacemos llegar nuestra propuesta económica, de acuerdo con lo solicitado.</p>';

/** Lo que una proforma nueva hereda de la anterior: su aspecto y los textos de plantilla. */
export type PlantillaProforma = Pick<Proforma, 'diseno' | 'fuente' | 'colorAcento' | 'opciones' | 'introduccion' | 'nota'>;

export const DISENOS_PROFORMA: { valor: DisenoProforma; etiqueta: string; descripcion: string }[] = [
  { valor: 'clasico', etiqueta: 'Clásico', descripcion: 'Formato SUNAT, blanco y negro' },
  { valor: 'moderno', etiqueta: 'Moderno', descripcion: 'Color, tarjetas y total destacado' },
  { valor: 'minimalista', etiqueta: 'Minimalista', descripcion: 'Mucho aire, líneas finas' },
];

export const FUENTES_PROFORMA: { valor: FuenteProforma; etiqueta: string; css: string }[] = [
  { valor: 'inter', etiqueta: 'Inter', css: "'Inter', system-ui, sans-serif" },
  { valor: 'poppins', etiqueta: 'Poppins', css: "'Poppins', system-ui, sans-serif" },
  { valor: 'montserrat', etiqueta: 'Montserrat', css: "'Montserrat', system-ui, sans-serif" },
  { valor: 'lato', etiqueta: 'Lato', css: "'Lato', system-ui, sans-serif" },
  { valor: 'lora', etiqueta: 'Lora (serif)', css: "'Lora', Georgia, serif" },
  { valor: 'merriweather', etiqueta: 'Merriweather (serif)', css: "'Merriweather', Georgia, serif" },
];

export function fuenteCss(fuente: FuenteProforma): string {
  return (FUENTES_PROFORMA.find((f) => f.valor === fuente) ?? FUENTES_PROFORMA[0]).css;
}

export const COLORES_ACENTO: { valor: string; etiqueta: string }[] = [
  { valor: '#2563eb', etiqueta: 'Azul' },
  { valor: '#1e3a8a', etiqueta: 'Azul marino' },
  { valor: '#0f766e', etiqueta: 'Verde azulado' },
  { valor: '#15803d', etiqueta: 'Verde' },
  { valor: '#b91c1c', etiqueta: 'Rojo' },
  { valor: '#9f1239', etiqueta: 'Vino' },
  { valor: '#c2410c', etiqueta: 'Naranja' },
  { valor: '#6d28d9', etiqueta: 'Morado' },
  { valor: '#334155', etiqueta: 'Grafito' },
];

export const OPCIONES_PROFORMA_ETIQUETAS: [keyof OpcionesProforma, string][] = [
  ['logo', 'Logo'],
  ['contactoEmisor', 'Mis datos de contacto'],
  ['atencionCliente', 'Atención / cargo del cliente'],
  ['validez', 'Validez'],
  ['introduccion', 'Texto de presentación'],
  ['montoEnLetras', 'Monto en letras'],
  ['notas', 'Términos y condiciones'],
  ['datosBancarios', 'Datos bancarios (forma de pago)'],
  ['firma', 'Firma'],
];

/** Mezcla un color hex con blanco; `peso` es cuánto del color queda (0.08 = un tinte muy suave). */
export function tinte(hex: string, peso: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return '#f1f5f9';
  const n = parseInt(m[1], 16);
  const canal = (c: number) => Math.round(c * peso + 255 * (1 - peso));
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(canal);
  return `rgb(${r}, ${g}, ${b})`;
}

/** Suma `dias` hábiles (lunes a viernes) a una fecha ISO y la devuelve en ISO. */
export function sumarDiasHabiles(iso: string, dias: number): string {
  const [y, mo, d] = iso.split('-').map(Number);
  const fecha = new Date(y, mo - 1, d);
  let restantes = dias;
  while (restantes > 0) {
    fecha.setDate(fecha.getDate() + 1);
    const dow = fecha.getDay();
    if (dow !== 0 && dow !== 6) restantes--;
  }
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`;
}

/** Separa la descripción de un ítem en título (primera línea) y detalle (el resto), para mostrarlos con distinto peso. */
export function partesDescripcion(descripcion: string): { titulo: string; detalle: string } {
  const [titulo, ...resto] = descripcion.split('\n');
  return { titulo: titulo.trim(), detalle: resto.join('\n').trim() };
}
