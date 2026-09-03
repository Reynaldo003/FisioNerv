import { ChevronLeft, ChevronRight } from "lucide-react";

export function MiniCalendar({ currentDate, onChangeDate }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const now = new Date();
  const todayDay = now.getDate();
  const todayMonth = now.getMonth();
  const todayYear = now.getFullYear();

  const monthLabel = currentDate
    .toLocaleDateString("es-MX", { month: "long", year: "numeric" })
    .replace(/^\w/, (c) => c.toUpperCase());

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const jsWeekday = firstDayOfMonth.getDay();
  const offset = (jsWeekday + 6) % 7;

  const totalCells = offset + daysInMonth;
  const rows = Math.ceil(totalCells / 7);

  const cells = [];
  for (let i = 0; i < rows * 7; i++) {
    const dayNumber = i - offset + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) cells.push(null);
    else cells.push(dayNumber);
  }

  const goPrevMonth = () => onChangeDate?.(new Date(year, month - 1, 1));
  const goNextMonth = () => onChangeDate?.(new Date(year, month + 1, 1));
  const handleSelectDay = (day) =>
    day && onChangeDate?.(new Date(year, month, day));

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600">
              Calendario
            </p>
            <h4 className="mt-1 text-sm font-bold text-slate-900">
              {monthLabel}
            </h4>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
              onClick={goPrevMonth}
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
              onClick={goNextMonth}
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center text-[11px]">
          {cells.map((day, index) => {
            if (!day) return <div key={index} className="h-9" />;

            const isSelected = day === currentDate.getDate();
            const isToday =
              day === todayDay &&
              month === todayMonth &&
              year === todayYear;

            return (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectDay(day)}
                aria-current={isSelected ? "date" : undefined}
                className={[
                  "mx-auto flex h-9 w-9 items-center justify-center rounded-xl border text-[11px] font-semibold transition",
                  isSelected
                    ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50",
                  isToday && !isSelected
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
