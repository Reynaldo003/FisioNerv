// src/components/Footer.jsx
import { Link } from "react-router-dom";
import { Instagram, Facebook, MapPin, Clock3 } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-[#004aad] text-white">
            <div className="mx-auto max-w-6xl px-4 py-12">
                <div className="grid gap-10 md:grid-cols-4">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-3">
                            <img src="/onerv.png" alt="FisioNerv" className="h-12 w-12 rounded-2xl bg-white/90 p-2" />
                            <div>
                                <p className="font-semibold text-base">FisioNerv</p>
                                <p className="text-xs text-white/80">Clínica de fisioterapia</p>
                            </div>
                        </div>

                        <p className="mt-4 text-sm text-white/85 leading-6">
                            Atención profesional en fisioterapia, rehabilitación y seguimiento.
                        </p>

                        <div className="mt-5 flex items-center gap-3">
                            <a
                                href="https://www.facebook.com/Fisionerv.mx"
                                target="_blank"
                                rel="noreferrer"
                                className="grid h-10 w-10 place-items-center rounded-full bg-white/10 ring-1 ring-white/20 hover:bg-white/15"
                                aria-label="Facebook"
                            >
                                <Facebook className="h-5 w-5" />
                            </a>

                            <a
                                href="https://www.instagram.com/fisionerv.mx/"
                                target="_blank"
                                rel="noreferrer"
                                className="grid h-10 w-10 place-items-center rounded-full bg-white/10 ring-1 ring-white/20 hover:bg-white/15"
                                aria-label="Instagram"
                            >
                                <Instagram className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Enlaces */}
                    <div>
                        <p className="text-sm font-semibold">Enlaces</p>
                        <ul className="mt-4 space-y-2 text-sm text-white/85">
                            <li><Link to="/" className="hover:text-white">Inicio</Link></li>
                            <li><Link to="/servicios" className="hover:text-white">Servicios</Link></li>
                            <li><Link to="/opiniones" className="hover:text-white">Opiniones</Link></li>
                            <li><Link to="/convenios" className="hover:text-white">Convenios</Link></li>
                        </ul>
                    </div>

                    {/* Servicios */}
                    <div>
                        <p className="text-sm font-semibold">Servicios</p>
                        <ul className="mt-4 space-y-2 text-sm text-white/85">
                            <li><Link to="/servicios" className="hover:text-white">Valoración</Link></li>
                            <li><Link to="/servicios" className="hover:text-white">Terapia manual</Link></li>
                            <li><Link to="/servicios" className="hover:text-white">Rehabilitación</Link></li>
                            <li><Link to="/agenda" className="hover:text-white">Agendar cita</Link></li>
                        </ul>
                    </div>

                    {/* Contacto */}
                    <div>
                        <p className="text-sm font-semibold">Contacto</p>
                        <div className="mt-4 space-y-3 text-sm text-white/85">
                            <p className="flex gap-2">
                                <MapPin className="mt-0.5 h-4 w-4" />
                                Calle 15 entre Av. 2 y 4, Córdoba, Veracruz
                            </p>
                            <p className="flex gap-2">
                                <Clock3 className="mt-0.5 h-4 w-4" />
                                Agenda de Lunes a Sábado
                            </p>
                            <Link to="/contacto" className="underline underline-offset-4 hover:text-white">
                                Ver ubicación
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Barra inferior */}
                <div className="mt-10 border-t border-white/20 pt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs text-white/80">
                    <p>© {new Date().getFullYear()} FisioNerv. Todos los derechos reservados.</p>

                    {/* Bloque “Desarrollado por RObots” (tu diseño anterior) */}
                    <div className="flex items-center justify-center gap-2 sm:justify-end">
                        <span>Desarrollado por</span>
                        <a
                            href="https://r-obots.vercel.app/"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 shadow-sm transition hover:bg-white/15"
                        >
                            <img
                                src="/logo_robots.png"
                                alt="RObots"
                                className="h-7 w-7 rounded-full object-contain"
                            />
                            <span className="text-[11px] font-semibold text-white">
                                RObots
                            </span>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
