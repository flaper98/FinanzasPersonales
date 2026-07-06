import { useRef, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { exportBackupJson, exportMonthToExcel, importBackupJson, importExcelOrCsv } from '../../lib/excel';
import { monthLabel } from '../../lib/monthUtils';
import {
  intentarActivarChequeoEnSegundoPlano,
  mostrarNotificacionDePrueba,
  notificacionesSoportadas,
  pedirPermisoNotificaciones,
  permisoNotificaciones,
  registrarServiceWorker,
} from '../../lib/notificaciones';

export function BackupPage() {
  const {
    state,
    monthKeys,
    selectedMonth,
    selectedMonthKey,
    reemplazarEstado,
    importarFilas,
    vaciarMes,
    eliminarMes,
  } = useFinance();
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [permiso, setPermiso] = useState<NotificationPermission>(permisoNotificaciones());
  const [activandoNotif, setActivandoNotif] = useState(false);

  async function handleActivarNotificaciones() {
    setActivandoNotif(true);
    try {
      const resultado = await pedirPermisoNotificaciones();
      setPermiso(resultado);
      if (resultado === 'granted') {
        const reg = await registrarServiceWorker();
        if (reg) await intentarActivarChequeoEnSegundoPlano(reg);
        setMensaje({
          tipo: 'ok',
          texto: 'Notificaciones activadas. Vas a recibir un aviso al abrir la app si hay pagos por vencer.',
        });
      } else {
        setMensaje({ tipo: 'error', texto: 'No se concedió el permiso de notificaciones del navegador.' });
      }
    } finally {
      setActivandoNotif(false);
    }
  }

  async function handleImportJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      if (!confirm('Esto reemplazará todos los datos actuales con el contenido del backup. ¿Continuar?')) return;
      const nuevo = await importBackupJson(file);
      reemplazarEstado(nuevo);
      setMensaje({ tipo: 'ok', texto: 'Backup importado correctamente.' });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err instanceof Error ? err.message : 'No se pudo leer el archivo.' });
    }
  }

  async function handleImportExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const { ingresos, egresos } = await importExcelOrCsv(file, 'auto');
      if (ingresos.length === 0 && egresos.length === 0) {
        setMensaje({ tipo: 'error', texto: 'No se encontraron filas para importar en el archivo.' });
        return;
      }
      importarFilas(ingresos, egresos);
      setMensaje({
        tipo: 'ok',
        texto: `Se importaron ${ingresos.length} ingreso(s) y ${egresos.length} egreso(s) a ${monthLabel(selectedMonthKey)}.`,
      });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err instanceof Error ? err.message : 'No se pudo leer el archivo.' });
    }
  }

  const totalMeses = Object.keys(state.months).length;

  function handleVaciarMes() {
    if (
      confirm(
        `Esto elimina todos los ingresos y egresos de ${monthLabel(selectedMonthKey)} (no afecta otros meses). ¿Continuar?`,
      )
    ) {
      vaciarMes();
      setMensaje({ tipo: 'ok', texto: `Se vació ${monthLabel(selectedMonthKey)}. Ya puedes importar tus datos reales sin duplicados.` });
    }
  }

  function handleEliminarMes() {
    if (monthKeys.length <= 1) return;
    if (
      confirm(
        `Esto elimina por completo ${monthLabel(selectedMonthKey)} del historial (no solo sus datos, el mes deja de existir). Esta acción no se puede deshacer. ¿Continuar?`,
      )
    ) {
      const label = monthLabel(selectedMonthKey);
      eliminarMes();
      setMensaje({ tipo: 'ok', texto: `Se eliminó ${label} del historial.` });
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-slate-800">Backup e importación</h2>

      {mensaje && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            mensaje.tipo === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-3">
        <h3 className="font-semibold text-slate-800">Notificaciones de vencimiento</h3>
        <p className="text-sm text-slate-500">
          Te avisa con una notificación del navegador cuando un egreso NO PAGADO está por vencer (3 días o menos) o ya
          venció. Funciona siempre que abras la app; en Android además puede intentar avisarte aunque no la tengas
          abierta (no garantizado, depende del navegador). En iPhone, agrega la app a tu pantalla de inicio y ábrela
          desde ahí para poder activar el permiso.
        </p>

        {!notificacionesSoportadas() ? (
          <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
            Este navegador no soporta notificaciones web.
          </p>
        ) : permiso === 'granted' ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-100 text-emerald-700">
              Notificaciones activadas
            </span>
            <button
              onClick={() => void mostrarNotificacionDePrueba()}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Probar notificación
            </button>
          </div>
        ) : permiso === 'denied' ? (
          <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">
            Bloqueaste las notificaciones para este sitio. Para activarlas, cambia el permiso desde la configuración
            del navegador (ícono de candado junto a la URL).
          </p>
        ) : (
          <button
            onClick={handleActivarNotificaciones}
            disabled={activandoNotif}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {activandoNotif ? 'Activando…' : 'Activar notificaciones'}
          </button>
        )}
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-3">
        <h3 className="font-semibold text-slate-800">Backup completo (JSON)</h3>
        <p className="text-sm text-slate-500">
          Guarda todos tus meses ({totalMeses}) en un archivo. Úsalo para respaldar tu información o moverla a otro
          equipo.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => exportBackupJson(state)}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700"
          >
            Exportar backup
          </button>
          <button
            onClick={() => jsonInputRef.current?.click()}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Importar backup
          </button>
          <input ref={jsonInputRef} type="file" accept="application/json" hidden onChange={handleImportJson} />
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-3">
        <h3 className="font-semibold text-slate-800">Exportar mes a Excel</h3>
        <p className="text-sm text-slate-500">
          Descarga {monthLabel(selectedMonthKey)} como .xlsx con las hojas "Ingreso" y "Egreso", igual que tu planilla
          actual.
        </p>
        <button
          onClick={() => selectedMonth && exportMonthToExcel(selectedMonth)}
          disabled={!selectedMonth}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40"
        >
          Exportar {monthLabel(selectedMonthKey)}
        </button>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-3">
        <h3 className="font-semibold text-slate-800">Importar Excel/CSV</h3>
        <p className="text-sm text-slate-500">
          Sube tu archivo con el registro actual (hojas "Ingreso"/"Egreso", o un CSV de una sola tabla). Las filas se
          agregan al mes seleccionado: <strong>{monthLabel(selectedMonthKey)}</strong>. Si el mes ya tiene datos de
          ejemplo o de prueba, vacíalo primero (sección "Gestionar mes" abajo) para no duplicar filas.
        </p>
        <button
          onClick={() => excelInputRef.current?.click()}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          Elegir archivo…
        </button>
        <input
          ref={excelInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          hidden
          onChange={handleImportExcel}
        />
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-rose-100 p-5 space-y-3">
        <h3 className="font-semibold text-slate-800">Gestionar mes: {monthLabel(selectedMonthKey)}</h3>
        <p className="text-sm text-slate-500">Acciones irreversibles sobre el mes que tienes seleccionado arriba.</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleVaciarMes}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
          >
            Vaciar datos de {monthLabel(selectedMonthKey)}
          </button>
          <button
            onClick={handleEliminarMes}
            disabled={monthKeys.length <= 1}
            title={monthKeys.length <= 1 ? 'Debe quedar al menos un mes' : undefined}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Eliminar {monthLabel(selectedMonthKey)} del historial
          </button>
        </div>
      </section>
    </div>
  );
}
