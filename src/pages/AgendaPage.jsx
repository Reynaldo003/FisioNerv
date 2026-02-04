// src/pages/AgendaPage.jsx
import Agenda from "@/components/Agenda";
import { CLINIC, PRIMARY } from "../shared/clinicData";
import { useServicios } from "../shared/useServicios";

export default function AgendaPage() {
    const { SERVICES, loadingServices } = useServicios();
    return (
        <div className="space-y-6">
            {loadingServices ? (
                <p className="text-sm text-slate-500">Cargando agenda...</p>) : null}

            <Agenda CLINIC={CLINIC} SERVICES={SERVICES} PRIMARY={PRIMARY} />        </div>
    );
}
