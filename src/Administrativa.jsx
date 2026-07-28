// src/Administrativa.jsx
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import "./index.css";

import { AgendaView } from "./components/layout/agenda/AgendaView";
import { PatientsView } from "./components/layout/patients/PatientsView";
import { SalesView } from "./components/layout/sales/SalesView";
import { ReservationModal } from "./components/reservations/ReservationModal";
import { CommentsModerationView } from "./components/layout/comments/CommentsModerationView";
import { Equipo } from "./components/layout/equipo/Equipo";
import { BlockTimeModal } from "./components/layout/agenda/BlockTimeModal";
import { notifySalesRefresh } from "./utils/salesSync";

import { ServiciosAdminView } from "./components/layout/servicios/ServiciosAdminView";
import { UserProfileView } from "./components/layout/profile/UserProfileView";

import {
    Activity,
    Bell,
    CalendarDays,
    ChevronsLeft,
    ChevronsRight,
    ChevronRight,
    CircleUserRound,
    Globe2,
    LogOut,
    Menu,
    MessageSquareText,
    Plus,
    Stethoscope,
    UserRoundCog,
    UsersRound,
    WalletCards,
    X,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "https://api.fisionerv.cloud";


const TAB_CONFIG = {
    agenda: {
        label: "Agenda",
        description: "Organiza citas, bloqueos y disponibilidad del equipo.",
        icon: CalendarDays,
    },
    pacientes: {
        label: "Pacientes",
        description: "Consulta expedientes, seguimiento e historial clínico.",
        icon: UsersRound,
    },
    ventas: {
        label: "Finanzas",
        description: "Revisa ventas, pagos e ingresos de la clínica.",
        icon: WalletCards,
    },
    servicios: {
        label: "Servicios",
        description: "Administra tratamientos, precios y duración.",
        icon: Stethoscope,
    },
    comentarios: {
        label: "Comentarios",
        description: "Modera comentarios y testimonios del sitio.",
        icon: MessageSquareText,
    },
    equipo: {
        label: "Equipo",
        description: "Gestiona profesionales, accesos y permisos.",
        icon: UserRoundCog,
    },
    perfil: {
        label: "Mi perfil",
        description: "Actualiza tu información y preferencias de cuenta.",
        icon: CircleUserRound,
    },
};

function getTabConfig(tab) {
    return TAB_CONFIG[tab] || {
        label: String(tab || "Panel"),
        description: "Panel administrativo de Fisionerv.",
        icon: Activity,
    };
}

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

    let color = "bg-[#eaf3ff] text-[#163b73] border-[#b9d6ff]";
    if (cita.estado === "confirmado") color = "bg-[#fff8df] text-[#8a5a00] border-[#f3d36a]";
    else if (cita.estado === "completado") color = "bg-[#e8f8ef] text-[#146c43] border-[#9fdfbd]";
    else if (cita.estado === "cancelado") color = "bg-[#fff0f3] text-[#a11d43] border-[#f2b6c6]";

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
        id: `blk-${b.id}`, // ⚠️ id frontend
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
        color: "bg-[#f1f3f7] text-[#475569] border-[#cbd5e1]",
        _type: "bloqueo",
        _raw: b, // ✅ aquí está el id real de BD
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

function BrandLogo({ compact = false }) {
    return (
        <span
            className={`relative flex shrink-0 items-center justify-center overflow-hidden border border-white/80 bg-white shadow-[0_12px_30px_rgba(0,0,0,0.24)] ${compact ? "h-11 w-11 rounded-xl p-1.5" : "h-14 w-14 rounded-2xl p-2"}`}
        >
            <span className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-blue-100/80" />
            <img
                src="/onerv.png"
                alt="Fisionerv"
                className="relative z-10 h-full w-full object-contain drop-shadow-[0_2px_2px_rgba(15,23,42,0.16)]"
                draggable="false"
            />
        </span>
    );
}

function MobileMenu({ open, onClose, allowedTabs, activeTab, onSelectTab, me, initialLetter, onLogout }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9998] lg:hidden">
            <button
                type="button"
                className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
                onClick={onClose}
                aria-label="Cerrar menú"
            />

            <aside className="absolute left-0 top-0 flex h-dvh w-[88%] max-w-[330px] flex-col overflow-hidden border-r border-white/10 bg-[#061a38] text-white shadow-[24px_0_60px_rgba(2,12,27,0.35)]">
                <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                        <BrandLogo compact />
                        <div className="min-w-0">
                            <p className="truncate text-base font-bold tracking-[0.12em]">FISIONERV</p>
                            <p className="mt-0.5 truncate text-[10px] text-blue-200/60">Panel administrativo</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                        aria-label="Cerrar menú"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5 [scrollbar-width:thin] [scrollbar-color:rgba(147,197,253,0.25)_transparent]">
                    <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200/45">
                        Administración
                    </p>
                    <div className="space-y-1.5">
                        {allowedTabs.map((tab) => {
                            const config = getTabConfig(tab);
                            const Icon = config.icon;
                            const active = activeTab === tab;
                            return (
                                <button
                                    key={tab}
                                    type="button"
                                    aria-current={active ? "page" : undefined}
                                    onClick={() => {
                                        onSelectTab(tab);
                                        onClose();
                                    }}
                                    className={`group relative flex h-12 w-full items-center gap-3 overflow-hidden rounded-xl px-3 text-left text-sm font-semibold transition ${active
                                        ? "bg-blue-600 text-white shadow-[0_10px_24px_rgba(37,99,235,0.24)]"
                                        : "text-blue-50/70 hover:bg-white/[0.08] hover:text-white"
                                        }`}
                                >
                                    {active && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-cyan-300" />}
                                    <Icon className={`h-[19px] w-[19px] shrink-0 ${active ? "text-white" : "text-blue-100/60 group-hover:text-white"}`} />
                                    <span className="min-w-0 flex-1 truncate">{config.label}</span>
                                    {active && <ChevronRight className="h-4 w-4 shrink-0 text-blue-100" />}
                                </button>
                            );
                        })}
                    </div>
                </nav>

                <div className="shrink-0 border-t border-white/10 bg-[#07172f]/95 p-3.5 backdrop-blur">
                    <div className="mb-2 grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => { window.location.href = "/"; }}
                            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-[11px] font-semibold text-blue-50/80 transition hover:bg-white/10 hover:text-white"
                        >
                            <Globe2 className="h-4 w-4" />
                            Sitio web
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onSelectTab("perfil");
                                onClose();
                            }}
                            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-[11px] font-semibold text-blue-50/80 transition hover:bg-white/10 hover:text-white"
                        >
                            <CircleUserRound className="h-4 w-4" />
                            Mi perfil
                        </button>
                    </div>

                    <div className="mb-2 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.055] p-3">
                        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-950/30">
                            {initialLetter}
                            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#07172f] bg-emerald-400" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{me?.full_name || me?.username || "Usuario"}</p>
                            <p className="truncate text-[11px] capitalize text-blue-200/50">{me?.rol || "Usuario"}</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onLogout}
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-300/10 bg-rose-500/10 text-xs font-semibold text-rose-100 transition hover:border-rose-300/20 hover:bg-rose-500/20 hover:text-white"
                    >
                        <LogOut className="h-4 w-4" />
                        Cerrar sesión
                    </button>
                </div>
            </aside>
        </div>
    );
}

