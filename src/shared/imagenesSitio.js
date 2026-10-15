import { COLLAB_IMAGES } from "./clinicData";

export const IMAGENES_FIJAS = [
  // Página de inicio
  {
    clave: "inicio.hero",
    titulo: "Portada principal",
    grupo: "inicio",
    orden: 1,
    respaldo: "/fisio_fondo.png",
  },
  {
    clave: "inicio.clinica",
    titulo: "Fotografía de la clínica",
    grupo: "inicio",
    orden: 2,
    respaldo: "/clinica.png",
  },
  {
    clave: "inicio.sala",
    titulo: "Sala de rehabilitación",
    grupo: "inicio",
    orden: 3,
    respaldo: "/sala.png",
  },
  {
    clave: "inicio.quienes.1",
    titulo: "Quiénes somos · Foto 1",
    grupo: "inicio",
    orden: 4,
    respaldo: "/foto20.jpeg",
  },
  {
    clave: "inicio.quienes.2",
    titulo: "Quiénes somos · Foto 2",
    grupo: "inicio",
    orden: 5,
    respaldo: "/foto21.jpeg",
  },
  {
    clave: "inicio.quienes.3",
    titulo: "Quiénes somos · Foto 3",
    grupo: "inicio",
    orden: 6,
    respaldo: "/foto5.jpeg",
  },
  {
    clave: "inicio.quienes.4",
    titulo: "Quiénes somos · Foto 4",
    grupo: "inicio",
    orden: 7,
    respaldo: "/foto10.jpeg",
  },

  // Identidad visual
  {
    clave: "marca.icono",
    titulo: "Icono de FisioNerv",
    grupo: "marca",
    orden: 1,
    respaldo: "/onerv.png",
  },
  {
    clave: "marca.logo_oscuro",
    titulo: "Logo para fondo claro",
    grupo: "marca",
    orden: 2,
    respaldo: "/logo_b&w.png",
  },
  {
    clave: "marca.logo_claro",
    titulo: "Logo para fondo oscuro",
    grupo: "marca",
    orden: 3,
    respaldo: "/logo_w&b.png",
  },
  {
    clave: "marca.desarrollador",
    titulo: "Logo del desarrollador",
    grupo: "marca",
    orden: 4,
    respaldo: "/logo_robots.png",
  },

  // Servicios
  {
    clave: "servicios.placeholder",
    titulo: "Imagen predeterminada de servicios",
    grupo: "servicios",
    orden: 1,
    respaldo: "/servicios/valoracion.png",
  },

  // Convenios
  ...COLLAB_IMAGES.map((respaldo, index) => ({
    clave: `convenios.logo.${index + 1}`,
    titulo: `Convenio ${index + 1}`,
    grupo: "convenios",
    orden: index + 1,
    respaldo,
  })),
];
