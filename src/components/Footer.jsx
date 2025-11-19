import { MapPin, Phone, Clock3 } from "lucide-react";

export default function Footer({ CLINIC }) {
    return (
        <footer className="mx-auto mt-16 max-w-6xl px-4 pb-10">
            {/* halo de color */}
            <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-64 -z-10 
                   bg-gradient-to-t from-[--primary]/30 via-transparent to-transparent blur-3xl"
                aria-hidden="true"
            />

            <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl/30 backdrop-blur dark:bg-neutral-800 dark:shadow-neutral-100">
                {/* manchas */}
                <div className="pointer-events-none absolute -left-16 top-0 h-40 w-40 rounded-full bg-[#004aad]/20 blur-3xl" />
                <div className="pointer-events-none absolute -right-10 bottom-0 h-48 w-48 rounded-full bg-[#004aad]/20 blur-3xl" />

                <div className="relative px-6 py-7 sm:px-8 sm:py-8 shadow-2xl">
                    {/* bloque principal */}
                    <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                        {/* info clínica */}
                        <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
                            <div className="flex-shrink-0 inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/80 shadow-lg">
                                {/* logo siempre circular y sin deformar */}
                                <img
                                    src="/onerv.png"
                                    alt="FisioNerv"
                                    className="h-10 w-10 rounded-full object-contain"
                                />
                            </div>

                            <div className="text-sm text-slate-700 dark:text-neutral-200 text-center md:text-left">
                                <p className="text-base font-semibold text-slate-900 dark:text-neutral-200">
                                    {CLINIC.name}
                                </p>
                                <p className="mt-1 flex items-center justify-center gap-2 text-slate-600 dark:text-neutral-200 md:justify-start">
                                    <MapPin className="h-4 w-4 text-[--primary]" />
                                    <span>{CLINIC.address}</span>
                                </p>
                                <p className="mt-1 flex items-center justify-center gap-2 text-slate-600 dark:text-neutral-200 md:justify-start">
                                    <Clock3 className="h-4 w-4 text-[--primary]" />
                                    <span>Agenda tus sesiones de Lunes a Sábado</span>
                                </p>
                                <a
                                    href={`tel:${CLINIC.phone}`}
                                    className="mt-2 inline-flex items-center justify-center gap-2 text-[--primary] hover:underline md:justify-start"
                                >
                                    <Phone className="h-4 w-4" />
                                    <span>{CLINIC.phone}</span>
                                </a>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="flex flex-col items-center gap-3 md:items-end">
                            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-neutral-200 text-center md:text-right">
                                ¿Listo para agendar?
                            </p>
                            <a
                                href={`https://wa.me/${CLINIC.whatsapp || ""}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-full bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 dark:border-neutral-500 dark:bg-neutral-800 dark:hover:bg-neutral-900 px-5 py-2.5 text-sm font-bold text-[#004aad] shadow-lg shadow-[--primary]/30 transition hover:-translate-y-0.5"
                            >
                                Agendar por WhatsApp
                            </a>

                            <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-neutral-200">
                                <span className="h-[1px] w-8 bg-slate-200" />
                                <span>Atención personalizada y profesional</span>
                            </div>
                        </div>
                    </div>

                    {/* separador */}
                    <div className="mt-6 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                    {/* línea inferior */}
                    <div className="mt-4 flex flex-col gap-4 text-xs text-slate-500 dark:text-neutral-200 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-center sm:text-left">
                            © {new Date().getFullYear()} {CLINIC.name}. Todos los derechos reservados.
                        </p>

                        <div className="flex items-center justify-center gap-2 sm:justify-end">
                            <span>Desarrollado por</span>
                            <a
                                href="https://r-obots.vercel.app"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 shadow-sm transition hover:bg-slate-50 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                            >
                                <img
                                    src="/logo_robots.png"
                                    alt="RObots"
                                    className="h-7 w-7 rounded-full object-contain"
                                />
                                <span className="text-[11px] font-semibold text-slate-700 dark:text-neutral-200">
                                    RObots
                                </span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
