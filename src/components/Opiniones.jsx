import { Quote, Star } from "lucide-react";

export default function Opiniones() {
    const data = [
        { name: "María G.", rating: 5, quote: "Llegué con dolor crónico y en pocas sesiones mejoré muchísimo." },
        { name: "Diego R.", rating: 4, quote: "Excelente explicación del diagnóstico y ejercicios claros." },
        { name: "Ana L.", rating: 5, quote: "Clave para volver a correr. Atención de 10." },
    ];
    return (
        <section id="opiniones" className="mx-auto mt-16 max-w-6xl px-4">
            <div className="mb-6 flex items-center gap-3">
                <Quote className="h-6 w-6 text-[#004aad]" />
                <h3 className="text-2xl font-bold">Opiniones</h3>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
                {data.map((t) => (
                    <figure key={t.name} className="rounded-2xl border border-slate-300 bg-white p-6 shadow-lg">
                        <div className="mb-2 flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, idx) => (
                                <Star key={idx} className="h-4 w-4 text-amber-400" fill={idx < t.rating ? "currentColor" : "none"} />
                            ))}
                        </div>
                        <blockquote className="text-slate-700">“{t.quote}”</blockquote>
                        <figcaption className="mt-3 text-sm text-slate-500">— {t.name}</figcaption>
                    </figure>
                ))}
            </div>
        </section>
    );
}
