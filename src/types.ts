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
  /** Línea de crédito total que da el banco, en soles. */
  limite: number;
  /** Deuda actual en soles, tal como aparece en el último estado de cuenta (se actualiza a mano). */
  saldoActual: number;
  /** Deuda actual en dólares (tarjetas bimoneda, que llevan un saldo en soles y otro en dólares a la vez), o 0 si no aplica. */
  saldoActualUSD: number;
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
  id: string;
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
  /** Imagen de tu firma (data URL base64), o '' si no configuraste una. Se muestra arriba de tu nombre en la proforma. */
  firma: string;
  /** Logo (data URL base64), o '' si no configuraste uno. Va en el encabezado de la proforma. */
  logo: string;
  /** Persona que firma las declaraciones juradas, tal como debe salir (ej. "RIVALDO OROCHE VASQUEZ"). Si está vacío se usa `nombre`. */
  representante: string;
  dni: string;
  /** Domicilio para las declaraciones juradas, si es distinto de `direccion`. */
  domicilio: string;
  /** Imagen de la huella digital (índice derecho), data URL base64, o ''. */
  huella: string;
}

/** Dónde va el bloque de firma (y huella) al pie de un documento de cotización. */
export type AlineacionFirma = 'izquierda' | 'centro' | 'derecha';

/**
 * Formato reutilizable de un documento que acompaña cada cotización (declaraciones
 * juradas, cartas, anexos). El cuerpo es HTML con datos variables entre llaves dobles,
 * ej. {{FECHA_LARGA}} o {{DNI}}, que se reemplazan al generar el documento.
 */
export interface PlantillaDocumento {
  id: string;
  nombre: string;
  /** Imagen de encabezado (membrete de la entidad), data URL, o ''. */
  membrete: string;
  cuerpo: string;
  firma: boolean;
  huella: boolean;
  alineacionFirma: AlineacionFirma;
  /** Líneas bajo la línea de firma, con variables (ej. "DNI N.º {{DNI}}"). HTML. */
  pieFirma: string;
  /** Si se marca sola al crear una cotización nueva. */
  incluirPorDefecto: boolean;
}

/** Una respuesta a una solicitud de cotización: los datos que cambian y qué documentos se generan. */
export interface PaqueteCotizacion {
  id: string;
  empresaId: string;
  /** Ej. "Municipalidad Distrital de Tahuania". */
  entidad: string;
  /** Ciudad para "Dado en la ciudad de ..." (ej. "TAHUANIA-BOLOGNESI"). */
  ciudad: string;
  /** N.° de la solicitud de cotización (ej. "3264"). */
  numeroSolicitud: string;
  /** ISO yyyy-MM-dd */
  fecha: string;
  /** Servicio o bien cotizado. */
  objeto: string;
  /** Proforma que acompaña la cotización (opcional): aporta el monto y sale como primera hoja. */
  proformaId: string | null;
  /** Ids de PlantillaDocumento a generar, en orden. */
  plantillaIds: string[];
}

export type NewPaqueteCotizacionInput = Omit<PaqueteCotizacion, 'id'>;

/** 'productos': ítems por cantidad × precio unitario. 'servicio': ítems por horas × tarifa por hora (mismos campos, reetiquetados). */
export type TipoProforma = 'productos' | 'servicio';

export interface ItemProforma {
  id: string;
  descripcion: string;
  /** Cantidad de unidades, u horas trabajadas si la proforma es de tipo 'servicio'. */
  cantidad: number;
  /** Precio por unidad, o tarifa por hora si la proforma es de tipo 'servicio'. */
  precioUnitario: number;
}

/** Estilo visual del PDF de la proforma. */
export type DisenoProforma = 'clasico' | 'moderno' | 'minimalista';

/** Tipografía de todo el documento (ver FUENTES_PROFORMA; se cargan desde Google Fonts en index.html). */
export type FuenteProforma = 'inter' | 'poppins' | 'montserrat' | 'lato' | 'lora' | 'merriweather';

/** Qué secciones se incluyen en el PDF de la proforma (cada una con su check en el formulario). */
export interface OpcionesProforma {
  /** Logo de la empresa en el encabezado (si está cargado en "Datos de mi empresa"). */
  logo: boolean;
  /** Dirección, teléfonos y email del emisor bajo su nombre. */
  contactoEmisor: boolean;
  /** "Atención" y "Cargo" del cliente. */
  atencionCliente: boolean;
  /** Validez en días hábiles. */
  validez: boolean;
  /** Texto de presentación antes de los ítems. */
  introduccion: boolean;
  /** Total escrito en letras ("SON: MIL ... SOLES"). */
  montoEnLetras: boolean;
  /** Términos y condiciones / notas después de los totales. */
  notas: boolean;
  /** "Forma de pago" con banco, cuenta y CCI. */
  datosBancarios: boolean;
  /** Bloque de firma al pie (imagen si hay, línea, nombre y RUC). */
  firma: boolean;
}

export interface Proforma {
  id: string;
  /** Ej. "040-2026". */
  numero: string;
  /** ISO yyyy-MM-dd */
  fecha: string;
  validezDias: number;
  tipo: TipoProforma;
  clienteNombre: string;
  clienteRuc: string;
  /** Persona de contacto a quien se dirige la proforma, ej. "Juan Pérez". */
  clienteContacto: string;
  /** Cargo de esa persona, ej. "Gerente General". */
  clienteCargo: string;
  items: ItemProforma[];
  /** Texto de presentación con formato (HTML), ej. "De nuestra consideración: ...". */
  introduccion: string;
  /** Términos y condiciones / notas con formato (HTML). La forma de pago sale de DatosEmpresa. */
  nota: string;
  /** Empresa emisora (id de FinanceState.empresas). */
  empresaId: string;
  diseno: DisenoProforma;
  fuente: FuenteProforma;
  /** Color principal del diseño, en hex (#2563eb). El diseño clásico es siempre blanco y negro. */
  colorAcento: string;
  opciones: OpcionesProforma;
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
  /** Empresas desde las que emites proformas (cada proforma guarda la suya en `empresaId`). */
  empresas: DatosEmpresa[];
  /** @deprecated Solo para leer datos guardados antes de soportar varias empresas; se migra a `empresas`. */
  datosEmpresa?: DatosEmpresa;
  presupuestosProyecto: PresupuestoProyecto[];
  plantillasDocumento: PlantillaDocumento[];
  paquetesCotizacion: PaqueteCotizacion[];
}

export type NewIngresoInput = Omit<Ingreso, 'id'>;
export type NewEgresoInput = Omit<Egreso, 'id' | 'finalizado'>;
