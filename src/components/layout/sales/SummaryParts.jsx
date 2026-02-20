// UI helpers para Ventas (dashboard simplificado)

// Bloque de filtros superiores
export function FilterField({ label, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm/5">
      <p className="text-[11px] font-semibold text-slate-600 mb-2">{label}</p>
      {children}
    </div>
  );
}

// Tarjetas KPI
export function KpiCard({ label, value, helper, pill }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-slate-600">{label}</p>
        {pill && (
          <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 border border-emerald-100">
            {pill}
          </span>
        )}
      </div>
      <p className="text-xl font-semibold text-slate-900">{value}</p>
      {helper && <p className="text-[11px] text-slate-500 leading-snug">{helper}</p>}
    </div>
  );
}

// Card contenedora
export function SummaryCard({ title, subtitle, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
      <div>
        <h3 className="text-xs font-semibold text-slate-700">{title}</h3>
        {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// Pill simple para estados
export function BadgePill({ label, tone = "slate" }) {
  const cls =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : tone === "amber"
        ? "bg-amber-50 text-amber-800 border-amber-100"
        : "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}

// ============================
// PIE CHART (SVG) - simple y ligero
// ============================

const PIE_COLORS = [
  "#7c3aed", // violeta
  "#10b981", // emerald
  "#0ea5e9", // sky
  "#f59e0b", // amber
  "#ef4444", // red
  "#14b8a6", // teal
  "#a855f7", // purple
  "#22c55e", // green
  "#64748b", // slate
  "#e11d48", // rose
];

function clamp01(x) {
  const v = Number(x || 0);
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180.0;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

function normalizeItems(items) {
  const clean = (items || [])
    .map((i) => ({ label: String(i.label || "Sin etiqueta"), value: Number(i.value || 0) }))
    .filter((i) => i.value > 0);

  const total = clean.reduce((acc, i) => acc + i.value, 0);
  if (!total) return { total: 0, items: [] };

  const out = clean.map((i) => ({ ...i, pct: i.value / total }));
  return { total, items: out };
}

export function PieChart({ items, size = 140, stroke = 0 }) {
  const { total, items: norm } = normalizeItems(items);

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2;

  if (!total) {
    return (
      <div className="flex items-center justify-center">
        <div className="h-[140px] w-[140px] rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center">
          <span className="text-[11px] text-slate-400">Sin datos</span>
        </div>
      </div>
    );
  }

  let startAngle = 0;

  return (
    <div className="flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        {norm.map((seg, idx) => {
          const pct = clamp01(seg.pct);
          const angle = pct * 360;
          const endAngle = startAngle + angle;
          const d = arcPath(cx, cy, r, startAngle, endAngle);
          const fill = PIE_COLORS[idx % PIE_COLORS.length];
          const path = (
            <path
              key={`${seg.label}-${idx}`}
              d={d}
              fill={fill}
              stroke={stroke ? "#ffffff" : "none"}
              strokeWidth={stroke}
            />
          );
          startAngle = endAngle;
          return path;
        })}

        {/* donut hole sutil */}
        <circle cx={cx} cy={cy} r={Math.max(r * 0.45, 26)} fill="white" opacity="0.92" />
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          className="fill-slate-800"
          style={{ fontSize: 12, fontWeight: 700 }}
        >
          {norm.length}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          className="fill-slate-500"
          style={{ fontSize: 10 }}
        >
          categorías
        </text>
      </svg>
    </div>
  );
}

// Leyenda compacta (útil para pie)
export function LegendList({ items, max = 12 }) {
  const { total, items: norm } = normalizeItems(items);

  if (!total) return <p className="text-[11px] text-slate-400">Sin datos para mostrar.</p>;

  const sliced = norm.slice(0, max);
  const rest = norm.slice(max);

  return (
    <div className="space-y-2 text-[11px]">
      {sliced.map((i, idx) => {
        const pct = Math.round(i.pct * 100);
        const color = PIE_COLORS[idx % PIE_COLORS.length];
        return (
          <div key={i.label} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ background: color }}
              />
              <span className="text-slate-700 truncate">{i.label}</span>
            </div>
            <span className="text-slate-500 shrink-0">
              {pct}% <span className="text-slate-400">({i.value.toFixed(0)})</span>
            </span>
          </div>
        );
      })}

      {rest.length > 0 && (
        <p className="text-[11px] text-slate-400">
          + {rest.length} categorías más (ocultas en la leyenda para no saturar).
        </p>
      )}
    </div>
  );
}
