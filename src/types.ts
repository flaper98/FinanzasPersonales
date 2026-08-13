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
  /** Id de la TarjetaCredito a la que se carga este egreso (en vez de pagarlo con un ingreso directo), o null. */
  tarjetaId: string | null;
  /** Id del Préstamo (en Préstamos) del que este egreso es la cuota mensual, o null si no aplica. */
  prestamoId: string | null;
}

/** Categoría genérica con un monto: se usa tanto en el presupuesto mensual como en los costos de un proyecto. */
export interface ItemPresupuesto {
  id: string;
  nombre: string;
  monto: number;
}

/** Presupuesto mensual: cuánto planeas tener disponible este mes y en qué categorías planeas repartirlo. */
export interface PresupuestoMensual {
  montoTotal: number;
  categorias: ItemPresupuesto[];
}

export interface MonthData {
  /** yyyy-MM */
  key: string;
  /** Dinero que ya tenías al empezar el mes (efectivo/cuenta), antes de cualquier ingreso o egreso de este mes. */
  saldoInicial: number;
  ingresos: Ingreso[];
  egresos: Egreso[];
  presupuesto: PresupuestoMensual;
}

export interface TarjetaCredito {
  id: string;
  /** Ej. "BCP Visa Signature", para distinguirla si hay varias. */
  nombre: string;
  /** Línea de crédito total que da el banco. */
  limite: number;
  /** Deuda actual tal como aparece en el último estado de cuenta (se actualiza a mano cuando llega uno nuevo). */
  saldoActual: number;
  /** Día del mes (1-31) en que cierra el estado de cuenta, o null si no se definió. */
  diaCorte: number | null;
  /** Día del mes (1-31) en que vence el pago, o null si no se definió. */
  diaPago: number | null;
}

export type NewTarjetaCreditoInput = Omit<TarjetaCredito, 'id'>;

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

/** Datos de tu empresa/negocio, para completar el encabezado de cada proforma automáticamente. */
export interface DatosEmpresa {
  nombre: string;
  ruc: string;
  direccion: string;
  telefono: string;
  celular: string;
  email: string;
  /** Ej. "BBVA". */
  banco: string;
  numeroCuenta: string;
  numeroCci: string;
}

export interface ItemProforma {
  id: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

export interface Proforma {
  id: string;
  /** Ej. "040-2026". */
  numero: string;
  /** ISO yyyy-MM-dd */
  fecha: string;
  validezDias: number;
  clienteNombre: string;
  clienteRuc: string;
  clienteDireccion: string;
  items: ItemProforma[];
  /** Notas adicionales, ej. condiciones especiales (la forma de pago sale de DatosEmpresa). */
  nota: string;
}

export type NewProformaInput = Omit<Proforma, 'id'>;

/** Presupuesto de un proyecto/trabajo: cuánto vas a cobrar (montoTotal) contra cuánto planeas gastar (costos), para ver la ganancia. */
export interface PresupuestoProyecto {
  id: string;
  nombre: string;
  /** Id de la Proforma de la que sale este proyecto, o null si es un proyecto libre sin proforma. */
  proformaId: string | null;
  /** Monto total a cobrar por el proyecto (se sugiere desde la proforma vinculada, pero es editable). */
  montoTotal: number;
  costos: ItemPresupuesto[];
}

export type NewPresupuestoProyectoInput = Omit<PresupuestoProyecto, 'id'>;

export interface FinanceState {
  months: Record<string, MonthData>;
  tarjetasCredito: TarjetaCredito[];
  prestamos: Prestamo[];
  proformas: Proforma[];
  datosEmpresa: DatosEmpresa;
  presupuestosProyecto: PresupuestoProyecto[];
}

export type NewIngresoInput = Omit<Ingreso, 'id'>;
export type NewEgresoInput = Omit<Egreso, 'id' | 'finalizado'>;
