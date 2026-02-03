// src/components/layout/sales/SalesView.jsx
import { useEffect, useState } from "react";
import {
  FilterField,
  KpiCard,
  SummaryCard,
  DonutValue,
  BarList,
} from "./SummaryParts";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

// Modal para ver y editar el detalle de un pago
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
          <h3 className="text-sm font-semibold text-slate-800">
            Editar pago #{payment.id}
          </h3>
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
            <span className="font-semibold text-slate-600">Paciente:</span>{" "}
            {payment.paciente_nombre}
          </p>
          <p>
            <span className="font-semibold text-slate-600">Servicio:</span>{" "}
            {payment.servicio_nombre}
          </p>
          <p>
            <span className="font-semibold text-slate-600">Fecha cita:</span>{" "}
            {payment.fecha_cita}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 text-[11px]">
          <div>
            <label className="block font-semibold text-slate-600 mb-1">
              Fecha de pago
            </label>
            <input
              type="date"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs"
              value={form.fecha_pago}
              onChange={(e) => handleChange("fecha_pago", e.target.value)}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">
              Método de pago
            </label>
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
            <label className="block font-semibold text-slate-600 mb-1">
              Nº comprobante de pago
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs"
              value={form.comprobante}
              onChange={(e) => handleChange("comprobante", e.target.value)}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">
              Monto facturado (total de la cita)
            </label>
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
              <label className="block font-semibold text-slate-600 mb-1">
                Descuento (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs"
                value={form.descuento_porcentaje}
                onChange={(e) =>
                  handleChange("descuento_porcentaje", e.target.value)
                }
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Monto de este pago
              </label>
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
              <span className="text-[10px] text-slate-500 mt-1">
                Se recalculará al guardar cambios.
              </span>
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

export function SalesView() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("auth.access");
    async function loadData() {
      try {
        setLoading(true);

        const [statsResp, paymentsResp] = await Promise.all([
          fetch(`${API_BASE}/api/dashboard-stats/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE}/api/pagos/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const statsData = await statsResp.json();
        setStats(statsData);

        if (paymentsResp.ok) {
          const paymentsData = await paymentsResp.json();
          setPayments(paymentsData);
        } else {
          console.error("No se pudo cargar /api/pagos/ (quizá aún no existe)");
          setPayments([]);
        }
      } catch (err) {
        console.error("Error cargando estadísticas o pagos:", err);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !stats) {
    return (
      <main className="flex-1 flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Cargando estadísticas de ventas...
        </p>
      </main>
    );
  }

  // ====== Transformaciones de datos ======

  const totalAsistencias =
    stats.status_breakdown.find((s) => s.estado === "completado")?.count || 0;

  const totalIngresos = stats.revenue_by_service.reduce(
    (acc, s) => acc + Number(s.total || 0),
    0,
  );

  const revenueItems = stats.revenue_by_service.map((s) => ({
    label: s.servicio__nombre,
    value: Number(s.total || 0),
  }));

  const paymentItems = stats.payments_by_method.map((m) => ({
    label: m.metodo_pago || "Sin método",
    value: Number(m.total || 0),
  }));
  const totalPagado = paymentItems.reduce((acc, i) => acc + i.value, 0);

  const patientsItems = stats.patients_by_month.map((p) => ({
    label: new Date(p.period).toLocaleDateString("es-MX", {
      month: "short",
      year: "2-digit",
    }),
    value: p.total,
  }));
  const totalPacientesNuevos = patientsItems.reduce(
    (acc, p) => acc + p.value,
    0,
  );

  const attendanceMonthlyItems = stats.monthly_attendance.map((m) => ({
    label: new Date(m.period).toLocaleDateString("es-MX", {
      month: "short",
      year: "2-digit",
    }),
    value: m.total,
  }));

  const statusItems = stats.status_breakdown.map((s) => ({
    label: s.estado,
    value: s.count,
  }));

  // ====== Exportar pagos a CSV (para abrir en Excel) ======
  const handleExportPayments = () => {
    if (!payments.length) return;

    const headers = [
      "ID",
      "Fecha pago",
      "Fecha cita",
      "Paciente",
      "Servicio",
      "Método de pago",
      "Comprobante",
      "Descuento (%)",
      "Anticipo",
      "Monto facturado",
      "Restante",
    ];

    const rows = payments.map((p) => [
      p.id,
      p.fecha_pago,
      p.fecha_cita,
      p.paciente_nombre,
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
            .map((cell) =>
              typeof cell === "string" && cell.includes(",")
                ? `"${cell}"`
                : cell,
            )
            .join(","),
        )
        .join("\n") + "\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fisionerv-pagos.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      {/* Header */}
      <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">
            Estadísticas de pacientes y ventas
          </h2>
          <p className="text-xs text-slate-500">
            Asistencia, ingresos por servicio, altas de pacientes y métodos de
            pago.
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4 overflow-auto">
        {/* Filtros superiores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FilterField label="Rango de análisis">
            <p className="text-[11px] text-slate-500">
              Últimos 12 meses (definido en el backend).
            </p>
          </FilterField>
          <FilterField label="Sucursal">
            <p className="text-[11px] text-slate-500">
              Por ahora se muestra la clínica configurada en el backend.
            </p>
          </FilterField>
          <FilterField label="Profesional">
            <p className="text-[11px] text-slate-500">
              Próximamente podrás filtrar por terapeuta.
            </p>
          </FilterField>
        </div>

        {/* KPIs principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard
            label="Pacientes que asistieron (último año)"
            value={totalAsistencias}
            helper="Número de citas marcadas como completadas."
          />
          <KpiCard
            label="Ingresos totales (último año)"
            value={`$ ${totalIngresos.toFixed(2)}`}
            helper="Total facturado por citas (considerando descuentos)."
          />
          <KpiCard
            label="Pacientes nuevos (último año)"
            value={totalPacientesNuevos}
            helper="Altas de pacientes por fecha de registro."
          />
        </div>

        {/* Fila 2: métodos de pago + ingresos por servicio + altas por mes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SummaryCard
            title="Métodos de pago"
            subtitle="Distribución de los pagos registrados."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <DonutValue
                value={`$ ${totalPagado.toFixed(2)}`}
                label="Total pagado (último año)"
              />
              <BarList items={paymentItems} tone="emerald" />
            </div>
          </SummaryCard>

          <SummaryCard
            title="Ingresos por servicio"
            subtitle="Total facturado por cada tipo de servicio."
          >
            <BarList items={revenueItems} />
          </SummaryCard>

          <SummaryCard
            title="Pacientes dados de alta por mes"
            subtitle="Altas de pacientes en los últimos 12 meses."
          >
            <BarList items={patientsItems} tone="emerald" />
          </SummaryCard>
        </div>

        {/* Fila 3: asistencias mensuales + estados */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SummaryCard
            title="Asistencias por mes"
            subtitle="Citas completadas en los últimos 12 meses."
          >
            <BarList items={attendanceMonthlyItems} />
          </SummaryCard>

          <SummaryCard
            title="Resumen por estado de cita"
            subtitle="Reservado, confirmado, completado y cancelado."
          >
            <BarList items={statusItems} tone="emerald" />
          </SummaryCard>
        </div>

        {/* Tabla de pagos detallados */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold text-slate-700">
                Pagos registrados
              </h3>
              <p className="text-[11px] text-slate-500">
                Detalle de pagos por paciente, método de pago, descuento y
                montos.
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
                  <th className="px-3 py-1">Servicio</th>
                  <th className="px-3 py-1">Método</th>
                  <th className="px-3 py-1">Desc. (%)</th>
                  <th className="px-3 py-1">Anticipo</th>
                  <th className="px-3 py-1">Monto facturado</th>
                  <th className="px-3 py-1">Restante</th>
                  <th className="px-3 py-1 text-right">Opciones</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-3 py-3 text-center text-slate-500"
                    >
                      Aún no hay pagos registrados.
                    </td>
                  </tr>
                )}
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    className="bg-slate-50/60 hover:bg-slate-100 transition-colors"
                  >
                    <td className="px-3 py-1 rounded-l-md text-slate-500">
                      {p.id}
                    </td>
                    <td className="px-3 py-1">{p.fecha_pago}</td>
                    <td className="px-3 py-1">{p.paciente_nombre}</td>
                    <td className="px-3 py-1">{p.servicio_nombre}</td>
                    <td className="px-3 py-1">{p.metodo_pago}</td>
                    <td className="px-3 py-1">
                      {Number(p.descuento_porcentaje || 0).toFixed(1)}%
                    </td>
                    <td className="px-3 py-1">
                      ${Number(p.anticipo || 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-1">
                      ${Number(p.monto_facturado || 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-1">
                      ${Number(p.restante || 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-1 rounded-r-md text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedPayment(p)}
                        className="inline-flex items-center px-2 py-1 rounded-md border border-slate-300 text-[11px] text-slate-700 hover:bg-slate-100"
                      >
                        Ver / editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal detalle pago */}
      {selectedPayment && (
        <PaymentDetailModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onUpdated={(updated) => {
            setPayments((prev) =>
              prev.map((p) => (p.id === updated.id ? updated : p)),
            );
            setSelectedPayment(updated);
          }}
        />
      )}
    </main>
  );
}
