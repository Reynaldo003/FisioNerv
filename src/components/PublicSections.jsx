import { createElement, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowRight, Award, Brain, Building2, CalendarCheck2, Check, CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, Clock3, Heart, HeartHandshake, MapPin, MessageCircle, MoveUpRight, Phone, Ribbon, ShieldCheck, Sparkles, Star, Stethoscope, Target, TrendingUp, Users, X } from "lucide-react";
import { useImagenesSitio } from "../shared/useImagenesSitio";
import { usePublicContent } from "../shared/PublicContent";
import { CLINIC } from "../shared/clinicData";
import { PortalModal } from "./ui/PortalModal";
import PartnerMarquee from "./PartnerMarquee";

function FeatureIcon({ icon, size = 24 }) {
  return createElement(icon, { size });
}

// eslint-disable-next-line react-refresh/only-export-components
export const SPECIALTIES = [
  { id: "neurologica", title: "Rehabilitación neurológica", description: "Recupera funciones, mejora tu movilidad y tu independencia.", image: "/servicios/subsecuentes.jpeg", icon: Brain, detail: "Trabajamos el equilibrio, la coordinación y el movimiento con un plan adaptado a tus necesidades. El objetivo es ayudarte a desarrollar mayor independencia en tu vida diaria." },
  { id: "traumatologica", title: "Traumatología y ortopedia", description: "Vuelve a tus actividades con seguridad y confianza.", image: "/foto10.jpeg", icon: Activity, detail: "Evaluación y rehabilitación de lesiones musculoesqueléticas, recuperación después de una cirugía y preparación para retomar tus actividades. Combinamos educación, movimiento y ejercicio terapéutico." },
  { id: "oncologica", title: "Rehabilitación oncológica", description: "Acompañamiento humano y personalizado en cada etapa.", image: "/foto21.jpeg", icon: Ribbon, detail: "Atención orientada a mantener y recuperar la capacidad funcional durante el proceso oncológico. Adaptamos el ejercicio y la rehabilitación a tu condición y a los objetivos de cada etapa." },
  { id: "manual", title: "Terapia manual y ejercicio", description: "Alivio del dolor y mejora de la función desde la raíz.", image: "/foto5.jpeg", icon: HeartHandshake, detail: "Integramos técnicas de terapia manual, ejercicio y educación para abordar el dolor y mejorar tu movimiento, siempre a partir de una valoración individual." },
];

export function SectionHeading({ eyebrow, title, accent, description, to, action, centered = false }) {
  return <div className={`pub-section-heading ${centered ? "pub-heading-centered" : ""}`}><div><span className="pub-eyebrow">{eyebrow}</span><h2>{title}{accent && <> <span>{accent}</span></>}</h2>{description && <p>{description}</p>}</div>{to && <Link className="pub-button pub-button-white" to={to}>{action}<ArrowRight size={17} /></Link>}</div>;
}

export function PageIntro({ eyebrow, title, accent, description }) {
  return <section className="pub-page-intro pub-container"><span className="pub-eyebrow">{eyebrow}</span><h1>{title} <span>{accent}</span></h1><p>{description}</p><div className="pub-intro-note"><span className="pub-status-dot" />En Córdoba, Veracruz · Atención personalizada</div></section>;
}

