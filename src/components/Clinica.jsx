// src/components/Clinica.jsx
import { useState } from "react";
import { CalendarDays, MapPin, Activity, Brain, HeartHandshake } from "lucide-react";
import { TextAnimate } from "@/components/ui/text-animate";
import { NumberTicker } from "@/components/ui/number-ticker";

export default function Clinica({ CLINIC }) {
    const [focusArea] = useState("interior");

    const images = {
        fachada: "/clinica.png",
        interior: "/sala.png",
    };

    return (
        <section
            id="inicio"
            className="relative w-full overflow-hidden bg-slate-950 text-white"
        >
            <div className="absolute inset-0">
                <img
                    src={images.fachada}
                    alt="Clínica FisioNerv"
                    className="h-full w-full object-cover opacity blur-[1px]"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-neutral-200/50 via-[#004aad]/70 to-white/40 dark: bg-gradient-to-r dark:from-black/50 dark:via-[#004aad]/70 dark:to-black/40" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_55%)]" />
            </div>

            <div className="relative mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 lg:flex-row lg:items-center lg:py-24">
                {/* COLUMNA IZQUIERDA – INFO CLÍNICA */}
                <div className="max-w-xl space-y-6">
                    <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs ring-1 ring-white/20 ">
                        <Activity className="h-3.5 w-3.5 text-[#004aad]" />
                        Clínica de fisioterapia y rehabilitación en Córdoba, Veracruz
                    </p>

                    <div className="space-y-1">
                        <TextAnimate
                            by="word"
                            animation="blurInUp"
                            className="text-4xl font-bold leading-tight md:text-5xl"
                        >
                            {CLINIC.name}
                        </TextAnimate>
                        <TextAnimate
                            by="word"
                            animation="blurInUp"
                            className="text-2xl font-semibold text-sky-200 md:text-3xl"
                        >
                            Terapia avanzada, enfoque humano.
                        </TextAnimate>
                    </div>

                    <p className="text-sm md:text-md font-bold dark:text-white/90 leading-relaxed text-white">
                        Somos una clínica especializada en fisioterapia neuromuscular y
                        rehabilitación musculoesquelética. Contamos con instalaciones
                        equipadas, programas de ejercicio terapéutico y protocolos basados
                        en evidencia para ayudarte a regresar seguro a tus actividades.
                    </p>

                    <p className="text-sm text-white font-semibold dark:text-white/90">
                        En <span className="font-semibold">{CLINIC.name}</span> trabajamos
                        con sesiones uno a uno, planes de tratamiento personalizados y
                        seguimiento continuo, para que cada avance en tu recuperación se
                        sienta acompañado.
                    </p>

                    {/* Chips de especialidad */}
                    <ul className="mt-2 flex flex-wrap gap-2 text-xs">
                        <li className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/25">
                            Neurorehabilitación
                        </li>
                        <li className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/25">
                            Dolor musculoesquelético
                        </li>
                        <li className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/25">
                            Fisioterapia deportiva
                        </li>
                        <li className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/25">
                            Ejercicio terapéutico
                        </li>
                    </ul>

                    {/* CTAs – clínica */}
                    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)]">
                        <a
                            href="#agenda"
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#004aad] px-5 py-3 text-sm font-medium text-white shadow-lg shadow-[#004aad]/60 hover:brightness-110"
                        >
                            <CalendarDays className="h-4 w-4" />
                            Agendar valoración
                        </a>
                        <a
                            href="#servicios"
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/35 bg-white/10 px-5 py-3 text-sm font-medium hover:bg-white/15"
                        >
                            Ver tratamientos
                        </a>
                    </div>

                    {/* Info rápida */}
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs md:text-sm text-white/80">
                        <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {CLINIC.address}
                        </span>
                        <span className="hidden h-1 w-1 rounded-full bg-white/60 md:inline-block" />
                        <span className="inline-flex items-center gap-1">
                            <HeartHandshake className="h-3.5 w-3.5" />
                            Atención 100% personalizada
                        </span>
                    </div>

                    {/* Link para ir al mapa */}
                    <div className="mt-1 text-xs text-white/70">
                        <a href="#ubicacion" className="underline underline-offset-4 hover:text-sky-200">
                            Ver cómo llegar en el mapa
                        </a>
                    </div>
                </div>

                {/* COLUMNA DERECHA – TARJETA INSTALACIONES */}
                <div className="flex flex-1 items-center justify-center">
                    <div className="relative max-w-md">
                        <div className="relative overflow-hidden rounded-3xl bg-white/10 p-4 backdrop-blur-xl ring-1 ring-white/25 shadow-[0_24px_80px_rgba(0,0,0,0.7)]">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_55%)]" />

                            <div className="relative space-y-3">
                                {/* Imagen principal: interior / gimnasio */}
                                <div className="overflow-hidden rounded-2xl ring-1 ring-white/20">
                                    <img
                                        src={images[focusArea]}
                                        alt="Área de rehabilitación FisioNerv"
                                        className="h-64 w-full object-cover"
                                    />
                                </div>

                                {/* Texto corto */}
                                <div className="space-y-1 text-sm">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">
                                        CLÍNICA CERTIFICADA
                                    </p>
                                    <h3 className="text-base md:text-lg font-semibold leading-snug">
                                        Fisioterapia basada en evidencia, en un espacio diseñado para tu recuperación.
                                    </h3>
                                    <p className="text-xs text-white/80">
                                        Instalaciones pensadas para rehabilitación funcional, entrenamiento terapéutico
                                        y atención cercana al paciente.
                                    </p>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                                    <div className="rounded-2xl bg-slate-900/70 px-2 py-2 ring-1 ring-white/15">
                                        <div className="text-sm font-bold text-sky-200">
                                            <NumberTicker className="text-sky-200" value={5} />
                                            <span className="align-baseline text-[10px]">+ </span>
                                        </div>
                                        <p className="leading-3">años en Córdoba</p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-900/70 px-2 py-2 ring-1 ring-white/15">
                                        <div className="text-sm font-bold text-sky-200">
                                            <NumberTicker className="text-sky-200" value={800} />
                                            <span className="align-baseline text-[10px]">+ </span>
                                        </div>
                                        <p className="leading-3">pacientes atendidos</p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-900/70 px-2 py-2 ring-1 ring-white/15">
                                        <div className="text-sm font-bold text-sky-200">
                                            <NumberTicker className="text-sky-200" value={3} />
                                        </div>
                                        <p className="leading-3">áreas de rehabilitación</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Badges flotantes */}
                        <div className="pointer-events-none absolute -left-3 top-4 hidden -rotate-3 rounded-2xl bg-[#004aad] px-3 py-1.5 text-xs font-semibold text-emerald-200 shadow-lg shadow-white/60 md:inline-flex">
                            <Brain className="mr-1 h-3.5 w-3.5" />
                            Neurorehabilitación &amp; dolor
                        </div>
                        <div className="pointer-events-none absolute -right-6 bottom-[-0.4rem] hidden rotate-3 rounded-2xl bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 dark:bg-neutral-500 dark:text-slate-200 shadow-lg shadow-white/40 md:inline-flex">
                            Resultados medibles desde la primera fase
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
