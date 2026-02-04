// src/components/Footer.jsx
import { Link } from "react-router-dom";
import { Instagram, Facebook, MapPin, Clock3 } from "lucide-react";

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="bg-[#004aad] text-white">
            {/* =======================
          MÓVIL / TABLET < md
      ======================= */}
            <div className="md:hidden">
                <div className="mx-auto max-w-7xl px-4 py-10">
                    <div className="grid gap-8">
                        {/* Marca */}
                        <div>
                            <div className="flex items-center gap-3">
                                <img
                                    src="/onerv.png"
                                    alt="FisioNerv"
                                    className="h-12 w-12 rounded-2xl bg-white/90 p-2"
                                />
                                <div>
                                    <p className="text-base font-semibold">FisioNerv</p>
                                    <p className="text-xs text-white/80">Clínica de fisioterapia</p>
                                </div>
                            </div>

                            <p className="mt-4 text-sm leading-6 text-white/85">
                                Atención profesional en fisioterapia, rehabilitación y seguimiento.
                            </p>

                            <div className="mt-4 flex items-center gap-3">
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
                                    aria-label="Instagram Fisionerv"
                                >
                                    <Instagram className="h-5 w-5" />
                                </a>

                                <a
                                    href="https://www.instagram.com/maumedinaft/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="grid h-10 w-10 place-items-center rounded-full bg-white/10 ring-1 ring-white/20 hover:bg-white/15"
                                    aria-label="Instagram Mau Medina"
                                >
                                    <Instagram className="h-5 w-5" />
                                </a>
                            </div>
                        </div>

                        {/* Enlaces + Servicios en 2 columnas */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm font-semibold">Enlaces</p>
                                <ul className="mt-3 space-y-2 text-sm text-white/85">
                                    <li><Link to="/" className="hover:text-white">Inicio</Link></li>
                                    <li><Link to="/servicios" className="hover:text-white">Servicios</Link></li>
                                    <li><Link to="/opiniones" className="hover:text-white">Opiniones</Link></li>
                                    <li><Link to="/convenios" className="hover:text-white">Convenios</Link></li>
                                </ul>
                            </div>

                            <div>
                                <p className="text-sm font-semibold">Servicios</p>
                                <ul className="mt-3 space-y-2 text-sm text-white/85">
                                    <li><Link to="/servicios" className="hover:text-white">Valoración</Link></li>
                                    <li><Link to="/servicios" className="hover:text-white">Terapia manual</Link></li>
                                    <li><Link to="/servicios" className="hover:text-white">Rehabilitación</Link></li>
                                    <li><Link to="/agenda" className="hover:text-white">Agendar cita</Link></li>
                                </ul>
                            </div>
                        </div>

                        {/* Contacto */}
                        <div>
                            <p className="text-sm font-semibold">Contacto</p>
                            <div className="mt-3 space-y-3 text-sm text-white/85">
                                <p className="flex gap-2">
                                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                                    <span>Calle 15 entre Av. 2 y 4, Córdoba, Veracruz</span>
                                </p>
                                <p className="flex gap-2">
                                    <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
                                    <span>Agenda de Lunes a Sábado</span>
                                </p>

                                <Link
                                    to="/contacto"
                                    className="inline-flex w-fit items-center rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white ring-1 ring-white/20 hover:bg-white/15"
                                >
                                    Ver ubicación
                                </Link>
                            </div>
                        </div>

                        {/* Bottom */}
                        <div className="border-t border-white/20 pt-5">
                            <p className="text-xs text-white/80">
                                © {year} FisioNerv. Todos los derechos reservados.
                            </p>

                            <div className="mt-3 flex items-center gap-2 text-xs text-white/80">
                                <span>Desarrollado por</span>
                                <a
                                    href="https://r-obots.vercel.app/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 shadow-sm transition hover:bg-white/15"
                                >
                                    <img src="/logo_robots.png" alt="RObots" className="h-6 w-6 rounded-full object-contain" />
                                    <span className="text-[11px] font-semibold text-white">RObots</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* =======================
          ESCRITORIO md+
          (exactamente tu diseño)
      ======================= */}
            <div className="hidden md:block">
                <div className="mx-auto max-w-6xl px-4 py-12">
                    <div className="grid gap-10 md:grid-cols-4 pb-6">
                        <div>
                            <div className="flex items-center mt-8 gap-3">
                                <img src="/onerv.png" alt="FisioNerv" className="h-12 w-12 rounded-2xl bg-white/90 p-2" />
                                <div>
                                    <p className="font-semibold text-lg">FisioNerv</p>
                                    <p className="text-sm text-white/80">Clínica de fisioterapia</p>
                                </div>
                            </div>

                            <p className="mt-8 text-sm text-white/85 leading-6">
                                Atención profesional en fisioterapia, rehabilitación y seguimiento.
                            </p>

                            <div className="mt-8 flex items-center justify-center gap-3">
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
                                <a
                                    href="https://www.instagram.com/maumedinaft/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="grid h-10 w-10 place-items-center rounded-full bg-white/10 ring-1 ring-white/20 hover:bg-white/15"
                                    aria-label="Instagram"
                                >
                                    <Instagram className="h-5 w-5" />
                                </a>
                            </div>
                        </div>

                        <div className="mt-8">
                            <p className="text-lg font-semibold">Enlaces</p>
                            <ul className="mt-4 space-y-2 text-base text-white/85">
                                <li><Link to="/" className="hover:text-white">Inicio</Link></li>
                                <li><Link to="/servicios" className="hover:text-white">Servicios</Link></li>
                                <li><Link to="/opiniones" className="hover:text-white">Opiniones</Link></li>
                                <li><Link to="/convenios" className="hover:text-white">Convenios</Link></li>
                            </ul>
                        </div>

                        <div className="mt-8">
                            <p className="text-lg font-semibold">Servicios</p>
                            <ul className="mt-4 space-y-2 text-base text-white/85">
                                <li><Link to="/servicios" className="hover:text-white">Valoración</Link></li>
                                <li><Link to="/servicios" className="hover:text-white">Terapia manual</Link></li>
                                <li><Link to="/servicios" className="hover:text-white">Rehabilitación</Link></li>
                                <li><Link to="/agenda" className="hover:text-white">Agendar cita</Link></li>
                            </ul>
                        </div>

                        <div className="mt-8">
                            <p className="text-lg font-semibold">Contacto</p>
                            <div className="mt-4 space-y-3 text-base text-white/85">
                                <p className="flex gap-2">
                                    <MapPin className="mt-0.5 h-4 w-4" />
                                    Calle 15 entre Av. 2 y 4, Córdoba, Veracruz
                                </p>
                                <p className="flex gap-2 mt-6 mb-6">
                                    <Clock3 className="mt-0.5 h-4 w-4" />
                                    Agenda de Lunes a Sábado
                                </p>
                                <Link to="/contacto" className="underline underline-offset-4 hover:text-white">
                                    Ver ubicación
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 border-t border-white/20 pt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs text-white/80">
                        <p>© {year} FisioNerv. Todos los derechos reservados.</p>
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
            </div>
        </footer>
    );
}
