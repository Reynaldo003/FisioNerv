import { Stethoscope, PhoneCall } from "lucide-react";

export default function HeaderNav() {
    return (
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-[--primary]/10 ring-1 ring-[--primary]/20">
                        <img src="/onerv.png" className="h-9 w-9" />
                    </div>
                    <img className="w-40 sm:w-48" src="/logo.png" alt="FisioNerv" />
                </div>

                <a
                    href="#agenda"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#004aad] px-4 py-2 text-sm font-medium text-white shadow hover:brightness-110"
                >
                    <PhoneCall className="h-4 w-4" /> Agendar
                </a>
            </div>
        </header>
    );
}
