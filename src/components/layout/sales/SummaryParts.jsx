// src/components/layout/sales/SummaryParts.jsx

// Bloque de filtros superiores
export function FilterField({ label, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm/5">
      <p className="text-[11px] font-semibold text-slate-600 mb-2">{label}</p>
      {children}
    </div>
  );
}

// Tarjetas KPI
export function KpiCard({ label, value, helper, pill }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-2 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-slate-600">{label}</p>
        {pill && (
          <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 border border-emerald-100">
            {pill}
          </span>
        )}
      </div>
      <p className="text-xl font-semibold text-slate-900">{value}</p>
      {helper && (
        <p className="text-[11px] text-slate-500 leading-snug">{helper}</p>
      )}
    </div>
  );
}

// Card contenedora de "gráficos"
export function SummaryCard({ title, subtitle, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
      <div>
        <h3 className="text-xs font-semibold text-slate-700">{title}</h3>
        {subtitle && (
          <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

// Donut "bonito" para el total
export function DonutValue({ value, label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-2">
      <div className="relative h-28 w-28">
        {/* Círculo exterior con gradiente suave */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-rose-400 via-violet-500 to-sky-400 opacity-25" />
        {/* Anillo blanco interior */}
        <div className="absolute inset-2 rounded-full bg-white" />
        {/* Borde interior */}
        <div className="absolute inset-4 rounded-full border border-rose-100" />
        {/* Valor al centro */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-rose-600">
            {value}
          </span>
        </div>
      </div>
      {label && (
        <p className="text-[11px] text-slate-500 text-center max-w-[8rem]">
          {label}
        </p>
      )}
    </div>
  );
}

// Lista de barras horizontales
export function BarList({ items, tone = "violet" }) {
  const total = items.reduce((acc, i) => acc + i.value, 0) || 1;

  const toneClasses =
    tone === "emerald"
      ? {
          bar: "bg-emerald-500/70",
          bg: "bg-emerald-50",
          dot: "bg-emerald-500",
        }
      : {
          bar: "bg-violet-500/70",
          bg: "bg-violet-50",
          dot: "bg-violet-500",
        };

  return (
    <div className="space-y-2 text-[11px]">
      {items.map((item) => {
        const pct = Math.round((item.value / total) * 100);
        return (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${toneClasses.dot}`}
                />
                <span className="text-slate-600">{item.label}</span>
              </div>
              <span className="text-slate-500">
                {pct}%{" "}
                <span className="text-slate-400">
                  ({item.value === 0 ? "$ 0" : `$ ${item.value}`})
                </span>
              </span>
            </div>
            <div
              className={`h-2 rounded-full ${toneClasses.bg} overflow-hidden`}
            >
              <div
                className={`h-full ${toneClasses.bar} rounded-full transition-all`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
