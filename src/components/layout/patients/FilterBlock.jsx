// src/components/layout/patients/FilterBlock.jsx

export function FilterBlock({ title, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-xs">
      <h3 className="mb-2 text-[11px] font-semibold text-slate-600">{title}</h3>
      {children}
    </div>
  );
}
