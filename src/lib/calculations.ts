import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { Cuotas, Egreso, Ingreso, MonthData } from '../types';
import { advanceIsoDateByMonth, todayIso } from './monthUtils';
import { newId } from './id';

/** Alterna Cobrado/No Cobrado para un ingreso. */
export function toggleEstadoIngreso(ingreso: Ingreso): Ingreso {
  return { ...ingreso, estado: ingreso.estado === 'COBRADO' ? 'NO COBRADO' : 'COBRADO' };
}

export function cuotasPorPagar(cuotasTotales: Cuotas, cuotaActual: Cuotas): Cuotas {
  if (cuotasTotales === 'siempre' || cuotaActual === 'siempre') return 'siempre';
  return Math.max(cuotasTotales - cuotaActual, 0);
}

export function esFinalizado(cuotasTotales: Cuotas, cuotaActual: Cuotas): boolean {
  if (cuotasTotales === 'siempre' || cuotaActual === 'siempre') return false;
  return cuotaActual >= cuotasTotales;
}

/**
 * Alterna Pagado/No Pagado. Esto es solo el registro de si ya se pagó este
 * mes: la cuota NO se mueve acá, sino al crear un mes nuevo (ver
 * `arrastrarEgresosFijos`), para que "cuota 5/10" avance a "6/10" una sola
 * vez por mes sin importar cuántas veces se alterne Pagado/No Pagado.
 */
export function toggleAccion(egreso: Egreso): Egreso {
  return { ...egreso, accion: egreso.accion === 'NO PAGADO' ? 'PAGADO' : 'NO PAGADO' };
}

export interface DashboardTotals {
  saldoInicial: number;
  totalIngresos: number;
  totalEgresos: number;
  /** Saldo inicial + ingresos totales - egresos totales (proyectado, sin importar si ya se cobraron/pagaron). */
  balanceProyectado: number;
  montoCobrado: number;
  montoPorCobrar: number;
  montoPagado: number;
  montoPendiente: number;
  /** Saldo inicial + Cobrado - Pagado: el saldo real disponible en este momento. */
  saldoReal: number;
  pctPagado: number;
  pctCobrado: number;
}

export function dashboardTotals(month: MonthData | undefined): DashboardTotals {
  const saldoInicial = month?.saldoInicial ?? 0;
  const ingresos = month?.ingresos ?? [];
  const egresos = month?.egresos ?? [];

  const totalIngresos = ingresos.reduce((sum, i) => sum + i.monto, 0);
  const totalEgresos = egresos.reduce((sum, e) => sum + e.monto, 0);

  const montoCobrado = ingresos.filter((i) => i.estado === 'COBRADO').reduce((sum, i) => sum + i.monto, 0);
  const montoPorCobrar = totalIngresos - montoCobrado;

  const montoPagado = egresos.filter((e) => e.accion === 'PAGADO').reduce((sum, e) => sum + e.monto, 0);
  const montoPendiente = totalEgresos - montoPagado;

  const pctPagado = totalEgresos > 0 ? (montoPagado / totalEgresos) * 100 : 0;
  const pctCobrado = totalIngresos > 0 ? (montoCobrado / totalIngresos) * 100 : 0;

  return {
    saldoInicial,
    totalIngresos,
    totalEgresos,
    balanceProyectado: saldoInicial + totalIngresos - totalEgresos,
    montoCobrado,
    montoPorCobrar,
    montoPagado,
    montoPendiente,
    saldoReal: saldoInicial + montoCobrado - montoPagado,
    pctPagado,
    pctCobrado,
  };
}

export interface AlertaVencimiento {
  egreso: Egreso;
  diasRestantes: number;
  vencido: boolean;
}

/** Egresos NO PAGADO que vencen en 5 días o menos (o ya vencidos), más urgentes primero. */
export function alertasVencimiento(month: MonthData | undefined, dentroDeDias = 5): AlertaVencimiento[] {
  const egresos = month?.egresos ?? [];
  const hoy = parseISO(todayIso());

  return egresos
    .filter((e) => e.accion === 'NO PAGADO')
    .map((egreso) => {
      const diasRestantes = differenceInCalendarDays(parseISO(egreso.fecha), hoy);
      return { egreso, diasRestantes, vencido: diasRestantes < 0 };
    })
    .filter((a) => a.diasRestantes <= dentroDeDias)
    .sort((a, b) => a.diasRestantes - b.diasRestantes);
}

