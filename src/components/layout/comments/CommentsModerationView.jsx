// src/components/layout/comments/CommentsModerationView.jsx
import { useEffect, useMemo, useState } from "react";
import { Star, Check, X, MessageSquareText } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export function CommentsModerationView() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const pendingCount = useMemo(() => items.length, [items]);

    const forceLogout = () => {
        localStorage.removeItem("auth.access");
        localStorage.removeItem("auth.refresh");
        localStorage.removeItem("auth.user");
        window.location.href = "/login";
    };

    async function loadPending() {
        const token = localStorage.getItem("auth.access");
        if (!token) return forceLogout();

        try {
            setLoading(true);
            const resp = await fetch(`${API_BASE}/api/comentarios/pending/`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (resp.status === 401) return forceLogout();
            if (!resp.ok) throw new Error("No se pudieron cargar pendientes");

            const data = await resp.json();
            // data esperado: [{id, nombre_completo, calificacion, descripcion, created_at}]
            setItems(data);
        } catch (e) {
            console.error(e);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadPending();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function moderate(id, estado) {
        const token = localStorage.getItem("auth.access");
        if (!token) return forceLogout();

        // optimista
        const prev = items;
        setItems((p) => p.filter((x) => x.id !== id));

        try {
            const resp = await fetch(`${API_BASE}/api/comentarios/${id}/moderate/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ estado }),
            });


            if (resp.status === 401) return forceLogout();

            if (!resp.ok) {
                // rollback
                setItems(prev);
                alert("No se pudo moderar el comentario. Revisa consola.");
                const err = await resp.json().catch(() => null);
                console.error("Moderation error:", err || resp.status);
            }
        } catch (e) {
            setItems(prev);
            alert("Error de red moderando comentario.");
            console.error(e);
        }
    }

    return (
        <section className="flex-1 overflow-auto">
            <div className="p-6">
                <div className="mb-5 flex items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="h-9 w-9 rounded-xl bg-violet-600/10 text-violet-700 flex items-center justify-center ring-1 ring-violet-600/15">
                                <MessageSquareText className="h-5 w-5" />
                            </div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Moderación de comentarios
                            </h2>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                            Comentarios pendientes de aprobación.
                        </p>
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 ring-1 ring-slate-200">
                        Pendientes: <b>{pendingCount}</b>
                    </span>
                </div>

                {loading ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
                        Cargando comentarios...
                    </div>
                ) : items.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                        <p className="text-sm font-medium text-slate-800">
                            No hay comentarios pendientes 🎉
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {items.map((it) => (
                            <article
                                key={it.id}
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {it.nombre_completo}
                                        </p>

                                        <div className="mt-1 flex items-center gap-1">
                                            {Array.from({ length: 5 }).map((_, idx) => {
                                                const filled = idx < Number(it.calificacion || 0);
                                                return (
                                                    <Star
                                                        key={idx}
                                                        className="h-4 w-4 text-amber-400"
                                                        fill={filled ? "currentColor" : "none"}
                                                    />
                                                );
                                            })}
                                            <span className="ml-2 text-xs text-slate-500">
                                                {Number(it.calificacion || 0)} / 5
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => moderate(it.id, "aprobado")}
                                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:brightness-110"
                                        >
                                            <Check className="h-4 w-4" />
                                            Aceptar
                                        </button>

                                        <button
                                            onClick={() => moderate(it.id, "rechazado")}
                                            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:brightness-110"
                                        >
                                            <X className="h-4 w-4" />
                                            Rechazar
                                        </button>
                                    </div>
                                </div>

                                <p className="mt-4 text-sm leading-6 text-slate-700">
                                    {it.descripcion}
                                </p>

                                <p className="mt-3 text-[11px] text-slate-400">
                                    Recibido: {it.created_at}
                                </p>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
