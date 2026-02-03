// src/components/layout/agenda/AgendaView.jsx
import { useState } from "react";
import { MiniCalendar } from "./MiniCalendar";

// Helpers para formato de fechas
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

// Lunes de la semana de una fecha (semana inicia en lunes)
function startOfWeekMonday(date) {
  const d = new Date(date);
  const jsDay = d.getDay(); // 0=domingo,1=lunes...
  const deltaToMonday = (jsDay + 6) % 7; // 0=lunes,6=domingo
  d.setDate(d.getDate() - deltaToMonday);
  return d;
}

// YYYY-MM-DD sin problemas de timezone
function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function AgendaView({
  branch,
  professional,
  setBranch,
  setProfessional,
  appointments,
  onNewReservation,
  onOpenAppointment,
}) {
  const [quickSearch, setQuickSearch] = useState("");
  const [viewMode, setViewMode] = useState("week"); // "day" | "week" | "month"
  const [currentDate, setCurrentDate] = useState(new Date()); // hoy
  const DAY_START_MINUTES = 8 * 60; // 08:00
  const HOUR_ROW_HEIGHT = 48; // h-12 en Tailwind ≈ 48px
  const PIXELS_PER_MINUTE = HOUR_ROW_HEIGHT / 60;

  function parseTimeToMinutes(time) {
    if (!time) return DAY_START_MINUTES;
    const [hStr, mStr] = time.split(":");
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
    const dur = Math.max(30, end - start || 60); // mínimo 30 min
    return dur * PIXELS_PER_MINUTE;
  }

  let headerMainLabel = "";
  if (viewMode === "day") {
    headerMainLabel = formatLongDate(currentDate);
  } else if (viewMode === "week") {
    const monday = startOfWeekMonday(currentDate);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    headerMainLabel = `${formatLongDate(monday)} – ${formatLongDate(sunday)}`;
  } else {
    // month
    headerMainLabel = currentDate
      .toLocaleDateString("es-MX", { month: "long", year: "numeric" })
      .replace(/^\w/, (c) => c.toUpperCase());
  }

  const headerModeLabel =
    viewMode === "day" ? "Día" : viewMode === "month" ? "Mes" : "Semana";

  // Flechas de navegación: día / semana / mes
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === "day") {
      next.setDate(next.getDate() - 1);
    } else if (viewMode === "week") {
      next.setDate(next.getDate() - 7);
    } else {
      next.setMonth(next.getMonth() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === "day") {
      next.setDate(next.getDate() + 1);
    } else if (viewMode === "week") {
      next.setDate(next.getDate() + 7);
    } else {
      next.setMonth(next.getMonth() + 1);
    }
    setCurrentDate(next);
  };

  // =========================
  // Días visibles en la grilla (siempre semana por ahora)
  // =========================

  const monday = startOfWeekMonday(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const searchTerm = quickSearch.trim().toLowerCase();

  const groupedByDay = weekDays.map((day) => {
    const key = dateKey(day);

    const items = appointments
      .filter((appt) => {
        const sameDate = appt.date === key;
        if (!sameDate) return false;
        if (!searchTerm) return true;

        return (
          appt.time.includes(searchTerm) ||
          appt.patient.toLowerCase().includes(searchTerm)
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

    return { label, items };
  });

  return (
    <>
      {/* Sidebar izquierdo Agenda */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col p-4 gap-4">
        {/* Sucursal fija */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Sucursal
          </label>
          <select
            className="w-full text-sm rounded-md border border-slate-200 px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          >
            <option>Fisionerv Centro</option>
          </select>
        </div>

        {/* Profesional fijo */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Profesional
          </label>
          <select
            className="w-full text-sm rounded-md border border-slate-200 px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            value={professional}
            onChange={(e) => setProfessional(e.target.value)}
          >
            <option>Edgar Mauricio Medina Cruz</option>
          </select>
        </div>

        {/* Búsqueda rápida */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Búsqueda rápida de hora
          </label>
          <input
            type="text"
            placeholder="Ej. 14:00, Aide..."
            className="w-full text-sm rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
          />
        </div>

        {/* Calendario mini conectado a currentDate */}
        <div className="mt-2">
          <MiniCalendar
            currentDate={currentDate}
            onChangeDate={(d) => setCurrentDate(d)}
          />
        </div>

        {/* Botón nueva reserva */}
        <div className="mt-auto pt-4 border-t border-slate-200">
          <button
            onClick={onNewReservation}
            className="w-full h-10 text-sm rounded-md bg-violet-600 text-white font-medium shadow-sm hover:bg-violet-700 transition"
          >
            + Nueva reserva
          </button>
        </div>
      </aside>

      {/* Contenido Agenda */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Barra superior de agenda */}
        <div className="h-16 px-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Flechas */}
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

            <div className="flex flex-col">
              <span className="text-xs text-slate-500">{headerModeLabel}</span>
              <span className="text-sm font-semibold text-slate-800">
                {headerMainLabel}
              </span>
            </div>
          </div>

          {/* Botones Día / Semana / Mes */}
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
            >
              Semana
            </button>
            <button
              className={`text-xs px-3 py-1 rounded-md border border-slate-300 ${viewMode === "month"
                  ? "bg-violet-50 text-violet-700 border-violet-200"
                  : "bg-white hover:bg-slate-50 text-slate-600"
                }`}
              onClick={() => setViewMode("month")}
            >
              Mes
            </button>
          </div>
        </div>

        {/* Calendario semanal simple */}
        <div className="flex-1 overflow-auto bg-white">
          <div className="min-w-[1000px]">
            {/* Cabecera de días */}
            <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
              <div className="p-2 text-right pr-4">Hora</div>
              {groupedByDay.map((day) => (
                <div key={day.label} className="p-2 font-medium">
                  {day.label}
                </div>
              ))}
            </div>

            {/* Cuerpo */}
            <div className="grid grid-cols-8 text-xs">
              {/* Columna de horas */}
              <div className="border-r border-slate-200 bg-slate-50 text-right pr-4">
                {[
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
                ].map((hour) => (
                  <div
                    key={hour}
                    className="h-12 flex items-start justify-end pt-1 text-[11px] text-slate-400"
                  >
                    {hour}
                  </div>
                ))}
              </div>

              {/* Columnas por día */}
              {groupedByDay.map((day) => (
                <div
                  key={day.label}
                  className="border-r border-slate-100 relative"
                >
                  {/* Líneas de horas */}
                  <div className="absolute inset-0 pointer-events-none">
                    {Array.from({ length: 13 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="h-12 border-b border-slate-50"
                      />
                    ))}
                  </div>

                  {/* Contenedor donde posicionamos las citas */}
                  <div className="relative h-[624px] p-1">
                    {day.items.map((appt) => {
                      const top = computeTop(appt.time);
                      const height = computeHeight(appt.time, appt.endTime);

                      return (
                        <button
                          key={appt.id}
                          onClick={() => onOpenAppointment(appt)}
                          style={{
                            position: "absolute",
                            top,
                            left: "0.25rem",
                            right: "0.25rem",
                            height,
                          }}
                          className={`text-left rounded-md border text-[11px] px-2 py-1 shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden ${appt.color}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold truncate">
                              {appt.patient}
                            </span>
                            <span className="ml-2 text-[10px] opacity-80">
                              {appt.time}
                            </span>
                          </div>
                          <div className="text-[10px] opacity-90 truncate">
                            {appt.service}
                          </div>
                          <div className="text-[10px] opacity-80 truncate">
                            {appt.professional}
                          </div>
                        </button>
                      );
                    })}

                    {day.items.length === 0 && (
                      <p className="absolute top-2 left-2 text-[11px] text-slate-300">
                        Sin reservas.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
