// Vercel y Vite reenvían estas peticiones al mismo backend de la clínica.
// El navegador usa su propio origen, también en despliegues de vista previa.
export function publicApiFetch(path, options = {}) {
  if (!String(path).startsWith("/api/")) {
    throw new Error("La ruta de la API pública debe comenzar con /api/.");
  }
  // El proxy añade el slash final que espera Django, sin redirecciones externas.
  const route = String(path).replace(/\/(?=\?|$)/, "");
  return fetch(`/backend${route}`, { ...options, credentials: "omit" });
}
