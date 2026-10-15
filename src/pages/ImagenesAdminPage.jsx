import { useCallback, useEffect, useState } from "react";
import { ImagePlus, RotateCcw, Save, Trash2, UploadCloud } from "lucide-react";
import { apiFetch } from "../services/apiFetch";
import { IMAGENES_FIJAS } from "../shared/imagenesSitio";

const API = "/api/imagenes-sitio/";
const MAX_BYTES = 5 * 1024 * 1024;
const FORMATOS = ["image/jpeg", "image/png", "image/webp"];
const GRUPOS = [
    { id: "inicio", nombre: "Inicio" },
    { id: "convenios", nombre: "Convenios" },
    { id: "marca", nombre: "Logos" },
    { id: "servicios", nombre: "Servicios" },
];

async function respuestaJson(respuesta) {
    const contenido = await respuesta.json().catch(() => null);
    if (respuesta.ok) return contenido;
    const detalle = contenido?.detail || contenido?.imagen?.[0] || contenido?.clave?.[0];
    throw new Error(detalle || `No se pudo completar la operación (HTTP ${respuesta.status}).`);
}

function validarArchivo(archivo) {
    if (!archivo) return;
    if (!FORMATOS.includes(archivo.type)) throw new Error("Selecciona una imagen JPG, PNG o WebP.");
    if (archivo.size > MAX_BYTES) throw new Error("La imagen no debe superar 5 MB.");
}

