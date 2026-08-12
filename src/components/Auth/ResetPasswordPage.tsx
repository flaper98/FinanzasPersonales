import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const inputClase =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

export function ResetPasswordPage({ token, onVolver }: { token: string; onVolver: () => void }) {
  const { resetearPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setEnviando(true);
    try {
      await resetearPassword(token, password);
      onVolver();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 grid place-items-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 font-semibold text-lg mb-6">
          <span className="w-7 h-7 grid place-items-center rounded bg-brand-500 text-white">$</span>
          Mis Finanzas
        </div>

        <p className="text-sm text-slate-500 mb-4">Elegí una contraseña nueva para tu cuenta.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña nueva</label>
            <input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className={inputClase}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar contraseña</label>
            <input
              required
              type="password"
              minLength={8}
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              placeholder="Repetí la contraseña"
              className={inputClase}
            />
          </div>

          {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {enviando ? 'Un momento…' : 'Guardar contraseña'}
          </button>
          <button type="button" onClick={onVolver} className="w-full text-sm text-slate-500 hover:text-slate-700">
            Volver a iniciar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
