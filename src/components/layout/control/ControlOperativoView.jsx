import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiJson } from '../../../services/apiFetch';
import { normalizarLista } from '../../../services/patientsApi';

const CAMPO = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500';
const BOTON = 'rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50';
const DINERO = (valor) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(valor || 0));
function hoy() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function comienzoMes() { return `${hoy().slice(0, 7)}-01`; }
function Bloque({ titulo, children }) { return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="mb-4 text-base font-bold text-slate-900">{titulo}</h3>{children}</section>; }
function Mensaje({ error, mensaje }) { return <>{error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}{mensaje && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{mensaje}</p>}</>; }

function OcupacionView() {
    const [datos, setDatos] = useState(null);
    const [dia, setDia] = useState(0);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(true);
    const cargar = useCallback(async () => {
        setCargando(true); setError('');
        try { setDatos(await apiJson('/api/control/ocupacion/')); }
        catch (e) { setError(e.message); }
        finally { setCargando(false); }
    }, []);
    useEffect(() => { cargar(); }, [cargar]);
    const actual = datos?.dias?.[dia];
    return <div className="space-y-4">
        <Bloque titulo="Horas punta · promedio histórico">
            <p className="mb-4 text-sm text-slate-500">Promedio de citas no canceladas por hora y día de la semana de los últimos 90 días completos. La intensidad es relativa al horario más concurrido, no disponibilidad en tiempo real.</p>
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <select className={`${CAMPO} max-w-52`} value={dia} onChange={e => setDia(Number(e.target.value))}>
                    {(datos?.dias || []).map(d => <option key={d.dia} value={d.dia}>{d.nombre}</option>)}
                </select>
                <button className="rounded-xl border px-3 py-2 text-sm" onClick={cargar} disabled={cargando}>Actualizar</button>
                {datos && <span className="text-xs text-slate-500">{datos.desde} a {datos.hasta}</span>}
            </div>
            <Mensaje error={error} />
            {cargando ? <p className="text-sm text-slate-500">Calculando ocupación...</p> : actual && <>
                <div className="flex h-52 items-end gap-1 border-b border-slate-200 pb-1">
                    {actual.horas.map(h => <div key={h.hora} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" title={`${h.hora}: ${h.promedio_citas} citas en promedio`}>
                        <div className={`w-full max-w-10 rounded-t-md ${h.intensidad >= 85 ? 'bg-teal-600' : 'bg-cyan-600'}`} style={{ height: `${Math.max(2, h.intensidad)}%` }} />
                    </div>)}
                </div>
                <div className="flex justify-between text-[10px] text-slate-500"><span>8 a.m.</span><span>12 p.m.</span><span>4 p.m.</span><span>8 p.m.</span></div>
                <p className="mt-3 text-sm text-slate-600">Promedio diario del {actual.nombre.toLowerCase()}: <b>{actual.promedio_diario} citas</b>, calculado con {actual.ocurrencias} días del histórico.</p>
            </>}
        </Bloque>
        <Bloque titulo="Comparación por día de semana">
            <div className="grid gap-3 md:grid-cols-2">{(datos?.dias || []).map(d => <button key={d.dia} onClick={() => setDia(d.dia)} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-left text-sm">
                <span className="w-20 font-medium">{d.nombre}</span><div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-cyan-600" style={{ width: `${Math.max(0, Math.min(100, (d.promedio_diario / Math.max(1, ...datos.dias.map(x => x.promedio_diario))) * 100))}%` }} /></div><b>{d.promedio_diario}</b>
            </button>)}</div>
        </Bloque>
    </div>;
}

