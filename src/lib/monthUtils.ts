import { addMonths, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/** Convierte una fecha a la clave de mes yyyy-MM. */
export function monthKeyOf(date: Date): string {
  return format(date, 'yyyy-MM');
}

export function monthKeyOfIso(iso: string): string {
  return monthKeyOf(parseISO(iso));
}

/** Clave del mes actual (según el reloj del dispositivo). */
export function currentMonthKey(): string {
  return monthKeyOf(new Date());
}

/** Etiqueta legible en español, ej. "Julio 2026". */
export function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  const label = format(date, 'LLLL yyyy', { locale: es });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Etiqueta corta en español, ej. "jul 2026", para ejes de gráficos. */
export function monthLabelShort(key: string): string {
  const [year, month] = key.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return format(date, 'LLL yyyy', { locale: es });
}

export function nextMonthKey(key: string): string {
  const [year, month] = key.split('-').map(Number);
  const date = addMonths(new Date(year, month - 1, 1), 1);
  return monthKeyOf(date);
}

export function previousMonthKey(key: string): string {
  const [year, month] = key.split('-').map(Number);
  const date = addMonths(new Date(year, month - 1, 1), -1);
  return monthKeyOf(date);
}

/** Compara claves de mes yyyy-MM cronológicamente. */
export function compareMonthKeys(a: string, b: string): number {
  return a.localeCompare(b);
}

export function sortedMonthKeys(keys: string[]): string[] {
  return [...keys].sort(compareMonthKeys);
}

/** Avanza una fecha ISO yyyy-MM-dd un mes, preservando el día cuando es posible. */
export function advanceIsoDateByMonth(iso: string): string {
  const date = parseISO(iso);
  return format(addMonths(date, 1), 'yyyy-MM-dd');
}

export function formatIsoDate(iso: string | null): string {
  if (!iso) return 'Definir';
  try {
    return format(parseISO(iso), 'dd/MM/yyyy');
  } catch {
    return iso;
  }
}

export function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Próxima fecha (hoy o futura) en que cae el día `dia` del mes (1-31), para
 * fechas recurrentes como el corte/pago de una tarjeta. Si el día no existe
 * en ese mes (ej. 31 en febrero), usa el último día del mes.
 */
export function proximaFechaDelMes(dia: number, desdeIso: string = todayIso()): string {
  const hoy = parseISO(desdeIso);
  const diaEnMes = (base: Date): Date => {
    const ultimoDia = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    return new Date(base.getFullYear(), base.getMonth(), Math.min(Math.max(dia, 1), ultimoDia));
  };
  let candidata = diaEnMes(hoy);
  if (candidata < hoy) candidata = diaEnMes(addMonths(hoy, 1));
  return format(candidata, 'yyyy-MM-dd');
}

/**
 * Ordena una lista por fecha ISO ascendente (más cercana primero). Los
 * elementos sin fecha ("Definir", null) quedan al final.
 */
export function ordenarPorFecha<T>(items: T[], getFecha: (item: T) => string | null): T[] {
  return [...items].sort((a, b) => {
    const fechaA = getFecha(a);
    const fechaB = getFecha(b);
    if (!fechaA && !fechaB) return 0;
    if (!fechaA) return 1;
    if (!fechaB) return -1;
    return fechaA.localeCompare(fechaB);
  });
}
