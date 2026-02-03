// src/components/Agenda.jsx
import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CalendarDays,
    Clock3,
    ChevronDown,
    PhoneCall,
    Sparkles,
} from "lucide-react";
import {
    nextDays,
    formatDateLong,
    formatDayChip,
    buildSlots,
} from "@/lib/schedule";
import { TextAnimate } from "@/components/ui/text-animate";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function AgendaV2({ CLINIC, SERVICES, PRIMARY = "#1E63C5" }) {
    const days = useMemo(() => nextDays(14), []);
    const [step, setStep] = useState(1);
    const [serviceOpen, setServiceOpen] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedDate, setSelectedDate] = useState(days[0]);
    const [period, setPeriod] = useState("Todo");
    const [selectedSlot, setSelectedSlot] = useState(null);

    const [busySlots, setBusySlots] = useState([]); // HH:MM ya ocupadas

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [booking, setBooking] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // cuando llegan los servicios desde el parent, selecciona el primero
    useEffect(() => {
        if (SERVICES && SERVICES.length && !selectedService) {
            setSelectedService(SERVICES[0]);
        }
    }, [SERVICES, selectedService]);

    // slots base (mañana / tarde / noche) a partir del helper
    const slots = useMemo(
        () => buildSlots(selectedDate),
        [selectedDate],
    );

    // slots filtrados por periodo + marcando ocupados
    const filtered = useMemo(() => {
        const busySet = new Set(busySlots);
        return slots
            .filter((s) => (period === "Todo" ? true : s.period === period))
            .map((s) => ({
                ...s,
                disabled: s.disabled || busySet.has(s.label),
            }));
    }, [slots, period, busySlots]);

    // cuando cambia el día, resetea slot seleccionado y carga horarios ocupados
    useEffect(() => {
        async function loadBusy() {
            try {
                const y = selectedDate.getFullYear();
                const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
                const d = String(selectedDate.getDate()).padStart(2, "0");
                const fecha = `${y}-${m}-${d}`;

                const resp = await fetch(
                    `${API_BASE}/api/public/agenda/?fecha=${fecha}`,
                );
                if (!resp.ok) {
                    console.error("No se pudo cargar agenda pública");
                    setBusySlots([]);
                    return;
                }
                const data = await resp.json();
                // asumimos que cada cita trae hora_inicio "HH:MM:SS"
                const taken = (data || [])
                    .map((c) => (c.hora_inicio || "").slice(0, 5))
                    .filter(Boolean);
                setBusySlots(taken);
            } catch (e) {
                console.error("Error cargando horarios ocupados:", e);
                setBusySlots([]);
            }
        }

        setSelectedSlot(null);
        loadBusy();
    }, [selectedDate]);

    // POST a backend para registrar cita y luego abrir WhatsApp
    const confirmBooking = async () => {
        if (!selectedService || !selectedSlot || !name || !phone) return;

        setBooking(true);
        setError("");
        setMessage("");

        try {
            const y = selectedDate.getFullYear();
            const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
            const d = String(selectedDate.getDate()).padStart(2, "0");
            const fecha = `${y}-${m}-${d}`;

            const payload = {
                nombre: name,
                telefono: phone,
                servicio_id: selectedService.id,
                fecha,
                hora_inicio: selectedSlot, // "HH:MM"
            };

            const resp = await fetch(`${API_BASE}/api/public/citas/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!resp.ok) {
                const data = await resp.json().catch(() => null);
                console.error("Error al registrar cita pública:", data || resp.status);
                setError(
                    "No se pudo registrar la cita. Intenta de nuevo o escribe por WhatsApp.",
                );
                return;
            }

            setMessage(
                "Tu cita fue registrada correctamente. Te contactaremos para confirmar.",
            );

            // Marcamos ese horario como ocupado en la UI
            setBusySlots((prev) =>
                prev.includes(selectedSlot) ? prev : [...prev, selectedSlot],
            );

            // Opcional: también abrimos WhatsApp con un mensaje bonito
            const text = encodeURIComponent(
                `Hola, soy ${name}. Me gustaría confirmar mi cita de ${selectedService.name} en ${CLINIC.name} para el ${formatDateLong(
                    selectedDate,
                )} a las ${selectedSlot}. Mi WhatsApp es ${phone}.`,
            );
            window.open(`https://wa.me/522711224494?text=${text}`, "_blank");
        } catch (e) {
            console.error("Error creando cita pública:", e);
            setError(
                "Ocurrió un error al registrar la cita. Intenta de nuevo o escribe por WhatsApp.",
            );
        } finally {
            setBooking(false);
        }
    };

    // Resetea slot cuando cambias de periodo
    useEffect(() => {
        setSelectedSlot(null);
    }, [period]);

    return (
        <section id="agenda" className="mx-auto mt-16 max-w-6xl px-4">
            <div className="mb-6 flex items-center gap-3">
                <CalendarDays className="h-6 w-6 text-[#004aad]" />
                <TextAnimate
                    animation="blurInUp"
                    className="mt-4 max-w-2xl  dark:text-white/90 text-2xl font-bold"
                    by="word"
                >
                    Agenda tu cita
                </TextAnimate>
            </div>

            {/* timeline pasos */}
            <div className="mb-4 flex items-center gap-1 text-sm">
                {["Servicio", "Día", "Hora"].map((t, i) => {
                    const active = step === i + 1;
                    const done = step > i + 1;
                    return (
                        <div key={t} className="flex items-center gap-1">
                            <div
                                className={`h-7 w-7 rounded-full grid place-items-center text-neutral-800
                ${active
                                        ? "bg-[#004aad] text-white"
                                        : done
                                            ? "bg-green-600 text-white"
                                            : "bg-slate-300 dark:bg-neutral-700 dark:text-neutral-300"
                                    }`}
                            >
                                {i + 1}
                            </div>
                            <span
                                className={
                                    active
                                        ? "font-semibold"
                                        : "text-neutral-800 dark:text-neutral-200"
                                }
                            >
                                {t}
                            </span>
                            {i < 2 && <div className="mx-2 h-px w-10 bg-slate-200" />}
                        </div>
                    );
                })}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden dark:bg-neutral-800 dark:border-neutral-500 dark:shadow-neutral-700">
                <div className="p-4 sm:p-6">
                    {/* Paso 1 - Servicio */}
                    <AnimatePresence initial={false}>
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                className="grid gap-3 sm:grid-cols-2"
                            >
                                <button
                                    onClick={() => setServiceOpen((v) => !v)}
                                    className="flex items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-4 text-left shadow-sm  dark:bg-neutral-800 dark:border-neutral-500 dark:shadow-neutral-700"
                                >
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-neutral-300">
                                            Seleccionado
                                        </p>
                                        <p className="text-base font-semibold dark:text-neutral-200">
                                            {selectedService
                                                ? `${selectedService.name} · $${selectedService.price} MXN`
                                                : "Selecciona un servicio"}
                                            {selectedService?.tag && (
                                                <span className="ml-1 text-xs" style={{ color: PRIMARY }}>
                                                    {selectedService.tag}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <ChevronDown
                                        className={`h-5 w-5 text-slate-500 dark:text-neutral-200 transition ${serviceOpen ? "rotate-180" : ""
                                            }`}
                                    />
                                </button>

                                <button
                                    onClick={() => setStep(2)}
                                    disabled={!selectedService}
                                    className={`rounded-xl px-4 py-4 font-medium text-white shadow ${selectedService
                                        ? "bg-[#004aad] hover:brightness-110"
                                        : "bg-slate-300 cursor-not-allowed"
                                        }`}
                                >
                                    Continuar
                                </button>

                                {serviceOpen && (
                                    <div className="sm:col-span-2 grid gap-2 rounded-xl border border-slate-200 p-2">
                                        {SERVICES.map((s) => (
                                            <button
                                                key={s.id || s.name}
                                                onClick={() => {
                                                    setSelectedService(s);
                                                    setServiceOpen(false);
                                                }}
                                                className={`flex items-center justify-between rounded-lg px-3 py-3 text-left hover:bg-slate-50 dark:hover:bg-neutral-700
                          ${selectedService?.name === s.name
                                                        ? "ring-1 ring-[--primary]/40 bg-[--primary]/5"
                                                        : ""
                                                    }`}
                                            >
                                                <div>
                                                    <p className="font-bold dark:text-neutral-200">
                                                        {s.name}
                                                    </p>
                                                    <p className="text-sm text-slate-600 dark:text-neutral-300/80">
                                                        {s.description}
                                                    </p>
                                                </div>
                                                <span className="shrink-0 font-semibold">
                                                    ${s.price}
                                                </span>
                                            </button>
                                        ))}
                                        {!SERVICES.length && (
                                            <p className="text-xs text-slate-500 px-1 py-2">
                                                Aún no hay servicios configurados.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Paso 2 - Día */}
                    <AnimatePresence initial={false}>
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                            >
                                <div className="mb-3 flex gap-2">
                                    {["Hoy", "Mañana"].map((k) => (
                                        <button
                                            key={k}
                                            onClick={() => {
                                                if (k === "Hoy") setSelectedDate(days[0]);
                                                else setSelectedDate(days[1]);
                                            }}
                                            className="rounded-full border px-3 py-1.5 text-sm hover:bg-slate-500 dark:hover:bg-neutral-900"
                                        >
                                            {k}
                                        </button>
                                    ))}
                                </div>

                                <div className="relative -mx-2 overflow-x-auto px-2 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                    <div className="flex gap-2">
                                        {days.map((d) => {
                                            const chip = formatDayChip(d);
                                            const active =
                                                d.toDateString() === selectedDate.toDateString();
                                            return (
                                                <motion.button
                                                    whileTap={{ scale: 0.98 }}
                                                    key={d.toDateString()}
                                                    onClick={() => setSelectedDate(d)}
                                                    className={`shrink-0 rounded-2xl border px-4 py-3 text-left ${active
                                                        ? "border-slate-900 bg-slate-900/5 dark:bg-neutral-950 dark:hover:bg-neutral-900"
                                                        : "border-slate-300 bg-white dark:border-neutral-600 hover:bg-slate-50 dark:hover:bg-neutral-700 dark:bg-neutral-800/20"
                                                        }`}
                                                    style={{ minWidth: 82 }}
                                                >
                                                    <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-neutral-200">
                                                        {chip.dow}
                                                    </p>
                                                    <p className="text-xl font-semibold">{chip.day}</p>
                                                    <p className="text-[11px] text-slate-500 dark:text-neutral-200">
                                                        {chip.mon}
                                                    </p>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="mt-4 flex justify-between">
                                    <p className="text-sm text-slate-600 dark:text-neutral-200">
                                        Seleccionado:{" "}
                                        <span className="font-medium">
                                            {formatDateLong(selectedDate)}
                                        </span>
                                    </p>
                                    <button
                                        onClick={() => setStep(3)}
                                        className="rounded-xl bg-[#004aad] px-4 py-2 text-white"
                                    >
                                        Elegir hora
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Paso 3 - Hora */}
                    <AnimatePresence initial={false}>
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                            >
                                <div className="mb-3 flex items-center justify-between text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <Clock3 className="h-5 w-5 dark:text-neutral-300" />
                                        <span className="text-sm dark:text-neutral-200">
                                            Selecciona hora
                                        </span>
                                    </div>
                                    <div className="flex gap-1 rounded-full border p-1">
                                        {["Todo", "Mañana", "Tarde", "Noche"].map((p) => (
                                            <button
                                                key={p}
                                                onClick={() => setPeriod(p)}
                                                className={`rounded-full px-3 py-1 text-sm ${period === p
                                                    ? "bg-slate-900 text-white"
                                                    : "dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-700"
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="relative mb-4 rounded-xl border border-slate-200 p-4">
                                    <div className="h-1 w-full rounded bg-slate-100 dark:bg-neutral-600" />
                                    <div className="mt-4 grid gap-2 sm:[grid-template-columns:repeat(auto-fill,minmax(140px,1fr))]">
                                        {filtered.map((s) => (
                                            <motion.button
                                                whileHover={{ y: -2 }}
                                                whileTap={{ scale: 0.98 }}
                                                key={s.label}
                                                disabled={s.disabled}
                                                onClick={() => setSelectedSlot(s.label)}
                                                className={`rounded-xl border p-3 text-left dark:border-neutral-600 ${s.disabled
                                                    ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 dark:text-neutral-200 line-through"
                                                    : selectedSlot === s.label
                                                        ? "border-slate-900 bg-slate-900/5 dark:bg-neutral-950 dark:hover:bg-neutral-900"
                                                        : "border-slate-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 bg-white hover:bg-slate-50"
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="text-lg font-semibold dark:text-neutral-200">
                                                        {s.label}
                                                    </div>
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${s.period === "Mañana"
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : s.period === "Tarde"
                                                                ? "bg-amber-100 text-amber-700"
                                                                : "bg-indigo-100 text-indigo-700"
                                                            }`}
                                                    >
                                                        {s.period}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-[11px] text-slate-600 dark:text-neutral-200">
                                                    {selectedService?.tag || "Consulta"}
                                                </p>
                                            </motion.button>
                                        ))}
                                        {!filtered.length && (
                                            <p className="text-xs text-slate-500">
                                                No hay horarios disponibles para este día.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* CTA persistente */}
                <div className="sticky bottom-0 z-10 border-t border-slate-200 bg-white/80 dark:bg-neutral-800 dark:border-neutral-500 p-3 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                    <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1 text-sm text-slate-700 dark:text-neutral-200">
                            {selectedSlot && selectedService ? (
                                <>
                                    Reservar <b>{selectedService.name}</b> el{" "}
                                    <b>{formatDateLong(selectedDate)}</b> a las{" "}
                                    <b>{selectedSlot}</b>
                                </>
                            ) : (
                                <>Selecciona un servicio, fecha y hora disponible</>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                            <input
                                type="text"
                                placeholder="Tu nombre"
                                className="rounded-xl border border-slate-300 px-3 py-2 text-xs w-full sm:w-40 bg-white dark:bg-neutral-800 dark:border-neutral-500"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <input
                                type="tel"
                                placeholder="WhatsApp"
                                className="rounded-xl border border-slate-300 px-3 py-2 text-xs w-full sm:w-40 bg-white dark:bg-neutral-800 dark:border-neutral-500"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />

                            <button
                                onClick={confirmBooking}
                                disabled={
                                    !selectedSlot || !selectedService || !name || !phone || booking
                                }
                                className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 font-medium transition ${!selectedSlot || !selectedService || !name || !phone || booking
                                    ? "cursor-not-allowed bg-slate-300 text-slate-600"
                                    : "bg-[#004aad] text-white hover:brightness-110"
                                    }`}
                            >
                                <PhoneCall className="h-4 w-4" />
                                {booking ? "Registrando..." : "Confirmar cita"}
                                <Sparkles className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {message && (
                        <p className="mt-2 text-[11px] text-emerald-700">{message}</p>
                    )}
                    {error && (
                        <p className="mt-2 text-[11px] text-red-600">{error}</p>
                    )}
                </div>
            </div>
        </section>
    );
}
