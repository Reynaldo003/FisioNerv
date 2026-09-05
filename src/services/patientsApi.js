const API_BASE = import.meta.env.VITE_API_BASE || "https://api.fisionerv.cloud";
//const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

function cerrarSesion() {
  localStorage.removeItem("auth.access");
  localStorage.removeItem("auth.refresh");
  localStorage.removeItem("auth.user");
  window.location.href = "/login";
}

function mensajeError(
  data,
  fallback = "Ocurrió un error al comunicarse con el servidor.",
) {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;

  const primeraClave = Object.keys(data)[0];
  const valor = data[primeraClave];

  if (Array.isArray(valor)) return valor.join(" ");
  if (typeof valor === "string") return valor;
  return fallback;
}

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("auth.access");

  if (!token) {
    cerrarSesion();
    throw new Error("Sesión no disponible.");
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  let body = options.body;

  if (body && !(body instanceof FormData) && typeof body !== "string") {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body,
  });

  if (response.status === 401) {
    cerrarSesion();
    throw new Error("La sesión expiró.");
  }

  let data = null;
  if (response.status !== 204) {
    const contentType = response.headers.get("content-type") || "";
    data = contentType.includes("application/json")
      ? await response.json().catch(() => null)
      : await response.text().catch(() => null);
  }

  if (!response.ok) {
    const error = new Error(mensajeError(data));
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function normalizarLista(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export const pacientesApi = {
  listar: () => apiRequest("/api/pacientes/"),
  resumen: () => apiRequest("/api/pacientes/resumen/"),
  cumpleanos: (dias = 7) =>
    apiRequest(`/api/pacientes/cumpleanos/?dias=${dias}`),
  expediente: (pacienteId) =>
    apiRequest(`/api/pacientes/${pacienteId}/expediente/`),

  crear: (payload) =>
    apiRequest("/api/pacientes/", {
      method: "POST",
      body: payload,
    }),

  actualizar: (pacienteId, payload, eliminarCitasPosteriores = null) => {
    let path = `/api/pacientes/${pacienteId}/`;

    if (eliminarCitasPosteriores !== null) {
      path += `?eliminar_citas_posteriores=${
        eliminarCitasPosteriores ? "true" : "false"
      }`;
    }

    return apiRequest(path, {
      method: "PATCH",
      body: payload,
    });
  },

  eliminar: (pacienteId, eliminarCitas = false) =>
    apiRequest(
      `/api/pacientes/${pacienteId}/?eliminar_citas=${eliminarCitas ? "true" : "false"}`,
      {
        method: "DELETE",
      },
    ),

  subirFoto: (pacienteId, archivo) => {
    const formData = new FormData();
    formData.append("foto", archivo);

    return apiRequest(`/api/pacientes/${pacienteId}/foto/`, {
      method: "POST",
      body: formData,
    });
  },

  eliminarFoto: (pacienteId) =>
    apiRequest(`/api/pacientes/${pacienteId}/foto/`, {
      method: "DELETE",
    }),

  subirDocumento: (pacienteId, archivo, tipo = "otro", descripcion = "") => {
    const formData = new FormData();
    formData.append("archivo", archivo);
    formData.append("tipo", tipo);
    formData.append("descripcion", descripcion);

    return apiRequest(`/api/pacientes/${pacienteId}/documentos/`, {
      method: "POST",
      body: formData,
    });
  },

  eliminarDocumento: (pacienteId, documentoId) =>
    apiRequest(`/api/pacientes/${pacienteId}/documentos/${documentoId}/`, {
      method: "DELETE",
    }),

  crearRegistroClinico: (pacienteId, payload) =>
    apiRequest(`/api/pacientes/${pacienteId}/historial/`, {
      method: "POST",
      body: payload,
    }),

  eliminarRegistroClinico: (pacienteId, registroId) =>
    apiRequest(`/api/pacientes/${pacienteId}/historial/${registroId}/`, {
      method: "DELETE",
    }),
};
