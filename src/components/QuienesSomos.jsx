// src/components/QuienesSomos.jsx
import { ArrowRight, BadgeCheck } from "lucide-react";
import { TextAnimate } from "@/components/ui/text-animate";

export default function QuienesSomos({
    PRIMARY = "#004aad",
    images = ["/rehabilitacion.png", "/electro.png", "/terapia.png", "/programa.png"],
}) {
    return (
        <section id="quienes" className="mt-16  max-w-6xl">
            <div className="rounded-[32px] border border-slate-200 bg-white shadow-lg">
                <div className="grid gap-8 p-6 lg:grid-cols-2 lg:p-10">
                    <div className="grid grid-cols-2 gap-3">
                        {images.slice(0, 4).map((src, i) => (
                            <div
                                key={i}
                                className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50"
                            >
                                <img
                                    src={src}
                                    alt=""
                                    className="h-full w-full object-cover sm:h-52"
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
                                href="#servicios"
                                className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg"
                                style={{ backgroundColor: PRIMARY }}
                            >
                                Conoce tratamientos <ArrowRight className="h-4 w-4" />
                            </a>

                            <a
                                href="#agenda"
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
