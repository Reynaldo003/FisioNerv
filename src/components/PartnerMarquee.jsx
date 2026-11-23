import { useEffect, useRef } from "react";

export default function PartnerMarquee({ partners }) {
  const containerRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let hovered = false;
    let focused = false;
    let inView = false;

    function syncMotion() {
      cancelAnimationFrame(frame);
      const animation = track.getAnimations()[0];
      if (!animation || reducedMotion.matches) return;

      // Fuera de pantalla conserva la posición sin mantener trabajo de animación.
      if (!inView || document.hidden) {
        animation.pause();
        return;
      }

      animation.play();
      const initialRate = animation.playbackRate;
      const targetRate = hovered || focused ? 0 : 1;
      if (initialRate === targetRate) return;
      const duration = targetRate === 0 ? 650 : 1000;
      const start = performance.now();

      // Cambiar la velocidad conserva la fase del bucle, sin saltar de posición.
      function easeSpeed(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - (1 - progress) ** 3;
        animation.updatePlaybackRate(initialRate + (targetRate - initialRate) * eased);
        if (progress < 1) frame = requestAnimationFrame(easeSpeed);
      }
      frame = requestAnimationFrame(easeSpeed);
    }

    function onEnter(event) {
      if (event.pointerType === "touch") return;
      hovered = true;
      syncMotion();
    }
    function onLeave() { hovered = false; syncMotion(); }
    function onFocus() { focused = true; syncMotion(); }
    function onBlur(event) {
      focused = container.contains(event.relatedTarget);
      syncMotion();
    }

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncMotion();
    });
    observer.observe(container);
    container.addEventListener("pointerenter", onEnter);
    container.addEventListener("pointerleave", onLeave);
    container.addEventListener("focusin", onFocus);
    container.addEventListener("focusout", onBlur);
    document.addEventListener("visibilitychange", syncMotion);
    reducedMotion.addEventListener("change", syncMotion);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      container.removeEventListener("pointerenter", onEnter);
      container.removeEventListener("pointerleave", onLeave);
      container.removeEventListener("focusin", onFocus);
      container.removeEventListener("focusout", onBlur);
      document.removeEventListener("visibilitychange", syncMotion);
      reducedMotion.removeEventListener("change", syncMotion);
    };
  }, [partners.length]);

  return <div ref={containerRef} className="pub-partners-marquee" role="region" aria-label="Convenios de FisioNerv, banda de logos" tabIndex={0}>
    <div ref={trackRef} className="pub-marquee-track" style={{ "--pub-marquee-duration": `${Math.max(30, partners.length * 5)}s` }}>
      {[0, 1].map((copy) => <div className="pub-marquee-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>
        {partners.map(({ src, name }, index) => <div className="pub-partner" key={`${src}-${index}`}>
          <img src={src} alt={copy === 0 ? name : ""} loading="lazy" />
          <span>{name}</span>
        </div>)}
      </div>)}
    </div>
  </div>;
}
