import { useEffect, useMemo, useRef, useState } from "react";
import { CreditCard, Landmark, Banknote, Check, UserPlus } from "lucide-react";

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

function toMinutes(time) {
  if (!time) return 0;
  const hh = parseInt(String(time).slice(0, 2), 10) || 0;
  const mm = parseInt(String(time).slice(3, 5), 10) || 0;
  return hh * 60 + mm;
}

function isoToDate(d) {
  // d: "YYYY-MM-DD"
  const [y, m, day] = String(d).split("-").map(Number);
  return new Date(y, (m || 1) - 1, day || 1);
}

function dateToIso(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Mapea L..S a getDay() (Dom=0, Lun=1... Sab=6)
const DAYKEY_TO_JS = { D: 0, L: 1, M: 2, X: 3, J: 4, V: 5, S: 6 };

function buildRepeatDates({ startDateIso, repeatDays, repeatWeeks, excludeStartDate }) {
  const start = isoToDate(startDateIso);
  const daysSet = new Set((repeatDays || []).map(String));
  const weeks = Math.max(1, Number(repeatWeeks || 1));

  // Solo L-S en tu UI, pero lo dejamos flexible
  const targetJsDays = new Set(
    Array.from(daysSet)
      .map((k) => DAYKEY_TO_JS[k])
      .filter((v) => typeof v === "number"),
  );

  // Si por alguna razón viene vacío, no repitas nada
  if (targetJsDays.size === 0) return [];

  // Generamos desde start (incluye) hasta start + (weeks*7 - 1)
  const totalDays = weeks * 7;
  const out = [];

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);

    const jsDay = d.getDay();
    if (!targetJsDays.has(jsDay)) continue;

    const iso = dateToIso(d);

    if (excludeStartDate && iso === startDateIso) continue;

    out.push(iso);
  }

  // Ordenadas y sin repetición
  return Array.from(new Set(out)).sort((a, b) => a.localeCompare(b));
}

const PAYMENT_METHODS = [
  { id: "tarjeta_credito", label: "Tarjeta de crédito", icon: CreditCard },
  { id: "tarjeta_debito", label: "Tarjeta de débito", icon: CreditCard },
  { id: "transferencia", label: "Transferencia", icon: Landmark },
  { id: "efectivo", label: "Efectivo", icon: Banknote },
];

