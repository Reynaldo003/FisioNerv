// /components/layout/agenda/AgendaView.jsx
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { MiniCalendar } from "./MiniCalendar";
import { DollarSign, Plus, Ban } from "lucide-react";

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
  const jsDay = d.getDay(); // 0=Dom..6=Sab
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

/**
 * Detecta si un item es un bloqueo (robusto).
 */
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

/**
 * Tooltip bonito (popover) sin el title negro.
 * Nota: en móvil no hay hover; esto solo aplica desktop.
 */
function HoverCard({ open, anchorRect, children }) {
  if (!open || !anchorRect) return null;

  const top = anchorRect.top + window.scrollY - 8;
  const left = anchorRect.left + window.scrollX + anchorRect.width + 10;

  return (
    <div className="fixed z-[80]" style={{ top, left, maxWidth: 280 }}>
      <div className="rounded-xl border border-slate-200 bg-white shadow-xl p-3">
        {children}
      </div>
    </div>
  );
}

/**
 * Popover de menú que se auto-posiciona:
 * - Por default abre abajo
 * - Si no cabe abajo, se va arriba
 * - Evita salirse por la derecha
 */
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

  useEffect(() => setAutoUp(Boolean(preferUp)), [preferUp]);

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

      const rawLeft = anchorRect.left + window.scrollX;
      const maxLeft = window.scrollX + window.innerWidth - menuW - margin;
      const minLeft = window.scrollX + margin;
      setClampedLeft(Math.min(Math.max(rawLeft, minLeft), maxLeft));
    });

    return () => cancelAnimationFrame(raf);
  }, [open, anchorRect]);

  if (!open || !anchorRect) return null;

  const left = clampedLeft != null ? clampedLeft : anchorRect.left + window.scrollX;

  const downTop = anchorRect.top + window.scrollY + anchorRect.height + 6;
  const upTop = anchorRect.top + window.scrollY - 6;

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
}) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [quickSearch, setQuickSearch] = useState("");
  const [viewMode, setViewMode] = useState("week");
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

  // En móvil: forzamos vista Día y desactivamos dual (mejor UX y evita min-w gigante)
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

  // limpiar hover cuando haya interacciones globales
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

  const DAY_START_MIN = toMinutes(HOURS[0]);
  const DAY_END_MIN = toMinutes(HOURS[HOURS.length - 1]) + 60; // hasta 21:00

  // En móvil damos un poquito más de alto para facilitar touch
  const HOUR_ROW_HEIGHT = isMobile ? 64 : 56;
  const GRID_TOTAL_HEIGHT = HOURS.length * HOUR_ROW_HEIGHT;

  // ✅ DnD en móvil: TouchSensor + PointerSensor
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180, // tap normal no arrastra; mantener presionado para drag
        tolerance: 8,
      },
    })
  );

  const proMap = useMemo(() => {
    const m = new Map();
    (professionals || []).forEach((p) => m.set(p.id, p));
    return m;
  }, [professionals]);

  const selectedProObj = selectedProfessionalId ? proMap.get(selectedProfessionalId) : null;

  const visibleAppointments = useMemo(() => {
    const list = appointments || [];
    if (canSeeAll) {
      if (!selectedProfessionalId) return list;
      return list.filter((a) => a.professionalId === selectedProfessionalId);
    }
    if (isProfessional && myUserId) return list.filter((a) => a.professionalId === myUserId);
    return list;
  }, [appointments, canSeeAll, isProfessional, myUserId, selectedProfessionalId]);

  const dragSourceAppointments = useMemo(() => {
    if (dualMode && canSeeAll) return appointments || [];
    return visibleAppointments || [];
  }, [dualMode, canSeeAll, appointments, visibleAppointments]);

  const activeAppt = useMemo(
    () => (dragSourceAppointments || []).find((a) => a.id === activeApptId) || null,
    [dragSourceAppointments, activeApptId]
  );

  let headerMainLabel = "";
  if (viewMode === "day") {
    headerMainLabel = formatLongDate(currentDate);
  } else if (viewMode === "week") {
    const monday = startOfWeekMonday(currentDate);
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5); // Lun–Sáb
    headerMainLabel = `${formatLongDate(monday)} – ${formatLongDate(saturday)}`;
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

  // Lun–Sáb (sin Domingo)
  const weekDays = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
      }),
    [monday]
  );

  const searchTerm = quickSearch.trim().toLowerCase();

  const groupedByDay = weekDays.map((day) => {
    const key = dateKey(day);

    const items = (visibleAppointments || [])
      .filter((appt) => {
        const sameDate = appt.date === key;
        if (!sameDate) return false;
        if (!searchTerm) return true;

        return (
          String(appt.time || "").includes(searchTerm) ||
          String(appt.patient || "").toLowerCase().includes(searchTerm) ||
          String(appt.service || "").toLowerCase().includes(searchTerm)
        );
      })
      .sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")));

    const label = `${weekdayShortEs(day)} ${String(day.getDate()).padStart(2, "0")}/${String(
      day.getMonth() + 1
    ).padStart(2, "0")}`;

    return { label, key, items };
  });

  /**
   * Bloqueos por hora (por rango)
   */
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

        if (covered) {
          set.add(`${dateIso}|${Number(proId)}|${hour}`);
        }
      }
    }

    return set;
  }, [dragSourceAppointments, HOURS]);

  const handleDragStart = (event) => {
    setActiveApptId(event?.active?.id ?? null);
  };

  const handleDragEnd = (event) => {
    const activeId = event?.active?.id;
    const overId = event?.over?.id;
    setActiveApptId(null);
    if (!activeId || !overId) return;

    const appt = (dragSourceAppointments || []).find((a) => a.id === activeId);
    if (!appt) return;

    // ✅ nunca mover bloqueos
    if (isBlockItem(appt)) return;

    const parts = String(overId).split(":");
    if (parts[0] !== "slot") return;

    const newDate = parts[1];
    const newProfessionalId = Number(parts[2]);
    const hour = `${parts[3]}:00`;
    const newTime = `${parts[3]}:${parts[4]}`;

    // ✅ bloqueo: no permitir drop a slot bloqueado
    const mapKey = `${newDate}|${newProfessionalId}|${hour}`;
    if (blockedSlots.has(mapKey)) {
      window?.navigator?.vibrate?.(15);
      alert("No puedes mover una cita a un horario bloqueado.");
      return;
    }

    // ✅ mantener duración original
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
      disabled: isBlock,
    });

    const style = {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      opacity: isDragging ? 0.35 : 1,
      cursor: isBlock ? "default" : "grab",
      top: layout.top,
      height: layout.height,
      left: layout.left,
      width: layout.width,
    };

    // ✅ IMPORTANTÍSIMO para móvil: evita que el navegador “robe” el gesto de drag
    const touchClass = !isBlock ? "touch-none" : "";

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
          onClick?.();
        }}
        onMouseEnter={(e) => {
          if (isMobile) return;
          const rect = e.currentTarget.getBoundingClientRect();
          setHoverRect(rect);
          setHoverAppt(appt);
        }}
        onMouseLeave={() => {
          if (isMobile) return;
          setHoverAppt(null);
          setHoverRect(null);
        }}
        className={[
          "absolute text-left rounded-md border shadow-sm hover:shadow-md transition overflow-hidden",
          "px-2 py-2",
          appt.color || "bg-slate-50 border-slate-200 text-slate-800",
          "text-[11px]",
          touchClass,
        ].join(" ")}
        {...(!isBlock ? listeners : {})}
        {...(!isBlock ? attributes : {})}
      >
        {appt.paid && !isBlock && <PaidMark />}

        <div className="pl-2 min-w-0">
          <div className="font-semibold truncate">
            {isBlock ? "Horario bloqueado" : appt.patient || "Paciente"}
          </div>
          <div className="text-[10px] opacity-90 truncate">
            {isBlock ? appt.motivo || "No disponible" : appt.service || "Servicio"}
          </div>
          <div className="text-[10px] opacity-80 mt-1">
            {String(appt.time || "").slice(0, 5)}
            {appt.endTime ? ` – ${String(appt.endTime).slice(0, 5)}` : ""}
          </div>
        </div>
      </button>
    );
  }

  const openSlotMenu = useCallback((e, { date, hour, professionalId, hasBlock }) => {
    const clickedAppt = e.target.closest?.("[data-appt='1']");
    if (clickedAppt) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setHoverAppt(null);
    setHoverRect(null);

    setSlotMenu({
      date,
      hour,
      professionalId,
      hasBlock: Boolean(hasBlock),
      preferUp: false,
      anchorRect: rect,
    });
  }, []);

  const dualSlots = useMemo(() => {
    return [
      {
        id: proA,
        label: proA ? proMap.get(proA)?.label || "Profesional A" : "Profesional A",
      },
      {
        id: proB,
        label: proB ? proMap.get(proB)?.label || "Profesional B" : "Profesional B",
      },
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
        {/* Líneas de hora */}
        <div className="absolute inset-0 pointer-events-none">
          {HOURS.map((_, idx) => (
            <div
              key={idx}
              style={{ height: HOUR_ROW_HEIGHT }}
              className="border-b border-slate-100"
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
                    openSlotMenu(e, {
                      date: dateIso,
                      hour,
                      professionalId,
                      hasBlock,
                    })
                  }
                >
                  <div
                    className={[
                      "w-full h-full rounded-lg",
                      "bg-white/70",
                      "p-1",
                      hasBlock ? "opacity-95" : "",
                    ].join(" ")}
                  >
                    {/* Botón +: en móvil usamos pointerUp para asegurar disparo */}
                    {!hasBlock && (
                      <button
                        type="button"
                        onPointerUp={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
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
                          const rect = e.currentTarget.getBoundingClientRect();
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
                          "hover:bg-slate-50 shadow-sm",
                          "flex items-center justify-center",
                          "touch-manipulation",
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

          {/* Bloqueos */}
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

          {/* Citas */}
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

  // Grid header: en móvil mostramos solo Hora + Día actual
  const headerGridStyleWeek = useMemo(
    () => ({ gridTemplateColumns: "64px repeat(6, minmax(0, 1fr))" }),
    []
  );
  const headerGridStyleDay = useMemo(() => ({ gridTemplateColumns: "64px minmax(0, 1fr)" }), []);

  const keyDate = dateKey(currentDate);

  return (
    <>
      {/* IMPORTANT: min-h-0 para que los hijos con overflow funcionen y no “desaparezcan” headers */}
      <div className="flex flex-col lg:flex-row w-full h-full min-h-0 overflow-hidden mb-10">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 lg:max-w-[88vw] bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col p-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Sucursal</label>
            <select
              className="w-full text-sm rounded-md border border-slate-200 px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            >
              <option>Fisionerv Centro</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Profesional</label>
            <select
              disabled={isProfessional}
              className={
                "w-full text-sm rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent " +
                (isProfessional
                  ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                  : "bg-slate-50")
              }
              value={selectedProfessionalId || ""}
              onChange={(e) => {
                const val = Number(e.target.value);
                const id = Number.isNaN(val) ? null : val;
                setSelectedProfessionalId?.(id);
                setProA(id);
              }}
            >
              {(professionals || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>

            {isProfessional && (
              <p className="mt-1 text-[11px] text-slate-500">
                Estás en modo profesional: solo puedes ver tu agenda.
              </p>
            )}
          </div>

          {/* Dual mode solo en desktop/tablet grande */}
          {canSeeAll && !isMobile && (
            <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-600">Vista 2 profesionales</p>
                <button
                  type="button"
                  onClick={() => setDualMode((v) => !v)}
                  className={
                    "text-[11px] px-2 py-1 rounded-md border " +
                    (dualMode
                      ? "bg-violet-50 text-violet-700 border-violet-200"
                      : "bg-white text-slate-600 border-slate-200")
                  }
                >
                  {dualMode ? "Activo" : "Desactivado"}
                </button>
              </div>

              {dualMode && (
                <div className="mt-3 grid grid-cols-1 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Profesional A
                    </label>
                    <select
                      className="w-full text-sm rounded-md border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={proA || ""}
                      onChange={(e) => setProA(Number(e.target.value) || null)}
                    >
                      {(professionals || []).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Profesional B
                    </label>
                    <select
                      className="w-full text-sm rounded-md border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={proB || ""}
                      onChange={(e) => setProB(Number(e.target.value) || null)}
                    >
                      <option value="">Selecciona…</option>
                      {(professionals || [])
                        .filter((p) => p.id !== proA)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                    </select>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    En este modo puedes arrastrar citas entre agendas.
                  </p>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Búsqueda rápida</label>
            <input
              type="text"
              placeholder="Ej. Juan, terapia..."
              className="w-full text-sm rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
            />
          </div>

          <div className="mt-2">
            <MiniCalendar currentDate={currentDate} onChangeDate={(d) => setCurrentDate(d)} />
          </div>

          <div className="mt-auto pt-4 border-t border-slate-200">
            <button
              onClick={() => onNewReservation?.({ professionalId: selectedProfessionalId || null })}
              className="w-full h-10 text-sm rounded-md bg-violet-600 text-white font-medium shadow-sm hover:bg-violet-700 transition"
            >
              + Nueva reserva
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Header sticky en móvil para que NO se pierda */}
          <div className="h-16 px-3 sm:px-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 sticky top-0 z-[30]">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                className="rounded-md border border-slate-300 text-xs px-2 py-1 hover:bg-white"
                onClick={handlePrev}
              >
                &lt;
              </button>
              <button
                className="rounded-md border border-slate-300 text-xs px-2 py-1 hover:bg-white"
                onClick={handleNext}
              >
                &gt;
              </button>

              <div className="flex flex-col min-w-0">
                <span className="text-xs text-slate-500">{headerModeLabel}</span>
                <span className="text-sm font-semibold text-slate-800 truncate">{headerMainLabel}</span>
                <span className="text-[11px] text-slate-500 truncate">
                  Agenda: <b>{selectedProObj?.label || "Profesional"}</b>
                </span>
              </div>
            </div>

            {/* En móvil solo dejamos “Día” (simple y usable). En desktop sí todo */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                className={`text-xs px-3 py-1 rounded-md border border-slate-300 ${viewMode === "day"
                  ? "bg-violet-50 text-violet-700 border-violet-200"
                  : "bg-white hover:bg-slate-50 text-slate-600"
                  }`}
                onClick={() => setViewMode("day")}
              >
                Día
              </button>

              {!isMobile && (
                <>
                  <button
                    className={`text-xs px-3 py-1 rounded-md border border-slate-300 ${viewMode === "week"
                      ? "bg-violet-50 text-violet-700 border-violet-200"
                      : "bg-white hover:bg-slate-50 text-slate-600"
                      }`}
                    onClick={() => setViewMode("week")}
                    disabled={dualMode}
                    title={dualMode ? "En vista dual solo está disponible Día" : ""}
                  >
                    Semana
                  </button>
                  <button
                    className={`hidden sm:inline-flex text-xs px-3 py-1 rounded-md border border-slate-300 ${viewMode === "month"
                      ? "bg-violet-50 text-violet-700 border-violet-200"
                      : "bg-white hover:bg-slate-50 text-slate-600"
                      }`}
                    onClick={() => setViewMode("month")}
                    disabled={dualMode}
                    title={dualMode ? "En vista dual solo está disponible Día" : ""}
                  >
                    Mes
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-white min-h-0">
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              {/* Desktop: semana con min-w. Móvil: NO min-w gigante */}
              <div className={isMobile ? "min-w-0" : "min-w-[980px]"}>
                {/* MOBILE: solo día */}
                {isMobile && (
                  <>
                    <div
                      className="grid border-b border-slate-200 bg-slate-50 text-xs text-slate-500"
                      style={headerGridStyleDay}
                    >
                      <div className="p-2 text-right pr-3">Hora</div>
                      <div className="p-2 font-medium">
                        {weekdayShortEs(new Date(currentDate))}{" "}
                        {String(new Date(currentDate).getDate()).padStart(2, "0")}/
                        {String(new Date(currentDate).getMonth() + 1).padStart(2, "0")}
                      </div>
                    </div>

                    <div className="grid text-xs" style={headerGridStyleDay}>
                      <div className="border-r border-slate-200 bg-slate-50 text-right pr-3">
                        {HOURS.map((hour) => (
                          <div
                            key={hour}
                            style={{ height: HOUR_ROW_HEIGHT }}
                            className="flex items-start justify-end pt-2 text-[11px] text-slate-400"
                          >
                            {hour}
                          </div>
                        ))}
                      </div>

                      <div className="relative">
                        <DayColumn dateIso={keyDate} professionalId={selectedProfessionalId} />
                      </div>
                    </div>
                  </>
                )}

                {/* DESKTOP: semana / dual */}
                {!isMobile && !dualMode && (
                  <>
                    <div
                      className="grid border-b border-slate-200 bg-slate-50 text-xs text-slate-500"
                      style={headerGridStyleWeek}
                    >
                      <div className="p-2 text-right pr-3">Hora</div>
                      {groupedByDay.map((day) => (
                        <div key={day.key} className="p-2 font-medium">
                          {day.label}
                        </div>
                      ))}
                    </div>

                    <div className="grid text-xs" style={headerGridStyleWeek}>
                      <div className="border-r border-slate-200 bg-slate-50 text-right pr-3">
                        {HOURS.map((hour) => (
                          <div
                            key={hour}
                            style={{ height: HOUR_ROW_HEIGHT }}
                            className="flex items-start justify-end pt-2 text-[11px] text-slate-400"
                          >
                            {hour}
                          </div>
                        ))}
                      </div>

                      {groupedByDay.map((day) => {
                        const proId = selectedProfessionalId;
                        return (
                          <div key={day.key} className="border-r border-slate-100 relative">
                            <DayColumn dateIso={day.key} professionalId={proId} />
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {!isMobile && dualMode && canSeeAll && (
                  <>
                    <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                      <div className="p-2 text-right pr-3">Hora</div>
                      <div className="p-2 font-medium truncate">{dualSlots[0]?.label}</div>
                      <div className="p-2 font-medium truncate">{dualSlots[1]?.label}</div>
                    </div>

                    <div className="grid grid-cols-3 text-xs">
                      <div className="border-r border-slate-200 bg-slate-50 text-right pr-3">
                        {HOURS.map((hour) => (
                          <div
                            key={hour}
                            style={{ height: HOUR_ROW_HEIGHT }}
                            className="flex items-start justify-end pt-2 text-[11px] text-slate-400"
                          >
                            {hour}
                          </div>
                        ))}
                      </div>

                      {dualSlots.map((slot) => (
                        <div key={String(slot.id)} className="border-r border-slate-100 relative">
                          {!slot.id ? (
                            <div className="p-3 text-[11px] text-slate-400">
                              Selecciona profesional.
                            </div>
                          ) : (
                            <DayColumn dateIso={keyDate} professionalId={slot.id} />
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <DragOverlay>
                {activeAppt ? (
                  <div
                    className={`rounded-md border text-[11px] px-2 py-1 shadow-md ${activeAppt.color || "bg-white"
                      }`}
                  >
                    <div className="font-semibold truncate">
                      {isBlockItem(activeAppt) ? "Horario bloqueado" : activeAppt.patient}
                    </div>
                    <div className="text-[10px] opacity-80">
                      {isBlockItem(activeAppt)
                        ? activeAppt.motivo || "No disponible"
                        : activeAppt.service}
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </main>
      </div>

      {/* HoverCard solo desktop */}
      {!isMobile && (
        <HoverCard open={Boolean(hoverAppt)} anchorRect={hoverRect}>
          {hoverAppt && (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-800">
                {isBlockItem(hoverAppt) ? "Horario bloqueado" : hoverAppt.patient}
              </div>

              {!isBlockItem(hoverAppt) && (
                <>
                  <div className="text-[11px] text-slate-600">
                    <span className="font-semibold">Servicio:</span> {hoverAppt.service}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    <span className="font-semibold">Costo:</span> ${safeMoney(hoverAppt.price)}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    <span className="font-semibold">Pagado:</span>{" "}
                    {hoverAppt.paid ? (
                      <span className="text-emerald-700 font-semibold">Sí</span>
                    ) : (
                      <span className="text-slate-600">No</span>
                    )}
                  </div>
                </>
              )}

              <div className="text-[11px] text-slate-600">
                <span className="font-semibold">Horario:</span>{" "}
                {String(hoverAppt.time || "").slice(0, 5)}
                {hoverAppt.endTime ? ` – ${String(hoverAppt.endTime).slice(0, 5)}` : ""}
              </div>

              {isBlockItem(hoverAppt) && (
                <div className="text-[11px] text-slate-600">
                  <span className="font-semibold">Motivo:</span> {hoverAppt.motivo || "No disponible"}
                </div>
              )}
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
          <div className="text-[11px] font-semibold text-slate-700">
            {slotMenu?.hour} · {slotMenu?.date}
          </div>
          <div className="text-[10px] text-slate-500">
            {slotMenu?.hasBlock ? "Este horario está bloqueado" : "Elige una acción"}
          </div>
        </div>

        <div className="mt-2 grid gap-2">
          {!slotMenu?.hasBlock && (
            <button
              type="button"
              onClick={() => {
                const s = slotMenu;
                setSlotMenu(null);
                if (!s) return;
                onNewReservation?.({
                  date: s.date,
                  time: s.hour,
                  professionalId: s.professionalId,
                });
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm text-slate-700"
            >
              <Plus className="h-4 w-4" />
              Agendar cita nueva
            </button>
          )}

          {!slotMenu?.hasBlock ? (
            <button
              type="button"
              onClick={() => {
                const s = slotMenu;
                setSlotMenu(null);
                if (!s) return;
                onOpenBlockModal?.({
                  date: s.date,
                  startTime: s.hour,
                  professionalId: s.professionalId,
                });
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm text-slate-700"
            >
              <Ban className="h-4 w-4" />
              Bloquear horario
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-400 cursor-not-allowed"
              title="Este horario ya está bloqueado"
            >
              <Ban className="h-4 w-4" />
              Horario ya bloqueado
            </button>
          )}
        </div>
      </MenuPopover>
    </>
  );
}