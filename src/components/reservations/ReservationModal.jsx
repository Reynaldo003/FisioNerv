import { useEffect, useMemo, useState } from "react";
import { CreditCard, Landmark, Banknote } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

function durationToMinutes(durationStr) {
  if (!durationStr) return 60;
  const [h = "0", m = "0", s = "0"] = durationStr.split(":");
  return Number(h) * 60 + Number(m) + Number(s) / 60;
}

function getStatusColorClasses(status) {
  switch (status) {
    case "reservado":
      return "bg-blue-100 text-blue-900 border-blue-300";
    case "confirmado":
      return "bg-amber-100 text-amber-900 border-amber-300";
    case "completado":
      return "bg-pink-100 text-pink-900 border-pink-300";
    case "cancelado":
      return "bg-orange-100 text-orange-900 border-orange-300";
    default:
      return "bg-slate-100 text-slate-700 border-slate-300";
  }
}

function addMinutesToTime(timeStr, minutesToAdd) {
  if (!timeStr) return "08:00";
  const [h = "0", m = "0"] = timeStr.split(":");
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

function overlaps(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

// ahora 4 métodos: crédito, débito, transferencia, efectivo
const PAYMENT_METHODS = [
  { id: "tarjeta_credito", label: "Tarjeta de crédito", icon: CreditCard },
  { id: "tarjeta_debito", label: "Tarjeta de débito", icon: CreditCard },
  { id: "transferencia", label: "Transferencia", icon: Landmark },
  { id: "efectivo", label: "Efectivo", icon: Banknote },
];

export function ReservationModal({
  appointment,
  appointments,
  onClose,
  onSave,
  onDelete,
}) {
  const isEditing = Boolean(appointment);
  const today = new Date().toISOString().slice(0, 10);

  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

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
    date: appointment?.date ?? today,
    time: appointment?.time ?? "08:00",
    endTime: appointment?.endTime ?? "09:00",
    serviceId: appointment?.serviceId ?? null,
    professionalId: appointment?.professionalId ?? null,
    price: appointment?.price ?? 0,
    metodo_pago: appointment?.metodo_pago ?? "",
    discountPct: appointment?.discountPct ?? 0,
    deposit: appointment?.deposit ?? 0,
    paid: appointment?.paid ?? false,
    status: appointment?.status ?? "reservado",
    notesInternal: appointment?.notesInternal ?? "",
  });

  const subtotal = Number(form.price || 0);
  const discountPct = Number(form.discountPct || 0);
  const deposit = Number(form.deposit || 0);
  const discountAmount = (subtotal * discountPct) / 100;
  const totalAfterDiscount = Math.max(0, subtotal - discountAmount);
  const remaining = Math.max(0, totalAfterDiscount - deposit);

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
          let serviceId =
            prev.serviceId ??
            appointment?.serviceId ??
            (servicesData[0]?.id ?? null);

          let professionalId =
            prev.professionalId ??
            appointment?.professionalId ??
            (profsData[0]?.id ?? null);

          const service =
            servicesData.find((s) => s.id === serviceId) ||
            servicesData[0] ||
            null;

          const durationMinutes = service
            ? durationToMinutes(service.duracion)
            : 60;

          const baseTime = prev.time || "08:00";
          const endTime =
            prev.endTime || addMinutesToTime(baseTime, durationMinutes);

          const patientId =
            prev.patientId ?? appointment?.patientId ?? null;
          const fullPatient =
            patientsData.find((p) => p.id === patientId) || null;

          return {
            ...prev,
            serviceId: service ? service.id : serviceId,
            professionalId,
            price: prev.price || (service ? Number(service.precio) : 0),
            time: baseTime,
            endTime,
            patientId,
            ...(fullPatient && {
              patient: getPatientLabel(fullPatient),
              apellido_pat: fullPatient.apellido_pat || "",
              apellido_mat: fullPatient.apellido_mat || "",
              fecha_nac: fullPatient.fecha_nac || "",
              genero: fullPatient.genero || "",
              correo: fullPatient.correo || "",
              telefono: fullPatient.telefono || "",
            }),
          };
        });
      } catch (err) {
        console.error(
          "Error cargando servicios/profesionales/pacientes:",
          err,
        );
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (field, value) => {
    if (field === "time") {
      const service = services.find((s) => s.id === form.serviceId);
      const durationMinutes = service
        ? durationToMinutes(service.duracion)
        : 60;

      setForm((prev) => ({
        ...prev,
        time: value,
        endTime: addMinutesToTime(value, durationMinutes),
      }));
      return;
    }

    if (["price", "discountPct", "deposit"].includes(field)) {
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
      ? durationToMinutes(service.duracion)
      : 60;

    setForm((prev) => ({
      ...prev,
      serviceId,
      price: service ? Number(service.precio) : prev.price,
      endTime: addMinutesToTime(prev.time, durationMinutes),
    }));
  };

  // Slots de horario con marcado de ocupados
  const timeSlots = useMemo(() => {
    const service = services.find((s) => s.id === form.serviceId);
    const durationMinutes = service
      ? durationToMinutes(service.duracion)
      : 60;

    const sameDayAppointments = (appointments || []).filter(
      (a) => a.date === form.date && a.id !== form.id,
    );

    const slots = [];
    for (let h = 7; h <= 21; h++) {
      for (const m of [0, 30]) {
        const hh = String(h).padStart(2, "0");
        const mm = String(m).padStart(2, "0");
        const time = `${hh}:${mm}`;
        const start = h * 60 + m;
        const end = start + durationMinutes;

        const busy = sameDayAppointments.some((a) => {
          const s =
            parseInt(a.time.slice(0, 2), 10) * 60 +
            parseInt(a.time.slice(3, 5), 10);
          const e =
            parseInt(a.endTime.slice(0, 2), 10) * 60 +
            parseInt(a.endTime.slice(3, 5), 10);
          return overlaps(start, end, s, e);
        });

        slots.push({ time, busy });
      }
    }
    return slots;
  }, [appointments, form.date, form.id, form.serviceId, services]);

  const validarYGuardar = (payload) => {
    const sameDayAppointments = (appointments || []).filter(
      (a) => a.date === payload.date && a.id !== payload.id,
    );

    const startMinutes =
      parseInt(payload.time.slice(0, 2), 10) * 60 +
      parseInt(payload.time.slice(3, 5), 10);
    const endMinutes =
      parseInt(payload.endTime.slice(0, 2), 10) * 60 +
      parseInt(payload.endTime.slice(3, 5), 10);

    const conflicto = sameDayAppointments.some((a) => {
      const s =
        parseInt(a.time.slice(0, 2), 10) * 60 +
        parseInt(a.time.slice(3, 5), 10);
      const e =
        parseInt(a.endTime.slice(0, 2), 10) * 60 +
        parseInt(a.endTime.slice(3, 5), 10);
      return overlaps(startMinutes, endMinutes, s, e);
    });

    if (conflicto) {
      alert(
        "La hora seleccionada ya está ocupada por otra cita en este día. Elige otro horario.",
      );
      return;
    }

    onSave(payload);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    validarYGuardar(form);
  };

  const handleReagendar = () => {
    validarYGuardar({ ...form, status: "reservado" });
  };

  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl px-6 py-4 shadow-xl text-sm text-slate-600">
          Cargando datos de servicios y profesionales...
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl">
        <div className="flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                {isEditing
                  ? `Editar cita de ${form.patient || "paciente"}`
                  : "Nueva cita"}
              </h2>
              <p className="text-xs text-slate-500">
                Completa los datos de la cita: paciente, servicio, horario y
                notas.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                className={
                  "hidden md:inline-flex items-center text-[11px] font-medium px-2 py-1 rounded-full border " +
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
                onClick={onClose}
                className="h-8 w-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body con scroll */}
          <form
            onSubmit={handleSubmit}
            className="px-6 py-4 space-y-4 overflow-y-auto"
          >
            {/* Datos de paciente */}
            <div className="border border-slate-200 rounded-xl p-3 space-y-3">
              <p className="text-[11px] font-semibold text-slate-600">
                Datos del paciente
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative md:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Paciente
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre del paciente"
                    className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                    value={form.patient}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        patient: value,
                        patientId: null,
                      }));
                    }}
                  />

                  {form.patient.trim().length > 0 && (
                    <div className="absolute z-20 mt-1 w-full max-h-40 overflow-auto bg-white border border-slate-200 rounded-md shadow-md text-xs">
                      {patients
                        .filter((p) =>
                          getPatientLabel(p)
                            .toLowerCase()
                            .includes(form.patient.toLowerCase()),
                        )
                        .slice(0, 10)
                        .map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                patient: getPatientLabel(p),
                                patientId: p.id,
                                apellido_pat: p.apellido_pat || "",
                                apellido_mat: p.apellido_mat || "",
                                fecha_nac: p.fecha_nac || "",
                                genero: p.genero || "",
                                correo: p.correo || "",
                                telefono: p.telefono || "",
                              }))
                            }
                            className="w-full text-left px-3 py-1.5 hover:bg-violet-50"
                          >
                            {getPatientLabel(p)} –{" "}
                            {p.telefono || "Sin teléfono"}
                          </button>
                        ))}

                      {patients.filter((p) =>
                        getPatientLabel(p)
                          .toLowerCase()
                          .includes(form.patient.toLowerCase()),
                      ).length === 0 && (
                          <div className="px-3 py-2 text-[11px] text-slate-500">
                            No hay pacientes con ese nombre. Puedes darlo de alta
                            en el módulo de <b>Pacientes</b>.
                          </div>
                        )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Teléfono
                  </label>
                  <input
                    className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                    value={form.telefono}
                    onChange={(e) => handleChange("telefono", e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Ap. paterno
                  </label>
                  <input
                    className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                    value={form.apellido_pat}
                    onChange={(e) =>
                      handleChange("apellido_pat", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Ap. materno
                  </label>
                  <input
                    className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                    value={form.apellido_mat}
                    onChange={(e) =>
                      handleChange("apellido_mat", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Fecha de nacimiento
                  </label>
                  <input
                    type="date"
                    className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                    value={form.fecha_nac}
                    onChange={(e) =>
                      handleChange("fecha_nac", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Género
                  </label>
                  <select
                    className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                    value={form.genero}
                    onChange={(e) => handleChange("genero", e.target.value)}
                  >
                    <option value="">Selecciona…</option>
                    <option value="femenino">Femenino</option>
                    <option value="masculino">Masculino</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                    value={form.correo}
                    onChange={(e) => handleChange("correo", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Datos de la cita */}
            <div className="border border-slate-200 rounded-xl p-3 space-y-3">
              <p className="text-[11px] font-semibold text-slate-600">
                Detalles de la cita
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Servicio
                  </label>
                  <select
                    className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white"
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
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Profesional
                  </label>
                  <select
                    className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white"
                    value={form.professionalId ?? ""}
                    onChange={(e) =>
                      handleChange("professionalId", Number(e.target.value))
                    }
                  >
                    {professionals.map((p) => (
                      <option key={p.id} value={p.id}>
                        {getUserLabel(p)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                    value={form.date}
                    onChange={(e) => handleChange("date", e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Hora inicio
                  </label>
                  <select
                    className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white"
                    value={form.time}
                    onChange={(e) => handleChange("time", e.target.value)}
                  >
                    {timeSlots.map((slot) => (
                      <option
                        key={slot.time}
                        value={slot.time}
                        disabled={slot.busy}
                        className={
                          slot.busy
                            ? "text-slate-400 bg-slate-50"
                            : "text-slate-800"
                        }
                      >
                        {slot.time} {slot.busy ? "— Ocupado" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Hora termina
                  </label>
                  <input
                    type="time"
                    className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                    value={form.endTime}
                    onChange={(e) => handleChange("endTime", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Pago y descuento */}
            <div className="border border-slate-200 rounded-xl p-3 space-y-3">
              <p className="text-[11px] font-semibold text-slate-600">
                Información de pago
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Precio del servicio
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                    value={form.price}
                    onChange={(e) => handleChange("price", e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Método de pago
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleChange("metodo_pago", id)}
                        className={`flex flex-col items-center justify-center border rounded-md px-2 py-2 text-[11px] ${form.metodo_pago === id
                          ? "border-violet-500 bg-violet-50 text-violet-700"
                          : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                      >
                        <Icon className="w-4 h-4 mb-1" />
                        <span className="text-[10px] text-center">
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Descuento (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                    value={form.discountPct}
                    onChange={(e) =>
                      handleChange("discountPct", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Anticipo / abono
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                    value={form.deposit}
                    onChange={(e) => handleChange("deposit", e.target.value)}
                  />
                </div>

                <div className="flex flex-col justify-center text-[11px] text-slate-700 bg-slate-50 rounded-md border border-slate-200 px-3 py-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Descuento:</span>
                    <span>- ${discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total con descuento:</span>
                    <span>${totalAfterDiscount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Restante después del anticipo:</span>
                    <span>${remaining.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold text-slate-600">
                  Pagado
                </span>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="radio"
                    name="paid"
                    checked={form.paid === true}
                    onChange={() => handleChange("paid", true)}
                  />
                  Sí
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="radio"
                    name="paid"
                    checked={form.paid === false}
                    onChange={() => handleChange("paid", false)}
                  />
                  No
                </label>
              </div>
            </div>

            {/* Notas */}
            <div className="border border-slate-200 rounded-xl p-3">
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Notas
              </label>
              <textarea
                rows={3}
                className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 resize-none"
                value={form.notesInternal}
                onChange={(e) =>
                  handleChange("notesInternal", e.target.value)
                }
              />
            </div>

            {/* Footer */}
            <div className="pt-3 flex items-center justify-between border-t border-slate-200">
              {isEditing ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onDelete?.(form.id)}
                    className="text-xs px-3 py-1.5 rounded-md border border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Eliminar cita
                  </button>

                  <button
                    type="button"
                    onClick={handleReagendar}
                    className="text-xs px-3 py-1.5 rounded-md border border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    Reagendar (cambiar fecha/hora)
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
              )}

              <button
                type="submit"
                className="text-xs px-4 py-2 rounded-md bg-violet-600 text-white font-medium hover:bg-violet-700"
              >
                Guardar cita
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
