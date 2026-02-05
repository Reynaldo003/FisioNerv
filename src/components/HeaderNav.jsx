// src/components/HeaderNav.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { PhoneCall, Menu, X } from "lucide-react";
import MorphicNavbar from "@/components/MorphicNavbar";

export default function HeaderNav() {
    const location = useLocation();
    const [open, setOpen] = useState(false);

    const items = useMemo(
        () => [
            { id: "inicio", label: "Inicio", href: "/" },
            { id: "servicios", label: "Servicios", href: "/servicios" },
            { id: "equipo", label: "Equipo", href: "/equipo" },
            { id: "agenda", label: "Agenda", href: "/agenda" },
            { id: "opiniones", label: "Opiniones", href: "/opiniones" },
            { id: "convenios", label: "Convenios", href: "/convenios" },
            { id: "contacto", label: "Contacto", href: "/contacto" },
        ],
        []
    );

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
                        <img src="/onerv.png" className="h-9 w-9 dark:hidden" loading="eager" />
                        <img src="/onerv.png" className="hidden h-9 w-9 dark:block" loading="eager" />
                    </div>

                    <div className="flex items-center">
                        <img className="w-40 sm:w-48 dark:hidden" src="/logo_b&w.png" alt="FisioNerv" loading="eager" />
                        <img className="hidden w-40 sm:w-48 dark:block" src="/logo_w&b.png" alt="FisioNerv (blanco)" loading="eager" />
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
