/**
 * Utilidades para el texto con formato (HTML) de los editores de la proforma.
 * El HTML sale de un contentEditable (y de lo que se pegue desde Word, la web,
 * etc.), así que antes de guardarlo o mostrarlo se limpia: solo quedan
 * etiquetas y estilos de formato de texto, nunca scripts, enlaces ni imágenes.
 */

const ETIQUETAS_PERMITIDAS = new Set([
  'B', 'STRONG', 'I', 'EM', 'U', 'S', 'P', 'BR', 'DIV', 'SPAN', 'UL', 'OL', 'LI', 'FONT', 'H1', 'H2', 'H3', 'BLOCKQUOTE',
  // Tablas: los formatos de declaraciones juradas las usan (recuadro NO/SI, cuadro de parentesco).
  'TABLE', 'THEAD', 'TBODY', 'TR', 'TD', 'TH',
]);
const ATRIBUTOS_CELDA = new Set(['colspan', 'rowspan']);
/** Se eliminan con todo su contenido (el resto de etiquetas no permitidas se "desenvuelven", conservando su texto). */
const ETIQUETAS_PELIGROSAS = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'TEMPLATE', 'SVG', 'MATH', 'IMG', 'VIDEO', 'AUDIO']);
const ATRIBUTOS_FONT = new Set(['size', 'face', 'color']);
const ESTILOS_PERMITIDOS = new Set([
  'text-align',
  'font-weight',
  'font-style',
  'text-decoration',
  'text-decoration-line',
  'color',
  'font-size',
  'font-family',
  'list-style-type',
  'vertical-align',
  'width',
  'padding',
  'border-collapse',
]);
/** Bordes de tablas: border, border-top, border-left-width, etc. */
const PREFIJO_BORDE = /^border(-(top|right|bottom|left))?(-(width|style|color))?$/;

function limpiar(el: Element) {
  for (const hijo of Array.from(el.children)) {
    const etiqueta = hijo.tagName.toUpperCase();
    if (ETIQUETAS_PELIGROSAS.has(etiqueta)) {
      hijo.remove();
      continue;
    }
    limpiar(hijo);
    if (!ETIQUETAS_PERMITIDAS.has(etiqueta)) {
      hijo.replaceWith(...Array.from(hijo.childNodes));
      continue;
    }
    for (const attr of Array.from(hijo.attributes)) {
      const nombre = attr.name.toLowerCase();
      const permitido =
        nombre === 'style' ||
        nombre === 'align' ||
        (etiqueta === 'FONT' && ATRIBUTOS_FONT.has(nombre)) ||
        ((etiqueta === 'TD' || etiqueta === 'TH') && ATRIBUTOS_CELDA.has(nombre));
      if (!permitido || /url\(|expression|javascript:/i.test(attr.value)) hijo.removeAttribute(attr.name);
    }
    const estilo = (hijo as HTMLElement).style;
    if (estilo) {
      for (let i = estilo.length - 1; i >= 0; i--) {
        const prop = estilo[i];
        if (!ESTILOS_PERMITIDOS.has(prop) && !PREFIJO_BORDE.test(prop)) estilo.removeProperty(prop);
      }
      if (estilo.length === 0) hijo.removeAttribute('style');
    }
  }
}

export function sanitizarHtml(html: string): string {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const raiz = doc.body.firstElementChild;
  if (!raiz) return '';
  limpiar(raiz);
  return raiz.innerHTML;
}

/** true si el HTML no tiene texto visible (ej. "<p><br></p>" que deja un editor vaciado). */
export function htmlVacio(html: string): boolean {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim() === '';
}

function escaparHtml(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Convierte texto plano (notas guardadas antes de que existiera el editor) a HTML, respetando los saltos de línea. */
export function textoPlanoAHtml(texto: string): string {
  if (!texto) return '';
  if (/<[a-z][^>]*>/i.test(texto)) return texto;
  return escaparHtml(texto).replace(/\r?\n/g, '<br>');
}
