import type { Page } from '../../App';
import { useAuth } from '../../context/AuthContext';

const TABS: Array<{ id: Page; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'ingresos', label: 'Ingresos' },
  { id: 'egresos', label: 'Egresos' },
  { id: 'planificador', label: 'Planificador' },
  { id: 'prestamos', label: 'Préstamos' },
  { id: 'tarjetas', label: 'Tarjetas' },
  { id: 'graficos', label: 'Gráficos' },
  { id: 'backup', label: 'Backup' },
];

function Brand() {
  return (
    <div className="flex items-center gap-2 font-semibold text-lg px-5 py-5 text-white">
      <span className="w-7 h-7 grid place-items-center rounded bg-brand-500">$</span>
      Mis Finanzas
    </div>
  );
}

function NavLinks({ page, onNavigate }: { page: Page; onNavigate: (page: Page) => void }) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onNavigate(tab.id)}
          className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition ${
            page === tab.id ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

function CuentaFooter() {
  const { usuario, cerrarSesion } = useAuth();
  if (!usuario) return null;
  return (
    <div className="border-t border-white/10 px-3 py-3">
      <div className="text-xs text-slate-400 truncate px-2 mb-1">{usuario.email}</div>
      <button
        onClick={() => void cerrarSesion()}
        className="w-full text-left px-2 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-white/10 hover:text-white"
      >
        Cerrar sesión
      </button>
    </div>
  );
}

/** Menú lateral fijo para pantallas medianas en adelante. */
export function Sidebar({ page, onNavigate }: { page: Page; onNavigate: (page: Page) => void }) {
  return (
    <aside className="hidden md:flex md:flex-col md:w-60 md:shrink-0 bg-slate-900">
      <div className="sticky top-0 flex flex-col h-screen">
        <div className="border-b border-white/10">
          <Brand />
        </div>
        <NavLinks page={page} onNavigate={onNavigate} />
        <CuentaFooter />
      </div>
    </aside>
  );
}

/** Cajón deslizable para pantallas pequeñas, abierto desde el botón de menú de la barra superior. */
export function MobileSidebar({
  page,
  onNavigate,
  onClose,
}: {
  page: Page;
  onNavigate: (page: Page) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-30 md:hidden">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 w-64 bg-slate-900 flex flex-col shadow-xl">
        <div className="flex items-center justify-between pr-3 border-b border-white/10">
          <Brand />
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            className="w-8 h-8 grid place-items-center rounded-lg hover:bg-white/10 text-white shrink-0"
          >
            ✕
          </button>
        </div>
        <NavLinks
          page={page}
          onNavigate={(p) => {
            onNavigate(p);
            onClose();
          }}
        />
        <CuentaFooter />
      </div>
    </div>
  );
}