function ImagenEditor({ slot, registro, onGuardar, onRestaurar, ocupado }) {
    const [archivo, setArchivo] = useState(null);
    const [titulo, setTitulo] = useState(registro?.titulo || slot.titulo);
    const [orden, setOrden] = useState(registro?.orden ?? slot.orden);
    const [activo, setActivo] = useState(registro?.activo ?? true);
    const imagenVisible = activo ? registro?.imagen_url || slot.respaldo : null;
    const esExtra = slot.clave.startsWith("convenios.extra.");

    async function guardar() {
        const correcto = await onGuardar({ slot, registro, archivo, titulo, orden, activo });
        if (correcto) setArchivo(null);
    }

    return (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="aspect-video w-full bg-slate-100">
                {imagenVisible ? (
                    <img src={imagenVisible} alt={titulo} className="h-full w-full object-contain" loading="lazy" />
                ) : (
                    <div className="grid h-full place-items-center text-sm text-slate-500">Imagen oculta</div>
                )}
            </div>
            <div className="space-y-3 p-4">
                <p className="break-all text-xs text-slate-400">{slot.clave}</p>
                <label className="block text-sm font-medium text-slate-700">
                    Descripción
                    <input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={120}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                </label>
                <div className="flex items-center gap-4">
                    <label className="block min-w-0 flex-1 text-sm font-medium text-slate-700">
                        Orden
                        <input type="number" min="0" value={orden} onChange={(e) => setOrden(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                    </label>
                    <label className="mt-5 flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
                        Visible
                    </label>
                </div>
                <label className="block text-sm font-medium text-slate-700">
                    Reemplazar imagen
                    <input type="file" accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                        className="mt-1 block w-full text-xs text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-blue-700" />
                </label>
                {archivo && <p className="truncate text-xs text-slate-500">Seleccionada: {archivo.name}</p>}
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={guardar} disabled={ocupado}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#004aad] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">
                        <Save className="h-4 w-4" /> Guardar
                    </button>
                    {registro && (
                        <button type="button" onClick={() => onRestaurar(registro, esExtra)} disabled={ocupado}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50">
                            {esExtra ? <Trash2 className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                            {esExtra ? "Eliminar" : "Restaurar original"}
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
}

export default function ImagenesAdminPage() {
    const [grupo, setGrupo] = useState("inicio");
    const [registros, setRegistros] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [ocupado, setOcupado] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [error, setError] = useState("");
    const [nuevoTitulo, setNuevoTitulo] = useState("");
    const [nuevoOrden, setNuevoOrden] = useState(100);
    const [nuevoArchivo, setNuevoArchivo] = useState(null);

    const cargar = useCallback(async () => {
        const datos = await respuestaJson(await apiFetch(API));
        setRegistros(Array.isArray(datos) ? datos : datos?.results || []);
    }, []);

    useEffect(() => {
        let vivo = true;
        async function iniciar() {
            try {
                await cargar();
            } catch (e) {
                if (vivo) setError(e.message);
            } finally {
                if (vivo) setCargando(false);
            }
        }
        iniciar();
        return () => { vivo = false; };
    }, [cargar]);

    async function guardarImagen({ slot, registro, archivo, titulo, orden, activo }) {
        setError("");
        setMensaje("");
        try {
            validarArchivo(archivo);
            if (!registro && !archivo && activo) {
                throw new Error("Selecciona una imagen o desmarca Visible para ocultar el recurso original.");
            }
            const formulario = new FormData();
            formulario.append("titulo", titulo.trim() || slot.titulo);
            formulario.append("orden", String(Number(orden) || 0));
            formulario.append("activo", activo ? "true" : "false");
            if (archivo) formulario.append("imagen", archivo);
            if (!registro) {
                formulario.append("clave", slot.clave);
                formulario.append("grupo", slot.grupo);
            }
            setOcupado(true);
            await respuestaJson(await apiFetch(registro ? `${API}${registro.id}/` : API, {
                method: registro ? "PATCH" : "POST",
                body: formulario,
            }));
            await cargar();
            setMensaje(`Se actualizó «${titulo.trim() || slot.titulo}».`);
            return true;
        } catch (e) {
            setError(e.message);
            return false;
        } finally {
            setOcupado(false);
        }
    }

    async function restaurarImagen(registro, extra) {
        if (!window.confirm(extra ? "¿Eliminar este logo de convenio?" : "¿Restaurar la imagen original de public/?")) return;
        setOcupado(true);
        setError("");
        setMensaje("");
        try {
            await respuestaJson(await apiFetch(`${API}${registro.id}/`, { method: "DELETE" }));
            await cargar();
            setMensaje(extra ? "Logo eliminado." : "Se restauró la imagen original.");
        } catch (e) {
            setError(e.message);
        } finally {
            setOcupado(false);
        }
    }

    async function agregarConvenio(evento) {
        evento.preventDefault();
        const formularioHTML = evento.currentTarget;
        setError("");
        setMensaje("");
        try {
            if (!nuevoArchivo) throw new Error("Selecciona la imagen del nuevo convenio.");
            validarArchivo(nuevoArchivo);
            const formulario = new FormData();
            formulario.append("grupo", "convenios");
            formulario.append("titulo", nuevoTitulo.trim() || "Nuevo convenio");
            formulario.append("orden", String(Number(nuevoOrden) || 0));
            formulario.append("activo", "true");
            formulario.append("imagen", nuevoArchivo);
            setOcupado(true);
            await respuestaJson(await apiFetch(API, { method: "POST", body: formulario }));
            await cargar();
            setNuevoTitulo("");
            setNuevoOrden((numero) => Number(numero) + 1);
            setNuevoArchivo(null);
            formularioHTML.reset();
            setMensaje("Convenio agregado correctamente.");
        } catch (e) {
            setError(e.message);
        } finally {
            setOcupado(false);
        }
    }

    const fijas = IMAGENES_FIJAS.filter((item) => item.grupo === grupo);
    const extras = grupo === "convenios"
        ? registros.filter((item) => item.clave.startsWith("convenios.extra.")).map((item) => ({
            clave: item.clave, titulo: item.titulo, grupo: "convenios", orden: item.orden, respaldo: "",
        }))
        : [];
    const porClave = new Map(registros.map((item) => [item.clave, item]));

    return (
        <section className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                    <ImagePlus className="h-6 w-6 text-[#004aad]" />
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Imágenes del sitio web</h2>
                        <p className="text-sm text-slate-600">Reemplaza, oculta o restaura imágenes sin modificar React. Solo JPG, PNG o WebP, máximo 5 MB.</p>
                    </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                    {GRUPOS.map((item) => (
                        <button key={item.id} type="button" onClick={() => setGrupo(item.id)}
                            className={`rounded-xl px-4 py-2 text-sm font-semibold ${grupo === item.id ? "bg-[#004aad] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                            {item.nombre}
                        </button>
                    ))}
                </div>
            </div>

            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            {mensaje && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{mensaje}</p>}
            {cargando ? <p className="text-sm text-slate-500">Cargando imágenes...</p> : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {[...fijas, ...extras].map((slot) => (
                        <ImagenEditor key={`${slot.clave}:${porClave.get(slot.clave)?.id ?? "original"}`}
                            slot={slot} registro={porClave.get(slot.clave)} ocupado={ocupado}
                            onGuardar={guardarImagen} onRestaurar={restaurarImagen} />
                    ))}
                </div>
            )}

            {grupo === "convenios" && (
                <form onSubmit={agregarConvenio} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="flex items-center gap-2 font-bold text-slate-900"><UploadCloud className="h-5 w-5" /> Agregar nuevo convenio</h3>
                    <div className="grid gap-3 md:grid-cols-3">
                        <label className="text-sm text-slate-700">Nombre
                            <input value={nuevoTitulo} onChange={(e) => setNuevoTitulo(e.target.value)} maxLength={120} placeholder="Nombre del aliado"
                                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
                        </label>
                        <label className="text-sm text-slate-700">Orden
                            <input type="number" min="0" value={nuevoOrden} onChange={(e) => setNuevoOrden(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
                        </label>
                        <label className="text-sm text-slate-700">Logo
                            <input type="file" required accept="image/jpeg,image/png,image/webp" onChange={(e) => setNuevoArchivo(e.target.files?.[0] || null)}
                                className="mt-1 w-full text-xs" />
                        </label>
                    </div>
                    <button type="submit" disabled={ocupado}
                        className="rounded-xl bg-[#004aad] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Agregar logo</button>
                </form>
            )}
            {grupo === "servicios" && (
                <p className="rounded-xl bg-slate-100 p-4 text-sm text-slate-600">
                    Esta sección administra la imagen predeterminada. Las fotografías particulares de cada tratamiento se editan desde «Servicios».
                </p>
            )}
        </section>
    );
}
