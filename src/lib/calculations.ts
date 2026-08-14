import { differenceInCalendarDays, parseISO } from 'date-fns';
import type {
  Cuotas,
  Egreso,
  Ingreso,
  ItemPresupuesto,
  ItemProforma,
  MonthData,
  Prestamo,
  PresupuestoProyecto,
  Proforma,
  TarjetaCredito,
} from '../types';
import { advanceIsoDateByMonth, proximaFechaDelMes, todayIso } from './monthUtils';
import { newId } from './id';

/** Prefijo usado en los selectores de "cómo pagar" para distinguir el id de una tarjeta del id de un ingreso. */
const PREFIJO_TARJETA = 'tarjeta:';

export function valorParaTarjeta(tarjetaId: string): string {
  return `${PREFIJO_TARJETA}${tarjetaId}`;
}

/** Extrae el id de tarjeta de un valor de selector, o null si el valor no representa una tarjeta. */
export function tarjetaIdDesdeValor(valor: string): string | null {
  return valor.startsWith(PREFIJO_TARJETA) ? valor.slice(PREFIJO_TARJETA.length) : null;
}

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
  /** Egresos pendientes marcados para pagar con tarjeta de crédito (no necesitan un ingreso asignado). */
  aCargarTarjeta: Egreso[];
  totalTarjeta: number;
}

/**
 * Agrupa los egresos pendientes del mes según con qué ingreso se planea
 * pagarlos, para saber cuánto de cada ingreso ya está comprometido y cuánto
 * queda libre. Los ya pagados no se muestran (no hay nada que planificar),
 * pero su monto sigue restando del disponible. Los marcados "pagar con
 * tarjeta" van aparte (no restan de ningún ingreso todavía; se sumarán al
 * estado de cuenta de la tarjeta el próximo mes). El resto, sin `ingresoId`
 * (o cuyo ingreso ya no existe), cae en "sinAsignar".
 */
export function resumenPlanificador(month: MonthData | undefined): ResumenPlanificador {
  const ingresos = month?.ingresos ?? [];
  const egresos = month?.egresos ?? [];
  const idsIngresos = new Set(ingresos.map((i) => i.id));

  const asignaciones: AsignacionIngreso[] = ingresos.map((ingreso) => {
    const todosAsignados = egresos.filter((e) => e.ingresoId === ingreso.id && !e.tarjetaId);
    const totalAsignado = todosAsignados.reduce((sum, e) => sum + e.monto, 0);
    const egresosAsignados = todosAsignados.filter((e) => e.accion === 'NO PAGADO');
    return { ingreso, egresosAsignados, totalAsignado, disponible: ingreso.monto - totalAsignado };
  });

  const sinAsignar = egresos.filter(
    (e) => e.accion === 'NO PAGADO' && !e.tarjetaId && (!e.ingresoId || !idsIngresos.has(e.ingresoId)),
  );
  const totalSinAsignar = sinAsignar.reduce((sum, e) => sum + e.monto, 0);

  const aCargarTarjeta = egresos.filter((e) => e.tarjetaId && e.accion === 'NO PAGADO');
  const totalTarjeta = aCargarTarjeta.reduce((sum, e) => sum + e.monto, 0);

  return { asignaciones, sinAsignar, totalSinAsignar, aCargarTarjeta, totalTarjeta };
}

export interface ResumenTarjeta {
  /** `tarjeta.saldoActualUSD` convertido a soles con `tipoCambio` (0 si la tarjeta no tiene saldo en dólares). */
  saldoActualUSDenPEN: number;
  /** Egresos de este mes cargados a esta tarjeta que aún no están reflejados en saldoActual/saldoActualUSD (siempre en soles). */
  montoPorCargar: number;
  /** saldoActual + saldoActualUSDenPEN + montoPorCargar: la deuda total en soles, sumando ambas monedas. */
  deudaProyectada: number;
  /** limite - deudaProyectada: lo que te queda para seguir usando la tarjeta. Puede ser negativo si te pasaste. */
  disponible: number;
  pctUsado: number;
  /** Próxima fecha (hoy o futura) en que cierra el estado de cuenta, o null si no se configuró diaCorte. */
  proximaFechaCorte: string | null;
  /** Próxima fecha (hoy o futura) en que vence el pago, o null si no se configuró diaPago. */
  proximaFechaPago: string | null;
  /** Días hasta proximaFechaPago (0 = hoy), o null si no hay diaPago configurado. */
  diasParaPago: number | null;
}

