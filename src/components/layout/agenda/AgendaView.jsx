import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  Ban,
  Banknote,
  CalendarCheck2,
  CalendarDays,
  Cake,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleX,
  Clock3,
  Filter,
  Plus,
  Search,
  SlidersHorizontal,
  Target,
  UserCheck2,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import { installFetchWithRefresh } from "../../../services/apiFetch";
import { MiniCalendar } from "./MiniCalendar";

installFetchWithRefresh();

const API_BASE = import.meta.env.VITE_API_BASE || "https://api.fisionerv.cloud";
//const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

const HOURS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
];

const HOUR_ROW_HEIGHT = 76;
const DEFAULT_GOAL = 60;

function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia(query);
    const onChange = () => setMatches(Boolean(media.matches));

    onChange();
    media.addEventListener?.("change", onChange);

    return () => media.removeEventListener?.("change", onChange);
  }, [query]);

  return matches;
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeekMonday(date) {
  const result = new Date(date);
  const jsDay = result.getDay();
  const delta = (jsDay + 6) % 7;
  result.setDate(result.getDate() - delta);
  result.setHours(0, 0, 0, 0);
  return result;
}

function weekdayShortEs(date) {
  return ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][
    date.getDay()
  ];
}

function formatLongDate(date) {
  return date
    .toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .replace(/^\w/, (char) => char.toUpperCase());
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function toMinutes(time) {
  if (!time) return 0;

  const [hours = "0", minutes = "0"] = String(time).split(":");
  return Number(hours) * 60 + Number(minutes);
}

function addMinutesToTime(time, minutesToAdd) {
  if (!time) return "08:00";

  const [hours = "0", minutes = "0"] = String(time).split(":");
  let total =
    Number(hours) * 60 + Number(minutes) + Number(minutesToAdd || 0);

  total = Math.max(0, total);

  const hh = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");

  return `${hh}:${mm}`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function overlapsMinutes(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function normalizeAppointmentStatus(status) {
  const value = String(status || "")
    .trim()
    .toLowerCase();

  if (
    [
      "completado",
      "si_asistio",
      "si asistio",
      "asistio",
      "asistió",
    ].includes(value)
  ) {
    return "si_asistio";
  }

  if (
    [
      "cancelado",
      "no_asistio",
      "no asistio",
      "inasistencia",
      "no-show",
      "no_show",
    ].includes(value)
  ) {
    return "no_asistio";
  }

  if (value === "confirmado") return "confirmado";

  return "reservado";
}

function isBlockItem(item) {
  if (!item) return false;

  const type = String(
    item.type || item.kind || item.__type || item.tipo || item._type || ""
  ).toLowerCase();

  return (
    type.includes("bloque") ||
    type === "block" ||
    type === "blocked" ||
    item.isBlock === true ||
    item.isBlocked === true ||
    item.blocked === true
  );
}

function statusDot(status) {
  const normalized = normalizeAppointmentStatus(status);

  if (normalized === "confirmado") return "bg-amber-500";
  if (normalized === "si_asistio") return "bg-emerald-500";
  if (normalized === "no_asistio") return "bg-rose-500";

  return "bg-blue-500";
}

function statusLabel(status) {
  const normalized = normalizeAppointmentStatus(status);

  if (normalized === "confirmado") return "Confirmado";
  if (normalized === "si_asistio") return "Sí asistió";
  if (normalized === "no_asistio") return "No asistió";

  return "Reservado";
}

function getProfessionalLabel(professional) {
  if (!professional) return "Profesional";

  return (
    professional.label ||
    professional.full_name ||
    `${professional.first_name || ""} ${professional.last_name || ""
      }`.trim() ||
    professional.username ||
    `Profesional #${professional.id}`
  );
}

function durationLabel(minutes) {
  const total = Math.max(0, Math.round(Number(minutes || 0)));
  const hours = Math.floor(total / 60);
  const mins = total % 60;

  if (!hours) return `${mins} min`;
  if (!mins) return `${hours} h`;

  return `${hours} h ${mins} min`;
}

function getClientPoint(event) {
  const touch =
    event?.touches?.[0] || event?.changedTouches?.[0];

  return {
    x: touch?.clientX ?? event?.clientX ?? 0,
    y: touch?.clientY ?? event?.clientY ?? 0,
  };
}

function rectFromPoint(x, y) {
  return {
    left: x,
    right: x,
    top: y,
    bottom: y,
    width: 0,
    height: 0,
  };
}

function MetricCard({
  title,
  value,
  helper,
  icon: Icon,
  accent = "blue",
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    cyan: "bg-cyan-50 text-cyan-700",
    violet: "bg-violet-50 text-violet-700",
  };

  const tone = tones[accent] || tones.blue;

  return (
    <article className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium text-slate-500">
            {title}
          </p>
          <p className="mt-1 truncate text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
        </div>

        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${tone}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>

      <p
        className={`mt-3 w-fit rounded-full px-2 py-1 text-[11px] font-semibold ${tone}`}
      >
        {helper}
      </p>
    </article>
  );
}

function MessageModal({ open, title, message, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Cerrar"
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
          <h3 className="text-sm font-bold text-slate-900">
            {title}
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="px-4 py-4 text-sm leading-relaxed text-slate-600">
          {message}
        </p>
      </div>
    </div>
  );
}

function GoalModal({
  open,
  professionals,
  initialProfessionalId,
  onClose,
  onSaved,
}) {
  const [scope, setScope] = useState(
    initialProfessionalId ? "professional" : "general"
  );
  const [professionalId, setProfessionalId] = useState(
    initialProfessionalId || professionals?.[0]?.id || ""
  );
  const [quantity, setQuantity] = useState(String(DEFAULT_GOAL));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setScope(initialProfessionalId ? "professional" : "general");
    setProfessionalId(
      initialProfessionalId || professionals?.[0]?.id || ""
    );
    setError("");

    const params = new URLSearchParams();
    if (initialProfessionalId) {
      params.set("profesional", initialProfessionalId);
    }

    const load = async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `${API_BASE}/api/citas/meta-diaria/?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("auth.access") || ""
                }`,
            },
          }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          setError(
            data?.detail || "No se pudo cargar la meta actual."
          );
          return;
        }

        setQuantity(
          String(
            initialProfessionalId
              ? data?.meta_personal ??
              data?.meta_general ??
              DEFAULT_GOAL
              : data?.meta_general ?? DEFAULT_GOAL
          )
        );
      } catch {
        setError("No se pudo cargar la meta actual.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [open, initialProfessionalId, professionals]);

  useEffect(() => {
    if (!open || scope !== "professional" || !professionalId) return;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE}/api/citas/meta-diaria/?profesional=${professionalId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("auth.access") || ""
                }`,
            },
          }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          setError(
            data?.detail || "No se pudo cargar la meta del usuario."
          );
          return;
        }

        setQuantity(
          String(
            data?.meta_personal ??
            data?.meta_general ??
            DEFAULT_GOAL
          )
        );
      } catch {
        setError("No se pudo cargar la meta del usuario.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [scope, professionalId, open]);

  if (!open) return null;

  const save = async (event) => {
    event.preventDefault();

    const parsed = Number(quantity);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 1000) {
      setError("La meta debe ser un entero entre 1 y 1000.");
      return;
    }

    if (scope === "professional" && !professionalId) {
      setError("Selecciona un usuario.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/api/citas/meta-diaria/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth.access") || ""
              }`,
          },
          body: JSON.stringify({
            cantidad: parsed,
            profesional:
              scope === "professional" ? Number(professionalId) : null,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          data?.detail ||
          data?.cantidad ||
          "No se pudo guardar la meta."
        );
        return;
      }

      onSaved?.(data);
    } catch {
      setError("No se pudo guardar la meta por un problema de red.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[145] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Cerrar"
      />

      <form
        onSubmit={save}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">
              Configuración
            </p>
            <h3 className="mt-1 text-base font-bold text-slate-950">
              Meta diaria de consultas
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              La meta individual tiene prioridad sobre la general.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Aplicar meta a
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScope("general")}
                className={`rounded-xl border px-3 py-3 text-xs font-bold transition ${scope === "general"
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
              >
                Clínica completa
              </button>

              <button
                type="button"
                onClick={() => setScope("professional")}
                className={`rounded-xl border px-3 py-3 text-xs font-bold transition ${scope === "professional"
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
              >
                Usuario específico
              </button>
            </div>
          </div>

          {scope === "professional" && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Usuario
              </label>
              <select
                value={professionalId}
                onChange={(event) =>
                  setProfessionalId(event.target.value)
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              >
                {(professionals || []).map((professional) => (
                  <option
                    key={professional.id}
                    value={professional.id}
                  >
                    {getProfessionalLabel(professional)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Consultas por día
            </label>
            <input
              type="number"
              min={1}
              max={1000}
              disabled={loading}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-base font-bold text-slate-900 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving || loading}
            className="h-10 rounded-xl bg-blue-600 px-5 text-xs font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar meta"}
          </button>
        </div>
      </form>
    </div>
  );
}

function AlertSection({ panel, canSeeMoney }) {
  const noShows = panel?.alertas?.no_asistencias || [];
  const birthdays = panel?.alertas?.cumpleanos || [];
  const pendingPayments = panel?.alertas?.cobros_pendientes || [];

  return (
    <div className="space-y-3">
      <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-bold text-slate-900">
              Inasistencias recurrentes
            </p>
            <p className="text-[10px] text-slate-500">
              Pacientes con más de 2 inasistencias
            </p>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {noShows.length ? (
            noShows.slice(0, 5).map((item) => (
              <div
                key={item.paciente_id}
                className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"
              >
                <span className="min-w-0 truncate text-[11px] font-semibold text-slate-700">
                  {item.paciente}
                </span>
                <span className="shrink-0 rounded-full bg-rose-100 px-2 py-1 text-[10px] font-bold text-rose-700">
                  {item.total_no_asistencias} faltas
                </span>
              </div>
            ))
          ) : (
            <p className="text-[11px] text-slate-400">
              Sin alertas de inasistencia.
            </p>
          )}
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <Cake className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-bold text-slate-900">
              Cumpleaños
            </p>
            <p className="text-[10px] text-slate-500">
              Hoy y próximos 5 días
            </p>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {birthdays.length ? (
            birthdays.slice(0, 5).map((item) => (
              <div
                key={item.paciente_id}
                className="rounded-xl bg-slate-50 px-3 py-2"
              >
                <p className="truncate text-[11px] font-semibold text-slate-700">
                  {item.paciente}
                </p>
                <p className="mt-0.5 text-[10px] font-bold text-violet-700">
                  {item.dias_para_cumple === 0
                    ? "Cumple hoy"
                    : `En ${item.dias_para_cumple} día(s)`}
                </p>
              </div>
            ))
          ) : (
            <p className="text-[11px] text-slate-400">
              No hay cumpleaños próximos.
            </p>
          )}
        </div>
      </article>

      {canSeeMoney && (
        <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <WalletCards className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-bold text-slate-900">
                Cobros pendientes
              </p>
              <p className="text-[10px] text-slate-500">
                Citas vencidas o del día sin liquidar
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {pendingPayments.length ? (
              pendingPayments.slice(0, 5).map((item) => (
                <div
                  key={item.cita_id}
                  className="rounded-xl bg-slate-50 px-3 py-2"
                >
                  <p className="truncate text-[11px] font-semibold text-slate-700">
                    {item.paciente}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-slate-500">
                    {item.fecha} · {String(item.hora || "").slice(0, 5)} · pendiente de liquidación
                  </p>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-slate-400">
                No hay cobros pendientes.
              </p>
            )}
          </div>
        </article>
      )}
    </div>
  );
}

export function AgendaView({
  branch,
  setBranch,
  appointments,
  professionals,
  selectedProfessionalId,
  setSelectedProfessionalId,
  role,
  permissions,
  myUserId,
  onNewReservation,
  onOpenAppointment,
  onMoveAppointment,
  onOpenBlockModal,
  onDeleteBlock,
}) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isProfessional = [
    "fisioterapeuta",
    "terapeuta",
    "practicante",
    "nutriologo",
    "dentista",
  ].includes(role);
  const canSeeAll = permissions?.puede_ver_todas_agendas ?? ["admin", "recepcion"].includes(role);
  const isMoneyRole = ["admin", "fisioterapeuta", "recepcion"].includes(role);
  const canSeeMoney = isMoneyRole;
  const canConfigureGoals = role === "admin";

  const [quickSearch, setQuickSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [viewMode, setViewMode] = useState("day");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [includeSunday, setIncludeSunday] = useState(
    () => localStorage.getItem("agenda.includeSunday") === "1"
  );
  const [activeApptId, setActiveApptId] = useState(null);
  const [slotMenu, setSlotMenu] = useState(null);
  const [panel, setPanel] = useState(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [uiMessage, setUiMessage] = useState({
    open: false,
    title: "",
    message: "",
  });
  const [now, setNow] = useState(() => new Date());

  const todayIso = useMemo(() => dateKey(new Date()), []);
  const keyDate = dateKey(currentDate);

  const DAY_START_MIN = toMinutes(HOURS[0]);
  const DAY_END_MIN =
    toMinutes(HOURS[HOURS.length - 1]) + 60;
  const GRID_TOTAL_HEIGHT = HOURS.length * HOUR_ROW_HEIGHT;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    })
  );

  useEffect(() => {
    localStorage.setItem(
      "agenda.includeSunday",
      includeSunday ? "1" : "0"
    );
  }, [includeSunday]);

  useEffect(() => {
    if (!canSeeMoney && paymentFilter !== "all") {
      setPaymentFilter("all");
    }
  }, [canSeeMoney, paymentFilter]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isMobile) setViewMode("day");
  }, [isMobile]);

  useEffect(() => {
    if (isProfessional && myUserId) {
      setSelectedProfessionalId?.(myUserId);
    }
  }, [
    isProfessional,
    myUserId,
    setSelectedProfessionalId,
  ]);

  const proMap = useMemo(() => {
    const map = new Map();
    (professionals || []).forEach((professional) => {
      map.set(Number(professional.id), professional);
    });
    return map;
  }, [professionals]);

  const sourceAppointments = useMemo(() => {
    const list = appointments || [];

    if (isProfessional && myUserId) {
      return list.filter(
        (item) =>
          Number(item.professionalId) === Number(myUserId)
      );
    }

    return list;
  }, [appointments, isProfessional, myUserId]);

  const dayProfessionals = useMemo(() => {
    const list = professionals || [];

    if (isProfessional && myUserId) {
      return list.filter(
        (professional) =>
          Number(professional.id) === Number(myUserId)
      );
    }

    if (selectedProfessionalId) {
      return list.filter(
        (professional) =>
          Number(professional.id) ===
          Number(selectedProfessionalId)
      );
    }

    return list;
  }, [
    professionals,
    isProfessional,
    myUserId,
    selectedProfessionalId,
  ]);

  const weekProfessionals = useMemo(() => {
    if (isProfessional && myUserId) {
      return (professionals || []).filter(
        (professional) =>
          Number(professional.id) === Number(myUserId)
      );
    }

    // Requisito: en semana siempre se ve una agenda completa por profesional.
    return professionals || [];
  }, [professionals, isProfessional, myUserId]);

  const selectedForPanel = useMemo(() => {
    if (isProfessional && myUserId) return Number(myUserId);
    if (selectedProfessionalId) return Number(selectedProfessionalId);
    return null;
  }, [
    isProfessional,
    myUserId,
    selectedProfessionalId,
  ]);

  const loadPanel = useCallback(async () => {
    const token = localStorage.getItem("auth.access");
    if (!token) return;

    setPanelLoading(true);

    const params = new URLSearchParams({ fecha: keyDate });
    if (selectedForPanel) {
      params.set("profesional", selectedForPanel);
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/citas/panel/?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setUiMessage({
          open: true,
          title: "Panel de agenda",
          message:
            data?.detail ||
            "No se pudieron cargar las métricas y alertas.",
        });
        return;
      }

      setPanel(data);
    } catch {
      setUiMessage({
        open: true,
        title: "Panel de agenda",
        message:
          "No se pudieron cargar las métricas y alertas por un problema de red.",
      });
    } finally {
      setPanelLoading(false);
    }
  }, [keyDate, selectedForPanel]);

  useEffect(() => {
    loadPanel();
  }, [loadPanel]);

  useEffect(() => {
    const refresh = () => loadPanel();
    window.addEventListener("fisionerv:agenda-refresh", refresh);
    window.addEventListener("fisionerv:sales-refresh", refresh);

    return () => {
      window.removeEventListener(
        "fisionerv:agenda-refresh",
        refresh
      );
      window.removeEventListener(
        "fisionerv:sales-refresh",
        refresh
      );
    };
  }, [loadPanel]);

  const activeFilters = useMemo(
    () =>
      Boolean(
        quickSearch.trim() ||
        statusFilter !== "all" ||
        (canSeeMoney && paymentFilter !== "all")
      ),
    [
      quickSearch,
      statusFilter,
      paymentFilter,
      canSeeMoney,
    ]
  );

  const matchesCurrentFilter = useCallback(
    (appointment) => {
      if (isBlockItem(appointment)) return true;

      const term = quickSearch.trim().toLowerCase();

      if (term) {
        const matchSearch = [
          appointment.time,
          appointment.patient,
          appointment.service,
          appointment.professional,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(term)
        );

        if (!matchSearch) return false;
      }

      if (
        statusFilter !== "all" &&
        normalizeAppointmentStatus(appointment.status) !==
        statusFilter
      ) {
        return false;
      }

      if (canSeeMoney && paymentFilter !== "all") {
        const paid = Boolean(
          appointment.paid || appointment.pagado
        );

        if (paymentFilter === "paid" && !paid) return false;
        if (paymentFilter === "unpaid" && paid) return false;
      }

      return true;
    },
    [
      quickSearch,
      statusFilter,
      paymentFilter,
      canSeeMoney,
    ]
  );

  const filteredCount = useMemo(
    () =>
      sourceAppointments.filter(
        (appointment) =>
          !isBlockItem(appointment) &&
          appointment.date === keyDate &&
          matchesCurrentFilter(appointment)
      ).length,
    [sourceAppointments, keyDate, matchesCurrentFilter]
  );

  const blockedSlots = useMemo(() => {
    const set = new Set();

    const byDateProfessional = new Map();

    sourceAppointments
      .filter(isBlockItem)
      .forEach((block) => {
        const key = `${block.date}|${block.professionalId}`;
        if (!byDateProfessional.has(key)) {
          byDateProfessional.set(key, []);
        }
        byDateProfessional.get(key).push(block);
      });

    for (const [key, blocks] of byDateProfessional.entries()) {
      const [dateIso, professionalId] = key.split("|");

      for (const hour of HOURS) {
        const hourStart = toMinutes(hour);
        const hourEnd = hourStart + 60;

        const covered = blocks.some((block) => {
          const start = toMinutes(block.time);
          const end = toMinutes(
            block.endTime ||
            addMinutesToTime(block.time, 60)
          );

          return overlapsMinutes(
            hourStart,
            hourEnd,
            start,
            end
          );
        });

        if (covered) {
          set.add(`${dateIso}|${professionalId}|${hour}`);
        }
      }
    }

    return set;
  }, [sourceAppointments]);

  const activeAppointment = useMemo(
    () =>
      sourceAppointments.find(
        (appointment) =>
          String(appointment.id) === String(activeApptId)
      ) || null,
    [sourceAppointments, activeApptId]
  );

  const handleDragStart = (event) => {
    if (isMobile) return;
    setActiveApptId(event?.active?.id ?? null);
  };

  const handleDragEnd = (event) => {
    if (isMobile) return;

    const activeId = event?.active?.id;
    const overId = event?.over?.id;

    setActiveApptId(null);

    if (!activeId || !overId) return;

    const appointment = sourceAppointments.find(
      (item) => String(item.id) === String(activeId)
    );

    if (!appointment || isBlockItem(appointment)) return;

    const parts = String(overId).split(":");
    if (parts[0] !== "slot") return;

    const newDate = parts[1];
    const newProfessionalId = Number(parts[2]);
    const newTime = `${parts[3]}:${parts[4]}`;
    const hour = `${parts[3]}:00`;

    const blockedKey = `${newDate}|${newProfessionalId}|${hour}`;

    if (blockedSlots.has(blockedKey)) {
      window?.navigator?.vibrate?.(15);
      setUiMessage({
        open: true,
        title: "Horario bloqueado",
        message:
          "No puedes mover la cita a un horario que está bloqueado.",
      });
      return;
    }

    const oldStart = toMinutes(appointment.time);
    const oldEnd = toMinutes(
      appointment.endTime ||
      addMinutesToTime(appointment.time, 60)
    );
    const duration = Math.max(60, oldEnd - oldStart);

    onMoveAppointment?.(appointment, {
      id: appointment.id,
      date: newDate,
      time: newTime,
      endTime: addMinutesToTime(newTime, duration),
      professionalId: newProfessionalId,
    });
  };

  function computeLayouts(items) {
    const appointmentsOnly = (items || [])
      .filter((item) => !isBlockItem(item))
      .map((appointment) => {
        const start = clamp(
          toMinutes(appointment.time),
          DAY_START_MIN,
          DAY_END_MIN
        );
        const rawEnd = toMinutes(
          appointment.endTime ||
          addMinutesToTime(appointment.time, 60)
        );
        const end = clamp(
          Math.max(rawEnd, start + 30),
          DAY_START_MIN,
          DAY_END_MIN
        );

        return {
          ...appointment,
          __start: start,
          __end: end,
        };
      })
      .sort(
        (a, b) =>
          a.__start - b.__start ||
          b.__end -
          b.__start -
          (a.__end - a.__start)
      );

    const columnById = new Map();
    const active = [];
    const usedColumns = new Set();

    const release = (start) => {
      for (let index = active.length - 1; index >= 0; index--) {
        if (active[index].end <= start) {
          usedColumns.delete(active[index].column);
          active.splice(index, 1);
        }
      }
    };

    const nextColumn = () => {
      let column = 0;
      while (usedColumns.has(column)) column += 1;
      return column;
    };

    for (const appointment of appointmentsOnly) {
      release(appointment.__start);

      const column = nextColumn();
      usedColumns.add(column);
      active.push({
        id: appointment.id,
        end: appointment.__end,
        column,
      });
      columnById.set(appointment.id, column);
    }

    const adjacency = new Map(
      appointmentsOnly.map((appointment) => [
        appointment.id,
        new Set(),
      ])
    );

    for (
      let first = 0;
      first < appointmentsOnly.length;
      first++
    ) {
      for (
        let second = first + 1;
        second < appointmentsOnly.length;
        second++
      ) {
        const a = appointmentsOnly[first];
        const b = appointmentsOnly[second];

        if (
          overlapsMinutes(
            a.__start,
            a.__end,
            b.__start,
            b.__end
          )
        ) {
          adjacency.get(a.id).add(b.id);
          adjacency.get(b.id).add(a.id);
        }
      }
    }

    const visited = new Set();
    const columnsById = new Map();

    for (const appointment of appointmentsOnly) {
      if (visited.has(appointment.id)) continue;

      const stack = [appointment.id];
      const component = [];
      visited.add(appointment.id);

      while (stack.length) {
        const current = stack.pop();
        component.push(current);

        for (const neighbor of adjacency.get(current) || []) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            stack.push(neighbor);
          }
        }
      }

      let maxColumn = 0;

      component.forEach((id) => {
        maxColumn = Math.max(
          maxColumn,
          columnById.get(id) || 0
        );
      });

      component.forEach((id) => {
        columnsById.set(id, maxColumn + 1);
      });
    }

    const layouts = new Map();

    for (const appointment of appointmentsOnly) {
      const column = columnById.get(appointment.id) || 0;
      const totalColumns =
        columnsById.get(appointment.id) || 1;

      const top =
        ((appointment.__start - DAY_START_MIN) / 60) *
        HOUR_ROW_HEIGHT;
      const height =
        ((appointment.__end - appointment.__start) / 60) *
        HOUR_ROW_HEIGHT;

      const widthPercent = 100 / totalColumns;
      const leftPercent = column * widthPercent;
      const gap = totalColumns > 1 ? 1.5 : 3;

      layouts.set(appointment.id, {
        top: top + 2,
        height: Math.max(30, height - 4),
        left: `calc(${leftPercent}% + ${gap}px)`,
        width: `calc(${widthPercent}% - ${gap * 2}px)`,
        columns: totalColumns,
        column,
      });
    }

    return layouts;
  }

  function computeBlockLayouts(items) {
    const layouts = new Map();

    (items || [])
      .filter(isBlockItem)
      .forEach((block) => {
        const start = clamp(
          toMinutes(block.time),
          DAY_START_MIN,
          DAY_END_MIN
        );
        const rawEnd = toMinutes(
          block.endTime ||
          addMinutesToTime(block.time, 60)
        );
        const end = clamp(
          Math.max(rawEnd, start + 30),
          DAY_START_MIN,
          DAY_END_MIN
        );

        const top =
          ((start - DAY_START_MIN) / 60) *
          HOUR_ROW_HEIGHT;
        const height =
          ((end - start) / 60) * HOUR_ROW_HEIGHT;

        layouts.set(block.id, {
          top: top + 2,
          height: Math.max(30, height - 4),
          left: "3px",
          width: "calc(100% - 6px)",
          columns: 1,
          column: 0,
        });
      });

    return layouts;
  }

  function DroppableHourSlot({
    id,
    disabled,
    children,
    onClick,
  }) {
    const { setNodeRef, isOver } = useDroppable({
      id,
      disabled,
    });

    return (
      <div
        ref={setNodeRef}
        onClick={onClick}
        className={`relative h-full w-full transition ${!disabled && isOver
          ? "ring-2 ring-blue-300"
          : ""
          } ${disabled ? "cursor-not-allowed" : ""}`}
      >
        {children}
      </div>
    );
  }

  function AppointmentBlock({
    appointment,
    layout,
    matchesFilter,
  }) {
    const isBlock = isBlockItem(appointment);
    const paid = Boolean(
      appointment.paid || appointment.pagado
    );
    const compact =
      !isBlock && Number(layout?.columns || 1) > 1;
    const veryCompact =
      !isBlock && Number(layout?.columns || 1) > 3;

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      isDragging,
    } = useDraggable({
      id: appointment.id,
      disabled: isBlock || isMobile,
    });

    const filteredClass = activeFilters
      ? matchesFilter
        ? "opacity-100 ring-2 ring-blue-300/70 shadow-lg"
        : "opacity-25 saturate-50 grayscale-[30%]"
      : "opacity-100";

    return (
      <button
        ref={setNodeRef}
        type="button"
        data-appt="1"
        style={{
          top: layout.top,
          height: layout.height,
          left: layout.left,
          width: layout.width,
          transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
          zIndex: isDragging
            ? 50
            : 10 + Number(layout.column || 0),
        }}
        onClick={(event) => {
          event.stopPropagation();

          if (isBlock) {
            const point = getClientPoint(event);

            setSlotMenu({
              anchorRect: rectFromPoint(point.x, point.y),
              date: appointment.date,
              hour: appointment.time || "08:00",
              professionalId: appointment.professionalId,
              blockItem: appointment,
              hasBlock: true,
            });
            return;
          }

          onOpenAppointment?.(appointment);
        }}
        className={[
          "absolute overflow-hidden border text-left transition duration-200",
          "hover:z-40 hover:-translate-y-px hover:shadow-[0_10px_24px_rgba(15,23,42,0.16)]",
          compact
            ? "rounded-lg px-1.5 py-1"
            : "rounded-xl px-3 py-2.5",
          appointment.color ||
          (isBlock
            ? "border-slate-300 bg-slate-100 text-slate-700"
            : "border-blue-200 bg-blue-50 text-blue-900"),
          filteredClass,
          !isBlock && !isMobile ? "touch-none" : "",
        ].join(" ")}
        {...(!isBlock ? listeners : {})}
        {...(!isBlock ? attributes : {})}
      >
        {paid && !isBlock && canSeeMoney && (
          <span
            className={`absolute bottom-0 left-0 top-0 bg-emerald-500 ${compact ? "w-1" : "w-1.5"
              }`}
            title="Pagada"
          />
        )}

        <div
          className={
            paid && !isBlock && canSeeMoney
              ? "min-w-0 pl-1"
              : "min-w-0"
          }
        >
          <div className="flex min-w-0 items-start gap-1">
            <div className="min-w-0 flex-1">
              <p
                className={`truncate font-bold leading-tight ${compact ? "text-[9px]" : "text-[11px]"
                  }`}
                title={
                  isBlock
                    ? "Horario bloqueado"
                    : appointment.patient || "Paciente"
                }
              >
                {isBlock
                  ? "Horario bloqueado"
                  : appointment.patient || "Paciente"}
              </p>

              {!veryCompact && (
                <p
                  className={`mt-1 truncate opacity-75 ${compact ? "text-[8px]" : "text-[10px]"
                    }`}
                >
                  {isBlock
                    ? appointment.motivo || "No disponible"
                    : appointment.service || "Servicio"}
                </p>
              )}
            </div>

            {!isBlock && (
              <span
                className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ring-2 ring-white/70 ${statusDot(
                  appointment.status
                )}`}
                title={statusLabel(appointment.status)}
              />
            )}
          </div>

          <div
            className={`flex items-end justify-between gap-1 font-semibold leading-none opacity-80 ${compact ? "mt-1 text-[8px]" : "mt-2 text-[10px]"
              }`}
          >
            <span className="truncate">
              {String(appointment.time || "").slice(0, 5)}
              {!veryCompact && appointment.endTime
                ? ` – ${String(appointment.endTime).slice(0, 5)}`
                : ""}
            </span>

            {!isBlock &&
              !compact &&
              canSeeMoney && (
                <span>
                  {paid ? "Pagada" : "Pendiente"}
                </span>
              )}
          </div>
        </div>
      </button>
    );
  }

  function DayColumn({ dateIso, professionalId }) {
    const items = useMemo(
      () =>
        sourceAppointments.filter(
          (appointment) =>
            appointment.date === dateIso &&
            Number(appointment.professionalId) ===
            Number(professionalId)
        ),
      [dateIso, professionalId, sourceAppointments]
    );

    const blockLayouts = useMemo(
      () => computeBlockLayouts(items),
      [items]
    );

    // Importante: NO se agrupan las citas simultáneas.
    // Cada cita recibe su propia columna dentro de la misma celda.
    const appointmentLayouts = useMemo(
      () => computeLayouts(items),
      [items]
    );

    const blockedByHour = useMemo(() => {
      const map = new Map();
      const blocks = items.filter(isBlockItem);

      HOURS.forEach((hour) => {
        const hourStart = toMinutes(hour);
        const hourEnd = hourStart + 60;

        const found =
          blocks.find((block) => {
            const start = toMinutes(block.time);
            const end = toMinutes(
              block.endTime ||
              addMinutesToTime(block.time, 60)
            );

            return overlapsMinutes(
              hourStart,
              hourEnd,
              start,
              end
            );
          }) || null;

        map.set(hour, found);
      });

      return map;
    }, [items]);

    const nowMinutes =
      now.getHours() * 60 + now.getMinutes();
    const nowY =
      ((nowMinutes - DAY_START_MIN) / 60) *
      HOUR_ROW_HEIGHT;
    const showNow =
      nowMinutes >= DAY_START_MIN &&
      nowMinutes <= DAY_END_MIN &&
      dateIso === todayIso;

    return (
      <div className="relative">
        <div className="pointer-events-none absolute inset-0">
          {HOURS.map((hour) => (
            <div
              key={hour}
              style={{ height: HOUR_ROW_HEIGHT }}
              className="border-b border-dashed border-slate-300"
            />
          ))}

          {showNow && (
            <div
              className="absolute left-0 right-0 z-[8]"
              style={{
                top: clamp(nowY, 0, GRID_TOTAL_HEIGHT),
              }}
            >
              <div className="h-[2px] bg-rose-500/90" />
              <div className="absolute -left-1 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-rose-500" />
            </div>
          )}
        </div>

        <div
          className="relative"
          style={{ height: GRID_TOTAL_HEIGHT }}
        >
          {HOURS.map((hour, index) => {
            const top = index * HOUR_ROW_HEIGHT;
            const slotId = `slot:${dateIso}:${professionalId}:${hour.slice(
              0,
              2
            )}:00`;
            const block = blockedByHour.get(hour);
            const blocked = Boolean(block);

            return (
              <div
                key={slotId}
                className="absolute left-0 right-0 px-1"
                style={{
                  top,
                  height: HOUR_ROW_HEIGHT,
                }}
              >
                <DroppableHourSlot
                  id={slotId}
                  disabled={blocked}
                  onClick={(event) => {
                    if (
                      event.target.closest?.("[data-appt='1']")
                    ) {
                      return;
                    }

                    const point = getClientPoint(event);

                    setSlotMenu({
                      anchorRect: rectFromPoint(
                        point.x,
                        point.y
                      ),
                      date: dateIso,
                      hour,
                      professionalId,
                      blockItem: block,
                      hasBlock: blocked,
                    });
                  }}
                >
                  <div
                    className={`group relative h-[98%] w-[98%] rounded-lg p-1 ${blocked
                      ? "bg-slate-100/80"
                      : "bg-white/70"
                      }`}
                  >
                    {!blocked && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          const point =
                            getClientPoint(event);

                          setSlotMenu({
                            anchorRect: rectFromPoint(
                              point.x,
                              point.y
                            ),
                            date: dateIso,
                            hour,
                            professionalId,
                            blockItem: null,
                            hasBlock: false,
                          });
                        }}
                        className="absolute right-2 top-2 z-[80] flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-white/95 text-blue-600 opacity-100 shadow-md transition hover:scale-105 hover:bg-blue-50"
                        title="Agendar otra cita"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </DroppableHourSlot>
              </div>
            );
          })}

          {items
            .filter(isBlockItem)
            .map((block) => {
              const layout = blockLayouts.get(block.id);
              if (!layout) return null;

              return (
                <AppointmentBlock
                  key={block.id}
                  appointment={block}
                  layout={layout}
                  matchesFilter
                />
              );
            })}

          {items
            .filter((item) => !isBlockItem(item))
            .map((appointment) => {
              const layout =
                appointmentLayouts.get(appointment.id);
              if (!layout) return null;

              return (
                <AppointmentBlock
                  key={appointment.id}
                  appointment={appointment}
                  layout={layout}
                  matchesFilter={matchesCurrentFilter(
                    appointment
                  )}
                />
              );
            })}
        </div>
      </div>
    );
  }

  const monday = startOfWeekMonday(currentDate);

  const weekDays = useMemo(
    () =>
      Array.from(
        { length: includeSunday ? 7 : 6 },
        (_, index) => {
          const day = new Date(monday);
          day.setDate(monday.getDate() + index);
          return day;
        }
      ),
    [monday, includeSunday]
  );

  const monthCells = useMemo(() => {
    const first = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const start = startOfWeekMonday(first);

    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [currentDate]);

  const monthCountMap = useMemo(() => {
    const map = new Map();

    sourceAppointments
      .filter((item) => !isBlockItem(item))
      .forEach((appointment) => {
        const current = map.get(appointment.date) || {
          total: 0,
          matching: 0,
        };

        current.total += 1;
        if (matchesCurrentFilter(appointment)) {
          current.matching += 1;
        }

        map.set(appointment.date, current);
      });

    return map;
  }, [sourceAppointments, matchesCurrentFilter]);

  let headerMainLabel = "";

  if (viewMode === "day") {
    headerMainLabel = formatLongDate(currentDate);
  } else if (viewMode === "week") {
    const end = new Date(monday);
    end.setDate(
      monday.getDate() + (includeSunday ? 6 : 5)
    );
    headerMainLabel = `${formatLongDate(
      monday
    )} – ${formatLongDate(end)}`;
  } else {
    headerMainLabel = currentDate
      .toLocaleDateString("es-MX", {
        month: "long",
        year: "numeric",
      })
      .replace(/^\w/, (char) => char.toUpperCase());
  }

  const headerModeLabel =
    viewMode === "day"
      ? "Día"
      : viewMode === "week"
        ? "Semana"
        : "Mes";

  const handlePrev = () => {
    const next = new Date(currentDate);

    if (viewMode === "day") next.setDate(next.getDate() - 1);
    else if (viewMode === "week")
      next.setDate(next.getDate() - 7);
    else next.setMonth(next.getMonth() - 1);

    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);

    if (viewMode === "day") next.setDate(next.getDate() + 1);
    else if (viewMode === "week")
      next.setDate(next.getDate() + 7);
    else next.setMonth(next.getMonth() + 1);

    setCurrentDate(next);
  };

  const metrics = panel?.metricas || {};
  const goalData = panel?.meta_diaria || {};
  const goal = Math.max(
    1,
    Number(goalData.meta_efectiva || DEFAULT_GOAL)
  );
  const scheduled = Number(metrics.agendadas || 0);
  const attended = Number(metrics.atendidas || 0);
  const pending = Number(metrics.pendientes || 0);
  const cancelled = Number(metrics.canceladas || 0);
  const goalPercentage = Math.min(
    100,
    Math.round((scheduled / goal) * 100)
  );

  const occupancy = useMemo(() => {
    const professionalsVisible = Math.max(
      1,
      dayProfessionals.length || 1
    );

    const active = sourceAppointments.filter(
      (appointment) =>
        !isBlockItem(appointment) &&
        appointment.date === keyDate &&
        (dayProfessionals.length === 0 ||
          dayProfessionals.some(
            (professional) =>
              Number(professional.id) ===
              Number(appointment.professionalId)
          )) &&
        normalizeAppointmentStatus(appointment.status) !==
        "no_asistio"
    );

    const occupiedMinutes = active.reduce(
      (sum, appointment) => {
        const start = toMinutes(appointment.time);
        const end = toMinutes(
          appointment.endTime ||
          addMinutesToTime(appointment.time, 60)
        );
        return sum + Math.max(0, end - start);
      },
      0
    );

    const availableMinutes =
      (DAY_END_MIN - DAY_START_MIN) *
      professionalsVisible;

    return {
      occupiedMinutes,
      percentage: Math.min(
        100,
        Math.round(
          (occupiedMinutes /
            Math.max(1, availableMinutes)) *
          100
        )
      ),
    };
  }, [
    sourceAppointments,
    keyDate,
    dayProfessionals,
    DAY_END_MIN,
    DAY_START_MIN,
  ]);

  const financials = panel?.finanzas;

  const nowMinutes =
    now.getHours() * 60 + now.getMinutes();
  const nowY =
    ((nowMinutes - DAY_START_MIN) / 60) *
    HOUR_ROW_HEIGHT;
  const nowLabel = `${String(now.getHours()).padStart(
    2,
    "0"
  )}:${String(now.getMinutes()).padStart(2, "0")}`;
  const weekHasToday = weekDays.some(
    (day) => dateKey(day) === todayIso
  );

  const dayGridStyle = {
    gridTemplateColumns: `56px repeat(${Math.max(
      1,
      dayProfessionals.length
    )}, minmax(${isMobile ? 0 : 230}px, 1fr))`,
  };

  const weekGridStyle = {
    gridTemplateColumns: `56px repeat(${includeSunday ? 7 : 6
      }, minmax(210px, 1fr))`,
  };

  return (
    <>
      <div className="h-full min-h-0 overflow-auto bg-[#f4f7fb] p-3 sm:p-4 lg:p-5">
        <div className="mx-auto flex min-h-full max-w-[1900px] flex-col gap-4">
          <section
            className={`grid grid-cols-2 gap-3 md:grid-cols-4 ${canSeeMoney ? "xl:grid-cols-6" : ""
              }`}
          >
            <MetricCard
              title="Citas agendadas"
              value={scheduled}
              helper={`${Math.max(
                0,
                goal - scheduled
              )} para alcanzar la meta`}
              icon={CalendarCheck2}
              accent="blue"
            />

            <MetricCard
              title="Atendidas"
              value={attended}
              helper={`${scheduled
                ? Math.round(
                  (attended / scheduled) * 100
                )
                : 0
                }% del día`}
              icon={UserCheck2}
              accent="emerald"
            />

            <MetricCard
              title="Pendientes"
              value={pending}
              helper="Requieren seguimiento"
              icon={Clock3}
              accent="amber"
            />

            <MetricCard
              title="No asistió"
              value={cancelled}
              helper={`${scheduled
                ? Math.round(
                  (cancelled / scheduled) * 100
                )
                : 0
                }% del día`}
              icon={CircleX}
              accent="rose"
            />

            {canSeeMoney && (
              <>
                <MetricCard
                  title="Ingreso esperado del corte"
                  value={formatCurrency(
                    financials?.ingreso_esperado || 0
                  )}
                  helper={`Por fecha de pago · ${keyDate}`}
                  icon={WalletCards}
                  accent="cyan"
                />

                <MetricCard
                  title="Ingreso cobrado"
                  value={formatCurrency(
                    financials?.ingreso_cobrado || 0
                  )}
                  helper={`${financials?.pagos_registrados || 0
                    } pago(s) en el corte`}
                  icon={Banknote}
                  accent="violet"
                />
              </>
            )}
          </section>

          <section className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
            <div className="min-w-0 space-y-4">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_230px]">
                <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <p className="text-xs font-semibold text-slate-500">
                          Meta diaria de consultas
                        </p>
                      </div>
                      <p className="mt-1 text-lg font-bold text-slate-950">
                        {scheduled} de {goal} consultas
                      </p>
                      {goalData?.profesional?.nombre && (
                        <p className="mt-1 text-[11px] font-semibold text-blue-700">
                          Meta efectiva de{" "}
                          {goalData.profesional.nombre}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-slate-900">
                        {goalPercentage}%
                      </span>

                      {canConfigureGoals && (
                        <button
                          type="button"
                          onClick={() => setGoalOpen(true)}
                          className="h-9 rounded-xl border border-blue-200 bg-blue-50 px-3 text-[11px] font-bold text-blue-700 transition hover:bg-blue-100"
                        >
                          Configurar
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all"
                      style={{
                        width: `${goalPercentage}%`,
                      }}
                    />
                  </div>

                  <p className="mt-3 text-[11px] text-slate-500">
                    Faltan{" "}
                    {Math.max(0, goal - scheduled)} consulta(s)
                    para la meta de {keyDate}.
                  </p>
                </article>

                <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                  <p className="text-xs font-semibold text-slate-500">
                    Ocupación del día
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    {occupancy.percentage}%
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {durationLabel(
                      occupancy.occupiedMinutes
                    )}{" "}
                    ocupadas
                  </p>
                </article>
              </div>

              <article className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
                <div className="border-b border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
                    <div className="flex min-w-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={handlePrev}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setCurrentDate(new Date())
                        }
                        className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Hoy
                      </button>

                      <button
                        type="button"
                        onClick={handleNext}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>

                      <div className="ml-1 min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                          {headerModeLabel}
                        </p>
                        <h2 className="truncate text-sm font-bold text-slate-950 sm:text-base">
                          {headerMainLabel}
                        </h2>
                        {viewMode === "week" && (
                          <p className="text-[11px] text-slate-500">
                            Una agenda semanal por profesional
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative min-w-[190px] flex-1 2xl:flex-none">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          value={quickSearch}
                          onChange={(event) =>
                            setQuickSearch(event.target.value)
                          }
                          placeholder="Buscar paciente o servicio"
                          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                        />
                      </div>

                      <select
                        value={branch}
                        onChange={(event) =>
                          setBranch(event.target.value)
                        }
                        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none"
                      >
                        <option>Fisionerv Centro</option>
                      </select>

                      <select
                        disabled={isProfessional}
                        value={
                          selectedProfessionalId || ""
                        }
                        onChange={(event) => {
                          const id = event.target.value
                            ? Number(event.target.value)
                            : null;
                          setSelectedProfessionalId?.(id);
                        }}
                        className="h-10 min-w-[190px] rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        {canSeeAll && (
                          <option value="">
                            Todos los profesionales
                          </option>
                        )}

                        {(professionals || []).map(
                          (professional) => (
                            <option
                              key={professional.id}
                              value={professional.id}
                            >
                              {getProfessionalLabel(
                                professional
                              )}
                            </option>
                          )
                        )}
                      </select>

                      <select
                        value={statusFilter}
                        onChange={(event) =>
                          setStatusFilter(event.target.value)
                        }
                        className="h-10 min-w-[155px] rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none"
                      >
                        <option value="all">
                          Todos los estados
                        </option>
                        <option value="reservado">
                          Reservado
                        </option>
                        <option value="confirmado">
                          Confirmado
                        </option>
                        <option value="si_asistio">
                          Sí asistió
                        </option>
                        <option value="no_asistio">
                          No asistió
                        </option>
                      </select>

                      {canSeeMoney && (
                        <select
                          value={paymentFilter}
                          onChange={(event) =>
                            setPaymentFilter(
                              event.target.value
                            )
                          }
                          className="h-10 min-w-[145px] rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none"
                        >
                          <option value="all">
                            Todos los cobros
                          </option>
                          <option value="paid">
                            Pagadas
                          </option>
                          <option value="unpaid">
                            No pagadas
                          </option>
                        </select>
                      )}

                      {!isMobile && (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenBlockModal?.({
                              date: keyDate,
                              startTime: "08:00",
                              endTime: "09:00",
                              professionalId:
                                selectedProfessionalId ||
                                myUserId ||
                                professionals?.[0]?.id ||
                                null,
                            })
                          }
                          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Ban className="h-4 w-4" />
                          Bloquear
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          onNewReservation?.({
                            date: keyDate,
                            professionalId:
                              selectedProfessionalId ||
                              myUserId ||
                              professionals?.[0]?.id ||
                              null,
                          })
                        }
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                        Nueva cita
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {activeFilters ? (
                        <Filter className="h-4 w-4 text-blue-600" />
                      ) : (
                        <SlidersHorizontal className="h-4 w-4" />
                      )}

                      <span>
                        {activeFilters
                          ? `${filteredCount} cita(s) resaltadas; las demás permanecen visibles atenuadas`
                          : `${dayProfessionals.length || 1} profesional(es) visibles`}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {viewMode === "week" &&
                        !isMobile && (
                          <button
                            type="button"
                            onClick={() =>
                              setIncludeSunday(
                                (current) => !current
                              )
                            }
                            className={`h-9 rounded-xl border px-3 text-[11px] font-bold ${includeSunday
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-white text-slate-600"
                              }`}
                          >
                            Domingo
                          </button>
                        )}

                      <div className="inline-flex rounded-xl bg-slate-100 p-1">
                        {[
                          ["day", "Día"],
                          ["week", "Semana"],
                          ["month", "Mes"],
                        ].map(([mode, label]) => (
                          <button
                            key={mode}
                            type="button"
                            disabled={
                              isMobile && mode !== "day"
                            }
                            onClick={() =>
                              setViewMode(mode)
                            }
                            className={`h-8 rounded-lg px-3 text-[11px] font-bold transition ${viewMode === mode
                              ? "bg-white text-blue-700 shadow-sm"
                              : "text-slate-500 hover:text-slate-800"
                              } disabled:hidden`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <DndContext
                  sensors={sensors}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <div className="min-h-0 overflow-auto bg-white">
                    {viewMode === "day" && (
                      <div
                        className={
                          isMobile
                            ? "min-w-[420px]"
                            : "min-w-[980px]"
                        }
                      >
                        <div
                          className="grid border-b border-slate-200 bg-slate-50/80 text-xs"
                          style={dayGridStyle}
                        >
                          <div className="p-3 text-right font-semibold text-slate-500">
                            Hora
                          </div>

                          {dayProfessionals.map(
                            (professional) => (
                              <div
                                key={professional.id}
                                className="border-l border-slate-200 p-3 text-center"
                              >
                                <p className="font-bold text-slate-800">
                                  {getProfessionalLabel(
                                    professional
                                  )}
                                </p>
                                <p className="mt-0.5 text-[10px] text-slate-400">
                                  {keyDate}
                                </p>
                              </div>
                            )
                          )}
                        </div>

                        <div
                          className="grid text-xs"
                          style={dayGridStyle}
                        >
                          <div
                            className="relative border-r border-slate-200 bg-slate-50/70 pr-3 text-right"
                            style={{
                              height: GRID_TOTAL_HEIGHT,
                            }}
                          >
                            {HOURS.map((hour) => (
                              <div
                                key={hour}
                                style={{
                                  height: HOUR_ROW_HEIGHT,
                                }}
                                className="flex items-start justify-end pt-2 text-[11px] text-slate-400"
                              >
                                {hour}
                              </div>
                            ))}

                            {keyDate === todayIso &&
                              nowMinutes >=
                              DAY_START_MIN &&
                              nowMinutes <=
                              DAY_END_MIN && (
                                <div
                                  className="pointer-events-none absolute right-2 z-[10]"
                                  style={{
                                    top:
                                      clamp(
                                        nowY,
                                        0,
                                        GRID_TOTAL_HEIGHT
                                      ) - 8,
                                  }}
                                >
                                  <div className="rounded-full bg-rose-500 px-2 py-1 text-[10px] text-white shadow">
                                    {nowLabel}
                                  </div>
                                </div>
                              )}
                          </div>

                          {dayProfessionals.map(
                            (professional) => (
                              <div
                                key={professional.id}
                                className="relative border-r border-slate-100"
                              >
                                <DayColumn
                                  dateIso={keyDate}
                                  professionalId={
                                    professional.id
                                  }
                                />
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {viewMode === "week" && (
                      <div className="space-y-6 bg-slate-50/40 p-3">
                        {weekProfessionals.map(
                          (professional) => (
                            <section
                              key={professional.id}
                              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                            >
                              <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                    <UsersRound className="h-5 w-5" />
                                  </span>

                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600">
                                      Agenda semanal
                                    </p>
                                    <h3 className="text-sm font-bold text-slate-900">
                                      {getProfessionalLabel(
                                        professional
                                      )}
                                    </h3>
                                  </div>
                                </div>

                                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold text-slate-500">
                                  ID {professional.id}
                                </span>
                              </div>

                              <div className="overflow-x-auto">
                                <div className="min-w-[1550px]">
                                  <div
                                    className="grid border-b border-slate-200 bg-slate-50/80 text-xs"
                                    style={weekGridStyle}
                                  >
                                    <div className="p-3 text-right font-semibold text-slate-500">
                                      Hora
                                    </div>

                                    {weekDays.map(
                                      (day) => (
                                        <div
                                          key={dateKey(day)}
                                          className="border-l border-slate-200 p-3 text-center"
                                        >
                                          <p className="font-bold text-slate-700">
                                            {weekdayShortEs(
                                              day
                                            )}{" "}
                                            {String(
                                              day.getDate()
                                            ).padStart(
                                              2,
                                              "0"
                                            )}
                                            /
                                            {String(
                                              day.getMonth() +
                                              1
                                            ).padStart(
                                              2,
                                              "0"
                                            )}
                                          </p>
                                        </div>
                                      )
                                    )}
                                  </div>

                                  <div
                                    className="grid text-xs"
                                    style={weekGridStyle}
                                  >
                                    <div
                                      className="relative border-r border-slate-200 bg-slate-50/70 pr-3 text-right"
                                      style={{
                                        height:
                                          GRID_TOTAL_HEIGHT,
                                      }}
                                    >
                                      {HOURS.map((hour) => (
                                        <div
                                          key={hour}
                                          style={{
                                            height:
                                              HOUR_ROW_HEIGHT,
                                          }}
                                          className="flex items-start justify-end pt-2 text-[11px] text-slate-400"
                                        >
                                          {hour}
                                        </div>
                                      ))}

                                      {weekHasToday &&
                                        nowMinutes >=
                                        DAY_START_MIN &&
                                        nowMinutes <=
                                        DAY_END_MIN && (
                                          <div
                                            className="pointer-events-none absolute right-2 z-[10]"
                                            style={{
                                              top:
                                                clamp(
                                                  nowY,
                                                  0,
                                                  GRID_TOTAL_HEIGHT
                                                ) - 8,
                                            }}
                                          >
                                            <div className="rounded-full bg-rose-500 px-2 py-1 text-[10px] text-white shadow">
                                              {
                                                nowLabel
                                              }
                                            </div>
                                          </div>
                                        )}
                                    </div>

                                    {weekDays.map(
                                      (day) => (
                                        <div
                                          key={dateKey(day)}
                                          className="relative border-r border-slate-100"
                                        >
                                          <DayColumn
                                            dateIso={dateKey(
                                              day
                                            )}
                                            professionalId={
                                              professional.id
                                            }
                                          />
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>
                            </section>
                          )
                        )}

                        {!weekProfessionals.length && (
                          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                            No hay profesionales disponibles.
                          </div>
                        )}
                      </div>
                    )}

                    {viewMode === "month" && (
                      <div className="p-4">
                        <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          {[
                            "Lun",
                            "Mar",
                            "Mié",
                            "Jue",
                            "Vie",
                            "Sáb",
                            "Dom",
                          ].map((day) => (
                            <div
                              key={day}
                              className="py-2"
                            >
                              {day}
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                          {monthCells.map((day) => {
                            const iso = dateKey(day);
                            const counts =
                              monthCountMap.get(iso) || {
                                total: 0,
                                matching: 0,
                              };
                            const currentMonth =
                              day.getMonth() ===
                              currentDate.getMonth();
                            const isToday =
                              iso === todayIso;

                            return (
                              <button
                                key={iso}
                                type="button"
                                onClick={() => {
                                  setCurrentDate(day);
                                  setViewMode("day");
                                }}
                                className={`min-h-24 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${currentMonth
                                  ? "border-slate-200 bg-white"
                                  : "border-slate-100 bg-slate-50 text-slate-300"
                                  } ${isToday
                                    ? "ring-2 ring-blue-300"
                                    : ""
                                  }`}
                              >
                                <span className="text-xs font-bold">
                                  {day.getDate()}
                                </span>

                                {counts.total > 0 && (
                                  <div className="mt-4 space-y-1">
                                    <span className="block w-fit rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                                      {counts.total} cita(s)
                                    </span>

                                    {activeFilters && (
                                      <span className="block w-fit rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                                        {counts.matching} coinciden
                                      </span>
                                    )}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <DragOverlay>
                    {activeAppointment &&
                      !isBlockItem(activeAppointment) ? (
                      <div className="w-56 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 shadow-2xl">
                        <p className="truncate text-xs font-bold text-blue-900">
                          {activeAppointment.patient ||
                            "Paciente"}
                        </p>
                        <p className="mt-1 text-[10px] text-blue-700">
                          {activeAppointment.time} ·{" "}
                          {activeAppointment.service}
                        </p>
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </article>
            </div>

            <aside className="space-y-4">
              <MiniCalendar
                currentDate={currentDate}
                onChangeDate={(date) => {
                  setCurrentDate(date);
                  if (isMobile) setViewMode("day");
                }}
              />

              <AlertSection
                panel={panel}
                canSeeMoney={canSeeMoney}
              />

              {panelLoading && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-700">
                  Actualizando métricas...
                </div>
              )}
            </aside>
          </section>
        </div>
      </div>

      {slotMenu?.anchorRect && (
        <div
          className="fixed z-[120] min-w-[210px] rounded-xl border border-slate-200 bg-white p-2 shadow-2xl"
          style={{
            left: Math.min(
              slotMenu.anchorRect.left,
              window.innerWidth - 230
            ),
            top: Math.min(
              slotMenu.anchorRect.top + 8,
              window.innerHeight - 160
            ),
          }}
        >
          {slotMenu.hasBlock ? (
            <>
              <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Horario bloqueado
              </p>
              <p className="px-2 pb-2 text-xs text-slate-600">
                {slotMenu.blockItem?.motivo ||
                  "No disponible"}
              </p>
              <button
                type="button"
                onClick={() => {
                  onDeleteBlock?.(slotMenu.blockItem);
                  setSlotMenu(null);
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-rose-700 hover:bg-rose-50"
              >
                Eliminar bloqueo
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  onNewReservation?.({
                    date: slotMenu.date,
                    time: slotMenu.hour,
                    professionalId:
                      slotMenu.professionalId,
                  });
                  setSlotMenu(null);
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-blue-700 hover:bg-blue-50"
              >
                Agendar cita
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenBlockModal?.({
                    date: slotMenu.date,
                    startTime: slotMenu.hour,
                    endTime: addMinutesToTime(
                      slotMenu.hour,
                      60
                    ),
                    professionalId:
                      slotMenu.professionalId,
                  });
                  setSlotMenu(null);
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Bloquear horario
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setSlotMenu(null)}
            className="mt-1 w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-400 hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>
      )}

      <GoalModal
        open={goalOpen}
        professionals={professionals}
        initialProfessionalId={selectedForPanel}
        onClose={() => setGoalOpen(false)}
        onSaved={() => {
          setGoalOpen(false);
          loadPanel();
        }}
      />

      <MessageModal
        open={uiMessage.open}
        title={uiMessage.title}
        message={uiMessage.message}
        onClose={() =>
          setUiMessage({
            open: false,
            title: "",
            message: "",
          })
        }
      />
    </>
  );
}