export function HeroSection() {
  const { obtenerImagen } = useImagenesSitio();
  const portrait = obtenerImagen("inicio.profesional", "/mauricio-portrait-hq.webp");
  const portraitSource = portrait === "/fisio.png" ? "/mauricio-portrait-hq.webp" : portrait;
  const background = obtenerImagen("inicio.hero", "/fisio_fondo.png");
  return <section className="pub-hero pub-container">
    {background && <img className="pub-hero-background" src={background} alt="" fetchPriority="high" />}
    <div className="pub-hero-wash" /><div className="pub-hero-orbit" />
    <div className="pub-hero-copy"><span className="pub-eyebrow"><span className="pub-status-dot" />Fisioterapia avanzada en Córdoba, Ver.</span><h1>Recupera tu <br />movimiento,<br /><span>vive sin dolor.</span></h1><p>Tratamientos de fisioterapia basados en evidencia, con atención personalizada y un equipo que te acompaña en cada paso.</p><div className="pub-hero-benefits"><span><Heart size={18} />Menos dolor</span><span><Activity size={18} />Más movilidad</span><span><Sparkles size={18} />Más bienestar</span></div><div className="pub-hero-actions"><Link className="pub-button" to="/agenda">Agendar cita<ArrowRight size={17} /></Link><Link className="pub-button pub-button-white" to="/servicios">Conoce nuestros servicios</Link></div><div className="pub-hero-trust"><span className="pub-trust-icon"><ShieldCheck size={23} /></span><div><strong>Tu recuperación, en buenas manos</strong><span>Atención profesional con enfoque humano.</span></div></div></div>
    {portrait && <div className="pub-hero-portrait"><img className="pub-hero-person" src={portraitSource} alt="L.F.T. Edgar Mauricio Medina Cruz, fisioterapeuta" fetchPriority="high" decoding="async" /></div>}
    <div className="pub-therapist-label"><span className="pub-plus">+</span><strong>L.F.T. Edgar Mauricio<br />Medina Cruz</strong><span>Rehabilitación neurológica,<br />traumatología y ortopedia.</span><small>Céd. Prof. 14168874</small></div>
    <div className="pub-hero-card"><span className="pub-icon-tile"><CalendarCheck2 /></span><h2>Tu primer paso <br />para sentirte mejor.</h2><p>Empecemos por escucharte. En tu valoración conoceremos tu caso y lo que quieres recuperar.</p><ol><li><span>01</span>Elige tu servicio</li><li><span>02</span>Encuentra tu horario</li><li><span>03</span>Confirma tu valoración</li></ol><Link className="pub-button" to="/agenda">Quiero agendar<ArrowRight size={17} /></Link><small><ShieldCheck size={13} />Agenda segura · Confirmación por WhatsApp</small></div>
    <div className="pub-benefit-strip">{[[Users, "Atención personalizada", "Enfocada en tus objetivos"], [ClipboardCheck, "Planes de tratamiento", "A tu medida"], [Brain, "Equipo especializado", "Con experiencia clínica"], [Building2, "Instalaciones cómodas", "Un espacio para tu bienestar"]].map(([Icon, title, description]) => <div key={title}><span className="pub-icon-circle"><FeatureIcon icon={Icon} size={25} /></span><span><strong>{title}</strong><small>{description}</small></span></div>)}</div>
  </section>;
}

export function ServicesSection({ detailed = false, selected, onSelect }) {
  const { obtenerImagen } = useImagenesSitio();
  return <section className="pub-section pub-container" id="tratamientos">
    {!detailed && <SectionHeading eyebrow="Nuestros servicios" title="Soluciones para cada etapa" accent="de tu recuperación" description="Tratamientos especializados para mejorar tu movilidad, reducir el dolor y potenciar tu calidad de vida." to="/servicios" action="Ver todos los servicios" />}
    <div className="pub-services-grid">
      {SPECIALTIES.map(({ id, title, description, image, icon }) => {
        const source = obtenerImagen(`inicio.servicio.${id}`, image);
        return <article className={`pub-service-card ${selected === id ? "is-selected" : ""}`} key={id}>
          <div className="pub-service-image">
            {source && <img src={source} alt={title} loading="lazy" />}
            <span className="pub-service-icon"><FeatureIcon icon={icon} size={29} /></span>
          </div>
          <div className="pub-service-copy">
            <h3>{title}</h3><p>{description}</p>
            {onSelect
              ? <button className="pub-text-link" onClick={() => onSelect(id)} aria-expanded={selected === id}>Conocer más<ArrowRight size={16} /></button>
              : <Link className="pub-text-link" to={`/servicios?enfoque=${id}`}>Conocer más<ArrowRight size={16} /></Link>}
          </div>
        </article>;
      })}
    </div>
  </section>;
}

export function ValuesBand() {
  return <section className="pub-values-band pub-container" aria-label="Nuestro compromiso"><NetworkPattern /><div>{[[Users, "A tu medida", "Cada paciente es único"], [Heart, "Enfoque humano", "Te escuchamos y acompañamos"], [Award, "Con evidencia", "Razonamiento clínico y actualización"], [TrendingUp, "Paso a paso", "Seguimiento de tu progreso"]].map(([Icon, title, description]) => <div className="pub-value" key={title}><span><FeatureIcon icon={Icon} size={25} /></span><div><strong>{title}</strong><small>{description}</small></div></div>)}</div></section>;
}

