// src/pages/ServiciosPage.jsx
import Servicios from "@/components/Servicios";
import { useServicios } from "../shared/useServicios";
import { PRIMARY } from "../shared/clinicData";

export default function ServiciosPage() {
    const { SERVICES, loadingServices } = useServicios();

    return (
        <div className="space-y-6">
            {loadingServices ? (
                <p className="text-sm text-slate-500">Cargando servicios...</p>
            ) : null}

            <Servicios SERVICES={SERVICES} PRIMARY={PRIMARY} />
        </div>
    );
}
