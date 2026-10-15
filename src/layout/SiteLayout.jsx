import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { PhoneCall, Menu, X, Instagram, Facebook, MapPin, Clock3 } from "lucide-react";
import { motion } from "framer-motion";
import { ImagenesSitioProvider, useImagenesSitio } from "../shared/useImagenesSitio";

// Utiliza <Outlet /> cuando SiteLayout sea una ruta padre en React Router.
// También permite children si tu App ya compone las páginas directamente.
export default function SiteLayout({ children }) {
    return (
        <ImagenesSitioProvider>
            <HeaderNav />
            <main>{children ?? <Outlet />}</main>
            <Footer />
        </ImagenesSitioProvider>
    );
}

const NAV_ITEMS = [
    { id: "inicio", label: "Inicio", href: "/" },
    { id: "servicios", label: "Servicios", href: "/servicios" },
    { id: "equipo", label: "Equipo", href: "/equipo" },
    { id: "agenda", label: "Agenda", href: "/agenda" },
    { id: "opiniones", label: "Opiniones", href: "/opiniones" },
    { id: "convenios", label: "Convenios", href: "/convenios" },
    { id: "contacto", label: "Contacto", href: "/contacto" },
];

function MorphicNavbar({ items = [], className = "" }) {
    const location = useLocation();
    return (
        <nav aria-label="Navegación" className={`relative rounded-2xl bg-neutral-100/90 px-2 py-2 backdrop-blur-md dark:bg-black/70 ${className}`}>
            <ul className="relative flex items-center gap-1 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {items.map((item) => (
                    <li key={item.id} className="relative p-1">
                        <Link to={item.href} className="relative z-10 block rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:text-slate-900 dark:text-white/90">
                            {location.pathname === item.href && (
                                <motion.span
                                    layoutId="morphic-pill"
                                    className="absolute inset-0 -z-10 rounded-xl bg-neutral-100/90 shadow-sm ring-1 ring-black/10 dark:bg-neutral-800"
                                    transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.7 }}
                                />
                            )}
                            {item.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

export function HeaderNav() {
    const { obtenerImagen } = useImagenesSitio();
    const icono = obtenerImagen("marca.icono", "/onerv.png");
    const logoOscuro = obtenerImagen("marca.logo_oscuro", "/logo_b&w.png");
    const logoClaro = obtenerImagen("marca.logo_claro", "/logo_w&b.png");
    const location = useLocation();
    const [open, setOpen] = useState(false);

    const items = NAV_ITEMS;

    useEffect(() => setOpen(false), [location.pathname]);

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    return (
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-neutral-100/90 backdrop-blur dark:border-slate-800 dark:bg-black/70">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
                <Link to="/" className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-[--primary]/10 ring-1 ring-[--primary]/20">
                        {icono && <img src={icono} alt="Fisionerv" className="h-9 w-9" loading="eager" />}
                    </div>

                    <div className="flex items-center">
                        {logoOscuro && <img className="w-40 sm:w-48 dark:hidden" src={logoOscuro} alt="FisioNerv" loading="eager" />}
                        {logoClaro && <img className="hidden w-40 sm:w-48 dark:block" src={logoClaro} alt="FisioNerv (blanco)" loading="eager" />}
                    </div>
                </Link>

                {/* Desktop */}
                <div className="hidden lg:block flex-1 min-w-0">
                    <div className="flex justify-center min-w-0">
                        <MorphicNavbar items={items} className="max-w-full" />
                    </div>
                </div>


                <div className="flex items-center gap-2">
                    {/* CTA visible siempre */}
                    <Link
                        to="/agenda"
                        className="
                            inline-flex items-center gap-2 rounded-xl bg-[#004aad]
                            px-3 py-2 text-sm font-semibold text-white shadow hover:brightness-110
                            md:px-3 md:py-2 md:text-sm sm:hidden
                        "
                    >
                        <PhoneCall className="h-4 w-4" />
                        <span className="hidden lg:inline">Agendar</span>
                    </Link>

                    {/* Botón menú móvil */}
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/70 text-slate-900 shadow-sm hover:bg-white lg:hidden dark:border-slate-800 dark:bg-black/40 dark:text-white"
                        aria-label="Abrir menú"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Drawer móvil */}
            <div
                className={[
                    "fixed inset-0 lg:hidden",
                    open ? "pointer-events-auto" : "pointer-events-none",
                ].join(" ")}
                aria-hidden={!open}
            >
                {/* Overlay fuerte */}
                <div
                    onClick={() => setOpen(false)}
                    className={[
                        "absolute inset-0 bg-black/55 backdrop-blur-[2px] transition-opacity",
                        open ? "opacity-100" : "opacity-0",
                    ].join(" ")}
                />

                {/* Panel opaco */}
                <div
                    className={[
                        "absolute right-0 top-0 h-dvh w-[min(100vw,380px)]", // 👈 100vw para 320px
                        "bg-white text-slate-900 shadow-2xl",
                        "dark:bg-neutral-950 dark:text-white",
                        "transform transition-transform duration-300 ease-out",
                        open ? "translate-x-0" : "translate-x-full hidden",
                        "flex flex-col", // 👈 clave
                    ].join(" ")}
                >
                    {/* Header fijo */}
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Menú</p>

                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-800 dark:bg-neutral-900 dark:text-white"
                            aria-label="Cerrar menú"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Contenido scrolleable */}
                    <nav className="flex-1 overflow-y-auto px-4 py-4">
                        <ul className="space-y-1">
                            {items.map((it) => {
                                const active = location.pathname === it.href;
                                return (
                                    <li key={it.id}>
                                        <Link
                                            to={it.href}
                                            className={[
                                                "flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold",
                                                active
                                                    ? "bg-[#004aad]/10 text-[#004aad]"
                                                    : "text-slate-900 hover:bg-slate-50 dark:text-white dark:hover:bg-white/5",
                                            ].join(" ")}
                                        >
                                            <span>{it.label}</span>
                                            <span className="text-xs text-slate-400">›</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* Footer fijo (para que nunca tape el menú) */}
                    <div className="border-t border-slate-200 p-4 dark:border-slate-800">
                        <Link
                            to="/agenda"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#004aad] px-4 py-3 text-sm font-semibold text-white shadow hover:brightness-110"
                        >
                            <PhoneCall className="h-4 w-4" />
                            Agendar cita
                        </Link>
                    </div>
                </div>

            </div >
        </header >
    );
}

export function Footer() {
    const { obtenerImagen } = useImagenesSitio();
    const icono = obtenerImagen("marca.icono", "/onerv.png");
    const desarrollador = obtenerImagen("marca.desarrollador", "/logo_robots.png");
    const year = new Date().getFullYear();
    const enlaces = [
        { texto: "Inicio", ruta: "/" },
        { texto: "Servicios", ruta: "/servicios" },
        { texto: "Opiniones", ruta: "/opiniones" },
        { texto: "Convenios", ruta: "/convenios" },
    ];
    const servicios = [
        { texto: "Valoración", ruta: "/servicios" },
        { texto: "Terapia manual", ruta: "/servicios" },
        { texto: "Rehabilitación", ruta: "/servicios" },
        { texto: "Agendar cita", ruta: "/agenda" },
    ];
    const redes = [
        { url: "https://www.facebook.com/Fisionerv.mx", nombre: "Facebook", Icono: Facebook },
        { url: "https://www.instagram.com/fisionerv.mx/", nombre: "Instagram FisioNerv", Icono: Instagram },
        { url: "https://www.instagram.com/maumedinaft/", nombre: "Instagram Mau Medina", Icono: Instagram },
    ];

    return (
        <footer className="bg-[#004aad] text-white">
            <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
                <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4 md:gap-10">
                    <div>
                        <div className="flex items-center gap-3">
                            {icono && <img src={icono} alt="FisioNerv" className="h-12 w-12 rounded-2xl bg-white/90 p-2" />}
                            <div>
                                <p className="text-lg font-semibold">FisioNerv</p>
                                <p className="text-xs text-white/80">Clínica de fisioterapia</p>
                            </div>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-white/85">Atención profesional en fisioterapia, rehabilitación y seguimiento.</p>
                        <div className="mt-5 flex gap-3">
                            {redes.map(({ url, nombre, Icono }) => (
                                <a key={url} href={url} target="_blank" rel="noreferrer" aria-label={nombre} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 ring-1 ring-white/20 hover:bg-white/15">
                                    <Icono className="h-5 w-5" />
                                </a>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h2 className="font-semibold md:text-lg">Enlaces</h2>
                        <ul className="mt-4 space-y-2 text-sm text-white/85 md:text-base">
                            {enlaces.map(({ texto, ruta }) => <li key={texto}><Link to={ruta} className="hover:text-white">{texto}</Link></li>)}
                        </ul>
                    </div>
                    <div>
                        <h2 className="font-semibold md:text-lg">Servicios</h2>
                        <ul className="mt-4 space-y-2 text-sm text-white/85 md:text-base">
                            {servicios.map(({ texto, ruta }) => <li key={texto}><Link to={ruta} className="hover:text-white">{texto}</Link></li>)}
                        </ul>
                    </div>
                    <div>
                        <h2 className="font-semibold md:text-lg">Contacto</h2>
                        <div className="mt-4 space-y-4 text-sm text-white/85 md:text-base">
                            <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /> Calle 15 entre Av. 2 y 4, Córdoba, Veracruz</p>
                            <p className="flex items-start gap-2"><Clock3 className="mt-0.5 h-4 w-4 shrink-0" /> Agenda de Lunes a Sábado</p>
                            <Link to="/contacto" className="inline-block underline underline-offset-4 hover:text-white">Ver ubicación</Link>
                        </div>
                    </div>
                </div>
                <div className="mt-10 flex flex-col gap-4 border-t border-white/20 pt-6 text-xs text-white/80 sm:flex-row sm:items-center sm:justify-between">
                    <p>© {year} FisioNerv. Todos los derechos reservados.</p>
                    <div className="flex items-center gap-2">
                        <span>Desarrollado por</span>
                        <a href="https://r-obots.vercel.app/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 hover:bg-white/15">
                            {desarrollador && <img src={desarrollador} alt="RObots" className="h-7 w-7 rounded-full object-contain" />}
                            <span className="font-semibold text-white">RObots</span>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
