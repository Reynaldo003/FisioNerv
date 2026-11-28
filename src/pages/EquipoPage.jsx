import { PageIntro, TeamSection, ValuesBand } from "../components/PublicSections";

export default function EquipoPage() {
  return <div className="pub-team-page"><PageIntro eyebrow="Las personas detrás de tu recuperación" title="Ciencia, experiencia" accent="y un trato cercano." description="Conoce a quienes te acompañarán a recuperar movilidad, reducir el dolor y retomar tu vida con confianza." /><TeamSection full /><ValuesBand /></div>;
}
