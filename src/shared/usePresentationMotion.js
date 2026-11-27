import { useLayoutEffect } from "react";

// Cada elemento entra una sola vez; los grupos usan un desfase breve y acotado.
const REVEALS = [
  { selector: ".pub-hero-copy > .pub-eyebrow", type: "text", delay: 0 },
  { selector: ".pub-hero-copy > h1", type: "headline", delay: 80 },
  { selector: ".pub-hero-copy > p", type: "text", delay: 160 },
  { selector: ".pub-hero-benefits", type: "text", delay: 230 },
  { selector: ".pub-hero-actions", type: "text", delay: 300 },
  { selector: ".pub-hero-trust", type: "text", delay: 360 },
  { selector: ".pub-hero-card", type: "card", delay: 240 },
  { selector: ".pub-therapist-label", type: "text", delay: 380 },
  { selector: ".pub-benefit-strip > div", type: "text", stagger: 70 },
  { selector: ".pub-section-heading > div > .pub-eyebrow, .pub-page-intro > .pub-eyebrow, .pub-about-copy > .pub-eyebrow, .pub-booking-intro > .pub-eyebrow", type: "text", delay: 0 },
  { selector: ".pub-section-heading h2, .pub-page-intro > h1, .pub-about-copy > h2, .pub-booking-intro > h1", type: "headline", delay: 70 },
  { selector: ".pub-section-heading > div > p, .pub-page-intro > p, .pub-about-copy > p, .pub-booking-intro > p", type: "text", delay: 140 },
  { selector: ".pub-section-heading > .pub-button, .pub-intro-note, .pub-about-actions", type: "text", delay: 190 },
  { selector: ".pub-service-card, .pub-team-card, .pub-catalog-card, .pub-process-grid > article, .pub-review-card, .pub-partners-full > .pub-partner", type: "card", stagger: 75 },
  { selector: ".pub-about-gallery > button, .pub-recovery-photo", type: "image", stagger: 85 },
  { selector: ".pub-value", type: "text", stagger: 75 },
  { selector: ".pub-why-card, .pub-recovery-copy, .pub-contact-card, .pub-contact-cta, .pub-contact-extra, .pub-form, .pub-review-form-aside, .pub-specialty-detail, .pub-partner-note, .pub-reviews-empty", type: "card", stagger: 80 },
];

export function usePresentationMotion(contentRef, route) {
  useLayoutEffect(() => {
    const root = contentRef.current;
    if (!root || !window.IntersectionObserver) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const registered = new Set();
    let scanFrame = 0;

    function reveal(element, immediate = false) {
      if (immediate) element.style.setProperty("--pub-reveal-delay", "0ms");
      element.dataset.pubReveal = "visible";
      observer.unobserve(element);
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) reveal(entry.target);
      }
    }, { threshold: 0.06, rootMargin: "0px 0px -32px 0px" });

    function scan() {
      for (const { selector, type, delay = 0, stagger = 0 } of REVEALS) {
        root.querySelectorAll(selector).forEach((element, index) => {
          if (registered.has(element)) return;
          registered.add(element);
          // Una lista actualizada por la API no reinicia la entrada de las demás tarjetas.
          if (preference.matches) return;
          element.dataset.pubRevealType = type;
          element.style.setProperty("--pub-reveal-delay", `${delay + (index % 4) * stagger}ms`);
          element.dataset.pubReveal = "pending";
          observer.observe(element);
        });
      }
    }

    function onPreferenceChange() {
      if (!preference.matches) return;
      for (const element of registered) {
        observer.unobserve(element);
        delete element.dataset.pubReveal;
        delete element.dataset.pubRevealType;
        element.style.removeProperty("--pub-reveal-delay");
      }
    }

    function onFocus(event) {
      const element = event.target.closest('[data-pub-reveal="pending"]');
      if (element) reveal(element, true);
    }

    // Incluye tarjetas y opiniones que llegan después del primer render.
    const mutations = new MutationObserver(() => {
      cancelAnimationFrame(scanFrame);
      scanFrame = requestAnimationFrame(scan);
    });
    scan();
    mutations.observe(root, { childList: true, subtree: true });
    preference.addEventListener("change", onPreferenceChange);
    root.addEventListener("focusin", onFocus);

    return () => {
      cancelAnimationFrame(scanFrame);
      observer.disconnect();
      mutations.disconnect();
      preference.removeEventListener("change", onPreferenceChange);
      root.removeEventListener("focusin", onFocus);
      for (const element of registered) {
        delete element.dataset.pubReveal;
        delete element.dataset.pubRevealType;
        element.style.removeProperty("--pub-reveal-delay");
      }
    };
  }, [contentRef, route]);
}
