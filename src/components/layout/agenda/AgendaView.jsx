// src/components/layout/agenda/AgendaView.jsx
import { useMemo, useRef, useState, useEffect } from "react";
import { MiniCalendar } from "./MiniCalendar";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

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

export function AgendaView({
  branch,
  setBranch,
  appointments,
  professionals,

  selectedProfessionalId,
  setSelectedProfessionalId,

  role, // "admin" | "recepcion" | "fisioterapeuta" | ...
  myUserId, // id del usuario logueado

  onNewReservation, // preset: { date, time, professionalId }
  onOpenAppointment,
  onMoveAppointment,
}) {
  const [quickSearch, setQuickSearch] = useState("");
  const [viewMode, setViewMode] = useState("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  const [dualMode, setDualMode] = useState(false);
  const [proA, setProA] = useState(selectedProfessionalId || null);
  const [proB, setProB] = useState(null);

  const [activeApptId, setActiveApptId] = useState(null);

  const isProfessional = role === "fisioterapeuta" || role === "nutriologo" || role === "dentista";
  const canSeeAll = role === "admin" || role === "recepcion";

  // ✅ si es profesional: fuerza su propio id y bloquea selección
  useEffect(() => {
    if (isProfessional && myUserId) {
      setSelectedProfessionalId?.(myUserId);
      setProA(myUserId);
    }
  }, [isProfessional, myUserId, setSelectedProfessionalId]);

  // ✅ cuando se activa dualMode: forzar vista Día automáticamente
  useEffect(() => {
    if (dualMode) {
      setViewMode("day");
    }
  }, [dualMode]);

  // Horario visible
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

  const DAY_START_MINUTES = 8 * 60;
  const HOUR_ROW_HEIGHT = 48;
  const PIXELS_PER_MINUTE = HOUR_ROW_HEIGHT / 60;
  const GRID_TOTAL_HEIGHT = HOURS.length * HOUR_ROW_HEIGHT;

  const columnRefs = useRef(new Map());

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function parseTimeToMinutes(time) {
    if (!time) return DAY_START_MINUTES;
    const [hStr, mStr] = String(time).split(":");
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr || "0", 10);
    if (Number.isNaN(h) || Number.isNaN(m)) return DAY_START_MINUTES;
    return h * 60 + m;
  }

  function computeTop(time) {
    const minutes = parseTimeToMinutes(time);
    const diff = Math.max(0, minutes - DAY_START_MINUTES);
    return diff * PIXELS_PER_MINUTE;
  }

  function computeHeight(startTime, endTime) {
    const start = parseTimeToMinutes(startTime);
    const end = parseTimeToMinutes(endTime || startTime);
    const dur = Math.max(30, end - start || 60);
    return dur * PIXELS_PER_MINUTE;
  }

  function minutesToTimeStr(totalMinutes) {
    const m = Math.max(0, Math.min(23 * 60 + 59, Math.round(totalMinutes)));
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  function roundToStepMinutes(minutes, step = 15) {
    return Math.round(minutes / step) * step;
  }

  // =========================
  // Profesional seleccionado (id -> label)
  // =========================
  const proMap = useMemo(() => {
    const m = new Map();
    (professionals || []).forEach((p) => m.set(p.id, p));
    return m;
  }, [professionals]);

  const selectedProObj = selectedProfessionalId ? proMap.get(selectedProfessionalId) : null;

  // =========================
  // 🔥 FILTRO PRINCIPAL DE CITAS PARA LA VISTA (normal)
  // =========================
  const visibleAppointments = useMemo(() => {
    const list = appointments || [];
    if (canSeeAll) {
      if (!selectedProfessionalId) return list;
      return list.filter((a) => a.professionalId === selectedProfessionalId);
    }
    if (isProfessional && myUserId) {
      return list.filter((a) => a.professionalId === myUserId);
    }
    return list;
  }, [appointments, canSeeAll, isProfessional, myUserId, selectedProfessionalId]);

  // ✅ IMPORTANTÍSIMO:
  // En dualMode necesitamos encontrar y arrastrar citas de A y B.
  // Si usamos visibleAppointments (filtrado por selectedProfessionalId), se rompe (solo mueve en un sentido).
  const dragSourceAppointments = useMemo(() => {
    if (dualMode && canSeeAll) return appointments || [];
    return visibleAppointments || [];
  }, [dualMode, canSeeAll, appointments, visibleAppointments]);

  // =========================
  // Header label
  // =========================
  let headerMainLabel = "";
  if (viewMode === "day") {
    headerMainLabel = formatLongDate(currentDate);
  } else if (viewMode === "week") {
    const monday = startOfWeekMonday(currentDate);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    headerMainLabel = `${formatLongDate(monday)} – ${formatLongDate(sunday)}`;
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
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

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
          String(appt.patient || "").toLowerCase().includes(searchTerm)
        );
      })
      .sort((a, b) => a.time.localeCompare(b.time));

    const label = day
      .toLocaleDateString("es-MX", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
      })
      .replace(/^\w/, (c) => c.toUpperCase());

    return { label, key, items };
  });

  const activeAppt = useMemo(
    () => (dragSourceAppointments || []).find((a) => a.id === activeApptId) || null,
    [dragSourceAppointments, activeApptId]
  );

  // =========================
  // Drag logic
  // =========================
  const handleDragStart = (event) => {
    setActiveApptId(event?.active?.id ?? null);
  };

  const handleDragEnd = (event) => {
    const activeId = event?.active?.id;
    const overId = event?.over?.id;
    setActiveApptId(null);
    if (!activeId || !overId) return;

    // ✅ usar dragSourceAppointments para que funcione A->B y B->A
    const appt = (dragSourceAppointments || []).find((a) => a.id === activeId);
    if (!appt) return;

    // overId: "day:YYYY-MM-DD"  o  "dual:YYYY-MM-DD:PRO_ID"
    const parts = String(overId).split(":");
    let newDate = appt.date;
    let newProfessionalId = appt.professionalId ?? null;

    if (parts[0] === "day") {
      newDate = parts[1];
    }

    if (parts[0] === "dual") {
      newDate = parts[1];
      const proId = Number(parts[2]);
      if (!Number.isNaN(proId)) newProfessionalId = proId;
    }

    const container = columnRefs.current.get(String(overId));
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const activeRect = event.active.rect.current.translated;
    if (!activeRect) return;

    const relativeY = activeRect.top - containerRect.top + (container.scrollTop || 0);

    const minutesFromStart = relativeY / PIXELS_PER_MINUTE;
    const minutes = DAY_START_MINUTES + minutesFromStart;
    const rounded = roundToStepMinutes(minutes, 15);
    const newTime = minutesToTimeStr(rounded);

    const startMin = parseTimeToMinutes(appt.time);
    const endMin = parseTimeToMinutes(appt.endTime || appt.time);
    const dur = Math.max(30, endMin - startMin || 60);
    const newEndTime = minutesToTimeStr(rounded + dur);

    const patch = {
      id: appt.id,
      date: newDate,
      time: newTime,
      endTime: newEndTime,
      ...(newProfessionalId != null ? { professionalId: newProfessionalId } : {}),
    };

    (onMoveAppointment || (() => { }))(appt, patch);
  };

  function handleGridClick(e, preset) {
    const clickedAppt = e.target.closest?.("[data-appt='1']");
    if (clickedAppt) return;

    const node = e.currentTarget;
    const rect = node.getBoundingClientRect();
    const scrollTop = node.scrollTop || 0;

    const y = e.clientY - rect.top + scrollTop;
    if (y < 0 || y > GRID_TOTAL_HEIGHT) return;

    const minutesFromStart = y / PIXELS_PER_MINUTE;
    const minutes = DAY_START_MINUTES + minutesFromStart;
    const rounded = roundToStepMinutes(minutes, 15);
    const time = minutesToTimeStr(rounded);

    onNewReservation?.({
      date: preset.date,
      time,
      professionalId: preset.professionalId ?? null,
    });
  }

  function DroppableDayColumn({ id, children, className, onGridClick }) {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
      <div
        ref={(node) => {
          setNodeRef(node);
          if (node) columnRefs.current.set(String(id), node);
          else columnRefs.current.delete(String(id));
        }}
        onClick={onGridClick}
        className={[className, isOver ? "ring-2 ring-violet-300" : "", "cursor-cell"].join(" ")}
      >
        {children}
      </div>
    );
  }

  function DraggableAppointment({ appt, top, height, onClick }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: appt.id });

    // ✅ Estética: ocupar ancho completo de la columna
    const style = {
      position: "absolute",
      top,
      left: 0,
      right: 0,
      height: -3,
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      opacity: isDragging ? 0.3 : 1,
      cursor: "grab",
    };

    return (
      <button
        ref={setNodeRef}
        type="button"
        onClick={(ev) => {
          ev.stopPropagation();
          onClick?.();
        }}
        style={style}
        data-appt="1"
        className={[
          "text-left rounded-md border text-[11px] px-2 py-1 shadow-sm hover:shadow-md transition overflow-hidden",
          "w-full", // por si acaso
          appt.color,
        ].join(" ")}
        {...listeners}
        {...attributes}
        title="Arrastra para mover. Click para editar."
      >
        <div className="flex items-center justify-between">
          <span className="font-semibold truncate">{appt.patient}</span>
          <span className="ml-2 text-[10px] opacity-80">{appt.time}</span>
        </div>
        <div className="text-[10px] opacity-90 truncate">{appt.service}</div>
        <div className="text-[10px] opacity-80 truncate">{appt.professional}</div>
      </button>
    );
  }

  function GridLines() {
    const blocks = HOURS.length * 4;
    return (
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: blocks }).map((_, i) => {
          const isHour = i % 4 === 0;
          return (
            <div
              key={i}
              style={{ height: HOUR_ROW_HEIGHT / 4 }}
              className={"border-b " + (isHour ? "border-slate-200" : "border-slate-100")}
            />
          );
        })}
      </div>
    );
  }

  // Dual mode: usaremos IDs (proA/proB son ids)
  const dualSlots = useMemo(() => {
    return [
      { id: proA, label: proA ? (proMap.get(proA)?.label || "Profesional A") : "Profesional A" },
      { id: proB, label: proB ? (proMap.get(proB)?.label || "Profesional B") : "Profesional B" },
    ];
  }, [proA, proB, proMap]);

  return (
    <>
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col p-4 gap-4">
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
              (isProfessional ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-slate-50")
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

        {/* Dual mode (solo admin/recepcion; profesional no lo necesita) */}
        {canSeeAll && (
          <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-slate-600">Vista 2 profesionales</p>
              <button
                type="button"
                onClick={() => {
                  setDualMode((v) => !v);
                  // ✅ ya NO ponemos week, porque dualMode debe estar en Día
                  // el useEffect de dualMode se encarga de activar viewMode="day"
                }}
                className={
                  "text-[11px] px-2 py-1 rounded-md border " +
                  (dualMode ? "bg-violet-50 text-violet-700 border-violet-200" : "bg-white text-slate-600 border-slate-200")
                }
              >
                {dualMode ? "Activo" : "Desactivado"}
              </button>
            </div>

            {dualMode && (
              <div className="mt-3 grid grid-cols-1 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Profesional A</label>
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
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Profesional B</label>
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
            placeholder="Ej. 14:00, Aide..."
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
            onClick={() =>
              onNewReservation?.({
                professionalId: selectedProfessionalId || null,
              })
            }
            className="w-full h-10 text-sm rounded-md bg-violet-600 text-white font-medium shadow-sm hover:bg-violet-700 transition"
          >
            + Nueva reserva
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="h-16 px-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="rounded-md border border-slate-300 text-xs px-2 py-1 hover:bg-white" onClick={handlePrev}>
              &lt;
            </button>
            <button className="rounded-md border border-slate-300 text-xs px-2 py-1 hover:bg-white" onClick={handleNext}>
              &gt;
            </button>

            <div className="flex flex-col">
              <span className="text-xs text-slate-500">{headerModeLabel}</span>
              <span className="text-sm font-semibold text-slate-800">{headerMainLabel}</span>
              <span className="text-[11px] text-slate-500">
                Agenda: <b>{selectedProObj?.label || "Profesional"}</b>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              className={`text-xs px-3 py-1 rounded-md border border-slate-300 ${viewMode === "day"
                ? "bg-violet-50 text-violet-700 border-violet-200"
                : "bg-white hover:bg-slate-50 text-slate-600"
                }`}
              onClick={() => setViewMode("day")}
            >
              Día
            </button>
            <button
              className={`text-xs px-3 py-1 rounded-md border border-slate-300 ${viewMode === "week"
                ? "bg-violet-50 text-violet-700 border-violet-200"
                : "bg-white hover:bg-slate-50 text-slate-600"
                }`}
              onClick={() => setViewMode("week")}
              disabled={dualMode} // opcional: bloquea semana si dual está activo
              title={dualMode ? "En vista dual solo está disponible Día" : ""}
            >
              Semana
            </button>
            <button
              className={`text-xs px-3 py-1 rounded-md border border-slate-300 ${viewMode === "month"
                ? "bg-violet-50 text-violet-700 border-violet-200"
                : "bg-white hover:bg-slate-50 text-slate-600"
                }`}
              onClick={() => setViewMode("month")}
              disabled={dualMode} // opcional: bloquea mes si dual está activo
              title={dualMode ? "En vista dual solo está disponible Día" : ""}
            >
              Mes
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-white">
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="min-w-[1000px]">
              {!dualMode && (
                <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                  <div className="p-2 text-right pr-4">Hora</div>
                  {groupedByDay.map((day) => (
                    <div key={day.key} className="p-2 font-medium">
                      {day.label}
                    </div>
                  ))}
                </div>
              )}

              {dualMode && canSeeAll && (
                <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                  <div className="p-2 text-right pr-4">Hora</div>
                  <div className="p-2 font-medium truncate">{dualSlots[0]?.label}</div>
                  <div className="p-2 font-medium truncate">{dualSlots[1]?.label}</div>
                </div>
              )}

              {!dualMode && (
                <div className="grid grid-cols-8 text-xs">
                  <div className="border-r border-slate-200 bg-slate-50 text-right pr-4">
                    {HOURS.map((hour) => (
                      <div key={hour} className="h-12 flex items-start justify-end pt-1 text-[11px] text-slate-400">
                        {hour}
                      </div>
                    ))}
                  </div>

                  {groupedByDay.map((day) => {
                    const proId = selectedProfessionalId;

                    return (
                      <div key={day.key} className="border-r border-slate-100 relative">
                        <GridLines />
                        <DroppableDayColumn
                          id={`day:${day.key}`}
                          className="relative h-[624px] overflow-hidden" // ✅ quitamos p-1 para que la tarjeta no se adelgace
                          onGridClick={(e) => handleGridClick(e, { date: day.key, professionalId: proId })}
                        >
                          <div className="relative h-[624px]">
                            {day.items.map((appt) => {
                              const top = computeTop(appt.time);
                              const height = computeHeight(appt.time, appt.endTime);
                              return (
                                <DraggableAppointment
                                  key={appt.id}
                                  appt={appt}
                                  top={top}
                                  height={height}
                                  onClick={() => onOpenAppointment(appt)}
                                />
                              );
                            })}

                            {day.items.length === 0 && (
                              <p className="absolute top-2 left-2 text-[11px] text-slate-300">
                                Click en una hora para agendar.
                              </p>
                            )}
                          </div>
                        </DroppableDayColumn>
                      </div>
                    );
                  })}
                </div>
              )}

              {dualMode && canSeeAll && (
                <div className="grid grid-cols-3 text-xs">
                  <div className="border-r border-slate-200 bg-slate-50 text-right pr-4">
                    {HOURS.map((hour) => (
                      <div key={hour} className="h-12 flex items-start justify-end pt-1 text-[11px] text-slate-400">
                        {hour}
                      </div>
                    ))}
                  </div>

                  {dualSlots.map((slot) => {
                    const keyDate = dateKey(currentDate);

                    const items = (appointments || [])
                      .filter((a) => {
                        if (!slot.id) return false;
                        if (a.date !== keyDate) return false;
                        if (a.professionalId !== slot.id) return false;

                        if (!searchTerm) return true;
                        return (
                          String(a.time || "").includes(searchTerm) ||
                          String(a.patient || "").toLowerCase().includes(searchTerm)
                        );
                      })
                      .sort((a, b) => a.time.localeCompare(b.time));

                    const droppableId = `dual:${keyDate}:${slot.id}`;

                    return (
                      <div key={droppableId} className="border-r border-slate-100 relative">
                        <GridLines />
                        <DroppableDayColumn
                          id={droppableId}
                          className="relative h-[624px] overflow-hidden" // ✅ quitamos p-1 para que no se adelgace
                          onGridClick={(e) => {
                            if (!slot.id) return;
                            handleGridClick(e, {
                              date: keyDate,
                              professionalId: slot.id,
                            });
                          }}
                        >
                          <div className="relative h-[624px]">
                            {!slot.id && (
                              <p className="absolute top-2 left-2 text-[11px] text-slate-400">
                                Selecciona profesional.
                              </p>
                            )}

                            {items.map((appt) => {
                              const top = computeTop(appt.time);
                              const height = computeHeight(appt.time, appt.endTime);
                              return (
                                <DraggableAppointment
                                  key={appt.id}
                                  appt={appt}
                                  top={top}
                                  height={height}
                                  onClick={() => onOpenAppointment(appt)}
                                />
                              );
                            })}

                            {slot.id && items.length === 0 && (
                              <p className="absolute top-2 left-2 text-[11px] text-slate-300">
                                Click en una hora para agendar.
                              </p>
                            )}
                          </div>
                        </DroppableDayColumn>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <DragOverlay>
              {activeAppt ? (
                <div className={`rounded-md border text-[11px] px-2 py-1 shadow-md ${activeAppt.color}`}>
                  <div className="font-semibold truncate">{activeAppt.patient}</div>
                  <div className="text-[10px] opacity-80">{activeAppt.time}</div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </main>
    </>
  );
}
