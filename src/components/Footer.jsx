import { MapPin } from "lucide-react";

export default function Footer({ CLINIC }) {
    return (
        <footer className="mx-auto mt-20 max-w-7xl px-4 pb-24 sm:pb-24">
            <div className="rounded-2xl border border-slate-300 bg-white p-6 text-sm text-slate-600 shadow-lg">
                <div className="grid gap-6 md:grid-cols-3 md:items-center">
                    <div>
                        <p className="font-semibold text-slate-900">{CLINIC.name}</p>
                        <p>{CLINIC.address}</p>
                        <a href={`tel:${CLINIC.phone}`} className="text-[--primary] hover:underline">{CLINIC.phone}</a>
                    </div>
                    <div className="flex items-center gap-3 text-slate-700">
                        <MapPin className="h-5 w-5 text-[--primary]" />
                        <span>Veracruz · México</span>
                    </div>
                    <div className="flex items-center justify-start gap-3 md:justify-end">
                        <span className="text-xs">Desarrollado por</span>
                        <a href="https://r-obots.vercel.app" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50">
                            <img src="/logo_robots.png" alt="RObots" className="rounded-full h-10 w-10" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
