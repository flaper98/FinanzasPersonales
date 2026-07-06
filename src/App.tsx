import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { NotificationSync } from './components/NotificationSync';
import { LoginPage } from './components/Auth/LoginPage';
import { Modal } from './components/common/Modal';
import { Sidebar, MobileSidebar } from './components/Layout/Sidebar';
import { TopBar } from './components/Layout/TopBar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { IngresosPage } from './components/Ingresos/IngresosPage';
import { EgresosPage } from './components/Egresos/EgresosPage';
import { GraficosPage } from './components/Charts/GraficosPage';
import { BackupPage } from './components/Backup/BackupPage';
import { PlanificadorPage } from './components/Planificador/PlanificadorPage';
import { PrestamosPage } from './components/Prestamos/PrestamosPage';

export type Page = 'dashboard' | 'ingresos' | 'egresos' | 'planificador' | 'prestamos' | 'graficos' | 'backup';

function PageContent({ page }: { page: Page }) {
  switch (page) {
    case 'dashboard':
      return <Dashboard />;
    case 'ingresos':
      return <IngresosPage />;
    case 'egresos':
      return <EgresosPage />;
    case 'planificador':
      return <PlanificadorPage />;
    case 'prestamos':
      return <PrestamosPage />;
    case 'graficos':
      return <GraficosPage />;
    case 'backup':
      return <BackupPage />;
  }
}

function MigracionModal() {
  const { migracionDisponible, confirmarMigracion, descartarMigracion } = useFinance();
  if (!migracionDisponible) return null;

  const meses = Object.values(migracionDisponible.months);
  const totalIngresos = meses.reduce((s, m) => s + m.ingresos.length, 0);
  const totalEgresos = meses.reduce((s, m) => s + m.egresos.length, 0);

  return (
    <Modal title="Encontramos datos en este navegador" onClose={descartarMigracion}>
      <p className="text-sm text-slate-600 mb-4">
        Antes de tener cuenta, guardaste {totalIngresos} ingreso(s) y {totalEgresos} egreso(s) en {meses.length} mes(es)
        en este navegador. ¿Quieres importarlos a tu cuenta nueva?
      </p>
      <div className="flex justify-end gap-2">
        <button
          onClick={descartarMigracion}
          className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100"
        >
          No, empezar de cero
        </button>
        <button
          onClick={confirmarMigracion}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700"
        >
          Importar
        </button>
      </div>
    </Modal>
  );
}

function AppShell() {
  const [page, setPage] = useState<Page>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const { cargando, errorCarga, errorGuardado } = useFinance();

  function handleNavigate(next: Page) {
    setPage(next);
    setMenuOpen(false);
  }

  if (cargando) {
    return <div className="min-h-screen grid place-items-center text-sm text-slate-500">Cargando tu información…</div>;
  }

  if (errorCarga) {
    return (
      <div className="min-h-screen grid place-items-center px-4 text-center">
        <div>
          <p className="font-medium text-rose-600 mb-2">No se pudo cargar tu información</p>
          <p className="text-sm text-slate-500">{errorCarga}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <NotificationSync />
      <MigracionModal />
      <div className="min-h-screen flex bg-slate-50">
        <Sidebar page={page} onNavigate={handleNavigate} />
        {menuOpen && <MobileSidebar page={page} onNavigate={handleNavigate} onClose={() => setMenuOpen(false)} />}
        <div className="flex-1 min-w-0">
          {errorGuardado && (
            <div className="bg-rose-600 text-white text-sm text-center py-1.5 px-4">
              No se pudo guardar el último cambio: {errorGuardado}
            </div>
          )}
          <TopBar onOpenMenu={() => setMenuOpen(true)} />
          <main className="max-w-6xl mx-auto px-4 py-6">
            <PageContent page={page} />
          </main>
        </div>
      </div>
    </>
  );
}

function Gate() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return <div className="min-h-screen grid place-items-center text-sm text-slate-500">Cargando…</div>;
  }
  if (!usuario) {
    return <LoginPage />;
  }
  return (
    <FinanceProvider>
      <AppShell />
    </FinanceProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
