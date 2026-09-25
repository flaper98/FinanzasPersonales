const UNIDADES = [
  'cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
  'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve',
  'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis',
  'veintisiete', 'veintiocho', 'veintinueve',
];
const DECENAS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = [
  '', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos',
  'seiscientos', 'setecientos', 'ochocientos', 'novecientos',
];

/** 1..999 en letras. */
function menosDeMil(n: number): string {
  if (n === 100) return 'cien';
  const centena = Math.floor(n / 100);
  const resto = n % 100;
  const partes: string[] = [];
  if (centena) partes.push(CENTENAS[centena]);
  if (resto < 30) {
    if (resto) partes.push(UNIDADES[resto]);
  } else {
    const unidad = resto % 10;
    const decena = DECENAS[Math.floor(resto / 10)];
    partes.push(unidad ? `${decena} y ${UNIDADES[unidad]}` : decena);
  }
  return partes.join(' ');
}

/** "uno" pierde la "o" delante de "mil"/"millones": "veintiún mil", "treinta y un millones". */
function apocopar(texto: string): string {
  return texto.replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un');
}

function enteroEnLetras(n: number): string {
  if (n === 0) return 'cero';
  const millones = Math.floor(n / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;
  const partes: string[] = [];
  if (millones) partes.push(millones === 1 ? 'un millón' : `${apocopar(menosDeMil(millones))} millones`);
  if (miles) partes.push(miles === 1 ? 'mil' : `${apocopar(menosDeMil(miles))} mil`);
  if (resto) partes.push(menosDeMil(resto));
  return partes.join(' ');
}

/**
 * Monto en letras al estilo de los comprobantes peruanos:
 * 414 → "SON CUATROCIENTOS CATORCE Y 00/100 SOLES".
 * Soporta hasta 999 999 999; por encima cae al número con formato.
 */
export function montoEnLetrasSoles(monto: number): string {
  const centimos = Math.round(monto * 100);
  const soles = Math.floor(centimos / 100);
  const cc = String(centimos % 100).padStart(2, '0');
  if (soles >= 1_000_000_000) return `SON ${soles.toLocaleString('es-PE')} Y ${cc}/100 SOLES`;
  return `SON ${enteroEnLetras(soles).toUpperCase()} Y ${cc}/100 SOLES`;
}

/**
 * Normaliza un texto libre a Título Consistente: recorta espacios, colapsa
 * espacios repetidos y deja en mayúscula solo la primera letra de cada
 * palabra. Así "PAGO mi banco", "pago MI BANCO" o "Pago Mi Banco" siempre
 * terminan viéndose igual, sin importar cómo se hayan escrito en el formulario.
 */
export function normalizarDetalle(texto: string): string {
  return texto
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((palabra) => (palabra ? palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase() : palabra))
    .join(' ');
}
