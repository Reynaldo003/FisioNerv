import { useMemo, useState } from 'react';
import { apiJson } from '../../services/apiFetch';

function normalizarMetodoPago(metodo) {
    const valor = String(metodo || '').toLowerCase();
    if (['tarjeta', 'tarjeta_credito', 'tarjeta_debito'].includes(valor)) return 'tarjeta';
    if (valor === 'efectivo' || valor === 'transferencia') return valor;
    return 'otro';
}

function fechaLocal() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function PaymentModal({ cita, onClose, onSaved }) {
    const precio = Number(cita?.precio ?? cita?.price ?? cita?.monto_final ?? 0);
    const pagado = Number(cita?.anticipo ?? cita?.deposit ?? 0);
    const [form, setForm] = useState({
        fecha_pago: fechaLocal(), comprobante: '',
        monto_facturado: precio, descuento_porcentaje: Number(cita?.descuento_porcentaje ?? 0),
        anticipo: 0, metodo_pago: normalizarMetodoPago(cita?.metodo_pago),
    });
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);
    const total = useMemo(() => Math.max(0, Number(form.monto_facturado || 0) * (1 - Number(form.descuento_porcentaje || 0) / 100)), [form.monto_facturado, form.descuento_porcentaje]);
    const restante = Math.max(0, total - pagado - Number(form.anticipo || 0));
    const cambiar = (campo, valor) => setForm(actual => ({ ...actual, [campo]: valor }));

    async function guardar(evento) {
        evento.preventDefault();
        setError('');
        const abono = Number(form.anticipo);
        if (!cita?.id || !Number.isFinite(abono) || abono <= 0) return setError('Introduce un abono mayor que cero.');
        if (abono > total - pagado + 0.001) return setError('El abono supera el saldo pendiente.');
        setGuardando(true);
        try {
            const pago = await apiJson('/api/pagos/', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form, cita: cita.id, anticipo: abono,
                    monto_facturado: Number(form.monto_facturado), descuento_porcentaje: Number(form.descuento_porcentaje)
                }),
            });
            window.dispatchEvent(new Event('fisionerv:sales-refresh'));
            window.dispatchEvent(new Event('fisionerv:agenda-refresh'));
            onSaved?.(pago);
            onClose?.();
        } catch (e) { setError(e.data?.anticipo || e.message || 'No se pudo registrar el pago.'); }
        finally { setGuardando(false); }
    }

    return <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/40 p-4">
        <form onSubmit={guardar} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-5 shadow-2xl">
            <header className="flex items-start justify-between"><div><h2 className="text-lg font-bold">Registrar abono · Cita #{cita?.id}</h2><p className="text-xs text-slate-500">Pagado anteriormente: ${pagado.toFixed(2)}</p></div><button type="button" onClick={onClose} aria-label="Cerrar" className="text-slate-500">✕</button></header>
            <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-bold">Fecha<input required type="date" className="mt-1 w-full rounded-xl border p-2" value={form.fecha_pago} onChange={e => cambiar('fecha_pago', e.target.value)} /></label>
                <label className="text-xs font-bold">Método<select className="mt-1 w-full rounded-xl border p-2" value={form.metodo_pago} onChange={e => cambiar('metodo_pago', e.target.value)}><option value="efectivo">Efectivo</option><option value="tarjeta">Tarjeta</option><option value="transferencia">Transferencia</option><option value="otro">Otro</option></select></label>
                <label className="text-xs font-bold">Monto facturado<input type="number" min="0" step="0.01" className="mt-1 w-full rounded-xl border p-2" value={form.monto_facturado} onChange={e => cambiar('monto_facturado', e.target.value)} /></label>
                <label className="text-xs font-bold">Descuento (%)<input type="number" min="0" max="100" step="0.01" className="mt-1 w-full rounded-xl border p-2" value={form.descuento_porcentaje} onChange={e => cambiar('descuento_porcentaje', e.target.value)} /></label>
                <label className="text-xs font-bold">Abono de hoy<input required type="number" min="0.01" step="0.01" className="mt-1 w-full rounded-xl border p-2" value={form.anticipo} onChange={e => cambiar('anticipo', e.target.value)} /></label>
                <label className="text-xs font-bold">Comprobante<input className="mt-1 w-full rounded-xl border p-2" value={form.comprobante} onChange={e => cambiar('comprobante', e.target.value)} /></label>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-sm"><div>Total con descuento: <b>${total.toFixed(2)}</b></div><div>Restante al guardar: <b>${restante.toFixed(2)}</b></div></div>
            {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{String(error)}</p>}
            <footer className="flex justify-end gap-2"><button type="button" className="rounded-xl border px-4 py-2 text-sm" onClick={onClose}>Cancelar</button><button disabled={guardando} className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{guardando ? 'Guardando...' : 'Registrar abono'}</button></footer>
        </form>
    </div>;
}
