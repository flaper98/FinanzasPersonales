import { useState } from 'react';
import type { DatosEmpresa } from '../../types';
import { Modal } from '../common/Modal';

const inputClase =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

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
