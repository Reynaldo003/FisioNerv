import { createElement } from "react";
import { ArrowRight, Facebook, Instagram } from "lucide-react";
import { ContactSection, PageIntro } from "../components/PublicSections";
import { WhatsAppIcon } from "../components/ui/WhatsAppIcon";
import { CLINIC } from "../shared/clinicData";

export default function ContactoPage() {
  return <div className="pub-contact-page"><PageIntro eyebrow="Estamos para escucharte" title="Tu primer paso empieza" accent="con una conversación." description="Resolvemos tus dudas y te ayudamos a encontrar la atención que necesitas. Visítanos en Córdoba, Veracruz." /><ContactSection full /><section className="pub-section pub-contact-extras pub-container">{[
    { icon: WhatsAppIcon, title: "Escríbenos por WhatsApp", text: "Cuéntanos qué necesitas y te orientamos sobre tu valoración.", link: `https://wa.me/${CLINIC.whatsapp}`, action: "Iniciar conversación" },
    { icon: Instagram, title: "Síguenos en Instagram", text: "Conoce el día a día de la clínica y a nuestro equipo.", link: "https://www.instagram.com/fisionerv.mx/", action: "@fisionerv.mx" },
    { icon: Facebook, title: "Nuestra comunidad", text: "Encuentra novedades y más información de FisioNerv.", link: "https://www.facebook.com/Fisionerv.mx", action: "Visitar Facebook" },
  ].map(({ icon, title, text, link, action }) => <article className="pub-contact-extra" key={title}><span className="pub-icon-tile">{createElement(icon, { size: 23 })}</span><div><h3>{title}</h3><p>{text}</p><a className="pub-text-link" href={link} target="_blank" rel="noreferrer">{action}<ArrowRight size={15} /></a></div></article>)}</section></div>;
}
