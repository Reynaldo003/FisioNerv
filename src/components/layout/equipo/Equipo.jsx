// src/components/layout/equipo/Equipo.jsx
import { useEffect, useMemo, useState } from "react";
import {
    Edit3,
    Layers3,
    Plus,
    RefreshCw,
    Save,
    Search,
    ShieldCheck,
    Trash2,
    Upload,
    UserRoundCog,
    UsersRound,
    X,
} from "lucide-react";
import { apiFetch } from "../../../services/apiFetch";

const BASE_ROLES = [
    { value: "fisioterapeuta", label: "Fisioterapeuta" },
    { value: "terapeuta", label: "Terapeuta" },
    { value: "nutriologo", label: "Nutriólogo" },
    { value: "dentista", label: "Dentista" },
    { value: "recepcion", label: "Recepción" },
    { value: "practicante", label: "Practicante" },
    { value: "admin", label: "Administrador" },
    { value: "personalizado", label: "Rol personalizado" },
];

const INTERFACES = [
    { id: "agenda", label: "Agenda" },
    { id: "pacientes", label: "Pacientes" },
    { id: "ventas", label: "Finanzas" },
    { id: "servicios", label: "Servicios" },
    { id: "comentarios", label: "Comentarios" },
    { id: "equipo", label: "Equipo" },
    { id: "insumos", label: "Insumos" },
    { id: "perfil", label: "Mi perfil" },
];

const PERMISSION_FIELDS = [
    ["puede_ver_agenda", "Ver agenda"],
    ["puede_ver_pacientes", "Ver pacientes"],
    ["puede_ver_contacto_paciente", "Ver contacto de pacientes"],
    ["puede_ver_montos", "Ver montos"],
    ["puede_modificar_montos", "Modificar montos"],
    ["puede_ver_finanzas", "Ver finanzas"],
    ["puede_ver_servicios", "Ver servicios"],
    ["puede_ver_comentarios", "Ver comentarios"],
    ["puede_ver_equipo", "Ver equipo"],
    ["puede_editar_equipo", "Editar equipo"],
    ["puede_ver_insumos", "Ver insumos"],
    ["puede_editar_insumos", "Editar insumos"],
    ["puede_ver_perfil", "Ver perfil"],
];

const BASE_ROLE_INTERFACES = {
    admin: ["agenda", "pacientes", "ventas", "servicios", "comentarios", "equipo", "insumos", "perfil"],
    fisioterapeuta: ["agenda", "pacientes", "servicios", "perfil"],
    terapeuta: ["agenda", "pacientes", "servicios", "perfil"],
    nutriologo: ["agenda", "pacientes", "servicios", "perfil"],
    dentista: ["agenda", "pacientes", "servicios", "perfil"],
    recepcion: ["agenda", "pacientes", "servicios", "comentarios", "insumos", "perfil"],
    practicante: ["agenda", "pacientes", "servicios", "perfil"],
};

function emptyUser() {
    return {
        username: "",
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        rol: "fisioterapeuta",
        rol_personalizado: "",
        telefono: "",
        descripcion: "",
        foto: null,
        is_active: true,
        usar_interfaces_override: false,
        interfaces_override: [],
    };
}

function emptyRole() {
    return {
        slug: "",
        nombre: "",
        descripcion: "",
        interfaces: ["agenda", "perfil"],
        activo: true,
        puede_ver_agenda: true,
        puede_ver_pacientes: false,
        puede_ver_contacto_paciente: false,
        puede_ver_montos: false,
        puede_modificar_montos: false,
        puede_ver_finanzas: false,
        puede_ver_servicios: false,
        puede_ver_comentarios: false,
        puede_ver_equipo: false,
        puede_editar_equipo: false,
        puede_ver_insumos: false,
        puede_editar_insumos: false,
        puede_ver_perfil: true,
    };
}

async function readJson(response) {
    try {
        return await response.json();
    } catch {
        return null;
    }
}

function errorText(data, fallback) {
    if (!data) return fallback;
    if (typeof data.detail === "string") return data.detail;

    const first = Object.entries(data).find(([, value]) => value);
    if (!first) return fallback;

    const value = Array.isArray(first[1]) ? first[1][0] : first[1];
    return `${first[0]}: ${String(value)}`;
}

