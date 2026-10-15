// Una sola implementación de JWT para toda la app: NO se duplica el refresh.
import {
  apiFetch,
  apiJson,
  cerrarSesion,
  installFetchWithRefresh,
} from "../services/apiFetch";
export { apiFetch, apiJson, cerrarSesion, installFetchWithRefresh };

export async function deleteBloqueo(id) {
  const response = await apiFetch(`/api/bloqueos/${id}/`, { method: "DELETE" });
  if (!response.ok) throw new Error("No se pudo eliminar el bloqueo.");
  return true;
}
