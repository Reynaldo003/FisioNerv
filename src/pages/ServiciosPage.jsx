import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Clock3, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { PageIntro, ProcessSection, SectionHeading, ServicesSection, SPECIALTIES } from "../components/PublicSections";
import { usePublicContent } from "../shared/PublicContent";
import { useImagenesSitio } from "../shared/useImagenesSitio";

const money = (value) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(Number(value || 0));

function serviceImage(service, fallback) {
  const image = service.mediaSrc || service.imagen_url || service.imagen;
  if (image && !["/valoracion.png", "/seguimiento.png", "/servicios/valoracion.png"].includes(image)) return image;
  const name = (service.name || service.nombre || "").toLowerCase();
  if (name.includes("nutri")) return "/servicios/nutricional.jpeg";
  if (name.includes("dental")) return "/servicios/dental.jpeg";
  if (name.includes("subsecuente")) return "/servicios/subsecuentes.jpeg";
  return fallback;
}

export default function ServiciosPage() {
  const { services, loadingServices, servicesError, reloadServices } = usePublicContent();
  const { obtenerImagen } = useImagenesSitio();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const selectedId = params.get("enfoque");
  const selected = SPECIALTIES.find((item) => item.id === selectedId);
  const fallback = obtenerImagen("servicios.placeholder", "/servicios/valoracion-inicial.jpeg") || "/servicios/valoracion-inicial.jpeg";
  const filtered = services.filter((service) => `${service.name || service.nombre} ${service.description || service.descripcion || ""}`.toLowerCase().includes(search.toLowerCase()));

  return <div className="pub-services-page">
    <PageIntro eyebrow="Nuestros servicios" title="Tu recuperación merece" accent="un plan a tu medida." description="Conoce nuestros enfoques de rehabilitación y encuentra el primer paso para recuperar tu movimiento." />
    <ServicesSection detailed selected={selectedId} onSelect={(id) => setParams({ enfoque: id }, { preventScrollReset: true })} />
    {selected && <section className="pub-container" style={{ paddingInline: "24px", scrollMarginTop: "110px" }} aria-live="polite"><div className="pub-specialty-detail"><div><span className="pub-eyebrow">Un enfoque para ti</span><h3 style={{ marginTop: "12px" }}>{selected.title}</h3><p>{selected.detail}</p></div><Link className="pub-button" to="/agenda">Agendar valoración<ArrowRight size={17} /></Link></div></section>}
    <section className="pub-section pub-container" id="catalogo"><SectionHeading eyebrow="Encuentra tu atención" title="Catálogo de" accent="servicios" description="Consulta nuestros servicios, su duración y precio. Si no sabes cuál elegir, empieza por una valoración." /><div className="pub-catalog-toolbar"><label className="pub-search"><Search size={19} /><input type="search" placeholder="Buscar un servicio…" aria-label="Buscar un servicio" value={search} onChange={(event) => setSearch(event.target.value)} /></label><span className="pub-catalog-count" aria-live="polite">{loadingServices ? "Cargando servicios…" : `${filtered.length} servicios disponibles`}</span></div><div className="pub-catalog-grid">
      {loadingServices ? [0, 1, 2].map((i) => <div className="pub-team-skeleton pub-skeleton" key={i} />) : filtered.map((service) => {
        const name = service.name || service.nombre;
        return <article className="pub-catalog-card" key={service.id}><div className="pub-catalog-image"><img src={serviceImage(service, fallback)} alt={name} loading="lazy" onError={(event) => { if (!event.currentTarget.dataset.fallback) { event.currentTarget.dataset.fallback = "1"; event.currentTarget.src = "/servicios/valoracion-inicial.jpeg"; } }} /></div><div className="pub-catalog-copy"><span className="pub-catalog-tag"><Clock3 size={13} />{service.tag || "Atención personalizada"}</span><h3>{name}</h3><p>{service.description || service.descripcion || "Valoración y tratamiento personalizados según tu condición, tus objetivos y tu ritmo de recuperación."}</p><div className="pub-catalog-bottom"><span><strong>{money(service.price ?? service.precio)}</strong><small>MXN</small></span><Link className="pub-text-link" to={`/agenda?servicio=${encodeURIComponent(name)}`}>Agendar<ArrowRight size={16} /></Link></div></div></article>;
      })}
      {!loadingServices && servicesError && <div className="pub-empty" role="alert"><RefreshCw size={30} /><h3>No pudimos cargar el catálogo</h3><p>{servicesError}</p><button className="pub-button pub-button-white" onClick={reloadServices}>Volver a cargar servicios</button></div>}
      {!loadingServices && !servicesError && !filtered.length && <div className="pub-empty"><Search size={30} /><h3>No encontramos ese servicio</h3><p>Prueba con otro término o escríbenos para orientarte.</p><button className="pub-button pub-button-white" onClick={() => setSearch("")}>Ver todos los servicios</button></div>}
    </div><p className="pub-form-note"><ShieldCheck size={15} />El tratamiento se define de manera individual después de tu valoración clínica.</p></section>
    <ProcessSection />
  </div>;
}
