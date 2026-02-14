// src/App.jsx
import { Routes, Route } from "react-router-dom";
import SiteLayout from "@/layout/SiteLayout";
import "./App.css";

import Inicio from "@/pages/Inicio";
import ServiciosPage from "@/pages/ServiciosPage";
import AgendaPage from "@/pages/AgendaPage";
import OpinionesPage from "@/pages/OpinionesPage";
import ConveniosPage from "@/pages/ConveniosPage";
import ContactoPage from "@/pages/ContactoPage";
import EquipoPage from "@/pages/EquipoPage";

import Login from "@/components/Login";
import Administrativa from "@/Administrativa";

export default function App() {
  return (
    <Routes>
      {/*
        Rutas públicas con Header/Footer
        (SiteLayout normalmente hace el wrapper con Header + Footer)
      */}
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/servicios" element={<ServiciosPage />} />
        <Route path="/agenda" element={<AgendaPage />} />
        <Route path="/opiniones" element={<OpinionesPage />} />
        <Route path="/convenios" element={<ConveniosPage />} />
        <Route path="/contacto" element={<ContactoPage />} />
        <Route path="/equipo" element={<EquipoPage />} />
      </Route>

      {/*
        Rutas administrativas SIN Header/Footer
        (fuera de SiteLayout)
      */}
      <Route path="/login" element={<Login />} />
      <Route path="/administrativa" element={<Administrativa />} />
    </Routes>
  );
}
