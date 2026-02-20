// src/Administrativa.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import "./index.css";

import { NavTab } from "./components/layout/NavTab";
import { AgendaView } from "./components/layout/agenda/AgendaView";
import { PatientsView } from "./components/layout/patients/PatientsView";
import { SalesView } from "./components/layout/sales/SalesView";
import { ReservationModal } from "./components/reservations/ReservationModal";
import { CommentsModerationView } from "./components/layout/comments/CommentsModerationView";
import { Equipo } from "./components/layout/equipo/Equipo";
import { BlockTimeModal } from "./components/layout/agenda/BlockTimeModal";

import { ServiciosAdminView } from "./components/layout/servicios/ServiciosAdminView";
import { UserProfileView } from "./components/layout/profile/UserProfileView";

import { Menu, X } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

function mapFrontendPaymentMethodToBackend(metodo) {
    if (!metodo) return "";
    const v = String(metodo).toLowerCase();
    if (v === "tarjeta_credito" || v === "tarjeta_debito" || v === "tarjeta") return "tarjeta";
    if (v === "transferencia") return "transferencia";
    if (v === "efectivo") return "efectivo";
    return "otro";
}

function mapCitaToAppointment(cita) {
    const fecha = cita.fecha;
    const horaInicio = cita.hora_inicio;
    const horaTermina = cita.hora_termina;

    const time = horaInicio ? horaInicio.slice(0, 5) : "";
    const endTime = horaTermina ? horaTermina.slice(0, 5) : "";

    let color = "bg-blue-100 text-blue-900 border-blue-300";
    if (cita.estado === "confirmado") color = "bg-amber-100 text-amber-900 border-amber-300";
    else if (cita.estado === "completado") color = "bg-pink-100 text-pink-900 border-pink-300";
    else if (cita.estado === "cancelado") color = "bg-orange-100 text-orange-900 border-orange-300";

    return {
        id: cita.id,
        date: fecha,
        time,
        endTime,
        patientId: cita.paciente,
        patient: cita.paciente_nombre || "Paciente",
        service: cita.servicio_nombre || "Servicio",
        serviceId: cita.servicio,
        professionalId: cita.profesional,
        professional: cita.profesional_nombre || "Profesional",
        status: cita.estado,
        price: Number(cita.precio),
        paid: Boolean(cita.pagado),
        notesInternal: cita.notas || "",
        discountPct: Number(cita.descuento_porcentaje || 0),
        deposit: Number(cita.anticipo || 0),
        metodo_pago: cita.metodo_pago || "",
        color,
        _type: "cita",
    };
}

// ✅ bloqueos a tiles “tipo cita”
function mapBloqueoToAppointment(b) {
    const time = (b.hora_inicio || "").slice(0, 5);
    const endTime = (b.hora_termina || "").slice(0, 5);
    const motivo = String(b.motivo || "").trim();

    return {
        id: `blk-${b.id}`,
        date: b.fecha,
        time: time || "08:00",
        endTime: endTime || "09:00",
        motivo: motivo || "No disponible",
        patient: "Horario bloqueado",
        service: motivo || "Bloqueo",
        professionalId: b.profesional,
        professional: b.profesional_nombre || "Profesional",
        status: "bloqueado",
        price: 0,
        paid: false,
        type: "bloqueo",
        color: "bg-slate-200 text-slate-800 border-slate-300",
        _type: "bloqueo",
        _raw: b,
    };
}

function sortAppointments(a, b) {
    if (a.date === b.date) return a.time.localeCompare(b.time);
    return a.date.localeCompare(b.date);
}

// Helpers repeat para bloqueo (simple y suficiente)
const DAYKEY_TO_JS = { D: 0, L: 1, M: 2, X: 3, J: 4, V: 5, S: 6 };
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
function buildRepeatDatesCount({ startDateIso, repeatDays, repeatCount }) {
    const start = isoToDate(startDateIso);
    const daysSet = new Set((repeatDays || []).map(String));
    const targetJsDays = new Set(
        Array.from(daysSet).map((k) => DAYKEY_TO_JS[k]).filter((v) => typeof v === "number")
    );
    if (targetJsDays.size === 0) return [];

    const out = [];
    for (let i = 0; i < 365; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        if (!targetJsDays.has(d.getDay())) continue;
        out.push(dateToIso(d));
        if (out.length >= Number(repeatCount || 1)) break;
    }
    return out;
}

