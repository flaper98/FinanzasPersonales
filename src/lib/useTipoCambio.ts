import { useEffect, useState } from 'react';

interface TipoCambioResultado {
  valor: number;
  actualizado: string;
}

interface TipoCambioState {
  valor: number | null;
  actualizado: string | null;
  cargando: boolean;
  error: string | null;
}

// Caché a nivel de módulo: todas las instancias del hook comparten el mismo valor y el mismo
// fetch en vuelo, para no golpear la API una vez por cada componente que la use en pantalla.
let cache: TipoCambioResultado | null = null;
let fetchEnCurso: Promise<TipoCambioResultado> | null = null;

async function obtenerTipoCambio(): Promise<TipoCambioResultado> {
  const res = await fetch('https://open.er-api.com/v6/latest/USD');
  if (!res.ok) throw new Error(`No se pudo obtener el tipo de cambio (${res.status}).`);
  const data = await res.json();
  const valor = data?.rates?.PEN;
  if (typeof valor !== 'number') throw new Error('La respuesta no incluyó el tipo de cambio a soles.');
  return { valor, actualizado: new Date().toISOString() };
}

/**
 * Tipo de cambio USD → PEN desde una API pública gratuita (open.er-api.com), sin backend
 * propio. Es una tasa referencial que se actualiza ~diariamente, no una cotización al
 * segundo — el banco de tu tarjeta puede aplicar un tipo de cambio ligeramente distinto
 * (con su propio margen) al momento de facturar.
 *
 * `activo` evita el fetch cuando no hace falta (ej. no hay ninguna tarjeta en dólares).
 */
export function useTipoCambio(activo: boolean) {
  const [state, setState] = useState<TipoCambioState>(() => ({
    valor: cache?.valor ?? null,
    actualizado: cache?.actualizado ?? null,
    cargando: false,
    error: null,
  }));

  async function actualizar() {
    setState((s) => ({ ...s, cargando: true, error: null }));
    try {
      if (!fetchEnCurso) fetchEnCurso = obtenerTipoCambio();
      const resultado = await fetchEnCurso;
      cache = resultado;
      setState({ valor: resultado.valor, actualizado: resultado.actualizado, cargando: false, error: null });
    } catch (err) {
      setState((s) => ({
        ...s,
        cargando: false,
        error: err instanceof Error ? err.message : 'No se pudo obtener el tipo de cambio.',
      }));
    } finally {
      fetchEnCurso = null;
    }
  }

  useEffect(() => {
    if (activo && !cache) void actualizar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo]);

  return { ...state, actualizar };
}
