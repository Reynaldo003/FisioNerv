// src/components/Login.jsx
import { useState } from "react";
import { Lock, Mail, LogIn } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function Login() {
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function apiFetch(url, options = {}) {
        const access = localStorage.getItem("auth.access");
        const refresh = localStorage.getItem("auth.refresh");

        const headers = {
            ...(options.headers || {}),
            Authorization: access ? `Bearer ${access}` : undefined,
            "Content-Type": options.headers?.["Content-Type"] || "application/json",
        };

        let resp = await fetch(`${API_BASE}${url}`, { ...options, headers });

        // Si el access expiró
        if (resp.status === 401 && refresh) {
            const refreshResp = await fetch(`${API_BASE}/api/auth/token/refresh/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh }),
            });

            if (refreshResp.ok) {
                const data = await refreshResp.json();
                localStorage.setItem("auth.access", data.access);

                const retryHeaders = {
                    ...headers,
                    Authorization: `Bearer ${data.access}`,
                };
                resp = await fetch(`${API_BASE}${url}`, {
                    ...options,
                    headers: retryHeaders,
                });
            } else {
                // refresh inválido → cerrar sesión
                localStorage.removeItem("auth.access");
                localStorage.removeItem("auth.refresh");
                localStorage.removeItem("auth.user");
                window.location.href = "/login";
                return resp;
            }
        }

        return resp;
    }
    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const resp = await fetch(`${API_BASE}/api/auth/token/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: email,
                    password: pass,
                }),
            });

            if (!resp.ok) {
                setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
                setLoading(false);
                return;
            }

            const data = await resp.json();

            localStorage.setItem("auth.access", data.access);
            localStorage.setItem("auth.refresh", data.refresh);
            localStorage.setItem("auth.user", email);

            // Redirigir al panel
            window.location.href = "/Administrativa";
        } catch (err) {
            console.error(err);
            setError("Ocurrió un error al conectarse con el servidor.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#004aad] via-[#003aa6] to-slate-950 px-4 py-10">
            <div className="w-full max-w-md">
                {/* Card del formulario */}
                <div className="rounded-2xl bg-white shadow-xl border border-slate-200 px-6 py-7 sm:px-8">
                    <div className="mb-5 text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                            Fisionerv
                        </p>
                        <h1 className="mt-1 text-xl font-semibold text-slate-900">
                            Acceso administrativo
                        </h1>
                        <p className="mt-1 text-xs text-slate-500">
                            Inicia sesión para gestionar agenda, pacientes y contenido.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-slate-700">
                                Usuario
                            </label>
                            <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm focus-within:border-[#004aad] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#004aad]">
                                <Mail className="h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@fisionerv.com"
                                    className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-slate-700">
                                Contraseña
                            </label>
                            <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm focus-within:border-[#004aad] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#004aad]">
                                <Lock className="h-4 w-4 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    value={pass}
                                    onChange={(e) => setPass(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>Acceso restringido al equipo FisioNerv.</span>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#004aad] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#004aad]/40 transition hover:brightness-110 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <LogIn className="h-4 w-4" />
                            {loading ? "Ingresando..." : "Acceder al panel"}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}
