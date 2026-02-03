// src/pages/ContactoPage.jsx
import SobreYMapa from "@/components/SobreYMapa";
import { CLINIC, PRIMARY } from "../shared/ClinicData";

export default function ContactoPage() {
    return <SobreYMapa CLINIC={CLINIC} PRIMARY={PRIMARY} />;
}
