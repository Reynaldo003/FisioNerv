import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Banknote,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Download,
  Landmark,
  Mail,
  MessageCircle,
  NotebookPen,
  Phone,
  Plus,
  Repeat2,
  Stethoscope,
  Trash2,
  UserPlus,
  UserRound,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";

import { installFetchWithRefresh } from "../../services/apiFetch";

installFetchWithRefresh();

const API_BASE = import.meta.env.VITE_API_BASE || "https://api.fisionerv.cloud";
//const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

const PAYMENT_METHODS = [
  { id: "tarjeta", label: "Tarjeta", icon: CreditCard },
  {
    id: "transferencia",
    label: "Transferencia",
    icon: Landmark,
  },
  { id: "efectivo", label: "Efectivo", icon: Banknote },
  { id: "otro", label: "Otro", icon: CreditCard },
];

const DAYS = [
  { key: "L", label: "Lun" },
  { key: "M", label: "Mar" },
  { key: "X", label: "Mié" },
  { key: "J", label: "Jue" },
  { key: "V", label: "Vie" },
  { key: "S", label: "Sáb" },
];

const DAYKEY_TO_JS = {
  D: 0,
  L: 1,
  M: 2,
  X: 3,
  J: 4,
  V: 5,
  S: 6,
};

function getLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isoToDate(value) {
  const [year, month, day] = String(value)
    .split("-")
    .map(Number);

  return new Date(
    year,
    (month || 1) - 1,
    day || 1
  );
}

