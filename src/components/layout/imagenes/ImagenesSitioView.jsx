import { useCallback, useEffect, useState } from "react";
import { ImagePlus, RotateCcw, Save, Trash2, UploadCloud } from "lucide-react";
import { apiFetch } from "../../../services/apiFetch";
import { IMAGENES_FIJAS } from "../../../shared/imagenesSitio";

const API = "/api/imagenes-sitio/";
const FORMATOS = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;
const GRUPOS = [
    { id: "inicio", nombre: "Inicio" },
    { id: "convenios", nombre: "Convenios" },
    { id: "marca", nombre: "Logos" },
    { id: "servicios", nombre: "Servicios" },
];

async function leerRespuesta(respuesta) {
    const datos = await respuesta.json().catch(() => null);
    if (respuesta.ok) return datos;
    let detalle = datos?.detail || `Error HTTP ${respuesta.status}`;
    if (datos && !datos.detail && typeof datos === "object") {
        const primerError = Object.values(datos)[0];
        detalle = Array.isArray(primerError) ? primerError[0] : String(primerError);
    }
    throw new Error(detalle);
}

function validarArchivo(archivo) {
    if (!archivo) return;
    if (!FORMATOS.includes(archivo.type)) {
        throw new Error("Solo se permiten imágenes JPG, PNG o WebP.");
    }
    if (archivo.size > MAX_BYTES) {
        throw new Error("La imagen no puede superar 5 MB.");
    }
}