function FinanzasConfigView() {
    const [config, setConfig] = useState(null);
    const [resumen, setResumen] = useState(null);
    const [desde, setDesde] = useState(comienzoMes());
    const [hasta, setHasta] = useState(hoy());
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [guardando, setGuardando] = useState(false);
    const cargar = useCallback(async () => {
        try {
            setError('');
            const [c, r] = await Promise.all([apiJson('/api/control/configuracion-financiera/'), apiJson(`/api/control/comisiones/?desde=${desde}&hasta=${hasta}`)]);
            setConfig(c); setResumen(r);
        } catch (e) { setError(e.message); }
    }, [desde, hasta]);
    useEffect(() => { cargar(); }, [cargar]);
    async function guardar(e) {
        e.preventDefault(); setGuardando(true); setError(''); setMensaje('');
        try {
            const body = {
                porcentaje_mercado_pago: Number(config.porcentaje_mercado_pago),
                porcentaje_recepcion: Number(config.porcentaje_recepcion),
                servicio_valoracion: config.servicio_valoracion || null,
            };
            await apiJson('/api/control/configuracion-financiera/', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            setMensaje('Configuración guardada. Se aplicará a los nuevos pagos.');
            await cargar();
        } catch (e) { setError(e.message); }
        finally { setGuardando(false); }
    }
    return <div className="space-y-4">
        <Bloque titulo="Configuración de comisiones">
            {config && <form onSubmit={guardar} className="grid gap-4 md:grid-cols-3">
                <label className="text-xs font-bold text-slate-700">Comisión Mercado Pago (%)<input className={`${CAMPO} mt-2`} type="number" min="0" max="100" step="0.01" value={config.porcentaje_mercado_pago} onChange={e => setConfig(v => ({ ...v, porcentaje_mercado_pago: e.target.value }))} required /></label>
                <label className="text-xs font-bold text-slate-700">Comisión recepción (%)<input className={`${CAMPO} mt-2`} type="number" min="0" max="100" step="0.01" value={config.porcentaje_recepcion} onChange={e => setConfig(v => ({ ...v, porcentaje_recepcion: e.target.value }))} required /></label>
                <label className="text-xs font-bold text-slate-700">Servicio de primera valoración<select className={`${CAMPO} mt-2`} value={config.servicio_valoracion || ''} onChange={e => setConfig(v => ({ ...v, servicio_valoracion: e.target.value || null }))}>
                    <option value="">Seleccionar servicio</option>{config.servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select></label>
                <div className="md:col-span-3"><button className={BOTON} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar porcentajes'}</button></div>
            </form>}
            <p className="mt-4 text-xs text-slate-500">Mercado Pago se calcula únicamente en pagos con método «tarjeta». Recepción recibe comisión solo en la primera valoración completada y cobrada de pacientes nuevos que registró (sin recomendación).</p>
        </Bloque>
        <div className="flex flex-wrap gap-3"><label className="text-xs">Desde<input className={`${CAMPO} mt-1`} type="date" value={desde} onChange={e => setDesde(e.target.value)} /></label><label className="text-xs">Hasta<input className={`${CAMPO} mt-1`} type="date" value={hasta} onChange={e => setHasta(e.target.value)} /></label></div>
        <Mensaje error={error} mensaje={mensaje} />
        <div className="grid gap-3 md:grid-cols-3">
            {[['Pacientes nuevos registrados', resumen?.total_pacientes_nuevos || 0], ['Comisiones MP', DINERO(resumen?.total_mp)], ['Comisiones recepción', DINERO(resumen?.total_recepcion)]].map(([k, v]) => <div key={k} className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">{k}</p><p className="mt-2 text-xl font-bold">{v}</p></div>)}
        </div>
        <Bloque titulo="Pacientes nuevos registrados por recepción">
            <div className="max-h-80 overflow-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b"><th className="py-2">Fecha</th><th>Paciente</th><th>Recepcionista</th></tr></thead><tbody>{(resumen?.pacientes || []).map(x => <tr key={x.id} className="border-b"><td className="py-2">{x.fecha}</td><td>{x.nombre}</td><td>{x.recepcionista}</td></tr>)}</tbody></table></div>
            {resumen && !resumen.pacientes.length && <p className="text-sm text-slate-500">No hay pacientes atribuibles en el período.</p>}
        </Bloque>
        <Bloque titulo="Detalle de comisiones por pago">
            <div className="max-h-80 overflow-auto"><table className="w-full min-w-[660px] text-left text-xs"><thead><tr className="border-b"><th className="py-2">Pago</th><th>Paciente</th><th>Cobrado</th><th>MP</th><th>Recepción</th><th>Recepcionista</th></tr></thead><tbody>{(resumen?.pagos || []).map(x => <tr key={x.pago} className="border-b"><td className="py-2">#{x.pago}</td><td>{x.paciente}</td><td>{DINERO(x.cobrado)}</td><td>{DINERO(x.comision_mp)}</td><td>{DINERO(x.comision_recepcion)}</td><td>{x.recepcionista || '—'}</td></tr>)}</tbody></table></div>
        </Bloque>
    </div>;
}

function BitacoraView() {
    const [items, setItems] = useState([]);
    const [error, setError] = useState('');
    const [desde, setDesde] = useState(comienzoMes());
    const [hasta, setHasta] = useState(hoy());
    useEffect(() => {
        let activo = true;
        apiJson(`/api/control/bitacora/?desde=${desde}&hasta=${hasta}`).then(x => { if (activo) setItems(x); }).catch(e => { if (activo) setError(e.message); });
        return () => { activo = false; };
    }, [desde, hasta]);
    return <Bloque titulo="Bitácora de la agenda">
        <div className="mb-4 flex flex-wrap gap-3"><input aria-label="Desde" type="date" className={CAMPO} style={{ maxWidth: 190 }} value={desde} onChange={e => setDesde(e.target.value)} /><input aria-label="Hasta" type="date" className={CAMPO} style={{ maxWidth: 190 }} value={hasta} onChange={e => setHasta(e.target.value)} /></div>
        <Mensaje error={error} />
        <div className="max-h-[520px] overflow-auto"><table className="w-full min-w-[650px] text-left text-xs"><thead><tr className="border-b"><th className="py-2">Fecha</th><th>Usuario</th><th>Acción</th><th>Tipo</th><th>ID</th><th>Detalle</th></tr></thead><tbody>{items.map(x => <tr key={x.id} className="border-b"><td className="py-2">{new Date(x.fecha).toLocaleString('es-MX')}</td><td>{x.usuario}</td><td>{x.accion}</td><td>{x.tipo}</td><td>{x.objeto_id}</td><td className="max-w-72 truncate" title={JSON.stringify(x.nuevo || {})}>{x.descripcion || JSON.stringify(x.nuevo || {}).slice(0, 90)}</td></tr>)}</tbody></table></div>
        {items.length === 0 && !error && <p className="text-sm text-slate-500">No hay movimientos en el período.</p>}
    </Bloque>;
}

function MasivoView() {
    const [citas, setCitas] = useState([]);
    const [seleccion, setSeleccion] = useState([]);
    const [consulta, setConsulta] = useState('');
    const [metodo, setMetodo] = useState('efectivo');
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [ocupado, setOcupado] = useState(false);
    const cargar = useCallback(async () => {
        try { setCitas(normalizarLista(await apiJson('/api/citas/'))); }
        catch (e) { setError(e.message); }
    }, []);
    useEffect(() => { cargar(); }, [cargar]);
    const visibles = useMemo(() => citas.filter(c => `${c.paciente_nombre} ${c.servicio_nombre} ${c.fecha}`.toLowerCase().includes(consulta.toLowerCase())).slice(0, 200), [citas, consulta]);
    const toggle = (id) => setSeleccion(actual => actual.includes(id) ? actual.filter(x => x !== id) : [...actual, id]);
    async function procesar(accion) {
        if (!seleccion.length) return setError('Selecciona al menos una cita.');
        const advertencia = accion === 'eliminar' ? 'Eliminarás definitivamente las citas seleccionadas SIN pagos.' : 'Se liquidará el saldo pendiente completo de cada cita seleccionada.';
        if (!window.confirm(`${advertencia}\nCitas: ${seleccion.length}. ¿Continuar?`)) return;
        setError(''); setMensaje(''); setOcupado(true);
        try {
            const r = await apiJson('/api/control/masivo/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accion, cita_ids: seleccion, metodo_pago: metodo }) });
            setMensaje(`Operación ${r.accion}: ${r.total} citas procesadas.`); setSeleccion([]); await cargar();
            window.dispatchEvent(new Event('fisionerv:agenda-refresh'));
            window.dispatchEvent(new Event('fisionerv:sales-refresh'));
        } catch (e) { setError(e.message); } finally { setOcupado(false); }
    }
    return <Bloque titulo="Cobro y eliminación masiva de citas">
        <p className="mb-4 text-xs text-slate-500">El cobro aplica el saldo pendiente individual de cada cita. La eliminación está prohibida para citas con pagos para evitar pérdida de datos financieros. Máximo 100 citas por operación.</p>
        <input className={`${CAMPO} mb-3`} placeholder="Filtrar por paciente, servicio o fecha" value={consulta} onChange={e => setConsulta(e.target.value)} />
        <div className="max-h-[400px] overflow-auto rounded-xl border"><table className="w-full min-w-[550px] text-left text-xs"><thead><tr className="bg-slate-50"><th className="p-3">Selección</th><th>Paciente</th><th>Fecha</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{visibles.map(c => <tr key={c.id} className="border-t"><td className="p-3"><input type="checkbox" aria-label={`Cita ${c.id}`} checked={seleccion.includes(c.id)} onChange={() => toggle(c.id)} /></td><td>{c.paciente_nombre}</td><td>{c.fecha}</td><td>{c.servicio_nombre}</td><td>{c.estado}</td></tr>)}</tbody></table></div>
        <div className="mt-4 flex flex-wrap items-center gap-3"><span className="text-sm">{seleccion.length} seleccionadas</span><select className={`${CAMPO} max-w-44`} value={metodo} onChange={e => setMetodo(e.target.value)}><option value="efectivo">Efectivo</option><option value="tarjeta">Tarjeta</option><option value="transferencia">Transferencia</option><option value="otro">Otro</option></select><button disabled={ocupado || !seleccion.length} onClick={() => procesar('cobrar')} className={BOTON}>Cobrar saldos</button><button disabled={ocupado || !seleccion.length} onClick={() => procesar('eliminar')} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Eliminar citas</button></div>
        <div className="mt-4"><Mensaje error={error} mensaje={mensaje} /></div>
    </Bloque>;
}

export function ControlOperativoView({ role }) {
    const admin = role === 'admin';
    const opciones = [['ocupacion', 'Ocupación semanal'], ...(admin ? [['comisiones', 'Comisiones y tarifas'], ['masivo', 'Acciones masivas'], ['bitacora', 'Bitácora de agenda']] : [])];
    const [tab, setTab] = useState('ocupacion');
    return <main className="min-h-0 flex-1 overflow-auto bg-[#f6f8fc] p-4 sm:p-6"><div className="mx-auto max-w-7xl space-y-4">
        <header className="rounded-3xl bg-gradient-to-r from-[#071d44] to-[#1746D1] p-5 text-white"><h2 className="text-2xl font-black">Control operativo</h2><p className="mt-1 text-sm text-blue-100">Ocupación, comisiones, movimientos de agenda y operaciones masivas.</p></header>
        <nav className="flex flex-wrap gap-2">{opciones.map(([id, nombre]) => <button key={id} onClick={() => setTab(id)} className={`rounded-xl border px-3 py-2 text-xs font-bold ${tab === id ? 'border-blue-700 bg-blue-700 text-white' : 'bg-white text-slate-600'}`}>{nombre}</button>)}</nav>
        {tab === 'ocupacion' && <OcupacionView />}
        {tab === 'comisiones' && admin && <FinanzasConfigView />}
        {tab === 'masivo' && admin && <MasivoView />}
        {tab === 'bitacora' && admin && <BitacoraView />}
    </div></main>;
}