/**
 * Combina el saldo de tarjeta que el usuario ingresa a mano (tal como
 * aparece en su último estado de cuenta) con lo que ya planeó cargar a esta
 * tarjeta este mes (egresos de `month` con `tarjetaId === tarjeta.id`) pero
 * que el banco probablemente todavía no facturó, para estimar deuda y
 * disponible. También calcula, a partir de `diaCorte`/`diaPago`, cuándo cae
 * la próxima fecha de corte/pago.
 *
 * Las tarjetas bimoneda llevan un saldo en soles (`saldoActual`) y otro en
 * dólares (`saldoActualUSD`) a la vez, no una u otra: la parte en dólares se
 * convierte a soles con `tipoCambio` (los egresos vinculados ya están en
 * soles, como el resto de la app) y se suma a la parte en soles para
 * comparar todo en la misma moneda.
 */
export function resumenTarjeta(tarjeta: TarjetaCredito, month: MonthData | undefined, tipoCambio = 1): ResumenTarjeta {
  const saldoActualUSDenPEN = tarjeta.saldoActualUSD * tipoCambio;

  const egresos = month?.egresos ?? [];
  const montoPorCargar = egresos
    .filter((e) => e.tarjetaId === tarjeta.id && e.accion === 'NO PAGADO')
    .reduce((sum, e) => sum + e.monto, 0);

  const deudaProyectada = tarjeta.saldoActual + saldoActualUSDenPEN + montoPorCargar;
  const disponible = tarjeta.limite - deudaProyectada;
  const pctUsado = tarjeta.limite > 0 ? Math.min(Math.max((deudaProyectada / tarjeta.limite) * 100, 0), 100) : 0;

  const proximaFechaCorte = tarjeta.diaCorte ? proximaFechaDelMes(tarjeta.diaCorte) : null;
  const proximaFechaPago = tarjeta.diaPago ? proximaFechaDelMes(tarjeta.diaPago) : null;
  const diasParaPago = proximaFechaPago
    ? differenceInCalendarDays(parseISO(proximaFechaPago), parseISO(todayIso()))
    : null;

  return {
    saldoActualUSDenPEN,
    montoPorCargar,
    deudaProyectada,
    disponible,
    pctUsado,
    proximaFechaCorte,
    proximaFechaPago,
    diasParaPago,
  };
}

export interface ResumenPrestamo {
  cuotasRestantes: number;
  /** saldoCapital + interesPendiente: lo que falta pagar en total si se sigue el cronograma tal cual. */
  totalPendiente: number;
  progresoPct: number;
  /** interesPendiente / saldoCapital: cuánto interés queda por cada sol de capital pendiente (aprox., mientras más alto, más conviene abonar antes). */
  ratioInteres: number;
}

/**
 * Aplica (o revierte) el pago de una cuota a un préstamo vinculado: reparte
 * `monto` entre capital e interés en proporción a `interesPendiente /
 * saldoCapital` (la misma proporción de todo el saldo pendiente, ya que no
 * tenemos el desglose exacto de cada cuota del banco) y avanza (o retrocede)
 * `cuotaActual` en 1. `direccion` es 1 al marcar Pagado y -1 al revertir a
 * No Pagado — como el reparto es proporcional, revertir reconstruye
 * exactamente los montos originales (la proporción no cambia con pagos).
 */
export function aplicarPagoAPrestamo(prestamo: Prestamo, monto: number, direccion: 1 | -1): Prestamo {
  const ratio = prestamo.saldoCapital > 0 ? prestamo.interesPendiente / prestamo.saldoCapital : 0;
  const capitalPortion = monto / (1 + ratio);
  const interesPortion = monto - capitalPortion;
  return {
    ...prestamo,
    saldoCapital: Math.max(prestamo.saldoCapital - direccion * capitalPortion, 0),
    interesPendiente: Math.max(prestamo.interesPendiente - direccion * interesPortion, 0),
    cuotaActual: Math.min(Math.max(prestamo.cuotaActual + direccion, 0), prestamo.cuotasTotales),
  };
}

export function resumenPrestamo(prestamo: Prestamo): ResumenPrestamo {
  const cuotasRestantes = Math.max(prestamo.cuotasTotales - prestamo.cuotaActual, 0);
  const totalPendiente = prestamo.saldoCapital + prestamo.interesPendiente;
  const progresoPct =
    prestamo.cuotasTotales > 0 ? Math.min((prestamo.cuotaActual / prestamo.cuotasTotales) * 100, 100) : 0;
  const ratioInteres = prestamo.saldoCapital > 0 ? prestamo.interesPendiente / prestamo.saldoCapital : 0;
  return { cuotasRestantes, totalPendiente, progresoPct, ratioInteres };
}

