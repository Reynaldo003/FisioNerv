import { Dock, DockIcon } from "@/components/ui/dock";
import { Home, Instagram, Facebook } from "lucide-react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export default function DockBar() {
    return (
        <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center pb-[calc(14px+env(safe-area-inset-bottom))] mb-10">
            <Dock
                className="backdrop-blur bg-white/75 border border-slate-200 text-slate-900 shadow-lg rounded-2xl px-1 dark:bg-black/75 dark:border-slate-800"
                iconMagnification={60}
                iconDistance={100}
            >
                <DockIcon className="flex items-center gap-3 ml-2">
                    <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Ir al inicio" className="flex items-center justify-center">
                        <Home className="h-5 w-5 hover:w-6 hover:h-6 dark:text-white/75" />
                    </button>
                </DockIcon>

                <div role="separator" aria-orientation="vertical" className="mx-2 h-10 w-px bg-black/15 dark:bg-white/15 self-stretch" />

                <DockIcon className="bg-blue-700/90 ">
                    <a href="https://www.facebook.com/Fisionerv.mx" target="_blank" rel="noreferrer">
                        <Facebook className="w-5 h-5 hover:w-6 hover:h-6 text-white dark:text-white/75" />
                    </a>
                </DockIcon>
                <DockIcon className="bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]">
                    <a href="https://www.instagram.com/fisionerv.mx/" target="_blank" rel="noreferrer">
                        <Instagram className="w-5 h-5 hover:w-6 hover:h-6 text-white" />
                    </a>
                </DockIcon>
                <div role="separator" aria-orientation="vertical" className="mx-2 h-10 w-px bg-black/15 dark:bg-white/15 self-stretch" />

                <DockIcon className="flex items-center gap-3 mr-2">
                    <AnimatedThemeToggler className="h-5 w-5 hover:w-6 hover:h-6 dark:text-white/75" />
                </DockIcon>
            </Dock>
        </div>
    );
}
