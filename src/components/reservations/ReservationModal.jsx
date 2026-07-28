//proyecto fisionerv
// /componentes/reservations/ReservationModal.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Banknote,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Download,
  Landmark,
  Mail,
  MessageCircle,
  NotebookPen,
  Phone,
  Plus,
  ReceiptText,
  Repeat2,
  Stethoscope,
  Trash2,
  UserPlus,
  UserRound,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "https://api.fisionerv.cloud";

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

/**
 * ✅ Input tipo texto pero solo números (permite vacío)
 * - No rompe la lógica (guardas Number() cuando corresponde)
 * - Evita que se vea "0" al inicio
 */
function onlyDigitsString(v) {
  return String(v ?? "").replace(/[^\d]/g, "");
}
function toNumberSafe(digitsStr, fallback = 0) {
  if (digitsStr === "" || digitsStr == null) return fallback;
  const n = Number(digitsStr);
  return Number.isFinite(n) ? n : fallback;
}

function onlyMoneyString(value) {
  const normalized = String(value ?? "")
    .replace(/,/g, ".")
    .replace(/[^\d.]/g, "");

  const [integer = "", ...decimals] = normalized.split(".");
  const decimal = decimals.join("").slice(0, 2);
  return normalized.includes(".") ? `${integer}.${decimal}` : integer;
}

function onlyPercentageString(value) {
  const sanitized = onlyMoneyString(value);
  if (sanitized === "") return "";
  return String(Math.min(100, Math.max(0, Number(sanitized) || 0)));
}

