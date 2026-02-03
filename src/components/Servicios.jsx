import { useEffect, useMemo, useState } from "react";
import { HandHeart, Stethoscope, ClipboardList, TrendingUp, CheckCircle2 } from "lucide-react";
import { TextAnimate } from "@/components/ui/text-animate";

const VARIANTE_ACTIVA = "menu";

const INTRO = {
    title: "Servicios",
    subtitle:
        "En Fisionerv transformamos la evidencia científica en un trato cercano y humano. Diseñamos planes personalizados y te acompañamos paso a paso para recuperar movilidad, función y calidad de vida.",
    bullets: [
        "Atención basada en evidencia y razonamiento clínico.",
        "Instalaciones seguras, cómodas y en constante actualización.",
        "Resultados medibles: metas claras y seguimiento continuo.",
    ],
};

const ESPECIALIDADES = [
    {
        id: "ortopedica",
        label: "Ortopédica",
        desc:
            "Lesiones músculo-esqueléticas: esguinces, tendinopatías, dolor articular. Terapia manual + ejercicio terapéutico.",
    },
    {
        id: "neurologica",
        label: "Neurológica",
        desc:
            "EVC, lesión medular, Parkinson, neuropatías. Enfoque en control motor, equilibrio, coordinación e independencia.",
    },
    {
        id: "reumatologica",
        label: "Reumatológica",
        desc:
            "Artritis, artrosis, fibromialgia. Disminuir dolor y rigidez, mejorar movilidad con progresión segura.",
    },
    {
        id: "deportiva",
        label: "Deportiva",
        desc:
            "Retorno seguro al deporte, fuerza, estabilidad, prevención de lesiones. Pruebas funcionales y progresión.",
    },
    {
        id: "pediatrica",
        label: "Pediátrica",
        desc:
            "Alteraciones del desarrollo motor, parálisis cerebral, torcicolis. Estimulación de patrones motores.",
    },
    {
        id: "geriatrica",
        label: "Geriátrica",
        desc:
            "Movilidad, equilibrio, marcha, autonomía y calidad de vida con un enfoque seguro y progresivo.",
    },
    {
        id: "cardiorresp",
        label: "Cardiorresp.",
        desc:
            "Enfoque cardiorrespiratorio para mejorar capacidad funcional y seguridad en la actividad física.",
    },
];

// Inferencia simple por keywords (para poder agrupar aunque tu backend no mande especialidad)
function guessSpecialty(serviceName = "") {
    const n = serviceName.toLowerCase();

    if (n.includes("neuro") || n.includes("neurol")) return "neurologica";
    if (n.includes("deport") || n.includes("rendimiento")) return "deportiva";
    if (n.includes("geri") || n.includes("adulto mayor")) return "geriatrica";
    if (n.includes("pedi") || n.includes("niñ") || n.includes("infan")) return "pediatrica";
    if (n.includes("reuma") || n.includes("artr") || n.includes("fibrom")) return "reumatologica";
    if (n.includes("pulmon") || n.includes("cardiac") || n.includes("cardio")) return "cardiorresp";

    // default (la mayoría cae aquí)
    return "ortopedica";
}

function moneyMXN(n) {
    const num = Number(n || 0);
    if (!Number.isFinite(num)) return "—";
    return `MXN $${num.toLocaleString("es-MX")}`;
}

export default function ServiciosShowcase({ SERVICES = [], PRIMARY = "#1E63C5", variant }) {
    const mode = variant || VARIANTE_ACTIVA;

    // Normalizamos servicios para que todas las variantes puedan consumir lo mismo
    const normalized = useMemo(() => {
        return (SERVICES || []).map((s, idx) => {
            const specialty = s.specialty || guessSpecialty(s.name || s.nombre || "");
            return {
                id: s.id ?? idx,
                name: s.name ?? s.nombre ?? "Servicio",
                description: s.description ?? s.descripcion ?? "",
                price: s.price ?? s.precio ?? 0,
                tag: s.tag ?? "", // en tu caso tag = duración
                duration: s.duration ?? s.duracion ?? "",
                mediaSrc: s.mediaSrc ?? "/rehabilitacion.png",
                specialty,
            };
        });
    }, [SERVICES]);

    return (
        <section className="mx-auto mt-14 max-w-6xl px-4">
            {/* Header informativo (esto rellena y se ve profesional) */}
            <ServiciosHeader PRIMARY={PRIMARY} />

            {/* Render por variante */}
            {mode === "carousel" && <ServiciosVarianteCarousel SERVICES={normalized} PRIMARY={PRIMARY} />}
            {mode === "tabs" && <ServiciosVarianteTabs SERVICES={normalized} PRIMARY={PRIMARY} />}
            {mode === "menu" && <ServiciosVarianteMenu SERVICES={normalized} PRIMARY={PRIMARY} />}
            {mode === "journey" && <ServiciosVarianteJourney SERVICES={normalized} PRIMARY={PRIMARY} />}

            {/* CTA final (sutil, no vacío) */}
            <ServiciosCTA />
        </section>
    );
}

