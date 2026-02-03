import { Link } from "react-router-dom";
import { PhoneCall } from "lucide-react";
import MorphicNavbar from "@/components/MorphicNavbar";

export default function HeaderNav() {
    const items = [
        { id: "inicio", label: "Inicio", href: "/" },
        { id: "servicios", label: "Servicios", href: "/servicios" },
        { id: "equipo", label: "Equipo", href: "/equipo" },
        { id: "agenda", label: "Agenda", href: "/agenda" },
        { id: "opiniones", label: "Opiniones", href: "/opiniones" },
        { id: "convenios", label: "Convenios", href: "/convenios" },
        { id: "contacto", label: "Contacto", href: "/contacto" },
    ];
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
                <div className="hidden md:block">
                    <MorphicNavbar items={items} />
                </div>

                <Link
                    to="/agenda"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#004aad] px-4 py-2 text-sm font-semibold text-white shadow hover:brightness-110"
                >
                    <PhoneCall className="h-4 w-4" />
                    Agendar
                </Link>
            </div>
        </header>
    );
}
