import { useFinance } from '../../context/FinanceContext';
import { monthLabel } from '../../lib/monthUtils';

export function MonthSelector() {
  const { monthKeys, selectedMonthKey, setSelectedMonthKey, crearMesSiguiente } = useFinance();
  const index = monthKeys.indexOf(selectedMonthKey);
  const esUltimoMes = index === monthKeys.length - 1;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        aria-label="Mes anterior"
        disabled={index <= 0}
        onClick={() => setSelectedMonthKey(monthKeys[index - 1])}
        className="w-8 h-8 grid place-items-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        ‹
      </button>

      <select
        value={selectedMonthKey}
        onChange={(e) => setSelectedMonthKey(e.target.value)}
        className="bg-slate-100 hover:bg-slate-200 transition rounded-lg px-3 py-1.5 text-sm font-medium capitalize text-slate-700 outline-none"
      >
        {monthKeys.map((key) => (
          <option key={key} value={key}>
            {monthLabel(key)}
          </option>
        ))}
      </select>

      <button
        type="button"
        aria-label="Mes siguiente"
        disabled={index === -1 || index >= monthKeys.length - 1}
        onClick={() => setSelectedMonthKey(monthKeys[index + 1])}
        className="w-8 h-8 grid place-items-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        ›
      </button>

      {esUltimoMes && (
        <button
          type="button"
          onClick={crearMesSiguiente}
          className="ml-1 text-sm font-medium px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition"
          title="Crea el mes siguiente y arrastra automáticamente los gastos fijos pendientes"
        >
          + Nuevo mes
        </button>
      )}
    </div>
  );
}
