import { Sparkles, CalendarDays, ShieldCheck, Activity, HandHeart } from "lucide-react";

function StatCard({ label, value, showPlus = false }) {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-white/10 p-3 text-center backdrop-blur ring-1 ring-white/20">
            <div className="mb-1 flex items-baseline justify-center gap-1">
                {showPlus && <span className="text-2xl font-extrabold text-emerald-300">+</span>}
                <span className="text-2xl font-extrabold text-white">{value}</span>
            </div>
            <p className="text-[11px] leading-4 text-white/90">{label}</p>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, desc }) {
    return (
        <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
            <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 ring-1 ring-white/20">
                    <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h4 className="font-semibold text-white">{title}</h4>
                    <p className="text-sm text-white/80">{desc}</p>
                </div>
            </div>
        </div>
    );
}

export default function Hero({ THERAPIST }) {
    return (
        <section id="nosotros" className="w-full bg-[#004aad] text-white">
            <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 md:grid-cols-4 lg:py-16">
                <div className="md:col-span-2">
                    <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs ring-1 ring-white/20">
                        <Sparkles className="h-3.5 w-3.5" /> Sobre mí
                    </p>
                    <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">{THERAPIST.name}</h1>
                    <h2 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">FisioNerv</h2>
                    <p className="mt-1 text-sm/relaxed opacity-90">{THERAPIST.credentials}</p>
                    <p className="mt-4 max-w-2xl text-white/90">{THERAPIST.about}</p>
                    <ul className="mt-4 flex flex-wrap gap-2">
                        {THERAPIST.badges.map((b) => (
                            <li key={b} className="rounded-full bg-white/10 px-3 py-1 text-xs ring-1 ring-white/20">{b}</li>
                        ))}
                    </ul>

                    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <a
                            href="#ubicacion"
                            className="rounded-lg border border-white/20 bg-white/90 px-5 py-3 font-medium text-slate-900 hover:bg-white"
                        >
                            Conocer más
                        </a>
                        <a
                            href="#agenda"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-3 font-medium text-white shadow hover:brightness-110"
                        >
                            <CalendarDays className="h-4 w-4" /> Ver disponibilidad
                        </a>
                    </div>
                </div>

                <div className="md:col-span-1">
                    <div className="grid grid-cols-3 gap-3 sm:gap-4">
                        {THERAPIST.stats.map((s) => (
                            <StatCard key={s.v} value={s.k} label={s.v} showPlus={String(s.v).toLowerCase().includes("paciente")} />
                        ))}
                    </div>
                </div>

                <div className="md:col-span-1 flex items-center justify-center">
                    <img src="/info.png" alt="Información" className="h-auto max-h-[520px] w-full object-contain drop-shadow-2xl" />
                </div>

                <div className="md:col-span-4">
                    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <FeatureCard icon={ShieldCheck} title="Atención certificada" desc="Profesionales con aval." />
                        <FeatureCard icon={Activity} title="Planes a medida" desc="Protocolos personalizados." />
                        <FeatureCard icon={HandHeart} title="Enfoque humano" desc="Acompañamiento y educación." />
                    </div>
                </div>
            </div>
        </section>
    );
}
