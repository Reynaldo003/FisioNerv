// src/components/layout/sales/SalesView.jsx
import { useEffect, useMemo, useState } from "react";
import { FilterField, KpiCard, SummaryCard, DonutValue, BarList } from "./SummaryParts";

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

function fmtPeriodLabel(periodStr, group) {
  // periodStr viene como ISO (por trunc)
  const d = new Date(periodStr);
  if (group === "day") {
    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
  }
  if (group === "week") {
    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
  }
  if (group === "year") {
    return String(d.getFullYear());
  }
  // month
  return d.toLocaleDateString("es-MX", { month: "short", year: "2-digit" });
}

// =======================
// Modal para editar pago
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
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
      <div className="absolute inset-0" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-2xl p-5 space-y-3 text-sm"
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

        <div className="space-y-1 text-[11px] border border-slate-100 rounded-md px-3 py-2 bg-slate-50">
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
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs"
              value={form.fecha_pago}
              onChange={(e) => handleChange("fecha_pago", e.target.value)}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Método de pago</label>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs bg-white"
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
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs"
              value={form.comprobante}
              onChange={(e) => handleChange("comprobante", e.target.value)}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Monto facturado (total de la cita)</label>
            <input
              type="number"
              min="0"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs"
              value={form.monto_facturado}
              onChange={(e) => handleChange("monto_facturado", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Descuento (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs"
                value={form.descuento_porcentaje}
                onChange={(e) => handleChange("descuento_porcentaje", e.target.value)}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Monto de este pago</label>
              <input
                type="number"
                min="0"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs"
                value={form.anticipo}
                onChange={(e) => handleChange("anticipo", e.target.value)}
              />
            </div>

            <div className="flex flex-col justify-center text-[11px] text-slate-700 bg-slate-50 rounded-md border border-slate-200 px-3 py-2">
              <span className="font-semibold">Restante actual:</span>
              <span>${Number(payment.restante || 0).toFixed(2)}</span>
              <span className="text-[10px] text-slate-500 mt-1">Se recalculará al guardar.</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            Cerrar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="text-xs px-4 py-2 rounded-md bg-violet-600 text-white font-medium hover:bg-violet-700 disabled:opacity-60"
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
                "text-[11px] px-3 py-1.5 rounded-md border transition " +
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
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs bg-white"
            value={fromKey}
            onChange={(e) => onChange({ fromKey: e.target.value, toKey })}
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Fecha fin</label>
          <input
            type="date"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs bg-white"
            value={toKey}
            onChange={(e) => onChange({ fromKey, toKey: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <select
          className="w-full sm:w-auto rounded-md border border-slate-300 px-3 py-2 text-xs bg-white"
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
          className="w-full sm:w-auto text-[11px] px-4 py-2 rounded-md bg-violet-600 text-white font-medium hover:bg-violet-700 disabled:opacity-60"
        >
          {applying ? "Aplicando..." : "Aplicar"}
        </button>
      </div>
    </div>
  );
}

export function SalesView() {
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [stats, setStats] = useState(null);

  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const [professionals, setProfessionals] = useState([]);
  const [professionalId, setProfessionalId] = useState(""); // "" = todos

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

  const handleExportPayments = () => {
    if (!filteredPayments.length) return;

    const headers = [
      "ID",
      "Fecha pago",
      "Fecha cita",
      "Paciente",
      "Profesional",
      "Servicio",
      "Método de pago",
      "Comprobante",
      "Descuento (%)",
      "Anticipo",
      "Monto facturado",
      "Restante",
    ];

    const rows = filteredPayments.map((p) => [
      p.id,
      p.fecha_pago,
      p.fecha_cita,
      p.paciente_nombre,
      p.profesional_nombre,
      p.servicio_nombre,
      p.metodo_pago,
      p.comprobante || "",
      p.descuento_porcentaje,
      Number(p.anticipo || 0).toFixed(2),
      Number(p.monto_facturado || 0).toFixed(2),
      Number(p.restante || 0).toFixed(2),
    ]);

    const csvContent =
      [headers, ...rows]
        .map((row) =>
          row
            .map((cell) => (typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell))
            .join(","),
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

  // ====== Datos para gráficas ======
  const paymentItems = (stats.payments_by_method || []).map((m) => ({
    label: m.metodo_pago || "Sin método",
    value: Number(m.total || 0),
  }));

  const serviceItems = (stats.revenue_by_service || []).map((s) => ({
    label: s.cita__servicio__nombre || "Servicio",
    value: Number(s.total || 0),
  }));

  const statusItems = (stats.status_breakdown || []).map((s) => ({
    label: s.estado,
    value: s.count,
  }));

  const attendanceItems = (stats.attendance_series || []).map((x) => ({
    label: fmtPeriodLabel(x.period, stats.group),
    value: x.total,
  }));

  const salesItems = (stats.sales_series || []).map((x) => ({
    label: fmtPeriodLabel(x.period, stats.group),
    value: Number(x.total_cobrado || 0),
  }));

  const monthlyIncomeItems = (stats.monthly_income || []).map((x) => ({
    label: fmtPeriodLabel(x.period, "month"),
    value: Number(x.total || 0),
  }));

  const patientStatusMap = (stats.patient_status_totals || []).reduce((acc, x) => {
    acc[x.estado_tratamiento] = Number(x.count || 0);
    return acc;
  }, {});
  const patientStatusItems = [
    { label: "En tratamiento", value: patientStatusMap.en_tratamiento || 0 },
    { label: "Dado de alta", value: patientStatusMap.alta || 0 },
  ];

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      {/* Header */}
      <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Ventas y estadísticas</h2>
          <p className="text-xs text-slate-500">
            Filtra por fechas y profesional. Puedes analizar fechas anteriores para comparar.
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4 overflow-auto">
        {/* Filtros superiores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs bg-white"
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
              Tip: usa &quot;Todos&quot; para ver global o selecciona un profesional para su desempeño.
            </p>
          </FilterField>
        </div>

        {/* KPIs principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard
            label="Ingresos cobrados"
            value={`$ ${totalCobrado.toFixed(2)}`}
            helper={`Rango: ${appliedRange.fromKey} → ${appliedRange.toKey}`}
          />
          <KpiCard
            label="Pagos registrados"
            value={totalPagos}
            helper="Número de pagos (ventas) en el rango."
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

        {/* Gráficas fila 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SummaryCard title="Métodos de pago" subtitle="Distribución del dinero cobrado.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <DonutValue value={`$ ${totalCobrado.toFixed(2)}`} label="Total cobrado (rango)" />
              <BarList items={paymentItems} tone="emerald" />
            </div>
          </SummaryCard>

          <SummaryCard title="Ingresos por servicio" subtitle="Cobrado por tipo de servicio.">
            <BarList items={serviceItems} />
          </SummaryCard>

          <SummaryCard title="Pacientes" subtitle="En tratamiento vs dados de alta (global).">
            <BarList items={patientStatusItems} tone="emerald" />
          </SummaryCard>
        </div>

        {/* Gráficas fila 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SummaryCard title="Ventas realizadas" subtitle="Cobrado por periodo (según agrupación).">
            <BarList items={salesItems} tone="emerald" />
          </SummaryCard>

          <SummaryCard title="Asistencias" subtitle="Citas completadas por periodo (según agrupación).">
            <BarList items={attendanceItems} />
          </SummaryCard>

          <SummaryCard title="Estado de cita" subtitle="Reservado, confirmado, completado y cancelado.">
            <BarList items={statusItems} />
          </SummaryCard>
        </div>

        {/* Gráfica ingresos mensuales */}
        <div className="grid grid-cols-1 gap-4">
          <SummaryCard title="Ingresos mensuales" subtitle="Total cobrado por mes (pagos).">
            <BarList items={monthlyIncomeItems} tone="emerald" />
          </SummaryCard>
        </div>

        {/* Tabla de ventas (pagos) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold text-slate-700">Registro de ventas (pagos)</h3>
              <p className="text-[11px] text-slate-500">
                Mostrando pagos desde {appliedRange.fromKey} hasta {appliedRange.toKey}.
              </p>
            </div>
            <button
              onClick={handleExportPayments}
              className="text-[11px] px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Exportar a Excel
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-[11px] text-left border-separate border-spacing-y-1">
              <thead>
                <tr className="text-slate-500">
                  <th className="px-3 py-1">ID</th>
                  <th className="px-3 py-1">Fecha pago</th>
                  <th className="px-3 py-1">Paciente</th>
                  <th className="px-3 py-1">Profesional</th>
                  <th className="px-3 py-1">Servicio</th>
                  <th className="px-3 py-1">Método</th>
                  <th className="px-3 py-1">Anticipo</th>
                  <th className="px-3 py-1">Monto facturado</th>
                  <th className="px-3 py-1">Restante</th>
                  <th className="px-3 py-1 text-right">Opciones</th>
                </tr>
              </thead>

              <tbody>
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="bg-slate-50/60 hover:bg-slate-100/70 rounded-md">
                    <td className="px-3 py-2">{p.id}</td>
                    <td className="px-3 py-2">{p.fecha_pago}</td>
                    <td className="px-3 py-2">{p.paciente_nombre}</td>
                    <td className="px-3 py-2">{p.profesional_nombre}</td>
                    <td className="px-3 py-2">{p.servicio_nombre}</td>
                    <td className="px-3 py-2">{p.metodo_pago}</td>
                    <td className="px-3 py-2">${Number(p.anticipo || 0).toFixed(2)}</td>
                    <td className="px-3 py-2">${Number(p.monto_facturado || 0).toFixed(2)}</td>
                    <td className="px-3 py-2">${Number(p.restante || 0).toFixed(2)}</td>

                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedPayment(p)}
                          className="text-[11px] px-3 py-1 rounded-md border border-slate-300 text-slate-700 hover:bg-white"
                        >
                          Ver / editar
                        </button>
                        <button
                          onClick={() => handleTicketPdf(p.id)}
                          className="text-[11px] px-3 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Ticket PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!filteredPayments.length && (
                  <tr>
                    <td colSpan={10} className="px-3 py-6 text-center text-slate-400">
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
    </main>
  );
}
