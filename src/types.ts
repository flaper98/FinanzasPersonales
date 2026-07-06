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
}

export interface MonthData {
  /** yyyy-MM */
  key: string;
  /** Dinero que ya tenías al empezar el mes (efectivo/cuenta), antes de cualquier ingreso o egreso de este mes. */
  saldoInicial: number;
  ingresos: Ingreso[];
  egresos: Egreso[];
}

export interface FinanceState {
  months: Record<string, MonthData>;
}

export type NewIngresoInput = Omit<Ingreso, 'id'>;
export type NewEgresoInput = Omit<Egreso, 'id' | 'finalizado'>;
