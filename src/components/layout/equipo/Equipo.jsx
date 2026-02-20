import { useEffect, useMemo, useState } from "react";
import {
    UserPlus,
    Trash2,
    RotateCcw,
    Users,
    Shield,
    Mail,
    Phone,
    Image as ImgIcon,
    AlignLeft,
    X,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

function normalize(str) {
    return String(str || "").trim();
}
function isEmailValid(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalize(email).toLowerCase());
}
function isPhoneValid(phone) {
    const digits = normalize(phone).replace(/\D/g, "");
    return digits.length >= 8;
}

const ROLES = [
    { value: "fisioterapeuta", label: "Fisioterapeuta" },
    { value: "nutriologo", label: "Nutriólogo" },
    { value: "dentista", label: "Dentista" },
    { value: "recepcion", label: "Recepción" },
    { value: "admin", label: "Administrador" },
];

async function apiFetch(path, options = {}) {
    const access = localStorage.getItem("auth.access");
    const refresh = localStorage.getItem("auth.refresh");

    const headers = { ...(options.headers || {}) };
    if (access) headers.Authorization = `Bearer ${access}`;

    let resp = await fetch(`${API_BASE}${path}`, { ...options, headers });

    if (resp.status === 401 && refresh) {
        const r = await fetch(`${API_BASE}/api/auth/token/refresh/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh }),
        });

        if (r.ok) {
            const data = await r.json();
            localStorage.setItem("auth.access", data.access);
            headers.Authorization = `Bearer ${data.access}`;
            resp = await fetch(`${API_BASE}${path}`, { ...options, headers });
        } else {
            localStorage.removeItem("auth.access");
            localStorage.removeItem("auth.refresh");
            localStorage.removeItem("auth.user");
            window.location.href = "/login";
            return resp;
        }
    }
    return resp;
}

/* =========================
   Modales simples (sin alert/confirm)
   ========================= */
function ModalShell({ title, children, onClose, actions }) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <p className="text-sm font-semibold text-slate-900">{title}</p>
                    <button
                        onClick={onClose}
                        className="rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                    >
                        Cerrar
                    </button>
                </div>
                <div className="px-5 py-4 text-sm text-slate-700">{children}</div>
                <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
                    {actions}
                </div>
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

function ConfirmModal({ open, title, message, danger, onCancel, onConfirm }) {
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
            {message}
        </ModalShell>
    );
}

export function Equipo() {
    const [form, setForm] = useState({
        nombres: "",
        apellidos: "",
        usuario: "",
        correo: "",
        telefono: "",
        rol: "fisioterapeuta",
        password: "",
        descripcion: "",
        foto: null,
    });

    const [users, setUsers] = useState([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);

    const [info, setInfo] = useState({ open: false, title: "", message: "" });
    const [confirm, setConfirm] = useState({ open: false, userId: null });

    const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

    const limpiar = () => {
        setForm({
            nombres: "",
            apellidos: "",
            usuario: "",
            correo: "",
            telefono: "",
            rol: "fisioterapeuta",
            password: "",
            descripcion: "",
            foto: null,
        });
    };

    const roleLabel = (value) => ROLES.find((r) => r.value === value)?.label || value;

    const validar = () => {
        const nombres = normalize(form.nombres);
        const apellidos = normalize(form.apellidos);
        const usuario = normalize(form.usuario);
        const correo = normalize(form.correo);
        const telefono = normalize(form.telefono);
        const password = String(form.password || "");
        const descripcion = normalize(form.descripcion);

        if (!nombres) return "Ingresa nombres.";
        if (!apellidos) return "Ingresa apellidos.";
        if (!usuario) return "Ingresa usuario.";
        if (!correo) return "Ingresa correo.";
        if (!isEmailValid(correo)) return "El correo no parece válido.";
        if (!telefono) return "Ingresa teléfono.";
        if (!isPhoneValid(telefono)) return "El teléfono no parece válido.";
        if (!form.rol) return "Selecciona un rol.";
        if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
        if (descripcion.length > 500) return "La descripción es muy larga (máx 500 chars).";

        return null;
    };

    async function cargar() {
        setLoading(true);
        try {
            const resp = await apiFetch("/api/staff/");
            if (!resp.ok) {
                const t = await resp.text();
                console.error("STAFF LIST ERROR:", resp.status, t);
                setUsers([]);
                return;
            }
            const data = await resp.json();
            const mapped = (Array.isArray(data) ? data : []).map((u) => ({
                ...u,
                rol: u.rol_out ?? u.rol,
                telefono: u.telefono_out ?? u.telefono,
                descripcion: u.descripcion_out ?? u.descripcion,
            }));
            setUsers(mapped);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        cargar();
    }, []);

    const darAlta = async () => {
        const err = validar();
        if (err) return setInfo({ open: true, title: "Validación", message: err });

        const fd = new FormData();
        fd.append("username", normalize(form.usuario));
        fd.append("first_name", normalize(form.nombres));
        fd.append("last_name", normalize(form.apellidos));
        fd.append("email", normalize(form.correo).toLowerCase());
        fd.append("password", String(form.password));
        fd.append("rol", form.rol);
        fd.append("telefono", normalize(form.telefono));
        fd.append("descripcion", normalize(form.descripcion));
        if (form.foto) fd.append("foto", form.foto);

        setLoading(true);
        try {
            const resp = await apiFetch("/api/staff/", {
                method: "POST",
                body: fd,
                headers: {}, // importante: no Content-Type
            });

            if (!resp.ok) {
                const txt = await resp.text();
                console.error("STAFF CREATE ERROR:", resp.status, txt);
                setInfo({
                    open: true,
                    title: "Error",
                    message: `No se pudo crear. HTTP ${resp.status}. Revisa consola.`,
                });
                return;
            }

            await cargar();
            limpiar();
            setInfo({ open: true, title: "Listo", message: "Usuario creado." });
        } finally {
            setLoading(false);
        }
    };

    const pedirEliminar = (id) => setConfirm({ open: true, userId: id });

    const eliminar = async () => {
        const id = confirm.userId;
        setConfirm({ open: false, userId: null });

        if (!id) return;

        setLoading(true);
        try {
            const resp = await apiFetch(`/api/staff/${id}/`, { method: "DELETE" });
            if (!resp.ok) {
                setInfo({ open: true, title: "Error", message: "No se pudo eliminar." });
                return;
            }
            setUsers((prev) => prev.filter((u) => u.id !== id));
            setInfo({ open: true, title: "Listo", message: "Usuario eliminado." });
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = useMemo(() => {
        const q = normalize(query).toLowerCase();
        if (!q) return users;
        return users.filter((u) => {
            const nombre = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
            return (
                nombre.includes(q) ||
                String(u.username || "").toLowerCase().includes(q) ||
                String(u.email || "").toLowerCase().includes(q) ||
                roleLabel(u.rol).toLowerCase().includes(q)
            );
        });
    }, [users, query]);

    return (
        <div className="w-full overflow-auto">
            <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <Users className="h-5 w-5 text-violet-600" />
                            Equipo de la clínica
                        </h2>
                        <p className="text-xs text-slate-500">
                            Da de alta miembros del equipo (esta info también se mostrará en la página “Nuestro equipo”).
                        </p>
                    </div>
                    {loading ? <span className="text-xs text-slate-500">Procesando…</span> : null}
                </div>

                {/* Formulario */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                        <p className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                            <UserPlus className="h-4 w-4 text-violet-600" />
                            Alta de usuario
                        </p>
                    </div>

                    <div className="p-4 space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                            <Field label="Nombres">
                                <input
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                                    value={form.nombres}
                                    onChange={(e) => handleChange("nombres", e.target.value)}
                                    placeholder="Ej. Juan Carlos"
                                />
                            </Field>

                            <Field label="Apellidos">
                                <input
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                                    value={form.apellidos}
                                    onChange={(e) => handleChange("apellidos", e.target.value)}
                                    placeholder="Ej. Pérez López"
                                />
                            </Field>

                            <Field label="Usuario">
                                <input
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                                    value={form.usuario}
                                    onChange={(e) => handleChange("usuario", e.target.value)}
                                    placeholder="Ej. jperez"
                                />
                            </Field>

                            <div className="lg:col-span-2">
                                <Field label="Correo">
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                        <input
                                            className="w-full pl-9 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                                            value={form.correo}
                                            onChange={(e) => handleChange("correo", e.target.value)}
                                            placeholder="Ej. usuario@gmail.com"
                                        />
                                    </div>
                                </Field>
                            </div>

                            <Field label="Teléfono">
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <input
                                        className="w-full pl-9 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                                        value={form.telefono}
                                        onChange={(e) => handleChange("telefono", e.target.value)}
                                        placeholder="Ej. 55 1234 5678"
                                    />
                                </div>
                            </Field>

                            <Field label="Rol">
                                <div className="relative">
                                    <Shield className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <select
                                        className="w-full pl-9 rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-slate-400"
                                        value={form.rol}
                                        onChange={(e) => handleChange("rol", e.target.value)}
                                    >
                                        {ROLES.map((r) => (
                                            <option key={r.value} value={r.value}>
                                                {r.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </Field>

                            <Field label="Contraseña">
                                <input
                                    type="password"
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                                    value={form.password}
                                    onChange={(e) => handleChange("password", e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </Field>

                            <div className="lg:col-span-2">
                                <Field label="Descripción">
                                    <div className="relative">
                                        <AlignLeft className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                        <textarea
                                            className="w-full pl-9 min-h-[44px] rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                                            value={form.descripcion}
                                            onChange={(e) => handleChange("descripcion", e.target.value)}
                                            placeholder="Breve presentación (se mostrará en la sección pública)."
                                        />
                                    </div>
                                </Field>
                            </div>

                            <Field label="Foto">
                                <div className="relative">
                                    <ImgIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="w-full pl-9 rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-slate-400"
                                        onChange={(e) => handleChange("foto", e.target.files?.[0] || null)}
                                    />
                                </div>
                                {form.foto ? (
                                    <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                        <p className="min-w-0 truncate text-xs text-slate-600">
                                            <b>Seleccionado:</b> {form.foto.name}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => handleChange("foto", null)}
                                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
                                        >
                                            <X size={14} />
                                            Quitar
                                        </button>
                                    </div>
                                ) : null}
                            </Field>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                            <button
                                type="button"
                                onClick={limpiar}
                                className="h-10 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center gap-2 text-sm"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Limpiar
                            </button>

                            <button
                                type="button"
                                onClick={darAlta}
                                disabled={loading}
                                className="h-10 px-5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60 inline-flex items-center justify-center gap-2 text-sm font-semibold"
                            >
                                <UserPlus className="h-4 w-4" />
                                Dar alta
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabla usuarios */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-700">Usuarios dados de alta</p>
                            <p className="text-[11px] text-slate-500">Total: {users.length} usuario(s)</p>
                        </div>
                        <input
                            className="w-full sm:w-72 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar por nombre, usuario, correo o rol…"
                        />
                    </div>

                    {/* ✅ clave: overflow-x-auto para móvil */}
                    <div className="p-4 overflow-x-auto">
                        <table className="min-w-[980px] w-full text-left border-separate border-spacing-y-1">
                            <thead>
                                <tr className="text-[11px] text-slate-500">
                                    <th className="px-3 py-2">Foto</th>
                                    <th className="px-3 py-2">Nombre</th>
                                    <th className="px-3 py-2">Usuario</th>
                                    <th className="px-3 py-2">Correo</th>
                                    <th className="px-3 py-2">Teléfono</th>
                                    <th className="px-3 py-2">Rol</th>
                                    <th className="px-3 py-2">Descripción</th>
                                    <th className="px-3 py-2 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((u) => (
                                    <tr key={u.id} className="bg-slate-50/70 hover:bg-slate-100/80">
                                        <td className="px-3 py-2">
                                            <div className="h-9 w-9 rounded-full overflow-hidden border border-slate-200 bg-white">
                                                {u.foto_url ? (
                                                    <img src={u.foto_url} alt="foto" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full grid place-items-center text-[10px] text-slate-400">N/A</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-sm text-slate-800 font-semibold">
                                            {u.first_name} {u.last_name}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-slate-700">{u.username}</td>
                                        <td className="px-3 py-2 text-sm text-slate-700">{u.email}</td>
                                        <td className="px-3 py-2 text-sm text-slate-700">{u.telefono || "-"}</td>
                                        <td className="px-3 py-2">
                                            <span className="text-[11px] px-2 py-1 rounded-full border border-violet-200 bg-violet-50 text-violet-700">
                                                {roleLabel(u.rol)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-sm text-slate-700 max-w-[320px]">
                                            <span className="line-clamp-2">{u.descripcion || "-"}</span>
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <button
                                                type="button"
                                                onClick={() => pedirEliminar(u.id)}
                                                className="inline-flex items-center gap-2 text-[11px] px-3 py-1.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {!filteredUsers.length && (
                                    <tr>
                                        <td colSpan={8} className="px-3 py-8 text-center text-slate-400 text-sm">
                                            No hay usuarios que coincidan con la búsqueda.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        <p className="mt-3 text-[11px] text-slate-500">
                            * La foto, rol y descripción se usarán para la sección pública “Nuestro equipo”.
                        </p>
                    </div>
                </div>
            </div>

            <InfoModal
                open={info.open}
                title={info.title}
                message={info.message}
                onClose={() => setInfo({ open: false, title: "", message: "" })}
            />

            <ConfirmModal
                open={confirm.open}
                title="Eliminar usuario"
                message="¿Seguro que quieres eliminar este usuario del equipo? Esta acción no se puede deshacer."
                danger
                onCancel={() => setConfirm({ open: false, userId: null })}
                onConfirm={eliminar}
            />
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div className="grid gap-1">
            <label className="block text-[11px] font-semibold text-slate-600">{label}</label>
            {children}
        </div>
    );
}