import { useEffect, useMemo, useState } from "react";
import {
  FilterField,
  KpiCard,
  SummaryCard,
  PieChart,
  LegendList,
  BadgePill,
} from "./SummaryParts";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

// =======================
// Helpers fechas
// =======================
function toDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function startOfWeekMonday(date) {
  const d = new Date(date);
  const jsDay = d.getDay(); // 0 domingo, 1 lunes...
  const deltaToMonday = (jsDay + 6) % 7;
  d.setDate(d.getDate() - deltaToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfWeekSunday(date) {
  const monday = startOfWeekMonday(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}
function startOfMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}
function startOfYear(date) {
  const d = new Date(date.getFullYear(), 0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfYear(date) {
  const d = new Date(date.getFullYear(), 11, 31);
  d.setHours(23, 59, 59, 999);
  return d;
}
function clampRange(fromKey, toKey) {
  if (!fromKey || !toKey) return { fromKey, toKey };
  if (fromKey <= toKey) return { fromKey, toKey };
  return { fromKey: toKey, toKey: fromKey };
}
function inRange(dateKey, fromKey, toKey) {
  if (!dateKey) return false;
  if (!fromKey || !toKey) return true;
  return dateKey >= fromKey && dateKey <= toKey;
}

function money(n) {
  const v = Number(n || 0);
  return `$ ${v.toFixed(2)}`;
}

function safeStr(x, fallback = "") {
  const s = String(x ?? "").trim();
  return s ? s : fallback;
}

// =======================
// Modal Confirmar Eliminación (escribir "eliminar")
// =======================
function DeletePaymentModal({ open, title = "Eliminar registro", onClose, onConfirm, hint }) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (open) setText("");
  }, [open]);

  if (!open) return null;

  const ok = text.trim().toLowerCase() === "eliminar";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
          >
            Cerrar
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm text-slate-700">
            Para confirmar, escribe <span className="font-semibold">eliminar</span>.
          </p>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            placeholder='Escribe "eliminar"'
            autoFocus
          />
          <p className="text-[11px] text-slate-500 mt-2">
            Esta acción no se puede deshacer.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => ok && onConfirm?.()}
            disabled={!ok}
            className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 hover:brightness-110"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// =======================
// Modal para editar pago (sin cambios de lógica, solo labels)
// =======================
function PaymentDetailModal({ payment, onClose, onUpdated }) {
  const [form, setForm] = useState(() => ({
    fecha_pago: payment.fecha_pago || "",
    comprobante: payment.comprobante || "",
    metodo_pago: payment.metodo_pago || "efectivo",
    monto_facturado: Number(payment.monto_facturado || 0),
    descuento_porcentaje: Number(payment.descuento_porcentaje || 0),
    anticipo: Number(payment.anticipo || 0),
  }));
  const [saving, setSaving] = useState(false);

  if (!payment) return null;

  const handleChange = (field, value) => {
    if (["monto_facturado", "descuento_porcentaje", "anticipo"].includes(field)) {
      setForm((prev) => ({
        ...prev,
        [field]: value === "" ? "" : Number(value),
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("auth.access");

    try {
      setSaving(true);
      const resp = await fetch(`${API_BASE}/api/pagos/${payment.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!resp.ok) {
        let data = null;
        try {
          data = await resp.json();
        } catch {
          // ignore
        }
        console.error("Error actualizando pago", resp.status, data);
        alert("No se pudo actualizar el pago. Revisa la consola para más detalles.");
        return;
      }

      const updated = await resp.json();
      onUpdated?.(updated);
    } catch (err) {
      console.error("Error actualizando pago", err);
      alert("Ocurrió un error al actualizar el pago.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 space-y-3 text-sm"
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-slate-800">Editar pago #{payment.id}</h3>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:bg-slate-100 text-xs"
          >
            ✕
          </button>
        </div>

        <div className="space-y-1 text-[11px] border border-slate-100 rounded-xl px-3 py-2 bg-slate-50">
          <p>
            <span className="font-semibold text-slate-600">Paciente:</span> {payment.paciente_nombre}
          </p>
          <p>
            <span className="font-semibold text-slate-600">Servicio:</span> {payment.servicio_nombre}
          </p>
          <p>
            <span className="font-semibold text-slate-600">Profesional:</span> {payment.profesional_nombre}
          </p>
          <p>
            <span className="font-semibold text-slate-600">Fecha cita:</span> {payment.fecha_cita}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 text-[11px]">
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Fecha de pago</label>
            <input
              type="date"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              value={form.fecha_pago}
              onChange={(e) => handleChange("fecha_pago", e.target.value)}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Método de pago</label>
            <select
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white"
              value={form.metodo_pago}
              onChange={(e) => handleChange("metodo_pago", e.target.value)}
            >
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Nº comprobante de pago</label>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              value={form.comprobante}
              onChange={(e) => handleChange("comprobante", e.target.value)}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Monto facturado (total de la cita)</label>
            <input
              type="number"
              min="0"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              value={form.monto_facturado}
              onChange={(e) => handleChange("monto_facturado", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Descuento (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                value={form.descuento_porcentaje}
                onChange={(e) => handleChange("descuento_porcentaje", e.target.value)}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Monto de este pago</label>
              <input
                type="number"
                min="0"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                value={form.anticipo}
                onChange={(e) => handleChange("anticipo", e.target.value)}
              />
            </div>

            <div className="flex flex-col justify-center text-[11px] text-slate-700 bg-slate-50 rounded-xl border border-slate-200 px-3 py-2">
              <span className="font-semibold">Restante actual:</span>
              <span>{money(payment.restante)}</span>
              <span className="text-[10px] text-slate-500 mt-1">Se recalculará al guardar.</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            Cerrar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="text-xs px-4 py-2 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}

// =======================
// Selector de rango
// =======================
function DateRangeFilter({
  fromKey,
  toKey,
  onChange,
  onPreset,
  preset,
  group,
  onGroupChange,
  onApply,
  applying,
}) {
  const buttons = [
    { id: "day", label: "Día" },
    { id: "week", label: "Semana" },
    { id: "month", label: "Mes" },
    { id: "year", label: "Año" },
  ];

  const groups = [
    { id: "day", label: "Agrupar por día" },
    { id: "week", label: "Agrupar por semana" },
    { id: "month", label: "Agrupar por mes" },
    { id: "year", label: "Agrupar por año" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {buttons.map((b) => {
          const active = preset === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onPreset(b.id)}
              className={
                "text-[11px] px-3 py-1.5 rounded-xl border transition " +
                (active
                  ? "bg-violet-50 text-violet-700 border-violet-200"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")
              }
            >
              {b.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Fecha inicio</label>
          <input
            type="date"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white"
            value={fromKey}
            onChange={(e) => onChange({ fromKey: e.target.value, toKey })}
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Fecha fin</label>
          <input
            type="date"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white"
            value={toKey}
            onChange={(e) => onChange({ fromKey, toKey: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <select
          className="w-full sm:w-auto rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white"
          value={group}
          onChange={(e) => onGroupChange(e.target.value)}
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onApply}
          disabled={applying}
          className="w-full sm:w-auto text-[11px] px-4 py-2 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 disabled:opacity-60"
        >
          {applying ? "Aplicando..." : "Aplicar"}
        </button>
      </div>
    </div>
  );
}

// =======================
// Agrupación visual de pagos (sin modificar backend)
// - Une pagos de misma cita dentro del rango seleccionado
// - Muestra "métodos" en un solo registro visual
// - Calcula pagado total y restante estimado usando monto_facturado y descuento
// =======================
function groupPaymentsVisual(payments) {
  const map = new Map();

  for (const p of payments || []) {
    const citaId = p.cita; // backend manda "cita" (id)
    const key = String(citaId ?? p.id); // fallback por si algo raro
    if (!map.has(key)) {
      map.set(key, {
        key,
        cita: citaId,
        paciente_nombre: p.paciente_nombre,
        servicio_nombre: p.servicio_nombre,
        profesional_nombre: p.profesional_nombre,
        profesional_id: p.profesional_id,
        fecha_cita: p.fecha_cita,
        // valores "base" (pueden variar por descuentos, etc)
        monto_facturado: Number(p.monto_facturado || 0),
        descuento_porcentaje: Number(p.descuento_porcentaje || 0),

        // agregados
        pagos: [], // {id, fecha_pago, metodo_pago, anticipo, comprobante}
      });
    }

    const g = map.get(key);
    g.monto_facturado = Math.max(g.monto_facturado, Number(p.monto_facturado || 0));
    g.descuento_porcentaje = Math.max(g.descuento_porcentaje, Number(p.descuento_porcentaje || 0));

    g.pagos.push({
      id: p.id,
      fecha_pago: p.fecha_pago,
      metodo_pago: p.metodo_pago,
      anticipo: Number(p.anticipo || 0),
      comprobante: p.comprobante || "",
      restante_raw: Number(p.restante || 0),
      _raw: p,
    });
  }

  const out = Array.from(map.values()).map((g) => {
    // ordenar pagos por fecha
    g.pagos.sort((a, b) => {
      const da = String(a.fecha_pago || "");
      const db = String(b.fecha_pago || "");
      if (da === db) return Number(b.id) - Number(a.id);
      return db.localeCompare(da); // desc
    });

    const totalPagado = g.pagos.reduce((acc, x) => acc + Number(x.anticipo || 0), 0);

    const descPct = Number(g.descuento_porcentaje || 0);
    const totalConDesc = Math.max(g.monto_facturado - (g.monto_facturado * descPct) / 100, 0);
    const restanteCalc = Math.max(totalConDesc - totalPagado, 0);

    // fecha de pago "principal": la más reciente
    const fechaPago = g.pagos[0]?.fecha_pago || "";

    // métodos compactados: {metodo -> suma}
    const methodMap = new Map();
    for (const x of g.pagos) {
      const m = safeStr(x.metodo_pago, "sin método");
      methodMap.set(m, (methodMap.get(m) || 0) + Number(x.anticipo || 0));
    }
    const methods = Array.from(methodMap.entries()).map(([metodo, monto]) => ({
      metodo,
      monto,
    }));

    const pagadoLabel = restanteCalc <= 0 ? "Pagado" : "Parcial";

    return {
      ...g,
      fecha_pago: fechaPago,
      total_pagado: totalPagado,
      total_con_desc: totalConDesc,
      restante_calc: restanteCalc,
      estado_pago: pagadoLabel,
      methods,
      paymentIds: g.pagos.map((x) => x.id),
      // para edición rápida (tomamos el pago más reciente)
      representativePayment: g.pagos[0]?._raw || null,
    };
  });

  // orden final por fecha de pago desc
  out.sort((a, b) => String(b.fecha_pago || "").localeCompare(String(a.fecha_pago || "")));
  return out;
}

// =======================
// SalesView
// =======================
export function SalesView() {
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [stats, setStats] = useState(null);

  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const [professionals, setProfessionals] = useState([]);
  const [professionalId, setProfessionalId] = useState(""); // "" = todos

  // delete modal
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    title: "",
    hint: "",
    ids: [],
  });

  // Dentro de SalesView(), agrega este helper:
  const refreshAfterMutations = async () => {
    // recarga stats + pagos reales del backend (sin tener que cambiar de sección)
    await loadAll("apply");
  };


  // Rango flexible (default: mes actual)
  const now = new Date();
  const defaultFrom = toDateKey(startOfMonth(now));
  const defaultTo = toDateKey(endOfMonth(now));

  const [preset, setPreset] = useState("month");
  const [group, setGroup] = useState("month");

  const [fromKey, setFromKey] = useState(defaultFrom);
  const [toKey, setToKey] = useState(defaultTo);

  const [appliedRange, setAppliedRange] = useState(() => clampRange(defaultFrom, defaultTo));

  const applyRange = (range) => {
    const clamped = clampRange(range.fromKey, range.toKey);
    setAppliedRange(clamped);
  };

  const setPresetRange = (id) => {
    const today = new Date();
    let from = today;
    let to = today;

    if (id === "day") {
      from = new Date(today);
      to = new Date(today);
    } else if (id === "week") {
      from = startOfWeekMonday(today);
      to = endOfWeekSunday(today);
    } else if (id === "month") {
      from = startOfMonth(today);
      to = endOfMonth(today);
    } else if (id === "year") {
      from = startOfYear(today);
      to = endOfYear(today);
    }

    const f = toDateKey(from);
    const t = toDateKey(to);

    setPreset(id);
    setFromKey(f);
    setToKey(t);
    applyRange({ fromKey: f, toKey: t });
  };

  const fetchStats = async (token, from, to, groupBy, profesional) => {
    const qp = new URLSearchParams();
    qp.set("from", from);
    qp.set("to", to);
    qp.set("group", groupBy);
    if (profesional) qp.set("profesional", profesional);

    const resp = await fetch(`${API_BASE}/api/dashboard-stats/?${qp.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`dashboard-stats error: ${resp.status} ${text}`);
    }

    return resp.json();
  };

  const loadAll = async (mode = "initial") => {
    const token = localStorage.getItem("auth.access");
    if (!token) return;

    try {
      if (mode === "initial") setLoading(true);
      else setApplying(true);

      const { fromKey: from, toKey: to } = appliedRange;

      const [statsData, paymentsResp, prosResp] = await Promise.all([
        fetchStats(token, from, to, group, professionalId),
        fetch(`${API_BASE}/api/pagos/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/profesionales/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setStats(statsData);

      if (paymentsResp.ok) {
        const paymentsData = await paymentsResp.json();
        setPayments(paymentsData);
      } else {
        console.error("No se pudo cargar /api/pagos/");
        setPayments([]);
      }

      if (prosResp.ok) {
        const pros = await prosResp.json();
        setProfessionals(pros || []);
      } else {
        setProfessionals([]);
      }
    } catch (err) {
      console.error("Error cargando estadísticas o pagos:", err);
      setPayments([]);
      setProfessionals([]);
    } finally {
      setLoading(false);
      setApplying(false);
    }
  };

  useEffect(() => {
    loadAll("initial");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // recarga cuando cambian filtros aplicados
  useEffect(() => {
    if (!stats) return;
    loadAll("apply");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedRange.fromKey, appliedRange.toKey, group, professionalId]);

  // Pagos filtrados por rango y profesional (frontend)
  const filteredPayments = useMemo(() => {
    const { fromKey: f, toKey: t } = appliedRange;
    return (payments || [])
      .filter((p) => inRange(p.fecha_pago, f, t))
      .filter((p) => (professionalId ? String(p.profesional_id) === String(professionalId) : true));
  }, [payments, appliedRange, professionalId]);

  // ✅ agrupación visual (sin backend)
  const visualRows = useMemo(() => groupPaymentsVisual(filteredPayments), [filteredPayments]);

  // ====== Export CSV usando la vista visual ======
  const handleExportPayments = () => {
    if (!visualRows.length) return;

    const headers = [
      "Cita",
      "Fecha pago",
      "Paciente",
      "Profesional",
      "Servicio",
      "Métodos (desglose)",
      "Estado pago",
      "Pagado total",
      "Monto facturado",
      "Descuento (%)",
      "Restante",
      "IDs pagos",
    ];

    const rows = visualRows.map((r) => [
      r.cita,
      r.fecha_pago,
      r.paciente_nombre,
      r.profesional_nombre,
      r.servicio_nombre,
      r.methods.map((m) => `${m.metodo}: ${Number(m.monto).toFixed(2)}`).join(" | "),
      r.estado_pago,
      Number(r.total_pagado || 0).toFixed(2),
      Number(r.monto_facturado || 0).toFixed(2),
      Number(r.descuento_porcentaje || 0).toFixed(2),
      Number(r.restante_calc || 0).toFixed(2),
      r.paymentIds.join(";"),
    ]);

    const csvContent =
      [headers, ...rows]
        .map((row) =>
          row
            .map((cell) => (typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell))
            .join(",")
        )
        .join("\n") + "\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fisionerv-ventas.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleTicketPdf = async (paymentId) => {
    const token = localStorage.getItem("auth.access");
    if (!token) return;

    try {
      const resp = await fetch(`${API_BASE}/api/pagos/${paymentId}/ticket/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resp.ok) {
        alert("No se pudo generar el PDF del ticket.");
        return;
      }

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `ticket_pago_${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Error de red generando el ticket.");
    }
  };

  const handleAskDelete = (row) => {
    const ids = row?.paymentIds || [];
    if (!ids.length) return;

    setDeleteModal({
      open: true,
      title: "Eliminar registro de pago",
      hint:
        ids.length > 1
          ? `Este registro visual contiene ${ids.length} pagos (se eliminarán todos).`
          : `Se eliminará el pago #${ids[0]}.`,
      ids,
    });
  };

  // Reemplaza handleConfirmDelete por este:
  const handleConfirmDelete = async () => {
    const ids = deleteModal.ids || [];
    const token = localStorage.getItem("auth.access");
    if (!token || !ids.length) {
      setDeleteModal((s) => ({ ...s, open: false }));
      return;
    }

    try {
      // DELETE uno por uno
      for (const id of ids) {
        const resp = await fetch(`${API_BASE}/api/pagos/${id}/`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!resp.ok && resp.status !== 204) {
          const err = await resp.text().catch(() => "");
          console.error("No se pudo eliminar pago", id, resp.status, err);
          alert("No se pudo eliminar uno de los pagos. Revisa consola.");
          return;
        }
      }

      // cerrar modal rápido (UX)
      setDeleteModal((s) => ({ ...s, open: false, ids: [] }));

      // optimista: quitar del estado local inmediato
      setPayments((prev) => prev.filter((p) => !ids.includes(p.id)));

      // ✅ CLAVE: refrescar stats + pagos (esto actualiza gráficas)
      await refreshAfterMutations();
    } catch (e) {
      console.error(e);
      alert("Error de red eliminando el pago.");
    }
  };
  if (loading || !stats) {
    return (
      <main className="flex-1 flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Cargando estadísticas de ventas...</p>
      </main>
    );
  }

  // ====== KPIs ======
  const kpis = stats.kpis || {};
  const totalAsistencias = Number(kpis.total_asistencias || 0);
  const totalCobrado = Number(kpis.total_cobrado || 0);
  const totalPagos = Number(kpis.total_pagos || 0);
  const pacientesNuevos = Number(kpis.pacientes_nuevos || 0);

  // ====== Pie data (3 gráficas) ======
  const paymentPie = (stats.payments_by_method || []).map((m) => ({
    label: safeStr(m.metodo_pago, "Sin método"),
    value: Number(m.total || 0),
  }));

  const servicePie = (stats.revenue_by_service || []).map((s) => ({
    label: safeStr(s.cita__servicio__nombre, "Servicio"),
    value: Number(s.total || 0),
  }));

  const patientStatusMap = (stats.patient_status_totals || []).reduce((acc, x) => {
    acc[x.estado_tratamiento] = Number(x.count || 0);
    return acc;
  }, {});
  const patientPie = [
    { label: "En tratamiento", value: patientStatusMap.en_tratamiento || 0 },
    { label: "Dado de alta", value: patientStatusMap.alta || 0 },
  ];

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      {/* Header */}
      <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 sm:px-6">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-800">Ventas y estadísticas</h2>
          <p className="text-xs text-slate-500 truncate">
            Panel simplificado: 3 gráficas (pastel) + filtros + tabla.
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4 overflow-auto">
        {/* Filtros superiores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <FilterField label="Rango de análisis">
            <DateRangeFilter
              fromKey={fromKey}
              toKey={toKey}
              preset={preset}
              group={group}
              applying={applying}
              onChange={(r) => {
                setPreset("custom");
                const clamped = clampRange(r.fromKey, r.toKey);
                setFromKey(clamped.fromKey);
                setToKey(clamped.toKey);
              }}
              onPreset={(id) => setPresetRange(id)}
              onGroupChange={(g) => setGroup(g)}
              onApply={() => applyRange({ fromKey, toKey })}
            />
          </FilterField>

          <FilterField label="Profesional">
            <select
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white"
              value={professionalId}
              onChange={(e) => setProfessionalId(e.target.value)}
            >
              <option value="">Todos</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {(p.first_name || p.last_name)
                    ? `${p.first_name || ""} ${p.last_name || ""}`.trim()
                    : p.username}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-2">
              Tip: “Todos” para global o selecciona un profesional para ver su desempeño.
            </p>
          </FilterField>
        </div>

        {/* KPIs principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <KpiCard
            label="Ingresos cobrados"
            value={money(totalCobrado)}
            helper={`Rango: ${appliedRange.fromKey} → ${appliedRange.toKey}`}
          />
          <KpiCard
            label="Pagos registrados"
            value={totalPagos}
            helper="Número de pagos (registros) en el rango."
          />
          <KpiCard
            label="Asistencias"
            value={totalAsistencias}
            helper="Citas completadas en el rango."
          />
          <KpiCard
            label="Pacientes nuevos"
            value={pacientesNuevos}
            helper="Altas por fecha de registro."
          />
        </div>

        {/* 3 Gráficas (Pie) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <SummaryCard
            title="Ingresos por método"
            subtitle="Distribución del dinero cobrado por método de pago."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] text-slate-500">Total cobrado</p>
                <p className="text-lg font-semibold text-slate-900">{money(totalCobrado)}</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Se calcula desde pagos del rango.
                </p>
              </div>
              <PieChart items={paymentPie} />
            </div>
            <div className="mt-3">
              <LegendList items={paymentPie} />
            </div>
          </SummaryCard>

          <SummaryCard title="Ingresos por servicio" subtitle="Distribución del dinero por servicio.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <PieChart items={servicePie} />
              <div className="space-y-2">
                <LegendList items={servicePie} max={8} />
              </div>
            </div>
          </SummaryCard>

          <SummaryCard title="Pacientes" subtitle="Pacientes: En Tratamiento vs Dados de Alta.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <PieChart items={patientPie} />
              <div className="space-y-2">
                <LegendList items={patientPie} />
                <div className="flex flex-wrap gap-2 pt-1">
                  <BadgePill tone="emerald" label={`En tratamiento: ${patientPie[0].value}`} />
                  <BadgePill tone="slate" label={`Alta: ${patientPie[1].value}`} />
                </div>
              </div>
            </div>
          </SummaryCard>
        </div>

        {/* Tabla de ventas (vista visual agrupada) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold text-slate-700">Registro de ventas (pagos)</h3>
              <p className="text-[11px] text-slate-500">
                Mostrando pagos desde {appliedRange.fromKey} hasta {appliedRange.toKey}.{" "}
                <span className="text-slate-400">
                  (Vista agrupada por cita, sin tocar backend)
                </span>
              </p>
            </div>
            <button
              onClick={handleExportPayments}
              className="w-full sm:w-auto text-[11px] px-3 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Exportar a Excel
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-[11px] text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-slate-500">
                  <th className="px-3 py-1">Cita</th>
                  <th className="px-3 py-1">Fecha pago</th>
                  <th className="px-3 py-1">Paciente</th>
                  <th className="px-3 py-1">Profesional</th>
                  <th className="px-3 py-1">Servicio</th>
                  <th className="px-3 py-1">Métodos</th>
                  <th className="px-3 py-1">Estado</th>
                  <th className="px-3 py-1">Pagado</th>
                  <th className="px-3 py-1">Facturado</th>
                  <th className="px-3 py-1">Restante</th>
                  <th className="px-3 py-1 text-right">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {visualRows.map((r) => {
                  const rep = r.representativePayment; // pago más reciente para editar/ticket
                  const paidOk = Number(r.restante_calc || 0) <= 0;

                  return (
                    <tr
                      key={r.key}
                      className="bg-slate-50/60 hover:bg-slate-100/70 rounded-2xl"
                    >
                      <td className="px-3 py-3">
                        <span className="font-semibold text-slate-700">#{r.cita}</span>
                      </td>

                      <td className="px-3 py-3">{r.fecha_pago}</td>

                      <td className="px-3 py-3">
                        <div className="min-w-[180px]">
                          <p className="font-medium text-slate-800 truncate">
                            {safeStr(r.paciente_nombre, "Paciente")}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Cita: {safeStr(r.fecha_cita, "-")}
                          </p>
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <p className="truncate min-w-[160px]">{safeStr(r.profesional_nombre, "Profesional")}</p>
                      </td>

                      <td className="px-3 py-3">
                        <p className="truncate min-w-[170px]">{safeStr(r.servicio_nombre, "Servicio")}</p>
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-1 min-w-[220px]">
                          {r.methods.map((m) => (
                            <div key={m.metodo} className="flex items-center justify-between gap-2">
                              <span className="text-slate-600">{m.metodo}</span>
                              <span className="text-slate-700 font-medium">{money(m.monto)}</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <BadgePill
                          tone={paidOk ? "emerald" : "amber"}
                          label={paidOk ? "Pagado" : "Parcial"}
                        />
                      </td>

                      <td className="px-3 py-3 font-semibold text-slate-800">
                        {money(r.total_pagado)}
                      </td>

                      <td className="px-3 py-3">{money(r.monto_facturado)}</td>

                      <td className="px-3 py-3">
                        <span className={paidOk ? "text-emerald-700 font-semibold" : "text-slate-700"}>
                          {money(r.restante_calc)}
                        </span>
                        {Number(r.descuento_porcentaje || 0) > 0 && (
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Desc: {Number(r.descuento_porcentaje).toFixed(0)}%
                          </p>
                        )}
                      </td>

                      <td className="px-3 py-3 text-right">
                        <div className="flex flex-col sm:flex-row justify-end gap-2 min-w-[220px]">
                          <button
                            onClick={() => rep && setSelectedPayment(rep)}
                            className="text-[11px] px-3 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-white"
                            disabled={!rep}
                            title={!rep ? "No hay pago para editar" : "Editar el pago más reciente"}
                          >
                            Ver / editar
                          </button>

                          <button
                            onClick={() => rep?.id && handleTicketPdf(rep.id)}
                            className="text-[11px] px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                            disabled={!rep?.id}
                            title="Ticket del pago más reciente"
                          >
                            Ticket PDF
                          </button>

                          <button
                            onClick={() => handleAskDelete(r)}
                            className="text-[11px] px-3 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700"
                            title={r.paymentIds.length > 1 ? "Eliminar todos los pagos de esta cita" : "Eliminar pago"}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!visualRows.length && (
                  <tr>
                    <td colSpan={11} className="px-3 py-6 text-center text-slate-400">
                      No hay ventas dentro del rango seleccionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal editar pago */}
      {selectedPayment && (
        <PaymentDetailModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onUpdated={(updated) => {
            setPayments((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            setSelectedPayment(null);
          }}
        />
      )}

      {/* Modal eliminar */}
      <DeletePaymentModal
        open={deleteModal.open}
        title={deleteModal.title}
        hint={deleteModal.hint}
        onClose={() => setDeleteModal((s) => ({ ...s, open: false }))}
        onConfirm={handleConfirmDelete}
      />
    </main>
  );
}
