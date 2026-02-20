// src/components/layout/profile/UserProfileView.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Upload, X } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

function strongPasswordRules(pw) {
    const s = String(pw || "");
    return {
        len: s.length >= 8,
        upper: /[A-Z]/.test(s),
        lower: /[a-z]/.test(s),
        num: /[0-9]/.test(s),
        sym: /[^A-Za-z0-9]/.test(s),
    };
}

function allRulesOk(r) {
    return r.len && r.upper && r.lower && r.num && r.sym;
}

function tokenOrNull() {
    return localStorage.getItem("auth.access");
}

export function UserProfileView({ me, onUpdated, onShowInfo }) {
    const [loading, setLoading] = useState(false);

    const [username, setUsername] = useState(me?.username || "");
    const [firstName, setFirstName] = useState(me?.first_name || "");
    const [lastName, setLastName] = useState(me?.last_name || "");
    const [email, setEmail] = useState(me?.email || "");
    const [foto, setFoto] = useState(null);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const rules = useMemo(() => strongPasswordRules(newPassword), [newPassword]);

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);

    // Si el padre actualiza "me"
    useEffect(() => {
        setUsername(me?.username || "");
        setFirstName(me?.first_name || "");
        setLastName(me?.last_name || "");
        setEmail(me?.email || "");
    }, [me]);

    const canSavePassword = useMemo(() => {
        // Solo aplica validación si newPassword tiene algo
        if (!newPassword) return true;
        if (!currentPassword) return false;
        return allRulesOk(rules);
    }, [newPassword, currentPassword, rules]);

    const save = async () => {
        const token = tokenOrNull();
        if (!token) return;

        if (!username.trim()) return onShowInfo?.("El usuario (username) es requerido.", "Validación");
        if (!email.trim()) return onShowInfo?.("El email es requerido.", "Validación");

        // Si pretende cambiar password, validamos reglas
        if (newPassword) {
            if (!currentPassword)
                return onShowInfo?.("Para cambiar contraseña debes escribir la contraseña actual.", "Validación");
            if (!allRulesOk(rules))
                return onShowInfo?.("La nueva contraseña no cumple los requisitos de seguridad.", "Validación");
        }

        try {
            setLoading(true);

            const fd = new FormData();
            fd.append("username", username.trim());
            fd.append("first_name", firstName.trim());
            fd.append("last_name", lastName.trim());
            fd.append("email", email.trim());

            if (foto) fd.append("foto", foto);

            if (newPassword) {
                fd.append("current_password", currentPassword);
                fd.append("new_password", newPassword);
            }

            const resp = await fetch(`${API_BASE}/api/me/update/`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });

            if (resp.status === 401) return (window.location.href = "/login");

            if (!resp.ok) {
                const err = await resp.json().catch(() => null);
                console.error("PROFILE UPDATE ERR:", err || resp.status);
                const msg = err?.detail || "No se pudo guardar tu perfil. Revisa consola.";
                onShowInfo?.(msg, "Error");
                return;
            }

            const data = await resp.json();

            // Limpia campos sensibles
            setCurrentPassword("");
            setNewPassword("");
            setShowCurrent(false);
            setShowNew(false);
            setFoto(null);

            onUpdated?.(data);
            onShowInfo?.("Perfil actualizado correctamente.", "Listo");
        } catch (e) {
            console.error(e);
            onShowInfo?.("Error de red guardando tu perfil.", "Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full overflow-auto">
            <div className="mx-auto w-full max-w-4xl p-6">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-slate-900">Mi perfil</h2>
                    <p className="text-sm text-slate-500">Actualiza tu usuario, foto y contraseña.</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Usuario (username)">
                            <input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                            />
                        </Field>

                        <Field label="Email">
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                            />
                        </Field>

                        <Field label="Nombre">
                            <input
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                            />
                        </Field>

                        <Field label="Apellidos">
                            <input
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                            />
                        </Field>

                        <Field label="Foto de perfil" full>
                            <FilePickerButton
                                value={foto}
                                accept="image/*"
                                onChange={(f) => setFoto(f)}
                                buttonText="Seleccionar imagen"
                            />
                        </Field>
                    </div>

                    <div className="my-5 h-px bg-slate-200" />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Contraseña actual (Opcional, solo si vas a cambiar contraseña)">
                            <PasswordInput
                                value={currentPassword}
                                onChange={setCurrentPassword}
                                show={showCurrent}
                                setShow={setShowCurrent}
                                placeholder="••••••••"
                            />
                        </Field>

                        <Field label="Nueva contraseña (opcional)">
                            <PasswordInput
                                value={newPassword}
                                onChange={setNewPassword}
                                show={showNew}
                                setShow={setShowNew}
                                placeholder="••••••••"
                            />
                        </Field>

                        <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold text-slate-700">Requisitos de contraseña segura</p>
                            <ul className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                                <Rule ok={rules.len} text="Mínimo 8 caracteres" />
                                <Rule ok={rules.upper} text="Al menos 1 mayúscula" />
                                <Rule ok={rules.lower} text="Al menos 1 minúscula" />
                                <Rule ok={rules.num} text="Al menos 1 número" />
                                <Rule ok={rules.sym} text="Al menos 1 símbolo" />
                            </ul>
                            <p className="mt-2 text-[11px] text-slate-500">
                                Si no escribes nueva contraseña, no se valida ni se cambia.
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 flex items-center justify-end">
                        <button
                            onClick={save}
                            disabled={loading || !canSavePassword}
                            className="rounded-2xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-60"
                        >
                            {loading ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </div>

                    {!canSavePassword && newPassword ? (
                        <p className="mt-3 text-xs text-red-600">
                            Para guardar: escribe contraseña actual y cumple todos los requisitos de la nueva contraseña.
                        </p>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function PasswordInput({ value, onChange, show, setShow, placeholder }) {
    return (
        <div className="relative">
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-11 text-sm outline-none focus:border-slate-400"
                type={show ? "text" : "password"}
                placeholder={placeholder}
                autoComplete="new-password"
            />
            <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-1 top-1 inline-flex h-8 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
    );
}

function FilePickerButton({ value, onChange, accept, buttonText, helper }) {
    const id = useMemo(() => `file_${Math.random().toString(16).slice(2)}`, []);
    const name = value?.name || "";

    return (
        <div className="grid gap-2">
            <input
                id={id}
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => onChange?.(e.target.files?.[0] || null)}
            />

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label
                    htmlFor={id}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                    <Upload size={16} />
                    {buttonText || "Seleccionar archivo"}
                </label>

                <div className="min-w-0 flex-1 sm:pl-3">
                    {name ? (
                        <div className="flex items-center gap-2">
                            <p className="min-w-0 truncate text-xs text-slate-700">
                                <span className="font-semibold">Seleccionado:</span> {name}
                            </p>
                            <button
                                type="button"
                                onClick={() => onChange?.(null)}
                                className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
                                title="Quitar"
                            >
                                <X size={14} />
                                Quitar
                            </button>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500">Ningún archivo seleccionado</p>
                    )}
                </div>
            </div>

            {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
        </div>
    );
}

function Field({ label, children, full }) {
    return (
        <div className={full ? "sm:col-span-2" : ""}>
            <label className="text-xs font-semibold text-slate-700">{label}</label>
            <div className="mt-1">{children}</div>
        </div>
    );
}

function Rule({ ok, text }) {
    return (
        <li className={`flex items-center gap-2 ${ok ? "text-emerald-700" : "text-slate-600"}`}>
            <span className={`inline-block h-2 w-2 rounded-full ${ok ? "bg-emerald-600" : "bg-slate-300"}`} />
            {text}
        </li>
    );
}
