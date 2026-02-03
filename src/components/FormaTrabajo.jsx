import { Link } from "react-router-dom";
import { ClipboardList, Stethoscope, TrendingUp, ArrowRight } from "lucide-react";

export default function FormaTrabajo() {
    const steps = [
        {
            icon: <Stethoscope className="h-5 w-5 text-[#004aad]" />,
            title: "1) Valoración",
            desc: "Entendemos tu caso, objetivos y limitaciones. Revisamos movimiento, dolor y función.",
        },
        {
            icon: <ClipboardList className="h-5 w-5 text-[#004aad]" />,
            title: "2) Plan personalizado",
            desc: "Definimos un plan claro: terapia, ejercicios, educación y progresión por etapas.",
        },
        {
            icon: <TrendingUp className="h-5 w-5 text-[#004aad]" />,
            title: "3) Progreso medible",
            desc: "Damos seguimiento con metas y ajustes. Buscamos retorno seguro a tu actividad diaria.",
        },
    ];

    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">Cómo trabajamos</h2>
                    <p className="mt-1 text-sm text-slate-600">
                        Un proceso simple, claro y enfocado en resultados.
                    </p>
                </div>

                <Link
                    to="/agenda"
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#004aad] px-5 py-2.5 text-sm font-semibold text-white shadow hover:brightness-110"
                >
                    Agendar valoración <ArrowRight className="h-4 w-4" />
                </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
                {steps.map((s) => (
                    <div
                        key={s.title}
                        className="rounded-2xl border border-slate-200 bg-white p-5"
                    >
                        <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#004aad]/10 ring-1 ring-[#004aad]/15">
                                {s.icon}
                            </div>
                            <p className="font-semibold text-slate-900">{s.title}</p>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-700">{s.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
