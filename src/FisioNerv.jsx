import HeaderNav from "@/components/HeaderNav";
import Clinica from "@/components/Clinica";
import Hero from "@/components/Hero";
import SobreYMapa from "@/components/SobreYMapa";
import Servicios from "@/components/Servicios";
import Agenda from "@/components/Agenda";
import Opiniones from "@/components/Opiniones";
import Colaboraciones from "@/components/Colaboraciones";
import DockBar from "@/components/DockBar";
import Footer from "@/components/Footer";

const CLINIC = {
    name: "FisioNerv",
    tagline: "Clínica de fisioterapia",
    address: "Calle 15 entre Av. 2 y 4, Córdoba, Veracruz",
    phone: "+52 271 122 4494",
    mapQuery: "FisioNerv, Calle 15 entre Avenidas 2 y 4, Córdoba, Veracruz",
    hours: { mon: "8:00-21:00", tue: "8:00-21:00", wed: "8:00-21:00", thu: "8:00-21:00", fri: "8:00-21:00", sat: "10:00-15:00" },
};

const THERAPIST = {
    name: "Lic. Edgar Mauricio Medina Cruz",
    credentials: "Céd. Prof. 14168874 – Especialista en fisioterapia neuromuscular",
    about:
        "Fisioterapeuta con formación en neurorehabilitación y dolor musculoesquelético. Apasionado por la educación del paciente y el retorno seguro a la actividad.",
    badges: ["Neuromuscular", "Deportiva", "Terapia manual", "Ejercicio terapéutico"],
    stats: [
        { k: "5", v: "años de experiencia" },
        { k: "800", v: "pacientes atendidos" },
        { k: "3", v: "certificaciones" },
    ],
};

const SERVICES = [
    { name: "Valoración inicial", price: 350, tag: "45–60 min", description: "Entrevista clínica y plan personalizado.", mediaSrc: "/valoracion.png" },
    { name: "Sesión de seguimiento", price: 300, tag: "40–50 min", description: "Ajuste de objetivos y progresión.", mediaSrc: "/seguimiento.png" },
    { name: "Programa de ejercicio", price: 450, tag: "App+PDF", description: "Rutina guiada para casa/gym.", mediaSrc: "/programa.png" },
    { name: "Terapia manual avanzada", price: 380, tag: "Clínica", description: "Movilizaciones y liberación miofascial.", mediaSrc: "/terapia.png" },
    { name: "Electro/Termoterapia", price: 280, tag: "Clínica", description: "Analgesia y recuperación con equipos.", mediaSrc: "/electro.png" },
    { name: "Rehabilitación deportiva", price: 380, tag: "Deportiva", description: "Retorno seguro a la actividad.", mediaSrc: "/rehabilitacion.png" },
];

const images = ["/oxygen.png", "/DENTISTA.png", "/auFitness.png", "/onerv.png", "/auFitness.png", "/auFitness.png", "/onerv.png", "/auFitness.png", "/DENTISTA.png", "/auFitness.png", "/DENTISTA.png", "/auFitness.png", "/auFitness.png"];

export default function FisioNervLanding() {
    const PRIMARY = "#1E63C5";
    return (
        <div className="min-h-screen bg-neutral-100 dark:bg-[#0b0b0c] dark:text-neutral-200 text-slate-800 pb-28" style={{ "--primary": PRIMARY }}>
            <HeaderNav />
            <Clinica CLINIC={CLINIC} />
            <Hero THERAPIST={THERAPIST} />
            <SobreYMapa CLINIC={CLINIC} />
            <Servicios SERVICES={SERVICES} />
            <Agenda CLINIC={CLINIC} SERVICES={SERVICES} PRIMARY={PRIMARY} />
            <Opiniones />
            <Colaboraciones images={images} />
            <DockBar />
            <Footer CLINIC={CLINIC} />
        </div>
    );
}
