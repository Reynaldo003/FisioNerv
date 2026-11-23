import { createContext, useContext, useEffect, useState } from "react";
import { useServicios } from "./useServicios";
import { API_BASE } from "./clinicData";

const PublicContentContext = createContext(null);

const therapist = {
  id: "mauricio",
  name: "L.F.T. Edgar Mauricio Medina Cruz",
  role: "Fisioterapeuta",
  photo: "/fisio_fondo.png",
  bio: "Especialidad en rehabilitación neurológica. Maestría en rehabilitación de traumatología y ortopedia. Maestría en rehabilitación oncológica.",
};

export function PublicContentProvider({ children }) {
  const { SERVICES, loadingServices } = useServicios();
  const [team, setTeam] = useState([therapist]);
  const [reviews, setReviews] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewsError, setReviewsError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function loadTeam() {
      try {
        const response = await fetch(`${API_BASE}/api/public/team/`, { signal: controller.signal });
        if (!response.ok) throw new Error("Equipo no disponible");
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.results || [];
        const roles = { admin: "Fisioterapeuta", fisioterapeuta: "Fisioterapeuta", practicante: "Practicante", nutriologo: "Nutriólogo", dentista: "Dentista", terapeuta: "Terapeuta" };
        const roleOrder = { admin: 0, fisioterapeuta: 1, terapeuta: 2, nutriologo: 3, dentista: 4, practicante: 5 };
        const mapped = list.filter((person) => person.is_active !== false && (person.rol_base_out || person.rol_out) !== "practicante").sort((a, b) => (roleOrder[a.rol_out] ?? 6) - (roleOrder[b.rol_out] ?? 6)).map((person) => ({
          id: person.id,
          name: `${person.first_name || ""} ${person.last_name || ""}`.trim() || person.username,
          role: roles[person.rol_out] || "Colaborador",
          photo: person.foto_url || null,
          bio: person.descripcion_out || "Acompañamiento en terapia y seguimiento durante tu proceso de rehabilitación.",
        }));
        if (!controller.signal.aborted) setTeam(mapped.length ? mapped : [therapist]);
      } catch {
        // La información del profesional principal también está disponible localmente.
      } finally {
        if (!controller.signal.aborted) setLoadingTeam(false);
      }
    }
    async function loadReviews() {
      try {
        const response = await fetch(`${API_BASE}/api/comentarios/public_list/`, { signal: controller.signal });
        if (!response.ok) throw new Error("Opiniones no disponibles");
        const data = await response.json();
        if (!controller.signal.aborted) setReviews(Array.isArray(data) ? data : data.results || []);
      } catch {
        if (!controller.signal.aborted) setReviewsError(true);
      } finally {
        if (!controller.signal.aborted) setLoadingReviews(false);
      }
    }
    loadTeam();
    loadReviews();
    return () => controller.abort();
  }, []);

  return <PublicContentContext.Provider value={{ services: SERVICES, loadingServices, team, loadingTeam, reviews, loadingReviews, reviewsError }}>{children}</PublicContentContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePublicContent() {
  const context = useContext(PublicContentContext);
  if (!context) throw new Error("Se requiere PublicContentProvider.");
  return context;
}