export function AboutSection() {
  const { obtenerImagen } = useImagenesSitio();
  const [gallery, setGallery] = useState(false);
  const images = [obtenerImagen("inicio.clinica", "/clinica.png"), obtenerImagen("inicio.sala", "/sala.png"), obtenerImagen("inicio.quienes.4", "/foto10.jpeg")].filter(Boolean);
  return <section className="pub-section pub-container" id="nosotros"><div className="pub-about-card"><div className="pub-about-copy"><span className="pub-eyebrow">Sobre FisioNerv</span><h2>Más que terapia,<br /><span>acompañamiento real.</span></h2><p>En FisioNerv combinamos evidencia científica, experiencia clínica, movimiento y un trato humano para ayudarte a recuperar tu movimiento y confianza.</p><p>Nuestro enfoque se adapta a tus necesidades, con planes de tratamiento personalizados y seguimiento continuo.</p><div className="pub-about-actions"><Link className="pub-button" to="/equipo">Conoce a nuestro equipo<ArrowRight size={16} /></Link><button className="pub-text-link" onClick={() => setGallery(true)}><Building2 size={17} />Ver instalaciones</button></div></div><div className="pub-about-gallery">{images.map((src, index) => <button onClick={() => setGallery(true)} key={src} aria-label={`Ver instalaciones, fotografía ${index + 1}`}><img src={src} alt={["Fachada de la clínica FisioNerv", "Sala de rehabilitación", "Atención en la clínica"][index]} loading="lazy" /></button>)}</div><div className="pub-why-card"><h3>¿Por qué elegir FisioNerv?</h3>{[[ClipboardCheck, "Tratamiento basado en evidencia"], [Users, "Atención personalizada"], [TrendingUp, "Seguimiento de tu progreso"], [Building2, "Instalaciones cómodas"], [Target, "Objetivos funcionales claros"]].map(([Icon, text]) => <div key={text}><span className="pub-icon-tile"><FeatureIcon icon={Icon} size={22} /></span><p>{text}</p></div>)}</div></div>{gallery && <PortalModal onClose={() => setGallery(false)} etiqueta="Instalaciones de FisioNerv" className="presentation-dialog"><div className="pub-modal pub-gallery-modal"><div className="pub-modal-header"><div><span className="pub-eyebrow">Conoce tu espacio</span><h2>Nuestras instalaciones</h2></div><button className="pub-icon-button" onClick={() => setGallery(false)} aria-label="Cerrar galería"><X /></button></div><div className="pub-modal-gallery">{images.map((src) => <img key={src} src={src} alt="Instalaciones de FisioNerv" />)}</div></div></PortalModal>}</section>;
}

export function RecoverySection() {
  const { obtenerImagen } = useImagenesSitio();
  const [active, setActive] = useState(0);
  const stages = [{ label: "Te escuchamos", image: obtenerImagen("inicio.quienes.1", "/foto20.jpeg"), text: "Entendemos tu historia, evaluamos tu movimiento y definimos juntos tus objetivos." }, { label: "Avanzamos contigo", image: obtenerImagen("inicio.quienes.2", "/foto21.jpeg"), text: "Adaptamos el tratamiento a tu evolución, con ejercicio, educación y seguimiento cercano." }];
  return <section className="pub-section pub-container" id="recuperacion"><SectionHeading eyebrow="Movimiento que transforma" title="Volver a lo que amas" accent="empieza aquí." description="Cada persona tiene un proceso único. El tuyo merece un plan que te acompañe de principio a fin." /><div className="pub-recovery-grid"><div className="pub-recovery-photo">{stages[active].image && <img src={stages[active].image} alt={active === 0 ? "Valoración y educación del paciente en FisioNerv" : "Ejercicio terapéutico acompañado en FisioNerv"} loading="lazy" />}<div className="pub-recovery-tabs" role="group" aria-label="Etapas del acompañamiento">{stages.map((stage, index) => <button key={stage.label} aria-pressed={active === index} className={active === index ? "active" : ""} onClick={() => setActive(index)}>{stage.label}{index === active && <Check size={15} />}</button>)}</div><div className="pub-photo-caption"><span>UN PROCESO CONTIGO</span><p>{stages[active].text}</p></div></div><div className="pub-recovery-copy"><span className="pub-icon-circle"><TrendingUp size={28} /></span><h3>Metas reales.<br />Progreso que importa.</h3><p>Trabajamos para que el movimiento vuelva a formar parte de tu vida.</p><div>{[["Menos dolor", "Entiende tu cuerpo y encuentra herramientas para cuidarlo."], ["Mayor movilidad", "Recupera capacidades para tus actividades cotidianas."], ["Más confianza", "Avanza con un plan adaptado a tu condición."], ["Regreso a tus actividades", "Volver a hacer lo que disfrutas es nuestro objetivo."]].map(([title, description]) => <div className="pub-check-item" key={title}><CheckCircle2 size={25} /><div><h4>{title}</h4><p>{description}</p></div></div>)}</div><Link className="pub-text-link" to="/agenda">Hablemos de tu recuperación<ArrowRight size={17} /></Link></div></div></section>;
}

