import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Clock3, Play, HandHeart } from "lucide-react";
import { TextAnimate } from "@/components/ui/text-animate"

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
                    <HandHeart className="h-6 w-6 text-[#004aad]" />
                    <TextAnimate animation="blurInUp" className="mt-4 max-w-2xl  dark:text-white/90 text-2xl font-bold" by="word">
                        Servicios
                    </TextAnimate>
                </div>
                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                    {cats.map((c) => (
                        <button
                            key={c}
                            onClick={() => setCat(c)}
                            className={`rounded-full border px-3 py-1.5 text-sm transition ${cat === c ? "bg-slate-900 text-white" : "hover:bg-slate-50 dark:hover:bg-slate-500"
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
                    <div className="rounded-2xl border overflow-auto border-slate-200 bg-white p-3 shadow-xl dark:bg-neutral-800 dark:shadow-neutral-800 dark:border-neutral-600">
                        <div
                            className="lg:flex sm:relative gap-3 overflow-x-auto pb-2snap-x snap-mandatory"
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
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white dark:bg-neutral-800 shadow-xl lg:col-span-2 dark:shadow-neutral-800 dark:border-neutral-600">
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
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end bg-gradient-to-t from-white/95 via-white/60 to-transparent dark:bg-gradient-to-t dark:from-neutral-900 dark:via-neutral-800 to-transparent p-4 sm:p-5">
                <div className="max-w-full">
                    <span className="rounded-full border px-2 py-0.5 text-xs dark:border-white border-neutral-900 text-neutral-900 dark:text-neutral-200" >
                        {card.tag}
                    </span>
                    <h4 className="mt-2 text-lg font-semibold sm:text-xl">{card.name}</h4>
                    <p className="hidden text-sm text-neutral-900 sm:block dark:text-neutral-200">{card.description}</p>
                    <p className="text-sm text-neutral-900 dark:text-neutral-200">{card.duration || "45–60 min"} · MXN ${card.price}</p>
                </div>
            </div>
        </div>
    );
}

function ServiceThumb({ service, active, onSelect, color }) {
    return (
        <button
            onClick={onSelect}
            className={`group relative shrink-0 snap-center overflow-hidden rounded-xl border text-left transition m-2 
        ${active ? "border-slate-900 bg-slate-900/5" : "border-slate-200 bg-white hover:bg-slate-50 shadow-sm dark:bg-neutral-800 dark:border-neutral-500 "}`}
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
                <p className="text-[12px] uppercase tracking-wide text-slate-500 dark:text-neutral-200">{service.tag}</p>
                <h5 className="mt-0.5 line-clamp-1 font-semibold">{service.name}</h5>
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
