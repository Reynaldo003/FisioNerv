// src/api/api.js
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export async function apiFetch(url, options = {}) {
  const access = localStorage.getItem("auth.access");
  const refresh = localStorage.getItem("auth.refresh");

  const headers = {
    ...(options.headers || {}),
    Authorization: access ? `Bearer ${access}` : undefined,
    "Content-Type": options.headers?.["Content-Type"] || "application/json",
  };

  let resp = await fetch(`${API_BASE}${url}`, { ...options, headers });

  // si access expiró, intentamos refresh
  if (resp.status === 401 && refresh) {
    const refreshResp = await fetch(`${API_BASE}/api/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (refreshResp.ok) {
      const data = await refreshResp.json();
      localStorage.setItem("auth.access", data.access);

      // reintenta la petición original con el nuevo access
      resp = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: { ...headers, Authorization: `Bearer ${data.access}` },
      });
    } else {
      // refresh expiró o inválido => sesión ya no se puede mantener
      localStorage.removeItem("auth.access");
      localStorage.removeItem("auth.refresh");
      localStorage.removeItem("auth.user");
      window.location.href = "/login";
    }
  }

  return resp;
}
