// src/components/Login.jsx
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  Mail,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "https://api.fisionerv.cloud";
//const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [mode, setMode] = useState("login");
  const [forgotValue, setForgotValue] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");

  async function handleSubmit(evento) {
    evento.preventDefault();

    setError("");
    setLoading(true);

    try {
      const respuesta = await fetch(`${API_BASE}/api/auth/token/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email.trim(),
          password: pass,
        }),
      });

      if (!respuesta.ok) {
        const textoRespuesta = await respuesta.text();

        console.error(
          "ERROR DE LOGIN:",
          respuesta.status,
          textoRespuesta
        );

        setError(
          "Credenciales incorrectas. Verifica tu usuario, correo o contraseña."
        );

        return;
      }

      const datos = await respuesta.json();

      localStorage.setItem("auth.access", datos.access);
      localStorage.setItem("auth.refresh", datos.refresh);
      localStorage.setItem("auth.user", email.trim());

      window.location.href = "/administrativa";
    } catch (errorConexion) {
      console.error("ERROR DE CONEXIÓN:", errorConexion);

      setError(
        "No fue posible conectar con el servidor. Inténtalo nuevamente."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(evento) {
    evento.preventDefault();

    setError("");
    setForgotMsg("");
    setLoading(true);

    try {
      const respuesta = await fetch(
        `${API_BASE}/api/auth/password-reset/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email_or_username: forgotValue.trim(),
          }),
        }
      );

      const datos = await respuesta.json().catch(() => ({}));

      console.log(
        "RESPUESTA DE RECUPERACIÓN:",
        respuesta.status,
        datos
      );

      setForgotMsg(
        "Si el usuario o correo existe, recibirás un mensaje con las instrucciones de recuperación."
      );

      setForgotValue("");
    } catch (errorConexion) {
      console.error(
        "ERROR DE RECUPERACIÓN:",
        errorConexion
      );

      setError(
        "No fue posible conectar con el servidor. Inténtalo nuevamente."
      );
    } finally {
      setLoading(false);
    }
  }

  function abrirRecuperacion() {
    setMode("forgot");
    setError("");
    setForgotMsg("");
    setForgotValue(email.trim());
  }

  function regresarAlLogin() {
    setMode("login");
    setError("");
    setForgotMsg("");
  }

  return (
    <>
      <style>{`
        @keyframes clinicZoom {
          0% {
            transform: scale(1.015);
          }

          50% {
            transform: scale(1.055);
          }

          100% {
            transform: scale(1.015);
          }
        }

        @keyframes diagonalTravel {
          from {
            stroke-dashoffset: 1000;
          }

          to {
            stroke-dashoffset: -1000;
          }
        }

        @keyframes diagonalPulse {
          0%,
          100% {
            opacity: 0.45;
          }

          50% {
            opacity: 0.9;
          }
        }

        @keyframes logoFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-6px);
          }
        }

        @keyframes cardEnter {
          from {
            opacity: 0;
            transform: translateY(18px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes buttonGlow {
          0% {
            transform: translateX(-160%);
          }

          55%,
          100% {
            transform: translateX(300%);
          }
        }

        .fisionerv-clinic-image {
          animation: clinicZoom 20s ease-in-out infinite;
        }

        .fisionerv-diagonal-base {
          animation: diagonalPulse 3.5s ease-in-out infinite;
        }

        .fisionerv-diagonal-flow {
          stroke-dasharray: 180 820;
          stroke-dashoffset: 1000;
          animation: diagonalTravel 6s linear infinite;
        }

        .fisionerv-logo {
          animation: logoFloat 5s ease-in-out infinite;
        }

        .fisionerv-login-card {
          animation: cardEnter 600ms ease-out both;
        }

        .fisionerv-button-shine {
          animation: buttonGlow 4.5s ease-in-out infinite;
        }

        .fisionerv-auth-input:-webkit-autofill,
        .fisionerv-auth-input:-webkit-autofill:hover,
        .fisionerv-auth-input:-webkit-autofill:focus,
        .fisionerv-auth-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #071223 inset !important;
          -webkit-text-fill-color: #ffffff !important;
          caret-color: #ffffff !important;
          border-radius: 14px !important;
          transition: background-color 9999s ease-in-out 0s;
        }

        @media (max-width: 1279px) and (max-height: 740px) {
          .fisionerv-mobile-hero {
            height: 170px !important;
          }

          .fisionerv-mobile-logo {
            width: 56px !important;
            height: 56px !important;
          }

          .fisionerv-mobile-header {
            margin-top: -24px !important;
            margin-bottom: 16px !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .fisionerv-clinic-image,
          .fisionerv-diagonal-base,
          .fisionerv-diagonal-flow,
          .fisionerv-logo,
          .fisionerv-login-card,
          .fisionerv-button-shine {
            animation: none !important;
          }
        }
      `}</style>

      <main className="relative min-h-[100dvh] overflow-x-hidden bg-[#030b18] text-white">
        {/* Luces ambientales */}
        <div className="pointer-events-none fixed -left-40 top-10 h-[420px] w-[420px] rounded-full bg-blue-600/10 blur-[140px]" />

        <div className="pointer-events-none fixed -right-48 bottom-0 h-[480px] w-[480px] rounded-full bg-cyan-500/10 blur-[150px]" />

        <div className="relative grid min-h-[100dvh] bg-[#030b18] xl:grid-cols-[minmax(0,1.08fr)_minmax(500px,0.92fr)]">
          {/* =====================================================
              IMAGEN DE ESCRITORIO
          ===================================================== */}
          <section className="relative hidden min-h-[100dvh] overflow-hidden bg-[#030b18] xl:block">
            {/* Fotografía recortada */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 18px) 0, calc(100% - 230px) 100%, 0 100%)",
              }}
            >
              <div
                className="fisionerv-clinic-image absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: "url('/fisionerv-login.jpg')",
                }}
              />

              {/* Contraste sutil de la fotografía */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#020814]/55 via-black/5 to-black/5" />

              <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-[#030b18]/15" />
            </div>

            {/* Línea diagonal animada */}
            <div className="pointer-events-none absolute right-0 top-0 z-30 h-full w-[240px]">
              <svg
                viewBox="0 0 240 1000"
                preserveAspectRatio="none"
                className="h-full w-full overflow-visible"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient
                    id="lineaDiagonalBase"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#2563eb"
                      stopOpacity="0.3"
                    />

                    <stop
                      offset="45%"
                      stopColor="#60a5fa"
                      stopOpacity="0.95"
                    />

                    <stop
                      offset="100%"
                      stopColor="#2563eb"
                      stopOpacity="0.35"
                    />
                  </linearGradient>

                  <linearGradient
                    id="lineaDiagonalAnimada"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#2563eb"
                      stopOpacity="0"
                    />

                    <stop
                      offset="45%"
                      stopColor="#bfdbfe"
                      stopOpacity="1"
                    />

                    <stop
                      offset="55%"
                      stopColor="#38bdf8"
                      stopOpacity="1"
                    />

                    <stop
                      offset="100%"
                      stopColor="#2563eb"
                      stopOpacity="0"
                    />
                  </linearGradient>

                  <filter
                    id="resplandorDiagonal"
                    x="-300%"
                    y="-20%"
                    width="700%"
                    height="140%"
                  >
                    <feGaussianBlur
                      stdDeviation="6"
                      result="desenfoque"
                    />

                    <feMerge>
                      <feMergeNode in="desenfoque" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Resplandor */}
                <line
                  x1="228"
                  y1="0"
                  x2="16"
                  y2="1000"
                  stroke="#2563eb"
                  strokeWidth="14"
                  strokeOpacity="0.12"
                  filter="url(#resplandorDiagonal)"
                />

                {/* Línea base */}
                <line
                  className="fisionerv-diagonal-base"
                  x1="228"
                  y1="0"
                  x2="16"
                  y2="1000"
                  stroke="url(#lineaDiagonalBase)"
                  strokeWidth="2"
                  pathLength="1000"
                  filter="url(#resplandorDiagonal)"
                />

                {/* Luz que recorre la línea */}
                <line
                  className="fisionerv-diagonal-flow"
                  x1="228"
                  y1="0"
                  x2="16"
                  y2="1000"
                  stroke="url(#lineaDiagonalAnimada)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  pathLength="1000"
                  filter="url(#resplandorDiagonal)"
                />

                {/* Línea secundaria */}
                <line
                  x1="235"
                  y1="0"
                  x2="23"
                  y2="1000"
                  stroke="#60a5fa"
                  strokeWidth="1"
                  strokeOpacity="0.15"
                />
              </svg>
            </div>
          </section>

          {/* =====================================================
              PANEL DEL LOGIN
          ===================================================== */}
          <section className="relative min-h-[100dvh] bg-[#030b18] xl:flex xl:items-center xl:justify-center xl:px-12 xl:py-6 2xl:px-20">
            <div className="w-full xl:max-w-[540px] 2xl:max-w-[590px]">
              {/* =================================================
                  IMAGEN PARA MÓVIL Y TABLET
              ================================================= */}
              <div className="fisionerv-mobile-hero relative h-[205px] overflow-hidden sm:h-[260px] md:h-[320px] xl:hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage:
                      "url('/fisionerv-login.jpg')",
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#030b18] via-[#030b18]/15 to-black/5" />
              </div>

              {/* =================================================
                  LOGO PARA MÓVIL Y TABLET
              ================================================= */}
              <header className="fisionerv-mobile-header relative z-20 mx-auto -mt-8 mb-5 text-center xl:hidden">
                <div className="fisionerv-mobile-logo fisionerv-logo mx-auto mb-3 flex h-[68px] w-[68px] items-center justify-center sm:h-[76px] sm:w-[76px]">
                  <img
                    src="/onerv.png"
                    alt="Logo de Fisionerv"
                    className="h-full w-full object-contain drop-shadow-[0_14px_28px_rgba(37,99,235,0.45)]"
                  />
                </div>

                <h1 className="text-xl font-light tracking-[0.27em] text-white sm:text-2xl">
                  FISIO
                  <span className="font-medium text-blue-500">
                    NERV
                  </span>
                </h1>

                <p className="mt-2 text-[9px] uppercase tracking-[0.18em] text-slate-500 sm:text-[10px]">
                  Sistema de gestión clínica
                </p>
              </header>

              {/* =================================================
                  LOGO PARA ESCRITORIO
              ================================================= */}
              <header className="mb-6 hidden text-center xl:block 2xl:mb-8">
                <div className="fisionerv-logo mx-auto mb-4 flex h-[82px] w-[82px] items-center justify-center 2xl:h-[92px] 2xl:w-[92px]">
                  <img
                    src="/onerv.png"
                    alt="Logo de Fisionerv"
                    className="h-full w-full object-contain drop-shadow-[0_14px_32px_rgba(37,99,235,0.42)]"
                  />
                </div>

                <h1 className="text-[27px] font-light tracking-[0.28em] text-white 2xl:text-3xl">
                  FISIO
                  <span className="font-medium text-blue-500">
                    NERV
                  </span>
                </h1>

                <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-slate-500 2xl:text-xs">
                  Sistema de gestión clínica
                </p>
              </header>

              {/* =================================================
                  TARJETA RESPONSIVE
              ================================================= */}
              <div className="relative z-20 mx-auto w-full max-w-[620px] px-4 pb-8 sm:px-6 md:px-8 xl:max-w-none xl:px-0 xl:pb-0">
                <div className="fisionerv-login-card rounded-[26px] border border-white/[0.10] bg-[#081224]/95 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:rounded-[30px] sm:p-7 xl:bg-slate-900/70 2xl:p-9">
                  <div className="mb-5 text-center sm:mb-6">
                    <h2 className="text-[22px] font-light leading-tight text-white sm:text-2xl 2xl:text-[32px]">
                      {mode === "login" ? (
                        <>
                          Acceso{" "}
                          <span className="font-semibold text-blue-400">
                            administrativo
                          </span>
                        </>
                      ) : (
                        <>
                          Recuperar{" "}
                          <span className="font-semibold text-blue-400">
                            acceso
                          </span>
                        </>
                      )}
                    </h2>

                    <p className="mx-auto mt-2.5 max-w-sm text-xs leading-5 text-slate-400 sm:mt-3 sm:text-sm">
                      {mode === "login"
                        ? "Ingresa tus credenciales para continuar al panel de administración."
                        : "Ingresa tu usuario o correo para recibir las instrucciones de recuperación."}
                    </p>
                  </div>

                  {/* Mensaje de error */}
                  {error && (
                    <div
                      role="alert"
                      className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-xs leading-5 text-red-200 sm:mb-5 sm:text-sm"
                    >
                      {error}
                    </div>
                  )}

                  {/* Mensaje de recuperación */}
                  {mode === "forgot" && forgotMsg && (
                    <div
                      role="status"
                      className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-xs leading-5 text-emerald-200 sm:mb-5 sm:text-sm"
                    >
                      {forgotMsg}
                    </div>
                  )}

                  {mode === "login" ? (
                    <form
                      onSubmit={handleSubmit}
                      className="space-y-4"
                    >
                      {/* Usuario */}
                      <div>
                        <label
                          htmlFor="login-email"
                          className="mb-2 block text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400 sm:text-xs"
                        >
                          Usuario o correo
                        </label>

                        <div className="group flex h-[54px] items-center rounded-2xl border border-white/10 bg-[#071223] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition duration-200 focus-within:border-blue-500/70 focus-within:bg-[#081427] focus-within:ring-4 focus-within:ring-blue-500/10 sm:h-14 2xl:h-[60px]">
                          <Mail className="mr-3 h-[18px] w-[18px] shrink-0 text-slate-500 transition group-focus-within:text-blue-400 sm:h-5 sm:w-5" />

                          <input
                            id="login-email"
                            type="text"
                            required
                            autoComplete="username"
                            value={email}
                            onChange={(evento) =>
                              setEmail(evento.target.value)
                            }
                            placeholder="Usuario o correo electrónico"
                            className="fisionerv-auth-input h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                          />
                        </div>
                      </div>

                      {/* Contraseña */}
                      <div>
                        <label
                          htmlFor="login-password"
                          className="mb-2 block text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400 sm:text-xs"
                        >
                          Contraseña
                        </label>

                        <div className="group flex h-[54px] items-center rounded-2xl border border-white/10 bg-[#071223] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition duration-200 focus-within:border-blue-500/70 focus-within:bg-[#081427] focus-within:ring-4 focus-within:ring-blue-500/10 sm:h-14 2xl:h-[60px]">
                          <Lock className="mr-3 h-[18px] w-[18px] shrink-0 text-slate-500 transition group-focus-within:text-blue-400 sm:h-5 sm:w-5" />

                          <input
                            id="login-password"
                            type={showPass ? "text" : "password"}
                            required
                            autoComplete="current-password"
                            value={pass}
                            onChange={(evento) =>
                              setPass(evento.target.value)
                            }
                            placeholder="Ingresa tu contraseña"
                            className="fisionerv-auth-input h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowPass(
                                (valorActual) => !valorActual
                              )
                            }
                            className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/5 hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            aria-label={
                              showPass
                                ? "Ocultar contraseña"
                                : "Mostrar contraseña"
                            }
                            title={
                              showPass
                                ? "Ocultar contraseña"
                                : "Mostrar contraseña"
                            }
                          >
                            {showPass ? (
                              <EyeOff className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
                            ) : (
                              <Eye className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
                            )}
                          </button>
                        </div>

                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={abrirRecuperacion}
                            className="text-xs font-medium text-blue-400 transition hover:text-blue-300 hover:underline sm:text-sm"
                          >
                            ¿Olvidaste tu contraseña?
                          </button>
                        </div>
                      </div>

                      {/* Botón principal */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="group relative flex h-[54px] w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-blue-600 to-blue-800 px-5 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(37,99,235,0.30)] transition duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_20px_45px_rgba(37,99,235,0.38)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:h-14 2xl:h-[58px]"
                      >
                        <span className="fisionerv-button-shine pointer-events-none absolute inset-y-0 left-0 w-20 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent" />

                        {loading ? (
                          <>
                            <LoaderCircle className="relative z-10 h-5 w-5 animate-spin" />

                            <span className="relative z-10">
                              Ingresando...
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="relative z-10">
                              Acceder al panel
                            </span>

                            <ArrowRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <form
                      onSubmit={handleForgot}
                      className="space-y-4"
                    >
                      {/* Recuperación */}
                      <div>
                        <label
                          htmlFor="forgot-value"
                          className="mb-2 block text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400 sm:text-xs"
                        >
                          Usuario o correo
                        </label>

                        <div className="group flex h-[54px] items-center rounded-2xl border border-white/10 bg-[#071223] px-4 transition duration-200 focus-within:border-blue-500/70 focus-within:bg-[#081427] focus-within:ring-4 focus-within:ring-blue-500/10 sm:h-14 2xl:h-[60px]">
                          <Mail className="mr-3 h-[18px] w-[18px] shrink-0 text-slate-500 transition group-focus-within:text-blue-400 sm:h-5 sm:w-5" />

                          <input
                            id="forgot-value"
                            type="text"
                            required
                            value={forgotValue}
                            onChange={(evento) =>
                              setForgotValue(evento.target.value)
                            }
                            placeholder="Usuario o correo electrónico"
                            className="fisionerv-auth-input h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="group relative flex h-[54px] w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-blue-600 to-blue-800 px-5 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(37,99,235,0.30)] transition duration-200 hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:h-14"
                      >
                        <span className="fisionerv-button-shine pointer-events-none absolute inset-y-0 left-0 w-20 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent" />

                        {loading ? (
                          <>
                            <LoaderCircle className="relative z-10 h-5 w-5 animate-spin" />

                            <span className="relative z-10">
                              Enviando...
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="relative z-10">
                              Enviar instrucciones
                            </span>

                            <ArrowRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={regresarAlLogin}
                        className="flex h-[50px] w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white sm:h-[52px]"
                      >
                        <ArrowLeft className="h-4 w-4" />

                        Regresar al inicio de sesión
                      </button>
                    </form>
                  )}
                </div>

                <footer className="mt-5 text-center">
                  <p className="text-[10px] leading-5 text-slate-600 2xl:text-xs">
                    © {new Date().getFullYear()} Fisionerv

                    <span className="mx-2 text-slate-800">
                      •
                    </span>

                    Plataforma administrativa
                  </p>
                </footer>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}