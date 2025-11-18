// Utilidades puras para fechas/horarios (sin React)
export const formatDateLong = (d) =>
  d.toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "short" });

export const formatDayChip = (d) => ({
  dow: d.toLocaleDateString(undefined, { weekday: "short" }),
  day: d.getDate(),
  mon: d.toLocaleDateString(undefined, { month: "short" }),
});

export function nextDays(count = 21) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

export function buildSlots(date) {
  const startHour = 8;
  const endHour = 21;
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    const label = `${String(h).padStart(2, "0")}:00`;
    const isSunday = date.getDay() === 0;
    const disabled =
      isSunday || (date.toDateString() === new Date().toDateString() && h <= new Date().getHours());
    const period = h < 13 ? "Mañana" : h < 18 ? "Tarde" : "Noche";
    slots.push({ label, disabled, period });
  }
  return slots;
}