function DesktopSidebar({ allowedTabs, activeTab, onSelectTab, me, initialLetter, onLogout, collapsed, onToggle }) {
    return (
        <aside
            className={`relative hidden h-screen max-h-screen shrink-0 flex-col overflow-visible border-r border-white/10 bg-[#061a38] text-white shadow-[10px_0_35px_rgba(2,12,27,0.12)] transition-[width] duration-300 lg:sticky lg:top-0 lg:flex ${collapsed ? "w-[88px]" : "w-[268px]"}`}
        >
            <button
                type="button"
                onClick={onToggle}
                aria-label={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
                title={collapsed ? "Expandir" : "Contraer"}
                className="absolute -right-[18px] top-[76px] z-50 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-[#0a2f68] shadow-[0_10px_26px_rgba(15,23,42,0.22)] transition hover:scale-105 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-200/40"
            >
                {collapsed ? <ChevronsRight className="h-[18px] w-[18px]" /> : <ChevronsLeft className="h-[18px] w-[18px]" />}
            </button>

            <div className={`flex shrink-0 items-center border-b border-white/10 py-4 ${collapsed ? "justify-center px-3" : "gap-3 px-5"}`}>
                <BrandLogo compact={collapsed} />
                {!collapsed && (
                    <div className="min-w-0">
                        <p className="truncate text-lg font-bold tracking-[0.12em]">FISIONERV</p>
                        <p className="mt-0.5 truncate text-[9px] leading-tight text-blue-200/50">
                            Evidencia científica<br />transformada en humanismo
                        </p>
                    </div>
                )}
            </div>

            <nav className={`min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgba(147,197,253,0.20)_transparent] ${collapsed ? "px-2 py-5" : "px-3 py-5"}`}>
                {!collapsed && (
                    <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200/40">
                        Administración
                    </p>
                )}

                <div className="space-y-1.5">
                    {allowedTabs.map((tab) => {
                        const config = getTabConfig(tab);
                        const Icon = config.icon;
                        const active = activeTab === tab;

                        return (
                            <button
                                key={tab}
                                type="button"
                                aria-current={active ? "page" : undefined}
                                onClick={() => onSelectTab(tab)}
                                title={collapsed ? config.label : undefined}
                                className={`group relative flex h-12 w-full items-center overflow-hidden rounded-xl text-left text-sm font-semibold transition ${collapsed ? "justify-center px-2" : "gap-3 px-3"} ${active
                                    ? "bg-blue-600 text-white shadow-[0_10px_24px_rgba(37,99,235,0.23)]"
                                    : "text-blue-50/70 hover:bg-white/[0.075] hover:text-white"
                                    }`}
                            >
                                {active && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-cyan-300" />}
                                <Icon className={`h-[19px] w-[19px] shrink-0 ${active ? "text-white" : "text-blue-100/60 group-hover:text-white"}`} />
                                {!collapsed && <span className="min-w-0 flex-1 truncate">{config.label}</span>}
                                {!collapsed && active && <ChevronRight className="h-4 w-4 shrink-0 text-blue-100" />}
                            </button>
                        );
                    })}
                </div>
            </nav>

            <div className={`shrink-0 border-t border-white/10 bg-[#07172f]/95 backdrop-blur ${collapsed ? "space-y-2 p-2.5" : "space-y-2.5 p-3.5"}`}>
                <button
                    type="button"
                    onClick={() => { window.location.href = "/"; }}
                    title={collapsed ? "Ver sitio web" : undefined}
                    className={`flex h-10 w-full items-center rounded-xl border border-white/10 bg-white/[0.045] text-xs font-semibold text-blue-50/70 transition hover:bg-white/[0.09] hover:text-white ${collapsed ? "justify-center px-0" : "gap-3 px-3"}`}
                >
                    <Globe2 className="h-[17px] w-[17px] shrink-0" />
                    {!collapsed && <span>Ver sitio web</span>}
                </button>

                <button
                    type="button"
                    onClick={() => onSelectTab("perfil")}
                    title={collapsed ? (me?.full_name || me?.username || "Mi perfil") : undefined}
                    className={`flex w-full items-center rounded-xl border border-white/10 bg-white/[0.055] text-left transition hover:bg-white/[0.09] ${collapsed ? "justify-center p-2" : "gap-3 p-2.5"}`}
                >
                    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-950/30">
                        {initialLetter}
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#07172f] bg-emerald-400" />
                    </span>
                    {!collapsed && (
                        <>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold text-white">{me?.full_name || me?.username || "Usuario"}</span>
                                <span className="mt-0.5 block truncate text-[10px] capitalize text-blue-200/50">{me?.rol || "Usuario"}</span>
                            </span>
                            <ChevronRight className="h-4 w-4 shrink-0 text-blue-200/45" />
                        </>
                    )}
                </button>

                <button
                    type="button"
                    onClick={onLogout}
                    title={collapsed ? "Cerrar sesión" : undefined}
                    className={`flex h-10 w-full items-center rounded-xl border border-rose-300/10 bg-rose-500/[0.08] text-xs font-semibold text-rose-100/80 transition hover:border-rose-300/20 hover:bg-rose-500/20 hover:text-white ${collapsed ? "justify-center px-0" : "justify-center gap-2"}`}
                >
                    <LogOut className="h-[17px] w-[17px]" />
                    {!collapsed && "Cerrar sesión"}
                </button>
            </div>
        </aside>
    );
}

export default function Administrativa() {
    const [activeTab, setActiveTab] = useState("agenda");
    const [branch, setBranch] = useState("Fisionerv Centro");
    const savingLockRef = useRef(false);
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
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("fisionerv.sidebarCollapsed") === "1");

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

    useEffect(() => {
        localStorage.setItem("fisionerv.sidebarCollapsed", sidebarCollapsed ? "1" : "0");
    }, [sidebarCollapsed]);

    const showInfo = (message, title = "Aviso") => {
        setInfoModal({ open: true, title, message });
    };

    const askConfirm = ({ title, message, danger = false, onConfirm }) => {
        setConfirmModal({ open: true, title, message, danger, onConfirm });
    };

    async function safeJson(resp) {
        try {
            return await resp.json();
        } catch (e) {
            try {
                const text = await resp.text();
                if (!text) return null;
                return JSON.parse(text);
            } catch {
                return null;
            }
        }
    }

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
                    setSelectedProfessionalId((prev) => prev ?? null);
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

            const citasData = await safeJson(respCitas);
            const citasMapped = (Array.isArray(citasData) ? citasData : []).map(mapCitaToAppointment);
            const bloqsData = respBloqs.ok ? await safeJson(respBloqs) : null;
            const bloqueosMapped = (Array.isArray(bloqsData) ? bloqsData : []).map(mapBloqueoToAppointment);

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

    useEffect(() => {
        const onRefresh = () => loadAgendaData();
        window.addEventListener("fisionerv:agenda-refresh", onRefresh);
        return () => window.removeEventListener("fisionerv:agenda-refresh", onRefresh);
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

            const saved = await safeJson(resp);
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

            const saved = await safeJson(resp);
            if (!saved?.id) {
                await loadAgendaData();
                return;
            }
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

    const normalizePhoneMX = (raw) => {
        const digits = String(raw || "").replace(/\D/g, "");
        if (!digits) return "";
        if (digits.startsWith("52") && digits.length >= 12) return digits;
        if (digits.length === 10) return `52${digits}`;
        return digits;
    };

    const handleSaveReservation = async (form) => {
        if (savingLockRef.current) return null;
        savingLockRef.current = true;

        const token = tokenOrLogout();
        if (!token) {
            savingLockRef.current = false;
            return null;
        }
        const isExistingPatient = Boolean(form.patientId);

        const basePrecio = Number(form.price || 0);
        const baseDescuento = Number(form.discountPct || 0);

        const existingAppt = form.id
            ? appointments.find((a) => String(a.id) === String(form.id))
            : null;

        const basePayload = {
            servicio: form.serviceId,
            profesional: form.professionalId,
            fecha: form.date,
            hora_inicio: String(form.time || "").slice(0, 5) + ":00",
            hora_termina: String(form.endTime || form.time || "").slice(0, 5) + ":00",
            estado: form.status || "reservado",
            notas: form.notesInternal || "",
            precio: basePrecio,

            // ✅ conservar valores actuales si el modal no los trae
            pagado: Boolean(form.paid ?? existingAppt?.paid ?? false),
            metodo_pago: mapFrontendPaymentMethodToBackend(
                form.metodo_pago ?? existingAppt?.metodo_pago ?? ""
            ),
            descuento_porcentaje: baseDescuento,
            anticipo: Number(form.deposit ?? existingAppt?.deposit ?? 0),
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
                    telefono: normalizePhoneMX(form.telefono),
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
                showInfo("Error al guardar la cita. Corrige los campos");
                return null;
            }

            const saved = await safeJson(resp);
            if (!saved?.id) {
                await loadAgendaData();
                return null;
            }
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
        } finally {
            savingLockRef.current = false;
        }
    };

    const handleDeleteReservation = async (id) => {
        if (!id) return;

        const token = tokenOrLogout();
        if (!token) return;

        try {
            const resp = await fetch(`${API_BASE}/api/citas/${id}/`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (resp.status === 401) return forceLogout();

            if (!resp.ok && resp.status !== 204) {
                const errorData = await safeJson(resp);
                console.error("Error al eliminar cita:", errorData || resp.status);
                showInfo("No se pudo eliminar la cita. Revisa la consola.");
                return;
            }

            setAppointments((prev) => prev.filter((c) => c.id !== id));
            setModalOpen(false);
            setSelectedAppointment(null);
            setReservationPreset(null);
            notifySalesRefresh();
        } catch (e) {
            console.error("Error al eliminar cita:", e);
            showInfo("Ocurrió un error al eliminar la cita.");
        }
    };

    // ✅ NUEVO: borrar bloqueo (BD + estado)
    const handleDeleteBlock = useCallback(
        async (blockAppt) => {
            const token = tokenOrLogout();
            if (!token) return;

            // id real de BD:
            // 1) si viene del mapper, está en _raw.id
            // 2) si no, parsea "blk-123"
            const rawId =
                blockAppt?._raw?.id ??
                (() => {
                    const s = String(blockAppt?.id || "");
                    if (s.startsWith("blk-")) return Number(s.slice(4));
                    const n = Number(s);
                    return Number.isFinite(n) ? n : null;
                })();

            if (!rawId) {
                showInfo("No pude identificar el id del bloqueo en BD.");
                return;
            }

            try {
                const resp = await fetch(`${API_BASE}/api/bloqueos/${rawId}/`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (resp.status === 401) return forceLogout();

                if (!resp.ok && resp.status !== 204) {
                    const err = await safeJson(resp);
                    console.error("Error eliminando bloqueo:", err || resp.status);
                    showInfo("No se pudo eliminar el bloqueo. Revisa consola.");
                    return;
                }

                // ✅ quita del estado (usa el id frontend "blk-123")
                setAppointments((prev) => prev.filter((x) => String(x.id) !== String(blockAppt.id)));

                // opcional: si quieres sincronía perfecta
                // await loadAgendaData();
            } catch (e) {
                console.error(e);
                showInfo("Error de red eliminando el bloqueo.");
            }
        },
        [loadAgendaData]
    );

    const handleLogout = () => forceLogout();

    const initialLetter =
        (me?.full_name?.trim()?.[0] ||
            me?.username?.trim()?.[0] ||
            userEmail?.trim()?.[0] ||
            "U").toUpperCase();

    if (loadingMe) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#061a38] text-sm text-blue-100">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 shadow-2xl">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-transparent" />
                    Cargando panel administrativo...
                </div>
            </div>
        );
    }

    const activeConfig = getTabConfig(activeTab);
    const ActiveIcon = activeConfig.icon;

    return (
        <div className="h-screen overflow-hidden bg-[#061a38] text-slate-900">
            <MobileMenu
                open={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                allowedTabs={allowedTabs}
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                me={me}
                initialLetter={initialLetter}
                onLogout={handleLogout}
            />

            <div className="flex h-full min-h-0">
                <DesktopSidebar
                    allowedTabs={allowedTabs}
                    activeTab={activeTab}
                    onSelectTab={setActiveTab}
                    me={me}
                    initialLetter={initialLetter}
                    onLogout={handleLogout}
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed((v) => !v)}
                />

                <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#f4f7fb]">
                    <header className=" flex min-h-[96px] shrink-0 items-center justify-between gap-4 bg-gradient-to-r from-[#082354] via-[#0a2f68] to-[#073779] px-4 py-4 text-white shadow-[0_10px_30px_rgba(2,12,27,0.18)] sm:px-6 lg:px-8">
                        <div className="flex min-w-0 items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setMobileMenuOpen(true)}
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white lg:hidden"
                                aria-label="Abrir menú"
                            >
                                <Menu className="h-5 w-5" />
                            </button>

                            <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-blue-100 sm:flex">
                                <ActiveIcon className="h-5 w-5" />
                            </span>

                            <div className="min-w-0">
                                <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{activeConfig.label}</h1>
                                <p className="mt-1 hidden truncate text-xs text-blue-100/60 sm:block">{activeConfig.description}</p>
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                            {activeTab === "agenda" && (
                                <button
                                    type="button"
                                    onClick={() => handleNewReservation({ professionalId: selectedProfessionalId || null })}
                                    className="hidden h-11 items-center gap-2 rounded-2xl bg-blue-500 px-4 text-xs font-semibold text-white shadow-lg shadow-blue-950/25 transition hover:bg-blue-400 sm:inline-flex"
                                >
                                    <Plus className="h-4 w-4" />
                                    Nueva cita
                                </button>
                            )}

                            <button
                                type="button"
                                className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-blue-50 transition hover:bg-white/20"
                                title="Notificaciones"
                            >
                                <Bell className="h-5 w-5" />
                                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-cyan-300 ring-2 ring-[#0a2f68]" />
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("perfil")}
                                className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 p-1.5 pr-2 text-left transition hover:bg-white/20"
                                title="Mi perfil"
                            >
                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-xs font-bold text-blue-800">{initialLetter}</span>
                                <span className="hidden max-w-[140px] truncate text-xs font-semibold text-white/105 md:block">{me?.username || userEmail || "Usuario"}</span>
                            </button>
                        </div>
                    </header>

                    <main className={`min-h-0 flex-1 ${activeTab === "agenda" ? "overflow-hidden" : "overflow-auto p-3 sm:p-5"}`}>
                        {activeTab === "agenda" && (
                            loadingAppointments ? (
                                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                                        Cargando citas desde el servidor...
                                    </div>
                                </div>
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
                                    onDeleteBlock={handleDeleteBlock}
                                />
                            )
                        )}

                        {activeTab !== "agenda" && (
                            <div className="min-h-full overflow-hidden rounded-3xl border border-slate-200/100 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
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
                        )}
                    </main>
                </div>
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
                onCancel={() => setConfirmModal((state) => ({ ...state, open: false }))}
                onConfirm={() => {
                    if (typeof confirmModal.onConfirm === "function") confirmModal.onConfirm();
                }}
            />
        </div>
    );
}