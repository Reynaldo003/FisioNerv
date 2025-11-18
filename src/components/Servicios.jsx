import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Clock3, Play } from "lucide-react";

export default function ServiciosShowcase({ SERVICES = [], PRIMARY = "#1E63C5" }) {
    const cats = useMemo(() => ["Todas", ...Array.from(new Set(SERVICES.map(s => s.tag)))], [SERVICES]);
    const [cat, setCat] = useState("Todas");
    const filtered = useMemo(() => (cat === "Todas" ? SERVICES : SERVICES.filter(s => s.tag === cat)), [cat, SERVICES]);
    const [active, setActive] = useState(filtered[0] || null);

    useEffect(() => {
        if (filtered.length) setActive(filtered[0]);
    }, [cat, filtered]);

    return (
        <section id="servicios" className="mx-auto mt-16 max-w-6xl px-4">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded bg-[--primary]/10" />
                    <h3 className="text-2xl font-bold">Servicios</h3>
                </div>
                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                    {cats.map((c) => (
                        <button
                            key={c}
                            onClick={() => setCat(c)}
                            className={`rounded-full border px-3 py-1.5 text-sm transition ${cat === c ? "bg-slate-900 text-white" : "hover:bg-slate-50"
                                }`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-5 ">
                <FeaturedMedia card={active} color={PRIMARY} />

                <div className="lg:col-span-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                        <div
                            className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory"
                            style={{ WebkitOverflowScrolling: "touch" }}
                            aria-label="Lista de servicios"
                        >
                            {filtered.map((s) => (
                                <ServiceThumb
                                    key={s.name}
                                    service={s}
                                    active={active?.name === s.name}
                                    onSelect={() => setActive(s)}
                                    color={PRIMARY}
                                />
                            ))}
                        </div>
                    </div>

                    {active && (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-[--primary]">{active.tag}</p>
                                    <h4 className="text-lg font-semibold sm:text-xl">{active.name}</h4>
                                    <p className="mt-1 text-sm text-slate-600 sm:text-base">{active.description}</p>
                                </div>
                                <div className="shrink-0 w-full sm:w-auto">
                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1">
                                            <Clock3 className="h-4 w-4" style={{ color: PRIMARY }} />
                                            {active.duration || "45–60 min"}
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1">
                                            MXN ${active.price}
                                        </span>
                                    </div>
                                    <a
                                        href="#agenda"
                                        className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow hover:brightness-110 sm:mt-2"
                                    >
                                        <CalendarDays className="mr-2 h-4 w-4" />
                                        Agendar
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

function FeaturedMedia({ card, color }) {
    if (!card) {
        return (
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:w-[200px] lg:col-span-2">
                <div className="aspect-[4/3] sm:aspect-[16/10]" />
            </div>
        );
    }
    return (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl lg:col-span-2">
            <div className="absolute inset-0 bg-[radial-gradient(1000px_400px_at_10%_-10%,rgba(30,99,197,.08),transparent_60%)]" />
            <div className="relative">
                <div className="aspect-[4/3] sm:aspect-[5/4]">
                    {card.mediaType === "video" ? (
                        <VideoSmart src={card.mediaSrc} poster={card.poster} />
                    ) : (
                        <img src={card.mediaSrc} alt={card.name} className="h-full w-full object-cover" />
                    )}
                </div>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end bg-gradient-to-t from-white/95 via-white/60 to-transparent p-4 sm:p-5">
                <div className="max-w-full">
                    <span className="rounded-full border px-2 py-0.5 text-xs" style={{ borderColor: color }}>
                        {card.tag}
                    </span>
                    <h4 className="mt-2 text-lg font-semibold sm:text-xl">{card.name}</h4>
                    <p className="hidden text-sm text-slate-600 sm:block">{card.description}</p>
                    <p className="text-sm text-slate-600">{card.duration || "45–60 min"} · MXN ${card.price}</p>
                </div>
            </div>
        </div>
    );
}

function ServiceThumb({ service, active, onSelect, color }) {
    return (
        <button
            onClick={onSelect}
            className={`group relative shrink-0 snap-center overflow-hidden rounded-xl border text-left transition
        ${active ? "border-slate-900 bg-slate-900/5" : "border-slate-200 bg-white hover:bg-slate-50 shadow-sm"}`}
            aria-pressed={active}
            style={{ width: "78vw", maxWidth: 320 }}
        >
            <div className="relative overflow-hidden">
                <div className="aspect-[5/4] w-full">
                    {service.mediaType === "video" ? (
                        <VideoHover src={service.mediaSrc} poster={service.poster} />
                    ) : (
                        <img src={service.mediaSrc} alt="" className="h-full w-full object-cover" />
                    )}
                </div>
                {service.mediaType === "video" && (
                    <div className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white backdrop-blur">
                        <Play className="h-3 w-3" />
                    </div>
                )}
            </div>

            <div className="p-3">
                <p className="text-[12px] uppercase tracking-wide text-slate-500">{service.tag}</p>
                <h5 className="mt-0.5 line-clamp-1 font-semibold">{service.name}</h5>
                <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
                        <Clock3 className="h-3.5 w-3.5" style={{ color }} />
                        {service.duration || "45–60 min"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
                        ${service.price}
                    </span>
                </div>
            </div>

            <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100 bg-[radial-gradient(500px_180px_at_0%_0%,rgba(30,99,197,.10),transparent_60%)]" />
        </button>
    );
}

function VideoHover({ src, poster }) {
    const ref = useRef(null);
    return (
        <video
            ref={ref}
            src={src}
            poster={poster}
            muted
            playsInline
            preload="metadata"
            onMouseEnter={() => ref.current?.play()}
            onMouseLeave={() => ref.current?.pause()}
            className="h-full w-full object-cover"
        />
    );
}

function VideoSmart({ src, poster }) {
    const ref = useRef(null);
    const [canPlay, setCanPlay] = useState(true);
    return (
        <video
            ref={ref}
            src={src}
            poster={poster}
            muted
            playsInline
            loop
            autoPlay
            onError={() => setCanPlay(false)}
            className="h-full w-full object-cover"
            style={{ display: canPlay ? "block" : "none" }}
        />
    );
}
