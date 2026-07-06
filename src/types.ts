export type TipoEgreso = 'FIJO' | 'NO FIJO';
export type Accion = 'PAGADO' | 'NO PAGADO';
export type EstadoIngreso = 'COBRADO' | 'NO COBRADO';
export type Cuotas = number | 'siempre';

export interface Ingreso {
  id: string;
  detalle: string;
  monto: number;
  /** ISO yyyy-MM-dd, o null si la fecha aún no está definida ("Definir"). */
  fecha: string | null;
  /** Si es fijo (ej. sueldo mensual), se arrastra automáticamente al crear un nuevo mes. */
  fijo: boolean;
  estado: EstadoIngreso;
}

export interface Egreso {
  id: string;
  detalle: string;
  monto: number;
  /** ISO yyyy-MM-dd */
  fecha: string;
  tipo: TipoEgreso;
  cuotasTotales: Cuotas;
  cuotaActual: Cuotas;
  accion: Accion;
  /** true cuando cuotaActual alcanzó cuotasTotales: ya no se arrastra al mes siguiente. */
  finalizado: boolean;
  /** Id del Ingreso (del mismo mes) con el que se planea pagar este egreso, o null si no está asignado. */
  ingresoId: string | null;
  /** Si se va a pagar cargándolo a la tarjeta de crédito (en vez de con un ingreso directo). */
  pagoConTarjeta: boolean;
}

export interface MonthData {
  /** yyyy-MM */
  key: string;
  /** Dinero que ya tenías al empezar el mes (efectivo/cuenta), antes de cualquier ingreso o egreso de este mes. */
  saldoInicial: number;
  ingresos: Ingreso[];
  egresos: Egreso[];
}

export interface TarjetaCredito {
  /** Línea de crédito total que da el banco. */
  limite: number;
  /** Deuda actual tal como aparece en el último estado de cuenta (se actualiza a mano cuando llega uno nuevo). */
  saldoActual: number;
}

/** Préstamo a cuotas fijas (ej. crédito de un banco/financiera), tal como aparece en su cronograma de pagos. */
export interface Prestamo {
  id: string;
  /** Ej. "MiBanco". */
  entidad: string;
  /** Descripción libre, ej. "Préstamo capital de trabajo". */
  detalle: string;
  cuotaMensual: number;
  cuotasTotales: number;
  /** Cuotas ya pagadas hasta el cronograma vigente. */
  cuotaActual: number;
  /** Capital pendiente, tal como en el cronograma ("Saldo Prest"). Se actualiza a mano con cada estado de cuenta. */
  saldoCapital: number;
  /** Interés total pendiente si se sigue el cronograma tal cual, sin pagos adelantados. */
  interesPendiente: number;
  /** T.C.E.A. informativa, en %. */
  tasaTCEA: number;
}

export type NewPrestamoInput = Omit<Prestamo, 'id'>;

export interface FinanceState {
  months: Record<string, MonthData>;
  tarjetaCredito: TarjetaCredito;
  prestamos: Prestamo[];
}

export type NewIngresoInput = Omit<Ingreso, 'id'>;
export type NewEgresoInput = Omit<Egreso, 'id' | 'finalizado'>;