function roleLabel(user) {
    return (
        user?.rol_personalizado_out?.nombre ||
        BASE_ROLES.find((item) => item.value === user?.rol_base_out)?.label ||
        user?.rol_out ||
        "Sin rol"
    );
}

function interfaceLabel(id) {
    return INTERFACES.find((item) => item.id === id)?.label || id;
}

function Avatar({ user, size = "h-10 w-10" }) {
    const initial =
        String(user?.first_name || user?.username || "U").trim()[0]?.toUpperCase() || "U";

    return (
        <span
            className={`${size} grid shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-100 text-sm font-black text-blue-700`}
        >
            {user?.foto_url ? (
                <img src={user.foto_url} alt="" className="h-full w-full object-cover" />
            ) : (
                initial
            )}
        </span>
    );
}

function Modal({ open, title, subtitle, onClose, children, wide = false }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[170] flex items-center justify-center p-4">
            <button
                type="button"
                className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
                onClick={onClose}
                aria-label="Cerrar"
            />

            <div
                className={`relative z-10 max-h-[92vh] w-full overflow-auto rounded-3xl border border-slate-200 bg-white shadow-2xl ${wide ? "max-w-4xl" : "max-w-xl"
                    }`}
            >
                <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
                    <div>
                        <h3 className="font-black text-slate-950">{title}</h3>
                        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {children}
            </div>
        </div>
    );
}

function Message({ data, onClose }) {
    return (
        <Modal open={data.open} title={data.title || "Aviso"} onClose={onClose}>
            <div className="p-5 text-sm text-slate-600">{data.message}</div>

            <div className="flex justify-end border-t border-slate-100 p-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl bg-[#0a2f68] px-4 py-2 text-xs font-bold text-white"
                >
                    Entendido
                </button>
            </div>
        </Modal>
    );
}

function Field({ label, children, full = false }) {
    return (
        <label className={full ? "sm:col-span-2" : ""}>
            <span className="mb-1.5 block text-[11px] font-bold text-slate-600">{label}</span>
            {children}
        </label>
    );
}

const inputClass =
    "h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100";