export interface SugerenciaAbono {
  ingreso: Ingreso;
  /** Lo que le sobra a este ingreso tras cubrir todo lo que ya tiene asignado en el Planificador. */
  disponible: number;
}

export interface AnalisisAbonoCapital {
  sugerencias: SugerenciaAbono[];
  totalDisponible: number;
  /** Estimado de interés que te ahorrarías si aplicas `totalDisponible` como abono extra a capital (aprox., según la proporción interés/capital pendiente del cronograma). */
  ahorroEstimado: number;
}

/**
 * Mini "analista": mira qué ingresos del mes, después de cubrir todo lo que
 * ya tienen asignado en el Planificador, todavía tienen plata libre — esa
 * es la que conviene destinar a un abono extraordinario a capital del
 * préstamo (reduce cuotas/interés futuro en vez de solo pagar la cuota
 * normal). El ahorro es una estimación gruesa basada en la proporción
 * interés/capital del cronograma, no un cálculo exacto del banco.
 */
export function analisisAbonoCapital(month: MonthData | undefined, prestamo: Prestamo | undefined): AnalisisAbonoCapital {
  if (!prestamo || prestamo.saldoCapital <= 0) {
    return { sugerencias: [], totalDisponible: 0, ahorroEstimado: 0 };
  }

  const { asignaciones } = resumenPlanificador(month);
  const sugerencias = asignaciones
    .filter((a) => a.disponible > 0)
    .map((a) => ({ ingreso: a.ingreso, disponible: a.disponible }))
    .sort((a, b) => b.disponible - a.disponible);

  const totalDisponible = sugerencias.reduce((sum, s) => sum + s.disponible, 0);
  const { ratioInteres } = resumenPrestamo(prestamo);
  const abonoEfectivo = Math.min(totalDisponible, prestamo.saldoCapital);
  const ahorroEstimado = abonoEfectivo * ratioInteres;

  return { sugerencias, totalDisponible, ahorroEstimado };
}

function cuotaFrancesa(capital: number, tasaMensual: number, cuotas: number): number {
  if (cuotas <= 0) return 0;
  if (tasaMensual <= 0) return capital / cuotas;
  return (capital * tasaMensual) / (1 - Math.pow(1 + tasaMensual, -cuotas));
}

/**
 * Encuentra, por bisección, la tasa mensual efectiva que hace que un
 * préstamo de `capital` a `cuotas` meses tenga exactamente `cuotaMensual`
 * (sistema francés). Se usa en vez de pedirle la tasa al usuario porque el
 * TCEA que aparece en el cronograma del banco incluye seguros/comisiones y
 * no coincide con la tasa mensual "pura" que hace cuadrar cuota/capital/plazo.
 */
