import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./index.css";
import { Activity, Bell, Boxes, CalendarDays, ChevronRight, ChevronsLeft, ChevronsRight, CircleUserRound, Globe2, LogOut, Menu, MessageSquareText, Plus, Stethoscope, UserRoundCog, UsersRound, WalletCards, X } from "lucide-react";
import { AgendaView } from "./components/layout/agenda/AgendaView";
import { PatientsView } from "./components/layout/patients/PatientsView";
import { SalesView } from "./components/layout/sales/SalesView";
import { ReservationModal } from "./components/reservations/ReservationModal";
import { CommentsModerationView } from "./components/layout/comments/CommentsModerationView";
import { Equipo } from "./components/layout/equipo/Equipo";
import { BlockTimeModal } from "./components/layout/agenda/BlockTimeModal";
import { ServiciosAdminView } from "./components/layout/servicios/ServiciosAdminView";
import { UserProfileView } from "./components/layout/profile/UserProfileView";
import { InsumosView } from "./components/layout/insumos/InsumosView";
import { apiFetch, installFetchWithRefresh } from "./services/apiFetch";
import { notifySalesRefresh } from "./utils/salesSync";

installFetchWithRefresh();
const TAB_CONFIG = {
    agenda: { label: "Agenda", description: "Organiza citas, bloqueos y disponibilidad del equipo.", icon: CalendarDays },
    pacientes: { label: "Pacientes", description: "Consulta expedientes, seguimiento e historial clínico.", icon: UsersRound },
    ventas: { label: "Finanzas", description: "Analiza pagos, ingresos y cortes por fecha real de cobro.", icon: WalletCards },
    servicios: { label: "Servicios", description: "Administra tratamientos, precios y duración.", icon: Stethoscope },
    comentarios: { label: "Comentarios", description: "Modera comentarios y testimonios del sitio.", icon: MessageSquareText },
    equipo: { label: "Equipo", description: "Gestiona usuarios, roles e interfaces visibles.", icon: UserRoundCog },
    insumos: { label: "Insumos", description: "Controla inventario, compras y ventas de productos.", icon: Boxes },
    perfil: { label: "Mi perfil", description: "Actualiza tu información y seguridad de cuenta.", icon: CircleUserRound },
};
const DEFAULT_INTERFACES = ["agenda", "perfil"];
function getTabConfig(tab) { return TAB_CONFIG[tab] || { label: String(tab || "Panel"), description: "Panel administrativo de Fisionerv.", icon: Activity }; }
function mapFrontendPaymentMethodToBackend(value) { const v = String(value || "").toLowerCase(); if (["tarjeta_credito", "tarjeta_debito", "tarjeta"].includes(v)) return "tarjeta"; if (v === "transferencia") return "transferencia"; if (v === "efectivo") return "efectivo"; return v ? "otro" : ""; }
function mapCitaToAppointment(cita) { const time = String(cita.hora_inicio || "").slice(0, 5); const endTime = String(cita.hora_termina || "").slice(0, 5); let color = "bg-[#eaf3ff] text-[#163b73] border-[#b9d6ff]"; if (cita.estado === "confirmado") color = "bg-[#fff8df] text-[#8a5a00] border-[#f3d36a]"; else if (cita.estado === "completado") color = "bg-[#e8f8ef] text-[#146c43] border-[#9fdfbd]"; else if (cita.estado === "cancelado") color = "bg-[#fff0f3] text-[#a11d43] border-[#f2b6c6]"; return { id: cita.id, date: cita.fecha, time, endTime, patientId: cita.paciente, patient: cita.paciente_nombre || "Paciente", service: cita.servicio_nombre || "Servicio", serviceId: cita.servicio, professionalId: cita.profesional, professional: cita.profesional_nombre || "Profesional", status: cita.estado, price: Number(cita.precio || 0), paid: Boolean(cita.pagado), notesInternal: cita.notas || "", discountPct: Number(cita.descuento_porcentaje || 0), deposit: Number(cita.anticipo || 0), montoFacturado: Number(cita.monto_final || cita.precio || 0), metodo_pago: cita.metodo_pago || "", color, _type: "cita" }; }
function mapBloqueoToAppointment(item) { return { id: `blk-${item.id}`, date: item.fecha, time: String(item.hora_inicio || "08:00").slice(0, 5), endTime: String(item.hora_termina || "09:00").slice(0, 5), motivo: String(item.motivo || "").trim() || "No disponible", patient: "Horario bloqueado", service: String(item.motivo || "").trim() || "Bloqueo", professionalId: item.profesional, professional: item.profesional_nombre || "Profesional", status: "bloqueado", price: 0, paid: false, type: "bloqueo", color: "bg-[#f1f3f7] text-[#475569] border-[#cbd5e1]", _type: "bloqueo", _raw: item }; }
function sortAppointments(a, b) { return a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date); }
const DAYKEY_TO_JS = { D: 0, L: 1, M: 2, X: 3, J: 4, V: 5, S: 6 };
function isoToDate(value) { const [y, m, d] = String(value).split("-").map(Number); return new Date(y, (m || 1) - 1, d || 1); }
function dateToIso(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function buildRepeatDatesCount({ startDateIso, repeatDays, repeatCount }) { const start = isoToDate(startDateIso); const target = new Set((repeatDays || []).map(key => DAYKEY_TO_JS[key]).filter(value => typeof value === "number")); if (!target.size) return []; const out = []; for (let i = 0; i < 365 && out.length < Number(repeatCount || 1); i++) { const d = new Date(start); d.setDate(start.getDate() + i); if (target.has(d.getDay())) out.push(dateToIso(d)); } return out; }
async function readJson(response) { try { return await response.json(); } catch { return null; } }
function normalizePhoneMX(raw) { const digits = String(raw || "").replace(/\D/g, ""); if (!digits) return ""; if (digits.startsWith("52") && digits.length >= 12) return digits; return digits.length === 10 ? `52${digits}` : digits; }
function ModalShell({ title, children, onClose, actions }) { return <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"><div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><p className="text-sm font-black text-slate-900">{title}</p><button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 text-slate-500"><X className="h-4 w-4" /></button></div><div className="px-5 py-4 text-sm text-slate-600">{children}</div>{actions && <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">{actions}</div>}</div></div>; }
function InfoModal({ data, onClose }) { if (!data.open) return null; return <ModalShell title={data.title || "Aviso"} onClose={onClose} actions={<button onClick={onClose} className="rounded-xl bg-[#0a2f68] px-4 py-2 text-xs font-black text-white">Entendido</button>}>{data.message}</ModalShell>; }
function BrandLogo({ compact = false }) { return <span className={`relative flex shrink-0 items-center justify-center overflow-hidden border border-white/80 bg-white shadow-[0_12px_30px_rgba(0,0,0,.24)] ${compact ? "h-11 w-11 rounded-xl p-1.5" : "h-14 w-14 rounded-2xl p-2"}`}><span className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-blue-100/80" /><img src="/onerv.png" alt="Fisionerv" className="relative z-10 h-full w-full object-contain" draggable="false" /></span>; }
function NavItem({ tab, active, collapsed, onClick }) { const config = getTabConfig(tab); const Icon = config.icon; return <button type="button" onClick={onClick} title={collapsed ? config.label : undefined} className={`group relative flex h-12 w-full items-center overflow-hidden rounded-xl text-left text-sm font-bold transition ${collapsed ? "justify-center px-2" : "gap-3 px-3"} ${active ? "bg-blue-600 text-white shadow-[0_10px_24px_rgba(37,99,235,.23)]" : "text-blue-50/70 hover:bg-white/[.075] hover:text-white"}`}>{active && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-cyan-300" />}<Icon className={`h-[19px] w-[19px] shrink-0 ${active ? "text-white" : "text-blue-100/60 group-hover:text-white"}`} />{!collapsed && <span className="min-w-0 flex-1 truncate">{config.label}</span>}{!collapsed && active && <ChevronRight className="h-4 w-4 text-blue-100" />}</button>; }
function DesktopSidebar({ tabs, activeTab, onSelect, me, initialLetter, onLogout, collapsed, onToggle }) { return <aside className={`relative hidden h-screen shrink-0 flex-col border-r border-white/10 bg-[#061a38] text-white shadow-[10px_0_35px_rgba(2,12,27,.12)] transition-[width] duration-300 lg:flex ${collapsed ? "w-[88px]" : "w-[268px]"}`}><button onClick={onToggle} className="absolute -right-[18px] top-[76px] z-50 grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-[#0a2f68] shadow-lg">{collapsed ? <ChevronsRight className="h-[18px] w-[18px]" /> : <ChevronsLeft className="h-[18px] w-[18px]" />}</button><div className={`flex items-center border-b border-white/10 py-4 ${collapsed ? "justify-center px-3" : "gap-3 px-5"}`}><BrandLogo compact={collapsed} />{!collapsed && <div className="min-w-0"><p className="truncate text-lg font-black tracking-[.12em]">FISIONERV</p><p className="mt-0.5 text-[9px] leading-tight text-blue-200/50">Evidencia científica<br />transformada en humanismo</p></div>}</div><nav className={`min-h-0 flex-1 overflow-y-auto ${collapsed ? "px-2 py-5" : "px-3 py-5"}`}>{!collapsed && <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.22em] text-blue-200/40">Administración</p>}<div className="space-y-1.5">{tabs.map(tab => <NavItem key={tab} tab={tab} active={activeTab === tab} collapsed={collapsed} onClick={() => onSelect(tab)} />)}</div></nav><div className={`border-t border-white/10 bg-[#07172f]/95 ${collapsed ? "space-y-2 p-2.5" : "space-y-2.5 p-3.5"}`}><button onClick={() => { window.location.href = "/"; }} className={`flex h-10 w-full items-center rounded-xl border border-white/10 bg-white/[.045] text-xs font-bold text-blue-50/70 hover:bg-white/[.09] ${collapsed ? "justify-center" : "gap-3 px-3"}`}><Globe2 className="h-4 w-4" />{!collapsed && "Ver sitio web"}</button><button onClick={() => onSelect("perfil")} className={`flex w-full items-center rounded-xl border border-white/10 bg-white/[.055] ${collapsed ? "justify-center p-2" : "gap-3 p-2.5"}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-black">{me?.foto_url ? <img src={me.foto_url} alt="" className="h-full w-full rounded-xl object-cover" /> : initialLetter}</span>{!collapsed && <span className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-bold">{me?.full_name || me?.username}</span><span className="block truncate text-[10px] text-blue-200/50">{me?.rol}</span></span>}</button><button onClick={onLogout} className={`flex h-10 w-full items-center rounded-xl border border-rose-300/10 bg-rose-500/[.08] text-xs font-bold text-rose-100/80 hover:bg-rose-500/20 ${collapsed ? "justify-center" : "justify-center gap-2"}`}><LogOut className="h-4 w-4" />{!collapsed && "Cerrar sesión"}</button></div></aside>; }
function MobileMenu({ open, tabs, activeTab, onSelect, onClose, me, initialLetter, onLogout }) { if (!open) return null; return <div className="fixed inset-0 z-[9998] lg:hidden"><button className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm" onClick={onClose} /><aside className="absolute left-0 top-0 flex h-dvh w-[88%] max-w-[330px] flex-col bg-[#061a38] text-white shadow-2xl"><div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div className="flex items-center gap-3"><BrandLogo compact /><div><p className="font-black tracking-[.12em]">FISIONERV</p><p className="text-[10px] text-blue-200/50">Panel administrativo</p></div></div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10"><X className="h-4 w-4" /></button></div><nav className="min-h-0 flex-1 overflow-y-auto p-3 pt-5"><div className="space-y-1.5">{tabs.map(tab => <NavItem key={tab} tab={tab} active={activeTab === tab} onClick={() => { onSelect(tab); onClose(); }} />)}</div></nav><div className="border-t border-white/10 p-3"><div className="mb-2 flex items-center gap-3 rounded-xl bg-white/[.055] p-3"><span className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-blue-500 font-black">{me?.foto_url ? <img src={me.foto_url} alt="" className="h-full w-full object-cover" /> : initialLetter}</span><div className="min-w-0"><p className="truncate text-sm font-bold">{me?.full_name || me?.username}</p><p className="text-[10px] text-blue-200/50">{me?.rol}</p></div></div><button onClick={onLogout} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-rose-500/10 text-xs font-bold text-rose-100"><LogOut className="h-4 w-4" />Cerrar sesión</button></div></aside></div>; }

export default function Administrativa() {
    const [activeTab, setActiveTab] = useState("agenda"); const [branch, setBranch] = useState("Fisionerv Centro"); const [selectedProfessionalId, setSelectedProfessionalId] = useState(null); const [appointments, setAppointments] = useState([]); const [loadingAppointments, setLoadingAppointments] = useState(true); const [selectedAppointment, setSelectedAppointment] = useState(null); const [modalOpen, setModalOpen] = useState(false); const [reservationPreset, setReservationPreset] = useState(null); const [me, setMe] = useState(null); const [professionals, setProfessionals] = useState([]); const [loadingMe, setLoadingMe] = useState(true); const [blockOpen, setBlockOpen] = useState(false); const [blockPreset, setBlockPreset] = useState(null); const [info, setInfo] = useState({ open: false, title: "", message: "" }); const [mobileMenuOpen, setMobileMenuOpen] = useState(false); const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("fisionerv.sidebarCollapsed") === "1"); const savingLockRef = useRef(false);
    const role = me?.rol || null; const permissions = me?.permisos || {};
    const allowedTabs = useMemo(() => {
        const source = Array.isArray(me?.interfaces) && me.interfaces.length ? me.interfaces : DEFAULT_INTERFACES;
        const moneyRole = ["admin", "fisioterapeuta", "recepcion"].includes(role);
        let valid = source.filter(tab => TAB_CONFIG[tab]);
        if (!moneyRole) valid = valid.filter(tab => tab !== "ventas");
        return valid.includes("perfil") ? valid : [...valid, "perfil"];
    }, [me, role]);
    useEffect(() => { if (allowedTabs.length && !allowedTabs.includes(activeTab)) setActiveTab(allowedTabs[0]); }, [allowedTabs, activeTab]);
    useEffect(() => { localStorage.setItem("fisionerv.sidebarCollapsed", sidebarCollapsed ? "1" : "0"); }, [sidebarCollapsed]);
    useEffect(() => { const onResize = () => { if (window.innerWidth >= 1024) setMobileMenuOpen(false); }; window.addEventListener("resize", onResize); return () => window.removeEventListener("resize", onResize); }, []);
    const showInfo = (message, title = "Aviso") => setInfo({ open: true, title, message });
    const forceLogout = () => { localStorage.removeItem("auth.access"); localStorage.removeItem("auth.refresh"); localStorage.removeItem("auth.user"); window.location.href = "/login"; };
    useEffect(() => { let alive = true; async function loadIdentity() { setLoadingMe(true); try { const [mr, pr] = await Promise.all([apiFetch("/api/me/"), apiFetch("/api/profesionales/")]); const [md, pd] = await Promise.all([readJson(mr), readJson(pr)]); if (!mr.ok) throw new Error(md?.detail || "No se pudo cargar la sesión."); if (!pr.ok) throw new Error(pd?.detail || "No se pudieron cargar profesionales."); if (!alive) return; setMe(md); const list = (Array.isArray(pd) ? pd : pd?.results || []).map(p => ({ ...p, label: p.full_name || `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.username })); setProfessionals(list); if (["fisioterapeuta", "terapeuta", "practicante", "nutriologo", "dentista"].includes(md?.rol)) setSelectedProfessionalId(md.id); } catch (error) { if (alive) showInfo(error.message || "No se pudo cargar la sesión.", "Sesión"); } finally { if (alive) setLoadingMe(false); } } loadIdentity(); return () => { alive = false; }; }, []);
    const loadAgendaData = useCallback(async () => { try { setLoadingAppointments(true); const [cr, br] = await Promise.all([apiFetch("/api/citas/"), apiFetch("/api/bloqueos/")]); const [cd, bd] = await Promise.all([readJson(cr), readJson(br)]); if (!cr.ok) throw new Error(cd?.detail || "No se pudieron cargar las citas."); const citas = (Array.isArray(cd) ? cd : cd?.results || []).map(mapCitaToAppointment); const bloques = br.ok ? (Array.isArray(bd) ? bd : bd?.results || []).map(mapBloqueoToAppointment) : []; setAppointments([...citas, ...bloques].sort(sortAppointments)); } catch (error) { setAppointments([]); showInfo(error.message || "No se pudo cargar la agenda.", "Agenda"); } finally { setLoadingAppointments(false); } }, []);
    useEffect(() => { if (!loadingMe) loadAgendaData(); }, [loadingMe, loadAgendaData]); useEffect(() => { const refresh = () => loadAgendaData(); window.addEventListener("fisionerv:agenda-refresh", refresh); return () => window.removeEventListener("fisionerv:agenda-refresh", refresh); }, [loadAgendaData]);
    const refreshAppointmentById = useCallback(async id => { if (!id) return null; try { const response = await apiFetch(`/api/citas/${id}/`); if (!response.ok) return null; const saved = await readJson(response); const appt = mapCitaToAppointment(saved); setAppointments(prev => prev.map(item => String(item.id) === String(appt.id) ? appt : item).sort(sortAppointments)); return saved; } catch { return null; } }, []);
    async function handleMoveAppointment(oldAppt, patch) { if (oldAppt?._type === "bloqueo") return; setAppointments(prev => prev.map(item => item.id === oldAppt.id ? { ...item, ...patch } : item).sort(sortAppointments)); const payload = { fecha: patch.date, hora_inicio: `${patch.time || oldAppt.time}:00`, hora_termina: `${patch.endTime || oldAppt.endTime || patch.time}:00` }; if (patch.professionalId != null) payload.profesional = patch.professionalId; try { const response = await apiFetch(`/api/citas/${oldAppt.id}/`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const data = await readJson(response); if (!response.ok) throw new Error(data?.detail || "No se pudo mover la cita."); const appt = mapCitaToAppointment(data); setAppointments(prev => prev.map(item => String(item.id) === String(appt.id) ? appt : item).sort(sortAppointments)); } catch (error) { setAppointments(prev => prev.map(item => item.id === oldAppt.id ? oldAppt : item).sort(sortAppointments)); showInfo(error.message || "No se pudo mover la cita.", "Agenda"); } }
    function handleNewReservation(preset = null) { setSelectedAppointment(null); setReservationPreset(preset); setModalOpen(true); } function handleOpenAppointment(appt) { if (appt?._type === "bloqueo") return; setSelectedAppointment(appt); setReservationPreset(null); setModalOpen(true); } function handleOpenBlockModal(preset) { setBlockPreset(preset || null); setBlockOpen(true); }
    async function handleSaveBlockTime(form) { if (!form.professionalId) return showInfo("Selecciona un profesional para bloquear.", "Validación"); const dates = form.repeatEnabled ? buildRepeatDatesCount({ startDateIso: form.date, repeatDays: form.repeatDays, repeatCount: form.repeatCount }) : [form.date]; try { for (const date of dates) { const response = await apiFetch("/api/bloqueos/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profesional: form.professionalId, fecha: date, hora_inicio: `${String(form.startTime || "08:00").slice(0, 5)}:00`, hora_termina: `${String(form.endTime || "09:00").slice(0, 5)}:00`, motivo: String(form.motivo || "").trim() }) }); const data = await readJson(response); if (!response.ok) throw new Error(data?.detail || "No se pudo crear el bloqueo."); } setBlockOpen(false); setBlockPreset(null); await loadAgendaData(); } catch (error) { showInfo(error.message || "No se pudo crear el bloqueo.", "Bloqueo"); } }
    async function handleSaveReservation(form) {
        if (savingLockRef.current) return null;
        savingLockRef.current = true;

        const existing = form.id ? appointments.find(item => String(item.id) === String(form.id)) : null;
        const canEditMoney = ["admin", "fisioterapeuta", "recepcion"].includes(role);
        const canSeeContact = role !== "practicante" && (permissions?.puede_ver_contacto_paciente ?? true);

        const base = {
            servicio: form.serviceId,
            profesional: form.professionalId,
            fecha: form.date,
            hora_inicio: `${String(form.time || "").slice(0, 5)}:00`,
            hora_termina: `${String(form.endTime || form.time || "").slice(0, 5)}:00`,
            estado: form.status || "reservado",
            notas: form.notesInternal || "",
        };

        if (canEditMoney) {
            const price = Number(form.price ?? existing?.price ?? 0);
            const discount = Number(form.discountPct ?? existing?.discountPct ?? 0);
            Object.assign(base, {
                precio: price,
                pagado: Boolean(form.paid ?? existing?.paid ?? false),
                metodo_pago: mapFrontendPaymentMethodToBackend(form.metodo_pago ?? existing?.metodo_pago ?? ""),
                descuento_porcentaje: discount,
                anticipo: Number(form.deposit ?? existing?.deposit ?? 0),
                monto_final: price - (price * discount) / 100,
            });
        }

        const isExistingPatient = Boolean(form.patientId);
        const patientData = {
            nombres: form.patient,
            apellido_pat: form.apellido_pat || "",
            apellido_mat: form.apellido_mat || "",
            fecha_nac: form.fecha_nac || null,
            genero: form.genero || "",
            molestia: form.molestia || "",
            notas: form.notesInternal || "",
        };

        if (canSeeContact) {
            patientData.telefono = normalizePhoneMX(form.telefono);
            patientData.correo = form.correo || "";
        }

        const payload = isExistingPatient
            ? { ...base, paciente: form.patientId }
            : { ...base, paciente: patientData };
        const editing = Boolean(form.id);

        try {
            const response = await apiFetch(editing ? `/api/citas/${form.id}/` : "/api/citas/", {
                method: editing ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await readJson(response);
            if (!response.ok) {
                const first = data && Object.values(data)[0];
                throw new Error(data?.detail || (Array.isArray(first) ? first[0] : first) || "No se pudo guardar la cita.");
            }
            if (data?.id) {
                const appt = mapCitaToAppointment(data);
                setAppointments(prev => (editing ? prev.map(item => String(item.id) === String(appt.id) ? appt : item) : [...prev, appt]).sort(sortAppointments));
            } else {
                await loadAgendaData();
            }
            return data;
        } catch (error) {
            showInfo(error.message || "No se pudo guardar la cita.", "Cita");
            return null;
        } finally {
            savingLockRef.current = false;
        }
    }
    async function handleDeleteReservation(id) { if (!id) return; try { const response = await apiFetch(`/api/citas/${id}/`, { method: "DELETE" }); if (!response.ok && response.status !== 204) throw new Error("No se pudo eliminar la cita."); setAppointments(prev => prev.filter(item => String(item.id) !== String(id))); setModalOpen(false); setSelectedAppointment(null); setReservationPreset(null); notifySalesRefresh(); } catch (error) { showInfo(error.message, "Eliminar cita"); } }
    const handleDeleteBlock = useCallback(async block => { const rawId = block?._raw?.id ?? (String(block?.id || "").startsWith("blk-") ? Number(String(block.id).slice(4)) : Number(block?.id)); if (!rawId) return showInfo("No se pudo identificar el bloqueo.", "Bloqueo"); try { const response = await apiFetch(`/api/bloqueos/${rawId}/`, { method: "DELETE" }); if (!response.ok && response.status !== 204) throw new Error("No se pudo eliminar el bloqueo."); setAppointments(prev => prev.filter(item => String(item.id) !== String(block.id))); } catch (error) { showInfo(error.message, "Bloqueo"); } }, []);
    const initialLetter = String(me?.full_name || me?.username || localStorage.getItem("auth.user") || "U").trim()[0]?.toUpperCase() || "U";
    if (loadingMe) return <div className="grid min-h-screen place-items-center bg-[#061a38] text-sm text-blue-100"><div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4"><span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-transparent" />Cargando panel administrativo...</div></div>;
    const activeConfig = getTabConfig(activeTab); const ActiveIcon = activeConfig.icon;
    return <div className="h-screen overflow-hidden bg-[#061a38] text-slate-900"><MobileMenu open={mobileMenuOpen} tabs={allowedTabs} activeTab={activeTab} onSelect={setActiveTab} onClose={() => setMobileMenuOpen(false)} me={me} initialLetter={initialLetter} onLogout={forceLogout} /><div className="flex h-full min-h-0"><DesktopSidebar tabs={allowedTabs} activeTab={activeTab} onSelect={setActiveTab} me={me} initialLetter={initialLetter} onLogout={forceLogout} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(v => !v)} /><div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#f4f7fb]"><header className="flex min-h-[96px] shrink-0 items-center justify-between gap-4 bg-gradient-to-r from-[#082354] via-[#0a2f68] to-[#073779] px-4 py-4 text-white shadow-[0_10px_30px_rgba(2,12,27,.18)] sm:px-6 lg:px-8"><div className="flex min-w-0 items-center gap-3"><button onClick={() => setMobileMenuOpen(true)} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/10 lg:hidden"><Menu className="h-5 w-5" /></button><span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-blue-100 sm:flex"><ActiveIcon className="h-5 w-5" /></span><div className="min-w-0"><h1 className="truncate text-2xl font-black tracking-tight sm:text-3xl">{activeConfig.label}</h1><p className="mt-1 hidden truncate text-xs text-blue-100/60 sm:block">{activeConfig.description}</p></div></div><div className="flex items-center gap-2">{activeTab === "agenda" && <button onClick={() => handleNewReservation({ professionalId: selectedProfessionalId || null })} className="hidden h-11 items-center gap-2 rounded-2xl bg-blue-500 px-4 text-xs font-black text-white shadow-lg sm:inline-flex"><Plus className="h-4 w-4" />Nueva cita</button>}<button className="relative grid h-11 w-11 place-items-center rounded-2xl border border-white/20 bg-white/10"><Bell className="h-5 w-5" /></button><button onClick={() => setActiveTab("perfil")} className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl border border-white/20 bg-white/10 text-xs font-black">{me?.foto_url ? <img src={me.foto_url} alt="" className="h-full w-full object-cover" /> : initialLetter}</button></div></header><main className={`min-h-0 flex-1 ${activeTab === "agenda" ? "overflow-hidden" : "overflow-auto"}`}>{activeTab === "agenda" && (loadingAppointments ? <div className="grid h-full place-items-center text-sm text-slate-500"><span>Cargando agenda...</span></div> : <AgendaView branch={branch} setBranch={setBranch} appointments={appointments} professionals={professionals} selectedProfessionalId={selectedProfessionalId} setSelectedProfessionalId={setSelectedProfessionalId} role={role} permissions={permissions} myUserId={me?.id} onNewReservation={handleNewReservation} onOpenAppointment={handleOpenAppointment} onMoveAppointment={handleMoveAppointment} onOpenBlockModal={handleOpenBlockModal} onDeleteBlock={handleDeleteBlock} />)}{activeTab === "pacientes" && <PatientsView role={role} permissions={permissions} myUserId={me?.id} />} {activeTab === "ventas" && <SalesView permissions={permissions} />} {activeTab === "servicios" && <ServiciosAdminView role={role} />} {activeTab === "comentarios" && <CommentsModerationView />} {activeTab === "equipo" && <Equipo />} {activeTab === "insumos" && <InsumosView permissions={permissions} />} {activeTab === "perfil" && <UserProfileView me={me} onUpdated={next => { setMe(next); if (next?.email) localStorage.setItem("auth.user", next.email); }} onShowInfo={(msg, title) => showInfo(msg, title)} />}</main></div></div>{modalOpen && <ReservationModal appointment={selectedAppointment} preset={reservationPreset} appointments={appointments} onClose={() => { setModalOpen(false); setReservationPreset(null); setSelectedAppointment(null); }} onSave={handleSaveReservation} onDelete={handleDeleteReservation} onRefreshAppointment={refreshAppointmentById} onRequestCloseModal={() => { setModalOpen(false); setReservationPreset(null); setSelectedAppointment(null); }} />}{blockOpen && <BlockTimeModal preset={blockPreset} onClose={() => { setBlockOpen(false); setBlockPreset(null); }} onSave={handleSaveBlockTime} />}<InfoModal data={info} onClose={() => setInfo({ open: false, title: "", message: "" })} /></div>;
}
