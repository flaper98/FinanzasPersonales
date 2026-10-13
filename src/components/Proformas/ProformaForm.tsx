import { useState } from 'react';
import type {
  DatosEmpresa,
  DisenoProforma,
  FuenteProforma,
  ItemProforma,
  NewProformaInput,
  OpcionesProforma,
  Proforma,
  TipoProforma,
} from '../../types';
import { Modal } from '../common/Modal';
import { EditorTexto } from '../common/EditorTexto';
import { totalItemProforma, totalProforma } from '../../lib/calculations';
import { newId } from '../../lib/id';
import { todayIso } from '../../lib/monthUtils';
import { htmlVacio, sanitizarHtml } from '../../lib/html';
import {
  COLOR_ACENTO_DEFAULT,
  COLORES_ACENTO,
  DISENOS_PROFORMA,
  FUENTES_PROFORMA,
  INTRODUCCION_DEFAULT,
  OPCIONES_PROFORMA_DEFAULT,
  OPCIONES_PROFORMA_ETIQUETAS,
  fuenteCss,
  type PlantillaProforma,
} from '../../lib/proformaDiseno';
import { ProformaPreview } from './ProformaPreview';

const inputClase =
  'w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

function formatMonto(n: number): string {
  return n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 });
}

/** Boceto en miniatura de cada diseño, para elegirlo a simple vista. */
function MiniaturaDiseno({ diseno, color }: { diseno: DisenoProforma; color: string }) {
  if (diseno === 'moderno') {
    return (
      <div className="h-16 rounded bg-white border border-slate-200 p-1.5 flex flex-col gap-1">
        <div className="h-1 rounded-full" style={{ backgroundColor: color }} />
        <div className="flex justify-between items-start">
          <div className="h-1.5 w-9 rounded bg-slate-700" />
          <div className="h-2 w-8 rounded-sm" style={{ backgroundColor: color }} />
        </div>
        <div className="flex gap-1">
          <div className="h-2.5 grow rounded-sm opacity-20" style={{ backgroundColor: color }} />
          <div className="h-2.5 w-5 rounded-sm border border-slate-300" />
        </div>
        <div className="h-1.5 rounded-sm" style={{ backgroundColor: color }} />
        <div className="ml-auto h-2 w-7 rounded-sm" style={{ backgroundColor: color }} />
      </div>
    );
  }
  if (diseno === 'minimalista') {
    return (
      <div className="h-16 rounded bg-white border border-slate-200 p-1.5 flex flex-col gap-1">
        <div className="flex justify-between items-end pb-1 border-b border-slate-200">
          <div className="h-1.5 w-8 rounded bg-slate-500" />
          <div className="h-2 w-9 rounded-sm opacity-60" style={{ backgroundColor: color }} />
        </div>
        <div className="mt-1 border-b border-slate-800" />
        <div className="border-b border-slate-200 h-1.5" />
        <div className="border-b border-slate-200 h-1.5" />
        <div className="ml-auto w-8 border-t-2" style={{ borderColor: color }} />
      </div>
    );
  }
  return (
    <div className="h-16 rounded bg-white border border-slate-200 p-1.5 flex flex-col gap-1">
      <div className="flex justify-between">
        <div className="h-1.5 w-8 bg-black" />
        <div className="h-2.5 w-6 border border-black bg-neutral-200" />
      </div>
      <div className="grow border border-black">
        <div className="h-1.5 bg-black" />
      </div>
    </div>
  );
}