function ImagenEditor({ posicion, registro, ocupado, alGuardar, alEliminar }) {
    const [archivo, setArchivo] = useState(null);
    const [vistaPrevia, setVistaPrevia] = useState(null);
    const [titulo, setTitulo] = useState(registro?.titulo ?? posicion.titulo);
    const [orden, setOrden] = useState(registro?.orden ?? posicion.orden);
    const [activo, setActivo] = useState(registro?.activo ?? true);
    const extra = posicion.clave.startsWith("convenios.extra.");
    const imagen = vistaPrevia || registro?.imagen_url || posicion.respaldo;

    useEffect(() => {
        if (!archivo) {
            setVistaPrevia(null);
            return;
        }
        const url = URL.createObjectURL(archivo);
        setVistaPrevia(url);
        return () => URL.revokeObjectURL(url);
    }, [archivo]);

    async function guardar() {
        const guardado = await alGuardar({ posicion, registro, titulo, orden, activo, archivo });
        if (guardado) setArchivo(null);
    }

    return (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex aspect-video items-center justify-center bg-slate-100">
                {activo && imagen ? (
                    <img src={imagen} alt={titulo} className="h-full w-full object-contain" loading="lazy" />
                ) : (
                    <span className="text-sm text-slate-500">Imagen oculta o no disponible</span>
                )}
            </div>
            <div className="space-y-3 p-4">
                <p className="break-all text-xs text-slate-400">{posicion.clave}</p>
                <label className="block text-sm font-medium text-slate-700">
                    Descripción
                    <input
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        maxLength={120}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                </label>
                <div className="flex items-center gap-4">
                    <label className="min-w-0 flex-1 text-sm font-medium text-slate-700">
                        Orden
                        <input
                            type="number"
                            min="0"
                            value={orden}
                            onChange={(e) => setOrden(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        />
                    </label>
                    <label className="mt-5 flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
                        Visible
                    </label>
                </div>
                <label className="block text-sm font-medium text-slate-700">
                    {registro?.imagen_url ? "Reemplazar imagen" : "Seleccionar imagen (opcional)"}
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                        className="mt-1 block w-full text-xs text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-blue-700"
                    />
                </label>
                {archivo && <p className="truncate text-xs text-slate-500">{archivo.name}</p>}
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={guardar}
                        disabled={ocupado}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#004aad] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" /> Guardar
                    </button>
                    {registro && (
                        <button
                            type="button"
                            onClick={() => alEliminar(registro, extra)}
                            disabled={ocupado}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
                        >
                            {extra ? <Trash2 className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                            {extra ? "Eliminar" : "Restaurar original"}
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
}

export default function ImagenesSitioView() {
    const [grupo, setGrupo] = useState("inicio");
    const [registros, setRegistros] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [ocupado, setOcupado] = useState(false);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [nuevoTitulo, setNuevoTitulo] = useState("");
    const [nuevoOrden, setNuevoOrden] = useState(100);
    const [nuevoArchivo, setNuevoArchivo] = useState(null);

    const cargar = useCallback(async () => {
        const respuesta = await apiFetch(API);
        const datos = await leerRespuesta(respuesta);
        setRegistros(Array.isArray(datos) ? datos : datos?.results ?? []);
    }, []);

    useEffect(() => {
        cargar()
            .catch((err) => setError(err.message))
            .finally(() => setCargando(false));
    }, [cargar]);

    async function guardarImagen({ posicion, registro, titulo, orden, activo, archivo }) {
        setError("");
        setMensaje("");
        try {
            validarArchivo(archivo);
            const datos = new FormData();
            datos.append("titulo", titulo.trim() || posicion.titulo);
            datos.append("orden", String(Math.max(0, Number(orden) || 0)));
            datos.append("activo", activo ? "true" : "false");
            if (archivo) datos.append("imagen", archivo);
            if (!registro) {
                datos.append("clave", posicion.clave);
                datos.append("grupo", posicion.grupo);
            }
            setOcupado(true);
            const url = registro ? `${API}${registro.id}/` : API;
            const respuesta = await apiFetch(url, {
                method: registro ? "PATCH" : "POST",
                body: datos,
            });
            await leerRespuesta(respuesta);
            await cargar();
            setMensaje("Los cambios se guardaron correctamente.");
            return true;
        } catch (err) {
            setError(err.message);
            return false;
        } finally {
            setOcupado(false);
        }
    }

    async function eliminarImagen(registro, extra) {
        const pregunta = extra
            ? "¿Eliminar este convenio del sitio web?"
            : "¿Restaurar la imagen original que está en public/?";
        if (!window.confirm(pregunta)) return;
        setError("");
        setMensaje("");
        setOcupado(true);
        try {
            const respuesta = await apiFetch(`${API}${registro.id}/`, { method: "DELETE" });
            await leerRespuesta(respuesta);
            await cargar();
            setMensaje(extra ? "Convenio eliminado." : "Imagen original restaurada.");
        } catch (err) {
            setError(err.message);
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
            if (!nuevoArchivo) throw new Error("Selecciona un logo.");
            validarArchivo(nuevoArchivo);
            const datos = new FormData();
            datos.append("grupo", "convenios");
            datos.append("titulo", nuevoTitulo.trim() || "Nuevo convenio");
            datos.append("orden", String(Math.max(0, Number(nuevoOrden) || 0)));
            datos.append("activo", "true");
            datos.append("imagen", nuevoArchivo);
            // El backend genera automáticamente convenios.extra.<uuid>.
            setOcupado(true);
            const respuesta = await apiFetch(API, { method: "POST", body: datos });
            await leerRespuesta(respuesta);
            await cargar();
            setNuevoArchivo(null);
            setNuevoTitulo("");
            setNuevoOrden((anterior) => Number(anterior) + 1);
            formularioHTML.reset();
            setMensaje("Convenio agregado correctamente.");
        } catch (err) {
            setError(err.message);
        } finally {
            setOcupado(false);
        }
    }

    const porClave = new Map(registros.map((registro) => [registro.clave, registro]));
    const fijas = IMAGENES_FIJAS.filter((posicion) => posicion.grupo === grupo);
    const extras = grupo === "convenios"
        ? registros.filter((item) => item.clave.startsWith("convenios.extra.")).map((item) => ({
            clave: item.clave, titulo: item.titulo, grupo: "convenios", orden: item.orden, respaldo: "",
        }))
        : [];
    const posiciones = [...fijas, ...extras].sort((a, b) =>
        (porClave.get(a.clave)?.orden ?? a.orden) - (porClave.get(b.clave)?.orden ?? b.orden)
    );

    return (
        <section className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                    <ImagePlus className="h-6 w-6 text-[#004aad]" />
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Imágenes de la página web</h2>
                        <p className="text-sm text-slate-600">Administra fotografías, logos y convenios. Formatos JPG, PNG y WebP; máximo 5 MB.</p>
                    </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                    {GRUPOS.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setGrupo(item.id)}
                            className={`rounded-xl px-4 py-2 text-sm font-semibold ${grupo === item.id ? "bg-[#004aad] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                        >
                            {item.nombre}
                        </button>
                    ))}
                </div>
            </div>
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {mensaje && <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{mensaje}</p>}
            {cargando ? (
                <p className="text-sm text-slate-600">Cargando imágenes...</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {posiciones.map((posicion) => (
                        <ImagenEditor
                            key={`${posicion.clave}:${porClave.get(posicion.clave)?.actualizado ?? "original"}`}
                            posicion={posicion}
                            registro={porClave.get(posicion.clave)}
                            ocupado={ocupado}
                            alGuardar={guardarImagen}
                            alEliminar={eliminarImagen}
                        />
                    ))}
                </div>
            )}
            {grupo === "convenios" && (
                <form onSubmit={agregarConvenio} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="flex items-center gap-2 font-bold text-slate-900"><UploadCloud className="h-5 w-5" /> Agregar convenio</h3>
                    <div className="grid gap-3 md:grid-cols-3">
                        <label className="text-sm text-slate-700">
                            Nombre
                            <input value={nuevoTitulo} onChange={(e) => setNuevoTitulo(e.target.value)} maxLength={120}
                                placeholder="Nombre del aliado" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
                        </label>
                        <label className="text-sm text-slate-700">
                            Orden
                            <input type="number" min="0" value={nuevoOrden} onChange={(e) => setNuevoOrden(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
                        </label>
                        <label className="text-sm text-slate-700">
                            Logotipo
                            <input type="file" required accept="image/jpeg,image/png,image/webp"
                                onChange={(e) => setNuevoArchivo(e.target.files?.[0] ?? null)} className="mt-1 w-full text-xs" />
                        </label>
                    </div>
                    <button disabled={ocupado} className="rounded-xl bg-[#004aad] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                        Agregar logo
                    </button>
                </form>
            )}
            {grupo === "servicios" && (
                <p className="rounded-xl bg-slate-100 p-4 text-sm text-slate-600">
                    Aquí cambias la imagen predeterminada. Las imágenes particulares de cada tratamiento se administran desde «Servicios».
                </p>
            )}
        </section>
    );
}
