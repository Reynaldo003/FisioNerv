// src/pages/Inicio.jsx
import Hero from "@/components/Hero";
import Clinica from "@/components/Clinica";
import QuienesSomos from "@/components/QuienesSomos";
import ComoTrabajamos from "@/components/FormaTrabajo"
export default function Inicio() {
    return (
        <>
            <Hero />

            <div className="mx-auto max-w-6xl px-4 py-10 space-y-14">
                <Clinica />
                <QuienesSomos />
                <ComoTrabajamos />
            </div>
        </>
    );
}
