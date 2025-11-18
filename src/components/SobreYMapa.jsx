import { useMemo, useState, useEffectEvent } from "react";
import { Clock3, MapPin, PhoneCall, Share2, Star, Navigation, Image as ImageIcon } from "lucide-react";

export default function SobreYMapaPro({ CLINIC, PRIMARY = "#1E63C5" }) {
    const [layer, setLayer] = useState("map"); // "map" | "sat"
    const base = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3774.9017699125598!2d-96.93187472479924!3d18.891438482275454!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85c4e5e4dd92f3b9%3A0xceed1bdcbef792cf!2sFisionerv%20Fisioterapia!5e0!3m2!1ses!2smx!4v1762911811149!5m2!1ses!2smx`;
    const embedMap = `${base}&t=m&output=embed`; // mapa normal
    const embedSat = `https://maps.app.goo.gl/GYmJHJ1vUh2rB4yG9&t=k&output=embed`; // satélite (t=k)
    const mapsLink = `https://maps.app.goo.gl/GYmJHJ1vUh2rB4yG9`;

    const TZ_OFFSET = -6;

    function nowInClinicTZ() {
        const now = new Date();
        const utcMs = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
        return new Date(utcMs + TZ_OFFSET * 60 * 60 * 1000);
    }

    const today = useMemo(() => {
        const d = nowInClinicTZ();
        const keys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
        const labels = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

        const idx = d.getDay();
        return { key: keys[idx], label: labels[idx] };
    }, []);
    const isOpenNow = useMemo(() => {
        if (!CLINIC.hours) return null;
        const key = today.key;
        const slot = CLINIC.hours[key];
        if (!slot || /cerrado/i.test(slot)) return false;
        try {
            const [start, end] = slot.split("–");
            const pad = v => v.toString().padStart(2, "0");
            const toMin = (hhmm) => {
                const [hh, mm] = hhmm.split(":").map(Number);
                return hh * 60 + (mm || 0);
            };
            const now = new Date();
            const nowMin = now.getHours() * 60 + now.getMinutes();
            return nowMin >= toMin(start) && nowMin <= toMin(end);
        } catch { return null; }
    }, [CLINIC.hours, today.key]);

    const copyAddress = async () => {
        try {
            await navigator.clipboard.writeText(`https://maps.app.goo.gl/GYmJHJ1vUh2rB4yG9`);
            alert("Dirección copiada ✅");
        } catch { }
    };

    return (
        <section id="ubicacion" className="mx-auto mt-16 max-w-6xl px-4">
            <div className="grid gap-8 lg:grid-cols-5">
                <div className="lg:col-span-2">
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_300px_at_-10%_-10%,rgba(30,99,197,.08),transparent_60%)]" />
                        <div className="relative p-6">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-2xl font-bold tracking-tight">{CLINIC.name}</h3>
                                    <p className="mt-1 max-w-md text-slate-600">
                                        Consultorio especializado en fisioterapia y rehabilitación con enfoque humano y educación del paciente.
                                    </p>
                                </div>

                                {(CLINIC.rating || CLINIC.reviews) && (
                                    <div className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
                                        <div className="flex items-center gap-1">
                                            <Star className="h-4 w-4" style={{ color: PRIMARY }} />
                                            <span className="font-semibold">{CLINIC.rating?.toFixed?.(1) || "5.0"}</span>
                                            <span className="text-slate-500">({CLINIC.reviews || "100+"})</span>
                                        </div>
                                        <p className="mt-0.5 text-[11px] text-slate-500">Reseñas en Google</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 grid gap-4">
                                <div className="flex items-start gap-3">
                                    <Clock3 className="mt-1 h-5 w-5" style={{ color: PRIMARY }} />
                                    <div>
                                        <p className="font-medium">Horarios</p>
                                        {CLINIC.hours ? (
                                            <div className="mt-1 text-sm text-slate-600">
                                                <p><b>{today.label}:</b> {CLINIC.hours[today.key] || "—"}</p>
                                                <p className="mt-1 text-slate-500">
                                                    {["Lun", "Mar", "Mie", "Jue", "Vie", "Sab"].map((lab, i) => {
                                                        const k = ["mon", "tue", "wed", "thu", "fri", "sat"][i];
                                                        return <span key={k} className="mr-3">{lab}: {CLINIC.hours[k] || "—"}</span>;
                                                    })}
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-600">Lun–Sab · 9:00–18:00</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <MapPin className="mt-1 h-5 w-5" style={{ color: PRIMARY }} />
                                    <div>
                                        <p className="font-medium">Dirección</p>
                                        <p className="text-sm text-slate-600">{CLINIC.address}</p>
                                        <div className="mt-2 flex flex-wrap gap-2 text-sm">
                                            <a
                                                href={mapsLink}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 hover:bg-slate-50"
                                            >
                                                <Navigation className="h-4 w-4" /> Cómo llegar
                                            </a>
                                            <button
                                                onClick={copyAddress}
                                                className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 hover:bg-slate-50"
                                            >
                                                <Share2 className="h-4 w-4" /> Compartir
                                            </button>
                                            {CLINIC.phone && (
                                                <a
                                                    href={`tel:${CLINIC.phone.replace(/\s+/g, "")}`}
                                                    className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 hover:bg-slate-50"
                                                >
                                                    <PhoneCall className="h-4 w-4" /> Llamar
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Amenidades rápidas (ejemplo) */}
                                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                                    {["Acceso para silla de ruedas", "Estacionamiento cercano", "Pago con tarjeta", "Wi-Fi"].map((a) => (
                                        <span key={a} className="rounded-full border px-2 py-1 text-slate-600">{a}</span>
                                    ))}
                                </div>

                                {/* Mini-galería */}
                                {CLINIC.photos?.length > 0 && (
                                    <div className="mt-2">
                                        <p className="mb-2 text-sm font-medium">Dentro del consultorio</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {CLINIC.photos.slice(0, 3).map((src, i) => (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img key={i} src={src} alt="" className="h-28 w-full rounded-xl object-cover" />
                                            ))}
                                        </div>
                                        <div className="mt-2 text-right">
                                            <a href="#galeria" className="inline-flex items-center gap-2 text-sm text-slate-700 hover:underline">
                                                <ImageIcon className="h-4 w-4" /> Ver más fotos
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Barra de estado sticky en bottom del panel */}
                        <div className="border-t border-slate-200 bg-white/90 p-3 backdrop-blur">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${isOpenNow === null ? "bg-slate-100 text-slate-700"
                                        : isOpenNow ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                        }`}>
                                        {isOpenNow === null ? "Horario no disponible" : isOpenNow ? "Abierto ahora" : "Cerrado temporalmente"}
                                    </span>
                                </div>
                                <a
                                    href={mapsLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-xl bg-[#004aad] px-4 py-2 text-sm font-medium text-white shadow hover:brightness-110"
                                >
                                    Abrir en Google Maps
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mapa con capas y overlays */}
                <div className="lg:col-span-3">
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                        {/* Header del mapa */}
                        <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-3">
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                                <MapPin className="h-4 w-4" style={{ color: PRIMARY }} />
                                <span>{CLINIC.address}</span>
                            </div>
                        </div>

                        {/* contenedor del iframe */}
                        <div className="relative aspect-[16/10]">
                            <iframe
                                title="Mapa FisioNerv"
                                loading="lazy"
                                allowFullScreen
                                className="h-full w-full"
                                referrerPolicy="no-referrer-when-downgrade"
                                src={base}
                            />
                            <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-2">
                                <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs text-slate-800 shadow">
                                    <Star className="h-3.5 w-3.5" style={{ color: PRIMARY }} />
                                    {CLINIC.rating?.toFixed?.(1) || "5.0"} · {CLINIC.reviews || "100+"}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs text-slate-800 shadow">
                                    <Clock3 className="h-3.5 w-3.5" style={{ color: PRIMARY }} />
                                    {CLINIC.hours?.[today.key] || "Lun–Sáb 9:00–18:00"}
                                </span>
                            </div>
                            <div className="pointer-events-none absolute bottom-3 right-3 rounded-xl bg-white/90 px-3 py-1.5 text-xs text-slate-800 shadow">
                                Vista {layer === "map" ? "Mapa" : "Satélite"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
