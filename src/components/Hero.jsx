// src/components/Hero.jsx
import { Link } from "react-router-dom";

export default function Hero() {
    return (
        <section className="relative w-full">
            <div className="relative h-[720px] w-full overflow-hidden">
                <img
                    src="/fisio_fondo.png"
                    alt="Fisioterapeuta"
                    className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/35" />
            </div>

            {/* Contenido centrado */}
            <div className="absolute inset-0 flex items-center">
                <div className="mx-auto w-full max-w-6xl px-4">
                    <div className="max-w-xl">
                        <h2 className="text-4xl font-semibold text-white leading-tight">
                            Lic. Edgar Mauricio <br /> Medina Cruz
                        </h2>

                        <p className="mt-3 text-white/90 text-lg font-medium">
                            Tecnología avanzada, trato humano y planes a tu medida.
                        </p>

                        <p className="mt-2 text-white/80 text-sm">
                            Recupera movilidad y reduce dolor con un plan claro, progresivo y medible.
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