/** Bloque con un check en el título que decide si el texto va en la proforma; si no va, se oculta el editor. */
function SeccionTexto({
  titulo,
  ayuda,
  activo,
  onActivo,
  children,
}: {
  titulo: string;
  ayuda: string;
  activo: boolean;
  onActivo: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-slate-100 pt-4">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={activo}
          onChange={(e) => onActivo(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
        <span className="text-sm font-medium text-slate-700">{titulo}</span>
      </label>
      {activo ? (
        <>
          <p className="text-xs text-slate-400 mt-0.5 mb-2 ml-6">{ayuda}</p>
          {children}
        </>
      ) : (
        <p className="text-xs text-slate-400 mt-0.5 ml-6">No se incluye en la proforma.</p>
      )}
    </div>
  );
}

function itemVacio(): ItemProforma {
  return { id: newId(), descripcion: '', cantidad: 1, precioUnitario: 0 };
}

export function ProformaForm({
  initial,
  numeroSugerido,
  plantilla,
  avisos,
  datosEmpresa,
  onSubmit,
  onClose,
}: {
  initial?: Proforma;
  numeroSugerido: string;
  /** Aspecto y textos con que arranca una proforma nueva (los de la última creada). */
  plantilla?: PlantillaProforma;
  /** Para la vista previa del borrador. */
  datosEmpresa: DatosEmpresa;
  /** Aviso junto a un check cuyo contenido no está cargado en "Datos de mi empresa" (ej. firma sin imagen). */
  avisos?: Partial<Record<keyof OpcionesProforma, string>>;
  onSubmit: (input: NewProformaInput) => void;
  onClose: () => void;
}) {
  const [numero, setNumero] = useState(initial?.numero ?? numeroSugerido);
  const [fecha, setFecha] = useState(initial?.fecha ?? todayIso());
  const [validezDias, setValidezDias] = useState(initial?.validezDias?.toString() ?? '15');
  const [tipo, setTipo] = useState<TipoProforma>(initial?.tipo ?? 'productos');
  const esServicio = tipo === 'servicio';
  const [clienteNombre, setClienteNombre] = useState(initial?.clienteNombre ?? '');
  const [clienteRuc, setClienteRuc] = useState(initial?.clienteRuc ?? '');
  const [clienteContacto, setClienteContacto] = useState(initial?.clienteContacto ?? '');
  const [clienteCargo, setClienteCargo] = useState(initial?.clienteCargo ?? '');
  const [items, setItems] = useState<ItemProforma[]>(initial?.items?.length ? initial.items : [itemVacio()]);
  const base = initial ?? plantilla;
  const [introduccion, setIntroduccion] = useState(base?.introduccion ?? INTRODUCCION_DEFAULT);
  const [nota, setNota] = useState(base?.nota ?? '');
  const [diseno, setDiseno] = useState<DisenoProforma>(base?.diseno ?? 'moderno');
  const [fuente, setFuente] = useState<FuenteProforma>(base?.fuente ?? 'inter');
  const [colorAcento, setColorAcento] = useState(base?.colorAcento ?? COLOR_ACENTO_DEFAULT);
  const [opciones, setOpciones] = useState<OpcionesProforma>(base?.opciones ?? OPCIONES_PROFORMA_DEFAULT);
  const [previsualizando, setPrevisualizando] = useState(false);

  function actualizarItem(id: string, cambios: Partial<ItemProforma>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...cambios } : it)));
  }

  function eliminarItem(id: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev));
  }

  function textoLimpio(html: string): string {
    return htmlVacio(html) ? '' : sanitizarHtml(html);
  }

  function armarInput(): NewProformaInput {
    return {
      numero: numero.trim(),
      fecha,
      validezDias: parseInt(validezDias, 10) || 0,
      tipo,
      clienteNombre: clienteNombre.trim(),
      clienteRuc: clienteRuc.trim(),
      clienteContacto: clienteContacto.trim(),
      clienteCargo: clienteCargo.trim(),
      items: items
        .filter((it) => it.descripcion.trim() !== '')
        .map((it) => ({ ...it, descripcion: it.descripcion.trim() })),
      introduccion: textoLimpio(introduccion),
      nota: textoLimpio(nota),
      diseno,
      fuente,
      colorAcento,
      opciones,
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(armarInput());
    onClose();
  }

  return (
    <Modal title={initial ? 'Editar proforma' : 'Nueva proforma'} onClose={onClose} maxWidth="max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Número</label>
            <input
              required
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="041-2026"
              className={inputClase}
            />
            <p className="text-xs text-slate-400 mt-1">Correlativo-año. Se sugiere solo el siguiente disponible.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
            <input required type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputClase} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Válida por (días hábiles)</label>
            <input
              type="number"
              min="1"
              value={validezDias}
              onChange={(e) => setValidezDias(e.target.value)}
              className={inputClase}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de proforma</label>
          <div className="flex gap-2">
            {(
              [
                ['productos', '📦 Productos / bienes'],
                ['servicio', '⏱️ Servicio por horas'],
              ] as const
            ).map(([valor, etiqueta]) => (
              <button
                type="button"
                key={valor}
                onClick={() => setTipo(valor)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition ${
                  tipo === valor
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {etiqueta}
              </button>
            ))}
          </div>
          {esServicio && (
            <p className="text-xs text-slate-400 mt-1">
              Cada ítem se cobra por horas trabajadas × tarifa por hora, en vez de cantidad × precio unitario.
            </p>
          )}
        </div>

        <div className="border-t border-slate-100 pt-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Cliente (destinatario)</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Nombre / Razón social</label>
              <input
                required
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                className={inputClase}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">RUC</label>
              <input value={clienteRuc} onChange={(e) => setClienteRuc(e.target.value)} className={inputClase} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Dirigido a</label>
              <input
                value={clienteContacto}
                onChange={(e) => setClienteContacto(e.target.value)}
                placeholder="Nombre de la persona de contacto"
                className={inputClase}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Cargo</label>
              <input
                value={clienteCargo}
                onChange={(e) => setClienteCargo(e.target.value)}
                placeholder="Gerente General"
                className={inputClase}
              />
            </div>
          </div>
        </div>

        <SeccionTexto
          titulo="Texto de presentación"
          ayuda="Va antes de los ítems. Ej.: saludo y motivo de la proforma."
          activo={opciones.introduccion}
          onActivo={(v) => setOpciones((prev) => ({ ...prev, introduccion: v }))}
        >
          <EditorTexto
            valor={introduccion}
            onChange={setIntroduccion}
            fuente={fuenteCss(fuente)}
            placeholder="De nuestra consideración: Por medio de la presente…"
          />
        </SeccionTexto>

        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium text-slate-700">Ítems</p>
              <p className="text-xs text-slate-400">La primera línea sale como título en negrita; las siguientes, como detalle.</p>
            </div>
            <button
              type="button"
              onClick={() => setItems((prev) => [...prev, itemVacio()])}
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              + Agregar ítem
            </button>
          </div>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="border border-slate-200 rounded-lg p-2 space-y-2">
                <textarea
                  value={item.descripcion}
                  onChange={(e) => actualizarItem(item.id, { descripcion: e.target.value })}
                  placeholder={
                    esServicio
                      ? 'Título del servicio\nDetalle de lo que se va a hacer (en las líneas siguientes)'
                      : 'Nombre del producto\nCaracterísticas o detalle (en las líneas siguientes)'
                  }
                  rows={3}
                  className={`${inputClase} w-full resize-y`}
                />
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <label className="flex items-center gap-1.5 text-xs text-slate-500">
                    {esServicio ? 'Horas' : 'Cant.'}
                    <input
                      type="number"
                      min="0"
                      step={esServicio ? '0.5' : '1'}
                      value={item.cantidad}
                      onChange={(e) => actualizarItem(item.id, { cantidad: parseFloat(e.target.value) || 0 })}
                      className={`${inputClase} w-16`}
                    />
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-500">
                    {esServicio ? 'Tarifa/hora' : 'P. unitario'}
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.precioUnitario}
                      onChange={(e) => actualizarItem(item.id, { precioUnitario: parseFloat(e.target.value) || 0 })}
                      className={`${inputClase} w-24`}
                    />
                  </label>
                  <div className="ml-auto text-sm font-medium text-slate-700 whitespace-nowrap">
                    Total: {formatMonto(totalItemProforma(item))}
                  </div>
                  <button
                    type="button"
                    onClick={() => eliminarItem(item.id)}
                    disabled={items.length <= 1}
                    className="text-rose-600 hover:underline text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end items-center gap-3 mt-2 text-sm">
            {esServicio && (
              <span className="text-slate-500">
                Total horas: {items.reduce((sum, it) => sum + it.cantidad, 0)}
              </span>
            )}
            <span className="font-semibold text-slate-800">Total: {formatMonto(totalProforma(items))}</span>
          </div>
        </div>

        <SeccionTexto
          titulo="Términos y condiciones"
          ayuda="Va después del total. Ej.: plazo de entrega, garantía, forma de pago, incluye/no incluye IGV."
          activo={opciones.notas}
          onActivo={(v) => setOpciones((prev) => ({ ...prev, notas: v }))}
        >
          <EditorTexto
            valor={nota}
            onChange={setNota}
            fuente={fuenteCss(fuente)}
            placeholder="Ej.: Tiempo de entrega 5 días hábiles. Garantía de 12 meses. Precios incluyen IGV."
          />
        </SeccionTexto>

        <div className="border-t border-slate-100 pt-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Diseño del PDF</p>
          <div className="grid grid-cols-3 gap-2">
            {DISENOS_PROFORMA.map((d) => (
              <button
                type="button"
                key={d.valor}
                onClick={() => setDiseno(d.valor)}
                className={`text-left px-3 py-2 rounded-lg border transition ${
                  diseno === d.valor
                    ? 'border-brand-600 ring-2 ring-brand-500 bg-brand-50'
                    : 'border-slate-300 hover:bg-slate-50'
                }`}
              >
                <MiniaturaDiseno diseno={d.valor} color={colorAcento} />
                <div className="text-sm font-medium text-slate-800 mt-2">{d.etiqueta}</div>
                <div className="text-xs text-slate-500">{d.descripcion}</div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">Tipo de letra</p>
              <select
                value={fuente}
                onChange={(e) => setFuente(e.target.value as FuenteProforma)}
                className={inputClase}
                style={{ fontFamily: fuenteCss(fuente) }}
              >
                {FUENTES_PROFORMA.map((f) => (
                  <option key={f.valor} value={f.valor} style={{ fontFamily: f.css }}>
                    {f.etiqueta}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1 truncate" style={{ fontFamily: fuenteCss(fuente) }}>
                Proforma N.° {numero || '001-2026'} · S/ 5,500.00
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">Color</p>
              {diseno === 'clasico' ? (
                <p className="text-xs text-slate-400 mt-2">El diseño clásico es siempre en blanco y negro.</p>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  {COLORES_ACENTO.map((c) => (
                    <button
                      type="button"
                      key={c.valor}
                      title={c.etiqueta}
                      aria-label={c.etiqueta}
                      onClick={() => setColorAcento(c.valor)}
                      className={`w-7 h-7 rounded-full transition ${
                        colorAcento === c.valor ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c.valor }}
                    />
                  ))}
                  <label
                    title="Otro color"
                    className="w-7 h-7 rounded-full border border-dashed border-slate-400 grid place-items-center text-slate-500 text-sm cursor-pointer overflow-hidden relative"
                  >
                    +
                    <input
                      type="color"
                      value={colorAcento}
                      onChange={(e) => setColorAcento(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          <p className="text-sm font-medium text-slate-700 mt-4 mb-2">Qué incluir en la proforma</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {OPCIONES_PROFORMA_ETIQUETAS.filter(([clave]) => clave !== 'introduccion' && clave !== 'notas').map(([clave, etiqueta]) => (
              <label key={clave} className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={opciones[clave]}
                  onChange={(e) => setOpciones((prev) => ({ ...prev, [clave]: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span>
                  {etiqueta}
                  {opciones[clave] && avisos?.[clave] && (
                    <span className="block text-xs text-amber-600">{avisos[clave]}</span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => setPrevisualizando(true)}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Vista previa
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700"
          >
            Guardar
          </button>
        </div>
      </form>

      {previsualizando && (
        <ProformaPreview
          proforma={{ ...armarInput(), id: initial?.id ?? 'borrador' }}
          datosEmpresa={datosEmpresa}
          textoCerrar="Volver a editar"
          onClose={() => setPrevisualizando(false)}
        />
      )}
    </Modal>
  );
}
