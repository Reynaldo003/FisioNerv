// src/components/reservations/PaymentModal.jsx
import { useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

function normalizarMetodoPago(metodo) {
    if (!metodo) return "efectivo";
    const m = String(metodo).toLowerCase();
    if (m === "tarjeta_credito" || m === "tarjeta_debito" || m === "tarjeta") return "tarjeta";
    if (m === "transferencia") return "transferencia";
    if (m === "efectivo") return "efectivo";
    return "otro";
}

function MessageModal({ open, title, message, onClose }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-800">{title}</div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center"
                        title="Cerrar"
                    >
                        ✕
                    </button>
                </div>
                <div className="px-4 py-4 text-sm text-slate-700">{message}</div>
                <div className="px-4 py-3 border-t border-slate-200 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-9 px-4 rounded-md bg-violet-600 text-white text-sm hover:bg-violet-700"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
}

export function PaymentModal({ cita, onClose, onSaved }) {
    const today = new Date().toISOString().slice(0, 10);

    const precioBase = Number(cita?.precio ?? cita?.price ?? cita?.monto_final ?? 0);
    const descuentoInicial = Number(cita?.descuento_porcentaje ?? 0);
    const pagadoPrevio = Number(cita?.anticipo ?? 0);

    const [msg, setMsg] = useState({ open: false, title: "", message: "" });

    const [form, setForm] = useState({
        fecha_pago: today,
        comprobante: "",
        monto_facturado: precioBase,
        descuento_porcentaje: descuentoInicial,
        anticipo: 0,
    });
    const [saving, setSaving] = useState(false);

    const handleChange = (field, value) => {
        setForm((prev) => ({
            ...prev,
            [field]:
                field === "monto_facturado" || field === "descuento_porcentaje" || field === "anticipo"
                    ? value === ""
                        ? ""
                        : Number(value)
                    : value,
        }));
    };

    const totalConDescuento = useMemo(() => {
        const subtotal = Number(form.monto_facturado || 0);
        const descPct = Number(form.descuento_porcentaje || 0);
        const descMonto = (subtotal * descPct) / 100;
        return Math.max(0, subtotal - descMonto);
    }, [form]);

    const restante = useMemo(() => {
        const anticipoNuevo = Number(form.anticipo || 0);
        return Math.max(0, totalConDescuento - (pagadoPrevio + anticipoNuevo));
    }, [totalConDescuento, pagadoPrevio, form.anticipo]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!cita?.id) {
            setMsg({ open: true, title: "Pago", message: "No se encontró el ID de la cita para registrar el pago." });
            return;
        }

        const token = localStorage.getItem("auth.access");

        try {
            setSaving(true);

            const payload = {
                cita: cita.id,
                fecha_pago: form.fecha_pago,
                comprobante: form.comprobante,
                monto_facturado: Number(form.monto_facturado || 0),
                metodo_pago: normalizarMetodoPago(cita.metodo_pago || "efectivo"),
                descuento_porcentaje: Number(form.descuento_porcentaje || 0),
                anticipo: Number(form.anticipo || 0),
            };

            const resp = await fetch(`${API_BASE}/api/pagos/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!resp.ok) {
                let data = null;
                try {
                    data = await resp.json();
                } catch { }
                console.error("Error guardando pago", resp.status, data);
                setMsg({
                    open: true,
                    title: "Error",
                    message: "Error al guardar pago. Revisa la consola para más detalles.",
                });
                return;
            }

            const saved = await resp.json();
            onSaved?.(saved);
            onClose();
        } catch (err) {
            console.error("Error guardando pago", err);
            setMsg({ open: true, title: "Error", message: "Ocurrió un error al guardar el pago." });
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
                <div className="absolute inset-0" onClick={onClose} />
                <form
                    onSubmit={handleSubmit}
                    className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-2xl p-5 space-y-4"
                >
                    <h2 className="text-sm font-semibold text-slate-800 mb-1">
                        Registrar pago de la cita #{cita?.id ?? "—"}
                    </h2>

                    <div className="text-[11px] text-slate-600 mb-2 space-y-0.5">
                        <p>
                            <span className="font-semibold">Precio base:</span> ${precioBase.toFixed(2)}
                        </p>
                        <p>
                            <span className="font-semibold">Pagado previamente:</span> ${pagadoPrevio.toFixed(2)}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-sm">
                        <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Fecha de pago</label>
                            <input
                                type="date"
                                className="w-full rounded-md border border-slate-300 px-3 py-2"
                                value={form.fecha_pago}
                                onChange={(e) => handleChange("fecha_pago", e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nº comprobante de pago</label>
                            <input
                                type="text"
                                className="w-full rounded-md border border-slate-300 px-3 py-2"
                                value={form.comprobante}
                                onChange={(e) => handleChange("comprobante", e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Monto facturado (total de la cita)
                            </label>
                            <input
                                type="number"
                                min="0"
                                className="w-full rounded-md border border-slate-300 px-3 py-2"
                                value={form.monto_facturado}
                                onChange={(e) => handleChange("monto_facturado", e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Descuento (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="w-full rounded-md border border-slate-300 px-3 py-2"
                                    value={form.descuento_porcentaje}
                                    onChange={(e) => handleChange("descuento_porcentaje", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                    Monto de este pago / abono
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full rounded-md border border-slate-300 px-3 py-2"
                                    value={form.anticipo}
                                    onChange={(e) => handleChange("anticipo", e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col justify-center text-[11px] text-slate-700 bg-slate-50 rounded-md border border-slate-200 px-3 py-2">
                                <span className="font-semibold">Restante estimado:</span>
                                <span>${restante.toFixed(2)}</span>
                                <span className="text-[10px] text-slate-500 mt-1">Se actualizará al confirmar el pago.</span>
                            </div>
                        </div>

                        <div className="flex flex-col text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
                            <div className="flex justify-between">
                                <span>Total con descuento:</span>
                                <span>${totalConDescuento.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Pagado previo + este pago:</span>
                                <span>${(pagadoPrevio + Number(form.anticipo || 0)).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-xs px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="text-xs px-4 py-2 rounded-md bg-violet-600 text-white font-medium hover:bg-violet-700 disabled:opacity-60"
                        >
                            {saving ? "Guardando..." : "Guardar pago"}
                        </button>
                    </div>
                </form>
            </div>

            <MessageModal
                open={msg.open}
                title={msg.title}
                message={msg.message}
                onClose={() => setMsg({ open: false, title: "", message: "" })}
            />
        </>
    );
}