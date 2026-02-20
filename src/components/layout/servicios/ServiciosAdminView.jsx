// src/components/layout/servicios/ServiciosAdminView.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Upload, X } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

function ModalShell({ title, children, onClose, actions }) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <p className="text-sm font-semibold text-slate-900">{title}</p>
                    <button onClick={onClose} className="rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-slate-100">
                        Cerrar
                    </button>
                </div>
                <div className="px-5 py-4">{children}</div>
                <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">{actions}</div>
            </div>
        </div>
    );
}

function ConfirmModal({ open, title, message, onCancel, onConfirm, danger }) {
    if (!open) return null;
    return (
        <ModalShell
            title={title}
            onClose={onCancel}
            actions={
                <>
                    <button
                        onClick={onCancel}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`rounded-xl px-4 py-2 text-xs font-semibold text-white hover:brightness-110 ${danger ? "bg-red-600" : "bg-slate-900"
                            }`}
                    >
                        Confirmar
                    </button>
                </>
            }
        >
            <p className="text-sm text-slate-700">{message}</p>
        </ModalShell>
    );
}

function InfoModal({ open, title, message, onClose }) {
    if (!open) return null;
    return (
        <ModalShell
            title={title || "Aviso"}
            onClose={onClose}
            actions={
                <button onClick={onClose} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:brightness-110">
                    Entendido
                </button>
            }
        >
            <p className="text-sm text-slate-700">{message}</p>
        </ModalShell>
    );
}

function fmtDuracionToMinutes(duracion) {
    // backend te puede devolver "HH:MM:SS" o "P..." (iso duration) dependiendo config
    // Aquí manejamos lo común: "HH:MM:SS"
    if (!duracion) return "";
    const s = String(duracion);
    if (s.includes(":")) {
        const [hh, mm] = s.split(":");
        const minutes = Number(hh || 0) * 60 + Number(mm || 0);
        return String(minutes);
    }
    return ""; // fallback
}

function minutesToHHMMSS(mins) {
    const m = Number(mins || 0);
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    return `${hh}:${mm}:00`;
}

function tokenOrNull() {
    return localStorage.getItem("auth.access");
}

