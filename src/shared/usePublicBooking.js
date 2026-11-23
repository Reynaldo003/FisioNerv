import { useEffect, useMemo, useRef, useState } from "react";
import { buildSlots, nextDays } from "../lib/schedule";
import { API_BASE, CLINIC } from "./clinicData";

export function bookingDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function minutes(value = "") {
  const [hours = 0, mins = 0] = String(value).split(":").map(Number);
  return hours * 60 + mins;
}

function serviceDuration(service) {
  const value = service?.duration || service?.duracion;
  if (!value) return 60;
  const [hours = 0, mins = 0, seconds = 0] = String(value).split(":").map(Number);
  return Math.max(1, hours * 60 + mins + seconds / 60) || 60;
}

function busyRanges(data) {
  const list = Array.isArray(data) ? data : data?.results || [];
  return list.filter((item) => item.hora_inicio).map((item) => {
    const start = minutes(item.hora_inicio);
    return { start, end: item.hora_termina ? minutes(item.hora_termina) : start + 60 };
  });
}

export function usePublicBooking(service) {
  const includeSunday = localStorage.getItem("agenda.includeSunday") === "1";
  const days = useMemo(() => nextDays(14).filter((date) => includeSunday || date.getDay() !== 0), [includeSunday]);
  const [date, setDate] = useState(() => bookingDateKey(days[0]));
  const [time, setTime] = useState(null);
  const [period, setPeriod] = useState("Todo");
  const [retry, setRetry] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const [availability, setAvailability] = useState({ date: "", status: "loading", ranges: [] });
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const submitting = useRef(false);
  const selectedDate = days.find((day) => bookingDateKey(day) === date) || days[0];
  const duration = serviceDuration(service);
  const availabilityStatus = availability.date === date ? availability.status : "loading";

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setAvailability({ date, status: "loading", ranges: [] });
    async function load() {
      try {
        const response = await fetch(`${API_BASE}/api/public/agenda/?fecha=${date}`, { signal: controller.signal });
        if (!response.ok) throw new Error("No se pudo consultar la agenda.");
        const data = await response.json();
        if (!controller.signal.aborted) setAvailability({ date, status: "ready", ranges: busyRanges(data) });
      } catch (failure) {
        if (failure.name !== "AbortError") setAvailability({ date, status: "error", ranges: [] });
      }
    }
    load();
    return () => controller.abort();
  }, [date, retry]);

  const slots = useMemo(() => buildSlots(selectedDate).map((slot) => {
    const start = minutes(slot.label);
    const end = start + duration;
    const occupied = availability.ranges.some((range) => start < range.end && range.start < end);
    return { ...slot, disabled: slot.disabled || date < bookingDateKey(now) || end > 21 * 60 || occupied || availabilityStatus !== "ready" };
  }), [selectedDate, duration, availability.ranges, availabilityStatus, date, now]);
  const selectedSlot = slots.find((slot) => slot.label === time && !slot.disabled) || null;
  const filteredSlots = slots.filter((slot) => period === "Todo" || slot.period === period);

  function chooseDate(value) { setDate(value); setTime(null); setError(""); }
  function chooseTime(value) { setTime(value); setError(""); }
  function choosePeriod(value) { setPeriod(value); }

  async function submit({ name, phone }) {
    if (submitting.current || !service || !selectedSlot) return null;
    submitting.current = true;
    setBooking(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/public/citas/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: name.trim(), telefono: phone.trim(), servicio_id: service.id, fecha: date, hora_inicio: time, profesional_hint: "L.F.T Edgar Mauricio Medina Cruz" }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 409) {
          setTime(null);
          setRetry((value) => value + 1);
          setError("Ese horario acaba de ocuparse. Por favor, elige otro horario disponible.");
          return { conflict: true };
        }
        setError(typeof data?.detail === "string" ? data.detail : "No pudimos registrar tu cita. Revisa tus datos e intenta de nuevo, o escríbenos por WhatsApp.");
        return null;
      }

      const serviceName = service.name || service.nombre;
      const dateLabel = selectedDate.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
      const text = `Hola, soy ${name.trim()}. Quiero confirmar mi cita de ${serviceName} en ${CLINIC.name} el ${dateLabel} a las ${time}. Mi WhatsApp es ${phone.trim()}.`;
      const whatsapp = `https://wa.me/${CLINIC.phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
      const result = { name: name.trim(), service: serviceName, date: dateLabel, time, price: service.price ?? service.precio, whatsapp };
      setConfirmation(result);
      const start = minutes(time);
      setAvailability((previous) => ({ ...previous, ranges: [...previous.ranges, { start, end: data?.hora_termina ? minutes(data.hora_termina) : start + duration }] }));
      return result;
    } catch {
      setError("No pudimos conectar con la clínica. Tus datos siguen aquí para que puedas intentarlo de nuevo.");
      return null;
    } finally {
      submitting.current = false;
      setBooking(false);
    }
  }

  function startAgain() { setConfirmation(null); setTime(null); setError(""); setRetry((value) => value + 1); }

  return { days, date, selectedDate, selectedSlot, slots, filteredSlots, period, availabilityStatus, booking, error, confirmation, duration, chooseDate, chooseTime, choosePeriod, clearTime: () => setTime(null), retryAvailability: () => setRetry((value) => value + 1), submit, startAgain };
}
