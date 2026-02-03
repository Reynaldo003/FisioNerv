// src/pages/EquipoPage.jsx
import { Link } from "react-router-dom";
import Equipo from "@/components/Equipo";
import { HeartHandshake, BadgeCheck, Activity, ArrowRight } from "lucide-react";

export default function EquipoPage() {


    return (
        <div className="mx-auto max-w-6xl px-4 py-10 space-y-10">
            {/* Intro */}


            {/* Componente interactivo */}
            <Equipo
                title="Conoce al equipo"
                subtitle="Toca un perfil para ver más detalles. (Interacción ligera, ideal para salud)"
            />

            {/* CTA secundaria */}
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            ¿Quieres ver tratamientos?
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">
                            Conoce los servicios y elige el enfoque que más se adapte a tu caso.
                        </p>
                    </div>

                    <Link
                        to="/servicios"
                        className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 border border-slate-200 shadow-sm hover:bg-slate-50"
                    >
                        Ver tratamientos
                    </Link>
                </div>
            </section>
        </div>
    );
}
