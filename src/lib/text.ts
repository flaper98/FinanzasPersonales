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
