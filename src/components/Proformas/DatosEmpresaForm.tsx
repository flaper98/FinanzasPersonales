import { useState } from 'react';
import type { DatosEmpresa } from '../../types';
import { Modal } from '../common/Modal';

const inputClase =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

/** Lee un archivo de imagen y lo devuelve como data URL PNG, redimensionado para no guardar imágenes gigantes en la cuenta. */
function redimensionarImagen(file: File, maxAncho: number, maxAlto: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => {
      const img = new Image();
      img.onload = () => {
        const escala = Math.min(1, maxAncho / img.width, maxAlto / img.height);
        const ancho = Math.round(img.width * escala);
        const alto = Math.round(img.height * escala);
        const canvas = document.createElement('canvas');
        canvas.width = ancho;
        canvas.height = alto;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo procesar la imagen.'));
          return;
        }
        ctx.drawImage(img, 0, 0, ancho, alto);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('El archivo no es una imagen válida.'));
      img.src = lector.result as string;
    };
    lector.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    lector.readAsDataURL(file);
  });
}

/** Subir / cambiar / quitar una imagen (logo o firma), con vista previa. */
function CampoImagen({
  titulo,
  ayuda,
  nombre,
  valor,
  onChange,
  maxAncho,
  maxAlto,
}: {
  titulo: string;
  ayuda: string;
  /** "logo" o "firma", para los textos de los botones. */
  nombre: string;
  valor: string;
  onChange: (dataUrl: string) => void;
  maxAncho: number;
  maxAlto: number;
}) {
  const [error, setError] = useState<string | null>(null);

  async function handleArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setError(null);
      onChange(await redimensionarImagen(file, maxAncho, maxAlto));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la imagen.');
    }
  }

  return (
    <div className="border-t border-slate-100 pt-4">
      <p className="text-sm font-medium text-slate-700 mb-1">{titulo}</p>
      <p className="text-xs text-slate-400 mb-2">{ayuda}</p>
      {valor && (
        <div className="mb-2 inline-block border border-slate-200 rounded-lg p-2 bg-slate-50">
          <img src={valor} alt={nombre} className="h-16 object-contain" />
        </div>
      )}
      <div className="flex items-center gap-3">
        <label className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer">
          {valor ? `Cambiar ${nombre}` : `Subir ${nombre}`}
          <input type="file" accept="image/*" onChange={handleArchivo} className="hidden" />
        </label>
        {valor && (
          <button type="button" onClick={() => onChange('')} className="text-xs font-medium text-rose-600 hover:underline">
            Quitar {nombre}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
    </div>
  );
}

export function DatosEmpresaForm({
  initial,
  onSubmit,
  onClose,
}: {
  initial: DatosEmpresa;
  onSubmit: (input: DatosEmpresa) => void;
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState(initial.nombre);
  const [ruc, setRuc] = useState(initial.ruc);
  const [direccion, setDireccion] = useState(initial.direccion);
  const [telefono, setTelefono] = useState(initial.telefono);
  const [celular, setCelular] = useState(initial.celular);
  const [email, setEmail] = useState(initial.email);
  const [banco, setBanco] = useState(initial.banco);
  const [numeroCuenta, setNumeroCuenta] = useState(initial.numeroCuenta);
  const [numeroCci, setNumeroCci] = useState(initial.numeroCci);
  const [firma, setFirma] = useState(initial.firma);
  const [logo, setLogo] = useState(initial.logo);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      nombre: nombre.trim(),
      ruc: ruc.trim(),
      direccion: direccion.trim(),
      telefono: telefono.trim(),
      celular: celular.trim(),
      email: email.trim(),
      banco: banco.trim(),
      numeroCuenta: numeroCuenta.trim(),
      numeroCci: numeroCci.trim(),
      firma,
      logo,
    });
    onClose();
  }

  return (
    <Modal title="Datos de mi empresa" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-slate-400">
          Aparecen como remitente en el encabezado de cada proforma y en la sección de forma de pago.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre / Razón social</label>
            <input required value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClase} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">RUC</label>
            <input value={ruc} onChange={(e) => setRuc(e.target.value)} className={inputClase} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
          <input value={direccion} onChange={(e) => setDireccion(e.target.value)} className={inputClase} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} className={inputClase} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Celular / RPM</label>
            <input value={celular} onChange={(e) => setCelular(e.target.value)} className={inputClase} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClase} />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Cuenta para pagos (opcional)</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Banco</label>
              <input value={banco} onChange={(e) => setBanco(e.target.value)} placeholder="BBVA" className={inputClase} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Nro. de cuenta</label>
              <input value={numeroCuenta} onChange={(e) => setNumeroCuenta(e.target.value)} className={inputClase} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">CCI</label>
              <input value={numeroCci} onChange={(e) => setNumeroCci(e.target.value)} className={inputClase} />
            </div>
          </div>
        </div>

        <CampoImagen
          titulo="Logo (opcional)"
          ayuda="Va en el encabezado de la proforma, junto a tu nombre. Idealmente con fondo blanco o transparente."
          nombre="logo"
          valor={logo}
          onChange={setLogo}
          maxAncho={600}
          maxAlto={240}
        />

        <CampoImagen
          titulo="Firma (opcional)"
          ayuda="Se muestra arriba de tu nombre, al final de cada proforma. Sube una foto o escaneo de tu firma, idealmente con fondo blanco o transparente."
          nombre="firma"
          valor={firma}
          onChange={setFirma}
          maxAncho={480}
          maxAlto={200}
        />

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700"
          >
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
}
