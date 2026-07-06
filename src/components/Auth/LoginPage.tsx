import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export function LoginPage() {
  const { iniciarSesion, registrarse } = useAuth();
  const [modo, setModo] = useState<'login' | 'registro'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      if (modo === 'login') {
        await iniciarSesion(email, password);
      } else {
        await registrarse(email, password);
      }
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

        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-5">
          {(['login', 'registro'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setModo(m);
                setError(null);
              }}
              className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                modo === m ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {enviando ? 'Un momento…' : modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
}
