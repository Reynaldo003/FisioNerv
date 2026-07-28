//proyecto fisionerv
// src/components/layout/agenda/AgendaView.jsx
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { MiniCalendar } from "./MiniCalendar";
import {
  AlertTriangle,
  Ban,
  Banknote,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleX,
  Clock3,
  DollarSign,
  Plus,
  Search,
  SlidersHorizontal,
  Timer,
  UserCheck2,
  UsersRound,
  WalletCards,
} from "lucide-react";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.matchMedia(query);
    const onChange = () => setMatches(Boolean(m.matches));
    onChange();
    m.addEventListener?.("change", onChange);
    return () => m.removeEventListener?.("change", onChange);
  }, [query]);

  return matches;
}

function startOfWeekMonday(date) {
  const d = new Date(date);
  const jsDay = d.getDay();
  const deltaToMonday = (jsDay + 6) % 7;
  d.setDate(d.getDate() - deltaToMonday);
  return d;
}

function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatLongDate(date) {
  return date
    .toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .replace(/^\w/, (c) => c.toUpperCase());
}

function safeMoney(n) {
  const x = Number(n || 0);
  return x.toFixed(2);
}

function weekdayShortEs(dateObj) {
  const map = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
  return map[dateObj.getDay()] || "";
}

function toMinutes(time) {
  if (!time) return 0;
  const hh = parseInt(String(time).slice(0, 2), 10) || 0;
  const mm = parseInt(String(time).slice(3, 5), 10) || 0;
  return hh * 60 + mm;
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

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

function overlapsMinutes(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function rectFromPoint(x, y) {
  return {
    left: x,
    top: y,
    right: x,
    bottom: y,
    width: 0,
    height: 0,
  };
}

function getClientPoint(e) {
  const t = e?.touches?.[0] || e?.changedTouches?.[0];
  const x = t?.clientX ?? e?.clientX ?? 0;
  const y = t?.clientY ?? e?.clientY ?? 0;
  return { x, y };
}

function isBlockItem(a) {
  if (!a) return false;

  const t = String(a.type || a.kind || a.__type || a.tipo || "").toLowerCase();

  if (t.includes("bloque")) return true;
  if (t === "block" || t === "blocked") return true;

  if (a.isBlock === true || a.isBlocked === true || a.blocked === true) return true;

  const hasMotivo = typeof a.motivo === "string" && a.motivo.trim().length > 0;
  const hasPaciente = String(a.patient || "").trim().length > 0;
  const hasServicio = String(a.service || "").trim().length > 0;

  if (hasMotivo && !hasPaciente && !hasServicio) return true;

  if (String(a._type || "").toLowerCase().includes("bloque")) return true;

  return false;
}

function normalizeAppointmentStatus(status) {
  const s = String(status || "").trim().toLowerCase();
  if (["completado", "si_asistio", "si asistio", "asistio", "asistió"].includes(s)) return "si_asistio";
  if (["cancelado", "no_asistio", "no asistio", "inasistencia", "no-show", "no_show"].includes(s)) return "no_asistio";
  if (s === "confirmado") return "confirmado";
  if (!s || s === "reservado" || s === "pendiente") return "reservado";
  return s;
}

function matchesStatusFilter(appt, statusFilter) {
  if (isBlockItem(appt)) return true;
  if (!statusFilter || statusFilter === "all") return true;
  return normalizeAppointmentStatus(appt.status) === statusFilter;
}

function matchesPaymentFilter(appt, paymentFilter) {
  if (isBlockItem(appt)) return true;
  if (!paymentFilter || paymentFilter === "all") return true;
  const paid = Boolean(appt.paid || appt.pagado);
  if (paymentFilter === "paid") return paid;
  if (paymentFilter === "unpaid") return !paid;
  return true;
}

function appointmentStatusPill(status) {
  const normalized = normalizeAppointmentStatus(status);
  if (normalized === "confirmado") return "bg-amber-100 text-amber-700";
  if (normalized === "si_asistio") return "bg-emerald-100 text-emerald-700";
  if (normalized === "no_asistio") return "bg-rose-100 text-rose-700";
  return "bg-blue-100 text-blue-700";
}

function HoverCard({ open, anchorRect, children }) {
  if (!open || !anchorRect) return null;

  const top = anchorRect.top - 8;
  const left = anchorRect.left + anchorRect.width + 10;

  return (
    <div className="fixed z-[80]" style={{ top, left, maxWidth: 280 }}>
      <div className="rounded-xl border border-slate-200 bg-white shadow-xl p-3">
        {children}
      </div>
    </div>
  );
}

function MenuPopover({ open, anchorRect, preferUp = false, onClose, children }) {
  const menuRef = useRef(null);
  const [autoUp, setAutoUp] = useState(Boolean(preferUp));
  const [clampedLeft, setClampedLeft] = useState(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e) => e.key === "Escape" && onClose?.();

    const onPointerDown = (e) => {
      const el = document.querySelector("[data-slot-menu='1']");
      if (el && el.contains(e.target)) return;
      onClose?.();
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointerDown);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    setAutoUp(Boolean(preferUp));
  }, [preferUp]);

  useEffect(() => {
    if (!open || !anchorRect) return;

    const raf = requestAnimationFrame(() => {
      const el = menuRef.current;
      if (!el) return;

      const menuH = el.offsetHeight || 0;
      const menuW = el.offsetWidth || 0;

      const margin = 10;
      const spaceBelow = window.innerHeight - anchorRect.bottom;
      const spaceAbove = anchorRect.top;

      const shouldGoUp = menuH + margin > spaceBelow && spaceAbove >= menuH + margin;
      setAutoUp(shouldGoUp);

      const rawLeft = anchorRect.left;
      const maxLeft = window.innerWidth - menuW - margin;
      const minLeft = margin;
      setClampedLeft(Math.min(Math.max(rawLeft, minLeft), maxLeft));
    });

    return () => cancelAnimationFrame(raf);
  }, [open, anchorRect]);

  if (!open || !anchorRect) return null;

  const left = clampedLeft != null ? clampedLeft : anchorRect.left;
  const downTop = anchorRect.top + anchorRect.height + 6;
  const upTop = anchorRect.top - 6;

  return (
    <div
      className="fixed z-[90]"
      style={{
        left,
        top: autoUp ? upTop : downTop,
        transform: autoUp ? "translateY(-100%)" : "none",
      }}
    >
      <div
        ref={menuRef}
        data-slot-menu="1"
        className="rounded-xl border border-slate-200 bg-white shadow-xl p-2 min-w-[220px]"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}


const METRIC_TONES = {
  blue: {
    shell: "bg-blue-50 text-blue-700",
    icon: "bg-blue-100 text-blue-700",
  },
  emerald: {
    shell: "bg-emerald-50 text-emerald-700",
    icon: "bg-emerald-100 text-emerald-700",
  },
  amber: {
    shell: "bg-amber-50 text-amber-700",
    icon: "bg-amber-100 text-amber-700",
  },
  rose: {
    shell: "bg-rose-50 text-rose-700",
    icon: "bg-rose-100 text-rose-700",
  },
  cyan: {
    shell: "bg-cyan-50 text-cyan-700",
    icon: "bg-cyan-100 text-cyan-700",
  },
  violet: {
    shell: "bg-violet-50 text-violet-700",
    icon: "bg-violet-100 text-violet-700",
  },
};

function MetricCard({ title, value, helper, icon: Icon, tone = "blue" }) {
  const styles = METRIC_TONES[tone] || METRIC_TONES.blue;

  return (
    <article className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium text-slate-500">{title}</p>
          <p className="mt-1 truncate text-2xl font-bold tracking-tight text-slate-950">{value}</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${styles.icon}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className={`mt-3 text-[11px] font-semibold ${styles.shell} w-fit rounded-full px-2 py-1`}>{helper}</p>
    </article>
  );
}

function SmallSummaryRow({ icon: Icon, label, value, tone = "text-slate-600" }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" />
        </span>
        <span className="truncate text-xs font-medium text-slate-600">{label}</span>
      </div>
      <span className={`text-sm font-bold ${tone}`}>{value}</span>
    </div>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function durationLabel(minutes) {
  const total = Math.max(0, Math.round(Number(minutes || 0)));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (!hours) return `${mins} min`;
  if (!mins) return `${hours} h`;
  return `${hours} h ${mins} min`;
}

export function AgendaView({
  branch,
  setBranch,
  appointments,
  professionals,
  selectedProfessionalId,
  setSelectedProfessionalId,
  role,
  myUserId,
  onNewReservation,
  onOpenAppointment,
  onMoveAppointment,
  onOpenBlockModal,
  onDeleteBlock,
}) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [quickSearch, setQuickSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [viewMode, setViewMode] = useState("day");
  const [currentDate, setCurrentDate] = useState(new Date());

  const [dualMode, setDualMode] = useState(false);
  const [proA, setProA] = useState(selectedProfessionalId || null);
  const [proB, setProB] = useState(null);

  const [activeApptId, setActiveApptId] = useState(null);

  const [hoverAppt, setHoverAppt] = useState(null);
  const [hoverRect, setHoverRect] = useState(null);

  const [slotMenu, setSlotMenu] = useState(null);

  const isProfessional =
    role === "fisioterapeuta" || role === "nutriologo" || role === "dentista";
  const canSeeAll = role === "admin" || role === "recepcion";

  const [now, setNow] = useState(() => new Date());
  const todayIso = useMemo(() => dateKey(new Date()), []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30 * 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setDualMode(false);
      setViewMode("day");
    }
  }, [isMobile]);

  useEffect(() => {
    if (isProfessional && myUserId) {
      setSelectedProfessionalId?.(myUserId);
      setProA(myUserId);
    }
  }, [isProfessional, myUserId, setSelectedProfessionalId]);

  useEffect(() => {
    if (dualMode) setViewMode("day");
  }, [dualMode]);

  useEffect(() => {
    const clearHover = () => {
      setHoverAppt(null);
      setHoverRect(null);
    };
    const onKey = (e) => e.key === "Escape" && clearHover();
    const onScroll = () => clearHover();
    const onDown = () => clearHover();

    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("mousedown", onDown, true);
    window.addEventListener("touchstart", onDown, true);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("mousedown", onDown, true);
      window.removeEventListener("touchstart", onDown, true);
    };
  }, []);

  const HOURS = useMemo(
    () => [
      "08:00",
      "09:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00",
      "19:00",
      "20:00",
    ],
    []
  );

  const [includeSunday, setIncludeSunday] = useState(() => {
    return localStorage.getItem("agenda.includeSunday") === "1";
  });

  useEffect(() => {
    localStorage.setItem("agenda.includeSunday", includeSunday ? "1" : "0");
  }, [includeSunday]);

  const DAY_START_MIN = toMinutes(HOURS[0]);
  const DAY_END_MIN = toMinutes(HOURS[HOURS.length - 1]) + 60;

  const HOUR_ROW_HEIGHT = 64;
  const GRID_TOTAL_HEIGHT = HOURS.length * HOUR_ROW_HEIGHT;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowY = ((nowMinutes - DAY_START_MIN) / 60) * HOUR_ROW_HEIGHT;
  const showNowLine = nowMinutes >= DAY_START_MIN && nowMinutes <= DAY_END_MIN;
  const nowLabel = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
  );

  const proMap = useMemo(() => {
    const m = new Map();
    (professionals || []).forEach((p) => m.set(p.id, p));
    return m;
  }, [professionals]);

  const selectedProObj = selectedProfessionalId ? proMap.get(selectedProfessionalId) : null;

  const baseVisibleAppointments = useMemo(() => {
    const list = appointments || [];
    if (canSeeAll) {
      if (!selectedProfessionalId) return list;
      return list.filter((a) => a.professionalId === selectedProfessionalId);
    }
    if (isProfessional && myUserId) return list.filter((a) => a.professionalId === myUserId);
    return list;
  }, [appointments, canSeeAll, isProfessional, myUserId, selectedProfessionalId]);

  const visibleAppointments = useMemo(() => {
    const term = quickSearch.trim().toLowerCase();
    return (baseVisibleAppointments || []).filter((appt) => {
      if (!matchesStatusFilter(appt, statusFilter)) return false;
      if (!matchesPaymentFilter(appt, paymentFilter)) return false;
      if (!term || isBlockItem(appt)) return true;
      return (
        String(appt.time || "").includes(term) ||
        String(appt.patient || "").toLowerCase().includes(term) ||
        String(appt.service || "").toLowerCase().includes(term) ||
        String(appt.professional || "").toLowerCase().includes(term)
      );
    });
  }, [baseVisibleAppointments, quickSearch, statusFilter, paymentFilter]);

  const dragSourceAppointments = useMemo(() => {
    if (dualMode && canSeeAll) {
      return (appointments || []).filter((appt) => matchesStatusFilter(appt, statusFilter) && matchesPaymentFilter(appt, paymentFilter));
    }
    return visibleAppointments || [];
  }, [dualMode, canSeeAll, appointments, visibleAppointments, statusFilter, paymentFilter]);

  const activeAppt = useMemo(
    () => (dragSourceAppointments || []).find((a) => a.id === activeApptId) || null,
    [dragSourceAppointments, activeApptId]
  );

  let headerMainLabel = "";
  if (viewMode === "day") {
    headerMainLabel = formatLongDate(currentDate);
  } else if (viewMode === "week") {
    const monday = startOfWeekMonday(currentDate);
    const end = new Date(monday);
    end.setDate(monday.getDate() + (includeSunday ? 6 : 5));
    headerMainLabel = `${formatLongDate(monday)} – ${formatLongDate(end)}`;
  } else {
    headerMainLabel = currentDate
      .toLocaleDateString("es-MX", { month: "long", year: "numeric" })
      .replace(/^\w/, (c) => c.toUpperCase());
  }

  const headerModeLabel = viewMode === "day" ? "Día" : viewMode === "month" ? "Mes" : "Semana";

  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === "day") next.setDate(next.getDate() - 1);
    else if (viewMode === "week") next.setDate(next.getDate() - 7);
    else next.setMonth(next.getMonth() - 1);
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === "day") next.setDate(next.getDate() + 1);
    else if (viewMode === "week") next.setDate(next.getDate() + 7);
    else next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
  };

  const monday = startOfWeekMonday(currentDate);

  const weekDays = useMemo(
    () =>
      Array.from({ length: includeSunday ? 7 : 6 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
      }),
    [monday, includeSunday]
  );

  const groupedByDay = weekDays.map((day) => {
    const key = dateKey(day);

    const items = (visibleAppointments || [])
      .filter((appt) => appt.date === key)
      .sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")));

    const label = `${weekdayShortEs(day)} ${String(day.getDate()).padStart(2, "0")}/${String(
      day.getMonth() + 1
    ).padStart(2, "0")}`;

    return { label, key, items };
  });

  const blockedSlots = useMemo(() => {
    const set = new Set();
    const list = dragSourceAppointments || [];

    const byDayPro = new Map();
    for (const a of list) {
      const k = `${a.date}|${a.professionalId}`;
      if (!byDayPro.has(k)) byDayPro.set(k, []);
      byDayPro.get(k).push(a);
    }

    for (const [k, arr] of byDayPro.entries()) {
      const blocks = (arr || []).filter(isBlockItem);
      if (!blocks.length) continue;

      const [dateIso, proId] = k.split("|");

      for (const hour of HOURS) {
        const hourStart = toMinutes(hour);
        const hourEnd = hourStart + 60;

        const covered = blocks.some((b) => {
          const s = toMinutes(b.time);
          const e = toMinutes(b.endTime || addMinutesToTime(b.time, 60));
          return overlapsMinutes(hourStart, hourEnd, s, e);
        });

        if (covered) set.add(`${dateIso}|${Number(proId)}|${hour}`);
      }
    }

    return set;
  }, [dragSourceAppointments, HOURS]);

  const findBlockForSlot = useCallback(
    ({ dateIso, professionalId, hour }) => {
      const list = dragSourceAppointments || [];
      const hourStart = toMinutes(hour);
      const hourEnd = hourStart + 60;

      return (
        list.find((a) => {
          if (!isBlockItem(a)) return false;
          if (a.date !== dateIso) return false;
          if (Number(a.professionalId) !== Number(professionalId)) return false;

          const s = toMinutes(a.time);
          const e = toMinutes(a.endTime || addMinutesToTime(a.time, 60));
          return overlapsMinutes(hourStart, hourEnd, s, e);
        }) || null
      );
    },
    [dragSourceAppointments]
  );

  const handleDragStart = (event) => {
    if (isMobile) return;
    setActiveApptId(event?.active?.id ?? null);
  };

  const handleDragEnd = (event) => {
    if (isMobile) return;

    const activeId = event?.active?.id;
    const overId = event?.over?.id;
    setActiveApptId(null);
    if (!activeId || !overId) return;

    const appt = (dragSourceAppointments || []).find((a) => a.id === activeId);
    if (!appt) return;

    if (isBlockItem(appt)) return;

    const parts = String(overId).split(":");
    if (parts[0] !== "slot") return;

    const newDate = parts[1];
    const newProfessionalId = Number(parts[2]);
    const hour = `${parts[3]}:00`;
    const newTime = `${parts[3]}:${parts[4]}`;

    const mapKey = `${newDate}|${newProfessionalId}|${hour}`;
    if (blockedSlots.has(mapKey)) {
      window?.navigator?.vibrate?.(15);
      alert("No puedes mover una cita a un horario bloqueado.");
      return;
    }

    const oldStart = toMinutes(appt.time);
    const oldEnd = toMinutes(appt.endTime || addMinutesToTime(appt.time, 60));
    const durMin = Math.max(60, oldEnd - oldStart);
    const newEndTime = addMinutesToTime(newTime, durMin);

    const patch = {
      id: appt.id,
      date: newDate,
      time: newTime,
      endTime: newEndTime,
      ...(Number.isNaN(newProfessionalId) ? {} : { professionalId: newProfessionalId }),
    };

    onMoveAppointment?.(appt, patch);
  };

  function DroppableHourSlot({ id, disabled = false, children, onClick }) {
    const { setNodeRef, isOver } = useDroppable({ id, disabled });

    return (
      <div
        ref={setNodeRef}
        onClick={onClick}
        className={[
          "relative w-full h-full transition",
          !disabled && isOver ? "ring-2 ring-violet-300" : "",
          disabled ? "cursor-not-allowed" : "",
        ].join(" ")}
      >
        {children}
      </div>
    );
  }

  function PaidMark() {
    return (
      <span className="absolute left-0 top-0 bottom-0 w-3 bg-emerald-500 rounded-l-md flex items-center justify-center">
        <DollarSign className="h-3 w-3 text-white" />
      </span>
    );
  }

  function AppointmentBlock({ appt, layout, onClick }) {
    const isBlock = isBlockItem(appt);

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: appt.id,
      disabled: isBlock || isMobile,
    });

    const style = {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      opacity: isDragging ? 0.35 : 1,
      cursor: isBlock ? "pointer" : "grab",
      top: layout.top,
      height: layout.height,
      left: layout.left,
      width: layout.width,
    };

    const touchClass = !isBlock && !isMobile ? "touch-none" : "";

    return (
      <button
        ref={setNodeRef}
        type="button"
        data-appt="1"
        style={style}
        onClick={(e) => {
          e.stopPropagation();
          setHoverAppt(null);
          setHoverRect(null);

          if (isBlock) {
            const { x, y } = getClientPoint(e);
            const rect = rectFromPoint(x, y);
            setSlotMenu({
              date: appt.date,
              hour: String(appt.time || "08:00").slice(0, 5),
              professionalId: appt.professionalId,
              hasBlock: true,
              blockItem: appt,
              preferUp: false,
              anchorRect: rect,
            });
            return;
          }

          onClick?.();
        }}
        onMouseEnter={(e) => {
          if (isMobile) return;
          const { x, y } = getClientPoint(e);
          const rect = rectFromPoint(x, y);
          setHoverRect(rect);
          setHoverAppt(appt);
        }}
        onMouseLeave={() => {
          if (isMobile) return;
          setHoverAppt(null);
          setHoverRect(null);
        }}
        className={[
          "absolute overflow-hidden rounded-xl border text-left shadow-[0_8px_18px_rgba(15,23,42,0.08)] transition hover:-translate-y-[1px] hover:shadow-[0_12px_26px_rgba(15,23,42,0.14)]",
          "px-2.5 py-2.5 backdrop-blur-sm",
          appt.color || "bg-slate-50 border-slate-200 text-slate-800",
          "text-[11px]",
          touchClass,
        ].join(" ")}
        {...(!isBlock ? listeners : {})}
        {...(!isBlock ? attributes : {})}
      >
        {(appt.paid || appt.pagado) && !isBlock && <PaidMark />}

        <div className="pl-2 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-[11px] font-bold tracking-tight">
                {isBlock ? "Horario bloqueado" : appt.patient || "Paciente"}
              </div>
              <div className="mt-0.5 truncate text-[10px] opacity-90">
                {isBlock ? appt.motivo || "No disponible" : appt.service || "Servicio"}
              </div>
            </div>
            {!isBlock && <span className={`mt-1 inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-bold ${appointmentStatusPill(appt.status)}`}>{normalizeAppointmentStatus(appt.status).replace("_", " ")}</span>}
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
            <div className="font-semibold opacity-80">
              {String(appt.time || "").slice(0, 5)}
              {appt.endTime ? ` – ${String(appt.endTime).slice(0, 5)}` : ""}
            </div>
            {!isBlock && (
              <span className={`rounded-full px-2 py-0.5 font-semibold ${(appt.paid || appt.pagado) ? "bg-emerald-100 text-emerald-700" : "bg-white/70 text-slate-600"}`}>
                {(appt.paid || appt.pagado) ? "Pagada" : "Pendiente"}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  }

  const openSlotMenu = useCallback(
    (e, { date, hour, professionalId, hasBlock }) => {
      const clickedAppt = e.target.closest?.("[data-appt='1']");
      if (clickedAppt) return;

      const { x, y } = getClientPoint(e);
      const rect = rectFromPoint(x, y);

      setHoverAppt(null);
      setHoverRect(null);

      const blockItem = hasBlock ? findBlockForSlot({ dateIso: date, professionalId, hour }) : null;

      setSlotMenu({
        date,
        hour,
        professionalId,
        hasBlock: Boolean(hasBlock),
        blockItem,
        preferUp: false,
        anchorRect: rect,
      });
    },
    [findBlockForSlot]
  );

  const dualSlots = useMemo(() => {
    return [
      { id: proA, label: proA ? proMap.get(proA)?.label || "Profesional A" : "Profesional A" },
      { id: proB, label: proB ? proMap.get(proB)?.label || "Profesional B" : "Profesional B" },
    ];
  }, [proA, proB, proMap]);

  function computeLayoutsForDay(items) {
    const appts = (items || [])
      .filter((a) => !isBlockItem(a))
      .map((a) => {
        const s = clamp(toMinutes(a.time), DAY_START_MIN, DAY_END_MIN);
        const eRaw = toMinutes(a.endTime || addMinutesToTime(a.time, 60));
        const e = clamp(Math.max(eRaw, s + 60), DAY_START_MIN, DAY_END_MIN);
        return { ...a, __s: s, __e: e };
      })
      .sort((a, b) => a.__s - b.__s || (b.__e - b.__s) - (a.__e - a.__s));

    if (!appts.length) return new Map();

    const active = [];
    const usedCols = new Set();
    const colById = new Map();

    function releaseEnded(start) {
      for (let i = active.length - 1; i >= 0; i--) {
        if (active[i].end <= start) {
          usedCols.delete(active[i].col);
          active.splice(i, 1);
        }
      }
    }

    function lowestFreeCol() {
      let c = 0;
      while (usedCols.has(c)) c++;
      return c;
    }

    for (const a of appts) {
      releaseEnded(a.__s);
      const col = lowestFreeCol();
      usedCols.add(col);
      active.push({ end: a.__e, col, id: a.id });
      colById.set(a.id, col);
    }

    const adj = new Map(appts.map((a) => [a.id, new Set()]));
    for (let i = 0; i < appts.length; i++) {
      for (let j = i + 1; j < appts.length; j++) {
        const A = appts[i];
        const B = appts[j];
        if (overlapsMinutes(A.__s, A.__e, B.__s, B.__e)) {
          adj.get(A.id).add(B.id);
          adj.get(B.id).add(A.id);
        }
      }
    }

    const visited = new Set();
    const groupMaxCols = new Map();

    for (const a of appts) {
      if (visited.has(a.id)) continue;

      const stack = [a.id];
      const comp = [];
      visited.add(a.id);

      while (stack.length) {
        const cur = stack.pop();
        comp.push(cur);
        for (const nb of adj.get(cur) || []) {
          if (!visited.has(nb)) {
            visited.add(nb);
            stack.push(nb);
          }
        }
      }

      let maxCol = 0;
      for (const id of comp) {
        const c = colById.get(id) ?? 0;
        maxCol = Math.max(maxCol, c);
      }
      const maxCols = maxCol + 1;
      for (const id of comp) groupMaxCols.set(id, maxCols);
    }

    const layouts = new Map();
    for (const a of appts) {
      const col = colById.get(a.id) ?? 0;
      const maxCols = groupMaxCols.get(a.id) ?? 1;

      const topPx = ((a.__s - DAY_START_MIN) / 60) * HOUR_ROW_HEIGHT;
      const heightPx = ((a.__e - a.__s) / 60) * HOUR_ROW_HEIGHT;

      const widthPct = 100 / maxCols;
      const leftPct = col * widthPct;

      const padding = 2;
      layouts.set(a.id, {
        top: topPx,
        height: Math.max(28, heightPx),
        left: `calc(${leftPct}% + ${padding}px)`,
        width: `calc(${widthPct}% - ${padding * 2}px)`,
      });
    }

    return layouts;
  }

  function computeBlockLayoutsForDay(items) {
    const blocks = (items || [])
      .filter(isBlockItem)
      .map((b) => {
        const s = clamp(toMinutes(b.time), DAY_START_MIN, DAY_END_MIN);
        const eRaw = toMinutes(b.endTime || addMinutesToTime(b.time, 60));
        const e = clamp(Math.max(eRaw, s + 60), DAY_START_MIN, DAY_END_MIN);
        return { ...b, __s: s, __e: e };
      })
      .sort((a, b) => a.__s - b.__s);

    const layouts = new Map();
    for (const b of blocks) {
      const topPx = ((b.__s - DAY_START_MIN) / 60) * HOUR_ROW_HEIGHT;
      const heightPx = ((b.__e - b.__s) / 60) * HOUR_ROW_HEIGHT;
      layouts.set(b.id, {
        top: topPx,
        height: Math.max(28, heightPx),
        left: `0px`,
        width: `100%`,
      });
    }
    return layouts;
  }

  function DayColumn({ dateIso, professionalId }) {
    const dayItems = useMemo(() => {
      return (dragSourceAppointments || []).filter(
        (a) => a.date === dateIso && Number(a.professionalId) === Number(professionalId)
      );
    }, [dragSourceAppointments, dateIso, professionalId]);

    const blockLayouts = useMemo(() => computeBlockLayoutsForDay(dayItems), [dayItems]);
    const apptLayouts = useMemo(() => computeLayoutsForDay(dayItems), [dayItems]);

    const blockedByHour = useMemo(() => {
      const m = new Map();
      const blocks = (dayItems || []).filter(isBlockItem);

      for (const hour of HOURS) {
        const hourStart = toMinutes(hour);
        const hourEnd = hourStart + 60;

        const blk = blocks.find((b) => {
          const s = toMinutes(b.time);
          const e = toMinutes(b.endTime || addMinutesToTime(b.time, 60));
          return overlapsMinutes(hourStart, hourEnd, s, e);
        });

        m.set(hour, blk || null);
      }
      return m;
    }, [dayItems, HOURS]);

    return (
      <div className="relative">
        <div className="absolute inset-0 pointer-events-none">
          {showNowLine && dateIso === todayIso && (
            <div
              className="absolute left-0 right-0 z-[6] pointer-events-none"
              style={{ top: clamp(nowY, 0, GRID_TOTAL_HEIGHT) }}
            >
              <div className="h-[2px] bg-rose-500/90 w-full" />
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-rose-500" />
            </div>
          )}
          {HOURS.map((_, idx) => (
            <div
              key={idx}
              style={{ height: HOUR_ROW_HEIGHT }}
              className="border-b border-slate-400 border-dashed"
            />
          ))}
        </div>

        <div className="relative" style={{ height: GRID_TOTAL_HEIGHT }}>
          {HOURS.map((hour, idx) => {
            const y = idx * HOUR_ROW_HEIGHT;

            const slotId = `slot:${dateIso}:${professionalId}:${hour.slice(0, 2)}:00`;
            const blockItem = blockedByHour.get(hour);
            const hasBlock = Boolean(blockItem);

            return (
              <div
                key={slotId}
                className="absolute left-0 right-0 px-1"
                style={{ top: y, height: HOUR_ROW_HEIGHT }}
              >
                <DroppableHourSlot
                  id={slotId}
                  disabled={hasBlock}
                  onClick={(e) =>
                    openSlotMenu(e, { date: dateIso, hour, professionalId, hasBlock })
                  }
                >
                  <div
                    className={[
                      "group w-[98%] h-[98%] rounded-lg",
                      "bg-white/70",
                      "p-1",
                      hasBlock ? "opacity-95" : "",
                    ].join(" ")}
                  >
                    {!hasBlock && (
                      <button
                        type="button"
                        onPointerUp={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const { x, y } = getClientPoint(e);
                          const rect = rectFromPoint(x, y);
                          setSlotMenu({
                            date: dateIso,
                            hour,
                            professionalId,
                            hasBlock: false,
                            preferUp: false,
                            anchorRect: rect,
                          });
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const { x, y } = getClientPoint(e);
                          const rect = rectFromPoint(x, y);
                          setSlotMenu({
                            date: dateIso,
                            hour,
                            professionalId,
                            hasBlock: false,
                            preferUp: false,
                            anchorRect: rect,
                          });
                        }}
                        className={[
                          "absolute right-2 top-2 z-[5]",
                          "h-8 w-8 rounded-md border border-slate-200 bg-white",
                          "shadow-sm flex items-center justify-center",
                          "opacity-0 group-hover:opacity-100 transition",
                          "hover:bg-slate-50",
                        ].join(" ")}
                        aria-label="Opciones de hora"
                        title="Opciones"
                      >
                        <Plus className="h-4 w-4 text-slate-600" />
                      </button>
                    )}
                  </div>
                </DroppableHourSlot>
              </div>
            );
          })}

          {(dayItems || [])
            .filter(isBlockItem)
            .map((b) => {
              const layout = blockLayouts.get(b.id);
              if (!layout) return null;
              return (
                <AppointmentBlock
                  key={b.id}
                  appt={b}
                  layout={layout}
                  onClick={() => onOpenAppointment?.(b)}
                />
              );
            })}

          {(dayItems || [])
            .filter((a) => !isBlockItem(a))
            .map((a) => {
              const layout = apptLayouts.get(a.id);
              if (!layout) return null;
              return (
                <AppointmentBlock
                  key={a.id}
                  appt={a}
                  layout={layout}
                  onClick={() => onOpenAppointment?.(a)}
                />
              );
            })}
        </div>
      </div>
    );
  }

  const headerGridStyleWeek = useMemo(
    () => ({ gridTemplateColumns: `64px repeat(${includeSunday ? 7 : 6}, minmax(0, 1fr))` }),
    [includeSunday]
  );
  const headerGridStyleDay = useMemo(() => ({ gridTemplateColumns: "56px minmax(0, 1fr)" }), []);

  const keyDate = dateKey(currentDate);
  const weekHasToday = useMemo(() => weekDays.some((d) => dateKey(d) === todayIso), [weekDays, todayIso]);


  const dateAppointments = useMemo(
    () => (visibleAppointments || []).filter((a) => a.date === keyDate),
    [visibleAppointments, keyDate]
  );

  const dateClinicalAppointments = useMemo(
    () => dateAppointments.filter((a) => !isBlockItem(a)),
    [dateAppointments]
  );

  const dateBlocks = useMemo(
    () => dateAppointments.filter(isBlockItem),
    [dateAppointments]
  );

  const dayProfessionals = useMemo(() => {
    const list = professionals || [];
    if (isProfessional && myUserId) {
      return list.filter((p) => Number(p.id) === Number(myUserId));
    }
    if (selectedProfessionalId) {
      return list.filter((p) => Number(p.id) === Number(selectedProfessionalId));
    }
    return list;
  }, [professionals, isProfessional, myUserId, selectedProfessionalId]);

  const effectiveProfessionalId =
    selectedProfessionalId || dayProfessionals[0]?.id || professionals?.[0]?.id || null;

  const dailyStats = useMemo(() => {
    const citas = dateClinicalAppointments;
    const statusOf = (a) => normalizeAppointmentStatus(a.status);
    const attended = citas.filter((a) => statusOf(a) === "si_asistio").length;
    const cancelled = citas.filter((a) => statusOf(a) === "no_asistio").length;
    const pending = citas.filter((a) => !["si_asistio", "no_asistio"].includes(statusOf(a))).length;
    const expected = citas
      .filter((a) => statusOf(a) !== "cancelado")
      .reduce((sum, a) => {
        const price = Number(a.price || 0);
        const discount = Number(a.discountPct || 0);
        return sum + price - (price * discount) / 100;
      }, 0);
    const collected = citas
      .filter((a) => (a.paid || a.pagado) && statusOf(a) !== "cancelado")
      .reduce((sum, a) => {
        const price = Number(a.price || 0);
        const discount = Number(a.discountPct || 0);
        return sum + price - (price * discount) / 100;
      }, 0);
    const pendingPayment = citas.filter(
      (a) => !(a.paid || a.pagado) && statusOf(a) !== "cancelado"
    ).length;

    return {
      scheduled: citas.length,
      attended,
      cancelled,
      pending,
      expected,
      collected,
      pendingPayment,
    };
  }, [dateClinicalAppointments]);

  const occupancy = useMemo(() => {
    const active = dateClinicalAppointments.filter(
      (a) => normalizeAppointmentStatus(a.status) !== "no_asistio"
    );
    const occupiedMinutes = active.reduce((sum, a) => {
      const start = toMinutes(a.time);
      const end = toMinutes(a.endTime || addMinutesToTime(a.time, 60));
      return sum + Math.max(0, end - start);
    }, 0);
    const professionalCount = Math.max(1, dayProfessionals.length || 1);
    const availableMinutes = Math.max(1, (DAY_END_MIN - DAY_START_MIN) * professionalCount);
    const percentage = Math.min(100, Math.round((occupiedMinutes / availableMinutes) * 100));
    return { occupiedMinutes, percentage };
  }, [dateClinicalAppointments, dayProfessionals, DAY_END_MIN, DAY_START_MIN]);

  const professionalLoad = useMemo(() => {
    const source = (visibleAppointments || []).filter(
      (a) => a.date === keyDate && !isBlockItem(a) && normalizeAppointmentStatus(a.status) !== "no_asistio"
    );
    const available = Math.max(1, DAY_END_MIN - DAY_START_MIN);

    return (professionals || [])
      .map((p) => {
        const items = source.filter((a) => Number(a.professionalId) === Number(p.id));
        const minutes = items.reduce((sum, a) => {
          const start = toMinutes(a.time);
          const end = toMinutes(a.endTime || addMinutesToTime(a.time, 60));
          return sum + Math.max(0, end - start);
        }, 0);
        return {
          ...p,
          count: items.length,
          minutes,
          percentage: Math.min(100, Math.round((minutes / available) * 100)),
        };
      })
      .sort((a, b) => b.minutes - a.minutes);
  }, [appointments, professionals, keyDate, DAY_END_MIN, DAY_START_MIN]);

  const monthCells = useMemo(() => {
    const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const start = startOfWeekMonday(first);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [currentDate]);

  const monthCountMap = useMemo(() => {
    const map = new Map();
    for (const appt of visibleAppointments || []) {
      if (isBlockItem(appt)) continue;
      map.set(appt.date, (map.get(appt.date) || 0) + 1);
    }
    return map;
  }, [visibleAppointments]);

  const dailyGoal = Math.max(1, Number(import.meta.env.VITE_DAILY_APPOINTMENT_GOAL || 60));
  const goalPercentage = Math.min(100, Math.round((dailyStats.scheduled / dailyGoal) * 100));
  const dayGridColumns = Math.max(1, dayProfessionals.length);
  const dayGridStyle = {
    gridTemplateColumns: `56px repeat(${dayGridColumns}, minmax(${isMobile ? 0 : 180}px, 1fr))`,
  };
  const weekProfessional = proMap.get(effectiveProfessionalId);

  return (
    <>
      <div className="h-full min-h-0 overflow-auto bg-[#f4f7fb] p-3 sm:p-4 lg:p-5">
        <div className="mx-auto flex min-h-full max-w-[1900px] flex-col gap-4">
          <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <MetricCard
              title="Citas agendadas"
              value={dailyStats.scheduled}
              helper={`${Math.max(0, dailyGoal - dailyStats.scheduled)} disponibles en la meta`}
              icon={CalendarCheck2}
              tone="blue"
            />
            <MetricCard
              title="Atendidas"
              value={dailyStats.attended}
              helper={`${dailyStats.scheduled ? Math.round((dailyStats.attended / dailyStats.scheduled) * 100) : 0}% del día`}
              icon={UserCheck2}
              tone="emerald"
            />
            <MetricCard
              title="Pendientes"
              value={dailyStats.pending}
              helper="Requieren seguimiento"
              icon={Clock3}
              tone="amber"
            />
            <MetricCard
              title="Canceladas"
              value={dailyStats.cancelled}
              helper={`${dailyStats.scheduled ? Math.round((dailyStats.cancelled / dailyStats.scheduled) * 100) : 0}% del día`}
              icon={CircleX}
              tone="rose"
            />
            <MetricCard
              title="Ingreso esperado"
              value={formatCurrency(dailyStats.expected)}
              helper="Sin citas canceladas"
              icon={WalletCards}
              tone="cyan"
            />
            <MetricCard
              title="Ingreso cobrado"
              value={formatCurrency(dailyStats.collected)}
              helper={`${dailyStats.pendingPayment} cobros pendientes`}
              icon={Banknote}
              tone="violet"
            />
          </section>

          <section className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
            <div className="min-w-0 space-y-4">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Meta diaria de consultas</p>
                      <p className="mt-1 text-lg font-bold text-slate-950">
                        {dailyStats.scheduled} de {dailyGoal} consultas
                      </p>
                    </div>
                    <span className="text-lg font-bold text-slate-900">{goalPercentage}%</span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all"
                      style={{ width: `${goalPercentage}%` }}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                    <span>Faltan {Math.max(0, dailyGoal - dailyStats.scheduled)} consultas para la meta.</span>
                    <span className="font-semibold text-blue-700">Agenda del {keyDate}</span>
                  </div>
                </article>

                <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Ocupación del día</p>
                      <p className="mt-2 text-3xl font-bold text-slate-950">{occupancy.percentage}%</p>
                      <p className="mt-1 text-[11px] text-slate-500">{durationLabel(occupancy.occupiedMinutes)} ocupadas</p>
                    </div>
                    <div
                      className="relative flex h-20 w-20 items-center justify-center rounded-full"
                      style={{
                        background: `conic-gradient(#2563eb ${occupancy.percentage * 3.6}deg, #e2e8f0 0deg)`,
                      }}
                    >
                      <div className="h-14 w-14 rounded-full bg-white" />
                    </div>
                  </div>
                </article>
              </div>

              <article className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
                <div className="border-b border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
                    <div className="flex min-w-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={handlePrev}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                        aria-label="Periodo anterior"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentDate(new Date())}
                        className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Hoy
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                        aria-label="Periodo siguiente"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <div className="ml-1 min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">{headerModeLabel}</p>
                        <h2 className="truncate text-sm font-bold text-slate-950 sm:text-base">{headerMainLabel}</h2>
                        {viewMode === "week" && (
                          <p className="truncate text-[11px] text-slate-500">Agenda: {weekProfessional?.label || "Selecciona un profesional"}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative min-w-[190px] flex-1 2xl:flex-none">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          value={quickSearch}
                          onChange={(e) => setQuickSearch(e.target.value)}
                          placeholder="Buscar paciente o servicio"
                          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                        />
                      </div>

                      <select
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      >
                        <option>Fisionerv Centro</option>
                      </select>

                      <select
                        disabled={isProfessional}
                        value={selectedProfessionalId || ""}
                        onChange={(e) => {
                          const id = e.target.value ? Number(e.target.value) : null;
                          setSelectedProfessionalId?.(id);
                          setProA(id);
                        }}
                        className="h-10 min-w-[190px] rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        {canSeeAll && <option value="">Todos los profesionales</option>}
                        {(professionals || []).map((p) => (
                          <option key={p.id} value={p.id}>{p.label}</option>
                        ))}
                      </select>

                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-10 min-w-[170px] rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="all">Todos los estados</option>
                        <option value="reservado">Reservado</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="si_asistio">Sí asistió</option>
                        <option value="no_asistio">No asistió</option>
                      </select>

                      <select
                        value={paymentFilter}
                        onChange={(e) => setPaymentFilter(e.target.value)}
                        className="h-10 min-w-[150px] rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="all">Todos los cobros</option>
                        <option value="paid">Pagadas</option>
                        <option value="unpaid">No pagadas</option>
                      </select>

                      {!isMobile && (
                        <button
                          type="button"
                          onClick={() => onOpenBlockModal?.({
                            date: keyDate,
                            startTime: "08:00",
                            endTime: "09:00",
                            professionalId: effectiveProfessionalId,
                          })}
                          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Ban className="h-4 w-4" />
                          Bloquear
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onNewReservation?.({
                          date: keyDate,
                          professionalId: effectiveProfessionalId,
                        })}
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                        Nueva cita
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <SlidersHorizontal className="h-4 w-4" />
                      <span>{dayProfessionals.length || 1} profesional(es) visibles · {dateClinicalAppointments.length} cita(s) filtradas</span>
                    </div>
                    <div className="inline-flex rounded-xl bg-slate-100 p-1">
                      {[
                        ["day", "Día"],
                        ["week", "Semana"],
                        ["month", "Mes"],
                      ].map(([mode, label]) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            if (mode === "week" && !selectedProfessionalId && professionals?.[0]?.id) {
                              setSelectedProfessionalId?.(professionals[0].id);
                            }
                            setViewMode(mode);
                          }}
                          className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${viewMode === mode
                            ? "bg-white text-blue-700 shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="min-h-[520px] overflow-auto bg-white">
                  <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    {viewMode === "day" && (
                      <div
                        className="min-w-max"
                        style={{ minWidth: isMobile ? "100%" : `${56 + Math.max(1, dayProfessionals.length) * 180}px` }}
                      >
                        <div
                          className="grid border-b border-slate-200 bg-slate-50/80 text-xs text-slate-500"
                          style={isMobile ? headerGridStyleDay : dayGridStyle}
                        >
                          <div className="p-3 text-right font-semibold">Hora</div>
                          {(isMobile ? [proMap.get(effectiveProfessionalId)].filter(Boolean) : dayProfessionals).map((p) => (
                            <div key={p.id} className="border-l border-slate-200 p-3 text-center">
                              <p className="truncate font-bold text-slate-800">{p.label}</p>
                              <p className="mt-0.5 truncate text-[10px] text-slate-400">{p.rol || p.especialidad || "Profesional"}</p>
                            </div>
                          ))}
                        </div>

                        <div className="grid text-xs" style={isMobile ? headerGridStyleDay : dayGridStyle}>
                          <div
                            className="relative border-r border-slate-200 bg-slate-50/70 pr-3 text-right"
                            style={{ height: GRID_TOTAL_HEIGHT }}
                          >
                            {HOURS.map((hour) => (
                              <div key={hour} style={{ height: HOUR_ROW_HEIGHT }} className="flex items-start justify-end pt-2 text-[11px] text-slate-400">
                                {hour}
                              </div>
                            ))}
                            {showNowLine && keyDate === todayIso && (
                              <div className="pointer-events-none absolute right-2 z-[10]" style={{ top: clamp(nowY, 0, GRID_TOTAL_HEIGHT) - 8 }}>
                                <div className="rounded-full bg-rose-500 px-2 py-1 text-[10px] text-white shadow">{nowLabel}</div>
                              </div>
                            )}
                          </div>

                          {(isMobile ? [proMap.get(effectiveProfessionalId)].filter(Boolean) : dayProfessionals).map((p) => (
                            <div key={p.id} className="relative border-r border-slate-100">
                              <DayColumn dateIso={keyDate} professionalId={p.id} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {viewMode === "week" && (
                      <div className="min-w-[1040px]">
                        <div className="grid border-b border-slate-200 bg-slate-50/80 text-xs text-slate-500" style={headerGridStyleWeek}>
                          <div className="p-3 text-right font-semibold">Hora</div>
                          {groupedByDay.map((day) => (
                            <div key={day.key} className="border-l border-slate-200 p-3 text-center font-bold text-slate-700">{day.label}</div>
                          ))}
                        </div>
                        <div className="grid text-xs" style={headerGridStyleWeek}>
                          <div className="relative border-r border-slate-200 bg-slate-50/70 pr-3 text-right" style={{ height: GRID_TOTAL_HEIGHT }}>
                            {HOURS.map((hour) => (
                              <div key={hour} style={{ height: HOUR_ROW_HEIGHT }} className="flex items-start justify-end pt-2 text-[11px] text-slate-400">{hour}</div>
                            ))}
                            {showNowLine && weekHasToday && (
                              <div className="pointer-events-none absolute right-2 z-[10]" style={{ top: clamp(nowY, 0, GRID_TOTAL_HEIGHT) - 8 }}>
                                <div className="rounded-full bg-rose-500 px-2 py-1 text-[10px] text-white shadow">{nowLabel}</div>
                              </div>
                            )}
                          </div>
                          {groupedByDay.map((day) => (
                            <div key={day.key} className="relative border-r border-slate-100">
                              <DayColumn dateIso={day.key} professionalId={effectiveProfessionalId} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {viewMode === "month" && (
                      <div className="p-4">
                        <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => <div key={day} className="py-2">{day}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                          {monthCells.map((date) => {
                            const iso = dateKey(date);
                            const inCurrentMonth = date.getMonth() === currentDate.getMonth();
                            const count = monthCountMap.get(iso) || 0;
                            const isToday = iso === todayIso;
                            return (
                              <button
                                key={iso}
                                type="button"
                                onClick={() => {
                                  setCurrentDate(date);
                                  setViewMode("day");
                                }}
                                className={`min-h-24 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${inCurrentMonth ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 text-slate-300"
                                  } ${isToday ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-bold">{date.getDate()}</span>
                                  {count > 0 && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">{count}</span>}
                                </div>
                                <p className="mt-4 text-[11px] text-slate-500">{count ? `${count} cita${count === 1 ? "" : "s"}` : "Sin citas"}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <DragOverlay>
                      {activeAppt ? (
                        <div className={`rounded-xl border px-3 py-2 text-[11px] shadow-xl ${activeAppt.color || "bg-white"}`}>
                          <div className="font-semibold truncate">{isBlockItem(activeAppt) ? "Horario bloqueado" : activeAppt.patient}</div>
                          <div className="text-[10px] opacity-80">{isBlockItem(activeAppt) ? activeAppt.motivo || "No disponible" : activeAppt.service}</div>
                        </div>
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                </div>
              </article>
            </div>

            <aside className="space-y-4">
              <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <div className="mb-3 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Calendario</h3>
                </div>
                <MiniCalendar currentDate={currentDate} onChangeDate={setCurrentDate} />
              </article>

              <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <h3 className="text-sm font-bold text-slate-900">Resumen del día</h3>
                <div className="mt-2 divide-y divide-slate-100">
                  <SmallSummaryRow icon={UsersRound} label="Pacientes programados" value={dailyStats.scheduled} />
                  <SmallSummaryRow icon={CheckCircle2} label="Atendidas" value={dailyStats.attended} tone="text-emerald-600" />
                  <SmallSummaryRow icon={CircleX} label="Canceladas" value={dailyStats.cancelled} tone="text-rose-600" />
                  <SmallSummaryRow icon={Ban} label="Horarios bloqueados" value={dateBlocks.length} />
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Profesionales</h3>
                  <span className="text-[10px] font-semibold text-slate-400">Carga diaria</span>
                </div>
                <div className="mt-4 space-y-4">
                  {professionalLoad.slice(0, 5).map((p) => (
                    <div key={p.id}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-700">{p.label}</p>
                          <p className="text-[10px] text-slate-400">{p.count} cita(s) · {durationLabel(p.minutes)}</p>
                        </div>
                        <span className="text-[11px] font-bold text-blue-700">{p.percentage}%</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-blue-600" style={{ width: `${p.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                  {!professionalLoad.length && <p className="text-xs text-slate-400">No hay profesionales disponibles.</p>}
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-900">Alertas operativas</h3>
                </div>
                <div className="mt-4 space-y-3 text-xs text-slate-600">
                  <div className="flex items-start gap-2"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /><span>{dailyStats.pending} citas pendientes de atención.</span></div>
                  <div className="flex items-start gap-2"><WalletCards className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" /><span>{dailyStats.pendingPayment} citas con cobro pendiente.</span></div>
                  <div className="flex items-start gap-2"><Timer className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" /><span>{dateBlocks.length} bloqueos configurados para este día.</span></div>
                </div>
              </article>
            </aside>
          </section>
        </div>
      </div>

      {!isMobile && (
        <HoverCard open={Boolean(hoverAppt)} anchorRect={hoverRect}>
          {hoverAppt && (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-800">{isBlockItem(hoverAppt) ? "Horario bloqueado" : hoverAppt.patient}</div>
              {!isBlockItem(hoverAppt) && (
                <>
                  <div className="text-[11px] text-slate-600"><span className="font-semibold">Servicio:</span> {hoverAppt.service}</div>
                  <div className="text-[11px] text-slate-600"><span className="font-semibold">Costo:</span> ${safeMoney(hoverAppt.price)}</div>
                  <div className="text-[11px] text-slate-600"><span className="font-semibold">Pagado:</span> {(hoverAppt.paid || hoverAppt.pagado) ? <span className="font-semibold text-emerald-700">Sí</span> : <span>No</span>}</div>
                </>
              )}
              <div className="text-[11px] text-slate-600"><span className="font-semibold">Horario:</span> {String(hoverAppt.time || "").slice(0, 5)}{hoverAppt.endTime ? ` – ${String(hoverAppt.endTime).slice(0, 5)}` : ""}</div>
              {isBlockItem(hoverAppt) && <div className="text-[11px] text-slate-600"><span className="font-semibold">Motivo:</span> {hoverAppt.motivo || "No disponible"}</div>}
            </div>
          )}
        </HoverCard>
      )}

      <MenuPopover
        open={Boolean(slotMenu)}
        anchorRect={slotMenu?.anchorRect}
        preferUp={Boolean(slotMenu?.preferUp)}
        onClose={() => setSlotMenu(null)}
      >
        <div className="px-2 py-1">
          <div className="text-[11px] font-semibold text-slate-700">{slotMenu?.hour} · {slotMenu?.date}</div>
          <div className="text-[10px] text-slate-500">{slotMenu?.hasBlock ? "Este horario está bloqueado" : "Elige una acción"}</div>
        </div>
        <div className="mt-2 grid gap-2">
          {!slotMenu?.hasBlock && (
            <button
              type="button"
              onClick={() => {
                const s = slotMenu;
                setSlotMenu(null);
                if (!s) return;
                onNewReservation?.({ date: s.date, time: s.hour, professionalId: s.professionalId });
              }}
              className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" /> Agendar cita nueva
            </button>
          )}
          {slotMenu?.hasBlock && (
            <button
              type="button"
              onClick={() => {
                const b = slotMenu?.blockItem;
                setSlotMenu(null);
                if (!b) return;
                const ok = confirm(`¿Eliminar bloqueo?\n\n${b.date} ${String(b.time).slice(0, 5)}–${String(b.endTime || "").slice(0, 5)}\nMotivo: ${b.motivo || "No disponible"}`);
                if (ok) onDeleteBlock?.(b);
              }}
              className="flex w-full items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-700 hover:bg-rose-50"
            >
              <CircleX className="h-4 w-4" /> Eliminar bloqueo
            </button>
          )}
          {!slotMenu?.hasBlock && (
            <button
              type="button"
              onClick={() => {
                const s = slotMenu;
                setSlotMenu(null);
                if (!s) return;
                onOpenBlockModal?.({ date: s.date, startTime: s.hour, professionalId: s.professionalId });
              }}
              className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Ban className="h-4 w-4" /> Bloquear horario
            </button>
          )}
        </div>
      </MenuPopover>
    </>
  );
}