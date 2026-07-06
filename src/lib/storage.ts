import type { FinanceState } from '../types';

const STORAGE_KEY = 'finanzas-personales:v1';

/**
 * Lee los datos que hayan quedado guardados en este navegador de antes de
 * tener cuenta (versión sin login). Solo se usa para ofrecer importarlos a
 * la cuenta recién creada; la app ya no guarda datos nuevos acá.
 */
export function loadState(): FinanceState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.months) return null;
    return parsed as FinanceState;
  } catch {
    return null;
  }
}
