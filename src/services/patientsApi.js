import { apiFetch } from "./apiFetch";

function errorMessage(
  data,
  fallback = "Ocurrió un error al consultar el servidor.",
) {
  if (!data) return fallback;

  if (typeof data === "string") {
    return data || fallback;
  }

  if (typeof data.detail === "string") {
    return data.detail;
  }

  if (typeof data.message === "string") {
    return data.message;
  }

  if (Array.isArray(data.detail)) {
    return data.detail.join(" ");
  }

  const primero = Object.values(data)[0];

  if (Array.isArray(primero)) {
    return primero.map(String).join(" ");
  }

  if (typeof primero === "string") {
    return primero;
  }

  return fallback;
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  let body = options.body;

  // Objetos JavaScript -> JSON
  if (
    body != null &&
    !(body instanceof FormData) &&
    typeof body !== "string" &&
    !(body instanceof Blob) &&
    !(body instanceof URLSearchParams)
  ) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }

  // FormData: el navegador agrega automáticamente
  // Content-Type y su boundary.
  if (body instanceof FormData) {
    headers.delete("Content-Type");
  }

  const response = await apiFetch(path, {
    ...options,
    headers,
    body,
  });

  let data = null;

  if (response.status !== 204 && response.status !== 205) {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      data = await response.json().catch(() => null);
    } else {
      data = await response.text().catch(() => null);
    }
  }

  if (!response.ok) {
    const error = new Error(
      errorMessage(data, `Error HTTP ${response.status}`),
    );

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

function pacienteUrl(id) {
  if (id === undefined || id === null || String(id).trim() === "") {
    throw new Error("No se proporcionó el ID del paciente.");
  }

  return `/api/pacientes/${encodeURIComponent(id)}/`;
}

export const pacientesApi = {
  // ============================================================
  // CONSULTAS
  // ============================================================

  listar: () => apiRequest("/api/pacientes/"),

  resumen: () => apiRequest("/api/pacientes/resumen/"),

  cumpleanos: (dias = 7) =>
    apiRequest(`/api/pacientes/cumpleanos/?dias=${encodeURIComponent(dias)}`),

  expediente: (id) => apiRequest(`${pacienteUrl(id)}expediente/`),

  // ============================================================
  // CREAR PACIENTE
  // ============================================================

  crear: (payload) =>
    apiRequest("/api/pacientes/", {
      method: "POST",
      body: payload,
    }),

  // ============================================================
  // ACTUALIZAR PACIENTE
  // ============================================================

  actualizar: (id, payload, eliminarCitasPosteriores = null) => {
    let url = pacienteUrl(id);

    if (eliminarCitasPosteriores !== null) {
      const params = new URLSearchParams({
        eliminar_citas_posteriores: eliminarCitasPosteriores ? "true" : "false",
      });

      url += `?${params.toString()}`;
    }

    return apiRequest(url, {
      method: "PATCH",
      body: payload,
    });
  },

  // ============================================================
  // ELIMINAR PACIENTE
  // ============================================================

  eliminar: (id, eliminarCitas = false) => {
    const params = new URLSearchParams({
      eliminar_citas: eliminarCitas ? "true" : "false",
    });

    return apiRequest(`${pacienteUrl(id)}?${params.toString()}`, {
      method: "DELETE",
    });
  },

  // ============================================================
  // FOTOGRAFÍA DEL PACIENTE
  // ============================================================

  subirFoto: (id, archivo) => {
    if (!archivo) {
      throw new Error("Selecciona una fotografía.");
    }

    const formData = new FormData();
    formData.append("foto", archivo);

    return apiRequest(`${pacienteUrl(id)}foto/`, {
      method: "POST",
      body: formData,
    });
  },

  eliminarFoto: (id) =>
    apiRequest(`${pacienteUrl(id)}foto/`, {
      method: "DELETE",
    }),

  // ============================================================
  // DOCUMENTOS CLÍNICOS
  // ============================================================

  subirDocumento: (id, archivo, tipo = "otro", descripcion = "") => {
    if (!archivo) {
      throw new Error("Selecciona un documento.");
    }

    const formData = new FormData();

    formData.append("archivo", archivo);
    formData.append("tipo", tipo);
    formData.append("descripcion", descripcion);

    return apiRequest(`${pacienteUrl(id)}documentos/`, {
      method: "POST",
      body: formData,
    });
  },

  eliminarDocumento: (id, documentoId) =>
    apiRequest(
      `${pacienteUrl(id)}documentos/${encodeURIComponent(documentoId)}/`,
      {
        method: "DELETE",
      },
    ),

  // ============================================================
  // HISTORIAL CLÍNICO
  // ============================================================

  crearRegistroClinico: (id, payload) =>
    apiRequest(`${pacienteUrl(id)}historial/`, {
      method: "POST",
      body: payload,
    }),

  eliminarRegistroClinico: (id, registroId) =>
    apiRequest(
      `${pacienteUrl(id)}historial/${encodeURIComponent(registroId)}/`,
      {
        method: "DELETE",
      },
    ),
};
