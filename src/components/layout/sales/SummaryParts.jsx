export function FilterField({ label, helper, children }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"><div className="mb-2"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>{helper && <p className="mt-0.5 text-[10px] text-slate-400">{helper}</p>}</div>{children}</div>;
}

export function KpiCard({ label, value, helper, pill, icon: Icon, tone = "blue" }) {
  const tones = { blue: "bg-blue-50 text-blue-700", emerald: "bg-emerald-50 text-emerald-700", violet: "bg-violet-50 text-violet-700", amber: "bg-amber-50 text-amber-700", rose: "bg-rose-50 text-rose-700", slate: "bg-slate-100 text-slate-700" };
  const cls = tones[tone] || tones.blue;
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)]"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500">{label}</p><p className="mt-1 truncate text-2xl font-black tracking-tight text-slate-950">{value}</p></div>{Icon && <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${cls}`}><Icon className="h-5 w-5" /></span>}</div><div className="mt-3 flex flex-wrap items-center gap-2">{helper && <span className="text-[11px] font-medium text-slate-500">{helper}</span>}{pill && <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">{pill}</span>}</div></article>;
}

export function SummaryCard({ title, subtitle, children, action }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)]"><div className="mb-4 flex items-start justify-between gap-3"><div><h3 className="text-sm font-bold text-slate-900">{title}</h3>{subtitle && <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{subtitle}</p>}</div>{action}</div>{children}</section>;
}

export function BadgePill({ label, tone = "slate" }) {
  const tones = { emerald: "border-emerald-100 bg-emerald-50 text-emerald-700", amber: "border-amber-100 bg-amber-50 text-amber-800", rose: "border-rose-100 bg-rose-50 text-rose-700", blue: "border-blue-100 bg-blue-50 text-blue-700", violet: "border-violet-100 bg-violet-50 text-violet-700", slate: "border-slate-200 bg-slate-100 text-slate-700" };
  return <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-bold ${tones[tone] || tones.slate}`}>{label}</span>;
}

const PIE_COLORS = ["#1746D1", "#10b981", "#7c3aed", "#f59e0b", "#ef4444", "#06b6d4", "#64748b", "#e11d48"];
function normalizeItems(items) { const clean = (items || []).map(item => ({ label: String(item.label || "Sin etiqueta"), value: Number(item.value || 0) })).filter(item => item.value > 0); const total = clean.reduce((sum, item) => sum + item.value, 0); return { total, items: total ? clean.map(item => ({ ...item, pct: item.value / total })) : [] }; }
function polar(cx, cy, r, angle) { const rad = ((angle - 90) * Math.PI) / 180; return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }; }
function arcPath(cx, cy, r, startAngle, endAngle) { const start = polar(cx, cy, r, endAngle); const end = polar(cx, cy, r, startAngle); const large = endAngle - startAngle <= 180 ? 0 : 1; return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y} Z`; }

export function PieChart({ items, size = 150 }) {
  const { total, items: normalized } = normalizeItems(items); const cx = size / 2; const cy = size / 2; const r = size / 2 - 3;
  if (!total) return <div className="grid place-items-center"><div className="grid h-[150px] w-[150px] place-items-center rounded-full border border-slate-200 bg-slate-50 text-[11px] text-slate-400">Sin datos</div></div>;
  let angle = 0;
  return <div className="grid place-items-center"><svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{normalized.map((segment, index) => { const end = angle + segment.pct * 360; const path = <path key={`${segment.label}-${index}`} d={arcPath(cx, cy, r, angle, end)} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="#fff" strokeWidth="2" />; angle = end; return path; })}<circle cx={cx} cy={cy} r={r * .48} fill="white" /><text x={cx} y={cy - 2} textAnchor="middle" style={{ fontSize: 13, fontWeight: 800, fill: "#0f172a" }}>{normalized.length}</text><text x={cx} y={cy + 14} textAnchor="middle" style={{ fontSize: 9, fill: "#64748b" }}>categorías</text></svg></div>;
}

export function LegendList({ items, max = 10, formatter }) {
  const { total, items: normalized } = normalizeItems(items); if (!total) return <p className="text-[11px] text-slate-400">Sin datos para mostrar.</p>;
  return <div className="space-y-2">{normalized.slice(0, max).map((item, index) => <div key={`${item.label}-${index}`} className="flex items-center justify-between gap-3 text-[11px]"><div className="flex min-w-0 items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} /><span className="truncate font-medium text-slate-700">{item.label}</span></div><span className="shrink-0 text-slate-500">{Math.round(item.pct * 100)}% · {formatter ? formatter(item.value) : item.value.toFixed(0)}</span></div>)}{normalized.length > max && <p className="text-[10px] text-slate-400">+ {normalized.length - max} categorías adicionales</p>}</div>;
}
