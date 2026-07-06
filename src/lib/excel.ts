import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type {
  Accion,
  Cuotas,
  EstadoIngreso,
  FinanceState,
  MonthData,
  NewEgresoInput,
  NewIngresoInput,
  TipoEgreso,
} from '../types';

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---------- Exportar ----------

export function exportBackupJson(state: FinanceState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  downloadBlob(`finanzas-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`, blob);
}

export function exportMonthToExcel(month: MonthData): void {
  const wb = XLSX.utils.book_new();

  const ingresoRows = month.ingresos.map((i) => ({
    Detalle: i.detalle,
    Monto: i.monto,
    Fecha: i.fecha ?? 'Definir',
    Fijo: i.fijo ? 'SI' : 'NO',
    Estado: i.estado,
  }));
  const ingresoPorId = new Map(month.ingresos.map((i) => [i.id, i.detalle]));
  const egresoRows = month.egresos.map((e) => ({
    Detalle: e.detalle,
    Monto: e.monto,
    Fecha: e.fecha,
    'Tipo de Egreso': e.tipo,
    'Cuotas Totales': e.cuotasTotales,
    'Cuota Actual': e.cuotaActual,
    'Cuotas Por Pagar':
      e.cuotasTotales === 'siempre' || e.cuotaActual === 'siempre'
        ? 'siempre'
        : Math.max((e.cuotasTotales as number) - (e.cuotaActual as number), 0),
    Accion: e.accion,
    'Pagar Con': e.pagoConTarjeta ? 'Tarjeta de crédito' : e.ingresoId ? (ingresoPorId.get(e.ingresoId) ?? '') : '',
  }));

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ingresoRows), 'Ingreso');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(egresoRows), 'Egreso');

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  downloadBlob(`finanzas-${month.key}.xlsx`, new Blob([buffer], { type: 'application/octet-stream' }));
}

// ---------- Importar backup JSON ----------

export function importBackupJson(file: File): Promise<FinanceState> {
  return file.text().then((text) => {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || typeof parsed.months !== 'object') {
      throw new Error('El archivo no tiene el formato de backup esperado.');
    }
    return parsed as FinanceState;
  });
}

// ---------- Importar Excel/CSV (Ingreso/Egreso) ----------

const ACCENTS: Record<string, string> = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ñ: 'n' };

function normalizeKey(key: string): string {
  return key
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[áéíóúñ]/g, (ch) => ACCENTS[ch] ?? ch);
}

function getField(row: Record<string, unknown>, ...names: string[]): unknown {
  const normalizedRow: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    normalizedRow[normalizeKey(k)] = v;
  }
  for (const name of names) {
    const value = normalizedRow[normalizeKey(name)];
    if (value !== undefined && value !== '') return value;
  }
  return undefined;
}

function parseMonto(value: unknown): number {
  if (typeof value === 'number') return value;
  const cleaned = String(value ?? '')
    .replace(/[^0-9.,-]/g, '')
    .replace(/,(?=\d{3}(\D|$))/g, '')
    .replace(',', '.');
  const monto = parseFloat(cleaned);
  return Number.isFinite(monto) ? monto : 0;
}

