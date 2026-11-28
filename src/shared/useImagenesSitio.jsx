import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { COLLAB_IMAGES } from "./clinicData";
import { publicApiFetch } from "../services/publicApi";

const ContextoImagenes = createContext(null);

export function ImagenesSitioProvider({ children }) {
    const [imagenes, setImagenes] = useState([]);
    const [estado, setEstado] = useState("cargando");

    useEffect(() => {
        const controlador = new AbortController();
        async function cargarImagenes() {
            try {
                const respuesta = await publicApiFetch("/api/public/imagenes-sitio/", {
                    signal: controlador.signal,
                });
                if (!respuesta.ok) throw new Error("No se pudo cargar el catálogo de imágenes.");
                const datos = await respuesta.json();
                setImagenes(Array.isArray(datos) ? datos : datos.results || []);
                setEstado("listo");
            } catch (error) {
                if (error.name !== "AbortError") {
                    // Si la API no está disponible, se conservan las imágenes de public/.
                    console.error("Imágenes del sitio:", error);
                    setEstado("error");
                }
            }
        }
        cargarImagenes();
        return () => controlador.abort();
    }, []);

    const valor = useMemo(() => {
        const porClave = new Map(imagenes.map((item) => [item.clave, item]));

        function obtenerImagen(clave, respaldo) {
            const item = porClave.get(clave);
            if (!item) return respaldo;
            if (!item.activo) return null;
            return item.imagen_url || respaldo;
        }

        function obtenerGaleriaConvenios() {
            const base = COLLAB_IMAGES.map((respaldo, index) => {
                const clave = `convenios.logo.${index + 1}`;
                const item = porClave.get(clave);
                if (item && !item.activo) return null;
                return {
                    clave,
                    orden: item?.orden ?? index + 1,
                    src: item?.imagen_url || respaldo,
                };
            }).filter(Boolean);
            const extras = imagenes
                .filter((item) => item.clave.startsWith("convenios.extra.") && item.activo && item.imagen_url)
                .map((item) => ({ clave: item.clave, orden: item.orden, src: item.imagen_url }));
            return [...base, ...extras]
                .sort((a, b) => a.orden - b.orden)
                .map((item) => item.src);
        }
        return { estado, imagenes, obtenerImagen, obtenerGaleriaConvenios };
    }, [estado, imagenes]);

    return <ContextoImagenes.Provider value={valor}>{children}</ContextoImagenes.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useImagenesSitio() {
    const contexto = useContext(ContextoImagenes);
    if (!contexto) throw new Error("useImagenesSitio debe usarse dentro de ImagenesSitioProvider.");
    return contexto;
}
