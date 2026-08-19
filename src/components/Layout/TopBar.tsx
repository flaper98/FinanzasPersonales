import { MonthSelector } from './MonthSelector';

export function TopBar({
  onOpenMenu,
  guardando,
}: {
  onOpenMenu: () => void;
  /** true mientras hay cambios sin confirmar en el servidor (incluye la espera del debounce de guardado). */
  guardando: boolean;
}) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="px-4 py-3 flex items-center gap-3">
        <button
          onClick={onOpenMenu}
          aria-label="Abrir menú"
          className="md:hidden w-9 h-9 grid place-items-center rounded-lg border border-slate-200 text-slate-600 shrink-0"
        >
          ☰
        </button>
        <div className="md:hidden font-semibold text-slate-800">Mis Finanzas</div>
        {guardando && (
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Guardando…
          </span>
        )}
        <div className="flex-1" />
        <MonthSelector />
      </div>
    </header>
  );
}
