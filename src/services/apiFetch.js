const API_BASE = String(
  import.meta.env.VITE_API_BASE || "https://api.fisionerv.cloud",
).replace(/\/+$/, "");

let renovacionEnCurso = null;
let interceptorInstalado = false;

function accessToken() {
  return localStorage.getItem("auth.access") || "";
}

function refreshToken() {
  return localStorage.getItem("auth.refresh") || "";
}

export function cerrarSesion() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("auth.access");
  localStorage.removeItem("auth.refresh");
  localStorage.removeItem("auth.user");

  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}

function obtenerRutaApi(url) {
  const backend = new URL(API_BASE, window.location.origin);
  const prefijo = `${backend.pathname.replace(/\/$/, "")}/api/`;

  if (url.origin !== backend.origin || !url.pathname.startsWith(prefijo)) {
    return null;
  }

  return url.pathname.slice(prefijo.length);
}

function esPublica(ruta) {
  return /^(?:auth|public)(?:\/|$)/.test(ruta);
}

function esAreaAdministrativa() {
  return /^\/(?:administrativa|admin|panel|dashboard)(?:\/|$)/i.test(
    window.location.pathname,
  );
}

async function renovarToken(fetchOriginal) {
  if (renovacionEnCurso) return renovacionEnCurso;

  const refresh = refreshToken();
  if (!refresh) return { estado: "expirado" };

  renovacionEnCurso = (async () => {
    try {
      const response = await fetchOriginal(
        `${API_BASE}/api/auth/token/refresh/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        },
      );

      if ([400, 401, 403].includes(response.status)) {
        return { estado: "expirado" };
      }

      if (!response.ok) return { estado: "servidor" };

      const data = await response.json().catch(() => null);
      if (!data?.access) return { estado: "expirado" };

      localStorage.setItem("auth.access", data.access);

      if (data.refresh) {
        localStorage.setItem("auth.refresh", data.refresh);
      }

      return { estado: "ok", token: data.access };
    } catch {
      return { estado: "red" };
    }
  })();

  try {
    return await renovacionEnCurso;
  } finally {
    renovacionEnCurso = null;
  }
}

export function installFetchWithRefresh() {
  if (typeof window === "undefined") return;
  if (interceptorInstalado || window.__fisionervFetchRefreshInstalled) return;

  interceptorInstalado = true;
  window.__fisionervFetchRefreshInstalled = true;

  const fetchOriginal = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    const ruta = obtenerRutaApi(url);

    if (ruta === null || esPublica(ruta)) {
      return fetchOriginal(request);
    }

    const encabezados = new Headers(request.headers);
    const autorizacion = encabezados.get("Authorization") || "";

    if (autorizacion && !/^Bearer\s+/i.test(autorizacion)) {
      return fetchOriginal(request);
    }

    let tokenUsado = autorizacion.match(/^Bearer\s+(.+)$/i)?.[1] || "";

    if (!tokenUsado) tokenUsado = accessToken();

    const enviar = (token) => {
      const headers = new Headers(encabezados);

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      } else {
        headers.delete("Authorization");
      }

      return fetchOriginal(new Request(request.clone(), { headers }));
    };

    if (!tokenUsado && !refreshToken()) {
      if (esAreaAdministrativa() || ruta.startsWith("me/")) {
        cerrarSesion();
        throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
      }

      return enviar("");
    }

    let response = await enviar(tokenUsado);

    if (response.status !== 401) return response;

    const tokenActual = accessToken();

    if (tokenActual && tokenActual !== tokenUsado) {
      response = await enviar(tokenActual);

      if (response.status !== 401) return response;
    }

    const resultado = await renovarToken(fetchOriginal);

    if (resultado.estado === "expirado") {
      cerrarSesion();
      throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
    }

    if (resultado.estado !== "ok") {
      throw new Error("No se pudo renovar la sesión. Comprueba tu conexión.");
    }

    const reintento = await enviar(resultado.token);

    if (reintento.status === 401) {
      cerrarSesion();
      throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
    }

    return reintento;
  };
}

export async function apiFetch(path, opciones = {}) {
  installFetchWithRefresh();

  const ruta = String(path || "");
  const url = /^https?:\/\//i.test(ruta)
    ? ruta
    : `${API_BASE}/${ruta.replace(/^\/+/, "")}`;

  const headers = new Headers(opciones.headers || {});

  if (opciones.body instanceof FormData) {
    headers.delete("Content-Type");
  }

  return fetch(url, { ...opciones, headers });
}

export async function apiJson(path, opciones = {}) {
  const response = await apiFetch(path, opciones);

  const data =
    response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const detalle =
      data?.detail || data?.message || `Error HTTP ${response.status}`;

    const error = new Error(
      Array.isArray(detalle) ? detalle.join(" ") : String(detalle),
    );

    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

installFetchWithRefresh();
