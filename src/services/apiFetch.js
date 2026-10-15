<<<<<<< HEAD
const API_BASE = (
  import.meta.env.VITE_API_BASE || "https://api.fisionerv.cloud"
).replace(/\/$/, "");
let renovacion = null;
let instalado = false;
=======
//src/services/patientsApi.js
const API_BASE = import.meta.env.VITE_API_BASE || "https://api.fisionerv.cloud";
//const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
>>>>>>> c93dcba62b4afbd9ccbec57d22f48196aa852f34

export function cerrarSesion() {
  localStorage.removeItem("auth.access");
  localStorage.removeItem("auth.refresh");
  localStorage.removeItem("auth.user");
  if (window.location.pathname !== "/login") window.location.replace("/login");
}

function esEndpointPublico(url) {
  return (
    url.pathname.includes("/api/public/") || url.pathname.includes("/api/auth/")
  );
}

async function renovarToken(fetchOriginal) {
  if (renovacion) return renovacion;
  const refresh = localStorage.getItem("auth.refresh");
  if (!refresh) return { estado: "expirado" };
  renovacion = (async () => {
    try {
      const response = await fetchOriginal(
        `${API_BASE}/api/auth/token/refresh/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        },
      );
      if ([400, 401, 403].includes(response.status))
        return { estado: "expirado" };
      if (!response.ok) return { estado: "servidor" };
      const data = await response.json();
      if (!data.access) return { estado: "expirado" };
      localStorage.setItem("auth.access", data.access);
      if (data.refresh) localStorage.setItem("auth.refresh", data.refresh);
      return { estado: "ok", token: data.access };
    } catch {
      return { estado: "red" };
    }
  })();
  try {
    return await renovacion;
  } finally {
    renovacion = null;
  }
}

// Intercepta también los fetch() directos utilizados por la agenda y los modales.
export function installFetchWithRefresh() {
  if (
    typeof window === "undefined" ||
    instalado ||
    window.__fisionervFetchRefreshInstalled
  )
    return;
  instalado = true;
  window.__fisionervFetchRefreshInstalled = true;
  const original = window.fetch.bind(window);
  const base = new URL(API_BASE, window.location.origin);
  window.fetch = async (input, init = {}) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    const esApi =
      url.origin === base.origin && url.pathname.startsWith("/api/");
    if (!esApi || esEndpointPublico(url)) return original(request);
    const headers = new Headers(request.headers);
    if (!headers.has("Authorization")) {
      const token = localStorage.getItem("auth.access");
      if (!token) {
        cerrarSesion();
        throw new Error("La sesión expiró. Inicia sesión nuevamente.");
      }
      headers.set("Authorization", `Bearer ${token}`);
    }
    const primero = await original(new Request(request, { headers }));
    if (primero.status !== 401) return primero;
    const resultado = await renovarToken(original);
    if (resultado.estado === "expirado") {
      cerrarSesion();
      throw new Error("La sesión expiró. Inicia sesión nuevamente.");
    }
    if (resultado.estado !== "ok")
      throw new Error("No se pudo renovar la sesión. Comprueba la conexión.");
    headers.set("Authorization", `Bearer ${resultado.token}`);
    const segundo = await original(new Request(request, { headers }));
    if (segundo.status === 401) {
      cerrarSesion();
      throw new Error("La sesión expiró. Inicia sesión nuevamente.");
    }
    return segundo;
  };
}

export async function apiFetch(path, opciones = {}) {
  installFetchWithRefresh();
  const url = String(path).startsWith("http") ? path : `${API_BASE}${path}`;
  // FormData no debe tener Content-Type manual: el navegador añade el boundary.
  const headers = new Headers(opciones.headers || {});
  if (opciones.body instanceof FormData) headers.delete("Content-Type");
  return window.fetch(url, { ...opciones, headers });
}

export async function apiJson(path, opciones = {}) {
  const response = await apiFetch(path, opciones);
  const data =
    response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(
      data?.detail || data?.message || `Error HTTP ${response.status}`,
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

installFetchWithRefresh();
