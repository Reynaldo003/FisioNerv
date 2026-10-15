import { Link } from "react-router-dom";
import { ShieldCheck, MapPin, ArrowRight, BadgeCheck, ClipboardList, Stethoscope, TrendingUp } from "lucide-react";
import { TextAnimate } from "@/components/ui/text-animate";
import { useImagenesSitio } from "../shared/useImagenesSitio";

export default function Inicio() {
    const { obtenerImagen } = useImagenesSitio();
    const imagenesQuienes = [
        obtenerImagen("inicio.quienes.1", "/foto20.jpeg"),
        obtenerImagen("inicio.quienes.2", "/foto21.jpeg"),
        obtenerImagen("inicio.quienes.3", "/foto5.jpeg"),
        obtenerImagen("inicio.quienes.4", "/foto10.jpeg"),
    ].filter(Boolean);

    return (
        <>
            <Hero imagen={obtenerImagen("inicio.hero", "/fisio_fondo.png")} />
            <div className="mx-auto max-w-6xl space-y-14 px-4 py-10">
                <Clinica
                    imagenClinica={obtenerImagen("inicio.clinica", "/clinica.png")}
                    imagenSala={obtenerImagen("inicio.sala", "/sala.png")}
                />
                <QuienesSomos images={imagenesQuienes} />
                <FormaTrabajo />
            </div>
        </>
    );
}

function Hero({ imagen }) {
    return (
        <section className="relative w-full">
            <div className="relative h-[720px] w-full overflow-hidden">
                {imagen && <img src={imagen} alt="Fisioterapeuta" className="h-full w-full object-cover" />}
                <div className="absolute inset-0 bg-black/35" />
            </div>

            {/* Contenido centrado */}
            <div className="absolute inset-0 flex items-center">
                <div className="mx-auto w-full max-w-6xl px-4">
                    <div className="max-w-xl">
                        <h2 className="text-4xl font-semibold text-white leading-tight">
                            LFT. Edgar Mauricio<br /> Medina Cruz
                        </h2>

                        <p className="mt-2 text-white/80 text-base font-semibold">
                            Especialidad en rehabilitación neurológica
                        </p>

                        <p className="mt-2 text-white/80 text-base font-semibold">
                            Maestría en rehabilitación de traumatología y ortopedia
                        </p>

                        <p className="mt-2 text-white/80 text-base font-semibold">
                            Maestría en rehabilitación oncológica
                        </p>

                        <p className="mt-2 text-white/80 text-base font-semibold">
                            Ced. Prof. <span className="font-bold">14168874</span>
                        </p>
                        <div className="mt-7 flex flex-wrap gap-3">
                            <Link
                                to="/agenda"
                                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-[#004aad] shadow hover:brightness-95"
                            >
                                Agendar valoración
                            </Link>

                            <Link
                                to="/servicios"
                                className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/25 hover:bg-white/15"
                            >
                                Ver tratamientos →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Clinica({ imagenClinica, imagenSala }) {
    return (
        <section className="rounded-3xl bg-white border border-slate-200 shadow-lg p-8">
            <div className="grid gap-8 lg:grid-cols-2 items-center">
                <div>
                    <p className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-sm text-slate-700 border border-slate-200">
                        <ShieldCheck className="h-4 w-4 text-[#004aad]" />
                        Permiso sanitario COFEPRIS: 2530062002AA00019
                    </p>
                    <h1 className="mt-5 text-4xl font-semibold text-[#004aad]">Fisionerv</h1>

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
                        {imagenClinica && <img src={imagenClinica} alt="Instalaciones" className="h-44 w-full object-cover" />}
                        <div className="p-4">
                            <p className="font-semibold text-slate-900">Instalaciones cómodas</p>
                            <p className="mt-1 text-sm text-slate-600">
                                Espacios limpios, privados y diseñados para rehabilitación.
                            </p>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        {imagenSala && <img src={imagenSala} alt="Equipo" className="h-44 w-full object-cover" />}
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

function QuienesSomos({
    PRIMARY = "#004aad",
    images = ["/foto20.jpeg", "/foto21.jpeg", "/foto5.jpeg", "/foto10.jpeg"],
}) {
    return (
        <section id="quienes" className="mt-16  max-w-6xl">
            <div className="rounded-[32px] border border-slate-200 bg-white shadow-lg">
                <div className="grid gap-8 p-6 lg:grid-cols-2 lg:p-10">
                    <div className="grid grid-cols-2 gap-3">
                        {images.slice(0, 4).map((src, i) => (
                            <div
                                key={i}
                                className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 aspect-[4/4]"
                            >
                                <img
                                    src={src}
                                    alt=""
                                    className="absolute inset-0 h-full w-full object-cover block"
                                    loading="lazy"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Texto */}
                    <div className="flex flex-col justify-center">
                        <p
                            className="text-xs font-semibold uppercase tracking-[0.18em] text-[#004aad]"
                        >
                            Sobre la clínica
                        </p>

                        <TextAnimate
                            by="word"
                            animation="blurInUp"
                            className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl dark:text-[#004aad]"
                        >
                            ¿Quiénes somos?
                        </TextAnimate>

                        <p className="mt-3 text-base text-slate-600 dark:text-white/90">
                            Clínica de fisioterapia enfocada en la atención basada en evidencia y el acompañamiento humano.
                            Integramos evaluación clínica, razonamiento terapéutico y planes personalizados para reducir el dolor
                            y recuperar la funcionalidad, la independencia y la confianza del paciente mediante educación,
                            movimiento y trato cálido.
                        </p>


                        <div className="mt-5 space-y-3 text-sm text-slate-700">
                            <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-[#004aad]">
                                Objetivos
                            </p>
                            {[
                                "Ayudarte a volver a lo que amas...",
                                "Crecer tu confianza.",
                                "Darte seguridad y resultados reales.",
                            ].map((t) => (
                                <div key={t} className="flex items-start gap-3">
                                    <span
                                        className="mt-0.5 inline-flex h-6 w-6 ml-6 items-center justify-center rounded-full"
                                        style={{ backgroundColor: `${PRIMARY}15`, color: PRIMARY }}
                                    >
                                        <BadgeCheck className="h-5 w-5" />
                                    </span>
                                    <span className="dark:text-white/90 font-semibold">{t}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                            <a
                                href="/servicios"
                                className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg"
                                style={{ backgroundColor: PRIMARY }}
                            >
                                Conoce tratamientos <ArrowRight className="h-4 w-4" />
                            </a>

                            <a
                                href="/agenda"
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                            >
                                Agendar valoración
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function FormaTrabajo() {
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
