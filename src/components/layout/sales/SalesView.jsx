// src/components/layout/sales/SalesView.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  FileSpreadsheet,
  Calculator,
  Landmark,
  PackagePlus,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import {
  FilterField,
  KpiCard,
  SummaryCard,
  PieChart,
  LegendList,
  BadgePill,
} from "./SummaryParts";
import { subscribeSalesRefresh } from "../../../utils/salesSync";
const API_BASE = import.meta.env.VITE_API_BASE || "https://api.fisionerv.cloud";
import { notifySalesRefresh } from "../../../utils/salesSync";

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


function getTodayRangeState() {
  const now = new Date();
  const todayKey = toDateKey(now);

  return {
    preset: "day",
    group: "day",
    fromKey: todayKey,
    toKey: todayKey,
  };
}


// =======================
// SalesView
// =======================
function SalesDashboardView() {
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

  const refreshAfterMutations = async () => loadAll("apply");

  const initialRange = getTodayRangeState();

  const [preset, setPreset] = useState(initialRange.preset);
  const [group, setGroup] = useState(initialRange.group);
  const [fromKey, setFromKey] = useState(initialRange.fromKey);
  const [toKey, setToKey] = useState(initialRange.toKey);
  const [appliedRange, setAppliedRange] = useState(() =>
    clampRange(initialRange.fromKey, initialRange.toKey)
  );

  const applyRange = (range) => {
    const clamped = clampRange(range.fromKey, range.toKey);
    setAppliedRange(clamped);
  };

  useEffect(() => {
    const todayRange = getTodayRangeState();

    setPreset(todayRange.preset);
    setGroup(todayRange.group);
    setFromKey(todayRange.fromKey);
    setToKey(todayRange.toKey);
    setAppliedRange(clampRange(todayRange.fromKey, todayRange.toKey));
  }, []);

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
  useEffect(() => {
    // cuando borren una cita en otra pantalla, refresca ventas
    const unsub = subscribeSalesRefresh(() => {
      loadAll("apply");
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  useEffect(() => {
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
      title: "Eliminar registro de pagos",
      hint:
        ids.length > 1
          ? `Esta venta tiene ${ids.length} pagos. Se eliminarán los pagos, pero la cita NO se borrará.`
          : `Se eliminará el pago #${ids[0]}, pero la cita NO se borrará.`,
      ids,
      citaId: row?.cita,
    });
  };

  const handleConfirmDelete = async () => {
    const token = localStorage.getItem("auth.access");
    const citaId = deleteModal.citaId;
    const ids = deleteModal.ids || [];

    if (!token || !citaId) {
      setDeleteModal((s) => ({ ...s, open: false }));
      return;
    }

    try {
      const resp = await fetch(`${API_BASE}/api/pagos/by-cita/${citaId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resp.ok && resp.status !== 204) {
        const err = await resp.text().catch(() => "");
        console.error("No se pudieron eliminar pagos por cita", citaId, resp.status, err);
        alert("No se pudieron eliminar los pagos. Revisa consola.");
        return;
      }

      setDeleteModal((s) => ({ ...s, open: false, ids: [], citaId: null }));

      setPayments((prev) =>
        prev.filter((p) => String(p.cita) !== String(citaId) && !ids.map(String).includes(String(p.id)))
      );

      await refreshAfterMutations();

      notifySalesRefresh();

      try {
        window.dispatchEvent(new Event("fisionerv:agenda-refresh"));
      } catch { }
    } catch (e) {
      console.error(e);
      alert("Error de red eliminando los pagos.");
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
          <h2 className="text-lg font-semibold text-slate-800">Ventas y estadísticas</h2>
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
                Mostrando pagos por FECHA DE PAGO desde {appliedRange.fromKey} hasta {appliedRange.toKey}.
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
                            Fecha cita: {safeStr(r.fecha_cita, "-")}
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

// ============================================================================
// CORTE DE CAJA TIPO HOJA DE CÁLCULO
// Se mantiene dentro de SalesView.jsx para no agregar archivos al proyecto.
// Los pagos se consultan desde la API existente. Los egresos, configuración y
// cierres se guardan temporalmente en localStorage hasta tener endpoints propios.
// ============================================================================

const CORTE_METODOS = [
  { id: "efectivo", label: "Efectivo" },
  { id: "tarjeta", label: "Tarjeta / terminal" },
  { id: "transferencia", label: "Transferencia" },
  { id: "otro", label: "Otro" },
];

function corteFechaActual() {
  const fecha = new Date();
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function corteHoraActual() {
  const fecha = new Date();
  return `${String(fecha.getHours()).padStart(2, "0")}:${String(
    fecha.getMinutes()
  ).padStart(2, "0")}`;
}

function obtenerHoraMovimiento(valor) {
  if (!valor) return "--:--";

  const texto = String(valor);
  const coincidencia = texto.match(/T(\d{2}:\d{2})/);
  if (coincidencia?.[1]) return coincidencia[1];

  const coincidenciaSimple = texto.match(/\b(\d{2}:\d{2})\b/);
  return coincidenciaSimple?.[1] || "--:--";
}

function normalizarMetodoCorte(metodo) {
  const valor = String(metodo || "").trim().toLowerCase();

  if (valor.includes("efectivo")) return "efectivo";
  if (valor.includes("tarjeta") || valor.includes("terminal")) return "tarjeta";
  if (valor.includes("transfer")) return "transferencia";
  return valor || "otro";
}

function etiquetaMetodoCorte(metodo) {
  const normalizado = normalizarMetodoCorte(metodo);
  return CORTE_METODOS.find((item) => item.id === normalizado)?.label || "Otro";
}

function leerLocalStorageCorte(clave, valorInicial) {
  try {
    const valor = localStorage.getItem(clave);
    return valor ? JSON.parse(valor) : valorInicial;
  } catch (error) {
    console.error("No se pudo leer información local del corte:", error);
    return valorInicial;
  }
}

function guardarLocalStorageCorte(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch (error) {
    console.error("No se pudo guardar información local del corte:", error);
  }
}

function MetodoCorteBadge({ metodo }) {
  const valor = normalizarMetodoCorte(metodo);

  if (valor === "efectivo") {
    return <BadgePill tone="emerald" label="Efectivo" />;
  }

  if (valor === "tarjeta") {
    return (
      <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
        Tarjeta / terminal
      </span>
    );
  }

  if (valor === "transferencia") {
    return (
      <span className="inline-flex items-center rounded-full border border-violet-100 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
        Transferencia
      </span>
    );
  }

  return <BadgePill tone="slate" label="Otro" />;
}

function TipoMovimientoBadge({ tipo }) {
  if (tipo === "ingreso") {
    return (
      <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
        Ingreso
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-rose-700">
      Egreso
    </span>
  );
}

function ModalCorteBase({ open, title, description, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Cerrar modal"
      />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            {description && (
              <p className="mt-1 text-[11px] leading-5 text-slate-500">{description}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function ModalEgresoCorte({ open, onClose, onSave }) {
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [tipo, setTipo] = useState("insumo");
  const [referencia, setReferencia] = useState("");

  useEffect(() => {
    if (!open) return;
    setConcepto("");
    setMonto("");
    setMetodoPago("efectivo");
    setTipo("insumo");
    setReferencia("");
  }, [open]);

  function handleSubmit(event) {
    event.preventDefault();
    const montoNumerico = Number(monto);

    if (!concepto.trim() || montoNumerico <= 0) return;

    onSave({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      concepto: concepto.trim(),
      referencia: referencia.trim(),
      monto: montoNumerico,
      metodo_pago: metodoPago,
      tipo,
      hora: corteHoraActual(),
    });

    onClose();
  }

  return (
    <ModalCorteBase
      open={open}
      title="Registrar egreso o insumo"
      description="Este movimiento se agregará a la hoja del corte y reducirá el total neto."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-600">
              Tipo
            </label>
            <select
              value={tipo}
              onChange={(event) => setTipo(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="insumo">Insumo</option>
              <option value="operativo">Gasto operativo</option>
              <option value="servicio">Servicio externo</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-600">
              Método de pago
            </label>
            <select
              value={metodoPago}
              onChange={(event) => setMetodoPago(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              {CORTE_METODOS.map((metodo) => (
                <option key={metodo.id} value={metodo.id}>
                  {metodo.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold text-slate-600">
            Insumo o concepto del egreso
          </label>
          <input
            type="text"
            required
            value={concepto}
            onChange={(event) => setConcepto(event.target.value)}
            placeholder="Ej. Electrodos, vendaje, papelería..."
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-600">
              Referencia o proveedor
            </label>
            <input
              type="text"
              value={referencia}
              onChange={(event) => setReferencia(event.target.value)}
              placeholder="Opcional"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-600">
              Monto del egreso
            </label>
            <div className="flex items-center rounded-xl border border-slate-300 px-3 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
              <span className="mr-2 text-xs text-slate-500">$</span>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={monto}
                onChange={(event) => setMonto(event.target.value)}
                placeholder="0.00"
                className="h-11 min-w-0 flex-1 bg-transparent text-xs text-slate-800 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Agregar a la hoja
          </button>
        </div>
      </form>
    </ModalCorteBase>
  );
}

function ModalProgramarCorte({ open, onClose, currentTime, onSave }) {
  const [time, setTime] = useState(currentTime || "20:00");

  useEffect(() => {
    if (open) setTime(currentTime || "20:00");
  }, [open, currentTime]);

  function handleSubmit(event) {
    event.preventDefault();
    onSave(time);
    onClose();
  }

  return (
    <ModalCorteBase
      open={open}
      title="Programar corte de caja"
      description="Define la hora prevista para realizar el cierre del día."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-slate-600">
            Hora programada
          </label>
          <input
            type="time"
            required
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-700"
          >
            <Clock3 className="h-4 w-4" />
            Guardar horario
          </button>
        </div>
      </form>
    </ModalCorteBase>
  );
}

function ModalCerrarCorte({ open, onClose, expectedCash, onConfirm }) {
  const [countedCash, setCountedCash] = useState("");
  const [observations, setObservations] = useState("");

  useEffect(() => {
    if (!open) return;
    setCountedCash("");
    setObservations("");
  }, [open]);

  const counted = Number(countedCash || 0);
  const difference = counted - expectedCash;

  function handleSubmit(event) {
    event.preventDefault();

    onConfirm({
      fecha_cierre: new Date().toISOString(),
      hora_cierre: corteHoraActual(),
      efectivo_esperado: expectedCash,
      efectivo_contado: counted,
      diferencia: difference,
      observaciones: observations.trim(),
    });

    onClose();
  }

  return (
    <ModalCorteBase
      open={open}
      title="Cerrar corte de caja"
      description="Cuenta físicamente el efectivo y confirma cualquier diferencia antes del cierre."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Efectivo esperado
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {money(expectedCash)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Diferencia
            </p>
            <p
              className={`mt-1 text-lg font-semibold ${
                difference === 0
                  ? "text-emerald-700"
                  : difference > 0
                    ? "text-blue-700"
                    : "text-red-600"
              }`}
            >
              {money(difference)}
            </p>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold text-slate-600">
            Efectivo contado
          </label>
          <div className="flex items-center rounded-xl border border-slate-300 px-3 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
            <span className="mr-2 text-xs text-slate-500">$</span>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={countedCash}
              onChange={(event) => setCountedCash(event.target.value)}
              placeholder="0.00"
              className="h-11 min-w-0 flex-1 bg-transparent text-xs text-slate-800 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold text-slate-600">
            Observaciones
          </label>
          <textarea
            value={observations}
            onChange={(event) => setObservations(event.target.value)}
            placeholder="Diferencias, retiros o aclaraciones..."
            rows={3}
            className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <CheckCircle2 className="h-4 w-4" />
            Confirmar cierre
          </button>
        </div>
      </form>
    </ModalCorteBase>
  );
}

function BarraFinanciera({ label, value, max, tone = "emerald", helper }) {
  const porcentaje = max > 0 ? Math.min((Math.abs(value) / max) * 100, 100) : 0;
  const colores = {
    emerald: "bg-emerald-500",
    rose: "bg-rose-500",
    violet: "bg-violet-500",
    blue: "bg-blue-500",
  };

  return (
    <div>
      <div className="mb-1.5 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold text-slate-700">{label}</p>
          {helper && <p className="text-[10px] text-slate-400">{helper}</p>}
        </div>
        <p className="text-xs font-bold text-slate-900">{money(value)}</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colores[tone]}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  );
}

function CorteCajaView() {
  const [date, setDate] = useState(corteFechaActual());
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("todos");

  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [expenses, setExpenses] = useState([]);
  const [initialCash, setInitialCash] = useState(0);
  const [cardCommissionPct, setCardCommissionPct] = useState(3.5);
  const [scheduledTime, setScheduledTime] = useState("20:00");
  const [closedCut, setClosedCut] = useState(null);

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);

  const expensesKey = `fisionerv:corte:egresos:${date}`;
  const configKey = `fisionerv:corte:config:${date}`;
  const closureKey = `fisionerv:corte:cierre:${date}`;

  useEffect(() => {
    const savedExpenses = leerLocalStorageCorte(expensesKey, []);
    const savedConfig = leerLocalStorageCorte(configKey, {
      initialCash: 0,
      cardCommissionPct: 3.5,
      scheduledTime: "20:00",
    });
    const savedClosure = leerLocalStorageCorte(closureKey, null);

    setExpenses(Array.isArray(savedExpenses) ? savedExpenses : []);
    setInitialCash(Number(savedConfig.initialCash || 0));
    setCardCommissionPct(Number(savedConfig.cardCommissionPct || 3.5));
    setScheduledTime(savedConfig.scheduledTime || "20:00");
    setClosedCut(savedClosure);
  }, [date, expensesKey, configKey, closureKey]);

  useEffect(() => {
    guardarLocalStorageCorte(expensesKey, expenses);
  }, [expenses, expensesKey]);

  useEffect(() => {
    guardarLocalStorageCorte(configKey, {
      initialCash,
      cardCommissionPct,
      scheduledTime,
    });
  }, [initialCash, cardCommissionPct, scheduledTime, configKey]);

  useEffect(() => {
    guardarLocalStorageCorte(closureKey, closedCut);
  }, [closedCut, closureKey]);

  async function loadPayments() {
    const token = localStorage.getItem("auth.access");

    if (!token) {
      setLoadError("No se encontró una sesión activa.");
      setLoadingPayments(false);
      return;
    }

    try {
      setLoadingPayments(true);
      setLoadError("");

      const response = await fetch(`${API_BASE}/api/pagos/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`No se pudieron cargar los pagos: ${response.status} ${text}`);
      }

      const data = await response.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("No se pudieron cargar los pagos para el corte:", error);
      setLoadError("No fue posible consultar los pagos del corte de caja.");
      setPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, []);

  const paymentsForDate = useMemo(
    () => payments.filter((payment) => payment.fecha_pago === date),
    [payments, date]
  );

  const totals = useMemo(() => {
    let totalBilled = 0;
    let grossIncome = 0;
    let cash = 0;
    let card = 0;
    let transfer = 0;
    let other = 0;

    paymentsForDate.forEach((payment) => {
      const income = Number(payment.anticipo || 0);
      const billed = Number(payment.monto_facturado || income || 0);
      const method = normalizarMetodoCorte(payment.metodo_pago);

      totalBilled += billed;
      grossIncome += income;

      if (method === "efectivo") cash += income;
      else if (method === "tarjeta") card += income;
      else if (method === "transferencia") transfer += income;
      else other += income;
    });

    const terminalCommission = card * (Number(cardCommissionPct || 0) / 100);
    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + Number(expense.monto || 0),
      0
    );
    const cashExpenses = expenses
      .filter((expense) => normalizarMetodoCorte(expense.metodo_pago) === "efectivo")
      .reduce((sum, expense) => sum + Number(expense.monto || 0), 0);

    const netIncome = grossIncome - terminalCommission - totalExpenses;
    const expectedCash = Number(initialCash || 0) + cash - cashExpenses;

    return {
      totalBilled,
      grossIncome,
      cash,
      card,
      transfer,
      other,
      terminalCommission,
      totalExpenses,
      cashExpenses,
      netIncome,
      expectedCash,
    };
  }, [paymentsForDate, expenses, cardCommissionPct, initialCash]);

  const movementRows = useMemo(() => {
    const incomeRows = paymentsForDate.map((payment) => {
      const income = Number(payment.anticipo || 0);
      const cost = Number(payment.monto_facturado || income || 0);
      const isCard = normalizarMetodoCorte(payment.metodo_pago) === "tarjeta";
      const commission = isCard ? income * (Number(cardCommissionPct || 0) / 100) : 0;

      return {
        id: `p-${payment.id}`,
        sourceId: payment.id,
        type: "ingreso",
        time: obtenerHoraMovimiento(
          payment.created_at || payment.updated_at || payment.fecha_pago
        ),
        client: payment.paciente_nombre || "Paciente",
        detail: payment.servicio_nombre || "Servicio",
        reference: payment.profesional_nombre || "Profesional",
        method: payment.metodo_pago,
        cost,
        expense: 0,
        commission,
        income,
        net: income - commission,
        deletable: false,
      };
    });

    const expenseRows = expenses.map((expense) => ({
      id: `e-${expense.id}`,
      sourceId: expense.id,
      type: "egreso",
      time: expense.hora || "--:--",
      client: expense.referencia || "—",
      detail: expense.concepto || "Insumo",
      reference: expense.tipo || "insumo",
      method: expense.metodo_pago,
      cost: 0,
      expense: Number(expense.monto || 0),
      commission: 0,
      income: 0,
      net: -Number(expense.monto || 0),
      deletable: true,
    }));

    const combined = [...incomeRows, ...expenseRows].sort((a, b) => {
      if (a.time === b.time) return a.type.localeCompare(b.type);
      if (a.time === "--:--") return 1;
      if (b.time === "--:--") return -1;
      return a.time.localeCompare(b.time);
    });

    let runningBalance = Number(initialCash || 0);

    return combined.map((row, index) => {
      runningBalance += row.net;
      return {
        ...row,
        rowNumber: index + 1,
        runningBalance,
      };
    });
  }, [paymentsForDate, expenses, cardCommissionPct, initialCash]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return movementRows.filter((row) => {
      const matchesSearch =
        !term ||
        row.client.toLowerCase().includes(term) ||
        row.detail.toLowerCase().includes(term) ||
        row.reference.toLowerCase().includes(term);

      const matchesMethod =
        methodFilter === "todos" ||
        normalizarMetodoCorte(row.method) === methodFilter;

      return matchesSearch && matchesMethod;
    });
  }, [movementRows, search, methodFilter]);

  const methodPie = useMemo(
    () => [
      { label: "Efectivo", value: totals.cash },
      { label: "Tarjeta", value: totals.card },
      { label: "Transferencia", value: totals.transfer },
      { label: "Otro", value: totals.other },
    ],
    [totals]
  );

  function addExpense(expense) {
    if (closedCut) return;
    setExpenses((previous) => [...previous, expense]);
  }

  function deleteExpense(id) {
    if (closedCut) return;
    if (!window.confirm("¿Deseas eliminar este egreso de la hoja de corte?")) return;
    setExpenses((previous) => previous.filter((expense) => expense.id !== id));
  }

  function confirmClosure(data) {
    setClosedCut({
      ...data,
      responsable: localStorage.getItem("auth.user") || "Administrador",
      total_facturado: totals.totalBilled,
      ingreso_bruto: totals.grossIncome,
      comision_terminal: totals.terminalCommission,
      egresos: totals.totalExpenses,
      ingreso_neto: totals.netIncome,
    });
  }

  function reopenCut() {
    if (!window.confirm("¿Deseas reabrir este corte de caja?")) return;
    setClosedCut(null);
  }

  function exportSpreadsheetCsv() {
    const headers = [
      "No.",
      "Hora",
      "Tipo",
      "Nombre del cliente / referencia",
      "Servicio / insumo",
      "Profesional / tipo",
      "Método de pago",
      "Costo",
      "Egreso - insumo",
      "Comisión terminal",
      "Total ingreso",
      "Total neto",
      "Saldo acumulado",
    ];

    const rows = movementRows.map((row) => [
      row.rowNumber,
      row.time,
      row.type === "ingreso" ? "Ingreso" : "Egreso",
      row.client,
      row.detail,
      row.reference,
      etiquetaMetodoCorte(row.method),
      Number(row.cost || 0).toFixed(2),
      Number(row.expense || 0).toFixed(2),
      Number(row.commission || 0).toFixed(2),
      Number(row.income || 0).toFixed(2),
      Number(row.net || 0).toFixed(2),
      Number(row.runningBalance || 0).toFixed(2),
    ]);

    rows.push([]);
    rows.push([
      "TOTALES",
      "",
      "",
      "",
      "",
      "",
      "",
      totals.totalBilled.toFixed(2),
      totals.totalExpenses.toFixed(2),
      totals.terminalCommission.toFixed(2),
      totals.grossIncome.toFixed(2),
      totals.netIncome.toFixed(2),
      (Number(initialCash || 0) + totals.netIncome).toFixed(2),
    ]);

    const escapeCell = (value) => {
      const text = String(value ?? "").replaceAll('"', '""');
      return `"${text}"`;
    };

    const csv =
      "\uFEFF" +
      [headers, ...rows]
        .map((row) => row.map(escapeCell).join(";"))
        .join("\r\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fisionerv-corte-caja-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const chartMaximum = Math.max(
    totals.grossIncome,
    totals.totalExpenses,
    totals.terminalCommission,
    Math.abs(totals.netIncome),
    1
  );

  return (
    <>
      <ModalEgresoCorte
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onSave={addExpense}
      />
      <ModalProgramarCorte
        open={scheduleModalOpen}
        currentTime={scheduledTime}
        onClose={() => setScheduleModalOpen(false)}
        onSave={setScheduledTime}
      />
      <ModalCerrarCorte
        open={closeModalOpen}
        expectedCash={totals.expectedCash}
        onClose={() => setCloseModalOpen(false)}
        onConfirm={confirmClosure}
      />

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50">
        <div className="flex min-h-16 shrink-0 flex-col gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                <FileSpreadsheet className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Corte de caja</h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Hoja de movimientos con ingresos, egresos, comisiones y saldo neto.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadPayments}
              disabled={loadingPayments}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loadingPayments ? "animate-spin" : ""}`} />
              Actualizar
            </button>

            <button
              type="button"
              onClick={exportSpreadsheetCsv}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              <Download className="h-4 w-4" />
              Exportar Excel
            </button>

            <button
              type="button"
              onClick={() => setExpenseModalOpen(true)}
              disabled={Boolean(closedCut)}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-violet-600 px-3 text-[11px] font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Egreso / insumo
            </button>

            {closedCut ? (
              <button
                type="button"
                onClick={reopenCut}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 text-[11px] font-semibold text-amber-800 hover:bg-amber-100"
              >
                <RefreshCw className="h-4 w-4" />
                Reabrir corte
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCloseModalOpen(true)}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-600 px-3 text-[11px] font-semibold text-white hover:bg-emerald-700"
              >
                <ReceiptText className="h-4 w-4" />
                Cerrar caja
              </button>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
            <FilterField label="Fecha del corte">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </FilterField>

            <FilterField label="Configuración de caja">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[10px] text-slate-500">Fondo inicial</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={Boolean(closedCut)}
                    value={initialCash}
                    onChange={(event) => setInitialCash(Number(event.target.value || 0))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-700 disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-slate-500">Comisión terminal %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    disabled={Boolean(closedCut)}
                    value={cardCommissionPct}
                    onChange={(event) => setCardCommissionPct(Number(event.target.value || 0))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-700 disabled:bg-slate-100"
                  />
                </div>
              </div>
            </FilterField>

            <FilterField label="Estado y programación">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  {closedCut ? (
                    <BadgePill tone="emerald" label={`Cerrado ${closedCut.hora_cierre || ""}`} />
                  ) : (
                    <BadgePill tone="amber" label="Caja abierta" />
                  )}
                  <p className="mt-2 text-[11px] text-slate-500">Próximo corte: {scheduledTime}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(true)}
                  disabled={Boolean(closedCut)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <Clock3 className="h-4 w-4" />
                  Programar
                </button>
              </div>
            </FilterField>
          </div>

          {loadError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
              {loadError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Total ingreso"
              value={money(totals.grossIncome)}
              helper={`${paymentsForDate.length} pagos cobrados`}
            />
            <KpiCard
              label="Egresos / insumos"
              value={money(totals.totalExpenses)}
              helper={`${expenses.length} movimientos de salida`}
            />
            <KpiCard
              label="Comisión terminal"
              value={money(totals.terminalCommission)}
              helper={`${Number(cardCommissionPct || 0).toFixed(2)}% sobre tarjeta`}
            />
            <KpiCard
              label="Total neto"
              value={money(totals.netIncome)}
              helper="Ingreso menos comisión y egresos"
              pill={closedCut ? "Corte cerrado" : null}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_1fr_1fr]">
            <SummaryCard
              title="Ingresos por método de pago"
              subtitle="Distribución del dinero recibido en el corte."
            >
              <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <PieChart items={methodPie} size={150} />
                <LegendList items={methodPie} />
              </div>
            </SummaryCard>

            <SummaryCard
              title="Ingresos, egresos y neto"
              subtitle="Comparación visual de los principales totales."
            >
              <div className="space-y-4 pt-1">
                <BarraFinanciera
                  label="Total ingreso"
                  value={totals.grossIncome}
                  max={chartMaximum}
                  tone="blue"
                />
                <BarraFinanciera
                  label="Egresos / insumos"
                  value={totals.totalExpenses}
                  max={chartMaximum}
                  tone="rose"
                />
                <BarraFinanciera
                  label="Comisión terminal"
                  value={totals.terminalCommission}
                  max={chartMaximum}
                  tone="violet"
                />
                <BarraFinanciera
                  label="Total neto"
                  value={totals.netIncome}
                  max={chartMaximum}
                  tone="emerald"
                />
              </div>
            </SummaryCard>

            <SummaryCard
              title="Conciliación de caja"
              subtitle="Efectivo físico esperado al momento del cierre."
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] text-slate-500">Fondo inicial</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{money(initialCash)}</p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                  <p className="text-[10px] text-emerald-700">Ventas en efectivo</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-800">+{money(totals.cash)}</p>
                </div>
                <div className="rounded-xl border border-rose-100 bg-rose-50 p-3">
                  <p className="text-[10px] text-rose-700">Egresos en efectivo</p>
                  <p className="mt-1 text-sm font-semibold text-rose-700">-{money(totals.cashExpenses)}</p>
                </div>
                <div className="rounded-xl border border-violet-100 bg-violet-50 p-3">
                  <p className="text-[10px] text-violet-700">Efectivo esperado</p>
                  <p className="mt-1 text-sm font-semibold text-violet-800">{money(totals.expectedCash)}</p>
                </div>
              </div>

              {closedCut && (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Corte conciliado por {closedCut.responsable}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-slate-500">Contado</p>
                      <p className="text-sm font-semibold text-slate-900">{money(closedCut.efectivo_contado)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500">Diferencia</p>
                      <p className={`text-sm font-semibold ${Number(closedCut.diferencia) === 0 ? "text-emerald-700" : "text-red-600"}`}>
                        {money(closedCut.diferencia)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </SummaryCard>
          </div>

          <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
            <div className="border-b border-emerald-800 bg-emerald-700 px-4 py-2.5 text-white">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-5 w-5" />
                  <div>
                    <h3 className="text-sm font-semibold">Hoja de movimientos del corte</h3>
                    <p className="text-[10px] text-emerald-100">
                      Ingresos y egresos integrados en una sola tabla tipo Excel.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="flex h-9 min-w-0 items-center rounded-lg border border-white/20 bg-white/10 px-3 sm:w-64">
                    <Search className="mr-2 h-4 w-4 text-emerald-100" />
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Buscar cliente, servicio o insumo"
                      className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-emerald-100/70"
                    />
                  </div>

                  <select
                    value={methodFilter}
                    onChange={(event) => setMethodFilter(event.target.value)}
                    className="h-9 rounded-lg border border-white/20 bg-emerald-800 px-3 text-xs text-white outline-none"
                  >
                    <option value="todos">Todos los métodos</option>
                    {CORTE_METODOS.map((method) => (
                      <option key={method.id} value={method.id}>{method.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="border-b border-slate-300 bg-slate-100 px-3 py-2">
              <div className="flex min-w-0 items-center gap-2 overflow-hidden rounded-md border border-slate-300 bg-white px-3 py-1.5">
                <span className="shrink-0 text-[10px] font-bold text-emerald-700">fx</span>
                <span className="h-4 w-px shrink-0 bg-slate-300" />
                <p className="truncate font-mono text-[10px] text-slate-600 sm:text-[11px]">
                  = TOTAL_INGRESO ({money(totals.grossIncome)}) - EGRESOS ({money(totals.totalExpenses)}) - COMISIÓN ({money(totals.terminalCommission)}) = TOTAL_NETO ({money(totals.netIncome)})
                </p>
              </div>
            </div>

            {loadingPayments ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Cargando hoja de movimientos...
              </div>
            ) : (
              <>
                <div className="hidden max-h-[560px] overflow-auto lg:block">
                  <table className="min-w-[1500px] border-separate border-spacing-0 text-left text-[11px]">
                    <thead className="sticky top-0 z-20">
                      <tr className="bg-slate-200 text-center font-mono text-[10px] font-bold text-slate-600">
                        <th className="sticky left-0 z-30 w-12 border-b border-r border-slate-300 bg-slate-200 px-2 py-1.5">#</th>
                        {[
                          "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"
                        ].map((letter) => (
                          <th key={letter} className="border-b border-r border-slate-300 px-3 py-1.5">{letter}</th>
                        ))}
                      </tr>
                      <tr className="bg-slate-100 font-semibold text-slate-700">
                        <th className="sticky left-0 z-30 border-b border-r border-slate-300 bg-slate-100 px-2 py-2 text-center">No.</th>
                        <th className="border-b border-r border-slate-300 px-3 py-2">Hora</th>
                        <th className="border-b border-r border-slate-300 px-3 py-2">Tipo</th>
                        <th className="min-w-[190px] border-b border-r border-slate-300 px-3 py-2">Nombre del cliente / referencia</th>
                        <th className="min-w-[210px] border-b border-r border-slate-300 px-3 py-2">Servicio / insumo</th>
                        <th className="min-w-[180px] border-b border-r border-slate-300 px-3 py-2">Profesional / tipo</th>
                        <th className="min-w-[145px] border-b border-r border-slate-300 px-3 py-2">Método de pago</th>
                        <th className="min-w-[110px] border-b border-r border-slate-300 px-3 py-2 text-right">Costo</th>
                        <th className="min-w-[125px] border-b border-r border-slate-300 px-3 py-2 text-right">Egreso / insumo</th>
                        <th className="min-w-[120px] border-b border-r border-slate-300 px-3 py-2 text-right">Comisión</th>
                        <th className="min-w-[120px] border-b border-r border-slate-300 px-3 py-2 text-right">Total ingreso</th>
                        <th className="min-w-[120px] border-b border-r border-slate-300 px-3 py-2 text-right">Total neto</th>
                        <th className="min-w-[130px] border-b border-slate-300 px-3 py-2 text-right">Saldo acumulado</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredRows.map((row) => (
                        <tr
                          key={row.id}
                          className={`${row.type === "egreso" ? "bg-rose-50/50" : "bg-white"} hover:bg-emerald-50/60`}
                        >
                          <td className="sticky left-0 z-10 border-b border-r border-slate-200 bg-slate-100 px-2 py-2 text-center font-mono text-slate-500">
                            {row.rowNumber}
                          </td>
                          <td className="border-b border-r border-slate-200 px-3 py-2 font-mono text-slate-600">{row.time}</td>
                          <td className="border-b border-r border-slate-200 px-3 py-2"><TipoMovimientoBadge tipo={row.type} /></td>
                          <td className="border-b border-r border-slate-200 px-3 py-2 font-medium text-slate-800">{row.client}</td>
                          <td className="border-b border-r border-slate-200 px-3 py-2 text-slate-700">
                            <div className="flex items-center justify-between gap-2">
                              <span>{row.detail}</span>
                              {row.deletable && (
                                <button
                                  type="button"
                                  onClick={() => deleteExpense(row.sourceId)}
                                  disabled={Boolean(closedCut)}
                                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-rose-100 hover:text-rose-600 disabled:opacity-30"
                                  title="Eliminar egreso"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="border-b border-r border-slate-200 px-3 py-2 text-slate-600">{row.reference}</td>
                          <td className="border-b border-r border-slate-200 px-3 py-2"><MetodoCorteBadge metodo={row.method} /></td>
                          <td className="border-b border-r border-slate-200 px-3 py-2 text-right font-mono text-slate-700">{row.cost ? money(row.cost) : "—"}</td>
                          <td className="border-b border-r border-slate-200 px-3 py-2 text-right font-mono font-semibold text-rose-600">{row.expense ? `-${money(row.expense)}` : "—"}</td>
                          <td className="border-b border-r border-slate-200 px-3 py-2 text-right font-mono text-violet-700">{row.commission ? `-${money(row.commission)}` : "—"}</td>
                          <td className="border-b border-r border-slate-200 px-3 py-2 text-right font-mono font-semibold text-blue-700">{row.income ? money(row.income) : "—"}</td>
                          <td className={`border-b border-r border-slate-200 px-3 py-2 text-right font-mono font-bold ${row.net >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                            {money(row.net)}
                          </td>
                          <td className="border-b border-slate-200 px-3 py-2 text-right font-mono font-bold text-slate-900">
                            {money(row.runningBalance)}
                          </td>
                        </tr>
                      ))}

                      {!filteredRows.length && (
                        <tr>
                          <td colSpan={13} className="px-4 py-10 text-center text-slate-400">
                            No hay movimientos que coincidan con los filtros.
                          </td>
                        </tr>
                      )}
                    </tbody>

                    <tfoot className="sticky bottom-0 z-20">
                      <tr className="bg-emerald-50 font-semibold text-slate-900">
                        <td className="sticky left-0 z-30 border-r border-t border-emerald-200 bg-emerald-100 px-2 py-3 text-center">Σ</td>
                        <td colSpan={6} className="border-r border-t border-emerald-200 px-3 py-3 text-right uppercase tracking-wide text-emerald-800">
                          Totales del corte
                        </td>
                        <td className="border-r border-t border-emerald-200 px-3 py-3 text-right font-mono">{money(totals.totalBilled)}</td>
                        <td className="border-r border-t border-emerald-200 px-3 py-3 text-right font-mono text-rose-700">-{money(totals.totalExpenses)}</td>
                        <td className="border-r border-t border-emerald-200 px-3 py-3 text-right font-mono text-violet-700">-{money(totals.terminalCommission)}</td>
                        <td className="border-r border-t border-emerald-200 px-3 py-3 text-right font-mono text-blue-700">{money(totals.grossIncome)}</td>
                        <td className="border-r border-t border-emerald-200 px-3 py-3 text-right font-mono text-emerald-700">{money(totals.netIncome)}</td>
                        <td className="border-t border-emerald-200 px-3 py-3 text-right font-mono">{money(Number(initialCash || 0) + totals.netIncome)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="space-y-3 p-3 lg:hidden">
                  {filteredRows.map((row) => (
                    <article
                      key={row.id}
                      className={`rounded-xl border p-3 ${row.type === "egreso" ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <TipoMovimientoBadge tipo={row.type} />
                            <span className="text-[10px] text-slate-400">#{row.rowNumber} · {row.time}</span>
                          </div>
                          <p className="mt-2 truncate text-xs font-semibold text-slate-800">{row.client}</p>
                          <p className="mt-1 text-[11px] text-slate-600">{row.detail}</p>
                        </div>
                        <p className={`shrink-0 text-sm font-bold ${row.net >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                          {money(row.net)}
                        </p>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-white/70 p-2 text-[10px]">
                        <div>
                          <p className="text-slate-400">Método</p>
                          <div className="mt-1"><MetodoCorteBadge metodo={row.method} /></div>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-400">Saldo</p>
                          <p className="mt-1 font-bold text-slate-800">{money(row.runningBalance)}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Total ingreso</p>
                          <p className="mt-1 font-semibold text-blue-700">{row.income ? money(row.income) : "—"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-400">Egreso / insumo</p>
                          <p className="mt-1 font-semibold text-rose-700">{row.expense ? `-${money(row.expense)}` : "—"}</p>
                        </div>
                      </div>

                      {row.deletable && (
                        <button
                          type="button"
                          onClick={() => deleteExpense(row.sourceId)}
                          disabled={Boolean(closedCut)}
                          className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-semibold text-rose-600 disabled:opacity-40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar egreso
                        </button>
                      )}
                    </article>
                  ))}

                  {!filteredRows.length && (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No hay movimientos que coincidan con los filtros.
                    </div>
                  )}
                </div>
              </>
            )}
          </section>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-semibold text-slate-700">Detalle de egresos e insumos</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Movimientos que reducen el total neto del corte.
                  </p>
                </div>
                <PackagePlus className="h-5 w-5 text-slate-400" />
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {expenses.map((expense) => (
                  <div key={expense.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-800">{expense.concepto}</p>
                        <p className="mt-1 truncate text-[10px] text-slate-500">
                          {expense.referencia || expense.tipo} · {expense.hora}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteExpense(expense.id)}
                        disabled={Boolean(closedCut)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-rose-100 hover:text-rose-600 disabled:opacity-30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-end justify-between gap-2">
                      <MetodoCorteBadge metodo={expense.metodo_pago} />
                      <p className="text-sm font-bold text-rose-700">-{money(expense.monto)}</p>
                    </div>
                  </div>
                ))}

                {!expenses.length && (
                  <div className="col-span-full rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center">
                    <Settings2 className="mx-auto h-6 w-6 text-slate-300" />
                    <p className="mt-2 text-xs text-slate-400">No hay egresos registrados en este corte.</p>
                  </div>
                )}
              </div>
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-emerald-600" />
                <div>
                  <h3 className="text-xs font-semibold text-slate-700">Resumen de fórmulas</h3>
                  <p className="text-[10px] text-slate-400">Cálculo automático del corte</p>
                </div>
              </div>

              <div className="mt-4 space-y-2 font-mono text-[10px]">
                <div className="rounded-lg bg-slate-50 p-2.5 text-slate-600">
                  INGRESO = {money(totals.grossIncome)}
                </div>
                <div className="rounded-lg bg-rose-50 p-2.5 text-rose-700">
                  EGRESOS = -{money(totals.totalExpenses)}
                </div>
                <div className="rounded-lg bg-violet-50 p-2.5 text-violet-700">
                  COMISIÓN = -{money(totals.terminalCommission)}
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
                  NETO = {money(totals.netIncome)}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}


// ============================================================================
// EXPORT PÚBLICO
// Administrativa.jsx sigue importando { SalesView } exactamente igual.
// ============================================================================
export function SalesView() {
  const [financeView, setFinanceView] = useState("ventas");

  const tabs = [
    { id: "ventas", label: "Ventas y estadísticas", Icon: BarChart3 },
    { id: "corte", label: "Corte de caja", Icon: ReceiptText },
  ];

  return (
    <div className="flex min-h-full flex-1 flex-col overflow-hidden bg-slate-50">
      <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex max-w-full items-center gap-2 overflow-x-auto">
          {tabs.map(({ id, label, Icon }) => {
            const active = financeView === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => setFinanceView(id)}
                className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border px-4 text-xs font-semibold transition ${
                  active
                    ? "border-violet-200 bg-violet-50 text-violet-700 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {financeView === "ventas" ? <SalesDashboardView /> : <CorteCajaView />}
      </div>
    </div>
  );
}
