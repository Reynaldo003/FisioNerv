// src/components/Login.jsx
import { useState } from "react";
import { Lock, Mail, LogIn, Eye, EyeOff, ArrowLeft } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function Login() {
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [showPass, setShowPass] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // 🔁 flujo recuperar
    const [mode, setMode] = useState("login"); // "login" | "forgot"
    const [forgotValue, setForgotValue] = useState("");
    const [forgotMsg, setForgotMsg] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const resp = await fetch(`${API_BASE}/api/auth/token/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: email.trim(),
                    password: pass,
                }),
            });

            if (!resp.ok) {
                const t = await resp.text();
                console.error("LOGIN ERROR:", resp.status, t);
                setError("Credenciales incorrectas. Verifica tu usuario/correo y contraseña.");
                return;
            }

            const data = await resp.json();
            localStorage.setItem("auth.access", data.access);
            localStorage.setItem("auth.refresh", data.refresh);
            localStorage.setItem("auth.user", email.trim());

            window.location.href = "/Administrativa";
        } catch (err) {
            console.error(err);
            setError("No se pudo conectar al servidor. ¿Django está corriendo en :8000?");
        } finally {
            setLoading(false);
        }
    }

    async function handleForgot(e) {
        e.preventDefault();
        setError("");
        setForgotMsg("");
        setLoading(true);

        try {
            const resp = await fetch(`${API_BASE}/api/auth/password-reset/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email_or_username: forgotValue.trim() }),
            });

            // ✅ Siempre mostramos el mismo mensaje (seguridad anti-enumeración)
            const data = await resp.json().catch(() => ({}));
            console.log("FORGOT RAW:", resp.status, data);

            setForgotMsg(
                "Si el usuario/correo existe, te llegará un correo con tu usuario y una contraseña temporal.");
            setForgotValue("");
        } catch (err) {
            console.error(err);
            setError("No se pudo conectar al servidor. ¿Django está corriendo en :8000?");
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#004aad] via-[#003aa6] to-slate-950 px-4 py-10">
            <div className="w-full max-w-md">
                <div className="rounded-2xl bg-white shadow-xl border border-slate-200 px-6 py-7 sm:px-8">
                    <div className="mb-5 text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                            Fisionerv
                        </p>
                        <h1 className="mt-1 text-xl font-semibold text-slate-900">
                            {mode === "login" ? "Acceso administrativo" : "Recuperar contraseña"}
                        </h1>
                        <p className="mt-1 text-xs text-slate-500">
                            {mode === "login"
                                ? "Inicia sesión para gestionar agenda, pacientes y contenido."
                                : "Escribe tu usuario y enviaremos una contraseña temporal al usuario administrador."}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                            {error}
                        </div>
                    )}

                    {mode === "forgot" && forgotMsg && (
                        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                            {forgotMsg}
                        </div>
                    )}

                    {mode === "login" ? (
                        <>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-slate-700">
                                        Usuario o correo
                                    </label>
                                    <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm focus-within:border-[#004aad] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#004aad]">
                                        <Mail className="h-4 w-4 text-slate-400" />
                                        <input
                                            type="text"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="usuario"
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
                                            type={showPass ? "text" : "password"}
                                            required
                                            value={pass}
                                            onChange={(e) => setPass(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowPass((v) => !v)}
                                            className="p-1 rounded-md hover:bg-slate-100 active:scale-[0.98]"
                                            title={showPass ? "Ocultar contraseña" : "Ver contraseña"}
                                        >
                                            {showPass ? (
                                                <EyeOff className="h-4 w-4 text-slate-500" />
                                            ) : (
                                                <Eye className="h-4 w-4 text-slate-500" />
                                            )}
                                        </button>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMode("forgot");
                                                setError("");
                                                setForgotMsg("");
                                                setForgotValue(email.trim());
                                            }}
                                            className="mt-1 text-xs font-semibold text-[#004aad] hover:underline"
                                        >
                                            ¿Olvidaste tu contraseña?
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#004aad] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#004aad]/40 transition hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <LogIn className="h-4 w-4" />
                                    {loading ? "Ingresando..." : "Acceder al panel"}
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <form onSubmit={handleForgot} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-slate-700">
                                        Usuario o correo
                                    </label>
                                    <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm focus-within:border-[#004aad] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#004aad]">
                                        <Mail className="h-4 w-4 text-slate-400" />
                                        <input
                                            type="text"
                                            required
                                            value={forgotValue}
                                            onChange={(e) => setForgotValue(e.target.value)}
                                            placeholder="correo@dominio.com o usuario"
                                            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#004aad] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#004aad]/40 transition hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {loading ? "Enviando..." : "Enviar enlace de restablecimiento"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode("login");
                                        setError("");
                                        setForgotMsg("");
                                    }}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Volver al login
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}