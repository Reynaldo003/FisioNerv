// src/shared/useServicios.js
import { useEffect, useMemo, useState } from "react";
import { API_BASE, FALLBACK_SERVICES, SERVICE_UI_MAP } from "./clinicData";

// convierte "00:45:00" a "45–60 min" etc.
function durationToTag(durationStr) {
  if (!durationStr) return "";
  const [h = "0", m = "0", s = "0"] = durationStr.split(":");
  const total = Number(h) * 60 + Number(m) + Number(s) / 60;

  if (total <= 30) return `${Math.round(total)} min`;
  if (total <= 45) return "30–45 min";
  if (total <= 60) return "45–60 min";
  if (total <= 90) return "60–90 min";
  if (total <= 100) return "+100 min";
  return `${Math.round(total)} min`;
}

export function useServicios() {
  const [servicesFromApi, setServicesFromApi] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    async function loadServices() {
      try {
        setLoadingServices(true);
        const resp = await fetch(`${API_BASE}/api/servicios/`);
        if (!resp.ok) throw new Error("No se pudieron cargar los servicios");
        const data = await resp.json();
        setServicesFromApi(data || []);
      } catch (e) {
        console.error("Error cargando servicios:", e);
        setServicesFromApi([]);
      } finally {
        setLoadingServices(false);
      }
    }
    loadServices();
  }, []);

  const SERVICES = useMemo(() => {
    if (!servicesFromApi.length) return FALLBACK_SERVICES;

    return servicesFromApi.map((s) => {
      const ui = SERVICE_UI_MAP[s.nombre] || {};
      return {
        id: s.id,
        name: s.nombre,
        price: Number(s.precio),
        tag: ui.tag || durationToTag(s.duracion),
        description: s.descripcion,
        mediaSrc: ui.mediaSrc || "/rehabilitacion.png",
        duration: s.duracion,
      };
    });
  }, [servicesFromApi]);

  return { SERVICES, loadingServices };
}
