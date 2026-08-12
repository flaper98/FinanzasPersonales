import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const inputClase =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

function Marca() {
  return (
    <div className="flex items-center gap-2 font-semibold text-lg mb-6">
      <span className="w-7 h-7 grid place-items-center rounded bg-brand-500 text-white">$</span>
      Mis Finanzas
    </div>
  );
}

function RecuperarForm({ onVolver }: { onVolver: () => void }) {
  const { pedirRecuperacion } = useAuth();
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await pedirRecuperacion(email);
      setEnviado(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div>
        <p className="text-sm text-slate-600">
          Si <strong>{email}</strong> tiene una cuenta, te enviamos un correo con un link para elegir una contraseña
          nueva. Revisá también la carpeta de spam.
        </p>
        <button
          type="button"
          onClick={onVolver}
          className="mt-4 w-full px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700"
        >
          Volver a iniciar sesión
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-slate-500">Ingresá tu correo y te mandamos un link para elegir una contraseña nueva.</p>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Correo</label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tucorreo@ejemplo.com"
          className={inputClase}
        />
      </div>

      {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {enviando ? 'Un momento…' : 'Enviar link'}
      </button>
      <button
        type="button"
        onClick={onVolver}
        className="w-full text-sm text-slate-500 hover:text-slate-700"
      >
        Volver a iniciar sesión
      </button>
    </form>
  );
}

export function LoginPage() {
  const { iniciarSesion, registrarse } = useAuth();
  const [modo, setModo] = useState<'login' | 'registro' | 'recuperar'>('login');
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
      } else if (modo === 'registro') {
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
        <Marca />

        {modo === 'recuperar' ? (
          <RecuperarForm onVolver={() => setModo('login')} />
        ) : (
          <>
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
                  className={inputClase}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700">Contraseña</label>
                  {modo === 'login' && (
                    <button
                      type="button"
                      onClick={() => setModo('recuperar')}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
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

              {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}

              <button
                type="submit"
                disabled={enviando}
                className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {enviando ? 'Un momento…' : modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
