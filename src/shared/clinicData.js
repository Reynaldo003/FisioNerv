// src/shared/clinicData.js
export const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:8000";

export const PRIMARY = "#1E63C5";

export const CLINIC = {
  name: "FisioNerv",
  tagline: "Clínica de fisioterapia",
  address: "Calle 15 entre Av. 2 y 4, Córdoba, Veracruz",
  phone: "+52 271 122 4494",
  mapQuery: "FisioNerv, Calle 15 entre Avenidas 2 y 4, Córdoba, Veracruz",
  hours: {
    mon: "8:00-21:00",
    tue: "8:00-21:00",
    wed: "8:00-21:00",
    thu: "8:00-21:00",
    fri: "8:00-21:00",
    sat: "10:00-15:00",
  },
};

export const THERAPIST = {
  name: "Lic. Edgar Mauricio Medina Cruz",
  credentials:
    "Céd. Prof. 14168874 – Especialista en fisioterapia neuromuscular",
  about:
    "Fisioterapeuta con formación en neurorehabilitación y dolor musculoesquelético. Apasionado por la educación del paciente y el retorno seguro a la actividad.",
  badges: [
    "Neuromuscular",
    "Deportiva",
    "Terapia manual",
    "Ejercicio terapéutico",
  ],
  stats: [
    { k: "5", v: "años de experiencia" },
    { k: "800", v: "pacientes atendidos" },
    { k: "3", v: "certificaciones" },
  ],
};

export const SERVICE_UI_MAP = {
  "Valoración inicial": { mediaSrc: "/valoracion.png", tag: "45–60 min" },
  "Sesiones Subsecuentes": { mediaSrc: "/seguimiento.png", tag: "40–50 min" },
  "Cita Nutriologa": { mediaSrc: "/programa.png", tag: "45–60 min" },
  Neurodinamia: { mediaSrc: "/terapia.png", tag: "Clínica" },
  "Terapia Manual": { mediaSrc: "/electro.png", tag: "Clínica" },
  "Rehabilitación neurologica": {
    mediaSrc: "/rehabilitacion.png",
    tag: "Deportiva",
  },
  "Rehabilitación geriatrica": {
    mediaSrc: "/rehabilitacion.png",
    tag: "Deportiva",
  },
  "Rehabilitación post cirugia": {
    mediaSrc: "/rehabilitacion.png",
    tag: "Deportiva",
  },
  "Preparacion para cirugia": {
    mediaSrc: "/rehabilitacion.png",
    tag: "Deportiva",
  },
  "Dosificacion del ejercicio": {
    mediaSrc: "/rehabilitacion.png",
    tag: "Deportiva",
  },
  "Atencion Hospitalaria": {
    mediaSrc: "/rehabilitacion.png",
    tag: "Deportiva",
  },
  Pulmonar: { mediaSrc: "/rehabilitacion.png", tag: "Deportiva" },
  Cardiaca: { mediaSrc: "/rehabilitacion.png", tag: "Deportiva" },
};

export const FALLBACK_SERVICES = [
  {
    id: 1,
    name: "Valoración inicial",
    price: 450,
    tag: "45–60 min",
    description: "Entrevista clínica y plan personalizado.",
    mediaSrc: "/valoracion.png",
  },
  {
    id: 2,
    name: "Sesiones Subsecuentes",
    price: 280,
    tag: "40–50 min",
    description: "Ajuste de objetivos y progresión.",
    mediaSrc: "/seguimiento.png",
  },
];

export const COLLAB_IMAGES = [
  "/oxygen.png",
  "/DENTISTA.png",
  "/auFitness.png",
  "/banorte.png",
  "/sanatorioHuerta.png",
  "/melisa.png",
  "/idmgym.png",
  "/inbursa.png",
  "/seguros.png",
];
