// src/components/Agenda.jsx
import { useMemo, useState, useEffect } from "react";
import { CalendarDays, Clock3, PhoneCall } from "lucide-react";
import { nextDays, formatDateLong, formatDayChip, buildSlots } from "@/lib/schedule";
import { TextAnimate } from "@/components/ui/text-animate";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function AgendaV2({ CLINIC, SERVICES = [], PRIMARY = "#004aad" }) {
    const days = useMemo(() => nextDays(14), []);
    const [selectedServiceId, setSelectedServiceId] = useState(SERVICES?.[0]?.id || null);
    const selectedService = useMemo(
        () => SERVICES.find((s) => s.id === selectedServiceId) || SERVICES?.[0] || null,
        [SERVICES, selectedServiceId]
    );

    const [selectedDate, setSelectedDate] = useState(days[0]);
    const [period, setPeriod] = useState("Todo");
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [busySlots, setBusySlots] = useState([]);

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [booking, setBooking] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // Slots base
    const slots = useMemo(() => buildSlots(selectedDate), [selectedDate]);

    // Slots filtrados
    const filtered = useMemo(() => {
        const busySet = new Set(busySlots);
        return slots
            .filter((s) => (period === "Todo" ? true : s.period === period))
            .map((s) => ({ ...s, disabled: s.disabled || busySet.has(s.label) }));
    }, [slots, period, busySlots]);

    // Cargar ocupados al cambiar día
    useEffect(() => {
        async function loadBusy() {
            try {
                const y = selectedDate.getFullYear();
                const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
                const d = String(selectedDate.getDate()).padStart(2, "0");
                const fecha = `${y}-${m}-${d}`;

                const resp = await fetch(`${API_BASE}/api/public/agenda/?fecha=${fecha}`);
                if (!resp.ok) return setBusySlots([]);

                const data = await resp.json();
                const taken = (data || [])
                    .map((c) => (c.hora_inicio || "").slice(0, 5))
                    .filter(Boolean);

                setBusySlots(taken);
            } catch {
                setBusySlots([]);
            }
        }

        setSelectedSlot(null);
        loadBusy();
    }, [selectedDate]);

    // Reset slot al cambiar periodo
    useEffect(() => setSelectedSlot(null), [period]);

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
                hora_inicio: selectedSlot,
            };

            const resp = await fetch(`${API_BASE}/api/public/citas/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!resp.ok) {
                setError("No se pudo registrar la cita. Intenta de nuevo o escribe por WhatsApp.");
                return;
            }

            setMessage("Cita registrada. Te contactaremos para confirmar.");
            setBusySlots((prev) => (prev.includes(selectedSlot) ? prev : [...prev, selectedSlot]));

            const text = encodeURIComponent(
                `Hola, soy ${name}. Quiero confirmar mi cita de ${selectedService.name} en ${CLINIC.name} el ${formatDateLong(
                    selectedDate
                )} a las ${selectedSlot}. Mi WhatsApp es ${phone}.`
            );
            window.open(`https://wa.me/522711224494?text=${text}`, "_blank");
        } catch {
            setError("Ocurrió un error al registrar la cita. Intenta de nuevo o escribe por WhatsApp.");
        } finally {
            setBooking(false);
        }
    };

    return (
        <section id="agenda" className="mx-auto mt-14 max-w-6xl px-4 sm:px-0 sm:flex-row sm:m-10">
            <div className="mb-6 flex items-center gap-3">
                <CalendarDays className="h-6 w-6" style={{ color: PRIMARY }} />
                <TextAnimate animation="blurInUp" className="text-2xl font-bold text-slate-900" by="word">
                    Agendar cita
                </TextAnimate>
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
                <div className="lg:col-span-3">
                    <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-xl sm:max-w-[600px]">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                1) Servicio
                            </p>

                            <div className="mt-2 grid gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="text-sm font-semibold text-slate-800">Selecciona</label>
                                    <select
                                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none focus:ring-2 focus:ring-[#004aad]/25"
                                        value={selectedServiceId || ""}
                                        onChange={(e) => setSelectedServiceId(Number(e.target.value))}
                                    >
                                        {SERVICES.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} · ${s.price}
                                            </option>
                                        ))}
                                    </select>
                                    {!!selectedService?.description && (
                                        <p className="mt-2 text-xs text-slate-600">{selectedService.description}</p>
                                    )}
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-sm font-semibold text-slate-800">Resumen</p>
                                    <p className="mt-1 text-sm text-slate-600">
                                        <b>{selectedService?.name || "—"}</b>
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {selectedService ? `$${selectedService.price} MXN` : ""}
                                    </p>
                                    <p className="mt-3 text-xs text-slate-500">Selecciona fecha y hora para continuar.</p>
                                </div>
                            </div>
                        </div>

                        {/* Día */}
                        <div className="mt-8">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                2) Fecha
                            </p>

                            <div className="mt-3 -mx-2 overflow-x-auto px-2 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                <div className="flex gap-2">
                                    {days.map((d) => {
                                        const chip = formatDayChip(d);
                                        const active = d.toDateString() === selectedDate.toDateString();
                                        return (
                                            <button
                                                key={d.toDateString()}
                                                onClick={() => setSelectedDate(d)}
                                                className={[
                                                    "shrink-0 rounded-2xl border px-4 py-3 text-left",
                                                    active
                                                        ? "border-[#004aad] bg-[#004aad]/5"
                                                        : "border-slate-200 bg-white hover:bg-slate-50",
                                                ].join(" ")}
                                                style={{ minWidth: 86 }}
                                            >
                                                <p className="text-[10px] uppercase tracking-wide text-slate-500">{chip.dow}</p>
                                                <p className="text-xl font-bold text-slate-900">{chip.day}</p>
                                                <p className="text-[11px] text-slate-500">{chip.mon}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <p className="mt-2 text-sm text-slate-600">
                                Seleccionado: <b className="text-slate-900">{formatDateLong(selectedDate)}</b>
                            </p>
                        </div>

                        {/* Hora */}
                        <div className="mt-8">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2">
                                    <Clock3 className="h-5 w-5" style={{ color: PRIMARY }} />
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        3) Hora
                                    </p>
                                </div>

                                {/* ✅ En móvil: scroll horizontal si no cabe */}
                                <div className="flex max-w-full overflow-x-auto rounded-full border border-slate-200 bg-white p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                    <div className="flex gap-1">
                                        {["Todo", "Mañana", "Tarde", "Noche"].map((p) => (
                                            <button
                                                key={p}
                                                onClick={() => setPeriod(p)}
                                                className={[
                                                    "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
                                                    period === p
                                                        ? "bg-[#004aad] text-white"
                                                        : "text-slate-700 hover:bg-slate-50",
                                                ].join(" ")}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 grid gap-2 sm:[grid-template-columns:repeat(auto-fill,minmax(140px,1fr))]">
                                {filtered.map((s) => (
                                    <button
                                        key={s.label}
                                        disabled={s.disabled}
                                        onClick={() => setSelectedSlot(s.label)}
                                        className={[
                                            "rounded-2xl border p-3 text-left transition",
                                            s.disabled
                                                ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 line-through"
                                                : selectedSlot === s.label
                                                    ? "border-[#004aad] bg-[#004aad]/5"
                                                    : "border-slate-200 bg-white hover:bg-slate-50",
                                        ].join(" ")}
                                    >
                                        <div className="text-lg font-bold text-slate-900">{s.label}</div>
                                        <div className="mt-1 text-xs text-slate-500">{s.period}</div>
                                    </button>
                                ))}

                                {!filtered.length && (
                                    <p className="text-sm text-slate-500">No hay horarios disponibles para este día.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Panel derecho (resumen + formulario) */}
                <div className="lg:col-span-2 mt-6 lg:mt-0">
                    {/* ✅ Sticky solo en pantallas grandes */}
                    <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-5 shadow-xl lg:sticky lg:top-6">
                        <p className="text-sm font-bold text-slate-900">Confirmar</p>
                        <p className="mt-1 text-sm text-slate-600">
                            {selectedService ? (
                                <>
                                    <b>{selectedService.name}</b> · {formatDateLong(selectedDate)}
                                    {selectedSlot ? (
                                        <>
                                            {" "}
                                            · <b>{selectedSlot}</b>
                                        </>
                                    ) : null}
                                </>
                            ) : (
                                "Selecciona un servicio"
                            )}
                        </p>

                        <div className="mt-5 grid gap-3">
                            <input
                                type="text"
                                placeholder="Tu nombre"
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#004aad]/25"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <input
                                type="tel"
                                placeholder="WhatsApp"
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#004aad]/25"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />

                            <button
                                onClick={confirmBooking}
                                disabled={!selectedService || !selectedSlot || !name || !phone || booking}
                                className={[
                                    "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition",
                                    !selectedService || !selectedSlot || !name || !phone || booking
                                        ? "bg-slate-300 text-slate-600 shadow-none"
                                        : "bg-[#004aad] shadow-[#004aad]/25 hover:brightness-110",
                                ].join(" ")}
                            >
                                <PhoneCall className="h-4 w-4" />
                                {booking ? "Registrando..." : "Confirmar cita"}
                            </button>

                            {message && <p className="text-xs font-semibold text-emerald-700">{message}</p>}
                            {error && <p className="text-xs font-semibold text-rose-700">{error}</p>}

                            <p className="pt-2 text-[11px] text-slate-500">
                                Al confirmar, registramos la cita y abrimos WhatsApp para confirmar detalles.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
