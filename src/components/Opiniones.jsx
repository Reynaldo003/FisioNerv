// src/components/Opiniones.jsx
import { useEffect, useState } from "react";
import { Quote, Star, CheckCircle2 } from "lucide-react";
import { TextAnimate } from "@/components/ui/text-animate";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const CLINIC_ID = 1; // id_clinica que corresponde a Fisionerv

export default function Opiniones() {
    const [opiniones, setOpiniones] = useState([]);
    const [name, setName] = useState("");
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [status, setStatus] = useState(null); // "success" | "error" | null

    // Cargar comentarios aprobados
    useEffect(() => {
        async function loadOpiniones() {
            try {
                const resp = await fetch(
                    `${API_BASE}/api/comentarios/public_list/`
                );
                if (!resp.ok) throw new Error("Error al cargar opiniones");
                const data = await resp.json();
                // data: [{id, nombre_completo, calificacion, descripcion}]
                setOpiniones(
                    data.map((item) => ({
                        name: item.nombre_completo,
                        rating: item.calificacion,
                        quote: item.descripcion,
                    }))
                );
            } catch (err) {
                console.error(err);
            }
        }
        loadOpiniones();
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!name.trim() || !comment.trim() || rating === 0) return;

        try {
            const resp = await fetch(`${API_BASE}/api/comentarios/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    clinica: CLINIC_ID,
                    nombre_completo: name,
                    calificacion: rating,
                    descripcion: comment,
                }),
            });

            if (!resp.ok) {
                setStatus("error");
                return;
            }

            setStatus("success");
            setName("");
            setRating(0);
            setComment("");

            setTimeout(() => setStatus(null), 4000);
        } catch (err) {
            console.error(err);
            setStatus("error");
        }
    }

    return (
        <section id="opiniones" className="mx-auto mt-16 max-w-6xl px-4">
            {/* Título */}
            <div className="mb-6 flex items-center gap-3">
                <Quote className="h-6 w-6 text-[#004aad]" />
                <TextAnimate
                    animation="blurInUp"
                    className="mt-4 max-w-2xl text-2xl font-bold dark:text-white/90"
                    by="word"
                >
                    Opiniones
                </TextAnimate>
            </div>

            {/* Opiniones actuales */}
            <div className="grid gap-6 md:grid-cols-3 mb-10">
                {opiniones.map((t) => (
                    <figure
                        key={`${t.name}-${t.quote.slice(0, 10)}`}
                        className="rounded-2xl border border-slate-300 bg-white p-6 shadow-lg dark:bg-neutral-800 dark:border-neutral-600 dark:shadow-neutral-700"
                    >
                        <div className="mb-2 flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, idx) => (
                                <Star
                                    key={idx}
                                    className="h-4 w-4 text-amber-400"
                                    fill={idx < t.rating ? "currentColor" : "none"}
                                />
                            ))}
                        </div>
                        <blockquote className="text-slate-700 dark:text-neutral-200">
                            “{t.quote}”
                        </blockquote>
                        <figcaption className="mt-3 text-sm text-slate-500 dark:text-neutral-200">
                            — {t.name}
                        </figcaption>
                    </figure>
                ))}
                {opiniones.length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-neutral-300">
                        Aún no hay opiniones aprobadas para mostrar.
                    </p>
                )}
            </div>

            {/* Formulario para nuevo comentario */}
            <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-neutral-700 dark:bg-neutral-900 shadow-2xl/30 dark:shadow-neutral-100"
            >
                <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Deja tu opinión sobre FisioNerv
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-neutral-300">
                            Tu comentario será enviado a revisión antes de publicarse.
                        </p>
                    </div>

                    {/* Mensajes */}
                    {status === "success" && (
                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 ring-1 ring-emerald-400/60 animate-[fadeIn_0.3s_ease-out]">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Gracias por tu comentario, enviado a revisión</span>
                        </div>
                    )}
                    {status === "error" && (
                        <div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-600 ring-1 ring-red-400/60 animate-[fadeIn_0.3s_ease-out]">
                            <span>Ocurrió un error al enviar tu comentario</span>
                        </div>
                    )}
                </div>

                <div className="mb-4">
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-neutral-200">
                        Nombre completo
                    </label>
                    <input
                        type="text"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#004aad] focus:ring-1 focus:ring-[#004aad] dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                        placeholder="Ej. María Gómez"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div className="mb-4">
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-neutral-200">
                        Calificación
                    </label>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, idx) => {
                            const starValue = idx + 1;
                            const active = starValue <= rating;
                            return (
                                <button
                                    key={starValue}
                                    type="button"
                                    onClick={() => setRating(starValue)}
                                    className="p-1 transition-transform hover:scale-110"
                                >
                                    <Star
                                        className="h-6 w-6"
                                        fill={active ? "#fbbf24" : "transparent"}
                                        stroke="#fbbf24"
                                    />
                                </button>
                            );
                        })}
                        {rating > 0 && (
                            <span className="ml-2 text-xs text-slate-500 dark:text-neutral-300">
                                {rating} / 5
                            </span>
                        )}
                    </div>
                </div>

                <div className="mb-5">
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-neutral-200">
                        Comentario
                    </label>
                    <textarea
                        rows={4}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#004aad] focus:ring-1 focus:ring-[#004aad] dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                        placeholder="Cuéntanos cómo fue tu experiencia en FisioNerv..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                </div>

                <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-lg bg-[#004aad] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!name.trim() || !comment.trim() || rating === 0}
                >
                    Enviar comentario
                </button>
            </form>
        </section>
    );
}
