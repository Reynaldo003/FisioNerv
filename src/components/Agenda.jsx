import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Clock3, ChevronDown, PhoneCall, Sparkles } from "lucide-react";
import { nextDays, formatDateLong, formatDayChip, buildSlots } from "@/lib/schedule";
import { TextAnimate } from "@/components/ui/text-animate"

export default function AgendaV2({ CLINIC, SERVICES, PRIMARY = "#1E63C5" }) {
    const days = useMemo(() => nextDays(14), []);
    const [step, setStep] = useState(1);
    const [serviceOpen, setServiceOpen] = useState(false);
    const [selectedService, setSelectedService] = useState(SERVICES[0]);
    const [selectedDate, setSelectedDate] = useState(days[0]);
    const [period, setPeriod] = useState("Todo");
    const [selectedSlot, setSelectedSlot] = useState(null);

    const slots = useMemo(() => buildSlots(selectedDate), [selectedDate]);
    const filtered = slots.filter(s => period === "Todo" ? true : s.period === period);

    useEffect(() => { setSelectedSlot(null); }, [selectedDate, period]);

    const bookWhatsApp = () => {
        if (!selectedSlot) return;
        const text = encodeURIComponent(
            `Hola, me gustaría agendar ${selectedService?.name} en ${CLINIC.name} para el ${selectedDate.toLocaleDateString()} a las ${selectedSlot}.`
        );
        window.open(`https://wa.me/522711224494?text=${text}`, "_blank");
    };

    return (
        <section id="agenda" className="mx-auto mt-16 max-w-6xl px-4">
            <div className="mb-6 flex items-center gap-3">
                <CalendarDays className="h-6 w-6 text-[#004aad]" />
                <TextAnimate animation="blurInUp" className="mt-4 max-w-2xl  dark:text-white/90 text-2xl font-bold" by="word">
                    Agenda tu cita
                </TextAnimate>
            </div>

            <div className="mb-4 flex items-center gap-1 text-sm">
                {["Servicio", "Día", "Hora"].map((t, i) => {
                    const active = step === i + 1;
                    const done = step > i + 1;
                    return (
                        <div key={t} className="flex items-center gap-1">
                            <div className={`h-7 w-7 rounded-full grid place-items-center text-neutral-800
                ${active ? "bg-[#004aad] text-white" : done ? "bg-green-600" : "bg-slate-300 dark:bg-neutral-700 dark:text-neutral-300"}`}>
                                {i + 1}
                            </div>
                            <span className={active ? "font-semibold" : "text-neutral-800 dark:text-neutral-200"}>{t}</span>
                            {i < 2 && <div className="mx-2 h-px w-10 bg-slate-200" />}
                        </div>
                    );
                })}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden dark:bg-neutral-800 dark:border-neutral-500 dark:shadow-neutral-700">
                <div className="p-4 sm:p-6">
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
                                    onClick={() => setServiceOpen(v => !v)}
                                    className="flex items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-4 text-left shadow-sm  dark:bg-neutral-800 dark:border-neutral-500 dark:shadow-neutral-700"
                                >
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-neutral-300">Seleccionado</p>
                                        <p className="text-base font-semibold dark:text-neutral-200">
                                            {selectedService.name} · ${selectedService.price} MXN
                                            <span className="ml-1 text-xs" style={{ color: PRIMARY }}>{selectedService.tag}</span>
                                        </p>
                                    </div>
                                    <ChevronDown className={`h-5 w-5 text-slate-500 dark:text-neutral-200 transition ${serviceOpen ? "rotate-180" : ""}`} />
                                </button>

                                <button
                                    onClick={() => setStep(2)}
                                    className="rounded-xl bg-[#004aad] px-4 py-4 font-medium text-white shadow hover:brightness-110"
                                >
                                    Continuar
                                </button>

                                {serviceOpen && (
                                    <div className="sm:col-span-2 grid gap-2 rounded-xl border border-slate-200 p-2">
                                        {SERVICES.map(s => (
                                            <button
                                                key={s.name}
                                                onClick={() => { setSelectedService(s); setServiceOpen(false); }}
                                                className={`flex items-center justify-between rounded-lg px-3 py-3 text-left hover:bg-slate-50 dark:hover:bg-neutral-700
                          ${selectedService.name === s.name ? "ring-1 ring-[--primary]/40 bg-[--primary]/5" : ""}`}
                                            >
                                                <div>
                                                    <p className="font-bold dark:text-neutral-200">{s.name}</p>
                                                    <p className="text-sm text-slate-600 dark:text-neutral-300/80">{s.description}</p>
                                                </div>
                                                <span className="shrink-0 font-semibold">${s.price}</span>
                                            </button>
                                        ))}
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
                                    {["Hoy", "Mañana", "Próx. dispo."].map(k => (
                                        <button
                                            key={k}
                                            onClick={() => {
                                                if (k === "Hoy") setSelectedDate(days[0]);
                                                else if (k === "Mañana") setSelectedDate(days[1]);
                                                else {
                                                    const next = slots.find(s => !s.disabled);
                                                    if (next) setSelectedSlot(next.label);
                                                }
                                            }}
                                            className="rounded-full border px-3 py-1.5 text-sm hover:bg-slate-500 dark:hover:bg-neutral-900"
                                        >
                                            {k}
                                        </button>
                                    ))}
                                </div>

                                <div className="relative -mx-2 overflow-x-auto px-2 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                    <div className="flex gap-2">
                                        {days.map(d => {
                                            const chip = formatDayChip(d);
                                            const active = d.toDateString() === selectedDate.toDateString();
                                            return (
                                                <motion.button
                                                    whileTap={{ scale: 0.98 }}
                                                    key={d.toDateString()}
                                                    onClick={() => setSelectedDate(d)}
                                                    className={`shrink-0 rounded-2xl border px-4 py-3 text-left ${active ? "border-slate-900 bg-slate-900/5 dark:bg-neutral-950 dark:hover:bg-neutral-900" : "border-slate-300 bg-white dark:border-neutral-600 hover:bg-slate-50 dark:hover:bg-neutral-700 dark:bg-neutral-800/20"}`}
                                                    style={{ minWidth: 82 }}
                                                >
                                                    <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-neutral-200">{chip.dow}</p>
                                                    <p className="text-xl font-semibold">{chip.day}</p>
                                                    <p className="text-[11px] text-slate-500 dark:text-neutral-200">{chip.mon}</p>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="mt-4 flex justify-between">
                                    <p className="text-sm text-slate-600 dark:text-neutral-200">Seleccionado: <span className="font-medium">{formatDateLong(selectedDate)}</span></p>
                                    <button onClick={() => setStep(3)} className="rounded-xl bg-[#004aad] px-4 py-2 text-white">Elegir hora</button>
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
                                    <div className="flex items-center gap-2"><Clock3 className="h-5 w-5 dark:text-neutral-300" /><span className="text-sm dark:text-neutral-200">Selecciona hora</span></div>
                                    <div className="flex gap-1 rounded-full border p-1">
                                        {["Todo", "Mañana", "Tarde", "Noche"].map(p => (
                                            <button key={p} onClick={() => setPeriod(p)}
                                                className={`rounded-full px-3 py-1 text-sm ${period === p ? "bg-slate-900 text-white" : "dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-700"}`}>
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="relative mb-4 rounded-xl border border-slate-200 p-4">
                                    <div className="h-1 w-full rounded bg-slate-100 dark:bg-neutral-600" />
                                    <div className="mt-4 grid gap-2 sm:[grid-template-columns:repeat(auto-fill,minmax(140px,1fr))]">
                                        {filtered.map(s => (
                                            <motion.button
                                                whileHover={{ y: -2 }}
                                                whileTap={{ scale: 0.98 }}
                                                key={s.label}
                                                disabled={s.disabled}
                                                onClick={() => setSelectedSlot(s.label)}
                                                className={`rounded-xl border p-3 text-left dark:border-neutral-600 ${s.disabled ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 dark:text-neutral-200"
                                                    : selectedSlot === s.label ? "border-slate-900 bg-slate-900/5 dark:bg-neutral-950 dark:hover:bg-neutral-900" : "border-slate-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 bg-white hover:bg-slate-50"}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="text-lg font-semibold dark:text-neutral-200">{s.label}</div>
                                                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${s.period === "Mañana" ? "bg-emerald-100 text-emerald-700" : s.period === "Tarde" ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"}`}>
                                                        {s.period}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-[11px] text-slate-600 dark:text-neutral-200">{selectedService.tag}</p>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* CTA persistente */}
                <div className="sticky bottom-0 z-10 border-t border-slate-200 bg-white/80 dark:bg-neutral-800 dark:border-neutral-500 p-3 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
                        <p className="text-sm text-slate-700 dark:text-neutral-200">
                            {selectedSlot
                                ? <>Reservar <b>{selectedService.name}</b> el <b>{formatDateLong(selectedDate)}</b> a las <b>{selectedSlot}</b></>
                                : <>Selecciona una hora disponible</>}
                        </p>
                        <button
                            onClick={bookWhatsApp}
                            disabled={!selectedSlot}
                            className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 font-medium transition
                ${selectedSlot ? "bg-[#004aad] text-white hover:brightness-110" : "cursor-not-allowed bg-slate-300 text-slate-600"}`}
                        >
                            <PhoneCall className="h-4 w-4" />
                            Confirmar por WhatsApp
                            <Sparkles className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