export function TeamSection({ full = false }) {
  const { team, loadingTeam } = usePublicContent();
  const [selected, setSelected] = useState(null);
  return <section className="pub-section pub-container">
    <SectionHeading eyebrow="Nuestro equipo" title="Profesionales que" accent="te acompañan" description="Un equipo comprometido con tu bienestar, tu movimiento y tu confianza." to={!full ? "/equipo" : undefined} action="Conoce al equipo" />
    <div className="pub-team-grid">
      {loadingTeam ? Array.from({ length: 2 }, (_, i) => <div key={i} className="pub-team-skeleton pub-skeleton" />) : (full ? team : team.slice(0, 2)).map((person) => <article className="pub-team-card" key={person.id}>
        <button className="pub-team-photo" onClick={() => setSelected(person)} aria-label={`Ver perfil de ${person.name}`}>
          {person.photo ? <img src={person.photo} alt={person.name} loading="lazy" onError={(event) => { event.currentTarget.hidden = true; }} /> : <span className="pub-team-placeholder"><Users size={60} /><span>{person.role}</span></span>}
          <span className="pub-team-role"><span className="pub-status-dot" />{person.role}</span>
          <span className="pub-team-open"><MoveUpRight size={20} /></span>
        </button>
        <div className="pub-team-copy">
          <h3>{person.name}</h3><p>{person.bio}</p>
          <button className="pub-text-link" onClick={() => setSelected(person)}>Ver perfil<ArrowRight size={17} /></button>
        </div>
      </article>)}
    </div>
    {selected && <PortalModal onClose={() => setSelected(null)} etiqueta={`Perfil de ${selected.name}`} className="presentation-dialog">
      <div className="pub-modal pub-profile-modal">
        <button className="pub-icon-button pub-modal-close" aria-label="Cerrar perfil" onClick={() => setSelected(null)}><X /></button>
        <div className="pub-profile-photo">{selected.photo ? <img src={selected.photo} alt={selected.name} /> : <Users size={80} />}</div>
        <div className="pub-profile-copy">
          <span className="pub-eyebrow">{selected.role}</span>
          <h2>{selected.name}</h2><p>{selected.bio}</p>
          <div className="pub-profile-note"><HeartHandshake size={23} /><span>Atención cercana y un plan pensado para ti.</span></div>
          <Link className="pub-button" to="/agenda">Agendar valoración<ArrowRight size={17} /></Link>
        </div>
      </div>
    </PortalModal>}
  </section>;
}

