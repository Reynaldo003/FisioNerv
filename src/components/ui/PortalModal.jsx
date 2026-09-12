import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";

let modalesAbiertos = 0;
let desbordamientoAnterior = "";

// El diálogo nativo se dibuja por encima de la página y mantiene el foco dentro.
// El portal evita que overflow o transform de un padre recorten el formulario.
export function PortalModal({
    children,
    onClose,
    ocupado = false,
    className = "",
    etiqueta = "Diálogo",
}) {
    const dialogoRef = useRef(null);

    useLayoutEffect(() => {
        const dialogo = dialogoRef.current;
        if (!dialogo) return;

        dialogo.showModal();

        if (modalesAbiertos === 0) {
            desbordamientoAnterior = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            document.body.classList.add("fisionerv-con-modal");
        }
        modalesAbiertos += 1;

        return () => {
            if (dialogo.open) dialogo.close();
            modalesAbiertos -= 1;

            if (modalesAbiertos === 0) {
                document.body.style.overflow = desbordamientoAnterior;
                document.body.classList.remove("fisionerv-con-modal");
            }
        };
    }, []);

    if (typeof document === "undefined") return null;

    return createPortal(
        <dialog
            ref={dialogoRef}
            aria-label={etiqueta}
            aria-modal="true"
            aria-busy={ocupado || undefined}
            className={`fisionerv-modal ${className}`}
            onCancel={(evento) => {
                evento.preventDefault();
                if (!ocupado) onClose?.();
            }}
        >
            {children}
        </dialog>,
        document.body,
    );
}
