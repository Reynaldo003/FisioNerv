// src/components/MorphicNavbar.jsx
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

export default function MorphicNavbar({ items = [], className = "" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeId, setActiveId] = useState(items?.[0]?.id ?? "");

  // Detecta activo por ruta actual (modo multi-página)
  useEffect(() => {
    const current = items.find((it) => it.href === location.pathname);
    if (current) setActiveId(current.id);
  }, [location.pathname, items]);

  // Solo para el modo single page (anchors "#...")
  const anchorIds = useMemo(() => {
    return items
      .map((it) => it.href || "")
      .filter((href) => href.startsWith("#"))
      .map((href) => href.replace("#", ""))
      .filter(Boolean);
  }, [items]);

  // Marcar activo según sección visible SOLO si hay anchors
  useEffect(() => {
    if (!anchorIds.length) return;

    const els = anchorIds.map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];

        if (!visible?.target?.id) return;

        // si hay items con href "#id", marcamos el correspondiente
        const match = items.find((it) => it.href === `#${visible.target.id}`);
        if (match) setActiveId(match.id);
      },
      {
        root: null,
        rootMargin: "-25% 0px -65% 0px",
        threshold: [0.1, 0.25, 0.5, 0.75],
      }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [anchorIds, items]);

  const onClickItem = (it) => {
    const href = it.href || "";
    setActiveId(it.id);

    // Si es anchor: scroll suave
    if (href.startsWith("#")) {
      const targetId = href.replace("#", "");
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    // Si es ruta: navega
    if (href.startsWith("/")) {
      navigate(href);
      return;
    }
  };

  return (
    <nav
      className={[
        "relative top-0 z-40 rounded-2xl bg-neutral-100/90 px-2 py-2 backdrop-blur-md dark:text-white/90 dark:bg-black/70",
        className,
      ].join(" ")}
      aria-label="Navegación"
    >
      <ul className="relative flex items-center gap-1">
        {items.map((it) => {
          const isActive = activeId === it.id;

          return (
            <li key={it.id} className="relative">
              <button
                type="button"
                onClick={() => onClickItem(it)}
                className={[
                  "relative z-10 rounded-xl px-3 py-2 text-sm font-medium",
                  "text-slate-700 hover:text-slate-900 dark:text-white/90",
                  "transition-colors",
                ].join(" ")}
              >
                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      layoutId="morphic-pill"
                      className={[
                        "absolute inset-0 -z-10 rounded-xl",
                        "bg-neutral-100/90",
                        "ring-1 ring-black/10 shadow-sm dark:bg-neutral-800 dark:border-neutral-600",
                        "shadow-[0_8px_20px_-12px_rgba(0,0,0,0.35)]",
                      ].join(" ")}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                        mass: 0.7,
                      }}
                    />
                  )}
                </AnimatePresence>
                {it.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