export function ReviewsSection({ full = false }) {
  const { reviews, loadingReviews, reviewsError } = usePublicContent();
  const track = useRef(null);
  const displayed = full ? reviews : reviews.slice(0, 9);
  return <section className="pub-section pub-reviews-section pub-container"><SectionHeading eyebrow="Opiniones" title="Lo que dicen" accent="nuestros pacientes" description="Experiencias de personas que han confiado en nosotros para su recuperación." to={!full ? "/opiniones" : "#tu-opinion"} action={!full ? "Ver más opiniones" : "Compartir mi experiencia"} />{loadingReviews ? <div className="pub-reviews-track">{[0, 1, 2].map((i) => <div className="pub-review-skeleton pub-skeleton" key={i} />)}</div> : displayed.length ? <><div ref={track} className={`pub-reviews-track ${full ? "pub-reviews-all" : ""}`}>{displayed.map((review, index) => <figure key={review.id || index} className="pub-review-card"><div className="pub-review-person"><span>{review.nombre_completo?.trim().charAt(0).toUpperCase() || "P"}</span><div><figcaption>{review.nombre_completo}</figcaption><div className="pub-stars" aria-label={`${review.calificacion} de 5 estrellas`}>{Array.from({ length: 5 }, (_, star) => <Star key={star} size={16} fill={star < Number(review.calificacion) ? "currentColor" : "none"} />)}</div></div></div><blockquote>“{review.descripcion}”</blockquote><span className="pub-review-verified"><CheckCircle2 size={13} />Opinión de nuestra comunidad</span></figure>)}</div>{!full && displayed.length > 3 && <div className="pub-carousel-actions"><button className="pub-icon-button" aria-label="Opiniones anteriores" onClick={() => track.current.scrollBy({ left: -360, behavior: "smooth" })}><ChevronLeft /></button><span>Experiencias que nos motivan</span><button className="pub-icon-button" aria-label="Opiniones siguientes" onClick={() => track.current.scrollBy({ left: 360, behavior: "smooth" })}><ChevronRight /></button></div>}</> : <div className="pub-reviews-empty"><span className="pub-icon-circle"><MessageCircle size={30} /></span><div><h3>{reviewsError ? "Tu experiencia también cuenta" : "Tu historia puede inspirar a alguien más"}</h3><p>{reviewsError ? "Las opiniones no están disponibles en este momento. Puedes compartir cómo ha sido tu atención." : "¿Ya nos conoces? Cuéntanos cómo ha sido tu proceso en FisioNerv."}</p></div><Link className="pub-text-link" to="/opiniones#tu-opinion">Escribir una opinión<ArrowRight size={17} /></Link></div>}</section>;
}

export function PartnersSection({ full = false }) {
  const { obtenerGaleriaConvenios } = useImagenesSitio();
  const images = obtenerGaleriaConvenios().map((src) => /^(?:https?:\/\/|\/)/.test(src) ? src : `/${src}`);
  return <section className="pub-section pub-partners-section pub-container">
    <SectionHeading eyebrow="Convenios" title="Trabajamos con aliados" accent="de confianza" description="Centros y aliados que complementan tu proceso de recuperación." to={!full ? "/convenios" : undefined} action="Ver convenios" />
    {full ? <div className="pub-partners-grid pub-partners-full">
      {images.map((src, index) => <div className="pub-partner" key={`${src}-${index}`}>
        <img src={src} alt={partnerName(src, index)} loading="lazy" />
        <span>{partnerName(src, index)}</span>
      </div>)}
    </div> : images.length > 0 && <PartnerMarquee partners={images.map((src, index) => ({ src, name: partnerName(src, index) }))} />}
    {!images.length && <p className="pub-muted">Próximamente encontrarás aquí nuestros convenios.</p>}
    {full && <div className="pub-partner-note">
      <HeartHandshake size={30} />
      <div><h3>¿Formas parte de alguno de nuestros convenios?</h3><p>Contáctanos para conocer los beneficios disponibles y los detalles de tu atención.</p></div>
      <a className="pub-button" href="https://wa.me/522711224494?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20los%20convenios%20de%20FisioNerv." target="_blank" rel="noreferrer">Consultar beneficios<ArrowRight size={17} /></a>
    </div>}
  </section>;
}

function partnerName(src, index) {
  const names = { oxygen: "Oxygen", ironside: "Ironside", logotipo: "Centro aliado", metlife: "MetLife", lycan: "Lycan", DENTISTA: "Atención dental", auFitness: "AU Fitness", banorte: "Banorte", sanatorioHuerta: "Sanatorio Huerta", melisa: "Melisa", idmgym: "IDM Gym", inbursa: "Inbursa", seguros: "Seguros" };
  const key = String(src).split("/").pop().split(".")[0];
  return names[key] || `Convenio ${index + 1}`;
}

