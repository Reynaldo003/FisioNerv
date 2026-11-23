import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ArrowRight, Clock3, Facebook, Instagram, MapPin, Menu, Phone, X } from "lucide-react";
import { PublicContentProvider } from "../shared/PublicContent";
import { useImagenesSitio } from "../shared/useImagenesSitio";
import { CLINIC } from "../shared/clinicData";
import { usePresentationMotion } from "../shared/usePresentationMotion";
import "../presentation.css";

const navigation = [["/", "Inicio"], ["/servicios", "Servicios"], ["/equipo", "Equipo"], ["/agenda", "Agenda"], ["/opiniones", "Opiniones"], ["/convenios", "Convenios"], ["/contacto", "Contacto"]];

function Brand({ light = false }) {
  const { obtenerImagen } = useImagenesSitio();
  const logo = obtenerImagen(light ? "marca.logo_claro" : "marca.logo_oscuro", light ? "/logo_w&b.png" : "/logo_b&w.png");
  const icon = obtenerImagen("marca.icono", "/onerv.png");
  return <Link to="/" className="pub-brand" aria-label="FisioNerv · Inicio">{icon && <img className="pub-brand-icon" src={icon} alt="" />}{logo ? <img className="pub-brand-wordmark" src={logo} alt="FisioNerv, clínica de fisioterapia" /> : <span>FISIO<strong>NERV</strong><small>CLÍNICA DE FISIOTERAPIA</small></span>}</Link>;
}

export default function PublicLayout({ children }) {
  const { pathname, hash } = useLocation();
  const [open, setOpen] = useState(false);
  const menuButton = useRef(null);
  const menuRef = useRef(null);
  const contentRef = useRef(null);
  usePresentationMotion(contentRef, pathname);

  useEffect(() => {
    setOpen(false);
    const previousTitle = document.title;
    const section = navigation.find(([to]) => to === pathname)?.[1] || "Inicio";
    document.title = section === "Inicio" ? "FisioNerv | Recupera tu movimiento, vive sin dolor" : `${section} | FisioNerv · Fisioterapia en Córdoba`;
    return () => { document.title = previousTitle; };
  }, [pathname]);

  useEffect(() => {
    if (hash) {
      const timer = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }), 100);
      return () => clearTimeout(timer);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, hash]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const button = menuButton.current;
    menuRef.current?.querySelector("a")?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Tab") {
        const targets = [button, ...menuRef.current.querySelectorAll("a")];
        const first = targets[0];
        const last = targets[targets.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", onKey); button?.focus(); };
  }, [open]);

  return (
    <PublicContentProvider>
      <div className="presentation-site">
        <a className="pub-skip" href="#contenu">Ir al contenido</a>
        <div className="pub-topline"><span>Fisioterapia basada en evidencia. Atención con sentido humano.</span><a href={`tel:${CLINIC.phone.replace(/\s/g, "")}`}><Phone size={12} /> {CLINIC.phone}</a></div>
        <header className="pub-header">
          <Brand />
          <nav className="pub-desktop-nav" aria-label="Navegación principal">{navigation.map(([to, label]) => <NavLink key={to} to={to} end={to === "/"}>{label}</NavLink>)}</nav>
          <a className="pub-header-phone" href={`tel:${CLINIC.phone.replace(/\s/g, "")}`}><span className="pub-icon-circle"><Phone size={18} /></span><span><small>Llámanos</small><strong>{CLINIC.phone}</strong></span></a>
          <Link className="pub-button pub-header-cta" to="/agenda">Agendar cita <ArrowRight size={16} /></Link>
          <button ref={menuButton} className="pub-menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="public-menu" aria-label={open ? "Cerrar menú" : "Abrir menú"}>{open ? <X /> : <Menu />}</button>
          {open && <><div className="pub-menu-backdrop" onClick={() => setOpen(false)} /><nav ref={menuRef} id="public-menu" className="pub-mobile-nav" aria-label="Navegación móvil">{navigation.map(([to, label]) => <NavLink key={to} to={to} end={to === "/"} onClick={() => setOpen(false)}>{label}<ArrowRight size={16} /></NavLink>)}<a href={`tel:${CLINIC.phone.replace(/\s/g, "")}`}><Phone size={16} /> {CLINIC.phone}</a></nav></>}
        </header>
        <main ref={contentRef} id="contenu" tabIndex={-1}>{children ?? <Outlet />}</main>
        <PublicFooter />
      </div>
    </PublicContentProvider>
  );
}

function PublicFooter() {
  const { obtenerImagen } = useImagenesSitio();
  const developer = obtenerImagen("marca.desarrollador", "/logo_robots.png");
  return <footer className="pub-footer pub-container">
    <div className="pub-footer-grid">
      <div className="pub-footer-about"><Brand light /><p>Evidencia científica transformada en humanismo. Te acompañamos a recuperar tu movimiento y confianza.</p><div className="pub-socials"><a href="https://www.facebook.com/Fisionerv.mx" target="_blank" rel="noreferrer" aria-label="Facebook de FisioNerv"><Facebook size={18} /></a><a href="https://www.instagram.com/fisionerv.mx/" target="_blank" rel="noreferrer" aria-label="Instagram de FisioNerv"><Instagram size={18} /></a><a href="https://www.instagram.com/maumedinaft/" target="_blank" rel="noreferrer" aria-label="Instagram de Mauricio Medina"><Instagram size={18} /></a></div></div>
      <div><h2>Enlaces</h2>{navigation.filter(([to]) => to !== "/agenda").map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}</div>
      <div><h2>Tu recuperación</h2><Link to="/servicios">Valoración inicial</Link><Link to="/servicios?enfoque=neurologica">Rehabilitación neurológica</Link><Link to="/servicios?enfoque=traumatologica">Traumatología y ortopedia</Link><Link to="/servicios?enfoque=oncologica">Rehabilitación oncológica</Link><Link to="/agenda">Agendar valoración</Link></div>
      <div className="pub-footer-contact"><h2>Estamos para ti</h2><p><MapPin size={17} />{CLINIC.address}</p><a href={`tel:${CLINIC.phone.replace(/\s/g, "")}`}><Phone size={16} />{CLINIC.phone}</a><p><Clock3 size={17} /><span>Lun–Vie · 8:00 a 21:00<br />Sábado · 10:00 a 15:00</span></p><Link to="/contacto">Cómo llegar <ArrowRight size={15} /></Link></div>
    </div>
    <div className="pub-footer-bottom"><span>© {new Date().getFullYear()} FisioNerv. Todos los derechos reservados.</span><span className="pub-sanitary">COFEPRIS · 2530062002AA00019</span><a href="https://r-obots.vercel.app/" target="_blank" rel="noreferrer">Desarrollado por {developer && <img src={developer} alt="" />}<strong>RObots</strong></a></div>
  </footer>;
}
