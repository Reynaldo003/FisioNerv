//const API_BASE = import.meta.env.VITE_API_BASE || "https://api.fisionerv.cloud";
const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

let refreshPromise = null;
let installed = false;

function getAccessToken() {
  return localStorage.getItem("auth.access") || "";
}

function getRefreshToken() {
  return localStorage.getItem("auth.refresh") || "";
}

function saveTokens(data) {
  if (data?.access) localStorage.setItem("auth.access", data.access);
  if (data?.refresh) localStorage.setItem("auth.refresh", data.refresh);
}

function clearSession() {
  localStorage.removeItem("auth.access");
  localStorage.removeItem("auth.refresh");
  localStorage.removeItem("auth.user");
}

function getUrl(input) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  if (input instanceof Request) return input.url;
  return String(input || "");
}

function effectiveHeaders(input, init) {
  const headers = new Headers();

  if (input instanceof Request) {
    input.headers.forEach((value, key) => headers.set(key, value));
  }

  new Headers(init?.headers || {}).forEach((value, key) =>
    headers.set(key, value),
  );

  return headers;
}

function hasBearer(input, init) {
  const value = effectiveHeaders(input, init).get("Authorization") || "";
  return value.toLowerCase().startsWith("bearer ");
}

function isRefreshRequest(input) {
  return getUrl(input).includes("/api/auth/token/refresh/");
}

async function refreshAccess(nativeFetch) {
  if (refreshPromise) return refreshPromise;

  const refresh = getRefreshToken();
  if (!refresh) return null;

  refreshPromise = (async () => {
    try {
      const response = await nativeFetch(
        `${API_BASE}/api/auth/token/refresh/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        },
      );

      if (!response.ok) {
        if (response.status === 400 || response.status === 401) clearSession();
        return null;
      }

      const data = await response.json();
      if (!data?.access) return null;

      saveTokens(data);
      return data.access;
    } catch {
      // Un fallo temporal de red NO invalida la sesión.
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function cloneInitWithAccess(input, init, access) {
  const headers = effectiveHeaders(input, init);
  headers.set("Authorization", `Bearer ${access}`);

  return {
    ...(init || {}),
    headers,
  };
}

/**
 * Instala un interceptor global muy pequeño sobre window.fetch.
 *
 * Flujo:
 * 1. La petición normal usa el access actual.
 * 2. Si el backend responde 401, intenta renovar con auth.refresh.
 * 3. Si obtiene un access nuevo, repite UNA vez la petición original.
 * 4. Si el refresh es inválido, la llamada original sigue devolviendo 401 y
 *    el flujo actual de logout del proyecto puede actuar normalmente.
 *
 * Es idempotente: puedes importarlo desde AgendaView y ReservationModal sin
 * instalar dos wrappers.
 */
export function installFetchWithRefresh() {
  if (typeof window === "undefined") return;
  if (installed || window.__fisionervFetchRefreshInstalled) return;

  installed = true;
  window.__fisionervFetchRefreshInstalled = true;

  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const response = await nativeFetch(input, init);

    if (
      response.status !== 401 ||
      isRefreshRequest(input) ||
      !hasBearer(input, init)
    ) {
      return response;
    }

    const access = await refreshAccess(nativeFetch);
    if (!access) return response;

    return nativeFetch(input, cloneInitWithAccess(input, init, access));
  };
}

export async function apiFetch(path, init = {}) {
  installFetchWithRefresh();

  const url = String(path || "").startsWith("http")
    ? path
    : `${API_BASE}${path}`;

  const headers = new Headers(init.headers || {});
  const access = getAccessToken();

  if (access && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${access}`);
  }

  return fetch(url, { ...init, headers });
}

export async function apiJson(path, init = {}) {
  const response = await apiFetch(path, init);

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

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