// ======================
// Modales (sin alert)
// ======================
function ModalShell({ title, children, onClose, actions }) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <p className="text-sm font-semibold text-slate-900">{title}</p>
                    <button
                        onClick={onClose}
                        className="rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                    >
                        Cerrar
                    </button>
                </div>
                <div className="px-5 py-4 text-sm text-slate-700">{children}</div>
                <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
                    {actions}
                </div>
            </div>
        </div>
    );
}
function InfoModal({ open, title = "Aviso", message, onClose }) {
    if (!open) return null;
    return (
        <ModalShell
            title={title}
            onClose={onClose}
            actions={
                <button
                    onClick={onClose}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:brightness-110"
                >
                    Entendido
                </button>
            }
        >
            {message}
        </ModalShell>
    );
}
function ConfirmModal({ open, title = "Confirmar", message, onCancel, onConfirm, danger }) {
    if (!open) return null;
    return (
        <ModalShell
            title={title}
            onClose={onCancel}
            actions={
                <>
                    <button
                        onClick={onCancel}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`rounded-xl px-4 py-2 text-xs font-semibold text-white hover:brightness-110 ${danger ? "bg-red-600" : "bg-slate-900"
                            }`}
                    >
                        Confirmar
                    </button>
                </>
            }
        >
            {message}
        </ModalShell>
    );
}

// ======================
// Menú móvil
// ======================
function tabLabel(tab) {
    switch (tab) {
        case "agenda":
            return "Agenda";
        case "pacientes":
            return "Pacientes";
        case "ventas":
            return "Ventas";
        case "servicios":
            return "Servicios";
        case "comentarios":
            return "Comentarios";
        case "equipo":
            return "Equipo";
        case "perfil":
            return "Mi perfil";
        default:
            return tab;
    }
}

