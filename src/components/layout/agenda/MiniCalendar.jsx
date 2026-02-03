// src/components/layout/agenda/MiniCalendar.jsx

// Recibe la fecha actual y una función para cambiarla
export function MiniCalendar({ currentDate, onChangeDate }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0 - 11

  const monthLabel = currentDate
    .toLocaleDateString("es-MX", {
      month: "long",
      year: "numeric",
    })
    .replace(/^\w/, (c) => c.toUpperCase());

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Queremos que la semana empiece en Lunes
  const jsWeekday = firstDayOfMonth.getDay(); // 0=domingo, 1=lunes...
  const offset = (jsWeekday + 6) % 7; // 0=lunes, 6=domingo

  const totalCells = offset + daysInMonth;
  const rows = Math.ceil(totalCells / 7);

  const cells = [];
  for (let i = 0; i < rows * 7; i++) {
    const dayNumber = i - offset + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      cells.push(null);
    } else {
      cells.push(dayNumber);
    }
  }

  const todayDay = currentDate.getDate();
  const todayMonth = currentDate.getMonth();
  const todayYear = currentDate.getFullYear();

  const goPrevMonth = () => {
    const d = new Date(year, month - 1, 1);
    onChangeDate?.(d);
  };

  const goNextMonth = () => {
    const d = new Date(year, month + 1, 1);
    onChangeDate?.(d);
  };

  const handleSelectDay = (day) => {
    if (!day) return;
    const d = new Date(year, month, day);
    onChangeDate?.(d);
  };

  return (
    <div className="border border-slate-200 rounded-lg p-3 text-xs bg-white shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-slate-700">{monthLabel}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-slate-100"
            onClick={goPrevMonth}
          >
            ‹
          </button>
          <button
            type="button"
            className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-slate-100"
            onClick={goNextMonth}
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-[10px] text-center text-slate-400 mb-1">
        {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-[10px] text-center">
        {cells.map((day, idx) => {
          if (!day) {
            return <div key={idx} className="h-6" />;
          }

          const isSelected =
            day === todayDay && month === todayMonth && year === todayYear;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectDay(day)}
              className={`h-6 flex items-center justify-center rounded-full transition ${
                isSelected
                  ? "bg-violet-600 text-white font-semibold shadow-sm"
                  : "hover:bg-slate-100 text-slate-600"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
