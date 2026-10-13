import { useEffect, useRef, useState, type ReactNode } from 'react';
import { FUENTES_PROFORMA } from '../../lib/proformaDiseno';

/**
 * Editor de texto con formato (negrita, listas, alineación, tamaño, tipo de
 * letra, color) sobre un contentEditable. Usa document.execCommand: está
 * marcado como obsoleto pero todos los navegadores lo siguen soportando, y
 * evita sumar una librería de editor entera para dos campos de texto.
 *
 * Es no controlado: el HTML inicial se carga una sola vez y cada cambio se
 * informa con onChange. El HTML que devuelve se limpia (sanitizarHtml) antes
 * de guardarse y de mostrarse.
 */

const TAMANOS: { valor: string; etiqueta: string }[] = [
  { valor: '2', etiqueta: 'Pequeño' },
  { valor: '3', etiqueta: 'Normal' },
  { valor: '4', etiqueta: 'Mediano' },
  { valor: '5', etiqueta: 'Grande' },
];

const COLORES_TEXTO = ['#0f172a', '#475569', '#2563eb', '#15803d', '#b91c1c', '#c2410c', '#6d28d9'];

function Boton({
  titulo,
  activo,
  onClick,
  children,
}: {
  titulo: string;
  activo?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      // mousedown + preventDefault: así el editor no pierde la selección al hacer clic en la barra.
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`h-7 min-w-7 px-1.5 grid place-items-center rounded text-sm transition ${
        activo ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-slate-200'
      }`}
    >
      {children}
    </button>
  );
}

function Separador() {
  return <span className="w-px h-5 bg-slate-300 mx-0.5" />;
}

/** Iconos de alineación: tres o cuatro rayitas con distinta sangría. */
function IconoAlineacion({ tipo }: { tipo: 'left' | 'center' | 'right' | 'justify' }) {
  const anchos = tipo === 'justify' ? [14, 14, 14, 14] : [14, 9, 12, 8];
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" aria-hidden="true">
      {anchos.map((w, i) => {
        const x = tipo === 'center' ? (14 - w) / 2 : tipo === 'right' ? 14 - w : 0;
        return <rect key={i} x={x} y={i * 3} width={w} height="1.6" rx="0.8" fill="currentColor" />;
      })}
    </svg>
  );
}

export function EditorTexto({
  valor,
  onChange,
  placeholder,
  minAlto = '6rem',
  fuente,
}: {
  valor: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minAlto?: string;
  /** font-family CSS del documento, para que el editor se vea como saldrá en la proforma. */
  fuente?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [activos, setActivos] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = valor;
    // Solo al montar: después el contenido lo maneja el propio contentEditable.
  }, []);

  function refrescarEstado() {
    const estados: Record<string, boolean> = {};
    for (const cmd of ['bold', 'italic', 'underline', 'insertUnorderedList', 'insertOrderedList', 'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull']) {
      try {
        estados[cmd] = document.queryCommandState(cmd);
      } catch {
        estados[cmd] = false;
      }
    }
    setActivos(estados);
  }

  function emitir() {
    const el = ref.current;
    if (!el) return;
    // Un editor "vaciado" suele quedar con <br> o <p><br></p>: lo normalizamos a '' para que :empty muestre el placeholder.
    if (el.innerText.trim() === '' && !el.querySelector('li')) el.innerHTML = '';
    onChange(el.innerHTML);
  }

  function ejecutar(cmd: string, arg?: string) {
    ref.current?.focus();
    document.execCommand('styleWithCSS', false, 'false');
    document.execCommand(cmd, false, arg);
    emitir();
    refrescarEstado();
  }

  return (
    <div className="rounded-lg border border-slate-300 focus-within:ring-2 focus-within:ring-brand-500 overflow-hidden bg-white">
      <div className="flex flex-wrap items-center gap-0.5 px-1.5 py-1 bg-slate-50 border-b border-slate-200">
        <select
          title="Tipo de letra"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) ejecutar('fontName', e.target.value);
            e.target.value = '';
          }}
          className="h-7 rounded border border-slate-200 bg-white text-xs text-slate-600 px-1"
        >
          <option value="">Tipo de letra</option>
          {FUENTES_PROFORMA.map((f) => (
            <option key={f.valor} value={f.css.split(',')[0].replace(/'/g, '')} style={{ fontFamily: f.css }}>
              {f.etiqueta}
            </option>
          ))}
        </select>
        <select
          title="Tamaño"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) ejecutar('fontSize', e.target.value);
            e.target.value = '';
          }}
          className="h-7 rounded border border-slate-200 bg-white text-xs text-slate-600 px-1"
        >
          <option value="">Tamaño</option>
          {TAMANOS.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.etiqueta}
            </option>
          ))}
        </select>
        <Separador />
        <Boton titulo="Negrita (Ctrl+B)" activo={activos.bold} onClick={() => ejecutar('bold')}>
          <span className="font-bold">B</span>
        </Boton>
        <Boton titulo="Cursiva (Ctrl+I)" activo={activos.italic} onClick={() => ejecutar('italic')}>
          <span className="italic font-serif">I</span>
        </Boton>
        <Boton titulo="Subrayado (Ctrl+U)" activo={activos.underline} onClick={() => ejecutar('underline')}>
          <span className="underline">U</span>
        </Boton>
        <Separador />
        <Boton titulo="Lista con viñetas" activo={activos.insertUnorderedList} onClick={() => ejecutar('insertUnorderedList')}>
          •≡
        </Boton>
        <Boton titulo="Lista numerada" activo={activos.insertOrderedList} onClick={() => ejecutar('insertOrderedList')}>
          <span className="text-xs">1.</span>
        </Boton>
        <Separador />
        <Boton titulo="Alinear a la izquierda" activo={activos.justifyLeft} onClick={() => ejecutar('justifyLeft')}>
          <IconoAlineacion tipo="left" />
        </Boton>
        <Boton titulo="Centrar" activo={activos.justifyCenter} onClick={() => ejecutar('justifyCenter')}>
          <IconoAlineacion tipo="center" />
        </Boton>
        <Boton titulo="Alinear a la derecha" activo={activos.justifyRight} onClick={() => ejecutar('justifyRight')}>
          <IconoAlineacion tipo="right" />
        </Boton>
        <Boton titulo="Justificar" activo={activos.justifyFull} onClick={() => ejecutar('justifyFull')}>
          <IconoAlineacion tipo="justify" />
        </Boton>
        <Separador />
        {COLORES_TEXTO.map((c) => (
          <button
            key={c}
            type="button"
            title="Color del texto"
            aria-label={`Color ${c}`}
            onMouseDown={(e) => {
              e.preventDefault();
              ejecutar('foreColor', c);
            }}
            className="w-4 h-4 rounded-full border border-white ring-1 ring-slate-300 hover:scale-110 transition"
            style={{ backgroundColor: c }}
          />
        ))}
        <Separador />
        <Boton titulo="Quitar formato" onClick={() => ejecutar('removeFormat')}>
          <span className="text-xs">⌫ Formato</span>
        </Boton>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={emitir}
        onKeyUp={refrescarEstado}
        onMouseUp={refrescarEstado}
        onFocus={refrescarEstado}
        className="editor-texto texto-rico px-3 py-2 text-sm text-slate-800 leading-relaxed focus:outline-none"
        style={{ minHeight: minAlto, fontFamily: fuente }}
      />
    </div>
  );
}