function normalizeGender(value) {
  const gender = String(value || "").trim().toLowerCase();
  if (["m", "masculino", "hombre", "male"].includes(gender)) return "masculino";
  if (["f", "femenino", "mujer", "female"].includes(gender)) return "femenino";
  if (["otro", "otros", "no binario", "no_binario", "other"].includes(gender)) return "otro";
  return "";
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function MessageModal({ open, title, message, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={onClose} />
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
            className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Entendido
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
  function getLocalDateMX() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const today = getLocalDateMX();

  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [savingRepeat, setSavingRepeat] = useState(false);

  const [msg, setMsg] = useState({ open: false, title: "", message: "" });
  const [activeSection, setActiveSection] = useState("paciente");

  const [lastPagoId, setLastPagoId] = useState(null);
  const [paidFromBackend, setPaidFromBackend] = useState(0);

  const [patientQuery, setPatientQuery] = useState("");
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const patientBoxRef = useRef(null);
  const originalPaymentLinesRef = useRef([]);

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

  function mapPagoApiToPaymentLine(pago) {
    return {
      id: pago?.id ?? null,
      method: String(pago?.metodo_pago || "efectivo"),
      amount: pago?.anticipo ? String(Number(pago.anticipo)) : "",
      isPersisted: true,
    };
  }
  function buildInitialForm({ appointment, preset, today }) {
    const initialDate = appointment?.date ?? preset?.date ?? today;
    const initialTime = appointment?.time ?? preset?.time ?? "08:00";

    const priceDigits = appointment?.price ? String(Number(appointment.price)) : "";
    const discountDigits = appointment?.discountPct ? String(Number(appointment.discountPct)) : "";
    const factDigits = appointment?.montoFacturado
      ? String(Number(appointment.montoFacturado))
      : appointment?.price
        ? String(Number(appointment.price))
        : "";

    return {
      id: appointment?.id ?? null,

      patientId: appointment?.patientId ?? null,
      patient: appointment?.patient ?? "",

      apellido_pat: appointment?.apellido_pat ?? "",
      apellido_mat: appointment?.apellido_mat ?? "",
      fecha_nac: appointment?.fecha_nac ?? "",
      genero: normalizeGender(appointment?.genero),
      correo: appointment?.correo ?? "",
      telefono: appointment?.telefono ?? "",
      molestia: appointment?.molestia ?? "",

      date: initialDate,
      time: initialTime,
      endTime: appointment?.endTime ?? "09:00",

      serviceId: appointment?.serviceId ?? null,
      professionalId: appointment?.professionalId ?? preset?.professionalId ?? null,

      price: priceDigits,
      discountPct: discountDigits,
      montoFacturado: factDigits,
      comprobante: appointment?.comprobante ?? "",

      paymentLines: [{ id: null, method: "efectivo", amount: "", isPersisted: false }],

      status: appointment?.status ?? "reservado",
      notesInternal: appointment?.notesInternal ?? "",

      repeatEnabled: Boolean(appointment?.repeatEnabled) || false,
      repeatDays: appointment?.repeatDays ?? ["L", "M", "X", "J", "V", "S"],
      repeatWeeks: String(Number(appointment?.repeatWeeks ?? 1)),
      repeatSessions: String(Number(appointment?.repeatSessions ?? 1)),
    };
  }
  const [form, setForm] = useState(() => buildInitialForm({ appointment, preset, today }));

  useEffect(() => {
    setForm(buildInitialForm({ appointment, preset, today }));
    setPatientQuery(appointment?.patient ?? "");
    setPatientDropdownOpen(false);
    setActiveSection("paciente");
    setLastPagoId(null);
    setPaidFromBackend(0);
    originalPaymentLinesRef.current = [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment?.id, preset?.date, preset?.time, preset?.professionalId]);

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

          const servicePrice = service ? Number(service.precio) : 0;
          const basePriceNum = prev.price === "" ? servicePrice : toNumberSafe(prev.price, servicePrice);

          const patientId = prev.patientId ?? null;
          const p = patientsData.find((x) => x.id === patientId) || null;

          return {
            ...prev,
            serviceId: service ? service.id : serviceId,
            professionalId,
            // ✅ mantener strings pero recalcular si está vacío
            price: prev.price === "" ? String(Math.max(0, basePriceNum || 0)) : prev.price,
            montoFacturado:
              prev.montoFacturado === ""
                ? String(Math.max(0, basePriceNum || 0))
                : prev.montoFacturado,
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
      originalPaymentLinesRef.current = [];
      return;
    }

    async function loadPayments() {
      try {
        const resp = await fetch(`${API_BASE}/api/pagos/?cita=${citaId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!resp.ok) {
          setPaidFromBackend(0);
          originalPaymentLinesRef.current = [];
          setForm((prev) => ({
            ...prev,
            paymentLines: [{ id: null, method: "efectivo", amount: "", isPersisted: false }],
          }));
          return;
        }

        const data = await resp.json();
        const list = Array.isArray(data) ? data : data?.results || [];

        const mappedLines = list
          .filter((p) => Number(p?.cita) === Number(citaId))
          .slice()
          .sort((a, b) => Number(a.id) - Number(b.id))
          .map(mapPagoApiToPaymentLine);

        const sum = mappedLines.reduce(
          (acc, line) => acc + toNumberSafe(line.amount, 0),
          0
        );

        setPaidFromBackend(sum);
        originalPaymentLinesRef.current = mappedLines.map((line) => ({
          id: line.id ?? null,
          method: String(line.method || "efectivo"),
          amount: toNumberSafe(line.amount, 0),
        }));

        setForm((prev) => ({
          ...prev,
          paymentLines: mappedLines.length
            ? mappedLines
            : [{ id: null, method: "efectivo", amount: "", isPersisted: false }],
        }));
      } catch (e) {
        console.warn("No se pudieron cargar pagos previos:", e);
        setPaidFromBackend(0);
        originalPaymentLinesRef.current = [];
        setForm((prev) => ({
          ...prev,
          paymentLines: [{ id: null, method: "efectivo", amount: "", isPersisted: false }],
        }));
      }
    }

    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    if (["price", "montoFacturado"].includes(field)) {
      setForm((prev) => ({ ...prev, [field]: onlyMoneyString(value) }));
      return;
    }

    if (field === "discountPct") {
      setForm((prev) => ({ ...prev, discountPct: onlyPercentageString(value) }));
      return;
    }

    if (["repeatWeeks", "repeatSessions"].includes(field)) {
      setForm((prev) => ({ ...prev, [field]: onlyDigitsString(value) }));
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
      const newPrice = service ? Math.max(0, Number(service.precio || 0)) : 0;

      return {
        ...prev,
        serviceId,
        price: String(newPrice),
        montoFacturado: String(newPrice),
        endTime: addMinutesToTime(prev.time, durationMinutes),
      };
    });
  };

  const normalizedPhone = useMemo(() => normalizePhoneMX(form.telefono), [form.telefono]);

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
      genero: normalizeGender(p.genero),
      correo: p.correo || "",
      telefono: p.telefono || "",
      molestia: p.molestia || "",
    }));
    setPatientQuery(getPatientLabel(p));
    setPatientDropdownOpen(false);
  };

  const markAsNewPatient = () => {
    setForm((prev) => ({ ...prev, patientId: null }));
    setPatientDropdownOpen(false);
  };

  // ✅ usa números para cálculos (strings -> Number)
  const priceNum = toNumberSafe(form.price, 0);
  const subtotal = toNumberSafe(form.montoFacturado, priceNum || 0);
  const discountPctNum = toNumberSafe(form.discountPct, 0);

  const discountAmount = (subtotal * discountPctNum) / 100;
  const totalAfterDiscount = Math.max(0, subtotal - discountAmount);

  const persistedPaymentsTotal = useMemo(() => {
    return (form.paymentLines || [])
      .filter((line) => Boolean(line?.id))
      .reduce((acc, line) => acc + toNumberSafe(line.amount, 0), 0);
  }, [form.paymentLines]);

  const newPaymentsTotal = useMemo(() => {
    return (form.paymentLines || [])
      .filter((line) => !line?.id)
      .reduce((acc, line) => acc + toNumberSafe(line.amount, 0), 0);
  }, [form.paymentLines]);

  const amountToPayToday = newPaymentsTotal;

  const totalPaidInternal = persistedPaymentsTotal + newPaymentsTotal;
  const remainingInternal = Math.max(0, totalAfterDiscount - totalPaidInternal);

  function setPaymentLine(idx, patch) {
    setForm((prev) => {
      const lines = [...(prev.paymentLines || [])];
      const next = { ...lines[idx], ...patch };
      if ("amount" in next) next.amount = onlyMoneyString(next.amount);
      lines[idx] = next;
      return { ...prev, paymentLines: lines };
    });
  }
  function addPaymentLine() {
    setForm((prev) => ({
      ...prev,
      paymentLines: [
        ...(prev.paymentLines || []),
        { id: null, method: "efectivo", amount: "", isPersisted: false },
      ],
    }));
  }

  function removePaymentLine(idx) {
    setForm((prev) => {
      const lines = [...(prev.paymentLines || [])];
      const current = lines[idx];

      if (current?.id) return prev;

      lines.splice(idx, 1);

      return {
        ...prev,
        paymentLines: lines.length
          ? lines
          : [{ id: null, method: "efectivo", amount: "", isPersisted: false }],
      };
    });
  }

  const buildPayload = (base, overrides = {}) => {
    const payload = { ...base, ...overrides };

    payload.repeatEnabled = Boolean(payload.repeatEnabled);
    payload.repeatWeeks = Math.max(1, toNumberSafe(payload.repeatWeeks, 1));
    payload.repeatSessions = Math.max(1, toNumberSafe(payload.repeatSessions, 1));
    payload.repeatDays = Array.isArray(payload.repeatDays) ? payload.repeatDays : [];

    if (!payload.patientId) payload.patientId = null;

    payload.price = toNumberSafe(payload.price, 0);
    payload.discountPct = toNumberSafe(payload.discountPct, 0);
    payload.montoFacturado = toNumberSafe(payload.montoFacturado, payload.price || 0);

    payload.paymentLines = (payload.paymentLines || []).map((line) => ({
      id: line?.id ?? null,
      method: String(line?.method || "efectivo"),
      amount: toNumberSafe(line?.amount, 0),
    }));

    return payload;
  };

  async function syncPaymentsForCita(citaId) {
    const token = localStorage.getItem("auth.access");
    const fechaPago = getLocalDateMX();

    const currentLines = (form.paymentLines || []).map((line) => ({
      id: line?.id ?? null,
      method: String(line?.method || "efectivo"),
      amount: toNumberSafe(line?.amount, 0),
    }));

    const originalLines = (originalPaymentLinesRef.current || []).map((line) => ({
      id: line?.id ?? null,
      method: String(line?.method || "efectivo"),
      amount: toNumberSafe(line?.amount, 0),
    }));

    const originalById = new Map(
      originalLines
        .filter((line) => line.id)
        .map((line) => [Number(line.id), line])
    );

    const totalAfterDiscountCalc = Math.max(
      0,
      toNumberSafe(form.montoFacturado, toNumberSafe(form.price, 0)) -
      (toNumberSafe(form.montoFacturado, toNumberSafe(form.price, 0)) *
        toNumberSafe(form.discountPct, 0)) /
      100
    );

    const totalEditedPayments = currentLines.reduce(
      (acc, line) => acc + Number(line.amount || 0),
      0
    );

    if (totalEditedPayments > totalAfterDiscountCalc) {
      throw new Error(
        `La suma de pagos excede el total de la cita. Total permitido: $${totalAfterDiscountCalc.toFixed(2)}`
      );
    }

    let lastId = null;
    let changed = false;
    let createdCount = 0;

    for (const line of currentLines) {
      if (line.id) {
        if (line.amount <= 0) {
          throw new Error(
            "Un pago ya registrado no puede quedar en 0. Ajusta el monto o registra correctamente la liquidación."
          );
        }

        const prev = originalById.get(Number(line.id));
        const lineChanged =
          !prev ||
          String(prev.method || "") !== String(line.method || "") ||
          Number(prev.amount || 0) !== Number(line.amount || 0);

        if (!lineChanged) {
          lastId = line.id;
          continue;
        }

        const payloadPago = {
          fecha_pago: fechaPago,
          comprobante: String(form.comprobante || ""),
          monto_facturado: toNumberSafe(form.montoFacturado, toNumberSafe(form.price, 0)),
          metodo_pago: line.method,
          descuento_porcentaje: toNumberSafe(form.discountPct, 0),
          anticipo: Number(line.amount || 0),
        };

        const resp = await fetch(`${API_BASE}/api/pagos/${line.id}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payloadPago),
        });

        if (!resp.ok) {
          let data = null;
          try {
            data = await resp.json();
          } catch { }
          console.error("Error actualizando pago:", resp.status, data);
          throw new Error("No se pudo actualizar un pago existente.");
        }

        const savedPago = await resp.json();
        lastId = savedPago?.id || lastId;
        changed = true;
        continue;
      }

      if (line.amount > 0) {
        const payloadPago = {
          cita: citaId,
          fecha_pago: fechaPago,
          comprobante: String(form.comprobante || ""),
          monto_facturado: toNumberSafe(form.montoFacturado, toNumberSafe(form.price, 0)),
          metodo_pago: line.method,
          descuento_porcentaje: toNumberSafe(form.discountPct, 0),
          anticipo: Number(line.amount || 0),
        };

        const resp = await fetch(`${API_BASE}/api/pagos/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payloadPago),
        });

        if (!resp.ok) {
          let data = null;
          try {
            data = await resp.json();
          } catch { }
          console.error("Error creando pago:", resp.status, data);
          throw new Error("No se pudo registrar un nuevo pago.");
        }

        const savedPago = await resp.json();
        lastId = savedPago?.id || lastId;
        changed = true;
        createdCount += 1;
      }
    }

    const currentIds = new Set(
      currentLines.filter((line) => line.id).map((line) => Number(line.id))
    );

    const removedIds = originalLines
      .filter((line) => line.id && !currentIds.has(Number(line.id)))
      .map((line) => Number(line.id));

    for (const removedId of removedIds) {
      const resp = await fetch(`${API_BASE}/api/pagos/${removedId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resp.ok) {
        let data = null;
        try {
          data = await resp.json();
        } catch { }
        console.error("Error eliminando pago:", resp.status, data);
        throw new Error("No se pudo eliminar un pago quitado del formulario.");
      }

      changed = true;
    }

    setLastPagoId(lastId);
    return { lastId, changed, createdCount };
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
      setActiveSection("paciente");
      setMsg({
        open: true,
        title: "Falta el paciente",
        message: "Escribe el nombre del paciente o selecciona uno existente.",
      });
      return;
    }

    if (!form.serviceId || !form.professionalId || !form.date || !form.time) {
      setActiveSection("cita");
      setMsg({
        open: true,
        title: "Datos incompletos",
        message: "Selecciona servicio, profesional, fecha y hora antes de guardar.",
      });
      return;
    }

    if (form.repeatEnabled && !(form.repeatDays || []).length) {
      setActiveSection("cita");
      setMsg({
        open: true,
        title: "Repetición incompleta",
        message: "Selecciona al menos un día para repetir la cita.",
      });
      return;
    }

    if (toNumberSafe(form.discountPct, 0) > 100) {
      setActiveSection("pago");
      setMsg({
        open: true,
        title: "Descuento inválido",
        message: "El descuento no puede ser mayor a 100%.",
      });
      return;
    }

    try {
      setSavingRepeat(true);

      const wasPaidBefore = Boolean(appointment?.paid);

      const durationMinutes = getSelectedServiceDurationMinutes(form.serviceId);
      const fixed = { ...form, endTime: addMinutesToTime(form.time, durationMinutes) };

      const basePayload = buildPayload(fixed);
      const savedBase = await onSave?.(basePayload);
      const savedCitaId = savedBase?.id || savedBase?.cita_id || savedBase?.pk;

      if (!savedCitaId) {
        setMsg({
          open: true,
          title: "Aviso",
          message: "No se pudo confirmar el ID por un problema de red/respuesta. Cierra y refresca la agenda.",
        });
        onRequestCloseModal?.();
        return;
      }

      const paymentResult = await syncPaymentsForCita(savedCitaId);
      const refreshed = await onRefreshAppointment?.(savedCitaId);

      const paidNow = Boolean(refreshed?.pagado) || Boolean(refreshed?.paid);

      if (!wasPaidBefore && paidNow && paymentResult?.changed && paymentResult?.lastId) {
        await downloadTicket(paymentResult.lastId);
      }

      if (form.repeatEnabled) {
        const totalSessions = Math.max(1, toNumberSafe(form.repeatSessions, 1));
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
          const nextPayload = buildPayload(
            {
              ...basePayload,
              id: null,
              date,
              patientId: savedPatientId,
              paymentLines: [],
            },
            {}
          );
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
          message: paymentResult?.changed
            ? paidNow
              ? "Cita guardada y pago liquidado correctamente."
              : "Cita guardada con pago parcial."
            : "Cita guardada correctamente.",
        });
      }

      onRequestCloseModal?.();
    } catch (err) {
      console.error(err);
      setMsg({
        open: true,
        title: "Error",
        message: err?.message || "Ocurrió un error al guardar.",
      });
    } finally {
      setSavingRepeat(false);
    }
  };

  // ✅ eliminar directo (sin confirmación)
  const handleDeleteDirect = async () => {
    if (!form.id || savingRepeat) return;
    try {
      setSavingRepeat(true);
      await onDelete?.(form.id);
      // onDelete en Administrativa ya cierra el modal, pero por si acaso:
      onRequestCloseModal?.();
    } catch (e) {
      console.error(e);
      setMsg({ open: true, title: "Error", message: "No se pudo eliminar la cita." });
    } finally {
      setSavingRepeat(false);
    }
  };

  if (loadingData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-2xl">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          Cargando información de la cita...
        </div>
      </div>
    );
  }

  const selectedService = services.find((s) => Number(s.id) === Number(form.serviceId));
  const selectedProfessional = professionals.find((p) => Number(p.id) === Number(form.professionalId));
  const sections = [
    { id: "paciente", label: "Paciente", helper: "Identidad y contacto", icon: UsersRound },
    { id: "cita", label: "Cita", helper: "Servicio y horario", icon: CalendarDays },
    { id: "pago", label: "Pago y notas", helper: "Cobro y seguimiento", icon: WalletCards },
  ];
  const activeIndex = sections.findIndex((section) => section.id === activeSection);
  const todayDate = getLocalDateMX();

  const goPrevious = () => {
    if (activeIndex > 0) setActiveSection(sections[activeIndex - 1].id);
  };

  const goNext = () => {
    if (activeSection === "paciente" && !form.patientId && !String(form.patient || "").trim()) {
      setMsg({ open: true, title: "Falta el paciente", message: "Escribe el nombre del paciente o selecciona uno existente." });
      return;
    }
    if (activeIndex < sections.length - 1) setActiveSection(sections[activeIndex + 1].id);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-0 backdrop-blur-[3px] sm:p-4 lg:p-6">
        <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Cerrar modal" />

        <div className="relative z-10 flex h-[100dvh] w-full flex-col overflow-hidden bg-[#f5f7fb] shadow-2xl sm:h-auto sm:max-h-[94vh] sm:w-[min(96vw,1120px)] sm:rounded-[26px] sm:border sm:border-white/80">
          <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0a2f68] text-white shadow-lg shadow-blue-950/20">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
                    {isEditing ? "Edición de reservación" : "Nueva reservación"}
                  </p>
                  <h2 className="truncate text-lg font-bold text-slate-950 sm:text-xl">
                    {isEditing ? form.patient || "Editar cita" : "Agendar nueva cita"}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{form.date || "Sin fecha"}</span>
                    <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{form.time || "--:--"} – {form.endTime || "--:--"}</span>
                    <span className="hidden items-center gap-1 sm:inline-flex"><Stethoscope className="h-3.5 w-3.5" />{selectedService?.nombre || "Servicio pendiente"}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Secciones de la reservación">
              {sections.map((section, index) => {
                const Icon = section.icon;
                const active = activeSection === section.id;
                const completed = index < activeIndex;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={`flex min-w-[150px] flex-1 items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition sm:min-w-0 ${active
                      ? "border-blue-200 bg-blue-50 text-blue-800 shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${active ? "bg-blue-600 text-white" : completed ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {completed ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold">{section.label}</span>
                      <span className="block truncate text-[10px] opacity-70">{section.helper}</span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </header>

          <form onSubmit={handleSubmit} autoComplete="off" className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-5xl">
                {activeSection === "paciente" && (
                  <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
                    <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <div>
                        <h3 className="text-base font-bold text-slate-950">Información del paciente</h3>
                        <p className="mt-1 text-xs text-slate-500">Busca un registro existente o completa los datos para crear uno nuevo.</p>
                      </div>
                      {form.patientId ? (
                        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
                          <Check className="h-3.5 w-3.5" /> Paciente existente
                        </span>
                      ) : (
                        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700">
                          <UserPlus className="h-3.5 w-3.5" /> Nuevo paciente
                        </span>
                      )}
                    </div>

                    <div className="space-y-5 p-4 sm:p-6">
                      <div ref={patientBoxRef}>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Nombre o paciente existente <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            name="paciente_no_autofill"
                            autoComplete="off"
                            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                            value={patientQuery}
                            onChange={(e) => {
                              const value = e.target.value;
                              setPatientQuery(value);
                              setPatientDropdownOpen(true);
                              setForm((prev) => ({ ...prev, patientId: null, patient: value }));
                            }}
                            onFocus={() => setPatientDropdownOpen(true)}
                            placeholder="Escribe el nombre completo..."
                          />

                          {patientDropdownOpen && patientQuery.trim() && (
                            <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                              {patientMatches.length ? (
                                <>
                                  <div className="max-h-64 overflow-auto p-1.5">
                                    {patientMatches.map((patient) => (
                                      <button
                                        key={patient.id}
                                        type="button"
                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-slate-50"
                                        onMouseDown={(event) => {
                                          event.preventDefault();
                                          selectExistingPatient(patient);
                                        }}
                                      >
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-700">
                                          {getPatientLabel(patient).slice(0, 1).toUpperCase()}
                                        </span>
                                        <span className="min-w-0">
                                          <span className="block truncate text-sm font-semibold text-slate-800">{getPatientLabel(patient)}</span>
                                          <span className="block truncate text-[11px] text-slate-500">{patient.telefono || "Sin teléfono"} · {patient.correo || "Sin correo"}</span>
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                  <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                                    <button type="button" className="text-xs font-semibold text-blue-700 hover:underline" onMouseDown={(event) => { event.preventDefault(); markAsNewPatient(); }}>
                                      Registrar “{patientQuery}” como nuevo paciente
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <div className="px-4 py-4 text-sm text-slate-600">No encontramos coincidencias. Se registrará como paciente nuevo.</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {isNewPatient && (
                        <div className="grid gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 sm:grid-cols-2 lg:grid-cols-3">
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Apellido paterno</label>
                            <input className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" value={form.apellido_pat} onChange={(e) => handleChange("apellido_pat", e.target.value)} />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Apellido materno</label>
                            <input className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" value={form.apellido_mat} onChange={(e) => handleChange("apellido_mat", e.target.value)} />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Fecha de nacimiento</label>
                            <input type="date" max={todayDate} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" value={form.fecha_nac} onChange={(e) => handleChange("fecha_nac", e.target.value)} />
                          </div>
                        </div>
                      )}

                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Teléfono</label>
                          <div className="flex gap-2">
                            <div className="relative min-w-0 flex-1">
                              <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                              <input type="tel" inputMode="tel" autoComplete="tel" maxLength={15} disabled={Boolean(form.patientId)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500" value={form.telefono} onChange={(e) => handleChange("telefono", e.target.value)} placeholder="10 dígitos" />
                            </div>
                            <button type="button" onClick={openWhatsAppConfirm} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100" title="Confirmar por WhatsApp">
                              <MessageCircle className="h-5 w-5" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Correo electrónico</label>
                          <div className="relative">
                            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input type="email" autoComplete="email" disabled={Boolean(form.patientId)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500" value={form.correo} onChange={(e) => handleChange("correo", e.target.value)} placeholder="paciente@correo.com" />
                          </div>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Género</label>
                          <select disabled={Boolean(form.patientId)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500" value={normalizeGender(form.genero)} onChange={(e) => handleChange("genero", e.target.value)}>
                            <option value="">Selecciona una opción</option>
                            <option value="masculino">Masculino</option>
                            <option value="femenino">Femenino</option>
                            <option value="otro">Otro</option>
                          </select>
                        </div>
                      </div>

                      {isNewPatient ? (
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Motivo de consulta o molestia</label>
                          <textarea className="min-h-[90px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" value={form.molestia || ""} onChange={(e) => handleChange("molestia", e.target.value)} placeholder="Describe brevemente el motivo principal de la consulta..." />
                        </div>
                      ) : form.patientId ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
                          Los datos de contacto se muestran como referencia. Para modificarlos utiliza el expediente del paciente; las observaciones específicas de esta cita se capturan en <b>Pago y notas</b>.
                        </div>
                      ) : null}
                    </div>
                  </section>
                )}

                {activeSection === "cita" && (
                  <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
                    <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
                      <h3 className="text-base font-bold text-slate-950">Detalles de la cita</h3>
                      <p className="mt-1 text-xs text-slate-500">Define el tratamiento, profesional, horario y estado operativo.</p>
                    </div>

                    <div className="space-y-6 p-4 sm:p-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Servicio <span className="text-rose-500">*</span></label>
                          <select className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" value={form.serviceId ?? ""} onChange={(e) => handleServiceChange(e.target.value)}>
                            {services.map((service) => <option key={service.id} value={service.id}>{service.nombre}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Profesional <span className="text-rose-500">*</span></label>
                          <select className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" value={form.professionalId ?? ""} onChange={(e) => handleChange("professionalId", Number(e.target.value))}>
                            {professionals.map((professional) => <option key={professional.id} value={professional.id}>{getUserLabel(professional) || `Profesional #${professional.id}`}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Fecha <span className="text-rose-500">*</span></label>
                          <input type="date" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" value={form.date} onChange={(e) => handleChange("date", e.target.value)} />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Hora de inicio <span className="text-rose-500">*</span></label>
                          <select className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" value={form.time} onChange={(e) => handleChange("time", e.target.value)}>
                            {timeSlots.map((slot) => <option key={slot.time} value={slot.time}>{slot.time}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">Hora de término</label>
                          <input type="time" disabled readOnly className="h-12 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3 text-sm text-slate-500" value={form.endTime} />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-700">Estado de la cita</label>
                        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                          {[
                            ["reservado", "Reservado", "border-blue-200 bg-blue-50 text-blue-700"],
                            ["confirmado", "Confirmado", "border-amber-200 bg-amber-50 text-amber-700"],
                            ["completado", "Sí asistió", "border-emerald-200 bg-emerald-50 text-emerald-700"],
                            ["cancelado", "No asistió", "border-rose-200 bg-rose-50 text-rose-700"],
                          ].map(([value, label, activeClass]) => (
                            <button key={value} type="button" onClick={() => handleChange("status", value)} className={`rounded-xl border px-3 py-3 text-xs font-bold transition ${form.status === value ? activeClass + " ring-2 ring-offset-1 ring-current/20" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}>
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm"><Repeat2 className="h-4 w-4" /></span>
                            <div><p className="text-sm font-bold text-slate-800">Repetir tratamiento</p><p className="text-[11px] text-slate-500">Crea las siguientes sesiones automáticamente.</p></div>
                          </div>
                          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
                            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={Boolean(form.repeatEnabled)} onChange={(e) => handleChange("repeatEnabled", e.target.checked)} />
                            Activar repetición
                          </label>
                        </div>

                        {form.repeatEnabled && (
                          <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 lg:grid-cols-[minmax(0,1fr)_180px]">
                            <div>
                              <label className="mb-2 block text-xs font-semibold text-slate-700">Días de atención</label>
                              <div className="flex flex-wrap gap-2">
                                {DAYS.map((day) => {
                                  const active = (form.repeatDays || []).includes(day.k);
                                  return <button key={day.k} type="button" onClick={() => toggleRepeatDay(day.k)} className={`h-10 min-w-12 rounded-xl border px-3 text-xs font-bold transition ${active ? "border-blue-600 bg-blue-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{day.label}</button>;
                                })}
                              </div>
                            </div>
                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Total de sesiones</label>
                              <input type="text" inputMode="numeric" className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" value={form.repeatSessions} onChange={(e) => handleChange("repeatSessions", e.target.value)} placeholder="Ej. 6" />
                              <p className="mt-1 text-[10px] text-slate-500">Incluye la cita actual.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                )}

                {activeSection === "pago" && (
                  <section className="space-y-4">
                    <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
                      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <div>
                          <h3 className="text-base font-bold text-slate-950">Información de pago</h3>
                          <p className="mt-1 text-xs text-slate-500">Registra el precio, descuentos y uno o varios métodos de pago.</p>
                        </div>
                        {lastPagoId && (
                          <button type="button" onClick={() => downloadTicket(lastPagoId)} className="inline-flex h-10 w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50">
                            <Download className="h-4 w-4" /> Descargar ticket
                          </button>
                        )}
                      </div>

                      <div className="space-y-6 p-4 sm:p-6">
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Precio del servicio</label>
                            <div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span><input type="text" inputMode="decimal" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" value={form.price} onChange={(e) => handleChange("price", e.target.value)} /></div>
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Monto a facturar</label>
                            <div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span><input type="text" inputMode="decimal" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" value={form.montoFacturado} onChange={(e) => handleChange("montoFacturado", e.target.value)} /></div>
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Descuento</label>
                            <div className="relative"><input type="text" inputMode="decimal" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 pr-9 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" value={form.discountPct} onChange={(e) => handleChange("discountPct", e.target.value)} placeholder="0" /><span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">%</span></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div><p className="text-sm font-bold text-slate-900">Métodos de pago</p><p className="mt-0.5 text-[11px] text-slate-500">Las opciones se muestran completas; puedes combinar varios métodos.</p></div>
                            <button type="button" onClick={addPaymentLine} className="inline-flex h-10 w-fit items-center gap-2 rounded-xl bg-[#0a2f68] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#0d3d82]"><Plus className="h-4 w-4" /> Agregar otro pago</button>
                          </div>

                          <div className="mt-4 space-y-3">
                            {(form.paymentLines || []).map((line, index) => (
                              <article key={`${line.id || "new"}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-xs font-bold text-slate-800">Pago {index + 1}</p>
                                    <p className="text-[10px] text-slate-500">{line.id ? "Pago registrado anteriormente" : "Nuevo pago"}</p>
                                  </div>
                                  <button type="button" onClick={() => removePaymentLine(index)} disabled={Boolean(line.id)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40" title={line.id ? "Los pagos registrados no se eliminan desde este formulario" : "Quitar pago"}><Trash2 className="h-4 w-4" /></button>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
                                  {PAYMENT_METHODS.map((method) => {
                                    const Icon = method.icon;
                                    const selected = line.method === method.id;
                                    return (
                                      <button key={method.id} type="button" onClick={() => setPaymentLine(index, { method: method.id })} className={`flex min-h-12 items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold transition ${selected ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/15" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}>
                                        <Icon className="h-4 w-4 shrink-0" /><span className="truncate">{method.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>

                                <div className="mt-3">
                                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Monto de este pago</label>
                                  <div className="relative max-w-sm"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span><input type="text" inputMode="decimal" className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" value={line.amount} onChange={(e) => setPaymentLine(index, { amount: e.target.value })} placeholder="0.00" /></div>
                                </div>
                              </article>
                            ))}
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Total</p><p className="mt-1 text-lg font-bold text-slate-950">{formatMoney(totalAfterDiscount)}</p></div>
                          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">Pagado</p><p className="mt-1 text-lg font-bold text-emerald-800">{formatMoney(totalPaidInternal)}</p></div>
                          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-amber-600">Saldo pendiente</p><p className="mt-1 text-lg font-bold text-amber-800">{formatMoney(remainingInternal)}</p></div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Número de comprobante</label>
                            <div className="relative"><ReceiptText className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="text" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" value={form.comprobante} onChange={(e) => handleChange("comprobante", e.target.value)} placeholder="Opcional" /></div>
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Pagado anteriormente</label>
                            <div className="flex h-12 items-center rounded-xl border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-600">{formatMoney(paidFromBackend)}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
                      <div className="border-b border-slate-100 px-4 py-4 sm:px-6"><div className="flex items-center gap-2"><NotebookPen className="h-4 w-4 text-blue-600" /><h3 className="text-sm font-bold text-slate-900">Notas internas</h3></div></div>
                      <div className="p-4 sm:p-6"><textarea className="min-h-[120px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" value={form.notesInternal} onChange={(e) => handleChange("notesInternal", e.target.value)} placeholder="Indicaciones, observaciones o información relevante para el equipo..." /></div>
                    </div>
                  </section>
                )}
              </div>
            </div>

            <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {isEditing && (
                    <button type="button" onClick={handleDeleteDirect} disabled={savingRepeat} className="h-11 w-full rounded-xl border border-rose-200 bg-white px-4 text-sm font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60 sm:w-auto">
                      Eliminar cita
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex">
                  {activeIndex > 0 && (
                    <button type="button" onClick={goPrevious} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                      <ChevronLeft className="h-4 w-4" /> Anterior
                    </button>
                  )}
                  {activeIndex < sections.length - 1 ? (
                    <button type="button" onClick={goNext} className="col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0a2f68] px-5 text-sm font-bold text-white shadow-lg shadow-blue-950/15 transition hover:bg-[#0d3d82] sm:col-span-1">
                      Continuar <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button type="submit" disabled={savingRepeat} className="col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-1">
                      {savingRepeat ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear cita"}
                    </button>
                  )}
                </div>
              </div>
            </footer>
          </form>
        </div>
      </div>

      <MessageModal open={msg.open} title={msg.title} message={msg.message} onClose={() => setMsg({ open: false, title: "", message: "" })} />
    </>
  );
}