export function ReservationModal({
  appointment,
  preset, // { date, time, professionalId }
  appointments,
  onClose,
  onSave,   // 👈 IMPORTANTE: debe retornar "saved" del backend
  onDelete,
}) {
  const isEditing = Boolean(appointment?.id);
  const today = new Date().toISOString().slice(0, 10);

  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [savingRepeat, setSavingRepeat] = useState(false);

  // ====== Paciente (combobox) ======
  const [patientQuery, setPatientQuery] = useState("");
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const patientBoxRef = useRef(null);

  const initialDate = appointment?.date ?? preset?.date ?? today;
  const initialTime = appointment?.time ?? preset?.time ?? "08:00";

  const DAYS = [
    { k: "L", label: "L" },
    { k: "M", label: "M" },
    { k: "X", label: "X" },
    { k: "J", label: "J" },
    { k: "V", label: "V" },
    { k: "S", label: "S" },
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
    metodo_pago: appointment?.metodo_pago ?? "",
    discountPct: appointment?.discountPct ?? 0,
    deposit: appointment?.deposit ?? 0,
    paid: appointment?.paid ?? false,
    status: appointment?.status ?? "reservado",
    notesInternal: appointment?.notesInternal ?? "",

    // ✅ Repetición: disponible SIEMPRE, no solo editar
    repeatEnabled: appointment?.repeatEnabled ?? false,
    repeatDays: appointment?.repeatDays ?? ["L", "M", "X", "J", "V", "S"],
    repeatWeeks: appointment?.repeatWeeks ?? 1,
  });

  const subtotal = Number(form.price || 0);
  const discountPct = Number(form.discountPct || 0);
  const deposit = Number(form.deposit || 0);
  const discountAmount = (subtotal * discountPct) / 100;
  const totalAfterDiscount = Math.max(0, subtotal - discountAmount);
  const remaining = Math.max(0, totalAfterDiscount - deposit);

  // Cerrar dropdown al click fuera
  useEffect(() => {
    const onDoc = (e) => {
      if (!patientBoxRef.current) return;
      if (!patientBoxRef.current.contains(e.target)) {
        setPatientDropdownOpen(false);
      }
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
            servicesData.find((s) => s.id === serviceId) ||
            servicesData[0] ||
            null;

          const durationMinutes = service ? durationToMinutes(service.duracion) : 60;

          const baseTime = prev.time || "08:00";
          const endTime = prev.endTime || addMinutesToTime(baseTime, durationMinutes);

          const patientId = prev.patientId ?? null;
          const p = patientsData.find((x) => x.id === patientId) || null;

          return {
            ...prev,
            serviceId: service ? service.id : serviceId,
            professionalId,
            price: prev.price || (service ? Number(service.precio) : 0),
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
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincroniza query del paciente con el form
  useEffect(() => {
    setPatientQuery(form.patient || "");
  }, [form.patient]);

  const handleChange = (field, value) => {
    if (field === "time") {
      const service = services.find((s) => s.id === form.serviceId);
      const durationMinutes = service ? durationToMinutes(service.duracion) : 60;

      setForm((prev) => ({
        ...prev,
        time: value,
        endTime: addMinutesToTime(value, durationMinutes),
      }));
      return;
    }

    if (["price", "discountPct", "deposit", "repeatWeeks"].includes(field)) {
      const num =
        value === "" ? "" : Number(value);
      setForm((prev) => ({ ...prev, [field]: num }));
      return;
    }

    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleServiceChange = (serviceIdStr) => {
    const serviceId = Number(serviceIdStr);
    const service = services.find((s) => s.id === serviceId);

    const durationMinutes = service ? durationToMinutes(service.duracion) : 60;

    setForm((prev) => ({
      ...prev,
      serviceId,
      price: service ? Number(service.precio) : prev.price,
      endTime: addMinutesToTime(prev.time, durationMinutes),
    }));
  };

  // ====== Time slots ocupados (mismo día / mismo profesional) ======
  const timeSlots = useMemo(() => {
    const service = services.find((s) => s.id === form.serviceId);
    const durationMinutes = service ? durationToMinutes(service.duracion) : 60;

    const sameDayAppointments = (appointments || []).filter((a) => {
      if (a.date !== form.date) return false;
      if (a.id === form.id) return false;

      if (form.professionalId != null && a.professionalId != null) {
        return Number(a.professionalId) === Number(form.professionalId);
      }
      return true;
    });

    const slots = [];
    for (let h = 7; h <= 21; h++) {
      for (const m of [0, 15, 30, 45]) {
        const hh = String(h).padStart(2, "0");
        const mm = String(m).padStart(2, "0");
        const time = `${hh}:${mm}`;

        const start = h * 60 + m;
        const end = start + durationMinutes;

        const busy = sameDayAppointments.some((a) => {
          const s = toMinutes(a.time);
          const e = toMinutes(a.endTime || a.time);
          return overlaps(start, end, s, e);
        });

        slots.push({ time, busy });
      }
    }
    return slots;
  }, [appointments, form.date, form.id, form.serviceId, form.professionalId, services]);

  // ====== Validación simple de conflicto para UN payload ======
  const hasConflict = (payload) => {
    const sameDayAppointments = (appointments || []).filter((a) => {
      if (a.date !== payload.date) return false;
      if (a.id === payload.id) return false;

      if (payload.professionalId != null && a.professionalId != null) {
        return Number(a.professionalId) === Number(payload.professionalId);
      }
      return true;
    });

    const startMinutes = toMinutes(payload.time);
    const endMinutes = toMinutes(payload.endTime || payload.time);

    return sameDayAppointments.some((a) => {
      const s = toMinutes(a.time);
      const e = toMinutes(a.endTime || a.time);
      return overlaps(startMinutes, endMinutes, s, e);
    });
  };

  // ====== Autocomplete paciente ======
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

  const isNewPatient = !form.patientId && String(form.patient || "").trim().length > 0;

  // ====== Construye payload “limpio” para guardar ======
  const buildPayload = (base, overrides = {}) => {
    const payload = { ...base, ...overrides };

    // normalizaciones básicas
    payload.repeatEnabled = Boolean(payload.repeatEnabled);
    payload.repeatWeeks = Math.max(1, Number(payload.repeatWeeks || 1));
    payload.repeatDays = Array.isArray(payload.repeatDays) ? payload.repeatDays : [];

    // Si es “nuevo paciente”, forzamos patientId null para que backend cree con nested paciente
    if (!payload.patientId) payload.patientId = null;

    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones base de paciente
    if (!form.patientId) {
      if (!String(form.patient || "").trim()) {
        alert("Escribe el nombre del paciente o selecciona uno existente.");
        return;
      }
    }

    // ✅ Guardado SIN repetición
    if (!form.repeatEnabled) {
      const payload = buildPayload(form);

      if (hasConflict(payload)) {
        alert("La hora seleccionada ya está ocupada por otra cita en este día/profesional.");
        return;
      }

      await onSave(payload);
      return;
    }

    // ✅ Guardado CON repetición
    try {
      setSavingRepeat(true);

      // 1) Generar fechas
      const repeatDates = buildRepeatDates({
        startDateIso: form.date,
        repeatDays: form.repeatDays,
        repeatWeeks: form.repeatWeeks,
        excludeStartDate: isEditing, // en edición: no dupliques el mismo día
      });

      // 2) Guardar la cita base
      const basePayload = buildPayload(form);

      if (hasConflict(basePayload)) {
        alert("La cita base tiene conflicto. Cambia la hora o profesional.");
        return;
      }

      const savedBase = await onSave(basePayload);

      // Si tu onSave NO retorna saved, esto queda null y no podremos amarrar patientId correctamente
      const savedPatientId =
        savedBase?.paciente ?? savedBase?.patientId ?? basePayload.patientId ?? null;

      // 3) Crear las demás citas
      let created = 0;
      let skipped = 0;

      // Para repetir, necesitamos un payload con patientId fijo (para no crear pacientes duplicados)
      const repeatTemplate = buildPayload(
        {
          ...basePayload,
          id: null, // nuevas citas
          patientId: savedPatientId || basePayload.patientId || null,
        },
        {},
      );

      // Si el paciente era nuevo y no logramos obtener ID, igual funciona porque backend hará get_or_create por teléfono,
      // pero podría duplicar si cambia el teléfono. Aun así, hacemos best-effort.
      for (const date of repeatDates) {
        const nextPayload = buildPayload(repeatTemplate, { date });

        // Evitar choques (y repetición accidental)
        if (hasConflict(nextPayload)) {
          skipped++;
          continue;
        }

        await onSave(nextPayload);
        created++;
      }

      // 4) UX: mensaje simple
      alert(
        `Listo. Cita base guardada y se crearon ${created} repetidas. Omitidas por conflicto: ${skipped}.`,
      );
    } catch (err) {
      console.error("Error repitiendo citas:", err);
      alert("Ocurrió un error al repetir las citas. Revisa consola.");
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
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-[min(96vw,980px)] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex items-start justify-between bg-slate-50 gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-800 truncate">
                {isEditing ? `Editar cita de ${form.patient || "paciente"}` : "Nueva cita"}
              </h2>
              <p className="text-xs text-slate-500">Paciente, servicio, horario y notas.</p>
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
                onClick={onClose}
                className="h-8 w-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body */}
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

                        setForm((prev) => ({
                          ...prev,
                          patientId: null,
                          patient: v,
                        }));
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
                                  <div className="font-medium text-slate-800">
                                    {getPatientLabel(p)}
                                  </div>
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
                  <input
                    type="text"
                    name="telefono_no_autofill"
                    autoComplete="off"
                    className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                    value={form.telefono}
                    onChange={(e) => handleChange("telefono", e.target.value)}
                  />
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
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Hora inicio</label>
                  <select
                    className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                    value={form.time}
                    onChange={(e) => handleChange("time", e.target.value)}
                  >
                    {timeSlots.map((slot) => (
                      <option key={slot.time} value={slot.time} disabled={slot.busy}>
                        {slot.time} {slot.busy ? "— Ocupado" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Hora termina</label>
                  <input
                    type="time"
                    autoComplete="off"
                    name="hora_fin_no_autofill"
                    className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                    value={form.endTime}
                    onChange={(e) => handleChange("endTime", e.target.value)}
                  />
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
                              "h-9 w-9 rounded-lg border text-sm font-semibold " +
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
                      Se repite desde la fecha elegida, por N semanas. (En edición: se repite hacia adelante sin duplicar el mismo día)
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
                  </div>
                </div>
              )}
            </div>

            {/* Pago */}
            <div className="border border-slate-200 rounded-xl p-3 space-y-3">
              <p className="text-[11px] font-semibold text-slate-600">Pago</p>

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

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Anticipo</label>
                  <input
                    type="number"
                    autoComplete="off"
                    name="anticipo_no_autofill"
                    className="w-full text-sm rounded-md border border-slate-300 px-3 py-2"
                    value={form.deposit}
                    onChange={(e) => handleChange("deposit", e.target.value)}
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Método de pago</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PAYMENT_METHODS.map((m) => {
                      const Icon = m.icon;
                      const active = form.metodo_pago === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleChange("metodo_pago", m.id)}
                          className={
                            "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm " +
                            (active
                              ? "bg-violet-50 border-violet-200 text-violet-800"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")
                          }
                        >
                          <Icon className="h-4 w-4" />
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="md:col-span-3 rounded-lg border border-slate-200 p-3 bg-slate-50">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600">
                    <div>
                      <div className="font-semibold">Subtotal</div>
                      <div>${subtotal.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="font-semibold">Descuento</div>
                      <div>-${discountAmount.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="font-semibold">Total</div>
                      <div>${totalAfterDiscount.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="font-semibold">Restante</div>
                      <div>${remaining.toFixed(2)}</div>
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

                <div className="md:col-span-3 flex items-center gap-2">
                  <input
                    id="paid"
                    type="checkbox"
                    checked={Boolean(form.paid)}
                    onChange={(e) => handleChange("paid", e.target.checked)}
                  />
                  <label htmlFor="paid" className="text-sm text-slate-700">
                    Marcar como pagado
                  </label>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-between pt-2 gap-2">
              <div className="flex items-center gap-2">
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => onDelete?.(form.id)}
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
                {savingRepeat ? "Guardando repetición..." : isEditing ? "Guardar cambios" : "Crear cita"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
