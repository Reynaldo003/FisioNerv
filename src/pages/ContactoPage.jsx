// src/pages/ContactoPage.jsx
import SobreYMapa from "@/components/SobreYMapa";
import { CLINIC, PRIMARY } from "../shared/clinicData";

export default function ContactoPage() {
    return <SobreYMapa CLINIC={CLINIC} PRIMARY={PRIMARY} />;
}
