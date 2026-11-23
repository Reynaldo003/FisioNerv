import { useState } from "react";
import { ArrowRight, HeartHandshake, LoaderCircle, ShieldCheck, Star } from "lucide-react";
import { PageIntro, ReviewsSection } from "../components/PublicSections";
import { publicApiFetch } from "../services/publicApi";

export default function OpinionesPage() {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  async function submit(event) {
    event.preventDefault();
    if (submitting || !name.trim() || !comment.trim() || !rating) return;
    setSubmitting(true);
    setStatus(null);
    try {
      const response = await publicApiFetch("/api/comentarios/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinica: 1, nombre_completo: name.trim(), calificacion: rating, descripcion: comment.trim() }),
      });
      if (!response.ok) throw new Error("No se pudo enviar tu opinión. Intenta nuevamente.");
      setStatus({ success: true, text: "¡Gracias por compartir tu experiencia! Tu opinión se envió a revisión y se mostrará cuando sea aprobada." });
      setName(""); setRating(0); setComment("");
    } catch (error) {
      setStatus({ success: false, text: error.message || "No pudimos conectar. Intenta nuevamente en unos minutos." });
    } finally { setSubmitting(false); }
  }

  return <><PageIntro eyebrow="Nuestra comunidad" title="Cada experiencia cuenta." accent="La tuya también." description="Conoce las opiniones de nuestros pacientes y comparte cómo ha sido tu proceso de atención en FisioNerv." /><ReviewsSection full /><section className="pub-section pub-review-form-section pub-container" id="tu-opinion"><div className="pub-review-form-aside"><span className="pub-icon-tile"><HeartHandshake size={30} /></span><br /><span className="pub-eyebrow">Te escuchamos</span><h2>Tu historia puede<br /><span>inspirar a alguien más.</span></h2><p>¿Cómo te has sentido durante tu tratamiento? Tus comentarios nos ayudan a mejorar y a que otras personas conozcan nuestra forma de trabajar.</p><p className="pub-form-note"><ShieldCheck size={17} />Revisamos cada opinión antes de publicarla para mantener un espacio respetuoso para nuestra comunidad.</p></div><form className="pub-form" onSubmit={submit} aria-busy={submitting}>{status && <p tabIndex={-1} role={status.success ? "status" : "alert"} className={`pub-message pub-message-${status.success ? "success" : "error"}`}>{status.text}</p>}<label className="pub-field" htmlFor="review-name">Tu nombre<input id="review-name" autoComplete="name" placeholder="¿Cómo te llamas?" value={name} onChange={(event) => setName(event.target.value)} required maxLength={150} disabled={submitting} /></label><fieldset className="pub-rating"><legend>¿Cómo fue tu experiencia?</legend><div onMouseLeave={() => setHovered(0)}>{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" className={(hovered || rating) >= value ? "selected" : ""} aria-label={`${value} ${value === 1 ? "estrella" : "estrellas"}`} aria-pressed={rating === value} onMouseEnter={() => setHovered(value)} onClick={() => setRating(value)} disabled={submitting}><Star size={29} fill="currentColor" strokeWidth={1.5} /></button>)}<span aria-live="polite">{rating ? `${rating} de 5` : "Elige tu calificación"}</span></div></fieldset><label className="pub-field" htmlFor="review-comment">Cuéntanos tu experiencia<textarea id="review-comment" placeholder="¿Cómo ha sido tu atención en FisioNerv?" value={comment} onChange={(event) => setComment(event.target.value)} required maxLength={3000} disabled={submitting} /></label><button className="pub-button" type="submit" disabled={submitting || !name.trim() || !comment.trim() || !rating}>{submitting ? <><LoaderCircle size={17} className="animate-spin" />Enviando…</> : <>Compartir mi experiencia<ArrowRight size={17} /></>}</button><p className="pub-form-note"><ShieldCheck size={14} />Tu opinión será enviada a revisión antes de publicarse.</p></form></section></>;
}
