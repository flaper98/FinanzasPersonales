import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { FinanceState } from '../types';
import { todayIso } from './monthUtils';
import { guardarPendientes, marcarNotificado, obtenerEstadoNotif, type EgresoPendiente } from './notifStore';

const UMBRAL_DIAS = 3;

// La Periodic Background Sync API todavía es experimental y no está en los
// tipos de TypeScript/lib.dom — se declara acá lo mínimo que se usa.
interface PeriodicSyncManager {
  register: (tag: string, options: { minInterval: number }) => Promise<void>;
}
interface ServiceWorkerRegistrationConPeriodicSync extends ServiceWorkerRegistration {
  periodicSync?: PeriodicSyncManager;
}

export function notificacionesSoportadas(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function permisoNotificaciones(): NotificationPermission {
  return notificacionesSoportadas() ? Notification.permission : 'denied';
}

export function pedirPermisoNotificaciones(): Promise<NotificationPermission> {
  if (!notificacionesSoportadas()) return Promise.resolve('denied');
  return Notification.requestPermission();
}

export async function registrarServiceWorker(): Promise<ServiceWorkerRegistrationConPeriodicSync | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return (await navigator.serviceWorker.register('/sw.js')) as ServiceWorkerRegistrationConPeriodicSync;
  } catch {
    return null;
  }
}

/**
 * Intenta activar el chequeo en segundo plano (Periodic Background Sync).
 * Solo Chrome/Edge en Android o escritorio, y solo si el navegador decide
 * otorgarlo (depende de cuánto uses la app) — best-effort, nunca garantizado.
 */
export async function intentarActivarChequeoEnSegundoPlano(
  reg: ServiceWorkerRegistrationConPeriodicSync,
): Promise<boolean> {
  if (!reg.periodicSync) return false;
  try {
    const permisos = navigator.permissions as unknown as {
      query: (opts: { name: string }) => Promise<{ state: string }>;
    };
    const estado = await permisos.query({ name: 'periodic-background-sync' });
    if (estado.state !== 'granted') return false;
    await reg.periodicSync.register('chequeo-vencimientos', { minInterval: 12 * 60 * 60 * 1000 });
    return true;
  } catch {
    return false;
  }
}

function egresosPendientesDeTodosLosMeses(state: FinanceState): EgresoPendiente[] {
  const resultado: EgresoPendiente[] = [];
  for (const month of Object.values(state.months)) {
    for (const e of month.egresos) {
      if (e.accion === 'NO PAGADO' && !e.finalizado) {
        resultado.push({ id: e.id, detalle: e.detalle, monto: e.monto, fecha: e.fecha });
      }
    }
  }
  return resultado;
}

/** Mantiene al día el espejo en IndexedDB que usa el service worker para el chequeo en segundo plano. */
export function sincronizarPendientesParaNotificar(state: FinanceState): Promise<void> {
  return guardarPendientes(egresosPendientesDeTodosLosMeses(state));
}

function mensajeVencimiento(dias: number): string {
  if (dias < 0) return `Venció hace ${Math.abs(dias)} día(s)`;
  if (dias === 0) return 'Vence hoy';
  return `Vence en ${dias} día(s)`;
}

async function mostrarNotificacion(titulo: string, cuerpo: string, tag?: string): Promise<void> {
  if (permisoNotificaciones() !== 'granted') return;
  // `.ready` espera a que haya un service worker activo (a diferencia de getRegistration(),
  // que puede devolver uno todavía "installing" y hacer fallar showNotification).
  const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.ready : undefined;
  if (reg) {
    await reg.showNotification(titulo, { body: cuerpo, icon: '/favicon.svg', tag });
  } else {
    new Notification(titulo, { body: cuerpo });
  }
}

/** Revisa los pendientes ya guardados y notifica los que entraron en la ventana de aviso, sin repetir. */
export async function revisarYNotificarAhora(): Promise<void> {
  if (permisoNotificaciones() !== 'granted') return;
  const hoy = parseISO(todayIso());
  const { pendientes, notificados } = await obtenerEstadoNotif();
  for (const e of pendientes) {
    if (notificados.includes(e.id)) continue;
    const dias = differenceInCalendarDays(parseISO(e.fecha), hoy);
    if (dias <= UMBRAL_DIAS) {
      await mostrarNotificacion(
        'Pago próximo a vencer',
        `${e.detalle} · S/ ${e.monto.toLocaleString('es-PE')} · ${mensajeVencimiento(dias)}`,
        e.id,
      );
      await marcarNotificado(e.id);
    }
  }
}

export function mostrarNotificacionDePrueba(): Promise<void> {
  return mostrarNotificacion('Mis Finanzas', 'Así se va a ver un recordatorio de pago. ¡Todo listo!');
}
