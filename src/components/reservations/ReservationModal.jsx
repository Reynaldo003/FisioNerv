// /componentes/reservations/ReservationModal.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CreditCard,
  Landmark,
  Banknote,
  Check,
  UserPlus,
  MessageCircle,
  Download,
  X,
  Plus,
  Trash2,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

function durationToMinutes(durationStr) {
  if (!durationStr) return 60;
  const [h = "0", m = "0", s = "0"] = String(durationStr).split(":");
  return Number(h) * 60 + Number(m) + Number(s) / 60;
}

function getStatusColorClasses(status) {
  switch (status) {
    case "reservado":
      return "bg-blue-100 text-blue-900 border-blue-300";
    case "confirmado":
      return "bg-amber-100 text-amber-900 border-amber-300";
    case "completado":
      return "bg-emerald-100 text-emerald-900 border-emerald-300";
    case "cancelado":
      return "bg-red-100 text-red-900 border-red-300";
    default:
      return "bg-slate-100 text-slate-700 border-slate-300";
  }
}

function addMinutesToTime(timeStr, minutesToAdd) {
  if (!timeStr) return "08:00";
  const [h = "0", m = "0"] = String(timeStr).split(":");
  let total = Number(h) * 60 + Number(m) + Number(minutesToAdd || 0);
  if (total < 0) total = 0;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function getUserLabel(user) {
  if (!user) return "";
  const full = `${user.first_name || ""} ${user.last_name || ""}`.trim();
  return full || user.username;
}

function getPatientLabel(p) {
  if (!p) return "";
  const full = `${p.nombres} ${p.apellido_pat} ${p.apellido_mat || ""}`.trim();
  return full || `Paciente #${p.id}`;
}

function isoToDate(d) {
  const [y, m, day] = String(d).split("-").map(Number);
  return new Date(y, (m || 1) - 1, day || 1);
}

function dateToIso(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const DAYKEY_TO_JS = { D: 0, L: 1, M: 2, X: 3, J: 4, V: 5, S: 6 };

function buildRepeatDatesBySessions({
  startDateIso,
  repeatDays,
  repeatSessions,
  excludeStartDate,
}) {
  const start = isoToDate(startDateIso);
  const daysSet = new Set((repeatDays || []).map(String));
  const sessions = Math.max(0, Number(repeatSessions || 0));

  const targetJsDays = new Set(
    Array.from(daysSet)
      .map((k) => DAYKEY_TO_JS[k])
      .filter((v) => typeof v === "number")
  );
  if (targetJsDays.size === 0) return [];
  if (sessions <= 0) return [];

  const out = [];
  const maxIterations = 366 * 3;

  for (let i = 0; i < maxIterations; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);

    const iso = dateToIso(d);
    if (excludeStartDate && iso === startDateIso) continue;

    const jsDay = d.getDay();
    if (!targetJsDays.has(jsDay)) continue;

    out.push(iso);
    if (out.length >= sessions) break;
  }

  return out.sort((a, b) => a.localeCompare(b));
}

const PAYMENT_METHODS = [
  { id: "tarjeta", label: "Tarjeta", icon: CreditCard },
  { id: "transferencia", label: "Transferencia", icon: Landmark },
  { id: "efectivo", label: "Efectivo", icon: Banknote },
  { id: "otro", label: "Otro", icon: CreditCard },
];

function normalizePhoneMX(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("52") && digits.length >= 12) return digits;
  if (digits.length === 10) return `52${digits}`;
  return digits;
}

