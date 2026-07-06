import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type {
  Accion,
  Egreso,
  FinanceState,
  Ingreso,
  MonthData,
  NewEgresoInput,
  NewIngresoInput,
  NewPrestamoInput,
  Prestamo,
  TarjetaCredito,
} from '../types';
import { loadState } from '../lib/storage';
import { apiGet, apiPut } from '../lib/api';
import { newId } from '../lib/id';
import {
  toggleAccion,
  toggleEstadoIngreso,
  esFinalizado,
  arrastrarEgresosFijos,
  arrastrarIngresosFijos,
  dashboardTotals,
  aplicarPagoAPrestamo,
  TARJETA_CREDITO,
} from '../lib/calculations';
import { currentMonthKey, nextMonthKey, sortedMonthKeys } from '../lib/monthUtils';
import { normalizarDetalle } from '../lib/text';

interface FinanceContextValue {
  state: FinanceState;
  monthKeys: string[];
  selectedMonthKey: string;
  selectedMonth: MonthData | undefined;
  cargando: boolean;
  errorCarga: string | null;
  errorGuardado: string | null;
  migracionDisponible: FinanceState | null;
  confirmarMigracion: () => void;
  descartarMigracion: () => void;
  setSelectedMonthKey: (key: string) => void;
  crearMesSiguiente: () => void;
  agregarIngreso: (input: NewIngresoInput) => void;
  actualizarIngreso: (id: string, input: NewIngresoInput) => void;
  eliminarIngreso: (id: string) => void;
  agregarEgreso: (input: NewEgresoInput) => void;
  actualizarEgreso: (id: string, input: NewEgresoInput) => void;
  eliminarEgreso: (id: string) => void;
  alternarPagado: (id: string) => void;
  alternarCobrado: (id: string) => void;
  actualizarSaldoInicial: (monto: number) => void;
  actualizarTarjetaCredito: (campo: keyof TarjetaCredito, valor: number) => void;
  agregarPrestamo: (input: NewPrestamoInput) => void;
  actualizarPrestamo: (id: string, input: NewPrestamoInput) => void;
  eliminarPrestamo: (id: string) => void;
  asignarFuentePago: (egresoId: string, ingresoId: string | null) => void;
  reemplazarEstado: (nuevo: FinanceState) => void;
  importarFilas: (ingresos: NewIngresoInput[], egresos: NewEgresoInput[]) => void;
  vaciarMes: () => void;
  eliminarMes: () => void;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

/**
 * Normaliza el detalle de todo lo ya guardado (para que datos antiguos se
 * vean consistentes) y rellena `saldoInicial` en meses guardados antes de
 * que existiera ese campo.
 */
function normalizarDetallesEstado(state: FinanceState): FinanceState {
  const months: FinanceState['months'] = {};
  for (const [key, month] of Object.entries(state.months)) {
    months[key] = {
      ...month,
      saldoInicial: month.saldoInicial ?? 0,
      ingresos: month.ingresos.map((i) => ({ ...i, detalle: normalizarDetalle(i.detalle) })),
      egresos: month.egresos.map((e) => ({
        ...e,
        detalle: normalizarDetalle(e.detalle),
        prestamoId: e.prestamoId ?? null,
      })),
    };
  }
  return {
    months,
    tarjetaCredito: state.tarjetaCredito ?? { limite: 0, saldoActual: 0 },
    prestamos: state.prestamos ?? [],
  };
}

/**
 * Cuando un egreso vinculado a un préstamo (`prestamoId`) cambia de accion,
 * refleja ese pago (o su reversa) en el saldo del préstamo. No hace nada si
 * el egreso no está vinculado o si la accion no cambió.
 */
function ajustarPrestamosPorAccion(prestamos: Prestamo[], egresoAnterior: Egreso, nuevaAccion: Accion): Prestamo[] {
  if (!egresoAnterior.prestamoId || egresoAnterior.accion === nuevaAccion) return prestamos;
  const direccion = nuevaAccion === 'PAGADO' ? 1 : -1;
  return prestamos.map((p) =>
    p.id === egresoAnterior.prestamoId ? aplicarPagoAPrestamo(p, egresoAnterior.monto, direccion) : p,
  );
}

function ensureMonth(state: FinanceState, key: string): FinanceState {
  if (state.months[key]) return state;
  return {
    ...state,
    months: {
      ...state.months,
      [key]: { key, saldoInicial: 0, ingresos: [], egresos: [] },
    },
  };
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FinanceState>({
    months: {},
    tarjetaCredito: { limite: 0, saldoActual: 0 },
    prestamos: [],
  });
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(currentMonthKey());
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);
  const [migracionDisponible, setMigracionDisponible] = useState<FinanceState | null>(null);

