// src/components/layout/patients/FilterBlock.jsx

export function FilterBlock({ title, children }) {
  return (
    <div className="border border-slate-200 rounded-xl bg-white px-3 py-3 shadow-xs">
      <h3 className="text-[11px] font-semibold text-slate-600 mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}
