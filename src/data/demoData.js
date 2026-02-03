// src/data/demoData.js

export const BRANCHES = ["Fisionerv Centro", "Fisionerv Norte"];

export const PROFESSIONALS = [
  "Edgar Mauricio Medina Cruz",
  "María López",
  "Carlos Pérez",
];

export const SERVICES = [
  "Consulta inicial",
  "Sesión subsecuente",
  "Rehabilitación de rodilla",
  "Dolor de espalda",
];

export const DEMO_APPOINTMENTS = [
  {
    id: 1,
    patient: "RAFAEL GINES REYES",
    phone: "+52 272 123 4567",
    service: "Sesión subsecuente",
    date: "2025-11-17",
    dayLabel: "Lunes 17/11",
    time: "09:00",
    professional: "Edgar Mauricio Medina Cruz",
    status: "reservado",
    color: "bg-pink-200 text-pink-900 border-pink-300",
  },
  {
    id: 2,
    patient: "DIEGO CRUZ VELÁZQUEZ",
    phone: "+52 272 222 3344",
    service: "Consulta inicial",
    date: "2025-11-18",
    dayLabel: "Martes 18/11",
    time: "11:30",
    professional: "Edgar Mauricio Medina Cruz",
    status: "reservado",
    color: "bg-sky-200 text-sky-900 border-sky-300",
  },
  {
    id: 3,
    patient: "AIDE MELCHOR VALLEJO",
    phone: "+52 272 120 80541",
    service: "Sesión subsecuente",
    date: "2025-11-17",
    dayLabel: "Lunes 17/11",
    time: "14:00",
    professional: "Edgar Mauricio Medina Cruz",
    status: "reservado",
    color: "bg-emerald-200 text-emerald-900 border-emerald-300",
  },
  {
    id: 4,
    patient: "CARLOS MACIEL ADAME",
    phone: "+52 272 555 0000",
    service: "Rehabilitación de rodilla",
    date: "2025-11-23",
    dayLabel: "Domingo 23/11",
    time: "18:00",
    professional: "Edgar Mauricio Medina Cruz",
    status: "reservado",
    color: "bg-violet-200 text-violet-900 border-violet-300",
  },
];

export const DEMO_PATIENTS = [
  {
    id: 1,
    name: "Belinda",
    lastName: "Tentativo",
    email: "belinda@example.com",
    phone: "+52 272 113 38647",
    service: "Cita nutrióloga",
  },
  {
    id: 2,
    name: "Luis Daniel",
    lastName: "Aguilar Paz",
    email: "luisdaniel@gmail.com",
    phone: "+52 228 830 4834",
    service: "Sesión subsecuente",
  },
  {
    id: 3,
    name: "Aide",
    lastName: "Melchor Vallejo",
    email: "aide@example.com",
    phone: "+52 272 120 80541",
    service: "Sesión subsecuente",
  },
];

export const DEMO_PAYMENTS = [
  {
    id: 49312872,
    date: "01-11-2025 11:57",
    branch: "Fisionerv Centro",
    receipt: "33347890",
    client: "DANIEL ANTONIO NOLASCO ALVARADO",
    detail: "SESIONES SUBSECUENTES",
    amount: 270,
    discount: "3.57%",
  },
  {
    id: 49312852,
    date: "01-11-2025 11:57",
    branch: "Fisionerv Centro",
    receipt: "33347860",
    client: "IVAN FRANCISCO CASARES MARTÍNEZ",
    detail: "SESIONES SUBSECUENTES",
    amount: 280,
    discount: "0.00%",
  },
];
