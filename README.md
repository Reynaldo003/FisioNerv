# FisioNerv

## Desarrollo y vista previa de producción

```sh
npm install
npm run dev
```

Para verificar el comportamiento del bundle de producción antes de desplegar:

```sh
npm run build
npm run preview
```

## Conexión pública con el backend

El equipo, los servicios, las imágenes, las opiniones y la agenda pública utilizan
`src/services/publicApi.js`. El navegador solicita `/backend/api/...` al mismo
dominio del frontend; Vite o Vercel reenvían la petición al backend de la clínica.

- En desarrollo y `preview`, el proxy se configura en `vite.config.js` y usa
  `VITE_API_BASE` o, por defecto, `https://api.fisionerv.cloud`.
- En Vercel, el destino está definido en `vercel.json`. El proxy conserva el método,
  cuerpo y parámetros de consulta; añade la barra final requerida por Django.
- La disponibilidad no se almacena en la caché de Vercel.
- Las rutas de React Router también se resuelven desde `vercel.json`, incluyendo
  accesos directos a `/equipo`, `/servicios` y `/agenda`.
- Las imágenes de profesionales y tratamientos siguen usando sus URL reales de la API.

Esto permite que los dominios de producción y los despliegues de vista previa
carguen el mismo catálogo, sin depender de que cada dominio esté en la lista CORS
del backend. Si falla la consulta de servicios, la interfaz pública muestra el
error y permite reintentar; no ofrece servicios de demostración para agendar.

Después de desplegar, verificar `/equipo`, `/servicios` y `/agenda` y comprobar en
la pestaña Network que `/backend/api/...` devuelve JSON con HTTP 200. Una respuesta
HTML en esas rutas indica que no se aplicó la configuración del proxy.

## Plantilla base: React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
