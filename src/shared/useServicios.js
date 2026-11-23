// src/shared/useServicios.js
import { useEffect, useMemo, useState } from "react";
import { API_BASE, FALLBACK_SERVICES, SERVICE_UI_MAP } from "./clinicData";

// convierte "00:45:00" a "45–60 min" etc.
function durationToTag(durationStr) {
  if (!durationStr) return "";
  const [h = "0", m = "0", s = "0"] = String(durationStr).split(":");
  const total = Number(h) * 60 + Number(m) + Number(s) / 60;

  if (total <= 30) return `${Math.round(total)} min`;
  if (total <= 45) return "30–45 min";
  if (total <= 60) return "45–60 min";
  if (total <= 90) return "60–90 min";
  if (total <= 100) return "+100 min";
  return `${Math.round(total)} min`;
}

// ✅ misma lógica que admin:
// - si hay imagen_url => usarla tal cual
// - si no => usar default local
function pickServiceImage(s) {
  const img = (s?.imagen_url || s?.imagen || "").toString().trim();
  return img || "/servicios/valoracion.png"; // ✅ default local permitido
}

const directRequest = (path, options) => fetch(`${API_BASE}${path}`, options);

export function useServicios(request = directRequest, useFallback = true) {
  const [servicesFromApi, setServicesFromApi] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function loadServices() {
      try {
        setLoadingServices(true);
        setServicesError("");
        const resp = await request("/api/servicios/", { signal: controller.signal });
        if (!resp.ok) throw new Error("No se pudieron cargar los servicios");
        const data = await resp.json();
        const list = Array.isArray(data) ? data : data?.results;
        if (!Array.isArray(list)) throw new Error("El catálogo de servicios no tiene un formato válido.");
        if (!controller.signal.aborted) setServicesFromApi(list);
      } catch (e) {
        if (controller.signal.aborted) return;
        console.error("Error cargando servicios:", e);
        setServicesFromApi([]);
        setServicesError("No pudimos cargar los servicios de la clínica. Vuelve a intentarlo.");
      } finally {
        if (!controller.signal.aborted) setLoadingServices(false);
      }
    }
    loadServices();
    return () => controller.abort();
  }, [request, reload]);

  const SERVICES = useMemo(() => {
    // si no hay API, usa fallback tal cual (tu fallback ya trae imágenes locales si así lo definiste)
    if (!servicesFromApi.length) return useFallback ? FALLBACK_SERVICES : [];

    return servicesFromApi.map((s) => {
      const ui = SERVICE_UI_MAP?.[s.nombre] || {};

      return {
        id: s.id,
        name: s.nombre,
        price: Number(s.precio),
        tag: ui.tag || durationToTag(s.duracion),
        description: s.descripcion,
        duration: s.duracion,

        // ✅ ahora SÍ usamos la imagen del backend como en admin
        // ✅ y solo si no hay, usamos default local
        mediaSrc: pickServiceImage(s),

        // (opcional) si quieres conservar specialty u otras props, agrégalas aquí
      };
    });
  }, [servicesFromApi, useFallback]);

  return { SERVICES, loadingServices, servicesError, reloadServices: () => setReload((value) => value + 1) };
}