/* -------------------------------------------
   BLOQUES REUSABLES (header + CTA)
------------------------------------------- */

function ServiciosHeader({ PRIMARY }) {
    return (
        <div className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                    <HandHeart className="mt-1 h-6 w-6" style={{ color: PRIMARY }} />
                    <div>
                        <TextAnimate
                            animation="blurInUp"
                            className="dark:text-white/90 text-2xl font-bold"
                            by="word"
                        >
                            {INTRO.title}
                        </TextAnimate>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-white/70">
                            {INTRO.subtitle}
                        </p>
                    </div>
                </div>

                {/* Chips tipo “credenciales” */}
                <div className="flex flex-wrap gap-2">
                    {INTRO.bullets.map((b) => (
                        <span
                            key={b}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs text-slate-700 shadow-sm dark:border-neutral-700 dark:bg-black/30 dark:text-white/80"
                        >
                            <CheckCircle2 className="h-4 w-4" style={{ color: PRIMARY }} />
                            {b}
                        </span>
                    ))}
                </div>
            </div>

            {/* Especialidades mini (para que no se vea vacío arriba) */}
            <div className="mt-6 grid gap-3 md:grid-cols-3">
                {ESPECIALIDADES.slice(0, 3).map((e) => (
                    <div
                        key={e.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/40"
                    >
                        <p className="font-semibold text-slate-900 dark:text-white">{e.label}</p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-white/70 line-clamp-2">
                            {e.desc}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ServiciosCTA() {
    return (
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/40">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        ¿No sabes qué servicio elegir?
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-white/70">
                        Inicia con una valoración. Definimos el plan más adecuado según tu condición y objetivos.
                    </p>
                </div>
                <a
                    href="/agenda"
                    className="inline-flex items-center justify-center rounded-2xl bg-[#004aad] px-6 py-3 text-sm font-semibold text-white shadow hover:brightness-110"
                >
                    Agendar valoración
                </a>
            </div>
        </div>
    );
}

/* -------------------------------------------
   VARIANTE 0 (TU ACTUAL): carousel + featured
------------------------------------------- */

function ServiciosVarianteCarousel({ SERVICES, PRIMARY }) {
    const cats = useMemo(
        () => ["Todas", ...Array.from(new Set(SERVICES.map((s) => s.tag).filter(Boolean)))],
        [SERVICES]
    );

    const [cat, setCat] = useState("Todas");

    const filtered = useMemo(
        () => (cat === "Todas" ? SERVICES : SERVICES.filter((s) => s.tag === cat)),
        [cat, SERVICES]
    );

    const [active, setActive] = useState(filtered[0] || null);

    useEffect(() => {
        if (filtered.length) setActive(filtered[0]);
        else setActive(null);
    }, [cat, filtered]);

    return (
        <div>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600 dark:text-white/70">
                    Filtra por duración y revisa cada tratamiento con su detalle.
                </p>

                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                    {cats.map((c) => (
                        <button
                            key={c}
                            onClick={() => setCat(c)}
                            className={`rounded-full border px-3 py-1.5 text-sm transition ${cat === c
                                ? "bg-slate-900 text-white"
                                : "hover:bg-slate-50 dark:hover:bg-slate-500"
                                }`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
                <FeaturedMedia card={active} color={PRIMARY} />

                <div className="lg:col-span-3">
                    <div className="rounded-2xl border overflow-auto border-slate-200 bg-white p-3 shadow-xl dark:bg-neutral-800 dark:shadow-neutral-800 dark:border-neutral-600">
                        <div
                            className="lg:flex sm:relative gap-3 overflow-x-auto pb-2 snap-x snap-mandatory"
                            style={{ WebkitOverflowScrolling: "touch" }}
                            aria-label="Lista de servicios"
                        >
                            {filtered.map((s) => (
                                <ServiceThumb
                                    key={s.id || s.name}
                                    service={s}
                                    active={active?.name === s.name}
                                    onSelect={() => setActive(s)}
                                />
                            ))}

                            {!filtered.length && (
                                <p className="text-xs text-slate-500 px-2 py-4">
                                    Aún no hay servicios configurados en el sistema.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Bloque extra para rellenar y dar confianza */}
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <MiniKPI title="Atención personalizada" desc="Nada es genérico; todo se adapta a ti." />
                        <MiniKPI title="Resultados medibles" desc="Pruebas y mediciones objetivas para evaluar progreso." />
                        <MiniKPI title="Actualización constante" desc="Técnicas modernas alineadas a mejores prácticas." />
                    </div>
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------
   VARIANTE 1: Tabs por especialidad + grid
------------------------------------------- */

function ServiciosVarianteTabs({ SERVICES, PRIMARY }) {
    const tabs = useMemo(() => [{ id: "todas", label: "Todas" }, ...ESPECIALIDADES], []);
    const [tab, setTab] = useState("todas");

    const filtered = useMemo(() => {
        if (tab === "todas") return SERVICES;
        return SERVICES.filter((s) => s.specialty === tab);
    }, [tab, SERVICES]);

    return (
        <div>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600 dark:text-white/70">
                    Explora por área clínica. Si no estás seguro, inicia con valoración.
                </p>

                <div className="flex flex-wrap gap-2">
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`rounded-full border px-3 py-1.5 text-sm transition ${tab === t.id
                                ? "bg-slate-900 text-white"
                                : "hover:bg-slate-50 dark:hover:bg-slate-500"
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tarjeta informativa de la especialidad seleccionada */}
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/40">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {tab === "todas"
                        ? "Especialidades que atendemos"
                        : ESPECIALIDADES.find((e) => e.id === tab)?.label}
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-white/70">
                    {tab === "todas"
                        ? "Ortopédica, neurológica, reumatológica, deportiva, pediátrica, geriátrica y enfoque cardiorrespiratorio."
                        : ESPECIALIDADES.find((e) => e.id === tab)?.desc}
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((s) => (
                    <div
                        key={s.id}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900/40"
                    >
                        <div className="aspect-[16/10] w-full overflow-hidden">
                            <img src={s.mediaSrc} alt={s.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="p-4">
                            <div className="flex items-center justify-between gap-3">
                                <p className="font-semibold text-slate-900 dark:text-white">{s.name}</p>
                                <span className="rounded-full border px-2 py-0.5 text-xs text-slate-700 border-slate-200 dark:border-white/15 dark:text-white/80">
                                    {s.tag || s.duration || "—"}
                                </span>
                            </div>

                            <p className="mt-1 text-sm text-slate-600 dark:text-white/70 line-clamp-2">
                                {s.description || "Plan personalizado con enfoque en función, dolor y progresión medible."}
                            </p>

                            <div className="mt-3 flex items-center justify-between">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                    {moneyMXN(s.price)}
                                </p>

                                <a
                                    href={`/agenda?servicio=${encodeURIComponent(s.name)}`}
                                    className="text-sm font-semibold text-[#004aad] hover:underline"
                                >
                                    Agendar →
                                </a>
                            </div>
                        </div>
                    </div>
                ))}

                {!filtered.length && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-white/70">
                        No hay servicios asignados a esta especialidad (por ahora).
                    </div>
                )}
            </div>
        </div>
    );
}

/* -------------------------------------------
   VARIANTE 2: Menú (lista) + panel detalle
------------------------------------------- */

function ServiciosVarianteMenu({ SERVICES, PRIMARY }) {
    const [selectedId, setSelectedId] = useState(SERVICES[0]?.id ?? null);
    const selected = useMemo(() => SERVICES.find((s) => s.id === selectedId) || SERVICES[0], [selectedId, SERVICES]);

    const specialtyInfo = useMemo(() => {
        const id = selected?.specialty || "ortopedica";
        return ESPECIALIDADES.find((e) => e.id === id);
    }, [selected]);

    return (
        <div className="grid gap-6 lg:grid-cols-5">
            {/* Lista izquierda */}
            <div className="lg:col-span-2">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900/40">
                    <div className="border-b border-slate-200 px-4 py-3 dark:border-neutral-700">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            Catálogo de servicios
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-white/60">
                            Selecciona un servicio para ver detalles.
                        </p>
                    </div>

                    <div className="max-h-[520px] overflow-auto">
                        {SERVICES.map((s) => {
                            const active = s.id === selectedId;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => setSelectedId(s.id)}
                                    className={`w-full text-left px-4 py-3 border-b last:border-b-0 transition ${active
                                        ? "bg-slate-900/5 border-slate-200 dark:border-neutral-700"
                                        : "hover:bg-slate-50 border-slate-200 dark:hover:bg-white/5 dark:border-neutral-700"
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                                            {s.name}
                                        </p>
                                        <span className="text-xs text-slate-500 dark:text-white/60">
                                            {s.tag || s.duration || "—"}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-600 dark:text-white/70 line-clamp-1">
                                        {s.description || "Tratamiento con enfoque personalizado y seguimiento."}
                                    </p>
                                    <p className="mt-2 text-xs font-semibold text-slate-900 dark:text-white">
                                        {moneyMXN(s.price)}
                                    </p>
                                </button>
                            );
                        })}

                        {!SERVICES.length && (
                            <div className="p-4 text-sm text-slate-600 dark:text-white/70">
                                Aún no hay servicios configurados.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Panel detalle derecha */}
            <div className="lg:col-span-3">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900/40">
                    <div className="aspect-[16/9] w-full overflow-hidden">
                        <img
                            src={selected?.mediaSrc || "/rehabilitacion.png"}
                            alt={selected?.name || "Servicio"}
                            className="h-full w-full object-cover"
                        />
                    </div>

                    <div className="p-5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                                    {selected?.name || "Servicio"}
                                </p>
                                <p className="mt-1 text-sm text-slate-600 dark:text-white/70">
                                    {selected?.description ||
                                        "Valoración clínica detallada y plan personalizado según tu condición, objetivos y ritmo de recuperación."}
                                </p>
                            </div>

                            <div className="text-right">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                    {moneyMXN(selected?.price)}
                                </p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-white/60">
                                    {selected?.tag || selected?.duration || "—"}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            <DetailChip icon={<Stethoscope className="h-4 w-4" />} title="Evaluación clínica" desc="Analizamos causa, función y objetivos." />
                            <DetailChip icon={<ClipboardList className="h-4 w-4" />} title="Plan individual" desc="Nada genérico; todo se adapta a ti." />
                            <DetailChip icon={<TrendingUp className="h-4 w-4" />} title="Progreso medible" desc="Metas, ajustes y seguimiento." />
                        </div>

                        {specialtyInfo && (
                            <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                    Especialidad: {specialtyInfo.label}
                                </p>
                                <p className="mt-1 text-sm text-slate-600 dark:text-white/70">
                                    {specialtyInfo.desc}
                                </p>
                            </div>
                        )}

                        <div className="mt-6 flex flex-wrap gap-3">
                            <a
                                href={`/agenda?servicio=${encodeURIComponent(selected?.name || "")}`}
                                className="inline-flex items-center justify-center rounded-2xl bg-[#004aad] px-6 py-3 text-sm font-semibold text-white shadow hover:brightness-110"
                            >
                                Agendar este servicio
                            </a>
                            <a
                                href="/agenda"
                                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 dark:bg-transparent dark:text-white dark:border-white/15"
                            >
                                Agendar valoración
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------
   VARIANTE 3: Ruta del paciente (pasos)
------------------------------------------- */

function ServiciosVarianteJourney({ SERVICES, PRIMARY }) {
    // Destacados (primeros 6)
    const featured = useMemo(() => SERVICES.slice(0, 6), [SERVICES]);

    return (
        <div>
            {/* Timeline / pasos */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/40">
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    Tu progreso, paso a paso
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-white/70">
                    Iniciamos con una valoración completa, definimos el plan y damos seguimiento con objetivos claros y medibles.
                </p>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <JourneyStep
                        icon={<Stethoscope className="h-5 w-5" style={{ color: PRIMARY }} />}
                        title="1) Valoración"
                        desc="Analizamos antecedentes, síntomas, pruebas físicas y objetivos."
                    />
                    <JourneyStep
                        icon={<ClipboardList className="h-5 w-5" style={{ color: PRIMARY }} />}
                        title="2) Plan individual"
                        desc="Programa estructurado con ejercicios, terapias y estrategias específicas."
                    />
                    <JourneyStep
                        icon={<TrendingUp className="h-5 w-5" style={{ color: PRIMARY }} />}
                        title="3) Seguimiento"
                        desc="Medimos progreso y ajustamos para mejorar movilidad, dolor y funcionalidad."
                    />
                </div>
            </div>

            {/* Destacados */}
            <div className="mt-6">
                <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Servicios destacados</p>
                    <a href="/agenda" className="text-sm font-semibold text-[#004aad] hover:underline">
                        Agendar →
                    </a>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {featured.map((s) => (
                        <div
                            key={s.id}
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900/40"
                        >
                            <div className="aspect-[16/10] w-full overflow-hidden">
                                <img src={s.mediaSrc} alt={s.name} className="h-full w-full object-cover" />
                            </div>
                            <div className="p-4">
                                <p className="text-xs text-slate-500 dark:text-white/60">
                                    {s.tag || s.duration || "—"}
                                </p>
                                <p className="mt-1 font-semibold text-slate-900 dark:text-white">{s.name}</p>
                                <p className="mt-1 text-sm text-slate-600 dark:text-white/70 line-clamp-2">
                                    {s.description || "Tratamiento con enfoque en función, dolor y progresión."}
                                </p>

                                <div className="mt-3 flex items-center justify-between">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                        {moneyMXN(s.price)}
                                    </p>
                                    <a
                                        href={`/agenda?servicio=${encodeURIComponent(s.name)}`}
                                        className="text-sm font-semibold text-[#004aad] hover:underline"
                                    >
                                        Agendar
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}

                    {!featured.length && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-white/70">
                            Aún no hay servicios configurados para mostrar.
                        </div>
                    )}
                </div>
            </div>

            {/* Especialidades completas (para llenar y dar valor) */}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/40">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Especialidades que ofrecemos
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {ESPECIALIDADES.map((e) => (
                        <div key={e.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-neutral-700 dark:bg-black/20">
                            <p className="font-semibold text-slate-900 dark:text-white">{e.label}</p>
                            <p className="mt-1 text-sm text-slate-600 dark:text-white/70">{e.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------
   COMPONENTES INTERNOS
------------------------------------------- */

function FeaturedMedia({ card }) {
    if (!card) {
        return (
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl lg:col-span-2 dark:bg-neutral-800 dark:shadow-neutral-800 dark:border-neutral-600">
                <div className="aspect-[4/3] sm:aspect-[5/4]" />
            </div>
        );
    }
    return (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white dark:bg-neutral-800 shadow-xl lg:col-span-2 dark:shadow-neutral-800 dark:border-neutral-600">
            <div className="relative">
                <div className="aspect-[4/3] sm:aspect-[5/4]">
                    <img src={card.mediaSrc} alt={card.name} className="h-full w-full object-cover" />
                </div>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-white/95 via-white/60 to-transparent dark:from-neutral-900 dark:via-neutral-800 p-4 sm:p-5">
                <span className="rounded-full border px-2 py-0.5 text-xs dark:border-white/15 border-neutral-900 text-neutral-900 dark:text-neutral-200">
                    {card.tag || card.duration || "—"}
                </span>
                <h4 className="mt-2 text-lg font-semibold sm:text-xl text-slate-900 dark:text-white">
                    {card.name}
                </h4>
                <p className="mt-1 text-sm text-slate-700 dark:text-white/80 line-clamp-2">
                    {card.description || "Plan personalizado según tu condición y objetivos."}
                </p>
                <p className="mt-1 text-sm text-slate-900 dark:text-white">
                    {card.tag || card.duration || "—"} · {moneyMXN(card.price)}
                </p>
            </div>
        </div>
    );
}

function ServiceThumb({ service, active, onSelect }) {
    return (
        <button
            onClick={onSelect}
            className={`group relative shrink-0 snap-center overflow-hidden rounded-xl border text-left transition m-2 
        ${active
                    ? "border-slate-900 bg-slate-900/5"
                    : "border-slate-200 bg-white hover:bg-slate-50 shadow-sm dark:bg-neutral-800 dark:border-neutral-500"
                }`}
            aria-pressed={active}
            style={{ width: "78vw", maxWidth: 320 }}
        >
            <div className="relative overflow-hidden">
                <div className="aspect-[5/4] w-full">
                    <img src={service.mediaSrc} alt="" className="h-full w-full object-cover" />
                </div>
            </div>

            <div className="p-3">
                <p className="text-[12px] uppercase tracking-wide text-slate-500 dark:text-neutral-200">
                    {service.tag || service.duration || "—"}
                </p>
                <h5 className="mt-0.5 line-clamp-1 font-semibold">{service.name}</h5>
            </div>

            <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100 bg-[radial-gradient(500px_180px_at_0%_0%,rgba(30,99,197,.10),transparent_60%)]" />
        </button>
    );
}

function MiniKPI({ title, desc }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/40">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-white/70">{desc}</p>
        </div>
    );
}

function DetailChip({ icon, title, desc }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-neutral-700 dark:bg-black/20">
            <div className="flex items-center gap-2">
                <span className="text-[#004aad]">{icon}</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-white/70">{desc}</p>
        </div>
    );
}

function JourneyStep({ icon, title, desc }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-neutral-700 dark:bg-black/20">
            <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10">
                    {icon}
                </div>
                <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-white/70">{desc}</p>
        </div>
    );
}
