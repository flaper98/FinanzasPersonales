export function Pagination({
  pagina,
  totalPaginas,
  onChange,
}: {
  pagina: number;
  totalPaginas: number;
  onChange: (pagina: number) => void;
}) {
  if (totalPaginas <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm">
      <button
        onClick={() => onChange(pagina - 1)}
        disabled={pagina <= 1}
        className="px-3 py-1.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
      >
        ← Anterior
      </button>
      <span className="text-slate-500">
        Página {pagina} de {totalPaginas}
      </span>
      <button
        onClick={() => onChange(pagina + 1)}
        disabled={pagina >= totalPaginas}
        className="px-3 py-1.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
      >
        Siguiente →
      </button>
    </div>
  );
}
