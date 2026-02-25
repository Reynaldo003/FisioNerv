// src/pages/ResetPassword.jsx
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function ResetPassword() {
    const navigate = useNavigate();
    const { uid, token } = useParams();

    const [newPass, setNewPass] = useState("");
    const [newPass2, setNewPass2] = useState("");
    const [show1, setShow1] = useState(false);
    const [show2, setShow2] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [okMsg, setOkMsg] = useState("");

    const passRules = useMemo(() => {
        const p = newPass || "";
        return {
            len: p.length >= 8,
            upper: /[A-Z]/.test(p),
            lower: /[a-z]/.test(p),
            num: /[0-9]/.test(p),
            sym: /[^A-Za-z0-9]/.test(p),
        };
    }, [newPass]);

    const passStrong =
        passRules.len && passRules.upper && passRules.lower && passRules.num && passRules.sym;

    async function handleReset(e) {
        e.preventDefault();
        setError("");
        setOkMsg("");

        const p1 = newPass;
        const p2 = newPass2;

        if (!uid || !token) {
            setError("Enlace inválido. Vuelve a solicitar el restablecimiento.");
            return;
        }

        if (!p1 || !p2) {
            setError("Escribe y confirma tu nueva contraseña.");
            return;
        }

        if (p1 !== p2) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        if (!passStrong) {
            setError("Tu contraseña no cumple los requisitos de seguridad.");
            return;
        }

        setLoading(true);
        try {
            const resp = await fetch(`${API_BASE}/api/auth/password-reset-confirm/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    uid,
                    token,
                    new_password: p1,
                }),
            });

            const data = await resp.json().catch(() => ({}));
            console.log("RESET CONFIRM RAW:", resp.status, data);

            if (!resp.ok) {
                setError(data?.detail || "No se pudo restablecer la contraseña. El enlace pudo expirar.");
                return;
            }

            setOkMsg("Contraseña actualizada correctamente. Ahora puedes iniciar sesión.");
            setNewPass("");
            setNewPass2("");

            // redirige al login luego de éxito
            setTimeout(() => navigate("/login"), 900);
        } catch (err) {
            console.error(err);
            setError("No se pudo conectar al servidor. ¿Django está corriendo en :8000?");
        } finally {
            setLoading(false);
        }
    }

    function Rule({ ok, children }) {
        return (
            <li className={["text-xs", ok ? "text-emerald-700" : "text-slate-500"].join(" ")}>
                <span className={["mr-2 inline-block h-1.5 w-1.5 rounded-full", ok ? "bg-emerald-500" : "bg-slate-300"].join(" ")} />
                {children}
            </li>
        );
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
                            Restablecer contraseña
                        </h1>
                        <p className="mt-1 text-xs text-slate-500">
                            Escribe una contraseña nueva y segura para tu cuenta.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                            {error}
                        </div>
                    )}

                    {okMsg && (
                        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                            {okMsg}
                        </div>
                    )}

                    <form onSubmit={handleReset} className="space-y-4">
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-slate-700">Nueva contraseña</label>
                            <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm focus-within:border-[#004aad] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#004aad]">
                                <Lock className="h-4 w-4 text-slate-400" />
                                <input
                                    type={show1 ? "text" : "password"}
                                    value={newPass}
                                    onChange={(e) => setNewPass(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                                    autoComplete="new-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShow1((v) => !v)}
                                    className="p-1 rounded-md hover:bg-slate-100 active:scale-[0.98]"
                                    title={show1 ? "Ocultar contraseña" : "Ver contraseña"}
                                >
                                    {show1 ? (
                                        <EyeOff className="h-4 w-4 text-slate-500" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-slate-500" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-slate-700">Confirmar contraseña</label>
                            <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm focus-within:border-[#004aad] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#004aad]">
                                <Lock className="h-4 w-4 text-slate-400" />
                                <input
                                    type={show2 ? "text" : "password"}
                                    value={newPass2}
                                    onChange={(e) => setNewPass2(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                                    autoComplete="new-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShow2((v) => !v)}
                                    className="p-1 rounded-md hover:bg-slate-100 active:scale-[0.98]"
                                    title={show2 ? "Ocultar contraseña" : "Ver contraseña"}
                                >
                                    {show2 ? (
                                        <EyeOff className="h-4 w-4 text-slate-500" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-slate-500" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* reglas */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                            <div className="flex items-center gap-2 mb-2">
                                <ShieldCheck className="h-4 w-4 text-slate-500" />
                                <p className="text-xs font-semibold text-slate-700">Requisitos</p>
                            </div>
                            <ul className="space-y-1">
                                <Rule ok={passRules.len}>Mínimo 8 caracteres</Rule>
                                <Rule ok={passRules.upper}>Una mayúscula</Rule>
                                <Rule ok={passRules.lower}>Una minúscula</Rule>
                                <Rule ok={passRules.num}>Un número</Rule>
                                <Rule ok={passRules.sym}>Un símbolo</Rule>
                            </ul>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#004aad] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#004aad]/40 transition hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? "Guardando..." : "Guardar nueva contraseña"}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Volver al login
                        </button>
                    </form>

                    <p className="mt-4 text-[11px] text-slate-400 leading-relaxed">
                        Si tu enlace expiró, vuelve al login y solicita un nuevo restablecimiento.
                    </p>
                </div>
            </div>
        </section>
    );
}