export function ContactSection({ full = false }) {
  return <section className={`pub-section pub-contact-section pub-container ${full ? "pub-contact-full" : ""}`}>
    <div className="pub-contact-card">
      <span className="pub-eyebrow">Visítanos</span>
      <h2>Tu bienestar tiene<br /><span>un punto de encuentro.</span></h2>
      <p>Estamos en Córdoba, Veracruz. Agenda tu cita y comienza tu proceso de recuperación.</p>
      <div className="pub-contact-content">
        <div className="pub-map">
          <iframe
            title="Ubicación de FisioNerv en Córdoba, Veracruz"
            src="https://www.google.com/maps?q=Fisionerv%20Fisioterapia%20C%C3%B3rdoba%20Veracruz&output=embed"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <a href="https://maps.app.goo.gl/GYmJHJ1vUh2rB4yG9" target="_blank" rel="noreferrer"><MapPin size={17} />Abrir en Google Maps<MoveUpRight size={15} /></a>
        </div>
        <div className="pub-contact-details">
          <div>
            <span className="pub-icon-circle"><MapPin size={22} /></span>
            <div><h3>Dirección</h3><p>{CLINIC.address}</p></div>
          </div>
          <div>
            <span className="pub-icon-circle"><Clock3 size={22} /></span>
            <div><h3>Horario de atención</h3><p>Lunes a viernes · 8:00–21:00<br />Sábado · 10:00–15:00</p></div>
          </div>
          <div>
            <span className="pub-icon-circle"><Phone size={22} /></span>
            <div><h3>Llámanos</h3><a href={`tel:${CLINIC.phone.replace(/\s/g, "")}`}>{CLINIC.phone}</a></div>
          </div>
        </div>
      </div>
    </div>
    <div className="pub-contact-cta">
      <NetworkPattern />
      <span className="pub-icon-tile"><CalendarCheck2 size={28} /></span>
      <span className="pub-eyebrow">Tu siguiente paso</span>
      <h2>¿Listo para <br />recuperar <br />tu bienestar?</h2>
      <p>Agenda tu cita hoy y da el primer paso hacia una vida con más movimiento.</p>
      <Link className="pub-button pub-button-white" to="/agenda">Agendar cita ahora<ArrowRight size={18} /></Link>
      <a className="pub-contact-whatsapp" href="https://wa.me/522711224494" target="_blank" rel="noreferrer"><MessageCircle size={17} />También estamos en WhatsApp</a>
    </div>
  </section>;
}

export function ProcessSection() {
  return <section className="pub-section pub-container"><SectionHeading eyebrow="Así trabajamos" title="Un plan claro." accent="Un paso a la vez." description="De la primera valoración al regreso a tus actividades, estamos contigo." centered /><div className="pub-process-grid">{[[Stethoscope, "01", "Te conocemos", "Escuchamos tu historia y evaluamos tu movimiento, dolor y función."], [ClipboardCheck, "02", "Creamos tu plan", "Definimos objetivos y un tratamiento adaptado a tus necesidades."], [TrendingUp, "03", "Avanzamos juntos", "Damos seguimiento a tu progreso y ajustamos cada etapa del tratamiento."]].map(([Icon, number, title, text]) => <article key={number}><span className="pub-process-number">{number}</span><span className="pub-icon-tile"><FeatureIcon icon={Icon} size={27} /></span><h3>{title}</h3><p>{text}</p></article>)}</div></section>;
}

export function NetworkPattern() {
  return <svg className="pub-network-pattern" viewBox="0 0 600 300" fill="none" aria-hidden="true"><path d="M0 260 100 210 160 240 260 140 340 170 420 80 500 120 600 20M0 300 140 270 230 210 350 250 450 180 600 210M100 210 140 270M160 240 230 210M260 140 350 250M340 170 450 180M420 80 450 180M500 120 600 210" stroke="currentColor" strokeWidth="1.2" />{[[100, 210], [160, 240], [260, 140], [340, 170], [420, 80], [500, 120], [140, 270], [230, 210], [350, 250], [450, 180]].map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" fill="currentColor" />)}</svg>;
}
