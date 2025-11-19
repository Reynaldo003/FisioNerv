import { Sparkles, CalendarDays, ShieldCheck, Activity, HandHeart } from "lucide-react";
import { NumberTicker } from "@/components/ui/number-ticker";
import { TextAnimate } from "@/components/ui/text-animate"

function StatCard({ label, value, showPlus = false, className = "" }) {
    return (
        <div
            className={
                "relative overflow-hidden rounded-2xl bg-white/10 p-3 text-center backdrop-blur ring-1 ring-white/20 " +
                className
            }
        >
            <div className="mb-1 flex items-baseline justify-center gap-1">
                {showPlus && (
                    <span className="text-2xl font-extrabold text-emerald-300">+</span>
                )}
                <NumberTicker
                    className="text-2xl font-extrabold text-white"
                    value={value}
                />
            </div>
            <p className="text-[11px] leading-4 text-white/90">{label}</p>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, desc }) {
    return (
        <div className="group rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur transition hover:-translate-y-1 hover:bg-white/15">
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
        <section id="nosotros" className="relative w-full overflow-hidden bg-gradient-to-b from-[#004aad] via-[#003aa6] to-[#001aaf] text-white">
            <div className="pointer-events-none absolute -left-32 top-10 h-64 w-64 rounded-full bg-sky-400/30 blur-3xl" />
            <div className="pointer-events-none absolute right-[-6rem] bottom-[-6rem] h-80 w-80 rounded-full bg-emerald-400/25 blur-3xl" />


            <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 lg:flex-row lg:items-center lg:py-20">
                <div className="md:col-span-2">
                    <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs ring-1 ring-white/20">
                        <Sparkles className="h-3.5 w-3.5" /> Sobre mí
                    </p>
                    <TextAnimate animation="blurInUp" className="mt-3 text-3xl font-bold leading-tight md:text-4xl" by="word">
                        {THERAPIST.name}
                    </TextAnimate>
                    <TextAnimate animation="blurInUp" className="text-4xl font-bold leading-tight tracking-tight md:text-5xl" by="word">
                        FisioNerv
                    </TextAnimate>
                    <TextAnimate animation="blurInUp" className="mt-1 text-sm/relaxed opacity-90" by="word">
                        {THERAPIST.credentials}
                    </TextAnimate>
                    <TextAnimate animation="blurInUp" className="mt-4 max-w-2xl text-white/90" by="word">
                        {THERAPIST.about}
                    </TextAnimate>

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
            </div>
            <div className="mx-auto max-w-7xl px-4 pb-10">
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <FeatureCard icon={ShieldCheck} title="Atención certificada" desc="Profesionales con aval y actualización constante." />
                    <FeatureCard icon={Activity} title="Planes a medida" desc="Protocolos personalizados según tus objetivos." />
                    <FeatureCard icon={HandHeart} title="Enfoque humano" desc="Acompañamiento cercano y educación al paciente." />
                </div>
            </div>
        </section>
    );
}


