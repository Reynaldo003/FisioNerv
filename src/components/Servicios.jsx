// src/components/Servicios.jsx
import { useMemo, useState, useEffect } from "react";
import {
    HandHeart,
    Stethoscope,
    ClipboardList,
    TrendingUp,
    CheckCircle2,
} from "lucide-react";

// ✅ SOLO DEFAULT LOCAL (permitido)
const DEFAULT_SERVICE_IMG = "/servicios/valoracion.png";

function guessSpecialty(serviceName = "") {
    const n = String(serviceName || "").toLowerCase();
    if (n.includes("neuro") || n.includes("neurol")) return "neurologica";
    if (n.includes("deport") || n.includes("rendimiento")) return "deportiva";
    if (n.includes("geri") || n.includes("adulto mayor")) return "geriatrica";
    if (n.includes("pedi") || n.includes("niñ") || n.includes("infan")) return "pediatrica";
    if (n.includes("reuma") || n.includes("artr") || n.includes("fibrom")) return "reumatologica";
    if (n.includes("pulmon") || n.includes("cardiac") || n.includes("cardio")) return "cardiorresp";
    return "ortopedica";
}

function moneyMXN(n) {
    const num = Number(n || 0);
    if (!Number.isFinite(num)) return "—";
    return `MXN $${num.toLocaleString("es-MX")}`;
}

/**
 * ✅ Misma idea que Admin: usar la URL tal cual.
 * Pero aquí soportamos ambos mundos:
 * - si viene normalizado desde useServicios -> s.mediaSrc
 * - si viene crudo del backend -> s.imagen_url / s.imagen
 * - si no viene nada -> DEFAULT_SERVICE_IMG
 */
function pickImg(s) {
    const img =
        (s?.mediaSrc || s?.imagen_url || s?.imagen || "").toString().trim();

    return img || DEFAULT_SERVICE_IMG;
}

export default function ServiciosShowcase({ SERVICES = [], PRIMARY = "#1E63C5" }) {
    const normalized = useMemo(() => {
        return (SERVICES || []).map((s, idx) => {
            const idRaw = s.id ?? idx;
            const id = String(idRaw);

            const name = s.nombre ?? s.name ?? "Servicio";
            const description = s.descripcion ?? s.description ?? "";
            const price = s.precio ?? s.price ?? 0;
            const duration = s.duracion ?? s.duration ?? "";
            const tag = s.tag ?? "";

            const mediaSrc = pickImg(s);

            return {
                id,
                name,
                description,
                price,
                tag,
                duration,
                mediaSrc,
                specialty: s.specialty || guessSpecialty(name),
            };
        });
    }, [SERVICES]);

    return (
        <section className="mx-auto mt-14 max-w-6xl px-4">
            <ServiciosHeader PRIMARY={PRIMARY} />
            <ServiciosVarianteMenu SERVICES={normalized} PRIMARY={PRIMARY} />
        </section>
    );
}

