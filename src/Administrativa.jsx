// src/Administrativa.jsx
import { useEffect, useMemo, useState } from "react";
import "./index.css";
import { apiFetch } from "./lib/api"; // ajusta path real

import { NavTab } from "./components/layout/NavTab";
import { AgendaView } from "./components/layout/agenda/AgendaView";
import { PatientsView } from "./components/layout/patients/PatientsView";
import { SalesView } from "./components/layout/sales/SalesView";
import { ReservationModal } from "./components/reservations/ReservationModal";
import { PaymentModal } from "./components/reservations/PaymentModal";
import { CommentsModerationView } from "./components/layout/comments/CommentsModerationView";
import { Equipo } from "./components/layout/equipo/Equipo";

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
        paid: cita.pagado,
        notesInternal: cita.notas || "",
        discountPct: Number(cita.descuento_porcentaje || 0),
        deposit: Number(cita.anticipo || 0),
        metodo_pago: cita.metodo_pago || "",
        color,
    };
}

function sortAppointments(a, b) {
    if (a.date === b.date) return a.time.localeCompare(b.time);
    return a.date.localeCompare(b.date);
}

export default function Administrativa() {
    const [activeTab, setActiveTab] = useState("agenda");

    const [branch, setBranch] = useState("Fisionerv Centro");

    // selector profesional (en admin/recepcion)
    const [selectedProfessionalId, setSelectedProfessionalId] = useState(null);

    const [appointments, setAppointments] = useState([]);
    const [loadingAppointments, setLoadingAppointments] = useState(true);

    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [reservationPreset, setReservationPreset] = useState(null);

    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [lastSavedCita, setLastSavedCita] = useState(null);

    const [me, setMe] = useState(null); // {id, rol, ...}
    const [professionals, setProfessionals] = useState([]); // [{id, full_name, rol, ...}]
    const [loadingMe, setLoadingMe] = useState(true);

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

    const canSeeAll = rol === "admin" || rol === "recepcion";
    const isProfessional = rol === "fisioterapeuta" || rol === "nutriologo" || rol === "dentista";

    // Tabs visibles
    const allowedTabs = useMemo(() => {
        if (rol === "admin") return ["agenda", "pacientes", "ventas", "comentarios", "equipo"];
        if (rol === "recepcion") return ["agenda"];
        if (isProfessional) return ["agenda", "pacientes"];
        return ["agenda"]; // fallback
    }, [rol, isProfessional]);

    // Si el tab actual ya no es válido, lo reajustamos
    useEffect(() => {
        if (!allowedTabs.includes(activeTab)) setActiveTab(allowedTabs[0] || "agenda");
    }, [allowedTabs, activeTab]);

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

                // normaliza "label" para UI
                const list = (prosData || []).map((p) => ({
                    ...p,
                    label: p.full_name || `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.username,
                }));
                setProfessionals(list);

                // ✅ set profesional inicial:
                // - profesional: se fija a su propio id
                // - admin/recepcion: toma el primero si no hay seleccionado
                if (meData?.rol === "fisioterapeuta" || meData?.rol === "nutriologo" || meData?.rol === "dentista") {
                    setSelectedProfessionalId(meData.id);
                } else {
                    setSelectedProfessionalId((prev) => prev ?? (list[0]?.id ?? null));
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingMe(false);
            }
        }

        loadMeAndProfessionals();
    }, []);

    // Cargar citas (ya filtradas por backend si es profesional)
    useEffect(() => {
        const token = tokenOrLogout();
        if (!token) return;

        async function loadAppointments() {
            try {
                setLoadingAppointments(true);
                const resp = await fetch(`${API_BASE}/api/citas/`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (resp.status === 401) return forceLogout();
                if (!resp.ok) throw new Error("No se pudieron cargar las citas");

                const data = await resp.json();
                const mapped = data.map(mapCitaToAppointment).sort(sortAppointments);
                setAppointments(mapped);
            } catch (err) {
                console.error(err);
                setAppointments([]);
            } finally {
                setLoadingAppointments(false);
            }
        }

        loadAppointments();
    }, []);

    const handleMoveAppointment = async (oldAppt, patch) => {
        const token = tokenOrLogout();
        if (!token) return;

        // optimistic UI
        setAppointments((prev) =>
            prev.map((a) => (a.id === oldAppt.id ? { ...a, ...patch } : a)).sort(sortAppointments),
        );

        const payload = {
            fecha: patch.date,
            hora_inicio: (patch.time || oldAppt.time) + ":00",
            hora_termina: (patch.endTime || oldAppt.endTime || patch.time) + ":00",
        };

        // ✅ solo si llega professionalId lo mandamos
        if (patch.professionalId != null) payload.profesional = patch.professionalId;

        try {
            const resp = await fetch(`${API_BASE}/api/citas/${oldAppt.id}/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (resp.status === 401) return forceLogout();

            if (!resp.ok) {
                setAppointments((prev) => prev.map((a) => (a.id === oldAppt.id ? oldAppt : a)).sort(sortAppointments));
                alert("No se pudo mover la cita. Intenta de nuevo.");
                return;
            }

            const saved = await resp.json();
            const appt = mapCitaToAppointment(saved);

            setAppointments((prev) => prev.map((a) => (a.id === appt.id ? appt : a)).sort(sortAppointments));
        } catch (e) {
            setAppointments((prev) => prev.map((a) => (a.id === oldAppt.id ? oldAppt : a)).sort(sortAppointments));
            alert("Error de red moviendo la cita.");
        }
    };

    const handleNewReservation = (preset = null) => {
        setSelectedAppointment(null);
        setReservationPreset(preset || null);
        setModalOpen(true);
    };

    const handleOpenAppointment = (appt) => {
        setSelectedAppointment(appt);
        setReservationPreset(null);
        setModalOpen(true);
    };

    const handleSaveReservation = async (form) => {
        const token = tokenOrLogout();
        if (!token) return;

        const isExistingPatient = Boolean(form.patientId);

        const basePrecio = Number(form.price || 0);
        const baseDescuento = Number(form.discountPct || 0);

        const basePayload = {
            servicio: form.serviceId,
            // ✅ profesionalId: si admin/recepcion se manda el elegido
            // si profesional, backend lo forzará a su propio usuario
            profesional: form.professionalId,
            fecha: form.date,
            hora_inicio: form.time + ":00",
            hora_termina: (form.endTime || form.time) + ":00",
            estado: form.status || "reservado",
            notas: form.notesInternal || "",
            precio: basePrecio,
            pagado: form.paid ?? false,
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
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (resp.status === 401) return forceLogout();

            if (!resp.ok) {
                const errorData = await resp.json().catch(() => null);
                console.error("Error al guardar cita:", errorData || resp.status);
                alert("Error al guardar la cita. Revisa la consola.");
                return;
            }

            const saved = await resp.json();
            const appt = mapCitaToAppointment(saved);

            if (isEditing) {
                setAppointments((prev) => prev.map((item) => (item.id === appt.id ? appt : item)).sort(sortAppointments));
            } else {
                setAppointments((prev) => [...prev, appt].sort(sortAppointments));
            }

            setModalOpen(false);
            setSelectedAppointment(null);
            setReservationPreset(null);

            if (form.paid) {
                setLastSavedCita(saved);
                setPaymentModalOpen(true);
            }
        } catch (err) {
            console.error("Error de red guardando cita:", err);
            alert("Error de red guardando cita.");
        }
    };

    const handleDeleteReservation = async (id) => {
        if (!id) return;

        const confirmDelete = window.confirm("¿Seguro que quieres eliminar esta cita? Esta acción no se puede deshacer.");
        if (!confirmDelete) return;

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
                alert("No se pudo eliminar la cita. Revisa la consola.");
                return;
            }

            setAppointments((prev) => prev.filter((c) => c.id !== id));
            setModalOpen(false);
            setSelectedAppointment(null);
            setReservationPreset(null);
        } catch (e) {
            console.error("Error al eliminar cita:", e);
            alert("Ocurrió un error al eliminar la cita.");
        }
    };

    const handleLogout = () => forceLogout();

    // Para header/selector UI
    const selectedProfessionalLabel = useMemo(() => {
        const found = professionals.find((p) => p.id === selectedProfessionalId);
        return found?.label || "Profesional";
    }, [professionals, selectedProfessionalId]);

    if (loadingMe) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center text-sm text-slate-600">
                Cargando usuario...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold shadow-sm">
                        FN
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-slate-900">Panel administrativo – Fisionerv</h1>
                        <p className="text-xs text-slate-500">
                            {rol ? `Rol: ${rol}` : "Panel"} • Agenda, pacientes y ventas en un mismo lugar.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <nav className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
                        {allowedTabs.includes("agenda") && (
                            <NavTab label="Agenda" active={activeTab === "agenda"} onClick={() => setActiveTab("agenda")} />
                        )}
                        {allowedTabs.includes("pacientes") && (
                            <NavTab label="Pacientes" active={activeTab === "pacientes"} onClick={() => setActiveTab("pacientes")} />
                        )}
                        {allowedTabs.includes("ventas") && (
                            <NavTab label="Ventas" active={activeTab === "ventas"} onClick={() => setActiveTab("ventas")} />
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
                    </nav>

                    <div className="flex items-center gap-3">
                        <button
                            className="text-xs px-3 py-1 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
                            onClick={() => (window.location.href = "/")}
                        >
                            Sitio web
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700">
                                {userEmail ? userEmail[0]?.toUpperCase() : "U"}
                            </div>
                            <span className="text-xs text-slate-600">{userEmail || "Usuario"}</span>
                            <button onClick={handleLogout} className="ml-2 text-[11px] text-red-500 hover:underline">
                                Cerrar sesión
                            </button>
                        </div>
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
                        />
                    ))}

                {activeTab === "pacientes" && (
                    <PatientsView
                        // si tu PatientsView no acepta props, no pasa nada, React los ignora
                        role={rol}
                        myUserId={me?.id}
                    />
                )}

                {activeTab === "ventas" && <SalesView />}
                {activeTab === "comentarios" && <CommentsModerationView />}
                {activeTab === "equipo" && <Equipo />}
            </div>

            {paymentModalOpen && lastSavedCita && (
                <PaymentModal cita={lastSavedCita} onClose={() => setPaymentModalOpen(false)} onSaved={() => { }} />
            )}

            {modalOpen && (
                <ReservationModal
                    appointment={selectedAppointment}
                    preset={reservationPreset}
                    appointments={appointments}
                    onClose={() => {
                        setModalOpen(false);
                        setReservationPreset(null);
                    }}
                    onSave={handleSaveReservation}
                    onDelete={handleDeleteReservation}
                />
            )}
        </div>
    );
}