function MobileMenu({ open, onClose, allowedTabs, activeTab, onSelectTab }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9998] md:hidden">
            {/* backdrop */}
            <button
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
                aria-label="Cerrar menú"
                type="button"
            />
            {/* sheet */}
            <div className="absolute right-0 top-0 h-full w-[86%] max-w-sm bg-white shadow-2xl flex flex-col">
                <div className="h-16 border-b border-slate-200 px-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">Secciones</p>
                    <button
                        onClick={onClose}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white h-10 w-10"
                        aria-label="Cerrar"
                        type="button"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-3 overflow-auto">
                    <div className="grid gap-2">
                        {allowedTabs.map((t) => {
                            const active = t === activeTab;
                            return (
                                <button
                                    key={t}
                                    onClick={() => {
                                        onSelectTab(t);
                                        onClose();
                                    }}
                                    className={`w-full text-left rounded-2xl px-4 py-3 text-sm font-semibold border ${active
                                            ? "bg-slate-900 text-white border-slate-900"
                                            : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
                                        }`}
                                    type="button"
                                >
                                    {tabLabel(t)}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs text-slate-600">
                            Tip: en móvil conviene cerrar el menú al cambiar de sección (ya lo hace automáticamente).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Administrativa() {
    const [activeTab, setActiveTab] = useState("agenda");
    const [branch, setBranch] = useState("Fisionerv Centro");

    const [selectedProfessionalId, setSelectedProfessionalId] = useState(null);

    const [appointments, setAppointments] = useState([]);
    const [loadingAppointments, setLoadingAppointments] = useState(true);

    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [reservationPreset, setReservationPreset] = useState(null);

    const [me, setMe] = useState(null);
    const [professionals, setProfessionals] = useState([]);
    const [loadingMe, setLoadingMe] = useState(true);

    // ✅ bloqueo modal
    const [blockOpen, setBlockOpen] = useState(false);
    const [blockPreset, setBlockPreset] = useState(null);

    // ✅ modales para mensajes/confirmaciones (sin alert)
    const [infoModal, setInfoModal] = useState({ open: false, title: "", message: "" });
    const [confirmModal, setConfirmModal] = useState({
        open: false,
        title: "",
        message: "",
        danger: false,
        onConfirm: null,
    });

    // ✅ menú móvil
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const userEmail = localStorage.getItem("auth.user");

    const forceLogout = () => {
        localStorage.removeItem("auth.access");
        localStorage.removeItem("auth.refresh");
        localStorage.removeItem("auth.user");
        window.location.href = "/login";
    };

    const tokenOrLogout = () => {
        const token = localStorage.getItem("auth.access");
        if (!token) {
            forceLogout();
            return null;
        }
        return token;
    };

    const rol = me?.rol || null;
    const isProfessional = rol === "fisioterapeuta" || rol === "nutriologo" || rol === "dentista";

    const allowedTabs = useMemo(() => {
        if (rol === "admin")
            return ["agenda", "pacientes", "ventas", "servicios", "comentarios", "equipo", "perfil"];
        if (rol === "recepcion") return ["agenda", "perfil"];
        if (isProfessional) return ["agenda", "pacientes", "perfil"];
        return ["agenda", "perfil"];
    }, [rol, isProfessional]);

    useEffect(() => {
        if (!allowedTabs.includes(activeTab)) setActiveTab(allowedTabs[0] || "agenda");
    }, [allowedTabs, activeTab]);

    // Si cambia a desktop (md+), cerramos el menú por si estaba abierto
    useEffect(() => {
        const onResize = () => {
            if (window.innerWidth >= 768) setMobileMenuOpen(false);
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const showInfo = (message, title = "Aviso") => {
        setInfoModal({ open: true, title, message });
    };

    const askConfirm = ({ title, message, danger = false, onConfirm }) => {
        setConfirmModal({ open: true, title, message, danger, onConfirm });
    };

    // Cargar /api/me y /api/profesionales
    useEffect(() => {
        const token = tokenOrLogout();
        if (!token) return;

        async function loadMeAndProfessionals() {
            try {
                setLoadingMe(true);

                const respMe = await fetch(`${API_BASE}/api/me/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (respMe.status === 401) return forceLogout();
                if (!respMe.ok) throw new Error("No se pudo cargar /api/me/");
                const meData = await respMe.json();
                setMe(meData);

                const respPros = await fetch(`${API_BASE}/api/profesionales/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (respPros.status === 401) return forceLogout();
                if (!respPros.ok) throw new Error("No se pudo cargar /api/profesionales/");
                const prosData = await respPros.json();

                const list = (prosData || []).map((p) => ({
                    ...p,
                    label: p.full_name || `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.username,
                }));
                setProfessionals(list);

                if (
                    meData?.rol === "fisioterapeuta" ||
                    meData?.rol === "nutriologo" ||
                    meData?.rol === "dentista"
                ) {
                    setSelectedProfessionalId(meData.id);
                } else {
                    setSelectedProfessionalId((prev) => prev ?? (list[0]?.id ?? null));
                }
            } catch (e) {
                console.error(e);
                showInfo("No se pudo cargar la información del usuario/profesionales. Revisa consola.");
            } finally {
                setLoadingMe(false);
            }
        }

        loadMeAndProfessionals();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadAgendaData = useCallback(async () => {
        const token = tokenOrLogout();
        if (!token) return;

        try {
            setLoadingAppointments(true);

            // ✅ ahora cargamos citas + bloqueos
            const [respCitas, respBloqs] = await Promise.all([
                fetch(`${API_BASE}/api/citas/`, {
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                }),
                fetch(`${API_BASE}/api/bloqueos/`, {
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                }),
            ]);

            if (respCitas.status === 401 || respBloqs.status === 401) return forceLogout();
            if (!respCitas.ok) throw new Error("No se pudieron cargar las citas");

            const citasData = await respCitas.json();
            const citasMapped = (citasData || []).map(mapCitaToAppointment);

            let bloqueosMapped = [];
            if (respBloqs.ok) {
                const bloqsData = await respBloqs.json();
                bloqueosMapped = (bloqsData || []).map(mapBloqueoToAppointment);
            } else {
                bloqueosMapped = [];
            }

            const merged = [...citasMapped, ...bloqueosMapped].sort(sortAppointments);
            setAppointments(merged);
        } catch (err) {
            console.error(err);
            setAppointments([]);
            showInfo("No se pudieron cargar las citas/bloqueos. Revisa consola.");
        } finally {
            setLoadingAppointments(false);
        }
    }, []);

    useEffect(() => {
        loadAgendaData();
    }, [loadAgendaData]);

    const refreshAppointmentById = useCallback(async (id) => {
        const token = tokenOrLogout();
        if (!token || !id) return null;

        try {
            const resp = await fetch(`${API_BASE}/api/citas/${id}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (resp.status === 401) return forceLogout();
            if (!resp.ok) return null;

            const saved = await resp.json();
            const appt = mapCitaToAppointment(saved);

            setAppointments((prev) =>
                prev.map((a) => (String(a.id) === String(appt.id) ? appt : a)).sort(sortAppointments)
            );
            return saved;
        } catch (e) {
            console.error("refreshAppointmentById error:", e);
            return null;
        }
    }, []);

    const handleMoveAppointment = async (oldAppt, patch) => {
        // ✅ no mover bloqueos
        if (oldAppt?._type === "bloqueo") return;

        const token = tokenOrLogout();
        if (!token) return;

        setAppointments((prev) =>
            prev.map((a) => (a.id === oldAppt.id ? { ...a, ...patch } : a)).sort(sortAppointments)
        );

        const payload = {
            fecha: patch.date,
            hora_inicio: (patch.time || oldAppt.time) + ":00",
            hora_termina: (patch.endTime || oldAppt.endTime || patch.time) + ":00",
        };
        if (patch.professionalId != null) payload.profesional = patch.professionalId;

        try {
            const resp = await fetch(`${API_BASE}/api/citas/${oldAppt.id}/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });

            if (resp.status === 401) return forceLogout();

            if (!resp.ok) {
                setAppointments((prev) =>
                    prev.map((a) => (a.id === oldAppt.id ? oldAppt : a)).sort(sortAppointments)
                );
                showInfo("No se pudo mover la cita. Intenta de nuevo.");
                return;
            }

            const saved = await resp.json();
            const appt = mapCitaToAppointment(saved);

            setAppointments((prev) => prev.map((a) => (a.id === appt.id ? appt : a)).sort(sortAppointments));
        } catch (e) {
            setAppointments((prev) =>
                prev.map((a) => (a.id === oldAppt.id ? oldAppt : a)).sort(sortAppointments)
            );
            showInfo("Error de red moviendo la cita.");
        }
    };

    const handleNewReservation = (preset = null) => {
        setSelectedAppointment(null);
        setReservationPreset(preset || null);
        setModalOpen(true);
    };

    const handleOpenAppointment = (appt) => {
        if (appt?._type === "bloqueo") return;
        setSelectedAppointment(appt);
        setReservationPreset(null);
        setModalOpen(true);
    };

    const handleOpenBlockModal = (preset) => {
        setBlockPreset(preset || null);
        setBlockOpen(true);
    };

    const handleSaveBlockTime = async (form) => {
        const token = tokenOrLogout();
        if (!token) return;

        const professionalId = form.professionalId ?? null;
        if (!professionalId) {
            showInfo("Selecciona un profesional para bloquear.");
            return;
        }

        const dates = form.repeatEnabled
            ? buildRepeatDatesCount({
                startDateIso: form.date,
                repeatDays: form.repeatDays,
                repeatCount: form.repeatCount,
            })
            : [form.date];

        try {
            for (const d of dates) {
                const payload = {
                    profesional: professionalId,
                    fecha: d,
                    hora_inicio: String(form.startTime || "08:00").slice(0, 5) + ":00",
                    hora_termina: String(form.endTime || "09:00").slice(0, 5) + ":00",
                    motivo: String(form.motivo || "").trim(),
                };

                const resp = await fetch(`${API_BASE}/api/bloqueos/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify(payload),
                });

                if (resp.status === 401) return forceLogout();
                if (!resp.ok) {
                    const err = await resp.json().catch(() => null);
                    console.error("Error creando bloqueo:", err || resp.status);
                    showInfo("No se pudo crear el bloqueo. Revisa consola.");
                    return;
                }
            }

            setBlockOpen(false);
            setBlockPreset(null);
            await loadAgendaData();
        } catch (e) {
            console.error(e);
            showInfo("Error de red creando bloqueo.");
        }
    };

    const handleSaveReservation = async (form) => {
        const token = tokenOrLogout();
        if (!token) return null;

        const isExistingPatient = Boolean(form.patientId);

        const basePrecio = Number(form.price || 0);
        const baseDescuento = Number(form.discountPct || 0);

        const basePayload = {
            servicio: form.serviceId,
            profesional: form.professionalId,
            fecha: form.date,
            hora_inicio: String(form.time || "").slice(0, 5) + ":00",
            hora_termina: String(form.endTime || form.time || "").slice(0, 5) + ":00",
            estado: form.status || "reservado",
            notas: form.notesInternal || "",
            precio: basePrecio,
            pagado: Boolean(form.paid ?? false),
            metodo_pago: mapFrontendPaymentMethodToBackend(form.metodo_pago),
            descuento_porcentaje: baseDescuento,
            anticipo: Number(form.deposit || 0),
            monto_final: basePrecio - (basePrecio * baseDescuento) / 100,
        };

        const payload = isExistingPatient
            ? { ...basePayload, paciente: form.patientId }
            : {
                ...basePayload,
                paciente: {
                    nombres: form.patient,
                    apellido_pat: form.apellido_pat || "",
                    apellido_mat: form.apellido_mat || "",
                    fecha_nac: form.fecha_nac || null,
                    genero: form.genero || "",
                    telefono: form.telefono || "",
                    correo: form.correo || "",
                    molestia: form.molestia || "",
                    notas: form.notesInternal || "",
                },
            };

        const isEditing = Boolean(form.id);
        const url = isEditing ? `${API_BASE}/api/citas/${form.id}/` : `${API_BASE}/api/citas/`;
        const method = isEditing ? "PATCH" : "POST";

        try {
            const resp = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });

            if (resp.status === 401) {
                forceLogout();
                return null;
            }

            if (!resp.ok) {
                const errorData = await resp.json().catch(() => null);
                console.error("Error al guardar cita:", errorData || resp.status);
                showInfo("Error al guardar la cita. Revisa la consola.");
                return null;
            }

            const saved = await resp.json();
            const appt = mapCitaToAppointment(saved);

            if (isEditing) {
                setAppointments((prev) => prev.map((item) => (item.id === appt.id ? appt : item)).sort(sortAppointments));
            } else {
                setAppointments((prev) => [...prev, appt].sort(sortAppointments));
            }

            return saved;
        } catch (err) {
            console.error("Error de red guardando cita:", err);
            showInfo("Error de red guardando cita.");
            return null;
        }
    };

    const handleDeleteReservation = async (id) => {
        if (!id) return;

        askConfirm({
            title: "Eliminar cita",
            message: "¿Seguro que quieres eliminar esta cita? Esta acción no se puede deshacer.",
            danger: true,
            onConfirm: async () => {
                const token = tokenOrLogout();
                if (!token) return;

                try {
                    const resp = await fetch(`${API_BASE}/api/citas/${id}/`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    if (resp.status === 401) return forceLogout();

                    if (!resp.ok && resp.status !== 204) {
                        const errorData = await resp.json().catch(() => null);
                        console.error("Error al eliminar cita:", errorData || resp.status);
                        showInfo("No se pudo eliminar la cita. Revisa la consola.");
                        return;
                    }

                    setAppointments((prev) => prev.filter((c) => c.id !== id));
                    setModalOpen(false);
                    setSelectedAppointment(null);
                    setReservationPreset(null);
                } catch (e) {
                    console.error("Error al eliminar cita:", e);
                    showInfo("Ocurrió un error al eliminar la cita.");
                } finally {
                    setConfirmModal((s) => ({ ...s, open: false }));
                }
            },
        });
    };

    const handleLogout = () => forceLogout();

    const initialLetter =
        (me?.full_name?.trim()?.[0] || me?.username?.trim()?.[0] || userEmail?.trim()?.[0] || "U").toUpperCase();

    if (loadingMe) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center text-sm text-slate-600">
                Cargando usuario...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
            {/* ✅ Menú móvil overlay */}
            <MobileMenu
                open={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                allowedTabs={allowedTabs}
                activeTab={activeTab}
                onSelectTab={(t) => setActiveTab(t)}
            />

            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6">
                <div className="flex items-center gap-3 min-w-0">
                    {/* ✅ Botón hamburguesa SOLO en móvil */}
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(true)}
                        className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white hover:bg-slate-50"
                        aria-label="Abrir menú"
                        title="Secciones"
                    >
                        <Menu size={18} />
                    </button>

                    <div className="h-9 w-9 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold shadow-sm">
                        FN
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-lg font-semibold text-slate-900 truncate">Panel administrativo – Fisionerv</h1>
                        <p className="text-xs text-slate-500 truncate">
                            {rol ? `Rol: ${rol}` : "Panel"} • Agenda, pacientes, servicios y ventas en un mismo lugar.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6">
                    {/* ✅ Tabs desktop */}
                    <nav className="hidden md:flex items-center gap-1 rounded-full bg-slate-100 p-1">
                        {allowedTabs.includes("agenda") && (
                            <NavTab label="Agenda" active={activeTab === "agenda"} onClick={() => setActiveTab("agenda")} />
                        )}
                        {allowedTabs.includes("pacientes") && (
                            <NavTab label="Pacientes" active={activeTab === "pacientes"} onClick={() => setActiveTab("pacientes")} />
                        )}
                        {allowedTabs.includes("ventas") && (
                            <NavTab label="Ventas" active={activeTab === "ventas"} onClick={() => setActiveTab("ventas")} />
                        )}
                        {allowedTabs.includes("servicios") && (
                            <NavTab label="Servicios" active={activeTab === "servicios"} onClick={() => setActiveTab("servicios")} />
                        )}
                        {allowedTabs.includes("comentarios") && (
                            <NavTab
                                label="Comentarios"
                                active={activeTab === "comentarios"}
                                onClick={() => setActiveTab("comentarios")}
                            />
                        )}
                        {allowedTabs.includes("equipo") && (
                            <NavTab label="Equipo" active={activeTab === "equipo"} onClick={() => setActiveTab("equipo")} />
                        )}
                        {allowedTabs.includes("perfil") && (
                            <NavTab label="Mi perfil" active={activeTab === "perfil"} onClick={() => setActiveTab("perfil")} />
                        )}
                    </nav>

                    <div className="flex items-center gap-3">
                        <button
                            className="hidden sm:inline-flex text-xs px-3 py-1 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
                            onClick={() => (window.location.href = "/")}
                        >
                            Sitio web
                        </button>

                        {/* ✅ Botón de usuario -> abre perfil */}
                        <button
                            onClick={() => setActiveTab("perfil")}
                            className="flex items-center gap-2 rounded-2xl px-2 py-1 hover:bg-slate-50"
                            title="Mi perfil"
                            type="button"
                        >
                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700 overflow-hidden">
                                {initialLetter}
                            </div>
                            <span className="hidden sm:inline text-xs text-slate-600 max-w-[200px] truncate">
                                {me?.username || userEmail || "Usuario"}
                            </span>
                        </button>

                        <button onClick={handleLogout} className="ml-1 text-[11px] text-red-500 hover:underline" type="button">
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {activeTab === "agenda" &&
                    (loadingAppointments ? (
                        <div className="p-6 text-sm text-slate-500">Cargando citas desde el servidor...</div>
                    ) : (
                        <AgendaView
                            branch={branch}
                            setBranch={setBranch}
                            appointments={appointments}
                            professionals={professionals}
                            selectedProfessionalId={selectedProfessionalId}
                            setSelectedProfessionalId={setSelectedProfessionalId}
                            role={rol}
                            myUserId={me?.id}
                            onNewReservation={handleNewReservation}
                            onOpenAppointment={handleOpenAppointment}
                            onMoveAppointment={handleMoveAppointment}
                            onOpenBlockModal={handleOpenBlockModal}
                        />
                    ))}

                {activeTab === "pacientes" && <PatientsView role={rol} myUserId={me?.id} />}
                {activeTab === "ventas" && <SalesView />}
                {activeTab === "servicios" && <ServiciosAdminView role={rol} />}
                {activeTab === "comentarios" && <CommentsModerationView />}
                {activeTab === "equipo" && <Equipo />}
                {activeTab === "perfil" && (
                    <UserProfileView
                        me={me}
                        onUpdated={(nextMe) => {
                            setMe(nextMe);
                            if (nextMe?.email) localStorage.setItem("auth.user", nextMe.email);
                        }}
                        onShowInfo={(msg, title) => showInfo(msg, title)}
                    />
                )}
            </div>

            {modalOpen && (
                <ReservationModal
                    appointment={selectedAppointment}
                    preset={reservationPreset}
                    appointments={appointments}
                    onClose={() => {
                        setModalOpen(false);
                        setReservationPreset(null);
                        setSelectedAppointment(null);
                    }}
                    onSave={handleSaveReservation}
                    onDelete={handleDeleteReservation}
                    onRefreshAppointment={refreshAppointmentById}
                    onRequestCloseModal={() => {
                        setModalOpen(false);
                        setReservationPreset(null);
                        setSelectedAppointment(null);
                    }}
                />
            )}

            {blockOpen && (
                <BlockTimeModal
                    preset={blockPreset}
                    onClose={() => {
                        setBlockOpen(false);
                        setBlockPreset(null);
                    }}
                    onSave={handleSaveBlockTime}
                />
            )}

            <InfoModal
                open={infoModal.open}
                title={infoModal.title}
                message={infoModal.message}
                onClose={() => setInfoModal({ open: false, title: "", message: "" })}
            />

            <ConfirmModal
                open={confirmModal.open}
                title={confirmModal.title}
                message={confirmModal.message}
                danger={confirmModal.danger}
                onCancel={() => setConfirmModal((s) => ({ ...s, open: false }))}
                onConfirm={() => {
                    if (typeof confirmModal.onConfirm === "function") confirmModal.onConfirm();
                }}
            />
        </div>
    );
}