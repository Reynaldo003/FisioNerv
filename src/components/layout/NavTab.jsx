// src/components/layout/NavTab.jsx

export function NavTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 text-xs font-medium rounded-full transition
      ${
        active
          ? "bg-white text-violet-600 shadow-sm"
          : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {label}
    </button>
  );
}