  // Carga los datos de la cuenta desde el servidor al montar.
  useEffect(() => {
    let cancelado = false;
    apiGet<FinanceState>('/finance')
      .then((data) => {
        if (cancelado) return;
        const normalizado = normalizarDetallesEstado(data);
        setState(normalizado);
        const keys = sortedMonthKeys(Object.keys(normalizado.months));
        setSelectedMonthKey(keys.length > 0 ? keys[keys.length - 1] : currentMonthKey());

        // Si la cuenta está vacía y hay datos de una sesión anterior sin cuenta (localStorage), ofrece importarlos.
        if (keys.length === 0) {
          const local = loadState();
          if (local && Object.keys(local.months).length > 0) {
            setMigracionDisponible(normalizarDetallesEstado(local));
          }
        }
      })
      .catch((err) => {
        if (!cancelado) setErrorCarga(err instanceof Error ? err.message : 'No se pudo cargar tu información.');
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  // Guarda en el servidor (con un pequeño debounce) cada vez que cambian los datos, una vez terminada la carga inicial.
  useEffect(() => {
    if (cargando) return;
    const timeout = window.setTimeout(() => {
      apiPut('/finance', state)
        .then(() => setErrorGuardado(null))
        .catch((err) => setErrorGuardado(err instanceof Error ? err.message : 'No se pudo guardar en el servidor.'));
    }, 800);
    return () => window.clearTimeout(timeout);
  }, [state, cargando]);

  const monthKeys = useMemo(() => sortedMonthKeys(Object.keys(state.months)), [state.months]);

  useEffect(() => {
    if (!monthKeys.includes(selectedMonthKey) && monthKeys.length > 0) {
      setSelectedMonthKey(monthKeys[monthKeys.length - 1]);
    }
  }, [monthKeys, selectedMonthKey]);

  const selectedMonth = state.months[selectedMonthKey];

  function updateMonth(key: string, updater: (month: MonthData) => MonthData) {
    setState((prev) => {
      const withMonth = ensureMonth(prev, key);
      const month = withMonth.months[key];
      return {
        ...withMonth,
        months: {
          ...withMonth.months,
          [key]: updater(month),
        },
      };
    });
  }

  function confirmarMigracion() {
    if (!migracionDisponible) return;
    setState(migracionDisponible);
    const keys = sortedMonthKeys(Object.keys(migracionDisponible.months));
    setSelectedMonthKey(keys.length > 0 ? keys[keys.length - 1] : currentMonthKey());
    setMigracionDisponible(null);
  }

  function descartarMigracion() {
    setMigracionDisponible(null);
  }

  function crearMesSiguiente() {
    const keys = sortedMonthKeys(Object.keys(state.months));
    const ultimaClave = keys[keys.length - 1] ?? currentMonthKey();
    const nuevaClave = nextMonthKey(ultimaClave);
    if (state.months[nuevaClave]) {
      setSelectedMonthKey(nuevaClave);
      return;
    }
    const mesAnterior = state.months[ultimaClave];
    const ingresosFijosAnteriores = mesAnterior?.ingresos.filter((i) => i.fijo) ?? [];
    const ingresosArrastrados = arrastrarIngresosFijos(mesAnterior);
    const mapaIngresoId = new Map(ingresosFijosAnteriores.map((viejo, idx) => [viejo.id, ingresosArrastrados[idx].id]));
    const egresosArrastrados = arrastrarEgresosFijos(mesAnterior).map((e) => ({
      ...e,
      ingresoId: e.ingresoId && mapaIngresoId.has(e.ingresoId) ? mapaIngresoId.get(e.ingresoId)! : null,
    }));
    // El saldo con el que termina el mes anterior (saldo inicial + cobrado - pagado) pasa a ser el punto de partida del nuevo mes.
    const saldoInicial = dashboardTotals(mesAnterior).saldoReal;
    setState((prev) => ({
      ...prev,
      months: {
        ...prev.months,
        [nuevaClave]: { key: nuevaClave, saldoInicial, ingresos: ingresosArrastrados, egresos: egresosArrastrados },
      },
    }));
    setSelectedMonthKey(nuevaClave);
  }

  function agregarIngreso(input: NewIngresoInput) {
    updateMonth(selectedMonthKey, (month) => ({
      ...month,
      ingresos: [...month.ingresos, { ...input, detalle: normalizarDetalle(input.detalle), id: newId() }],
    }));
  }

  function actualizarIngreso(id: string, input: NewIngresoInput) {
    updateMonth(selectedMonthKey, (month) => ({
      ...month,
      ingresos: month.ingresos.map((i) =>
        i.id === id ? { ...i, ...input, detalle: normalizarDetalle(input.detalle) } : i,
      ),
    }));
  }

  function eliminarIngreso(id: string) {
    updateMonth(selectedMonthKey, (month) => ({
      ...month,
      ingresos: month.ingresos.filter((i) => i.id !== id),
      egresos: month.egresos.map((e) => (e.ingresoId === id ? { ...e, ingresoId: null } : e)),
    }));
  }

  function agregarEgreso(input: NewEgresoInput) {
    updateMonth(selectedMonthKey, (month) => ({
      ...month,
      egresos: [
        ...month.egresos,
        {
          ...input,
          detalle: normalizarDetalle(input.detalle),
          id: newId(),
          finalizado: esFinalizado(input.cuotasTotales, input.cuotaActual),
        },
      ],
    }));
  }

  function actualizarEgreso(id: string, input: NewEgresoInput) {
    setState((prev) => {
      const month = prev.months[selectedMonthKey];
      if (!month) return prev;
      const anterior = month.egresos.find((e) => e.id === id);
      if (!anterior) return prev;

      const egresos = month.egresos.map((e) =>
        e.id === id
          ? {
              ...e,
              ...input,
              detalle: normalizarDetalle(input.detalle),
              finalizado: esFinalizado(input.cuotasTotales, input.cuotaActual),
            }
          : e,
      );

      return {
        ...prev,
        months: { ...prev.months, [selectedMonthKey]: { ...month, egresos } },
        prestamos: ajustarPrestamosPorAccion(prev.prestamos, anterior, input.accion),
      };
    });
  }

  function eliminarEgreso(id: string) {
    updateMonth(selectedMonthKey, (month) => ({
      ...month,
      egresos: month.egresos.filter((e) => e.id !== id),
    }));
  }

  function alternarPagado(id: string) {
    setState((prev) => {
      const month = prev.months[selectedMonthKey];
      if (!month) return prev;
      const anterior = month.egresos.find((e) => e.id === id);
      if (!anterior) return prev;
      const actualizado = toggleAccion(anterior);

      return {
        ...prev,
        months: {
          ...prev.months,
          [selectedMonthKey]: {
            ...month,
            egresos: month.egresos.map((e) => (e.id === id ? actualizado : e)),
          },
        },
        prestamos: ajustarPrestamosPorAccion(prev.prestamos, anterior, actualizado.accion),
      };
    });
  }

  function alternarCobrado(id: string) {
    updateMonth(selectedMonthKey, (month) => ({
      ...month,
      ingresos: month.ingresos.map((i) => (i.id === id ? toggleEstadoIngreso(i) : i)),
    }));
  }

  function actualizarSaldoInicial(monto: number) {
    updateMonth(selectedMonthKey, (month) => ({ ...month, saldoInicial: monto }));
  }

  function actualizarTarjetaCredito(campo: keyof TarjetaCredito, valor: number) {
    setState((prev) => ({ ...prev, tarjetaCredito: { ...prev.tarjetaCredito, [campo]: valor } }));
  }

  function agregarPrestamo(input: NewPrestamoInput) {
    setState((prev) => ({ ...prev, prestamos: [...prev.prestamos, { ...input, id: newId() }] }));
  }

  function actualizarPrestamo(id: string, input: NewPrestamoInput) {
    setState((prev) => ({
      ...prev,
      prestamos: prev.prestamos.map((p) => (p.id === id ? { ...p, ...input } : p)),
    }));
  }

  function eliminarPrestamo(id: string) {
    setState((prev) => ({ ...prev, prestamos: prev.prestamos.filter((p) => p.id !== id) }));
  }

  /** `valor` es el id de un Ingreso, `TARJETA_CREDITO` para marcarlo a pagar con tarjeta, o null para quitar la asignación. */
  function asignarFuentePago(egresoId: string, valor: string | null) {
    const pagoConTarjeta = valor === TARJETA_CREDITO;
    updateMonth(selectedMonthKey, (month) => ({
      ...month,
      egresos: month.egresos.map((e) =>
        e.id === egresoId ? { ...e, ingresoId: pagoConTarjeta ? null : valor, pagoConTarjeta } : e,
      ),
    }));
  }

  function vaciarMes() {
    updateMonth(selectedMonthKey, (month) => ({ ...month, ingresos: [], egresos: [] }));
  }

  /** Elimina el mes seleccionado por completo (no solo sus datos). Siempre debe quedar al menos un mes. */
  function eliminarMes() {
    if (monthKeys.length <= 1) return;
    const index = monthKeys.indexOf(selectedMonthKey);
    const { [selectedMonthKey]: _eliminado, ...resto } = state.months;
    const clavesRestantes = sortedMonthKeys(Object.keys(resto));
    const nuevaSeleccion = clavesRestantes[Math.max(index - 1, 0)] ?? clavesRestantes[0];
    setState((prev) => ({ ...prev, months: resto }));
    setSelectedMonthKey(nuevaSeleccion);
  }

  function reemplazarEstado(nuevo: FinanceState) {
    setState(normalizarDetallesEstado(nuevo));
    const keys = sortedMonthKeys(Object.keys(nuevo.months));
    if (keys.length > 0) setSelectedMonthKey(keys[keys.length - 1]);
  }

  function importarFilas(ingresos: NewIngresoInput[], egresos: NewEgresoInput[]) {
    updateMonth(selectedMonthKey, (month) => ({
      ...month,
      ingresos: [
        ...month.ingresos,
        ...ingresos.map((i): Ingreso => ({ ...i, detalle: normalizarDetalle(i.detalle), id: newId() })),
      ],
      egresos: [
        ...month.egresos,
        ...egresos.map(
          (e): Egreso => ({
            ...e,
            detalle: normalizarDetalle(e.detalle),
            id: newId(),
            finalizado: esFinalizado(e.cuotasTotales, e.cuotaActual),
          }),
        ),
      ],
    }));
  }

  const value: FinanceContextValue = {
    state,
    monthKeys,
    selectedMonthKey,
    selectedMonth,
    cargando,
    errorCarga,
    errorGuardado,
    migracionDisponible,
    confirmarMigracion,
    descartarMigracion,
    setSelectedMonthKey,
    crearMesSiguiente,
    agregarIngreso,
    actualizarIngreso,
    eliminarIngreso,
    agregarEgreso,
    actualizarEgreso,
    eliminarEgreso,
    alternarPagado,
    alternarCobrado,
    actualizarSaldoInicial,
    actualizarTarjetaCredito,
    agregarPrestamo,
    actualizarPrestamo,
    eliminarPrestamo,
    asignarFuentePago,
    reemplazarEstado,
    importarFilas,
    vaciarMes,
    eliminarMes,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance debe usarse dentro de FinanceProvider');
  return ctx;
}
