import { useEffect, useRef, useState } from "react";
import { Dumbbell } from "lucide-react";
import { IconCloud } from "@/components/ui/icon-cloud";
import { TextAnimate } from "@/components/ui/text-animate"

function useContainerSize() {
    const ref = useRef(null);
    const [size, setSize] = useState({ w: 0, h: 0 });
    useEffect(() => {
        if (!ref.current) return;
        const obs = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            setSize({ w: width, h: height });
        });
        obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);
    return { ref, ...size };
}

function LogoMarquee({ images }) {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-slate-300 bg-white dark:bg-neutral-800">
            <div className="animate-[marquee_22s_linear_infinite] flex w-[200%] gap-8 p-6 [--tw-translate-x:0] ">
                {[...images, ...images].map((src, i) => (
                    <div key={i} className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border bg-white shadow-sm">
                        <img src={src} alt="" className="h-12 w-12 rounded-full object-cover" />
                    </div>
                ))}
            </div>
            <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
        </div>
    );
}

export default function Colaboraciones({ images }) {
    const { ref, w, h } = useContainerSize();
    const size = Math.max(260, Math.min(w, h)) || 320;

    return (
        <section id="collabs" className="mx-auto mt-16 max-w-6xl px-4">
            <div className="mb-6 flex items-center gap-3">
                <Dumbbell className="h-6 w-6 text-[#004aad]" />
                <TextAnimate animation="blurInUp" className="mt-4 max-w-2xl  dark:text-white/90 text-2xl font-bold" by="word">
                    Colaboraciones
                </TextAnimate>
            </div>

            <div className="hidden sm:block">
                <div
                    ref={ref}
                    className="relative grid h-[480px] w-full place-items-center overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-xl dark:bg-neutral-800 dark:border-neutral-500 dark:shadow-neutral-700"
                >
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(30,99,197,.08),transparent_50%)]" />
                    <div
                        className="pointer-events-none absolute inset-0 grid place-items-center "
                        aria-hidden
                    >
                        <IconCloud images={images} iconSize={96} canvasSize={size} />
                    </div>
                </div>
            </div>

            <div className="sm:hidden">
                <LogoMarquee images={images} />
            </div>
        </section>
    );
}
