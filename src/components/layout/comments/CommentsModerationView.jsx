import { useEffect, useMemo, useState } from "react";
import { Star, Check, X, MessageSquareText } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

function ModalShell({ title, children, onClose, actions }) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <p className="text-sm font-semibold text-slate-900">{title}</p>
                    <button onClick={onClose} className="rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-slate-100">
                        Cerrar
                    </button>
                </div>
                <div className="px-5 py-4 text-sm text-slate-700">{children}</div>
                <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">{actions}</div>
            </div>
        </div>
    );
}

function InfoModal({ open, title = "Aviso", message, onClose }) {
    if (!open) return null;
    return (
        <ModalShell
            title={title}
            onClose={onClose}
            actions={
                <button
                    onClick={onClose}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:brightness-110"
                >
                    Entendido
                </button>
            }
        >
            {message}
        </ModalShell>
    );
}

export function CommentsModerationView() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [info, setInfo] = useState({ open: false, title: "", message: "" });

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
            setItems(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            setItems([]);
            setInfo({ open: true, title: "Error", message: "No se pudieron cargar los comentarios. Revisa consola." });
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
                setItems(prev);
                const err = await resp.json().catch(() => null);
                console.error("Moderation error:", err || resp.status);
                setInfo({ open: true, title: "Error", message: "No se pudo moderar el comentario." });
            }
        } catch (e) {
            setItems(prev);
            console.error(e);
            setInfo({ open: true, title: "Error", message: "Error de red moderando comentario." });
        }
    }

    return (
        <section className="w-full overflow-auto">
            <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="h-9 w-9 rounded-xl bg-violet-600/10 text-violet-700 flex items-center justify-center ring-1 ring-violet-600/15">
                                <MessageSquareText className="h-5 w-5" />
                            </div>
                            <h2 className="text-base sm:text-lg font-semibold text-slate-900">Moderación de comentarios</h2>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Comentarios pendientes de aprobación.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 ring-1 ring-slate-200">
                            Pendientes: <b>{pendingCount}</b>
                        </span>
                        <button
                            onClick={loadPending}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Recargar
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
                        Cargando comentarios...
                    </div>
                ) : items.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                        <p className="text-sm font-medium text-slate-800">No hay comentarios pendientes 🎉</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {items.map((it) => (
                            <article key={it.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{it.nombre_completo}</p>

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
                                            <span className="ml-2 text-xs text-slate-500">{Number(it.calificacion || 0)} / 5</span>
                                        </div>
                                    </div>

                                    {/* ✅ en móvil: botones full width y apilados */}
                                    <div className="grid grid-cols-1 sm:flex sm:items-center gap-2 sm:gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={() => moderate(it.id, "aprobado")}
                                            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:brightness-110"
                                        >
                                            <Check className="h-4 w-4" />
                                            Aceptar
                                        </button>

                                        <button
                                            onClick={() => moderate(it.id, "rechazado")}
                                            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:brightness-110"
                                        >
                                            <X className="h-4 w-4" />
                                            Rechazar
                                        </button>
                                    </div>
                                </div>

                                <p className="mt-4 text-sm leading-6 text-slate-700 break-words">{it.descripcion}</p>

                                <p className="mt-3 text-[11px] text-slate-400">Recibido: {it.created_at}</p>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            <InfoModal
                open={info.open}
                title={info.title}
                message={info.message}
                onClose={() => setInfo({ open: false, title: "", message: "" })}
            />
        </section>
    );
}