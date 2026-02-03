// src/components/Equipo.jsx
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeartHandshake, BadgeCheck, Activity, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const TEAM = [
    {
        id: "edgar",
        name: "Lic. Edgar Mauricio Medina Cruz",
        role: "Fisioterapeuta • Neuro–músculo–esquelético",
        photo: "/equipo/edgar.jpg",
        bio:
            "Enfoque basado en evidencia, terapia manual y ejercicio terapéutico. Objetivos claros, progreso medible y acompañamiento cercano.",
        tags: ["Terapia manual", "Ejercicio terapéutico", "Neuromuscular"],
    },
    {
        id: "recepcion",
        name: "Nombre Apellido",
        role: "Recepción • Atención al paciente",
        photo: "/equipo/recepcion.jpg",
        bio:
            "Te apoya con agenda, seguimiento y orientación para que tu visita sea clara y sin fricción.",
        tags: ["Seguimiento", "Atención", "Agenda"],
    },
    {
        id: "fisio2",
        name: "Nombre Apellido",
        role: "Fisioterapeuta",
        photo: "/equipo/fisio2.jpg",
        bio:
            "Rehabilitación funcional y educación al paciente. Planes progresivos enfocados en recuperar movilidad y confianza.",
        tags: ["Rehabilitación", "Funcional", "Educación"],
    },
];

export default function Equipo({ title = "Equipo", subtitle = "Conoce a las personas que te acompañan durante tu proceso." }) {
    const [selected, setSelected] = useState(null);
    const cards = useMemo(() => TEAM, []);

    const dragLeft = -520;

    const highlights = [
        {
            icon: <HeartHandshake className="h-5 w-5 text-[#004aad]" />,
            title: "Trato humano",
            desc: "Acompañamiento cercano y comunicación clara durante todo tu proceso.",
        },
        {
            icon: <BadgeCheck className="h-5 w-5 text-[#004aad]" />,
            title: "Basado en evidencia",
            desc: "Decisiones clínicas con criterios actualizados y enfoque seguro.",
        },
        {
            icon: <Activity className="h-5 w-5 text-[#004aad]" />,
            title: "Progreso medible",
            desc: "Metas, ajustes y seguimiento para que avances de forma consistente.",
        },
    ];

    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-2xl">
                    <h1 className="text-2xl font-semibold text-slate-900">Nuestro equipo</h1>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        Conoce a las personas que trabajan en el consultorio. Nuestro enfoque combina
                        valoración clínica, terapia y seguimiento para ayudarte a recuperar movilidad,
                        reducir dolor y retomar tu actividad diaria con confianza.
                    </p>
                </div>

                <Link
                    to="/agenda"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#004aad] px-6 py-3 text-sm font-semibold text-white shadow hover:brightness-110"
                >
                    Agendar valoración <ArrowRight className="h-4 w-4" />
                </Link>
            </div>

            <div className="mt-8 mb-8">
                <motion.div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg dark:bg-black/30 dark:border-slate-800">
                    <motion.div
                        className="flex gap-4 p-4 cursor-grab active:cursor-grabbing"
                        drag="x"
                        dragConstraints={{ left: dragLeft, right: 0 }}
                    >
                        {cards.map((p) => (
                            <motion.button
                                key={p.id}
                                layoutId={`card-${p.id}`}
                                type="button"
                                onClick={() => setSelected(p)}
                                className="min-w-[280px] sm:min-w-[340px] text-left overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg hover:shadow-md transition-shadow dark:bg-black/40 dark:border-slate-800"
                                whileHover={{ y: -3 }}
                                whileTap={{ scale: 0.985 }}
                            >
                                <div className="relative h-48 w-full">
                                    <img
                                        src={p.photo}
                                        alt={p.name}
                                        className="h-full w-full object-cover"
                                        draggable="false"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
                                    <div className="absolute bottom-3 left-3 right-3">
                                        <p className="text-white font-semibold">{p.name}</p>
                                        <p className="text-white/85 text-xs">{p.role}</p>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <p className="text-sm text-slate-700 dark:text-white/80 line-clamp-2">
                                        {p.bio}
                                    </p>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {(p.tags || []).slice(0, 3).map((t) => (
                                            <span
                                                key={t}
                                                className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-700 ring-1 ring-slate-200 dark:bg-white/10 dark:text-white/80 dark:ring-white/15"
                                            >
                                                {t}
                                            </span>
                                        ))}
                                    </div>

                                    <p className="mt-3 text-xs font-semibold text-[#004aad] dark:text-white">
                                        Ver perfil →
                                    </p>
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Modal expand */}
                <AnimatePresence>
                    {selected && (
                        <motion.div
                            className="fixed inset-0 z-50 bg-black/45 p-4 flex items-center justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelected(null)}
                        >
                            <motion.div
                                layoutId={`card-${selected.id}`}
                                className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-xl border border-slate-200"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="relative h-72 w-full">
                                    <img
                                        src={selected.photo}
                                        alt={selected.name}
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <p className="text-white text-xl font-semibold">{selected.name}</p>
                                        <p className="text-white/90 text-sm">{selected.role}</p>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <p className="text-sm leading-6 text-slate-700">
                                        {selected.bio}
                                    </p>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {(selected.tags || []).map((t) => (
                                            <span
                                                key={t}
                                                className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-700 ring-1 ring-slate-200"
                                            >
                                                {t}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="mt-6 flex justify-end">
                                        <button
                                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                            onClick={() => setSelected(null)}
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-3">
                {highlights.map((h) => (
                    <div
                        key={h.title}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg"
                    >
                        <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#004aad]/10 ring-1 ring-[#004aad]/15">
                                {h.icon}
                            </div>
                            <p className="font-semibold text-slate-900">{h.title}</p>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-700">{h.desc}</p>
                    </div>
                ))}
            </div>


        </section>



    );
}
