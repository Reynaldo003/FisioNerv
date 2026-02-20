// src/components/layout/NavTab.jsx
import React from "react";

export function NavTab({ label, active, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? "page" : undefined}
      className={[
        "px-4 py-1.5 text-xs font-medium rounded-full transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2",
        disabled ? "opacity-60 cursor-not-allowed" : "",
        active
          ? "bg-white text-violet-600 shadow-sm"
          : "text-slate-500 hover:text-slate-700 hover:bg-white/60",
      ].join(" ")}
    >
      {label}
    </button>
  );
}