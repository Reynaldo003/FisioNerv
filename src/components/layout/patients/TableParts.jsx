// src/components/patients/TableParts.jsx

export function Th({ children, className = "" }) {
  return (
    <th
      className={`px-4 py-2 text-left text-[11px] font-semibold text-slate-500 ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, className = "" }) {
  return (
    <td className={`px-4 py-2 text-[11px] text-slate-700 ${className}`}>
      {children}
    </td>
  );
}