function MessageModal({ open, title, message, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-800">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center"
          >
            <X className="h-4 w-4 text-slate-600" />
          </button>
        </div>
        <div className="px-4 py-4 text-sm text-slate-700">{message}</div>
        <div className="px-4 py-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-md bg-violet-600 text-white text-sm hover:bg-violet-700"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ open, onClose, onConfirm }) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (open) setValue("");
  }, [open]);

  if (!open) return null;

  const ok = String(value || "").trim().toLowerCase() === "eliminar";

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Eliminar cita</div>
            <div className="text-[11px] text-slate-600">
              Escribe <span className="font-semibold">eliminar</span> para confirmar.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center"
            title="Cerrar"
          >
            <X className="h-4 w-4 text-slate-600" />
          </button>
        </div>

        <div className="px-4 py-4">
          <input
            autoFocus
            type="text"
            className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder='Escribe "eliminar"'
          />
          <p className="mt-2 text-[11px] text-slate-500">
            Esta acción no se puede deshacer.
          </p>
        </div>

        <div className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-md border border-slate-200 bg-white text-sm hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!ok}
            onClick={onConfirm}
            className="h-9 px-4 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-60"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReservationModal({
  appointment,
  preset,
  appointments,
  onClose,
  onSave,
  onDelete,
  onRefreshAppointment,
  onRequestCloseModal,
  allowSharedSlots = false,
}) {
  const isEditing = Boolean(appointment?.id);
  const today = new Date().toISOString().slice(0, 10);

  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [savingRepeat, setSavingRepeat] = useState(false);

  const [msg, setMsg] = useState({ open: false, title: "", message: "" });

  const [lastPagoId, setLastPagoId] = useState(null);
  const [paidFromBackend, setPaidFromBackend] = useState(0);

  const [patientQuery, setPatientQuery] = useState("");
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const patientBoxRef = useRef(null);

  // ✅ modal seguro para eliminar
  const [deleteOpen, setDeleteOpen] = useState(false);

  const initialDate = appointment?.date ?? preset?.date ?? today;
  const initialTime = appointment?.time ?? preset?.time ?? "08:00";

  const DAYS = [
    { k: "L", label: "Lun" },
    { k: "M", label: "Mar" },
    { k: "X", label: "Mie" },
    { k: "J", label: "Jue" },
    { k: "V", label: "Vie" },
    { k: "S", label: "Sab" },
  ];

  function toggleRepeatDay(dayKey) {
    setForm((prev) => {
      const set = new Set(prev.repeatDays || []);
      if (set.has(dayKey)) set.delete(dayKey);
      else set.add(dayKey);
      return { ...prev, repeatDays: Array.from(set) };
    });
  }

  const [form, setForm] = useState({
    id: appointment?.id ?? null,

    patientId: appointment?.patientId ?? null,
    patient: appointment?.patient ?? "",

    apellido_pat: appointment?.apellido_pat ?? "",
    apellido_mat: appointment?.apellido_mat ?? "",
    fecha_nac: appointment?.fecha_nac ?? "",
    genero: appointment?.genero ?? "",
    correo: appointment?.correo ?? "",
    telefono: appointment?.telefono ?? "",

    date: initialDate,
    time: initialTime,
    endTime: appointment?.endTime ?? "09:00",

    serviceId: appointment?.serviceId ?? null,
    professionalId: appointment?.professionalId ?? preset?.professionalId ?? null,

    price: appointment?.price ?? 0,
    discountPct: appointment?.discountPct ?? 0,

    comprobante: appointment?.comprobante ?? "",
    montoFacturado: appointment?.montoFacturado ?? 0,

    paymentLines: [{ method: "efectivo", amount: 0 }],

    status: appointment?.status ?? "reservado",
    notesInternal: appointment?.notesInternal ?? "",

    repeatEnabled: appointment?.repeatEnabled ?? false,
    repeatDays: appointment?.repeatDays ?? ["L", "M", "X", "J", "V", "S"],
    repeatWeeks: appointment?.repeatWeeks ?? 1,
    repeatSessions: appointment?.repeatSessions ?? 1,
  });

  useEffect(() => {
    const onDoc = (e) => {
      if (!patientBoxRef.current) return;
      if (!patientBoxRef.current.contains(e.target)) setPatientDropdownOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("auth.access");

    async function loadData() {
      try {
        setLoadingData(true);

        const [servicesResp, profsResp, patientsResp] = await Promise.all([
          fetch(`${API_BASE}/api/servicios/`),
          fetch(`${API_BASE}/api/profesionales/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/api/pacientes/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const servicesData = await servicesResp.json();
        const profsData = await profsResp.json();
        const patientsData = await patientsResp.json();

        setServices(servicesData);
        setProfessionals(profsData);
        setPatients(patientsData);

        setForm((prev) => {
          const serviceId = prev.serviceId ?? (servicesData[0]?.id ?? null);
          const professionalId = prev.professionalId ?? (profsData[0]?.id ?? null);

          const service =
            servicesData.find((s) => s.id === serviceId) || servicesData[0] || null;

          const durationMinutes = service
            ? durationToMinutes(service.duracion || service.duracion_str || service.duracion_text)
            : 60;

          const baseTime = prev.time || "08:00";
          const endTime = addMinutesToTime(baseTime, durationMinutes);

          const basePrice = prev.price || (service ? Number(service.precio) : 0);

          const patientId = prev.patientId ?? null;
          const p = patientsData.find((x) => x.id === patientId) || null;

          return {
            ...prev,
            serviceId: service ? service.id : serviceId,
            professionalId,
            price: basePrice,
            montoFacturado: prev.montoFacturado || basePrice,
            time: baseTime,
            endTime,
            ...(p && {
              patient: getPatientLabel(p),
              apellido_pat: p.apellido_pat || "",
              apellido_mat: p.apellido_mat || "",
              fecha_nac: p.fecha_nac || "",
              genero: p.genero || "",
              correo: p.correo || "",
              telefono: p.telefono || "",
            }),
          };
        });
      } catch (err) {
        console.error("Error cargando servicios/profesionales/pacientes:", err);
        setMsg({
          open: true,
          title: "Error",
          message: "No se pudieron cargar datos. Revisa consola.",
        });
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("auth.access");
    const citaId = appointment?.id;
    if (!token || !citaId) {
      setPaidFromBackend(0);
      return;
    }

    async function loadPayments() {
      try {
        const resp = await fetch(`${API_BASE}/api/pagos/?cita=${citaId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!resp.ok) {
          setPaidFromBackend(Number(appointment?.deposit || 0));
          return;
        }

        const data = await resp.json();
        const list = Array.isArray(data) ? data : data?.results || [];
        const sum = list.reduce((acc, p) => acc + Number(p?.anticipo || 0), 0);
        setPaidFromBackend(sum);
      } catch (e) {
        console.warn("No se pudieron cargar pagos previos:", e);
        setPaidFromBackend(Number(appointment?.deposit || 0));
      }
    }

    loadPayments();
  }, [appointment?.id]);

  useEffect(() => {
    setPatientQuery(form.patient || "");
  }, [form.patient]);

  const getSelectedServiceDurationMinutes = (serviceId) => {
    const s = (services || []).find((x) => Number(x.id) === Number(serviceId));
    return s ? durationToMinutes(s.duracion || s.duracion_str || s.duracion_text) : 60;
  };

  const handleChange = (field, value) => {
    if (field === "time") {
      const durationMinutes = getSelectedServiceDurationMinutes(form.serviceId);
      setForm((prev) => ({
        ...prev,
        time: value,
        endTime: addMinutesToTime(value, durationMinutes),
      }));
      return;
    }

    if (["price", "discountPct", "repeatWeeks", "repeatSessions", "montoFacturado"].includes(field)) {
      const num = value === "" ? "" : Number(value);
      setForm((prev) => ({ ...prev, [field]: num }));
      return;
    }

    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleServiceChange = (serviceIdStr) => {
    const serviceId = Number(serviceIdStr);
    const service = services.find((s) => s.id === serviceId);
    const durationMinutes = service
      ? durationToMinutes(service.duracion || service.duracion_str || service.duracion_text)
      : 60;

    setForm((prev) => {
      const newPrice = service ? Number(service.precio) : prev.price;
      return {
        ...prev,
        serviceId,
        price: newPrice,
        montoFacturado: newPrice,
        endTime: addMinutesToTime(prev.time, durationMinutes),
      };
    });
  };

  // ✅ no “busy”: multi-citas permitidas
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 7; h <= 21; h++) {
      const hh = String(h).padStart(2, "0");
      slots.push({ time: `${hh}:00`, busy: false });
    }
    return slots;
  }, []);

  const isNewPatient = !form.patientId && String(form.patient || "").trim().length > 0;

  const patientMatches = useMemo(() => {
    const q = String(patientQuery || "").trim().toLowerCase();
    if (!q) return [];
    return patients
      .map((p) => ({ p, label: getPatientLabel(p).toLowerCase() }))
      .filter((x) => x.label.includes(q))
      .slice(0, 8)
      .map((x) => x.p);
  }, [patients, patientQuery]);

  const selectExistingPatient = (p) => {
    setForm((prev) => ({
      ...prev,
      patientId: p.id,
      patient: getPatientLabel(p),
      apellido_pat: p.apellido_pat || "",
      apellido_mat: p.apellido_mat || "",
      fecha_nac: p.fecha_nac || "",
      genero: p.genero || "",
      correo: p.correo || "",
      telefono: p.telefono || "",
    }));
    setPatientQuery(getPatientLabel(p));
    setPatientDropdownOpen(false);
  };

  const markAsNewPatient = () => {
    setForm((prev) => ({ ...prev, patientId: null }));
    setPatientDropdownOpen(false);
  };

  const subtotal = Number(form.montoFacturado || form.price || 0);
  const discountPct = Number(form.discountPct || 0);
  const discountAmount = (subtotal * discountPct) / 100;
  const totalAfterDiscount = Math.max(0, subtotal - discountAmount);

  const amountToPayToday = useMemo(() => {
    return (form.paymentLines || []).reduce((acc, line) => acc + Number(line.amount || 0), 0);
  }, [form.paymentLines]);

  const totalPaidInternal = Number(paidFromBackend || 0) + Number(amountToPayToday || 0);
  const remainingInternal = Math.max(0, totalAfterDiscount - totalPaidInternal);

  function setPaymentLine(idx, patch) {
    setForm((prev) => {
      const lines = [...(prev.paymentLines || [])];
      lines[idx] = { ...lines[idx], ...patch };
      return { ...prev, paymentLines: lines };
    });
  }

  function addPaymentLine() {
    setForm((prev) => ({
      ...prev,
      paymentLines: [...(prev.paymentLines || []), { method: "efectivo", amount: 0 }],
    }));
  }

  function removePaymentLine(idx) {
    setForm((prev) => {
      const lines = [...(prev.paymentLines || [])];
      lines.splice(idx, 1);
      return {
        ...prev,
        paymentLines: lines.length ? lines : [{ method: "efectivo", amount: 0 }],
      };
    });
  }

  const buildPayload = (base, overrides = {}) => {
    const payload = { ...base, ...overrides };

    payload.repeatEnabled = Boolean(payload.repeatEnabled);
    payload.repeatWeeks = Math.max(1, Number(payload.repeatWeeks || 1));
    payload.repeatSessions = Math.max(1, Number(payload.repeatSessions || 1));
    payload.repeatDays = Array.isArray(payload.repeatDays) ? payload.repeatDays : [];

    if (!payload.patientId) payload.patientId = null;

    return payload;
  };

  async function createPaymentsForCita(citaId) {
    const token = localStorage.getItem("auth.access");
    const fechaPago = new Date().toISOString().slice(0, 10);

    const validLines = (form.paymentLines || [])
      .map((l) => ({ method: String(l.method || "efectivo"), amount: Number(l.amount || 0) }))
      .filter((l) => l.amount > 0);

    if (validLines.length === 0) {
      setLastPagoId(null);
      return null;
    }

    let lastId = null;

    for (const line of validLines) {
      const payloadPago = {
        cita: citaId,
        fecha_pago: fechaPago,
        comprobante: String(form.comprobante || ""),
        monto_facturado: Number(form.montoFacturado || form.price || 0),
        metodo_pago: line.method,
        descuento_porcentaje: Number(form.discountPct || 0),
        anticipo: Number(line.amount || 0),
      };

      const resp = await fetch(`${API_BASE}/api/pagos/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payloadPago),
      });

      if (!resp.ok) {
        let data = null;
        try {
          data = await resp.json();
        } catch { }
        console.error("Error creando pago:", resp.status, data);
        throw new Error("No se pudo registrar el pago. Revisa consola.");
      }

      const savedPago = await resp.json();
      lastId = savedPago?.id || lastId;
    }

    setLastPagoId(lastId);
    return lastId;
  }

  async function downloadTicket(pagoId) {
    if (!pagoId) return;
    const token = localStorage.getItem("auth.access");

    const resp = await fetch(`${API_BASE}/api/pagos/${pagoId}/ticket/`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!resp.ok) {
      setMsg({ open: true, title: "Ticket", message: "No se pudo generar el ticket. Revisa consola." });
      return;
    }

    const blob = await resp.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `ticket_pago_${pagoId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  function openWhatsAppConfirm() {
    const phone = normalizePhoneMX(form.telefono);
    if (!phone) {
      setMsg({ open: true, title: "WhatsApp", message: "Este paciente no tiene teléfono válido." });
      return;
    }

    const service = services.find((s) => s.id === form.serviceId);
    const serviceName = service?.nombre || "tu servicio";

    const dateObj = isoToDate(form.date);
    const dateLong = dateObj
      .toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      .replace(/^\w/, (c) => c.toUpperCase());

    const text = encodeURIComponent(
      `Hola ${form.patient || ""}. Te confirmo tu cita de ${serviceName} el ${dateLong} a las ${form.time}.`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.patientId && !String(form.patient || "").trim()) {
      setMsg({
        open: true,
        title: "Validación",
        message: "Escribe el nombre del paciente o selecciona uno existente.",
      });
      return;
    }

    try {
      setSavingRepeat(true);

      const durationMinutes = getSelectedServiceDurationMinutes(form.serviceId);
      const fixed = { ...form, endTime: addMinutesToTime(form.time, durationMinutes) };

      const basePayload = buildPayload(fixed);
      const savedBase = await onSave?.(basePayload);

      const savedCitaId = savedBase?.id || savedBase?.cita_id || savedBase?.pk;
      if (!savedCitaId) throw new Error("El backend no devolvió el ID de la cita guardada.");

      const pagoId = await createPaymentsForCita(savedCitaId);
      const refreshed = await onRefreshAppointment?.(savedCitaId);

      const paidNow = Boolean(refreshed?.pagado) || Boolean(refreshed?.paid) || remainingInternal <= 0;

      if (paidNow && pagoId) {
        await downloadTicket(pagoId);
      }

      if (form.repeatEnabled) {
        const totalSessions = Math.max(1, Number(form.repeatSessions || 1));
        const sessionsToCreate = Math.max(0, totalSessions - 1);

        const repeatDates = buildRepeatDatesBySessions({
          startDateIso: form.date,
          repeatDays: form.repeatDays,
          repeatSessions: sessionsToCreate,
          excludeStartDate: true,
        });

        const savedPatientId = savedBase?.paciente ?? basePayload.patientId ?? null;

        let created = 0;
        for (const date of repeatDates) {
          const nextPayload = buildPayload({ ...basePayload, id: null, date, patientId: savedPatientId }, {});
          await onSave?.(nextPayload);
          created++;
        }

        setMsg({
          open: true,
          title: "Listo",
          message: `Cita guardada. Se crearon ${created} sesiones repetidas.`,
        });
      } else {
        setMsg({
          open: true,
          title: "Listo",
          message: pagoId
            ? (paidNow ? "Cita guardada y PAGO COMPLETADO." : "Cita guardada y pago registrado.")
            : "Cita guardada correctamente.",
        });
      }

      onRequestCloseModal?.();
    } catch (err) {
      console.error(err);
      setMsg({ open: true, title: "Error", message: err?.message || "Ocurrió un error al guardar." });
    } finally {
      setSavingRepeat(false);
    }
  };

  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl px-6 py-4 shadow-xl text-sm text-slate-600">
          Cargando datos de servicios y profesionales...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-3 sm:p-6">
        <div className="absolute inset-0" onClick={onClose} />

        <div className="relative z-10 w-[min(96vw,980px)] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="flex flex-col max-h-[90vh]">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex items-start justify-between bg-slate-50 gap-3">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-slate-800 truncate">
                  {isEditing ? `Editar cita de ${form.patient || "paciente"}` : "Nueva cita"}
                </h2>
                <p className="text-xs text-slate-500">Paciente, servicio, horario, pagos y notas.</p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  className={
                    "hidden sm:inline-flex items-center text-[11px] font-medium px-2 py-1 rounded-full border " +
                    getStatusColorClasses(form.status)
                  }
                  value={form.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                >
                  <option value="reservado">Reservado / nuevo</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="completado">Sí asistió</option>
                  <option value="cancelado">No asistió</option>
                </select>

                <button
                  type="button"
                  onClick={onClose}
                  className="h-8 w-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:bg-slate-100"
                  title="Cerrar"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} autoComplete="off" className="px-4 sm:px-6 py-4 space-y-4 overflow-y-auto">
              {/* Paciente */}
              <div className="border border-slate-200 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold text-slate-600">Datos del paciente</p>

                  {form.patientId ? (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800">
                      <Check className="h-3.5 w-3.5" />
                      Existente
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border border-slate-200 bg-white text-slate-600">
                      <UserPlus className="h-3.5 w-3.5" />
                      Nuevo (si no seleccionas)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2" ref={patientBoxRef}>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Paciente (escribe para buscar)
                    </label>

                    <div className="relative">
                      <input
                        type="text"
                        name="paciente_no_autofill"
                        autoComplete="off"
                        className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        value={patientQuery}
                        onChange={(e) => {
                          const v = e.target.value;
                          setPatientQuery(v);
                          setPatientDropdownOpen(true);
                          setForm((prev) => ({ ...prev, patientId: null, patient: v }));
                        }}
                        onFocus={() => setPatientDropdownOpen(true)}
                        placeholder="Ej. Juan Pérez..."
                      />

                      {patientDropdownOpen && patientQuery.trim() && (
                        <div className="absolute z-20 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg overflow-hidden">
                          {patientMatches.length > 0 ? (
                            <>
                              <div className="max-h-56 overflow-auto">
                                {patientMatches.map((p) => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      selectExistingPatient(p);
                                    }}
                                  >
                                    <div className="font-medium text-slate-800">{getPatientLabel(p)}</div>
                                    <div className="text-[11px] text-slate-500">
                                      {p.telefono || "Sin teléfono"} · {p.correo || "Sin correo"}
                                    </div>
                                  </button>
                                ))}
                              </div>

                              <div className="border-t border-slate-200 bg-slate-50 px-3 py-2">
                                <button
                                  type="button"
                                  className="text-[11px] text-slate-700 hover:underline"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    markAsNewPatient();
                                  }}
                                >
                                  Usar como paciente nuevo aunque existan coincidencias
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="px-3 py-3 text-sm text-slate-600">
                              No hay coincidencias. Se registrará como paciente nuevo.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-500 mt-1">
                      Si seleccionas un paciente del desplegable, se usa el existente. Si no, se creará uno nuevo.
                    </p>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Teléfono</label>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="telefono_no_autofill"
                        autoComplete="off"
                        className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                        value={form.telefono}
                        onChange={(e) => handleChange("telefono", e.target.value)}
                      />

                      <button
                        type="button"
                        onClick={openWhatsAppConfirm}
                        className="shrink-0 h-10 w-10 rounded-md border border-slate-200 hover:bg-slate-50 flex items-center justify-center"
                        title="Confirmar por WhatsApp"
                      >
                        <MessageCircle className="h-5 w-5 text-emerald-600" />
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Correo</label>
                    <input
                      type="email"
                      name="correo_no_autofill"
                      autoComplete="off"
                      className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                      value={form.correo}
                      onChange={(e) => handleChange("correo", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Género</label>
                    <input
                      type="text"
                      name="genero_no_autofill"
                      autoComplete="off"
                      className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                      value={form.genero}
                      onChange={(e) => handleChange("genero", e.target.value)}
                    />
                  </div>
                </div>

                {isNewPatient && (
                  <div className="mt-2 rounded-xl border border-violet-200 bg-violet-50 p-3">
                    <p className="text-[11px] font-semibold text-violet-800">Datos para paciente nuevo</p>

                    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Apellido paterno</label>
                        <input
                          type="text"
                          autoComplete="off"
                          name="ap_pat_no_autofill"
                          className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                          value={form.apellido_pat}
                          onChange={(e) => handleChange("apellido_pat", e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Apellido materno</label>
                        <input
                          type="text"
                          autoComplete="off"
                          name="ap_mat_no_autofill"
                          className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                          value={form.apellido_mat}
                          onChange={(e) => handleChange("apellido_mat", e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Fecha de nacimiento</label>
                        <input
                          type="date"
                          autoComplete="off"
                          name="fecha_nac_no_autofill"
                          className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                          value={form.fecha_nac}
                          onChange={(e) => handleChange("fecha_nac", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Detalles */}
              <div className="border border-slate-200 rounded-xl p-3 space-y-3">
                <p className="text-[11px] font-semibold text-slate-600">Detalles de la cita</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Servicio</label>
                    <select
                      className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                      value={form.serviceId ?? ""}
                      onChange={(e) => handleServiceChange(e.target.value)}
                    >
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Profesional</label>
                    <select
                      className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                      value={form.professionalId ?? ""}
                      onChange={(e) => handleChange("professionalId", Number(e.target.value))}
                    >
                      {professionals.map((p) => (
                        <option key={p.id} value={p.id}>
                          {getUserLabel(p) || `Profesional #${p.id}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Fecha</label>
                    <input
                      type="date"
                      autoComplete="off"
                      name="fecha_cita_no_autofill"
                      className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                      value={form.date}
                      onChange={(e) => handleChange("date", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Hora inicio (por hora)</label>
                    <select
                      className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                      value={form.time}
                      onChange={(e) => handleChange("time", e.target.value)}
                    >
                      {timeSlots.map((slot) => (
                        <option key={slot.time} value={slot.time}>
                          {slot.time}
                        </option>
                      ))}
                    </select>

                    <p className="text-[10px] text-slate-500 mt-1">
                      Se permiten múltiples citas dentro de la misma hora desde el panel administrativo.
                    </p>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Hora termina</label>
                    <input
                      type="time"
                      autoComplete="off"
                      name="hora_fin_no_autofill"
                      className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-slate-50 text-slate-600 cursor-not-allowed"
                      value={form.endTime}
                      readOnly
                      disabled
                      title="Se calcula automáticamente por duración del servicio"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Se calcula automático: inicio + duración del servicio.
                    </p>
                  </div>
                </div>
              </div>

              {/* Repetición */}
              <div className="border border-slate-200 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-slate-600">Repetición</p>

                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(form.repeatEnabled)}
                      onChange={(e) => handleChange("repeatEnabled", e.target.checked)}
                    />
                    Repetir cita
                  </label>
                </div>

                {form.repeatEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Días (L–S)</label>

                      <div className="flex gap-2 flex-wrap">
                        {DAYS.map((d) => {
                          const active = (form.repeatDays || []).includes(d.k);
                          return (
                            <button
                              key={d.k}
                              type="button"
                              onClick={() => toggleRepeatDay(d.k)}
                              className={
                                "h-9 px-3 rounded-lg border text-xs font-semibold " +
                                (active
                                  ? "bg-violet-600 text-white border-violet-600"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50")
                              }
                            >
                              {d.label}
                            </button>
                          );
                        })}
                      </div>

                      <p className="text-[10px] text-slate-500 mt-1">
                        ✅ “Sesiones” manda: se crean las siguientes N sesiones según los días elegidos.
                      </p>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Semanas</label>
                      <input
                        type="number"
                        min={1}
                        max={52}
                        className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                        value={form.repeatWeeks}
                        onChange={(e) => handleChange("repeatWeeks", Number(e.target.value || 1))}
                      />
                      <p className="text-[10px] text-slate-500 mt-1">Solo referencia.</p>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Sesiones (total)</label>
                      <input
                        type="number"
                        min={1}
                        max={200}
                        className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                        value={form.repeatSessions}
                        onChange={(e) => handleChange("repeatSessions", Number(e.target.value || 1))}
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Ej: si pones 4, se guarda esta cita + 3 siguientes.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Pago */}
              <div className="border border-slate-200 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold text-slate-600">Pago</p>

                  {lastPagoId && (
                    <button
                      type="button"
                      onClick={() => downloadTicket(lastPagoId)}
                      className="h-9 px-3 rounded-md border border-slate-200 hover:bg-slate-50 text-sm flex items-center gap-2"
                      title="Descargar ticket PDF"
                    >
                      <Download className="h-4 w-4" />
                      Ticket
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Precio</label>
                    <input
                      type="number"
                      autoComplete="off"
                      name="precio_no_autofill"
                      className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                      value={form.price}
                      onChange={(e) => handleChange("price", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Monto a facturar</label>
                    <input
                      type="number"
                      autoComplete="off"
                      className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                      value={form.montoFacturado}
                      onChange={(e) => handleChange("montoFacturado", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Descuento %</label>
                    <input
                      type="number"
                      autoComplete="off"
                      name="descuento_no_autofill"
                      className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                      value={form.discountPct}
                      onChange={(e) => handleChange("discountPct", e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Nº comprobante</label>
                    <input
                      type="text"
                      autoComplete="off"
                      className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                      value={form.comprobante}
                      onChange={(e) => handleChange("comprobante", e.target.value)}
                      placeholder="Opcional"
                    />
                  </div>

                  <div className="md:col-span-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[11px] font-semibold text-slate-600">
                        Cantidad que se paga (puede ser múltiple)
                      </div>
                      <button
                        type="button"
                        onClick={addPaymentLine}
                        className="h-8 px-3 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-sm flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Agregar método
                      </button>
                    </div>

                    <div className="mt-3 grid gap-2">
                      {(form.paymentLines || []).map((line, idx) => (
                        <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_140px_44px] gap-2 items-center">
                          <select
                            className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white"
                            value={line.method}
                            onChange={(e) => setPaymentLine(idx, { method: e.target.value })}
                          >
                            {PAYMENT_METHODS.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.label}
                              </option>
                            ))}
                          </select>

                          <input
                            type="number"
                            min={0}
                            className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white"
                            value={line.amount}
                            onChange={(e) => setPaymentLine(idx, { amount: Number(e.target.value || 0) })}
                            placeholder="Monto"
                          />

                          <button
                            type="button"
                            onClick={() => removePaymentLine(idx)}
                            className="h-10 w-10 rounded-md border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center"
                            title="Quitar"
                          >
                            <Trash2 className="h-4 w-4 text-slate-600" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
                      <div>
                        <div className="font-semibold">Total (con descuento)</div>
                        <div>${totalAfterDiscount.toFixed(2)}</div>
                      </div>

                      <div>
                        <div className="font-semibold">Cantidad a pagar (hoy)</div>
                        <div>${Number(amountToPayToday || 0).toFixed(2)}</div>
                      </div>

                      <div>
                        <div className="font-semibold">Descuento</div>
                        <div>-${discountAmount.toFixed(2)}</div>
                      </div>

                      <div className="sm:col-span-3 text-[10px] text-slate-500">
                        Si el pago completa el total, el ticket se descargará automáticamente al guardar.
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Notas internas</label>
                    <textarea
                      autoComplete="off"
                      name="notas_no_autofill"
                      className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 min-h-[80px]"
                      value={form.notesInternal}
                      onChange={(e) => handleChange("notesInternal", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 gap-2">
                <div className="flex items-center gap-2">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => setDeleteOpen(true)}
                      className="h-10 px-4 rounded-md border border-red-200 text-red-700 hover:bg-red-50 text-sm"
                      disabled={savingRepeat}
                    >
                      Eliminar
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={savingRepeat}
                  className="h-10 px-6 rounded-md bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-60"
                >
                  {savingRepeat ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <MessageModal
        open={msg.open}
        title={msg.title}
        message={msg.message}
        onClose={() => setMsg({ open: false, title: "", message: "" })}
      />

      <ConfirmDeleteModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          setDeleteOpen(false);
          onDelete?.(form.id);
        }}
      />
    </>
  );
}