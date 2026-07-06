import { MonthSelector } from './MonthSelector';

export function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
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
        <div className="flex-1" />
        <MonthSelector />
      </div>
    </header>
  );
}
