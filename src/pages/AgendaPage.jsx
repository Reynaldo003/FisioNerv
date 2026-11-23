import { useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock3, HeartHandshake, Info, LoaderCircle, MapPin, MessageCircle, Phone, RefreshCw, ShieldCheck, Stethoscope, UserRound } from "lucide-react";
import { usePublicContent } from "../shared/PublicContent";
import { bookingDateKey, usePublicBooking } from "../shared/usePublicBooking";
import { useImagenesSitio } from "../shared/useImagenesSitio";
import { CLINIC } from "../shared/clinicData";
import "./agenda.css";

const money = (value) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 }).format(Number(value || 0));
const longDate = (date) => date.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
const stepLabels = ["Tu servicio", "Fecha y hora", "Tus datos"];

function validPhone(value) {
  if (!/^[+\d\s().-]+$/.test(value)) return false;
  let digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("52")) digits = digits.slice(2);
  else if (digits.length === 13 && digits.startsWith("521")) digits = digits.slice(3);
  return /^\d{10}$/.test(digits);
}

export default function AgendaPage() {
  const { services: availableServices, loadingServices } = usePublicContent();
  const services = useMemo(() => {
    const initialVisit = (item) => /valoraci[oó]n inicial/i.test(item.name || item.nombre || "");
    return [...availableServices].sort((a, b) => Number(initialVisit(b)) - Number(initialVisit(a)));
  }, [availableServices]);
  const { obtenerImagen } = useImagenesSitio();
  const [params] = useSearchParams();
  const [serviceId, setServiceId] = useState(null);
  const service = services.find((item) => String(item.id) === serviceId)
    || services.find((item) => (item.name || item.nombre) === params.get("servicio"))
    || services[0];
  const booking = usePublicBooking(service);
  const [step, setStep] = useState(0);
  const [week, setWeek] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const flowRef = useRef(null);
  const headingRef = useRef(null);
  const successRef = useRef(null);
  const clinicianPhoto = obtenerImagen("inicio.profesional", "/fisio.png");
  const canContinue = step === 0 ? Boolean(service) && !loadingServices : Boolean(booking.selectedSlot);
  const shownDays = booking.days.slice(week * 7, week * 7 + 7);

  function goToStep(target) {
    if (booking.booking || (target > 0 && (!service || loadingServices)) || (target > 1 && !booking.selectedSlot)) return;
    setStep(target);
    requestAnimationFrame(() => {
      headingRef.current?.focus({ preventScroll: true });
      if (window.innerWidth < 900 || flowRef.current?.getBoundingClientRect().top < 100) {
        flowRef.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
      }
    });
  }

  async function confirm(event) {
    event.preventDefault();
    if (booking.booking) return;
    if (!booking.selectedSlot) { goToStep(1); return; }
    const errors = {};
    if (name.trim().length < 2) errors.name = "Escribe tu nombre completo.";
    if (!validPhone(phone)) errors.phone = "Escribe un número de WhatsApp de 10 dígitos. Puedes incluir +52.";
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      document.getElementById(errors.name ? "booking-name" : "booking-phone")?.focus();
      return;
    }
    const result = await booking.submit({ name, phone });
    if (result?.conflict) goToStep(1);
    else if (result?.whatsapp) {
      window.open(result.whatsapp, "_blank", "noopener,noreferrer");
      requestAnimationFrame(() => {
        successRef.current?.focus({ preventScroll: true });
        successRef.current?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
      });
    }
  }

  return <section className="pub-booking-page pub-container" id="agenda">
    <div className="pub-booking-intro">
      <span className="pub-eyebrow"><span className="pub-status-dot" />Agenda en línea</span>
      <h1>Un momento para ti.<br /><span>Un paso para sentirte mejor.</span></h1>
      <p>Elige tu atención y encuentra un horario. Nosotros te acompañamos con lo demás.</p>
    </div>

    {booking.confirmation ? <div className="pub-booking-success" ref={successRef} tabIndex={-1}>
      <span className="pub-booking-success-icon"><CheckCircle2 size={42} /></span>
      <span className="pub-eyebrow">Cita registrada</span>
      <h2>¡Listo, {booking.confirmation.name.split(" ")[0]}!</h2>
      <p>Recibimos tu solicitud de cita. Te contactaremos para confirmar los detalles de tu atención.</p>
      <div className="pub-booking-success-details">
        <span><Stethoscope size={18} />{booking.confirmation.service}</span>
        <span><CalendarDays size={18} />{booking.confirmation.date}</span>
        <span><Clock3 size={18} />{booking.confirmation.time} h</span>
      </div>
      <a className="pub-button" href={booking.confirmation.whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={18} />Continuar por WhatsApp<ArrowRight size={17} /></a>
      <p className="pub-booking-success-note">Si WhatsApp no se abrió, puedes continuar con el botón de arriba.</p>
      <div className="pub-booking-success-actions"><Link className="pub-text-link" to="/">Volver al inicio</Link><button className="pub-text-link" onClick={() => { booking.startAgain(); setStep(0); }}>Agendar otra cita<ArrowRight size={15} /></button></div>
    </div> : <div className="pub-booking-layout">
      <div className="pub-booking-flow" ref={flowRef}>
        <nav className="pub-booking-steps" aria-label="Pasos para agendar">
          {stepLabels.map((label, index) => <button
            key={label}
            className={`${index === step ? "is-current" : ""} ${index < step ? "is-complete" : ""}`}
            aria-current={index === step ? "step" : undefined}
            disabled={booking.booking || (index > 0 && (!service || loadingServices)) || (index > 1 && !booking.selectedSlot)}
            onClick={() => goToStep(index)}
          ><span>{index < step ? <Check size={15} /> : `0${index + 1}`}</span><strong>{label}</strong></button>)}
        </nav>

        <div className="pub-booking-stage" key={step}>
          <div className="pub-booking-step-heading">
            <span className="pub-booking-step-caption">PASO 0{step + 1} DE 03</span>
            <h2 ref={headingRef} tabIndex={-1}>{["¿Cómo podemos ayudarte?", "Elige tu fecha y horario.", "Ya casi. Cuéntanos de ti."][step]}</h2>
            <p>{["Selecciona el servicio que necesitas para tu recuperación.", "Encuentra un espacio que se adapte a tu día.", "Con estos datos podremos confirmar tu cita contigo."][step]}</p>
          </div>
          {booking.error && <p role="alert" className="pub-message pub-message-error">{booking.error}</p>}

          {step === 0 && <>
            {loadingServices ? <div className="pub-booking-services" aria-label="Cargando servicios" aria-busy="true">{[0, 1, 2, 3].map((index) => <div key={index} className="pub-booking-service-skeleton pub-skeleton" />)}</div>
              : <fieldset className="pub-booking-services"><legend className="sr-only">Selecciona un servicio</legend>{services.map((item) => <label className={`pub-booking-service ${item.id === service?.id ? "is-selected" : ""}`} key={item.id}>
                <input type="radio" name="booking-service" className="pub-booking-radio" checked={item.id === service?.id} onChange={() => { setServiceId(String(item.id)); booking.clearTime(); }} />
                <span className="pub-booking-service-top"><span className="pub-icon-tile"><Stethoscope size={21} /></span><span className="pub-booking-radio-indicator">{item.id === service?.id && <Check size={12} />}</span></span>
                <strong>{item.name || item.nombre}</strong>
                <p>{item.description || item.descripcion || "Atención personalizada para tu recuperación."}</p>
                <span className="pub-booking-service-bottom"><span><Clock3 size={12} />{item.tag || "Atención personalizada"}</span><b>{money(item.price ?? item.precio)}</b></span>
              </label>)}</fieldset>}
            {!loadingServices && !services.length && <div className="pub-empty"><p>No hay servicios disponibles en este momento. Escríbenos para orientarte.</p></div>}
            <div className="pub-booking-hint"><HeartHandshake size={22} /><p><strong>¿Es tu primera visita?</strong> Una valoración inicial nos ayuda a conocer tu caso y diseñar tu plan.</p></div>
          </>}

          {step === 1 && <>
            <div className="pub-booking-date-header"><h3><CalendarDays size={17} />Selecciona una fecha</h3><div className="pub-booking-week-controls"><button className="pub-icon-button" aria-label="Fechas anteriores" disabled={week === 0} onClick={() => setWeek(week - 1)}><ChevronLeft size={17} /></button><span>{week === 0 ? "Próximos días" : "Más fechas"}</span><button className="pub-icon-button" aria-label="Fechas siguientes" disabled={(week + 1) * 7 >= booking.days.length} onClick={() => setWeek(week + 1)}><ChevronRight size={17} /></button></div></div>
            <div className="pub-booking-dates" role="group" aria-label="Fechas disponibles">{shownDays.map((date) => {
              const key = bookingDateKey(date);
              return <button className={booking.date === key ? "is-selected" : ""} key={key} aria-label={longDate(date)} aria-pressed={booking.date === key} onClick={() => booking.chooseDate(key)}><span>{date.toLocaleDateString("es-MX", { weekday: "short" }).replace(".", "")}</span><strong>{date.getDate()}</strong><small>{date.toLocaleDateString("es-MX", { month: "short" }).replace(".", "")}</small></button>;
            })}</div>
            <div className="pub-booking-hours-header"><h3><Clock3 size={17} />Elige tu horario</h3><div className="pub-booking-periods" role="group" aria-label="Filtrar horarios">{["Todo", "Mañana", "Tarde", "Noche"].map((period) => <button key={period} aria-pressed={booking.period === period} className={booking.period === period ? "is-selected" : ""} onClick={() => booking.choosePeriod(period)}>{period === "Todo" ? "Todos" : period}</button>)}</div></div>
            {booking.availabilityStatus === "loading" ? <div className="pub-booking-slots" aria-label="Consultando disponibilidad" aria-busy="true">{[0, 1, 2, 3, 4, 5, 6, 7].map((index) => <div key={index} className="pub-booking-slot-skeleton pub-skeleton" />)}</div>
              : booking.availabilityStatus === "error" ? <div className="pub-booking-availability-error" role="alert"><Info size={24} /><h4>No pudimos consultar los horarios.</h4><p>Vuelve a intentarlo para ver la disponibilidad de este día.</p><button className="pub-text-link" onClick={booking.retryAvailability}><RefreshCw size={15} />Volver a consultar</button></div>
                : <><div className="pub-booking-slots">{booking.filteredSlots.map((slot) => <button key={slot.label} disabled={slot.disabled} className={booking.selectedSlot?.label === slot.label ? "is-selected" : ""} aria-label={`${slot.label}${slot.disabled ? ", no disponible" : ""}`} aria-pressed={booking.selectedSlot?.label === slot.label} onClick={() => booking.chooseTime(slot.label)}>{slot.label}{booking.selectedSlot?.label === slot.label && <Check size={14} />}</button>)}</div><p className="pub-booking-availability-note" aria-live="polite"><span className="pub-status-dot" />{booking.slots.some((slot) => !slot.disabled) ? "Los horarios en gris no están disponibles para este servicio." : "No hay horarios disponibles este día. Puedes elegir otra fecha."}</p></>}
          </>}

          {step === 2 && <>
            <div className="pub-booking-mobile-review">
              <div><span>Tu cita</span><button type="button" disabled={booking.booking} onClick={() => goToStep(1)}>Editar</button></div>
              <strong>{service?.name || service?.nombre}</strong>
              <p><CalendarDays size={14} />{longDate(booking.selectedDate)} · {booking.selectedSlot?.label} h</p>
              <b>{money(service?.price ?? service?.precio)} <small>MXN</small></b>
            </div>
            <form id="public-booking-form" onSubmit={confirm} noValidate>
            <fieldset disabled={booking.booking}>
              <div className="pub-field">
                <label htmlFor="booking-name">Nombre completo</label>
                <div className="pub-booking-input"><UserRound size={18} /><input id="booking-name" name="name" autoComplete="name" placeholder="¿Cómo te llamas?" value={name} maxLength={150} aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? "booking-name-error" : undefined} onChange={(event) => { setName(event.target.value); setFieldErrors((previous) => ({ ...previous, name: "" })); }} /></div>
                {fieldErrors.name && <span className="pub-booking-field-error" id="booking-name-error">{fieldErrors.name}</span>}
              </div>
              <div className="pub-field">
                <label htmlFor="booking-phone">Tu WhatsApp</label>
                <div className="pub-booking-input"><Phone size={18} /><input id="booking-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="271 123 4567" value={phone} maxLength={20} aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? "booking-phone-error" : "booking-phone-hint"} onChange={(event) => { setPhone(event.target.value); setFieldErrors((previous) => ({ ...previous, phone: "" })); }} /></div>
                {fieldErrors.phone ? <span className="pub-booking-field-error" id="booking-phone-error">{fieldErrors.phone}</span> : <span className="pub-booking-field-hint" id="booking-phone-hint">10 dígitos. También puedes incluir +52.</span>}
              </div>
            </fieldset>
            <div className="pub-booking-confirm-note"><ShieldCheck size={22} /><div><strong>Todo listo para dar el primer paso.</strong><p>Al confirmar registraremos tu cita y abriremos WhatsApp para coordinar los detalles contigo.</p></div></div>
            </form>
          </>}
        </div>

        <div className="pub-booking-flow-footer">
          {step > 0 ? <button className="pub-text-link" disabled={booking.booking} onClick={() => goToStep(step - 1)}><ArrowLeft size={15} />Atrás</button> : <span><ShieldCheck size={14} />Atención con enfoque humano</span>}
          {step < 2 ? <button key="booking-next" className="pub-button" type="button" disabled={!canContinue} onClick={(event) => { event.preventDefault(); goToStep(step + 1); }}>{step === 0 ? "Elegir fecha y hora" : "Continuar con mis datos"}<ArrowRight size={17} /></button>
            : <button key="booking-confirm" className="pub-button" type="submit" form="public-booking-form" disabled={booking.booking} aria-busy={booking.booking}>{booking.booking ? <><LoaderCircle size={17} className="animate-spin" />Registrando…</> : <>Confirmar mi cita<ArrowRight size={17} /></>}</button>}
        </div>
      </div>

      <aside className="pub-booking-sidebar" aria-label="Resumen de tu cita">
        <div className="pub-booking-summary">
          <span className="pub-eyebrow">Tu próximo paso</span><h2>Un espacio para<br /><span>tu bienestar.</span></h2>
          <div className="pub-booking-clinician"><span className="pub-booking-avatar">{clinicianPhoto ? <img src={clinicianPhoto} alt="" /> : <Stethoscope size={24} />}</span><div><strong>L.F.T. Edgar Mauricio<br />Medina Cruz</strong><span>Fisioterapia y rehabilitación</span></div></div>
          <div className="pub-booking-summary-service"><div><span>Tu servicio</span>{step > 0 && <button disabled={booking.booking} onClick={() => goToStep(0)}>Cambiar</button>}</div><h3>{service?.name || service?.nombre || "Selecciona tu servicio"}</h3>{service?.tag && <p><Clock3 size={13} />{service.tag}</p>}</div>
          <dl className="pub-booking-summary-details">
            <div><CalendarDays size={17} /><div><dt>Fecha</dt><dd>{step > 0 || booking.selectedSlot ? longDate(booking.selectedDate) : "Por elegir"}</dd></div>{step === 2 && <button disabled={booking.booking} onClick={() => goToStep(1)} aria-label="Cambiar fecha y horario">Editar</button>}</div>
            <div><Clock3 size={17} /><div><dt>Horario</dt><dd>{booking.selectedSlot ? `${booking.selectedSlot.label} h` : "Por elegir"}</dd></div></div>
            <div><MapPin size={17} /><div><dt>Ubicación</dt><dd>{CLINIC.address}</dd></div></div>
          </dl>
          <div className="pub-booking-total"><span>Costo del servicio</span><strong>{service ? money(service.price ?? service.precio) : "—"}<small>MXN</small></strong></div>
          <p className="pub-booking-no-charge"><ShieldCheck size={13} />El registro en línea no realiza ningún cobro.</p>
        </div>
        <a className="pub-booking-help" href={`https://wa.me/${CLINIC.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><span className="pub-icon-circle"><MessageCircle size={21} /></span><div><strong>¿Te ayudamos a elegir?</strong><span>Escríbenos por WhatsApp<ArrowRight size={13} /></span></div></a>
      </aside>
    </div>}
    <p className="pub-booking-bottom-note"><HeartHandshake size={16} />Cada recuperación comienza con una conversación. Gracias por confiar en FisioNerv.</p>
  </section>;
}
