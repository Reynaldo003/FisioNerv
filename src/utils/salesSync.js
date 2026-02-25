// src/utils/salesSync.js
const CHANNEL = "fisionerv:sales-sync";

export function notifySalesRefresh() {
  // 1) BroadcastChannel (moderno)
  try {
    const bc = new BroadcastChannel(CHANNEL);
    bc.postMessage({ type: "REFRESH_SALES", at: Date.now() });
    bc.close();
  } catch {
    // ignore
  }

  // 2) fallback: storage event
  try {
    localStorage.setItem("fisionerv.sales.refresh", String(Date.now()));
  } catch {
    // ignore
  }
}

export function subscribeSalesRefresh(onRefresh) {
  let bc = null;

  // BroadcastChannel listener
  try {
    bc = new BroadcastChannel(CHANNEL);
    bc.onmessage = (ev) => {
      if (ev?.data?.type === "REFRESH_SALES") onRefresh?.();
    };
  } catch {
    // ignore
  }

  // storage listener fallback
  const onStorage = (e) => {
    if (e.key === "fisionerv.sales.refresh") onRefresh?.();
  };
  window.addEventListener("storage", onStorage);

  // también un CustomEvent interno (por si lo disparas dentro misma pestaña)
  const onCustom = () => onRefresh?.();
  window.addEventListener("fisionerv:sales-refresh", onCustom);

  return () => {
    if (bc) bc.close();
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("fisionerv:sales-refresh", onCustom);
  };
}

// útil si quieres disparar desde misma pestaña sin storage/bc
export function notifySalesRefreshLocal() {
  window.dispatchEvent(new Event("fisionerv:sales-refresh"));
}
