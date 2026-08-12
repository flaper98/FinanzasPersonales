import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiGet, apiPost } from '../lib/api';

interface Usuario {
  email: string;
}

interface AuthContextValue {
  usuario: Usuario | null;
  cargando: boolean;
  iniciarSesion: (email: string, password: string) => Promise<void>;
  registrarse: (email: string, password: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  pedirRecuperacion: (email: string) => Promise<void>;
  resetearPassword: (token: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    apiGet<Usuario>('/auth/me')
      .then(setUsuario)
      .catch(() => setUsuario(null))
      .finally(() => setCargando(false));
  }, []);

  async function iniciarSesion(email: string, password: string) {
    const data = await apiPost<Usuario>('/auth/login', { email, password });
    setUsuario(data);
  }

  async function registrarse(email: string, password: string) {
    const data = await apiPost<Usuario>('/auth/register', { email, password });
    setUsuario(data);
  }

  async function cerrarSesion() {
    await apiPost('/auth/logout');
    setUsuario(null);
  }

  async function pedirRecuperacion(email: string) {
    await apiPost('/auth/forgot-password', { email });
  }

  async function resetearPassword(token: string, password: string) {
    const data = await apiPost<Usuario>('/auth/reset-password', { token, password });
    setUsuario(data);
  }

  const value: AuthContextValue = {
    usuario,
    cargando,
    iniciarSesion,
    registrarse,
    cerrarSesion,
    pedirRecuperacion,
    resetearPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
