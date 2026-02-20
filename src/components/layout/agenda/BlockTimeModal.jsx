// /src/components/layout/agenda/BlockTimeModal.jsx
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

const DAYS = [
    { k: "L", label: "Lun" },
    { k: "M", label: "Mar" },
    { k: "X", label: "Mie" },
    { k: "J", label: "Jue" },
    { k: "V", label: "Vie" },
    { k: "S", label: "Sab" },
];

function addMinutesToTime(timeStr, minutesToAdd) {
    if (!timeStr) return "08:00";
    const [h = "0", m = "0"] = String(timeStr).split(":");
    let total = Number(h) * 60 + Number(m) + Number(minutesToAdd || 0);
    if (total < 0) total = 0;
    const hh = String(Math.floor(total / 60) % 24).padStart(2, "0");
    const mm = String(total % 60).padStart(2, "0");
    return `${hh}:${mm}`;
}

export function BlockTimeModal({ preset, onClose, onSave }) {
    const [form, setForm] = useState({
        motivo: "",
        date: preset?.date,
        startTime: preset?.startTime || "08:00",
        endTime: preset?.endTime || addMinutesToTime(preset?.startTime || "08:00", 60),
        repeatEnabled: false,
        repeatDays: ["L", "M", "X", "J", "V", "S"],
        repeatCount: 1,
    });

    useEffect(() => {
        const start = preset?.startTime || "08:00";
        setForm({
            motivo: "",
            date: preset?.date,
            startTime: start,
            endTime: preset?.endTime || addMinutesToTime(start, 60),
            repeatEnabled: false,
            repeatDays: ["L", "M", "X", "J", "V", "S"],
            repeatCount: 1,
        });
    }, [preset?.date, preset?.startTime, preset?.endTime, preset?.professionalId]);

    function toggleDay(dayKey) {
        setForm((prev) => {
            const set = new Set(prev.repeatDays || []);
            if (set.has(dayKey)) set.delete(dayKey);
            else set.add(dayKey);
            return { ...prev, repeatDays: Array.from(set) };
        });
    }

    const canSave = useMemo(() => {
        if (!String(form.motivo || "").trim()) return false;
        if (!form.date) return false;
        if (!form.startTime || !form.endTime) return false;
        return true;
    }, [form]);

    const submit = async (e) => {
        e.preventDefault();
        await onSave?.({ ...form, professionalId: preset?.professionalId ?? null });
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />

            <form
                onSubmit={submit}
                className="relative z-10 w-[min(96vw,720px)] rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden max-h-[88vh] flex flex-col"
            >
                <div className="px-4 sm:px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-800">Bloquear horario</h2>
                        <p className="text-xs text-slate-500">
                            {form.date} · {form.startTime} – {form.endTime}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center"
                    >
                        <X className="h-4 w-4 text-slate-600" />
                    </button>
                </div>

                {/* body scrolleable en móvil */}
                <div className="px-4 sm:px-6 py-4 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Motivo</label>
                        <input
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                            value={form.motivo}
                            onChange={(e) => setForm((p) => ({ ...p, motivo: e.target.value }))}
                            placeholder="Ej. Horario de comida, imprevisto, etc."
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Fecha</label>
                            <input
                                type="date"
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                value={form.date || ""}
                                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Desde</label>
                            <input
                                type="time"
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                value={form.startTime}
                                onChange={(e) => {
                                    const start = e.target.value;
                                    setForm((p) => ({
                                        ...p,
                                        startTime: start,
                                        endTime: addMinutesToTime(start, 60),
                                    }));
                                }}
                            />
                            <p className="text-[10px] text-slate-500 mt-1">
                                Default bloquea 1 hora (puedes ajustar “Hasta”).
                            </p>
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Hasta</label>
                            <input
                                type="time"
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                value={form.endTime}
                                onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-3">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-semibold text-slate-600">Repetición</p>
                            <label className="flex items-center gap-2 text-xs text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={Boolean(form.repeatEnabled)}
                                    onChange={(e) => setForm((p) => ({ ...p, repeatEnabled: e.target.checked }))}
                                />
                                Repetir bloqueo
                            </label>
                        </div>

                        {form.repeatEnabled && (
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="md:col-span-2">
                                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Días</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {DAYS.map((d) => {
                                            const active = (form.repeatDays || []).includes(d.k);
                                            return (
                                                <button
                                                    key={d.k}
                                                    type="button"
                                                    onClick={() => toggleDay(d.k)}
                                                    className={
                                                        "h-9 px-3 rounded-lg border text-xs font-semibold " +
                                                        (active
                                                            ? "bg-violet-600 text-white border-violet-600"
                                                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50")
                                                    }
                                                >
                                                    {d.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                        Repeticiones
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={200}
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                        value={form.repeatCount}
                                        onChange={(e) =>
                                            setForm((p) => ({ ...p, repeatCount: Number(e.target.value || 1) }))
                                        }
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1">
                                        Se creará este bloqueo repetido el número indicado.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-4 sm:px-6 py-3 border-t border-slate-200 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-10 px-4 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={!canSave}
                        className="h-10 px-6 rounded-md bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60 text-sm"
                    >
                        Guardar bloqueo
                    </button>
                </div>
            </form>
        </div>
    );
}