function ServiciosHeader({ PRIMARY }) {
    return (
        <div className="mb-10">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg dark:border-neutral-700 dark:bg-neutral-900/40">
                <div className="flex items-start gap-3">
                    <HandHeart className="mt-1 h-6 w-6" style={{ color: PRIMARY }} />
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Servicios
                        </h2>

                        <p className="mt-4 max-w-4xl text-base leading-6 text-slate-600 dark:text-white/70">
                            En Fisionerv transformamos la evidencia científica en un trato cercano,
                            claro y profundamente humano. Valoramos cada caso con rigor, diseñamos
                            planes de rehabilitación personalizados y acompañamos a nuestros pacientes
                            paso a paso para recuperar movilidad, función y calidad de vida.
                        </p>
                    </div>
                </div>

                <div className="my-6 h-px w-full bg-slate-200/70 dark:bg-white/10" />

                <div className="flex flex-wrap items-center justify-center gap-3">
                    {HIGHLIGHTS.map((item) => (
                        <span
                            key={item}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200
              bg-slate-50 px-4 py-2 text-am font-semibold text-slate-700
              dark:border-neutral-700 dark:bg-white/10 dark:text-white/80"
                        >
                            <CheckCircle2 className="h-4 w-4" style={{ color: PRIMARY }} />
                            {item}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

const HIGHLIGHTS = [
    "Atención personalizada",
    "Resultados clínicos medibles",
    "Fisioterapeutas especializados",
    "Instalaciones de calidad y en actualización",
    "Actualización constante",
];

function ServiciosVarianteMenu({ SERVICES, PRIMARY }) {
    const [selectedId, setSelectedId] = useState(SERVICES[0]?.id ?? null);

    useEffect(() => {
        if (!SERVICES?.length) return;
        const exists = SERVICES.some((s) => String(s.id) === String(selectedId));
        if (!selectedId || !exists) setSelectedId(String(SERVICES[0].id));
    }, [SERVICES, selectedId]);

    const selected = useMemo(() => {
        if (!SERVICES?.length) return null;
        const sid = String(selectedId ?? "");
        return SERVICES.find((s) => String(s.id) === sid) || SERVICES[0];
    }, [selectedId, SERVICES]);

    return (
        <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900/40">
                    <div className="border-b border-slate-200 px-4 py-4 dark:border-neutral-700">
                        <p className="text-lg font-semibold text-slate-900 dark:text-white">
                            Catálogo de servicios
                        </p>
                        <p className="mt-1 text-base text-slate-500 dark:text-white/60">
                            Selecciona un servicio para ver detalles.
                        </p>
                    </div>

                    <div className="max-h-[570px] overflow-auto">
                        {SERVICES.map((s) => {
                            const active = String(s.id) === String(selectedId);
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => setSelectedId(String(s.id))}
                                    className={`w-full border-b px-4 py-3 text-left transition last:border-b-0 ${active
                                        ? "bg-slate-900/5 border-slate-200 dark:border-neutral-700"
                                        : "border-slate-200 hover:bg-slate-50 dark:border-neutral-700 dark:hover:bg-white/5"
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="line-clamp-1 text-base font-semibold text-slate-900 dark:text-white">
                                            {s.name}
                                        </p>
                                        <span className="text-base text-slate-500 dark:text-white/60">
                                            {s.tag || s.duration || "—"}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
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

            <div className="lg:col-span-3">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900/40">
                    <div className="aspect-[16/9] w-full overflow-hidden">
                        <img
                            src={selected?.mediaSrc || DEFAULT_SERVICE_IMG}
                            alt={selected?.name || "Servicio"}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                                e.currentTarget.src = DEFAULT_SERVICE_IMG;
                            }}
                        />
                    </div>

                    <div className="p-5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                                    {selected?.name || "Servicio"}
                                </p>
                                <p className="mt-1 text-base text-slate-600 dark:text-white/70">
                                    {selected?.description ||
                                        "Valoración clínica detallada y plan personalizado según tu condición, objetivos y ritmo de recuperación."}
                                </p>
                            </div>

                            <div className="text-right">
                                <p className="text-base font-semibold text-slate-900 dark:text-white">
                                    {moneyMXN(selected?.price)}
                                </p>
                                <p className="mt-1 text-sm text-slate-500 dark:text-white/60">
                                    {selected?.tag || selected?.duration || "—"}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            <DetailChip
                                icon={<Stethoscope className="h-4 w-4" />}
                                title="Evaluación clínica"
                                desc="Analizamos causa, función y objetivos."
                            />
                            <DetailChip
                                icon={<ClipboardList className="h-4 w-4" />}
                                title="Plan individual"
                                desc="Nada genérico; todo se adapta a ti."
                            />
                            <DetailChip
                                icon={<TrendingUp className="h-4 w-4" />}
                                title="Progreso medible"
                                desc="Metas, ajustes y seguimiento."
                            />
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <a
                                href={`/agenda?servicio=${encodeURIComponent(selected?.name || "")}`}
                                className="inline-flex items-center justify-center rounded-2xl bg-[#004aad] px-6 py-3 text-sm font-semibold text-white shadow hover:brightness-110"
                            >
                                Agendar este servicio
                            </a>
                            <a
                                href="/agenda"
                                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 dark:border-white/15 dark:bg-transparent dark:text-white"
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

function DetailChip({ icon, title, desc }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-neutral-700 dark:bg-black/20">
            <div className="flex items-center gap-2">
                <span className="text-[#004aad]">{icon}</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {title}
                </p>
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-white/70">{desc}</p>
        </div>
    );
}