export function ServiciosAdminView({ role }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const [info, setInfo] = useState({ open: false, title: "", message: "" });
    const [confirm, setConfirm] = useState({ open: false, id: null });

    const [editorOpen, setEditorOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    const canManage = role === "admin"; // si quieres permitir recepcion, ajusta aquí

    const load = async () => {
        const token = tokenOrNull();
        if (!token) return;

        try {
            setLoading(true);
            const resp = await fetch(`${API_BASE}/api/servicios-admin/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (resp.status === 401) {
                window.location.href = "/login";
                return;
            }
            if (!resp.ok) throw new Error("No se pudieron cargar servicios");
            const data = await resp.json();
            setItems(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            setItems([]);
            setInfo({ open: true, title: "Error", message: "No se pudieron cargar los servicios. Revisa consola." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const normalized = useMemo(() => {
        return items.map((s) => ({
            ...s,
            duracion_min: fmtDuracionToMinutes(s.duracion),
        }));
    }, [items]);

    const openCreate = () => {
        setEditing(null);
        setEditorOpen(true);
    };

    const openEdit = (s) => {
        setEditing(s);
        setEditorOpen(true);
    };

    const askDelete = (id) => {
        setConfirm({ open: true, id });
    };

    const doDelete = async () => {
        const id = confirm.id;
        setConfirm({ open: false, id: null });

        const token = tokenOrNull();
        if (!token) return;

        try {
            const resp = await fetch(`${API_BASE}/api/servicios-admin/${id}/`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (resp.status === 401) return (window.location.href = "/login");
            if (!resp.ok && resp.status !== 204) throw new Error("No se pudo eliminar");
            setItems((prev) => prev.filter((x) => String(x.id) !== String(id)));
            setInfo({ open: true, title: "Listo", message: "Servicio eliminado." });
        } catch (e) {
            console.error(e);
            setInfo({ open: true, title: "Error", message: "No se pudo eliminar el servicio." });
        }
    };

    if (!canManage) {
        return (
            <div className="w-full p-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
                    No tienes permisos para administrar servicios.
                </div>
            </div>
        );
    }

    return (
        <div className="w-full overflow-auto">
            <div className="mx-auto w-full max-w-6xl p-6">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Servicios</h2>
                        <p className="text-sm text-slate-500">Administra el catálogo que se muestra en el sitio público.</p>
                    </div>

                    <button
                        onClick={openCreate}
                        className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:brightness-110"
                    >
                        + Nuevo servicio
                    </button>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-5 py-4">
                        <p className="text-sm font-semibold text-slate-900">Listado</p>
                    </div>

                    {loading ? (
                        <div className="p-5 text-sm text-slate-500">Cargando servicios...</div>
                    ) : !normalized.length ? (
                        <div className="p-5 text-sm text-slate-600">Aún no hay servicios.</div>
                    ) : (
                        <div className="divide-y divide-slate-200">
                            {normalized.map((s) => (
                                <div key={s.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 overflow-hidden rounded-xl bg-slate-100">
                                            {s.imagen_url ? <img src={s.imagen_url} alt={s.nombre} className="h-full w-full object-cover" /> : null}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-900">{s.nombre}</p>
                                            <p className="mt-1 text-xs text-slate-600">
                                                Duración: {s.duracion_min ? `${s.duracion_min} min` : "—"} • Costo: $
                                                {Number(s.precio || 0).toLocaleString("es-MX")}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500 truncate">{s.descripcion || ""}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openEdit(s)}
                                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            Editar
                                        </button>
                                        <button onClick={() => askDelete(s.id)} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:brightness-110">
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {editorOpen && (
                <ServicioEditorModal
                    initial={editing}
                    onClose={() => {
                        setEditorOpen(false);
                        setEditing(null);
                    }}
                    onSaved={(saved) => {
                        setItems((prev) => {
                            const exists = prev.some((x) => String(x.id) === String(saved.id));
                            if (exists) return prev.map((x) => (String(x.id) === String(saved.id) ? saved : x));
                            return [saved, ...prev];
                        });
                        setEditorOpen(false);
                        setEditing(null);
                    }}
                    onError={(msg) => setInfo({ open: true, title: "Error", message: msg })}
                />
            )}

            <ConfirmModal
                open={confirm.open}
                title="Eliminar servicio"
                message="¿Seguro? Esto lo quitará del catálogo público si estaba activo."
                danger
                onCancel={() => setConfirm({ open: false, id: null })}
                onConfirm={doDelete}
            />

            <InfoModal open={info.open} title={info.title} message={info.message} onClose={() => setInfo({ open: false, title: "", message: "" })} />
        </div>
    );
}

function ServicioEditorModal({ initial, onClose, onSaved, onError }) {
    const isEdit = Boolean(initial?.id);

    const [nombre, setNombre] = useState(initial?.nombre || "");
    const [descripcion, setDescripcion] = useState(initial?.descripcion || "");
    const [duracionMin, setDuracionMin] = useState(fmtDuracionToMinutes(initial?.duracion) || "60");
    const [precio, setPrecio] = useState(String(initial?.precio ?? ""));
    const [activo, setActivo] = useState(initial?.activo ?? true);
    const [file, setFile] = useState(null);

    const [saving, setSaving] = useState(false);

    const save = async () => {
        const token = tokenOrNull();
        if (!token) return;

        if (!nombre.trim()) return onError("El nombre es requerido.");
        const mins = Number(duracionMin || 0);
        if (!Number.isFinite(mins) || mins <= 0) return onError("Duración inválida.");
        const p = Number(precio || 0);
        if (!Number.isFinite(p) || p < 0) return onError("Costo inválido.");

        try {
            setSaving(true);

            const fd = new FormData();
            fd.append("nombre", nombre.trim());
            fd.append("descripcion", descripcion.trim());
            fd.append("duracion", minutesToHHMMSS(mins));
            fd.append("precio", String(p));
            fd.append("activo", activo ? "true" : "false");
            if (file) fd.append("imagen", file);

            const url = isEdit ? `${API_BASE}/api/servicios-admin/${initial.id}/` : `${API_BASE}/api/servicios-admin/`;
            const method = isEdit ? "PATCH" : "POST";

            const resp = await fetch(url, {
                method,
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });

            if (resp.status === 401) return (window.location.href = "/login");
            if (!resp.ok) {
                const err = await resp.json().catch(() => null);
                console.error("SAVE SERVICIO ERR:", err || resp.status);
                return onError("No se pudo guardar el servicio. Revisa consola.");
            }

            const saved = await resp.json();
            onSaved(saved);
        } catch (e) {
            console.error(e);
            onError("Error de red guardando el servicio.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <ModalShell
            title={isEdit ? "Editar servicio" : "Nuevo servicio"}
            onClose={onClose}
            actions={
                <>
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        disabled={saving}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={save}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-60"
                        disabled={saving}
                    >
                        {saving ? "Guardando..." : "Guardar"}
                    </button>
                </>
            }
        >
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <label className="text-xs font-semibold text-slate-700">Nombre</label>
                    <input
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        placeholder="Ej. Valoración inicial"
                    />
                </div>

                <div className="grid gap-2">
                    <label className="text-xs font-semibold text-slate-700">Descripción</label>
                    <input
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        placeholder="Breve (ideal 120–150 chars)"
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="grid gap-2">
                        <label className="text-xs font-semibold text-slate-700">Duración (min)</label>
                        <input
                            value={duracionMin}
                            onChange={(e) => setDuracionMin(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                            type="number"
                            min="1"
                        />
                    </div>

                    <div className="grid gap-2">
                        <label className="text-xs font-semibold text-slate-700">Costo (MXN)</label>
                        <input
                            value={precio}
                            onChange={(e) => setPrecio(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                            type="number"
                            min="0"
                            step="1"
                        />
                    </div>

                    <div className="grid gap-2">
                        <label className="text-xs font-semibold text-slate-700">Activo</label>
                        <button
                            onClick={() => setActivo((v) => !v)}
                            className={`rounded-xl px-3 py-2 text-sm font-semibold ${activo ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"}`}
                            type="button"
                        >
                            {activo ? "Sí" : "No"}
                        </button>
                    </div>
                </div>

                <div className="grid gap-2">
                    <label className="text-xs font-semibold text-slate-700">Imagen del servicio</label>

                    <FilePickerButton
                        value={file}
                        accept="image/*"
                        onChange={(f) => setFile(f)}
                        buttonText="Seleccionar imagen"
                        helper="Recomendado: JPG/PNG, formato 16:9 (ej. 1280×720)."
                    />
                </div>
            </div>
        </ModalShell>
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