function dateToIso(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(
    2,
    "0"
  );
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function durationToMinutes(duration) {
  if (!duration) return 60;

  const [hours = "0", minutes = "0", seconds = "0"] =
    String(duration).split(":");

  return (
    Number(hours) * 60 +
    Number(minutes) +
    Number(seconds) / 60
  );
}

function addMinutesToTime(time, minutesToAdd) {
  if (!time) return "08:00";

  const [hours = "0", minutes = "0"] =
    String(time).split(":");

  let total =
    Number(hours) * 60 +
    Number(minutes) +
    Number(minutesToAdd || 0);

  total = Math.max(0, total);

  const hh = String(
    Math.floor(total / 60) % 24
  ).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");

  return `${hh}:${mm}`;
}

function onlyMoney(value) {
  const normalized = String(value ?? "")
    .replace(/,/g, ".")
    .replace(/[^\d.]/g, "");

  const [integer = "", ...rest] = normalized.split(".");
  const decimals = rest.join("").slice(0, 2);

  return normalized.includes(".")
    ? `${integer}.${decimals}`
    : integer;
}

function onlyPercent(value) {
  const normalized = onlyMoney(value);
  if (!normalized) return "";

  return String(
    Math.min(
      100,
      Math.max(0, Number(normalized) || 0)
    )
  );
}

function onlyDigits(value) {
  return String(value ?? "").replace(/[^\d]/g, "");
}

function toNumber(value, fallback = 0) {
  if (value === "" || value == null) return fallback;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizePhoneMX(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "";
  if (digits.startsWith("52") && digits.length >= 12) {
    return digits;
  }
  if (digits.length === 10) return `52${digits}`;

  return digits;
}

function normalizeGender(value) {
  const gender = String(value || "")
    .trim()
    .toLowerCase();

  if (
    ["m", "masculino", "hombre", "male"].includes(
      gender
    )
  ) {
    return "masculino";
  }

  if (
    ["f", "femenino", "mujer", "female"].includes(
      gender
    )
  ) {
    return "femenino";
  }

  if (
    [
      "otro",
      "otros",
      "no binario",
      "no_binario",
      "other",
    ].includes(gender)
  ) {
    return "otro";
  }

  return "";
}

function getPatientLabel(patient) {
  if (!patient) return "";

  const fullName = `${patient.nombres || ""} ${patient.apellido_pat || ""
    } ${patient.apellido_mat || ""}`.trim();

  return fullName || `Paciente #${patient.id}`;
}

function getProfessionalLabel(professional) {
  if (!professional) return "";

  const fullName = `${professional.first_name || ""
    } ${professional.last_name || ""}`.trim();

  return (
    fullName ||
    professional.full_name ||
    professional.username ||
    `Profesional #${professional.id}`
  );
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function buildRepeatDates({
  startDateIso,
  repeatDays,
  repeatSessions,
}) {
  const sessions = Math.max(
    0,
    Number(repeatSessions || 0)
  );

  if (!sessions) return [];

  const acceptedDays = new Set(
    (repeatDays || [])
      .map((key) => DAYKEY_TO_JS[key])
      .filter((value) => typeof value === "number")
  );

  if (!acceptedDays.size) return [];

  const start = isoToDate(startDateIso);
  const result = [];

  for (
    let offset = 1;
    offset <= 366 * 3 && result.length < sessions;
    offset++
  ) {
    const day = new Date(start);
    day.setDate(start.getDate() + offset);

    if (!acceptedDays.has(day.getDay())) continue;

    result.push(dateToIso(day));
  }

  return result;
}

function MessageModal({
  open,
  title,
  message,
  onClose,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Cerrar"
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
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

        <div className="flex justify-end border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

function buildInitialForm({
  appointment,
  preset,
  today,
}) {
  const initialTime =
    appointment?.time ?? preset?.time ?? "08:00";

  const price = appointment?.price
    ? String(Number(appointment.price))
    : "";

  return {
    id: appointment?.id ?? null,

    patientId: appointment?.patientId ?? null,
    patient: appointment?.patient ?? "",
    apellido_pat: appointment?.apellido_pat ?? "",
    apellido_mat: appointment?.apellido_mat ?? "",
    fecha_nac: appointment?.fecha_nac ?? "",
    genero: normalizeGender(appointment?.genero),
    correo: appointment?.correo ?? "",
    telefono: appointment?.telefono ?? "",
    molestia: appointment?.molestia ?? "",

    date:
      appointment?.date ?? preset?.date ?? today,
    time: initialTime,
    endTime:
      appointment?.endTime ??
      addMinutesToTime(initialTime, 60),

    serviceId: appointment?.serviceId ?? null,
    professionalId:
      appointment?.professionalId ??
      preset?.professionalId ??
      null,

    status: appointment?.status ?? "reservado",
    notesInternal:
      appointment?.notesInternal ?? "",

    price,
    montoFacturado:
      appointment?.montoFacturado != null
        ? String(Number(appointment.montoFacturado))
        : price,
    discountPct:
      appointment?.discountPct != null
        ? String(Number(appointment.discountPct))
        : "",
    comprobante: appointment?.comprobante ?? "",
    paymentLines: [
      {
        id: null,
        method: "efectivo",
        amount: "",
        date: today,
      },
    ],

    repeatEnabled: false,
    repeatDays: ["L", "M", "X", "J", "V", "S"],
    repeatSessions: "1",
  };
}

export function ReservationModal({
  appointment,
  preset,
  appointments,
  onClose,
  onSave,
  onDelete,
  onRefreshAppointment,
  onRequestCloseModal,
}) {
  const today = getLocalDate();
  const isEditing = Boolean(appointment?.id);

  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [patients, setPatients] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(() =>
    buildInitialForm({
      appointment,
      preset,
      today,
    })
  );

  const [activeSection, setActiveSection] =
    useState("paciente");
  const [patientQuery, setPatientQuery] = useState(
    appointment?.patient || ""
  );
  const [
    patientDropdownOpen,
    setPatientDropdownOpen,
  ] = useState(false);
  const [message, setMessage] = useState({
    open: false,
    title: "",
    message: "",
  });
  const [lastPaymentId, setLastPaymentId] =
    useState(null);

  const patientBoxRef = useRef(null);
  const originalPaymentsRef = useRef([]);

  const canSeeMoney =
    me?.permisos?.puede_ver_montos ??
    me?.puede_ver_dinero ??
    ["admin", "fisioterapeuta", "terapeuta"].includes(me?.rol);
  const canEditMoney =
    me?.permisos?.puede_modificar_montos ??
    me?.puede_modificar_dinero ??
    me?.rol === "admin";
  const canSeePatientContact =
    me?.permisos?.puede_ver_contacto_paciente ??
    me?.puede_ver_contacto_paciente ??
    me?.rol !== "practicante";

  useEffect(() => {
    setForm(
      buildInitialForm({
        appointment,
        preset,
        today,
      })
    );
    setPatientQuery(appointment?.patient || "");
    setPatientDropdownOpen(false);
    setActiveSection("paciente");
    setLastPaymentId(null);
    originalPaymentsRef.current = [];
  }, [
    appointment?.id,
    preset?.date,
    preset?.time,
    preset?.professionalId,
  ]);

  useEffect(() => {
    const onDocumentClick = (event) => {
      if (
        patientBoxRef.current &&
        !patientBoxRef.current.contains(event.target)
      ) {
        setPatientDropdownOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      onDocumentClick
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        onDocumentClick
      );
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("auth.access");

    const loadData = async () => {
      setLoading(true);

      try {
        const headers = {
          Authorization: `Bearer ${token || ""}`,
        };

        const [
          meResponse,
          servicesResponse,
          professionalsResponse,
          patientsResponse,
        ] = await Promise.all([
          fetch(`${API_BASE}/api/me/`, { headers }),
          fetch(`${API_BASE}/api/servicios/`),
          fetch(`${API_BASE}/api/profesionales/`, {
            headers,
          }),
          fetch(`${API_BASE}/api/pacientes/`, {
            headers,
          }),
        ]);

        const [
          meData,
          servicesData,
          professionalsData,
          patientsData,
        ] = await Promise.all([
          meResponse.json().catch(() => null),
          servicesResponse.json().catch(() => []),
          professionalsResponse
            .json()
            .catch(() => []),
          patientsResponse.json().catch(() => []),
        ]);

        if (!meResponse.ok) {
          throw new Error(
            meData?.detail ||
            "No se pudo identificar al usuario."
          );
        }

        if (
          !servicesResponse.ok ||
          !professionalsResponse.ok ||
          !patientsResponse.ok
        ) {
          throw new Error(
            "No se pudieron cargar los catálogos de la cita."
          );
        }

        const serviceList = normalizeList(servicesData);
        const professionalList =
          normalizeList(professionalsData);
        const patientList = normalizeList(patientsData);

        setMe(meData);
        setServices(serviceList);
        setProfessionals(professionalList);
        setPatients(patientList);

        setForm((current) => {
          const serviceId =
            current.serviceId ??
            serviceList[0]?.id ??
            null;

          const service =
            serviceList.find(
              (item) =>
                Number(item.id) === Number(serviceId)
            ) ||
            serviceList[0] ||
            null;

          const isProfessionalRole = [
            "fisioterapeuta",
            "terapeuta",
            "practicante",
            "nutriologo",
            "dentista",
          ].includes(meData?.rol);

          const professionalId =
            isProfessionalRole
              ? meData.id
              : current.professionalId ??
              professionalList[0]?.id ??
              null;

          const duration = service
            ? durationToMinutes(
              service.duracion ||
              service.duracion_str ||
              service.duracion_text
            )
            : 60;

          const servicePrice = Number(
            service?.precio || 0
          );

          return {
            ...current,
            serviceId: service?.id ?? serviceId,
            professionalId,
            endTime: addMinutesToTime(
              current.time || "08:00",
              duration
            ),
            price:
              current.price === ""
                ? String(servicePrice)
                : current.price,
            montoFacturado:
              current.montoFacturado === ""
                ? String(servicePrice)
                : current.montoFacturado,
          };
        });
      } catch (error) {
        setMessage({
          open: true,
          title: "No se pudo cargar la cita",
          message:
            error?.message ||
            "Ocurrió un problema al cargar la información.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!isEditing || !me) return;

    const allowed =
      me?.permisos?.puede_ver_montos ??
      me?.puede_ver_dinero ??
      ["admin", "fisioterapeuta", "terapeuta"].includes(me?.rol);

    if (!allowed) {
      originalPaymentsRef.current = [];
      return;
    }

    const token = localStorage.getItem("auth.access");

    const loadPayments = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/pagos/?cita=${appointment.id}`,
          {
            headers: {
              Authorization: `Bearer ${token || ""}`,
            },
          }
        );

        const data = await response.json().catch(() => []);
        if (!response.ok) {
          throw new Error(
            data?.detail ||
            "No se pudieron cargar los pagos."
          );
        }

        const list = normalizeList(data)
          .filter(
            (payment) =>
              Number(payment.cita) ===
              Number(appointment.id)
          )
          .sort(
            (a, b) => Number(a.id) - Number(b.id)
          )
          .map((payment) => ({
            id: payment.id,
            method:
              payment.metodo_pago || "efectivo",
            amount: String(
              Number(payment.anticipo || 0)
            ),
            date: payment.fecha_pago || getLocalDate(),
          }));

        originalPaymentsRef.current = list.map(
          (payment) => ({
            ...payment,
            amount: Number(payment.amount || 0),
            date: payment.date || getLocalDate(),
          })
        );

        setForm((current) => ({
          ...current,
          paymentLines: list.length
            ? list
            : [
              {
                id: null,
                method: "efectivo",
                amount: "",
                date: getLocalDate(),
              },
            ],
          montoFacturado:
            list[0]?.monto_facturado ??
            current.montoFacturado,
        }));
      } catch (error) {
        setMessage({
          open: true,
          title: "Pagos",
          message:
            error?.message ||
            "No se pudieron cargar los pagos registrados.",
        });
      }
    };

    loadPayments();
  }, [appointment?.id, isEditing, me]);

  const selectedService = useMemo(
    () =>
      services.find(
        (service) =>
          Number(service.id) ===
          Number(form.serviceId)
      ),
    [services, form.serviceId]
  );

  const selectedProfessional = useMemo(
    () =>
      professionals.find(
        (professional) =>
          Number(professional.id) ===
          Number(form.professionalId)
      ),
    [professionals, form.professionalId]
  );

  const patientMatches = useMemo(() => {
    const query = patientQuery
      .trim()
      .toLowerCase();

    if (!query) return [];

    return patients
      .filter((patient) =>
        getPatientLabel(patient)
          .toLowerCase()
          .includes(query)
      )
      .slice(0, 8);
  }, [patients, patientQuery]);

  const isNewPatient =
    !form.patientId &&
    String(form.patient || "").trim().length > 0;

  const subtotal = toNumber(
    form.montoFacturado,
    toNumber(form.price, 0)
  );
  const discountPct = toNumber(
    form.discountPct,
    0
  );
  const discountAmount =
    (subtotal * discountPct) / 100;
  const totalAfterDiscount = Math.max(
    0,
    subtotal - discountAmount
  );
  const paymentsTotal = useMemo(
    () =>
      (form.paymentLines || []).reduce(
        (sum, line) =>
          sum + toNumber(line.amount, 0),
        0
      ),
    [form.paymentLines]
  );
  const remaining = Math.max(
    0,
    totalAfterDiscount - paymentsTotal
  );

  const sections = useMemo(() => {
    const base = [
      {
        id: "paciente",
        label: "Paciente",
        helper: "Identidad y contacto",
        icon: UsersRound,
      },
      {
        id: "cita",
        label: "Cita",
        helper: "Servicio y horario",
        icon: CalendarDays,
      },
    ];

    if (canSeeMoney) {
      base.push({
        id: "pago",
        label: "Pago y notas",
        helper: "Cobro y seguimiento",
        icon: WalletCards,
      });
    } else {
      base.push({
        id: "notas",
        label: "Notas",
        helper: "Seguimiento clínico",
        icon: NotebookPen,
      });
    }

    return base;
  }, [canSeeMoney]);

  const activeIndex = sections.findIndex(
    (section) => section.id === activeSection
  );

  useEffect(() => {
    if (
      !sections.some(
        (section) => section.id === activeSection
      )
    ) {
      setActiveSection(sections[0]?.id || "paciente");
    }
  }, [sections, activeSection]);

  const handleChange = (field, value) => {
    if (field === "time") {
      const duration = selectedService
        ? durationToMinutes(
          selectedService.duracion ||
          selectedService.duracion_str ||
          selectedService.duracion_text
        )
        : 60;

      setForm((current) => ({
        ...current,
        time: value,
        endTime: addMinutesToTime(
          value,
          duration
        ),
      }));
      return;
    }

    if (
      ["price", "montoFacturado"].includes(
        field
      )
    ) {
      setForm((current) => ({
        ...current,
        [field]: onlyMoney(value),
      }));
      return;
    }

    if (field === "discountPct") {
      setForm((current) => ({
        ...current,
        discountPct: onlyPercent(value),
      }));
      return;
    }

    if (field === "repeatSessions") {
      setForm((current) => ({
        ...current,
        repeatSessions: onlyDigits(value),
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleServiceChange = (serviceId) => {
    const id = Number(serviceId);
    const service = services.find(
      (item) => Number(item.id) === id
    );

    const duration = service
      ? durationToMinutes(
        service.duracion ||
        service.duracion_str ||
        service.duracion_text
      )
      : 60;

    const price = Number(service?.precio || 0);

    setForm((current) => ({
      ...current,
      serviceId: id,
      endTime: addMinutesToTime(
        current.time,
        duration
      ),
      price: String(price),
      montoFacturado: String(price),
    }));
  };

  const selectPatient = (patient) => {
    const label = getPatientLabel(patient);

    setForm((current) => ({
      ...current,
      patientId: patient.id,
      patient: label,
      apellido_pat: patient.apellido_pat || "",
      apellido_mat: patient.apellido_mat || "",
      fecha_nac: patient.fecha_nac || "",
      genero: normalizeGender(patient.genero),
      correo: patient.correo || "",
      telefono: patient.telefono || "",
      molestia: patient.molestia || "",
    }));

    setPatientQuery(label);
    setPatientDropdownOpen(false);
  };

  const toggleRepeatDay = (key) => {
    setForm((current) => {
      const days = new Set(
        current.repeatDays || []
      );

      if (days.has(key)) days.delete(key);
      else days.add(key);

      return {
        ...current,
        repeatDays: Array.from(days),
      };
    });
  };

  const setPaymentLine = (index, patch) => {
    setForm((current) => {
      const lines = [
        ...(current.paymentLines || []),
      ];

      lines[index] = {
        ...lines[index],
        ...patch,
      };

      if ("amount" in patch) {
        lines[index].amount = onlyMoney(
          patch.amount
        );
      }

      return {
        ...current,
        paymentLines: lines,
      };
    });
  };

  const addPaymentLine = () => {
    setForm((current) => ({
      ...current,
      paymentLines: [
        ...(current.paymentLines || []),
        {
          id: null,
          method: "efectivo",
          amount: "",
          date: getLocalDate(),
        },
      ],
    }));
  };

  const removePaymentLine = (index) => {
    setForm((current) => {
      const lines = [
        ...(current.paymentLines || []),
      ];

      if (lines[index]?.id) return current;

      lines.splice(index, 1);

      return {
        ...current,
        paymentLines: lines.length
          ? lines
          : [
            {
              id: null,
              method: "efectivo",
              amount: "",
              date: getLocalDate(),
            },
          ],
      };
    });
  };

  const syncPayments = async (citaId) => {
    if (!canEditMoney) {
      return {
        changed: false,
        lastId: null,
      };
    }

    const token =
      localStorage.getItem("auth.access") || "";
    const currentLines = (
      form.paymentLines || []
    ).map((line) => ({
      id: line.id ?? null,
      method: line.method || "efectivo",
      amount: toNumber(line.amount, 0),
      date: line.date || getLocalDate(),
    }));

    if (paymentsTotal > totalAfterDiscount) {
      throw new Error(
        `La suma de pagos excede el total. Máximo permitido: ${formatMoney(
          totalAfterDiscount
        )}.`
      );
    }

    const originalById = new Map(
      (originalPaymentsRef.current || [])
        .filter((line) => line.id)
        .map((line) => [
          Number(line.id),
          line,
        ])
    );

    let changed = false;
    let lastId = null;

    for (const line of currentLines) {
      if (line.id) {
        if (line.amount <= 0) {
          throw new Error(
            "Un pago ya registrado no puede quedar en cero."
          );
        }

        const previous = originalById.get(
          Number(line.id)
        );
        const changedLine =
          !previous ||
          previous.method !== line.method ||
          Number(previous.amount) !==
          Number(line.amount) ||
          String(previous.date || "") !== String(line.date || "");

        if (!changedLine) {
          lastId = line.id;
          continue;
        }

        const response = await fetch(
          `${API_BASE}/api/pagos/${line.id}/`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              fecha_pago: line.date || getLocalDate(),
              comprobante:
                form.comprobante || "",
              monto_facturado: subtotal,
              metodo_pago: line.method,
              descuento_porcentaje:
                discountPct,
              anticipo: line.amount,
            }),
          }
        );

        const data = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.anticipo ||
            data?.detail ||
            "No se pudo actualizar un pago."
          );
        }

        lastId = data?.id || line.id;
        changed = true;
        continue;
      }

      if (line.amount <= 0) continue;

      const response = await fetch(
        `${API_BASE}/api/pagos/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            cita: citaId,
            fecha_pago: line.date || getLocalDate(),
            comprobante:
              form.comprobante || "",
            monto_facturado: subtotal,
            metodo_pago: line.method,
            descuento_porcentaje:
              discountPct,
            anticipo: line.amount,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.anticipo ||
          data?.detail ||
          "No se pudo registrar el pago."
        );
      }

      lastId = data?.id || null;
      changed = true;
    }

    const currentIds = new Set(
      currentLines
        .filter((line) => line.id)
        .map((line) => Number(line.id))
    );

    const removed = (
      originalPaymentsRef.current || []
    ).filter(
      (line) =>
        line.id &&
        !currentIds.has(Number(line.id))
    );

    for (const line of removed) {
      const response = await fetch(
        `${API_BASE}/api/pagos/${line.id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "No se pudo eliminar un pago retirado del formulario."
        );
      }

      changed = true;
    }

    setLastPaymentId(lastId);

    return {
      changed,
      lastId,
    };
  };

  const downloadTicket = async (paymentId) => {
    if (!paymentId || !canSeeMoney) return;

    const token =
      localStorage.getItem("auth.access") || "";

    try {
      const response = await fetch(
        `${API_BASE}/api/pagos/${paymentId}/ticket/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "No se pudo generar el ticket."
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = `ticket_pago_${paymentId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setMessage({
        open: true,
        title: "Ticket",
        message:
          error?.message ||
          "No se pudo generar el ticket.",
      });
    }
  };

  const openWhatsApp = () => {
    if (!canSeePatientContact) return;
    const phone = normalizePhoneMX(form.telefono);

    if (!phone) {
      setMessage({
        open: true,
        title: "WhatsApp",
        message:
          "El paciente no tiene un teléfono válido.",
      });
      return;
    }

    const serviceName =
      selectedService?.nombre || "tu servicio";

    const dateLong = isoToDate(form.date)
      .toLocaleDateString("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
      .replace(/^\w/, (char) =>
        char.toUpperCase()
      );

    const text = encodeURIComponent(
      `Hola ${form.patient || ""
      }. Te confirmo tu cita de ${serviceName} el ${dateLong} a las ${form.time
      }.`
    );

    window.open(
      `https://wa.me/${phone}?text=${text}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const buildPayload = (
    date = form.date,
    repeated = false
  ) => ({
    id: repeated ? null : form.id,
    patientId: form.patientId,
    patient: form.patient,
    apellido_pat: form.apellido_pat,
    apellido_mat: form.apellido_mat,
    fecha_nac: form.fecha_nac || null,
    genero: form.genero,
    correo: canSeePatientContact ? form.correo : "",
    telefono: canSeePatientContact ? form.telefono : "",
    molestia: form.molestia,
    date,
    time: form.time,
    endTime: form.endTime,
    serviceId: form.serviceId,
    professionalId: form.professionalId,
    status: form.status,
    notesInternal: form.notesInternal,
    price: canEditMoney
      ? toNumber(form.price, 0)
      : Number(appointment?.price || form.price || 0),
    montoFacturado: canEditMoney
      ? subtotal
      : Number(appointment?.montoFacturado || appointment?.price || form.montoFacturado || 0),
    discountPct: canEditMoney
      ? discountPct
      : Number(appointment?.discountPct || form.discountPct || 0),
    paymentLines: repeated
      ? []
      : form.paymentLines,
    repeatEnabled: false,
    repeatDays: [],
    repeatSessions: 1,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !form.patientId &&
      !String(form.patient || "").trim()
    ) {
      setActiveSection("paciente");
      setMessage({
        open: true,
        title: "Falta el paciente",
        message:
          "Escribe el nombre del paciente o selecciona uno existente.",
      });
      return;
    }

    if (
      !form.serviceId ||
      !form.professionalId ||
      !form.date ||
      !form.time
    ) {
      setActiveSection("cita");
      setMessage({
        open: true,
        title: "Datos incompletos",
        message:
          "Selecciona servicio, profesional, fecha y hora.",
      });
      return;
    }

    if (
      form.repeatEnabled &&
      !(form.repeatDays || []).length
    ) {
      setActiveSection("cita");
      setMessage({
        open: true,
        title: "Repetición incompleta",
        message:
          "Selecciona al menos un día para repetir la cita.",
      });
      return;
    }

    try {
      setSaving(true);

      const savedBase = await onSave?.(
        buildPayload()
      );

      const citaId =
        savedBase?.id ||
        savedBase?.cita_id ||
        savedBase?.pk;

      if (!citaId) {
        throw new Error(
          "La cita se guardó, pero el servidor no devolvió su ID."
        );
      }

      let paymentResult = {
        changed: false,
        lastId: null,
      };

      if (canSeeMoney) {
        paymentResult = await syncPayments(citaId);
      }

      const refreshed =
        await onRefreshAppointment?.(citaId);

      if (
        canSeeMoney &&
        paymentResult.changed &&
        paymentResult.lastId &&
        (refreshed?.pagado || refreshed?.paid)
      ) {
        await downloadTicket(
          paymentResult.lastId
        );
      }

      if (form.repeatEnabled) {
        const totalSessions = Math.max(
          1,
          Number(form.repeatSessions || 1)
        );
        const dates = buildRepeatDates({
          startDateIso: form.date,
          repeatDays: form.repeatDays,
          repeatSessions: Math.max(
            0,
            totalSessions - 1
          ),
        });

        const patientId =
          savedBase?.paciente ??
          savedBase?.patientId ??
          form.patientId;

        for (const date of dates) {
          await onSave?.({
            ...buildPayload(date, true),
            patientId,
          });
        }
      }

      onRequestCloseModal?.();
    } catch (error) {
      setMessage({
        open: true,
        title: "No se pudo guardar",
        message:
          error?.message ||
          "Ocurrió un problema al guardar la cita.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!form.id || saving) return;

    try {
      setSaving(true);
      await onDelete?.(form.id);
      onRequestCloseModal?.();
    } catch {
      setMessage({
        open: true,
        title: "Eliminar cita",
        message:
          "No se pudo eliminar la cita.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-2xl">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          Cargando información de la cita...
        </div>
      </div>
    );
  }

  const previousSection = () => {
    if (activeIndex > 0) {
      setActiveSection(
        sections[activeIndex - 1].id
      );
    }
  };

  const nextSection = () => {
    if (activeIndex < sections.length - 1) {
      setActiveSection(
        sections[activeIndex + 1].id
      );
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-0 backdrop-blur-[3px] sm:p-4 lg:p-6">
        <button
          type="button"
          className="absolute inset-0"
          onClick={onClose}
          aria-label="Cerrar modal"
        />

        <div className="relative z-10 flex h-[100dvh] w-full flex-col overflow-hidden bg-[#f5f7fb] shadow-2xl sm:h-auto sm:max-h-[94vh] sm:w-[min(96vw,1120px)] sm:rounded-[26px] sm:border sm:border-white/80">
          <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0a2f68] text-white shadow-lg shadow-blue-950/20">
                  <CalendarDays className="h-5 w-5" />
                </span>

                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
                    {isEditing
                      ? "Edición de reservación"
                      : "Nueva reservación"}
                  </p>
                  <h2 className="truncate text-lg font-bold text-slate-950 sm:text-xl">
                    {isEditing
                      ? form.patient ||
                      "Editar cita"
                      : "Agendar nueva cita"}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {form.date}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {form.time} – {form.endTime}
                    </span>
                    <span className="hidden items-center gap-1 sm:inline-flex">
                      <Stethoscope className="h-3.5 w-3.5" />
                      {selectedService?.nombre ||
                        "Servicio"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {sections.map((section, index) => {
                const Icon = section.icon;
                const active =
                  activeSection === section.id;
                const completed =
                  index < activeIndex;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() =>
                      setActiveSection(section.id)
                    }
                    className={`flex min-w-[150px] flex-1 items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition sm:min-w-0 ${active
                      ? "border-blue-200 bg-blue-50 text-blue-800 shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${active
                        ? "bg-blue-600 text-white"
                        : completed
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                        }`}
                    >
                      {completed ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </span>

                    <span className="min-w-0">
                      <span className="block text-xs font-bold">
                        {section.label}
                      </span>
                      <span className="block truncate text-[10px] opacity-70">
                        {section.helper}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </header>

          <form
            onSubmit={handleSubmit}
            autoComplete="off"
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-5xl">
                {activeSection === "paciente" && (
                  <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
                    <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <div>
                        <h3 className="text-base font-bold text-slate-950">
                          Información del paciente
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Busca un paciente existente o
                          registra uno nuevo.
                        </p>
                      </div>

                      <span
                        className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold ${form.patientId
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-blue-200 bg-blue-50 text-blue-700"
                          }`}
                      >
                        {form.patientId ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <UserPlus className="h-3.5 w-3.5" />
                        )}
                        {form.patientId
                          ? "Paciente existente"
                          : "Nuevo paciente"}
                      </span>
                    </div>

                    <div className="space-y-5 p-4 sm:p-6">
                      <div ref={patientBoxRef}>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                          Nombre o paciente existente
                        </label>

                        <div className="relative">
                          <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                          <input
                            value={patientQuery}
                            onChange={(event) => {
                              const value =
                                event.target.value;
                              setPatientQuery(value);
                              setPatientDropdownOpen(
                                true
                              );
                              setForm((current) => ({
                                ...current,
                                patientId: null,
                                patient: value,
                              }));
                            }}
                            onFocus={() =>
                              setPatientDropdownOpen(
                                true
                              )
                            }
                            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                            placeholder="Escribe el nombre..."
                          />

                          {patientDropdownOpen &&
                            patientQuery.trim() && (
                              <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                                {patientMatches.length ? (
                                  <div className="max-h-64 overflow-auto p-1.5">
                                    {patientMatches.map(
                                      (patient) => (
                                        <button
                                          key={
                                            patient.id
                                          }
                                          type="button"
                                          onMouseDown={(
                                            event
                                          ) => {
                                            event.preventDefault();
                                            selectPatient(
                                              patient
                                            );
                                          }}
                                          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-slate-50"
                                        >
                                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-700">
                                            {getPatientLabel(
                                              patient
                                            )
                                              .slice(
                                                0,
                                                1
                                              )
                                              .toUpperCase()}
                                          </span>
                                          <span className="min-w-0">
                                            <span className="block truncate text-sm font-semibold text-slate-800">
                                              {getPatientLabel(
                                                patient
                                              )}
                                            </span>
                                            <span className="block truncate text-[11px] text-slate-500">
                                              {patient.telefono ||
                                                "Sin teléfono"}{" "}
                                              ·{" "}
                                              {patient.correo ||
                                                "Sin correo"}
                                            </span>
                                          </span>
                                        </button>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <div className="px-4 py-4 text-sm text-slate-600">
                                    Sin coincidencias.
                                    Se registrará como
                                    paciente nuevo.
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                      </div>

                      {isNewPatient && (
                        <div className="grid gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 sm:grid-cols-2 lg:grid-cols-3">
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                              Apellido paterno
                            </label>
                            <input
                              value={
                                form.apellido_pat
                              }
                              onChange={(event) =>
                                handleChange(
                                  "apellido_pat",
                                  event.target.value
                                )
                              }
                              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                            />
                          </div>

                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                              Apellido materno
                            </label>
                            <input
                              value={
                                form.apellido_mat
                              }
                              onChange={(event) =>
                                handleChange(
                                  "apellido_mat",
                                  event.target.value
                                )
                              }
                              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                            />
                          </div>

                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                              Fecha de nacimiento
                            </label>
                            <input
                              type="date"
                              max={today}
                              value={form.fecha_nac}
                              onChange={(event) =>
                                handleChange(
                                  "fecha_nac",
                                  event.target.value
                                )
                              }
                              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                            Teléfono
                          </label>
                          <div className="flex gap-2">
                            <div className="relative min-w-0 flex-1">
                              <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                              <input
                                type="tel"
                                disabled={!canSeePatientContact || Boolean(
                                  form.patientId
                                )}
                                value={canSeePatientContact ? form.telefono : ""}
                                onChange={(
                                  event
                                ) =>
                                  handleChange(
                                    "telefono",
                                    event.target
                                      .value
                                  )
                                }
                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
                              />
                            </div>

                            {canSeePatientContact && (
                              <button
                                type="button"
                                onClick={openWhatsApp}
                                className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              >
                                <MessageCircle className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                            Correo
                          </label>
                          <div className="relative">
                            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="email"
                              disabled={!canSeePatientContact || Boolean(
                                form.patientId
                              )}
                              value={canSeePatientContact ? form.correo : ""}
                              onChange={(event) =>
                                handleChange(
                                  "correo",
                                  event.target.value
                                )
                              }
                              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                            Género
                          </label>
                          <select
                            disabled={Boolean(
                              form.patientId
                            )}
                            value={form.genero}
                            onChange={(event) =>
                              handleChange(
                                "genero",
                                event.target.value
                              )
                            }
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none disabled:bg-slate-100 disabled:text-slate-500"
                          >
                            <option value="">
                              Selecciona
                            </option>
                            <option value="masculino">
                              Masculino
                            </option>
                            <option value="femenino">
                              Femenino
                            </option>
                            <option value="otro">
                              Otro
                            </option>
                          </select>
                        </div>
                      </div>

                      {isNewPatient && (
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                            Motivo de consulta
                          </label>
                          <textarea
                            value={
                              form.molestia
                            }
                            onChange={(event) =>
                              handleChange(
                                "molestia",
                                event.target.value
                              )
                            }
                            className="min-h-[90px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                          />
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {activeSection === "cita" && (
                  <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
                    <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
                      <h3 className="text-base font-bold text-slate-950">
                        Detalles de la cita
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Servicio, profesional,
                        horario y estado.
                      </p>
                    </div>

                    <div className="space-y-6 p-4 sm:p-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                            Servicio
                          </label>
                          <select
                            value={
                              form.serviceId ?? ""
                            }
                            onChange={(event) =>
                              handleServiceChange(
                                event.target.value
                              )
                            }
                            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                          >
                            {services.map(
                              (service) => (
                                <option
                                  key={service.id}
                                  value={service.id}
                                >
                                  {service.nombre}
                                </option>
                              )
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                            Profesional
                          </label>
                          <select
                            disabled={[
                              "fisioterapeuta",
                              "terapeuta",
                              "practicante",
                              "nutriologo",
                              "dentista",
                            ].includes(me?.rol)}
                            value={
                              form.professionalId ??
                              ""
                            }
                            onChange={(event) =>
                              handleChange(
                                "professionalId",
                                Number(
                                  event.target
                                    .value
                                )
                              )
                            }
                            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none disabled:bg-slate-100 disabled:text-slate-500"
                          >
                            {professionals.map(
                              (professional) => (
                                <option
                                  key={
                                    professional.id
                                  }
                                  value={
                                    professional.id
                                  }
                                >
                                  {getProfessionalLabel(
                                    professional
                                  )}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                            Fecha
                          </label>
                          <input
                            type="date"
                            value={form.date}
                            onChange={(event) =>
                              handleChange(
                                "date",
                                event.target.value
                              )
                            }
                            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                            Hora de inicio
                          </label>
                          <select
                            value={form.time}
                            onChange={(event) =>
                              handleChange(
                                "time",
                                event.target.value
                              )
                            }
                            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none"
                          >
                            {Array.from(
                              { length: 29 },
                              (_, index) => {
                                const minutes =
                                  7 * 60 +
                                  index * 30;
                                const hh = String(
                                  Math.floor(
                                    minutes / 60
                                  )
                                ).padStart(2, "0");
                                const mm = String(
                                  minutes % 60
                                ).padStart(2, "0");
                                return `${hh}:${mm}`;
                              }
                            ).map((time) => (
                              <option
                                key={time}
                                value={time}
                              >
                                {time}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                            Hora de término
                          </label>
                          <input
                            type="time"
                            readOnly
                            disabled
                            value={form.endTime}
                            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 text-sm text-slate-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                          Estado
                        </label>
                        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                          {[
                            [
                              "reservado",
                              "Reservado",
                              "border-blue-200 bg-blue-50 text-blue-700",
                            ],
                            [
                              "confirmado",
                              "Confirmado",
                              "border-amber-200 bg-amber-50 text-amber-700",
                            ],
                            [
                              "completado",
                              "Sí asistió",
                              "border-emerald-200 bg-emerald-50 text-emerald-700",
                            ],
                            [
                              "cancelado",
                              "No asistió",
                              "border-rose-200 bg-rose-50 text-rose-700",
                            ],
                          ].map(
                            ([
                              value,
                              label,
                              selectedClass,
                            ]) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() =>
                                  handleChange(
                                    "status",
                                    value
                                  )
                                }
                                className={`rounded-xl border px-3 py-3 text-xs font-bold ${form.status ===
                                  value
                                  ? `${selectedClass} ring-2 ring-current/20`
                                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                  }`}
                              >
                                {label}
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
                              <Repeat2 className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="text-sm font-bold text-slate-800">
                                Repetir
                                tratamiento
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Crea sesiones
                                posteriores.
                              </p>
                            </div>
                          </div>

                          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={Boolean(
                                form.repeatEnabled
                              )}
                              onChange={(event) =>
                                handleChange(
                                  "repeatEnabled",
                                  event.target
                                    .checked
                                )
                              }
                            />
                            Activar repetición
                          </label>
                        </div>

                        {form.repeatEnabled && (
                          <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 lg:grid-cols-[minmax(0,1fr)_180px]">
                            <div>
                              <label className="mb-2 block text-xs font-semibold text-slate-700">
                                Días
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {DAYS.map(
                                  (day) => {
                                    const active = (
                                      form.repeatDays ||
                                      []
                                    ).includes(
                                      day.key
                                    );

                                    return (
                                      <button
                                        key={
                                          day.key
                                        }
                                        type="button"
                                        onClick={() =>
                                          toggleRepeatDay(
                                            day.key
                                          )
                                        }
                                        className={`h-10 min-w-12 rounded-xl border px-3 text-xs font-bold ${active
                                          ? "border-blue-600 bg-blue-600 text-white"
                                          : "border-slate-200 bg-white text-slate-600"
                                          }`}
                                      >
                                        {
                                          day.label
                                        }
                                      </button>
                                    );
                                  }
                                )}
                              </div>
                            </div>

                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                Total de
                                sesiones
                              </label>
                              <input
                                inputMode="numeric"
                                value={
                                  form.repeatSessions
                                }
                                onChange={(event) =>
                                  handleChange(
                                    "repeatSessions",
                                    event.target
                                      .value
                                  )
                                }
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                )}

                {activeSection === "pago" &&
                  canSeeMoney && (
                    <section className="space-y-4">
                      <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
                          <div>
                            <h3 className="text-base font-bold text-slate-950">
                              Información de
                              pago
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                              Estos campos solo
                              están disponibles
                              para administrador
                              y fisioterapeuta.
                            </p>
                          </div>

                          {lastPaymentId && (
                            <button
                              type="button"
                              onClick={() =>
                                downloadTicket(
                                  lastPaymentId
                                )
                              }
                              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
                            >
                              <Download className="h-4 w-4" />
                              Ticket
                            </button>
                          )}
                        </div>

                        <div className="space-y-6 p-4 sm:p-6">
                          <div className="grid gap-4 sm:grid-cols-3">
                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                Precio
                              </label>
                              <input
                                inputMode="decimal"
                                disabled={!canEditMoney}
                                value={
                                  form.price
                                }
                                onChange={(event) =>
                                  handleChange(
                                    "price",
                                    event.target
                                      .value
                                  )
                                }
                                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none"
                              />
                            </div>

                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                Monto a facturar
                              </label>
                              <input
                                inputMode="decimal"
                                disabled={!canEditMoney}
                                value={
                                  form.montoFacturado
                                }
                                onChange={(event) =>
                                  handleChange(
                                    "montoFacturado",
                                    event.target
                                      .value
                                  )
                                }
                                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none"
                              />
                            </div>

                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                Descuento %
                              </label>
                              <input
                                inputMode="decimal"
                                disabled={!canEditMoney}
                                value={
                                  form.discountPct
                                }
                                onChange={(event) =>
                                  handleChange(
                                    "discountPct",
                                    event.target
                                      .value
                                  )
                                }
                                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-bold text-slate-900">
                                  Métodos de pago
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  La fecha de pago
                                  registrada será la
                                  fecha real del corte.
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={addPaymentLine}
                                disabled={!canEditMoney}
                                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0a2f68] px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Plus className="h-4 w-4" />
                                Agregar
                              </button>
                            </div>

                            <div className="mt-3 space-y-3">
                              {(
                                form.paymentLines ||
                                []
                              ).map(
                                (
                                  line,
                                  index
                                ) => (
                                  <div
                                    key={
                                      line.id ||
                                      index
                                    }
                                    className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[165px_155px_minmax(0,1fr)_44px]"
                                  >
                                    <select
                                      disabled={!canEditMoney}
                                      value={
                                        line.method
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        setPaymentLine(
                                          index,
                                          {
                                            method:
                                              event
                                                .target
                                                .value,
                                          }
                                        )
                                      }
                                      className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                                    >
                                      {PAYMENT_METHODS.map(
                                        (
                                          method
                                        ) => (
                                          <option
                                            key={
                                              method.id
                                            }
                                            value={
                                              method.id
                                            }
                                          >
                                            {
                                              method.label
                                            }
                                          </option>
                                        )
                                      )}
                                    </select>

                                    <input
                                      type="date"
                                      disabled={!canEditMoney}
                                      value={
                                        line.date || getLocalDate()
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        setPaymentLine(
                                          index,
                                          {
                                            date:
                                              event
                                                .target
                                                .value,
                                          }
                                        )
                                      }
                                      className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                                      title="Fecha real del pago"
                                    />

                                    <input
                                      inputMode="decimal"
                                      disabled={!canEditMoney}
                                      value={
                                        line.amount
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        setPaymentLine(
                                          index,
                                          {
                                            amount:
                                              event
                                                .target
                                                .value,
                                          }
                                        )
                                      }
                                      placeholder="Monto"
                                      className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                                    />

                                    <button
                                      type="button"
                                      disabled={!canEditMoney || Boolean(
                                        line.id
                                      )}
                                      onClick={() =>
                                        removePaymentLine(
                                          index
                                        )
                                      }
                                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                )
                              )}
                            </div>
                          </div>

                          <div className="grid gap-3 rounded-2xl bg-slate-950 p-4 text-white sm:grid-cols-3">
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                Total
                              </p>
                              <p className="mt-1 text-lg font-bold">
                                {formatMoney(
                                  totalAfterDiscount
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                Pagos
                              </p>
                              <p className="mt-1 text-lg font-bold">
                                {formatMoney(
                                  paymentsTotal
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                Restante
                              </p>
                              <p className="mt-1 text-lg font-bold">
                                {formatMoney(
                                  remaining
                                )}
                              </p>
                            </div>
                          </div>

                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                              Notas internas
                            </label>
                            <textarea
                              value={
                                form.notesInternal
                              }
                              onChange={(event) =>
                                handleChange(
                                  "notesInternal",
                                  event.target.value
                                )
                              }
                              className="min-h-[100px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </section>
                  )}

                {activeSection === "notas" &&
                  !canSeeMoney && (
                    <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
                      <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
                        <h3 className="text-base font-bold text-slate-950">
                          Notas y seguimiento
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Tu rol no muestra
                          importes, descuentos ni
                          métodos de pago.
                        </p>
                      </div>

                      <div className="p-4 sm:p-6">
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                          Notas internas
                        </label>
                        <textarea
                          value={
                            form.notesInternal
                          }
                          onChange={(event) =>
                            handleChange(
                              "notesInternal",
                              event.target.value
                            )
                          }
                          className="min-h-[150px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                        />
                      </div>
                    </section>
                  )}
              </div>
            </div>

            <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  {isEditing && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleDelete}
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar cita
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {activeIndex > 0 && (
                    <button
                      type="button"
                      onClick={previousSection}
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </button>
                  )}

                  {activeIndex <
                    sections.length - 1 ? (
                    <button
                      type="button"
                      onClick={nextSection}
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700"
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {saving
                        ? "Guardando..."
                        : "Guardar cita"}
                    </button>
                  )}
                </div>
              </div>
            </footer>
          </form>
        </div>
      </div>

      <MessageModal
        open={message.open}
        title={message.title}
        message={message.message}
        onClose={() =>
          setMessage({
            open: false,
            title: "",
            message: "",
          })
        }
      />
    </>
  );
}


