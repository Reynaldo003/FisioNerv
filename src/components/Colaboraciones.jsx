import { Dumbbell } from "lucide-react";
import { TextAnimate } from "@/components/ui/text-animate";

function Marquee({ images, speed = 26 }) {
    const doubled = [...images, ...images];

    return (
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-2xl/30 dark:shadow-neutral-100">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent dark:bg-gradient-to-r dark:from-black dark:to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent dark:bg-gradient-to-l dark:from-black dark:to-transparent" />

            <div
                className="flex w-[200%] items-center gap-10 px-6 py-6"
                style={{
                    animation: `marquee ${speed}s linear infinite`,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = "paused")}
                onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = "running")}
            >
                {doubled.map((src, i) => (
                    <div
                        key={i}
                        className="flex h-20 w-36 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:bg-[#F8FAFC]/80 shadow-2xl/30 dark:shadow-neutral-100 shadow-sm"
                    >
                        <img src={src} alt="" className="max-h-16 max-w-[120px] object-contain" />
                    </div>
                ))}
            </div>

            <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
        </div>
    );
}

export default function Colaboraciones({ images = [] }) {
    return (
        <section id="collabs" className="mx-auto mt-16 max-w-6xl px-4">
            <div className="mb-6 flex items-center gap-3">
                <Dumbbell className="h-6 w-6 text-[#004aad]" />
                <TextAnimate
                    animation="blurInUp"
                    className="mt-1 text-2xl font-bold  dark:text-white/90 text-slate-900"
                    by="word"
                >
                    Convenios
                </TextAnimate>
            </div>

            <p className="mb-5 max-w-2xl text-sm dark:text-neutral-300 text-slate-600">
                Centros y aliados que complementan tu proceso de recuperación.
            </p>

            <Marquee images={images} speed={24} />
        </section>
    );
}
