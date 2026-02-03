// src/components/Clinica.jsx
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, ShieldCheck } from "lucide-react";

export default function Clinica() {
    return (
        <section className="rounded-3xl bg-white border border-slate-200 shadow-lg p-8">
            <div className="grid gap-8 lg:grid-cols-2 items-center">
                <div>
                    <p className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-sm text-slate-700 border border-slate-200">
                        <ShieldCheck className="h-4 w-4 text-[#004aad]" />
                        Clínica de fisioterapia y rehabilitación
                    </p>

                    <h1 className="mt-5 text-4xl font-semibold text-[#004aad]">FisioNerv</h1>

                    <p className="mt-4 text-lg font-semibold text-slate-900">
                        Fisioterapia avanzada con enfoque humano
                    </p>

                    <ul className="mt-6 space-y-3 text-slate-700">
                        <li className="flex gap-3">
                            <span className="mt-1 h-7 w-7 rounded-full bg-[#004aad]/10 grid place-items-center">
                                <ShieldCheck className="h-4 w-4 text-[#004aad]" />
                            </span>
                            Evaluación precisa y plan de tratamiento a tu medida.
                        </li>
                        <li className="flex gap-3">
                            <span className="mt-1 h-7 w-7 rounded-full bg-[#004aad]/10 grid place-items-center">
                                <ShieldCheck className="h-4 w-4 text-[#004aad]" />
                            </span>
                            Rehabilitación funcional enfocada en tu vida diaria.
                        </li>
                        <li className="flex gap-3">
                            <span className="mt-1 h-7 w-7 rounded-full bg-[#004aad]/10 grid place-items-center">
                                <ShieldCheck className="h-4 w-4 text-[#004aad]" />
                            </span>
                            Seguimiento con metas claras y progresión medible.
                        </li>
                    </ul>

                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link
                            to="/equipo"
                            className="inline-flex items-center justify-center rounded-2xl bg-[#004aad] px-6 py-3 text-sm font-semibold text-white shadow hover:brightness-110"
                        >
                            Conoce al equipo
                        </Link>

                        <Link
                            to="/contacto"
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 border border-slate-200 shadow-sm hover:bg-slate-50"
                        >
                            <MapPin className="h-4 w-4 text-[#004aad]" />
                            Ver ubicación
                        </Link>
                    </div>
                </div>

                {/* Cards (solo ejemplo, mantén tus imágenes actuales) */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <img src="/clinica.png" alt="Instalaciones" className="h-44 w-full object-cover" />
                        <div className="p-4">
                            <p className="font-semibold text-slate-900">Instalaciones cómodas</p>
                            <p className="mt-1 text-sm text-slate-600">
                                Espacios limpios, privados y diseñados para rehabilitación.
                            </p>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <img src="/sala.png" alt="Equipo" className="h-44 w-full object-cover" />
                        <div className="p-4">
                            <p className="font-semibold text-slate-900">Equipo y actualización</p>
                            <p className="mt-1 text-sm text-slate-600">
                                Herramientas modernas para evaluación y terapia.
                            </p>
                        </div>
                    </div>
                    <div className="sm:col-span-2 rounded-3xl border border-slate-200 mt-4 bg-white p-6 shadow-lg dark:bg-neutral-800 dark:border-neutral-600 dark:shadow-neutral-700">
                        <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-[#004aad]">
                            Tu progreso, paso a paso.
                        </p>
                        <p className="mt-2 text-sm text-slate-600 dark:text-white/90">
                            En Fisionerv transformamos la evidencia científica en un trato cercano,
                            claro y profundamente humano. Valoramos cada caso con rigor, diseñamos
                            planes de rehabilitación personalizados y acompañamos a nuestros pacientes
                            paso a paso para recuperar movilidad, función y calidad de vida.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
