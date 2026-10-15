<<<<<<< HEAD
import { apiFetch } from "./apiFetch";
=======
//src/services/patientsApi.js
const API_BASE = import.meta.env.VITE_API_BASE || "https://api.fisionerv.cloud";
//const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
>>>>>>> c93dcba62b4afbd9ccbec57d22f48196aa852f34

function errorMessage(
  data,
  fallback = "Ocurrió un error al consultar el servidor.",
) {
  if (typeof data === "string") return data;
  if (data?.detail) return data.detail;
  const primero = Object.values(data || {})[0];
  return Array.isArray(primero)
    ? primero.join(" ")
    : typeof primero === "string"
      ? primero
      : fallback;
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  let body = options.body;
  if (body && !(body instanceof FormData) && typeof body !== "string") {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }
  const response = await apiFetch(path, { ...options, headers, body });
  const data =
    response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(errorMessage(data));
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export function normalizarLista(data) {
  return Array.isArray(data)
    ? data
    : Array.isArray(data?.results)
      ? data.results
      : [];
}

export const pacientesApi = {
  listar: () => apiRequest("/api/pacientes/"),
  resumen: () => apiRequest("/api/pacientes/resumen/"),
  cumpleanos: (dias = 7) =>
    apiRequest(`/api/pacientes/cumpleanos/?dias=${dias}`),
  expediente: (id) => apiRequest(`/api/pacientes/${id}/expediente/`),
  crear: (body) => apiRequest("/api/pacientes/", { method: "POST", body }),
  actualizar: (id, body, eliminarCitasPosteriores = null) => {
    const query =
      eliminarCitasPosteriores === null
        ? ""
        : `?eliminar_citas_posteriores=${eliminarCitasPosteriores}`;
    return apiRequest(`/api/pacientes/${id}/${query}`, {
      method: "PATCH",
      body,
    });
  },
  eliminar: (id, eliminarCitas = false) =>
    apiRequest(`/api/pacientes/${id}/?eliminar_citas=${eliminarCitas}`, {
      method: "DELETE",
    }),
  subirFoto: (id, archivo) => {
    const fd = new FormData();
    fd.append("foto", archivo);
    return apiRequest(`/api/pacientes/${id}/foto/`, {
      method: "POST",
      body: fd,
    });
  },
  eliminarFoto: (id) =>
    apiRequest(`/api/pacientes/${id}/foto/`, { method: "DELETE" }),
  subirDocumento: (id, archivo, tipo = "otro", descripcion = "") => {
    const fd = new FormData();
    fd.append("archivo", archivo);
    fd.append("tipo", tipo);
    fd.append("descripcion", descripcion);
    return apiRequest(`/api/pacientes/${id}/documentos/`, {
      method: "POST",
      body: fd,
    });
  },
  eliminarDocumento: (id, documentoId) =>
    apiRequest(`/api/pacientes/${id}/documentos/${documentoId}/`, {
      method: "DELETE",
    }),
  crearRegistroClinico: (id, body) =>
    apiRequest(`/api/pacientes/${id}/historial/`, { method: "POST", body }),
  eliminarRegistroClinico: (id, rid) =>
    apiRequest(`/api/pacientes/${id}/historial/${rid}/`, { method: "DELETE" }),
};