function UserModal({ open, user, roles, onClose, onSaved }) {
    const editing = Boolean(user?.id);
    const [form, setForm] = useState(emptyUser());
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;

        setError("");

        setForm(
            user
                ? {
                    ...emptyUser(),
                    username: user.username || "",
                    first_name: user.first_name || "",
                    last_name: user.last_name || "",
                    email: user.email || "",
                    rol: user.rol_base_out || "fisioterapeuta",
                    rol_personalizado: user.rol_personalizado_out?.id || "",
                    telefono: user.telefono_out || "",
                    descripcion: user.descripcion_out || "",
                    is_active: user.is_active !== false,
                    usar_interfaces_override: user.usar_interfaces_override_out || false,
                    interfaces_override: user.interfaces_override_out || [],
                }
                : emptyUser()
        );
    }, [open, user]);

    if (!open) return null;

    const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    async function submit(event) {
        event.preventDefault();
        setSaving(true);
        setError("");

        const fd = new FormData();

        ["username", "first_name", "last_name", "email", "rol", "telefono", "descripcion"].forEach(
            (key) => fd.append(key, form[key] ?? "")
        );

        fd.append("is_active", form.is_active ? "true" : "false");

        if (form.password) fd.append("password", form.password);

        if (form.rol === "personalizado" && form.rol_personalizado) {
            fd.append("rol_personalizado", form.rol_personalizado);
        }

        if (form.foto) fd.append("foto", form.foto);

        try {
            const response = await apiFetch(
                editing ? `/api/staff/${user.id}/` : "/api/staff/",
                {
                    method: editing ? "PATCH" : "POST",
                    body: fd,
                }
            );

            const data = await readJson(response);

            if (!response.ok) {
                setError(errorText(data, "No se pudo guardar el usuario."));
                return;
            }

            onSaved?.(data);
        } catch {
            setError("No se pudo conectar con el servidor.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal
            open={open}
            title={editing ? "Editar usuario" : "Nuevo usuario"}
            subtitle="Datos de acceso, rol y perfil público."
            onClose={onClose}
            wide
        >
            <form onSubmit={submit}>
                <div className="grid gap-4 p-5 sm:grid-cols-2">
                    <Field label="Nombre">
                        <input
                            className={inputClass}
                            value={form.first_name}
                            onChange={(e) => set("first_name", e.target.value)}
                        />
                    </Field>

                    <Field label="Apellidos">
                        <input
                            className={inputClass}
                            value={form.last_name}
                            onChange={(e) => set("last_name", e.target.value)}
                        />
                    </Field>

                    <Field label="Usuario">
                        <input
                            className={inputClass}
                            value={form.username}
                            onChange={(e) => set("username", e.target.value)}
                            required
                        />
                    </Field>

                    <Field label="Correo">
                        <input
                            type="email"
                            className={inputClass}
                            value={form.email}
                            onChange={(e) => set("email", e.target.value)}
                            required
                        />
                    </Field>

                    <Field label="Teléfono">
                        <input
                            className={inputClass}
                            value={form.telefono}
                            onChange={(e) => set("telefono", e.target.value)}
                        />
                    </Field>

                    <Field label={editing ? "Nueva contraseña (opcional)" : "Contraseña"}>
                        <input
                            type="password"
                            className={inputClass}
                            value={form.password}
                            onChange={(e) => set("password", e.target.value)}
                            required={!editing}
                        />
                    </Field>

                    <Field label="Rol">
                        <select
                            className={inputClass}
                            value={form.rol}
                            onChange={(e) => set("rol", e.target.value)}
                        >
                            {BASE_ROLES.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </Field>

                    {form.rol === "personalizado" && (
                        <Field label="Rol personalizado">
                            <select
                                className={inputClass}
                                value={form.rol_personalizado}
                                onChange={(e) => set("rol_personalizado", e.target.value)}
                                required
                            >
                                <option value="">Selecciona...</option>

                                {roles
                                    .filter((role) => role.activo !== false)
                                    .map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.nombre}
                                        </option>
                                    ))}
                            </select>
                        </Field>
                    )}

                    <Field label="Descripción" full>
                        <textarea
                            className={`${inputClass} min-h-24 py-3`}
                            value={form.descripcion}
                            onChange={(e) => set("descripcion", e.target.value)}
                        />
                    </Field>

                    <Field label="Foto" full>
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-blue-200 bg-blue-50 px-4 py-4 text-xs font-bold text-blue-700 hover:bg-blue-100">
                            <Upload className="h-4 w-4" />
                            {form.foto?.name || "Seleccionar imagen"}
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => set("foto", e.target.files?.[0] || null)}
                            />
                        </label>
                    </Field>

                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(e) => set("is_active", e.target.checked)}
                            className="h-4 w-4"
                        />

                        <span>
                            <b className="block text-xs text-slate-800">Usuario activo</b>
                            <small className="text-[10px] text-slate-500">
                                Desactívalo para impedir acceso sin eliminar su historial.
                            </small>
                        </span>
                    </label>

                    {error && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 sm:col-span-2">
                            {error}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 p-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600"
                    >
                        Cancelar
                    </button>

                    <button
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#0a2f68] px-5 py-2 text-xs font-bold text-white disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {saving ? "Guardando..." : "Guardar"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function AccessModal({ open, user, onClose, onSaved }) {
    const [enabled, setEnabled] = useState(false);
    const [selected, setSelected] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open || !user) return;

        const hasOverride = Boolean(user.usar_interfaces_override_out);

        setEnabled(hasOverride);
        setSelected(
            hasOverride
                ? user.interfaces_override_out || []
                : user.interfaces_out || []
        );
        setError("");
    }, [open, user]);

    if (!open || !user) return null;

    const toggle = (id) => {
        setSelected((prev) =>
            prev.includes(id)
                ? prev.filter((item) => item !== id)
                : [...prev, id]
        );
    };

    async function save() {
        setSaving(true);
        setError("");

        try {
            const response = await apiFetch(`/api/staff/${user.id}/interfaces/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    usar_interfaces_override: enabled,
                    interfaces: selected,
                }),
            });

            const data = await readJson(response);

            if (!response.ok) {
                setError(errorText(data, "No se pudieron guardar los accesos."));
                return;
            }

            onSaved?.(data);
        } catch {
            setError("No se pudo conectar con el servidor.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal
            open={open}
            title="Interfaces visibles"
            subtitle={`${user.first_name || user.username} · ${roleLabel(user)}`}
            onClose={onClose}
        >
            <div className="space-y-4 p-5">
                <label className="flex items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <div>
                        <p className="text-xs font-black text-blue-900">
                            Personalizar accesos de este usuario
                        </p>
                        <p className="mt-1 text-[10px] text-blue-700/70">
                            Si está desactivado, hereda las interfaces de su rol.
                        </p>
                    </div>

                    <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setEnabled(e.target.checked)}
                        className="h-5 w-5"
                    />
                </label>

                <div className="grid grid-cols-2 gap-2">
                    {INTERFACES.map((item) => {
                        const active = selected.includes(item.id);

                        return (
                            <button
                                key={item.id}
                                type="button"
                                disabled={!enabled}
                                onClick={() => toggle(item.id)}
                                className={`rounded-xl border px-3 py-3 text-left text-xs font-bold transition disabled:opacity-45 ${active
                                        ? "border-blue-200 bg-blue-50 text-blue-700"
                                        : "border-slate-200 bg-white text-slate-600"
                                    }`}
                            >
                                {item.label}
                            </button>
                        );
                    })}
                </div>

                {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                        {error}
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 p-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600"
                >
                    Cancelar
                </button>

                <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="rounded-xl bg-[#0a2f68] px-5 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                    {saving ? "Guardando..." : "Guardar accesos"}
                </button>
            </div>
        </Modal>
    );
}

function RoleModal({ open, role, onClose, onSaved }) {
    const editing = Boolean(role?.id);
    const [form, setForm] = useState(emptyRole());
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;

        setForm(
            role
                ? {
                    ...emptyRole(),
                    ...role,
                    interfaces: role.interfaces || [],
                }
                : emptyRole()
        );

        setError("");
    }, [open, role]);

    if (!open) return null;

    const set = (key, value) =>
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));

    const toggleInterface = (id) =>
        set(
            "interfaces",
            form.interfaces.includes(id)
                ? form.interfaces.filter((item) => item !== id)
                : [...form.interfaces, id]
        );

    async function submit(event) {
        event.preventDefault();

        setSaving(true);
        setError("");

        try {
            const response = await apiFetch(
                editing ? `/api/roles/${role.id}/` : "/api/roles/",
                {
                    method: editing ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form),
                }
            );

            const data = await readJson(response);

            if (!response.ok) {
                setError(errorText(data, "No se pudo guardar el rol."));
                return;
            }

            onSaved?.(data);
        } catch {
            setError("No se pudo conectar con el servidor.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal
            open={open}
            title={editing ? "Editar rol personalizado" : "Nuevo rol personalizado"}
            subtitle="Define permisos de datos e interfaces visibles."
            onClose={onClose}
            wide
        >
            <form onSubmit={submit}>
                <div className="grid gap-4 p-5 sm:grid-cols-2">
                    <Field label="Nombre">
                        <input
                            className={inputClass}
                            value={form.nombre}
                            onChange={(e) => set("nombre", e.target.value)}
                            required
                        />
                    </Field>

                    <Field label="Slug">
                        <input
                            className={inputClass}
                            value={form.slug}
                            onChange={(e) =>
                                set(
                                    "slug",
                                    e.target.value
                                        .toLowerCase()
                                        .replace(/[^a-z0-9_-]/g, "-")
                                )
                            }
                            required
                        />
                    </Field>

                    <Field label="Descripción" full>
                        <textarea
                            className={`${inputClass} min-h-20 py-3`}
                            value={form.descripcion}
                            onChange={(e) => set("descripcion", e.target.value)}
                        />
                    </Field>

                    <div className="sm:col-span-2">
                        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.13em] text-slate-500">
                            Permisos
                        </p>

                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {PERMISSION_FIELDS.map(([key, label]) => (
                                <label
                                    key={key}
                                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700"
                                >
                                    <input
                                        type="checkbox"
                                        checked={Boolean(form[key])}
                                        onChange={(e) => set(key, e.target.checked)}
                                    />
                                    {label}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.13em] text-slate-500">
                            Interfaces por defecto
                        </p>

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {INTERFACES.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => toggleInterface(item.id)}
                                    className={`rounded-xl border px-3 py-3 text-xs font-bold ${form.interfaces.includes(item.id)
                                            ? "border-blue-200 bg-blue-50 text-blue-700"
                                            : "border-slate-200 bg-white text-slate-600"
                                        }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
                        <input
                            type="checkbox"
                            checked={Boolean(form.activo)}
                            onChange={(e) => set("activo", e.target.checked)}
                            className="h-4 w-4"
                        />
                        <span>
                            <b className="block text-xs text-slate-800">Rol activo</b>
                            <small className="text-[10px] text-slate-500">
                                Los roles inactivos no deberían utilizarse en nuevas asignaciones.
                            </small>
                        </span>
                    </label>

                    {error && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 sm:col-span-2">
                            {error}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 p-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600"
                    >
                        Cancelar
                    </button>

                    <button
                        disabled={saving}
                        className="rounded-xl bg-[#0a2f68] px-5 py-2 text-xs font-bold text-white disabled:opacity-50"
                    >
                        {saving ? "Guardando..." : "Guardar rol"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export function Equipo() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [query, setQuery] = useState("");
    const [roleQuery, setRoleQuery] = useState("");
    const [tab, setTab] = useState("usuarios");
    const [loading, setLoading] = useState(true);

    const [userModal, setUserModal] = useState({
        open: false,
        user: null,
    });

    const [roleModal, setRoleModal] = useState({
        open: false,
        role: null,
    });

    const [accessUser, setAccessUser] = useState(null);
    const [confirmUser, setConfirmUser] = useState(null);
    const [confirmRole, setConfirmRole] = useState(null);

    const [message, setMessage] = useState({
        open: false,
        title: "",
        message: "",
    });

    async function load() {
        setLoading(true);

        try {
            const [usersResponse, rolesResponse] = await Promise.all([
                apiFetch("/api/staff/"),
                apiFetch("/api/roles/"),
            ]);

            const [usersData, rolesData] = await Promise.all([
                readJson(usersResponse),
                readJson(rolesResponse),
            ]);

            if (!usersResponse.ok || !rolesResponse.ok) {
                throw new Error(
                    errorText(
                        !usersResponse.ok ? usersData : rolesData,
                        "No se pudo cargar la configuración del equipo."
                    )
                );
            }

            setUsers(
                Array.isArray(usersData)
                    ? usersData
                    : usersData?.results || []
            );

            setRoles(
                Array.isArray(rolesData)
                    ? rolesData
                    : rolesData?.results || []
            );
        } catch (error) {
            setMessage({
                open: true,
                title: "Equipo",
                message:
                    error.message ||
                    "No se pudo cargar el equipo.",
            });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    const filteredUsers = useMemo(() => {
        const q = query.trim().toLowerCase();

        if (!q) return users;

        return users.filter((user) =>
            `${user.first_name || ""} ${user.last_name || ""} ${user.username || ""
                } ${user.email || ""} ${roleLabel(user)}`
                .toLowerCase()
                .includes(q)
        );
    }, [users, query]);

    const roleRows = useMemo(() => {
        const baseRows = BASE_ROLES
            .filter((role) => role.value !== "personalizado")
            .map((role) => ({
                key: `base-${role.value}`,
                id: null,
                tipo: "sistema",
                slug: role.value,
                nombre: role.label,
                descripcion: "Rol integrado del sistema.",
                interfaces: BASE_ROLE_INTERFACES[role.value] || [],
                activo: true,
                usuarios: users.filter(
                    (user) =>
                        user.rol_base_out === role.value ||
                        (
                            !user.rol_base_out &&
                            user.rol_out === role.value
                        )
                ).length,
                raw: null,
            }));

        const customRows = roles.map((role) => ({
            key: `custom-${role.id}`,
            id: role.id,
            tipo: "personalizado",
            slug: role.slug,
            nombre: role.nombre,
            descripcion: role.descripcion || "Sin descripción.",
            interfaces: role.interfaces || [],
            activo: role.activo !== false,
            usuarios: users.filter(
                (user) =>
                    Number(user.rol_personalizado_out?.id) ===
                    Number(role.id)
            ).length,
            raw: role,
        }));

        return [...baseRows, ...customRows];
    }, [roles, users]);

    const filteredRoleRows = useMemo(() => {
        const q = roleQuery.trim().toLowerCase();

        if (!q) return roleRows;

        return roleRows.filter((role) =>
            `${role.nombre} ${role.slug} ${role.tipo} ${role.descripcion}`
                .toLowerCase()
                .includes(q)
        );
    }, [roleRows, roleQuery]);

    async function removeUser() {
        const user = confirmUser;
        setConfirmUser(null);

        if (!user) return;

        try {
            const response = await apiFetch(
                `/api/staff/${user.id}/`,
                { method: "DELETE" }
            );

            if (!response.ok && response.status !== 204) {
                throw new Error("No se pudo eliminar el usuario.");
            }

            setUsers((prev) =>
                prev.filter((item) => item.id !== user.id)
            );
        } catch (error) {
            setMessage({
                open: true,
                title: "Eliminar usuario",
                message: error.message,
            });
        }
    }

    async function removeRole() {
        const role = confirmRole;
        setConfirmRole(null);

        if (!role?.id) return;

        try {
            const response = await apiFetch(
                `/api/roles/${role.id}/`,
                { method: "DELETE" }
            );

            const data = await readJson(response);

            if (!response.ok && response.status !== 204) {
                throw new Error(
                    errorText(
                        data,
                        "No se pudo eliminar el rol."
                    )
                );
            }

            setRoles((prev) =>
                prev.filter((item) => item.id !== role.id)
            );
        } catch (error) {
            setMessage({
                open: true,
                title: "Eliminar rol",
                message: error.message,
            });
        }
    }

    return (
        <div className="min-h-full bg-[#f6f8fc] p-4 sm:p-6">
            <div className="mx-auto max-w-full space-y-4 px-0 sm:px-4 xl:px-8">
                <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#071d44] via-[#0a2f68] to-[#1746D1] p-5 text-white shadow-[0_18px_50px_rgba(7,29,68,.2)] sm:p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-blue-100">
                                <UserRoundCog className="h-3.5 w-3.5" />
                                Administración
                            </span>

                            <h2 className="mt-3 text-2xl font-black tracking-tight">
                                Equipo y accesos
                            </h2>

                            <p className="mt-1 text-xs text-blue-100/65">
                                Usuarios, roles, permisos e interfaces disponibles.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-2xl bg-white/10 px-4 py-3">
                                <b className="block text-xl">
                                    {users.length}
                                </b>
                                <span className="text-[10px] text-blue-100/60">
                                    usuarios
                                </span>
                            </div>

                            <div className="rounded-2xl bg-white/10 px-4 py-3">
                                <b className="block text-xl">
                                    {roleRows.length}
                                </b>
                                <span className="text-[10px] text-blue-100/60">
                                    roles
                                </span>
                            </div>

                            <div className="rounded-2xl bg-white/10 px-4 py-3">
                                <b className="block text-xl">
                                    {
                                        users.filter(
                                            (user) =>
                                                user.is_active !== false
                                        ).length
                                    }
                                </b>
                                <span className="text-[10px] text-blue-100/60">
                                    activos
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                    <div className="flex gap-1">
                        {[
                            ["usuarios", "Usuarios", UsersRound],
                            ["roles", "Roles", ShieldCheck],
                        ].map(([id, label, Icon]) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setTab(id)}
                                className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-bold ${tab === id
                                        ? "bg-[#0a2f68] text-white"
                                        : "text-slate-600 hover:bg-slate-50"
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={load}
                        disabled={loading}
                        className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${loading ? "animate-spin" : ""
                                }`}
                        />
                    </button>
                </div>

                {tab === "usuarios" ? (
                    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="relative min-w-0 flex-1 sm:max-w-md">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                <input
                                    value={query}
                                    onChange={(e) =>
                                        setQuery(e.target.value)
                                    }
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-blue-300 focus:bg-white"
                                    placeholder="Buscar usuario, correo o rol..."
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setUserModal({
                                        open: true,
                                        user: null,
                                    })
                                }
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1746D1] px-4 text-xs font-bold text-white shadow-lg shadow-blue-600/15"
                            >
                                <Plus className="h-4 w-4" />
                                Nuevo usuario
                            </button>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {filteredUsers.map((user) => (
                                <article
                                    key={user.id}
                                    className="grid gap-3 p-4 transition hover:bg-slate-50/70 lg:grid-cols-[minmax(240px,1.4fr)_minmax(180px,.9fr)_minmax(220px,1fr)_auto] lg:items-center"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <Avatar user={user} />

                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-black text-slate-900">
                                                {`${user.first_name || ""} ${user.last_name || ""
                                                    }`.trim() ||
                                                    user.username}
                                            </p>

                                            <p className="mt-0.5 truncate text-[11px] text-slate-500">
                                                @{user.username} ·{" "}
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                                            {roleLabel(user)}
                                        </span>

                                        <p className="mt-1 text-[10px] text-slate-400">
                                            {user.is_active === false
                                                ? "Acceso desactivado"
                                                : "Cuenta activa"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                            Interfaces
                                        </p>

                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {(user.interfaces_out || [])
                                                .slice(0, 4)
                                                .map((item) => (
                                                    <span
                                                        key={item}
                                                        className="rounded-md bg-slate-100 px-1.5 py-1 text-[9px] font-bold text-slate-600"
                                                    >
                                                        {interfaceLabel(
                                                            item
                                                        )}
                                                    </span>
                                                ))}

                                            {(user.interfaces_out || [])
                                                .length > 4 && (
                                                    <span className="rounded-md bg-slate-100 px-1.5 py-1 text-[9px] font-bold text-slate-500">
                                                        +
                                                        {user.interfaces_out
                                                            .length - 4}
                                                    </span>
                                                )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setAccessUser(user)
                                            }
                                            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                            title="Interfaces"
                                        >
                                            <Layers3 className="h-4 w-4" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setUserModal({
                                                    open: true,
                                                    user,
                                                })
                                            }
                                            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                            title="Editar"
                                        >
                                            <Edit3 className="h-4 w-4" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setConfirmUser(user)
                                            }
                                            className="grid h-9 w-9 place-items-center rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </article>
                            ))}

                            {!filteredUsers.length && (
                                <div className="p-10 text-center text-sm text-slate-400">
                                    No hay usuarios para mostrar.
                                </div>
                            )}
                        </div>
                    </section>
                ) : (
                    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="relative min-w-0 flex-1 sm:max-w-md">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                <input
                                    value={roleQuery}
                                    onChange={(e) =>
                                        setRoleQuery(e.target.value)
                                    }
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-blue-300 focus:bg-white"
                                    placeholder="Buscar rol..."
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setRoleModal({
                                        open: true,
                                        role: null,
                                    })
                                }
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1746D1] px-4 text-xs font-bold text-white shadow-lg shadow-blue-600/15"
                            >
                                <Plus className="h-4 w-4" />
                                Nuevo rol
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[980px] text-left">
                                <thead className="border-b border-slate-100 bg-slate-50">
                                    <tr className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                                        <th className="px-5 py-3">
                                            Rol
                                        </th>
                                        <th className="px-4 py-3">
                                            Tipo
                                        </th>
                                        <th className="px-4 py-3">
                                            Interfaces
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Usuarios
                                        </th>
                                        <th className="px-4 py-3">
                                            Estado
                                        </th>
                                        <th className="px-5 py-3 text-right">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {filteredRoleRows.map(
                                        (role) => (
                                            <tr
                                                key={role.key}
                                                className="transition hover:bg-slate-50/70"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <span
                                                            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${role.tipo ===
                                                                    "sistema"
                                                                    ? "bg-blue-50 text-blue-700"
                                                                    : "bg-violet-50 text-violet-700"
                                                                }`}
                                                        >
                                                            <ShieldCheck className="h-5 w-5" />
                                                        </span>

                                                        <div className="min-w-0">
                                                            <p className="font-black text-slate-900">
                                                                {
                                                                    role.nombre
                                                                }
                                                            </p>

                                                            <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                                                {
                                                                    role.slug
                                                                }
                                                            </p>

                                                            <p className="mt-1 max-w-[320px] truncate text-[10px] text-slate-500">
                                                                {
                                                                    role.descripcion
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${role.tipo ===
                                                                "sistema"
                                                                ? "border-blue-100 bg-blue-50 text-blue-700"
                                                                : "border-violet-100 bg-violet-50 text-violet-700"
                                                            }`}
                                                    >
                                                        {role.tipo ===
                                                            "sistema"
                                                            ? "Sistema"
                                                            : "Personalizado"}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-4">
                                                    <div className="flex max-w-[360px] flex-wrap gap-1">
                                                        {role.interfaces
                                                            .slice(0, 5)
                                                            .map(
                                                                (
                                                                    item
                                                                ) => (
                                                                    <span
                                                                        key={
                                                                            item
                                                                        }
                                                                        className="rounded-md bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-600"
                                                                    >
                                                                        {interfaceLabel(
                                                                            item
                                                                        )}
                                                                    </span>
                                                                )
                                                            )}

                                                        {role
                                                            .interfaces
                                                            .length >
                                                            5 && (
                                                                <span className="rounded-md bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-500">
                                                                    +
                                                                    {role
                                                                        .interfaces
                                                                        .length -
                                                                        5}
                                                                </span>
                                                            )}

                                                        {!role
                                                            .interfaces
                                                            .length && (
                                                                <span className="text-[10px] text-slate-400">
                                                                    Sin
                                                                    interfaces
                                                                </span>
                                                            )}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4 text-center">
                                                    <span className="inline-flex min-w-8 justify-center rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-700">
                                                        {
                                                            role.usuarios
                                                        }
                                                    </span>
                                                </td>

                                                <td className="px-4 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${role.activo
                                                                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                                                                : "border-slate-200 bg-slate-100 text-slate-500"
                                                            }`}
                                                    >
                                                        {role.activo
                                                            ? "Activo"
                                                            : "Inactivo"}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        {role.tipo ===
                                                            "personalizado" ? (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setRoleModal(
                                                                            {
                                                                                open: true,
                                                                                role: role.raw,
                                                                            }
                                                                        )
                                                                    }
                                                                    className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                                                    title="Editar rol"
                                                                >
                                                                    <Edit3 className="h-4 w-4" />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setConfirmRole(
                                                                            role.raw
                                                                        )
                                                                    }
                                                                    className="grid h-9 w-9 place-items-center rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50"
                                                                    title="Eliminar rol"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <span className="rounded-lg bg-slate-100 px-3 py-2 text-[9px] font-bold text-slate-400">
                                                                Protegido
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    )}

                                    {!filteredRoleRows.length && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-5 py-12 text-center text-sm text-slate-400"
                                            >
                                                No hay roles para
                                                mostrar.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
                            <p className="text-[10px] text-slate-500">
                                Los roles del sistema no pueden
                                eliminarse. Los roles personalizados
                                pueden editarse o eliminarse siempre
                                que no estén asignados a usuarios.
                            </p>
                        </div>
                    </section>
                )}
            </div>

            <UserModal
                open={userModal.open}
                user={userModal.user}
                roles={roles}
                onClose={() =>
                    setUserModal({
                        open: false,
                        user: null,
                    })
                }
                onSaved={() => {
                    setUserModal({
                        open: false,
                        user: null,
                    });
                    load();
                }}
            />

            <RoleModal
                open={roleModal.open}
                role={roleModal.role}
                onClose={() =>
                    setRoleModal({
                        open: false,
                        role: null,
                    })
                }
                onSaved={() => {
                    setRoleModal({
                        open: false,
                        role: null,
                    });
                    load();
                }}
            />

            <AccessModal
                open={Boolean(accessUser)}
                user={accessUser}
                onClose={() => setAccessUser(null)}
                onSaved={() => {
                    setAccessUser(null);
                    load();
                }}
            />

            <Modal
                open={Boolean(confirmUser)}
                title="Eliminar usuario"
                subtitle="Esta acción no se puede deshacer."
                onClose={() => setConfirmUser(null)}
            >
                <div className="p-5 text-sm text-slate-600">
                    ¿Eliminar a{" "}
                    <b>{confirmUser?.username}</b> del
                    equipo?
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 p-4">
                    <button
                        type="button"
                        onClick={() =>
                            setConfirmUser(null)
                        }
                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600"
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        onClick={removeUser}
                        className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white"
                    >
                        Eliminar
                    </button>
                </div>
            </Modal>

            <Modal
                open={Boolean(confirmRole)}
                title="Eliminar rol"
                subtitle="No podrás eliminarlo si está siendo utilizado."
                onClose={() => setConfirmRole(null)}
            >
                <div className="p-5 text-sm text-slate-600">
                    ¿Eliminar el rol{" "}
                    <b>{confirmRole?.nombre}</b>?
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 p-4">
                    <button
                        type="button"
                        onClick={() =>
                            setConfirmRole(null)
                        }
                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600"
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        onClick={removeRole}
                        className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white"
                    >
                        Eliminar
                    </button>
                </div>
            </Modal>

            <Message
                data={message}
                onClose={() =>
                    setMessage({
                        open: false,
                        title: "",
                        message: "",
                    })
                }
            />
        </div>
    );
}