/**
 * Arma los egresos que deben arrastrarse a un mes nuevo: solo FIJO, no
 * finalizados. La cuota actual avanza +1 acá (una sola vez por mes creado,
 * ej. 5/10 en julio pasa a 6/10 en agosto, sin importar si se marcó
 * Pagado), fecha avanzada un mes y acción reiniciada a NO PAGADO.
 */
export function arrastrarEgresosFijos(mesAnterior: MonthData | undefined): Egreso[] {
  const egresos = mesAnterior?.egresos ?? [];
  return egresos
    .filter((e) => e.tipo === 'FIJO' && !e.finalizado)
    .map((e) => {
      const cuotaActual = typeof e.cuotaActual === 'number' ? e.cuotaActual + 1 : e.cuotaActual;
      return {
        ...e,
        id: newId(),
        cuotaActual,
        fecha: advanceIsoDateByMonth(e.fecha),
        accion: 'NO PAGADO',
        finalizado: esFinalizado(e.cuotasTotales, cuotaActual),
      };
    });
}

/**
 * Arma los ingresos que deben arrastrarse a un mes nuevo: solo los marcados
 * como fijos (ej. sueldo mensual). Se copian con el mismo monto, fecha
 * avanzada un mes (si estaba definida) y estado reiniciado a NO COBRADO.
 */
export function arrastrarIngresosFijos(mesAnterior: MonthData | undefined): Ingreso[] {
  const ingresos = mesAnterior?.ingresos ?? [];
  return ingresos
    .filter((i) => i.fijo)
    .map((i) => ({
      ...i,
      id: newId(),
      fecha: i.fecha ? advanceIsoDateByMonth(i.fecha) : null,
      estado: 'NO COBRADO',
    }));
}

export function agruparMontoPorDetalle(items: Array<{ detalle: string; monto: number }>): Array<{ detalle: string; monto: number }> {
  const map = new Map<string, number>();
  for (const item of items) {
    map.set(item.detalle, (map.get(item.detalle) ?? 0) + item.monto);
  }
  return [...map.entries()]
    .map(([detalle, monto]) => ({ detalle, monto }))
    .sort((a, b) => b.monto - a.monto);
}

export function totalPorTipo(egresos: Egreso[]): { FIJO: number; 'NO FIJO': number } {
  return egresos.reduce(
    (acc, e) => {
      acc[e.tipo] += e.monto;
      return acc;
    },
    { FIJO: 0, 'NO FIJO': 0 },
  );
}

export function totalIngresos(ingresos: Ingreso[]): number {
  return ingresos.reduce((sum, i) => sum + i.monto, 0);
}

export interface AsignacionIngreso {
  ingreso: Ingreso;
  /** Solo los pendientes (NO PAGADO): una vez pagado, ya no hay nada que planificar. */
  egresosAsignados: Egreso[];
  /** Monto total asignado (pagados + pendientes), para que "disponible" refleje lo ya gastado. */
  totalAsignado: number;
  /** monto del ingreso - total asignado. Negativo si se comprometió más de lo que ese ingreso cubre. */
  disponible: number;
}

export interface ResumenPlanificador {
  asignaciones: AsignacionIngreso[];
  sinAsignar: Egreso[];
  totalSinAsignar: number;
}

/**
 * Agrupa los egresos pendientes del mes según con qué ingreso se planea
 * pagarlos, para saber cuánto de cada ingreso ya está comprometido y cuánto
 * queda libre. Los ya pagados no se muestran (no hay nada que planificar),
 * pero su monto sigue restando del disponible. Los egresos sin `ingresoId`
 * (o cuyo ingreso ya no existe) caen en "sinAsignar".
 */
export function resumenPlanificador(month: MonthData | undefined): ResumenPlanificador {
  const ingresos = month?.ingresos ?? [];
  const egresos = month?.egresos ?? [];
  const idsIngresos = new Set(ingresos.map((i) => i.id));

  const asignaciones: AsignacionIngreso[] = ingresos.map((ingreso) => {
    const todosAsignados = egresos.filter((e) => e.ingresoId === ingreso.id);
    const totalAsignado = todosAsignados.reduce((sum, e) => sum + e.monto, 0);
    const egresosAsignados = todosAsignados.filter((e) => e.accion === 'NO PAGADO');
    return { ingreso, egresosAsignados, totalAsignado, disponible: ingreso.monto - totalAsignado };
  });

  const sinAsignar = egresos.filter(
    (e) => e.accion === 'NO PAGADO' && (!e.ingresoId || !idsIngresos.has(e.ingresoId)),
  );
  const totalSinAsignar = sinAsignar.reduce((sum, e) => sum + e.monto, 0);

  return { asignaciones, sinAsignar, totalSinAsignar };
}