function tasaMensualImplicita(capital: number, cuotaMensual: number, cuotas: number): number {
  if (capital <= 0 || cuotaMensual <= 0 || cuotas <= 0) return 0;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (cuotaFrancesa(capital, mid, cuotas) > cuotaMensual) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

export interface CuotaSimulada {
  numero: number;
  capital: number;
  interes: number;
  cuota: number;
  saldo: number;
}

/** Genera el cronograma cuota a cuota de pagar `capitalInicial` a `tasaMensual` con una cuota fija de `cuotaFija`. */
function generarCronograma(capitalInicial: number, tasaMensual: number, cuotaFija: number): CuotaSimulada[] {
  const cronograma: CuotaSimulada[] = [];
  let saldo = capitalInicial;
  let numero = 0;
  const maxCuotas = 600; // 50 años, tope de seguridad ante datos inconsistentes
  while (saldo > 0.01 && numero < maxCuotas) {
    numero++;
    const interes = saldo * tasaMensual;
    let capital = cuotaFija - interes;
    let cuota = cuotaFija;
    if (capital >= saldo) {
      capital = saldo;
      cuota = saldo + interes;
    }
    saldo = Math.max(saldo - capital, 0);
    cronograma.push({ numero, capital, interes, cuota, saldo });
  }
  return cronograma;
}

export interface SimulacionAbono {
  modalidad: 'reducir_cuota' | 'reducir_plazo';
  capitalTrasAbono: number;
  cronogramaOriginal: CuotaSimulada[];
  cronogramaNuevo: CuotaSimulada[];
  interesOriginal: number;
  interesNuevo: number;
  ahorroInteres: number;
  cuotasOriginal: number;
  cuotasNuevo: number;
  /** Solo relevante con modalidad 'reducir_cuota': la cuota mensual nueva (menor a la actual). */
  cuotaMensualNueva: number;
}

/**
 * Simula qué pasa si, además de la cuota normal, se hace un abono
 * extraordinario a capital de `montoAbono`. Deriva la tasa mensual real del
 * cronograma vigente (ver `tasaMensualImplicita`) y recalcula el resto del
 * préstamo con matemática de amortización real (sistema francés), no una
 * estimación proporcional.
 */
export function simularAbonoCapital(
  prestamo: Prestamo,
  montoAbono: number,
  modalidad: 'reducir_cuota' | 'reducir_plazo',
): SimulacionAbono | null {
  const cuotasRestantes = Math.max(prestamo.cuotasTotales - prestamo.cuotaActual, 0);
  if (prestamo.saldoCapital <= 0 || cuotasRestantes <= 0 || montoAbono <= 0) return null;

  const tasaMensual = tasaMensualImplicita(prestamo.saldoCapital, prestamo.cuotaMensual, cuotasRestantes);
  const cronogramaOriginal = generarCronograma(prestamo.saldoCapital, tasaMensual, prestamo.cuotaMensual);
  const interesOriginal = cronogramaOriginal.reduce((sum, c) => sum + c.interes, 0);

  const abonoEfectivo = Math.min(montoAbono, prestamo.saldoCapital);
  const capitalTrasAbono = Math.max(prestamo.saldoCapital - abonoEfectivo, 0);

  let cronogramaNuevo: CuotaSimulada[] = [];
  let cuotaMensualNueva = prestamo.cuotaMensual;

  if (capitalTrasAbono > 0) {
    if (modalidad === 'reducir_plazo') {
      cronogramaNuevo = generarCronograma(capitalTrasAbono, tasaMensual, prestamo.cuotaMensual);
    } else {
      cuotaMensualNueva = cuotaFrancesa(capitalTrasAbono, tasaMensual, cuotasRestantes);
      cronogramaNuevo = generarCronograma(capitalTrasAbono, tasaMensual, cuotaMensualNueva);
    }
  }

  const interesNuevo = cronogramaNuevo.reduce((sum, c) => sum + c.interes, 0);

  return {
    modalidad,
    capitalTrasAbono,
    cronogramaOriginal,
    cronogramaNuevo,
    interesOriginal,
    interesNuevo,
    ahorroInteres: interesOriginal - interesNuevo,
    cuotasOriginal: cronogramaOriginal.length,
    cuotasNuevo: cronogramaNuevo.length,
    cuotaMensualNueva,
  };
}

export function totalItemProforma(item: ItemProforma): number {
  return item.cantidad * item.precioUnitario;
}

export function totalProforma(items: ItemProforma[]): number {
  return items.reduce((sum, i) => sum + totalItemProforma(i), 0);
}

/**
 * Sugiere el siguiente número correlativo-año a partir de las proformas ya
 * guardadas de este año (ej. si la última fue "040-2026", sugiere
 * "041-2026"). Si no hay ninguna todavía este año, empieza en "001-{año}".
 */
export function siguienteNumeroProforma(proformas: Proforma[]): string {
  const anioActual = new Date().getFullYear();
  let maxCorrelativo = 0;
  for (const p of proformas) {
    const match = p.numero.match(/^(\d+)-(\d{4})$/);
    if (match && Number(match[2]) === anioActual) {
      maxCorrelativo = Math.max(maxCorrelativo, Number(match[1]));
    }
  }
  return `${(maxCorrelativo + 1).toString().padStart(3, '0')}-${anioActual}`;
}

export function totalItemsPresupuesto(items: ItemPresupuesto[]): number {
  return items.reduce((sum, i) => sum + i.monto, 0);
}

export interface ResumenPresupuestoMensual {
  montoTotal: number;
  categorias: ItemPresupuesto[];
  totalAsignado: number;
  /** montoTotal - totalAsignado: lo que todavía no repartiste en ninguna categoría (tu "ganancia"/sobrante si no lo asignas a nada). */
  disponible: number;
}

export function resumenPresupuestoMensual(month: MonthData | undefined): ResumenPresupuestoMensual {
  const montoTotal = month?.presupuesto?.montoTotal ?? 0;
  const categorias = month?.presupuesto?.categorias ?? [];
  const totalAsignado = totalItemsPresupuesto(categorias);
  return { montoTotal, categorias, totalAsignado, disponible: montoTotal - totalAsignado };
}

/** Ganancia de un proyecto: lo que vas a cobrar menos lo que planeas gastar en costos. */
export function gananciaProyecto(proyecto: PresupuestoProyecto): number {
  return proyecto.montoTotal - totalItemsPresupuesto(proyecto.costos);
}