function parseFecha(value: unknown): string | null {
  if (value instanceof Date) return format(value, 'yyyy-MM-dd');
  const text = String(value ?? '').trim();
  if (!text || /^definir$/i.test(text)) return null;

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return text.slice(0, 10);

  const dmy = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (dmy) {
    const [, d, m, yRaw] = dmy;
    const y = yRaw.length === 2 ? `20${yRaw}` : yRaw;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return null;
}

function parseCuotas(value: unknown): Cuotas {
  const text = String(value ?? '').trim();
  if (/^siempre$/i.test(text)) return 'siempre';
  const n = parseInt(text, 10);
  return Number.isFinite(n) ? n : 0;
}

function parseTipo(value: unknown): TipoEgreso {
  return /no\s*fijo/i.test(String(value ?? '')) ? 'NO FIJO' : 'FIJO';
}

function parseAccion(value: unknown): Accion {
  return /^pagado$/i.test(String(value ?? '').trim()) ? 'PAGADO' : 'NO PAGADO';
}

function parseFijo(value: unknown): boolean {
  return /^(si|sí|true|1|fijo|x)$/i.test(String(value ?? '').trim());
}

function parseEstadoIngreso(value: unknown): EstadoIngreso {
  return /^cobrado$/i.test(String(value ?? '').trim()) ? 'COBRADO' : 'NO COBRADO';
}

function findSheet(wb: XLSX.WorkBook, ...candidates: string[]): XLSX.WorkSheet | undefined {
  const name = wb.SheetNames.find((n) => candidates.some((c) => normalizeKey(n) === normalizeKey(c)));
  return name ? wb.Sheets[name] : undefined;
}

export interface ImportedRows {
  ingresos: NewIngresoInput[];
  egresos: NewEgresoInput[];
}

/**
 * Importa un Excel/CSV. Si el archivo trae hojas "Ingreso" y/o "Egreso" las
 * usa; si es un CSV de una sola tabla, se interpreta según `kind`.
 */
export async function importExcelOrCsv(file: File, kind: 'ingreso' | 'egreso' | 'auto'): Promise<ImportedRows> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });

  const ingresos: NewIngresoInput[] = [];
  const egresos: NewEgresoInput[] = [];

  const ingresoSheet = findSheet(wb, 'Ingreso', 'Ingresos');
  const egresoSheet = findSheet(wb, 'Egreso', 'Egresos');

  if (ingresoSheet) {
    for (const row of XLSX.utils.sheet_to_json<Record<string, unknown>>(ingresoSheet, { defval: '' })) {
      ingresos.push(rowToIngreso(row));
    }
  }
  if (egresoSheet) {
    for (const row of XLSX.utils.sheet_to_json<Record<string, unknown>>(egresoSheet, { defval: '' })) {
      egresos.push(rowToEgreso(row));
    }
  }

  if (!ingresoSheet && !egresoSheet) {
    const firstSheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });
    const effectiveKind = kind === 'auto' ? (getField(rows[0] ?? {}, 'Tipo de Egreso', 'Accion') !== undefined ? 'egreso' : 'ingreso') : kind;
    for (const row of rows) {
      if (effectiveKind === 'egreso') egresos.push(rowToEgreso(row));
      else ingresos.push(rowToIngreso(row));
    }
  }

  return { ingresos, egresos };
}

function rowToIngreso(row: Record<string, unknown>): NewIngresoInput {
  return {
    detalle: String(getField(row, 'Detalle') ?? '').trim(),
    monto: parseMonto(getField(row, 'Monto')),
    fecha: parseFecha(getField(row, 'Fecha')),
    fijo: parseFijo(getField(row, 'Fijo')),
    estado: parseEstadoIngreso(getField(row, 'Estado', 'Accion', 'Acción')),
  };
}

function rowToEgreso(row: Record<string, unknown>): NewEgresoInput {
  const cuotasTotales = parseCuotas(getField(row, 'Cuotas Totales'));
  const cuotaActual = parseCuotas(getField(row, 'Cuota Actual'));
  const pagarCon = String(getField(row, 'Pagar Con') ?? '');
  return {
    detalle: String(getField(row, 'Detalle') ?? '').trim(),
    monto: parseMonto(getField(row, 'Monto')),
    fecha: parseFecha(getField(row, 'Fecha')) ?? format(new Date(), 'yyyy-MM-dd'),
    tipo: parseTipo(getField(row, 'Tipo de Egreso', 'Tipo')),
    cuotasTotales,
    cuotaActual,
    accion: parseAccion(getField(row, 'Accion', 'Acción')),
    ingresoId: null,
    pagoConTarjeta: /tarjeta/i.test(pagarCon),
    prestamoId: null,
  };
}
