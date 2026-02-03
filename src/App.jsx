// src/App.jsx
import { Routes, Route } from "react-router-dom";
import SiteLayout from "@/layout/SiteLayout";
import './App.css'

import Inicio from "@/pages/Inicio";
import ServiciosPage from "@/pages/ServiciosPage";
import AgendaPage from "@/pages/AgendaPage";
import OpinionesPage from "@/pages/OpinionesPage";
import ConveniosPage from "@/pages/ConveniosPage";
import ContactoPage from "@/pages/ContactoPage";
import EquipoPage from "@/pages/EquipoPage";

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/servicios" element={<ServiciosPage />} />
        <Route path="/agenda" element={<AgendaPage />} />
        <Route path="/opiniones" element={<OpinionesPage />} />
        <Route path="/convenios" element={<ConveniosPage />} />
        <Route path="/contacto" element={<ContactoPage />} />
        <Route path="/equipo" element={<EquipoPage />} />
      </Route>
    </Routes>
  );
}
