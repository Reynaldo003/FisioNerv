// src/components/layout/patients/PatientsView.jsx
import { useEffect, useMemo, useState } from "react";
import { Th, Td } from "./TableParts";
import { FilterBlock } from "./FilterBlock";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

function getFullName(p) {
  return `${p.nombres || ""} ${p.apellido_pat || ""} ${p.apellido_mat || ""
    }`.trim();
}

function getProfessionalLabel(p) {
  const full = `${p.first_name || ""} ${p.last_name || ""}`.trim();
  return full || p.username || `Profesional #${p.id}`;
}

export function PatientsView() {
  const [patients, setPatients] = useState([]);
  const [citas, setCitas] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [defaultClinicId, setDefaultClinicId] = useState(1);

  // búsqueda + filtros
  const [search, setSearch] = useState("");
  const [filterBranch, setFilterBranch] = useState("Todos");
  const [filterProfessional, setFilterProfessional] = useState("Todos"); // id o "Todos"
  const [filterService, setFilterService] = useState("Todos"); // nombre servicio o "Todos"
  const [filterStatus, setFilterStatus] = useState("Todos"); // Todos | Con reservas | Sin reservas
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create"); // "create" | "edit"

  const logoutAndRedirect = () => {
    localStorage.removeItem("auth.access");
    localStorage.removeItem("auth.refresh");
    localStorage.removeItem("auth.user");
    window.location.href = "/login";
  };

  // =========================
  // Cargar datos del backend
  // =========================

  useEffect(() => {
    const token = localStorage.getItem("auth.access");
    if (!token) {
      logoutAndRedirect();
      return;
    }

    async function loadAll() {
      try {
        setLoading(true);

        const [patientsResp, citasResp, profsResp] = await Promise.all([
          fetch(`${API_BASE}/api/pacientes/`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE}/api/citas/`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE}/api/profesionales/`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if (
          patientsResp.status === 401 ||
          citasResp.status === 401 ||
          profsResp.status === 401
        ) {
          logoutAndRedirect();
          return;
        }

        const patientsData = await patientsResp.json();
        const citasData = await citasResp.json();
        const profsData = await profsResp.json();

        setPatients(patientsData || []);
        setCitas(citasData || []);
        setProfessionals(profsData || []);

        if (patientsData?.length && patientsData[0].clinica) {
          setDefaultClinicId(patientsData[0].clinica);
        }
      } catch (err) {
        console.error("Error cargando pacientes/citas/profesionales:", err);
        setPatients([]);
        setCitas([]);
        setProfessionals([]);
      } finally {
        setLoading(false);
      }
    }

    loadAll();
  }, []);

  // Para botón "Cargar pacientes" (reload)
  const reloadPatients = async () => {
    const token = localStorage.getItem("auth.access");
    if (!token) {
      logoutAndRedirect();
      return;
    }

    try {
      setLoading(true);
      const resp = await fetch(`${API_BASE}/api/pacientes/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (resp.status === 401) {
        logoutAndRedirect();
        return;
      }

      const data = await resp.json();
      setPatients(data || []);

      if (data?.length && data[0].clinica) {
        setDefaultClinicId(data[0].clinica);
      }
    } catch (e) {
      console.error("Error recargando pacientes:", e);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Enriquecer pacientes con info de citas
  // =========================

  const enhancedPatients = useMemo(() => {
    const citasPorPaciente = new Map();

    citas.forEach((c) => {
      if (!c.paciente) return;
      if (!citasPorPaciente.has(c.paciente)) {
        citasPorPaciente.set(c.paciente, []);
      }
      citasPorPaciente.get(c.paciente).push(c);
    });

    return patients.map((p) => {
      const cp = citasPorPaciente.get(p.id) || [];

      let lastCita = null;
      const servicesSet = new Set();
      const professionalsSet = new Set();

      cp.forEach((c) => {
        servicesSet.add(c.servicio_nombre || "");
        if (c.profesional) professionalsSet.add(c.profesional);

        const key = `${c.fecha || ""}T${c.hora_inicio || ""}`;
        if (!lastCita) {
          lastCita = { ...c, _key: key };
        } else if (key > lastCita._key) {
          lastCita = { ...c, _key: key };
        }
      });

      const hasReservations = cp.length > 0;
      const lastServiceName = lastCita?.servicio_nombre || "";

      return {
        ...p,
        fullName: getFullName(p),
        lastServiceName,
        servicesSet,
        professionalsSet,
        hasReservations,
        // por ahora solo una sede
        branchLabel: "Fisionerv Centro",
      };
    });
  }, [patients, citas]);

  // Lista de servicios disponibles para filtro
  const servicesForFilter = useMemo(() => {
    const set = new Set();
    enhancedPatients.forEach((p) => {
      p.servicesSet?.forEach((s) => s && set.add(s));
    });
    return Array.from(set).sort();
  }, [enhancedPatients]);

  // =========================
  // Handlers
  // =========================

  const handleOpenCreate = () => {
    setFormMode("create");
    setSelectedPatient(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (patient) => {
    setFormMode("edit");
    setSelectedPatient(patient);
    setFormOpen(true);
  };

  const handleOpenProfile = (patient) => {
    setSelectedPatient(patient);
    setProfileOpen(true);
  };

  const handleDeletePatient = async (patient) => {
    const ok = window.confirm(
      `¿Seguro que deseas eliminar al paciente ${getFullName(patient)}?`,
    );
    if (!ok) return;

    const token = localStorage.getItem("auth.access");
    if (!token) {
      logoutAndRedirect();
      return;
    }

    try {
      const resp = await fetch(`${API_BASE}/api/pacientes/${patient.id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (resp.status === 401) {
        logoutAndRedirect();
        return;
      }

      if (!resp.ok && resp.status !== 204) {
        const data = await resp.json().catch(() => null);
        console.error("Error al eliminar paciente:", data || resp.status);
        alert("No se pudo eliminar el paciente. Revisa la consola.");
        return;
      }

      setPatients((prev) => prev.filter((p) => p.id !== patient.id));
      setProfileOpen(false);
      setSelectedPatient(null);
    } catch (e) {
      console.error("Error al eliminar paciente:", e);
      alert("Ocurrió un error al eliminar al paciente.");
    }
  };

  const handleSavePatient = async (formData) => {
    const token = localStorage.getItem("auth.access");
    if (!token) {
      logoutAndRedirect();
      return;
    }

    const isEdit = formMode === "edit" && selectedPatient;

    const url = isEdit
      ? `${API_BASE}/api/pacientes/${selectedPatient.id}/`
      : `${API_BASE}/api/pacientes/`;
    const method = isEdit ? "PATCH" : "POST";

    const payload = {
      // si es nuevo, usamos la clínica por defecto
      clinica: isEdit
        ? selectedPatient.clinica || defaultClinicId
        : defaultClinicId,
      nombres: formData.nombres,
      apellido_pat: formData.apellido_pat,
      apellido_mat: formData.apellido_mat || "",
      fecha_nac: formData.fecha_nac,
      genero: formData.genero || "",
      telefono: formData.telefono,
      correo: formData.correo || "",
      molestia: formData.molestia || "",
      notas: formData.notas || "",
    };

    // para PATCH no es necesario mandar clinica si no cambió
    if (isEdit) {
      delete payload.clinica;
    }

    try {
      const resp = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (resp.status === 401) {
        logoutAndRedirect();
        return;
      }

      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        console.error("Error al guardar paciente:", data || resp.status);
        alert("No se pudo guardar el paciente. Revisa la consola.");
        return;
      }

      const saved = await resp.json();

      if (isEdit) {
        setPatients((prev) =>
          prev.map((p) => (p.id === saved.id ? saved : p)),
        );
      } else {
        setPatients((prev) => [...prev, saved]);
      }

      setFormOpen(false);
      setSelectedPatient(null);
    } catch (e) {
      console.error("Error al guardar paciente:", e);
      alert("Ocurrió un error al guardar el paciente.");
    }
  };

  // =========================
  // Aplicar búsqueda + filtros
  // =========================

  const filteredPatients = useMemo(() => {
    const term = search.toLowerCase();
    const profId =
      filterProfessional === "Todos" ? null : Number(filterProfessional);
    const serviceName = filterService === "Todos" ? null : filterService;
    const status = filterStatus;

    return enhancedPatients
      .filter((p) => {
        // búsqueda
        if (term) {
          const hayCoincidencia =
            p.fullName.toLowerCase().includes(term) ||
            (p.correo || "").toLowerCase().includes(term) ||
            (p.telefono || "").toLowerCase().includes(term);
          if (!hayCoincidencia) return false;
        }

        // sede (por ahora solo Fisionerv Centro)
        if (filterBranch !== "Todos" && p.branchLabel !== filterBranch) {
          return false;
        }

        // profesional
        if (profId && !p.professionalsSet.has(profId)) {
          return false;
        }

        // servicio
        if (serviceName && !p.servicesSet.has(serviceName)) {
          return false;
        }

        // estado de reserva
        if (status === "Con reservas" && !p.hasReservations) return false;
        if (status === "Sin reservas" && p.hasReservations) return false;

        // rango de fechas por campo registro
        if (filterStartDate && (!p.registro || p.registro < filterStartDate)) {
          return false;
        }
        if (filterEndDate && (!p.registro || p.registro > filterEndDate)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [
    enhancedPatients,
    search,
    filterBranch,
    filterProfessional,
    filterService,
    filterStatus,
    filterStartDate,
    filterEndDate,
  ]);

  // =========================
  // Render
  // =========================

  if (loading) {
    return (
      <>
        <aside className="w-72 bg-white border-r border-slate-200 p-4 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">
            Filtros avanzados
          </h2>
        </aside>
        <main className="flex-1 flex items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-500">
            Cargando pacientes desde el servidor…
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      {/* Sidebar filtros */}
      <aside className="w-72 bg-white border-r border-slate-200 p-4 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">
          Filtros avanzados
        </h2>

        <FilterBlock title="Local/sede">
          <select
            className="w-full text-xs rounded-md border border-slate-200 px-2 py-1.5 bg-slate-50"
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
          >
            <option value="Todos">Todos</option>
            <option value="Fisionerv Centro">Fisionerv Centro</option>
          </select>
        </FilterBlock>

        <FilterBlock title="Profesional">
          <select
            className="w-full text-xs rounded-md border border-slate-200 px-2 py-1.5 bg-slate-50"
            value={filterProfessional}
            onChange={(e) => setFilterProfessional(e.target.value)}
          >
            <option value="Todos">Todos</option>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {getProfessionalLabel(p)}
              </option>
            ))}
          </select>
        </FilterBlock>

        <FilterBlock title="Servicio">
          <select
            className="w-full text-xs rounded-md border border-slate-200 px-2 py-1.5 bg-slate-50"
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
          >
            <option value="Todos">Todos</option>
            {servicesForFilter.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </FilterBlock>

        <FilterBlock title="Estado de la reserva">
          <select
            className="w-full text-xs rounded-md border border-slate-200 px-2 py-1.5 bg-slate-50"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="Todos">Todos</option>
            <option value="Con reservas">Con reservas</option>
            <option value="Sin reservas">Sin reservas</option>
          </select>
        </FilterBlock>

        <FilterBlock title="Pacientes creados en el periodo">
          <input
            type="date"
            className="w-full text-xs rounded-md border border-slate-200 px-2 py-1.5 mb-1"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
          />
          <input
            type="date"
            className="w-full text-xs rounded-md border border-slate-200 px-2 py-1.5"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
          />
        </FilterBlock>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="h-16 border-b border-slate-200 bg-slate-50 flex items-center justify-between px-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              Base de pacientes
            </h2>
            <p className="text-xs text-slate-500">
              {patients.length} pacientes registrados.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="text-xs px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50"
              onClick={reloadPatients}
            >
              Cargar pacientes
            </button>
            <button
              className="text-xs px-3 py-1.5 rounded-md bg-violet-600 text-white hover:bg-violet-700"
              onClick={handleOpenCreate}
            >
              + Nuevo paciente
            </button>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-3 overflow-hidden">
          <div className="flex justify-between items-center gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Busca por nombre, apellido, email o teléfono"
                className="w-full text-sm rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="text-xs px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50">
              Acciones ▾
            </button>
          </div>

          <div className="flex-1 overflow-auto bg-white rounded-lg border border-slate-200">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <Th>Nombre</Th>
                  <Th>Apellido</Th>
                  <Th>Correo</Th>
                  <Th>Teléfono</Th>
                  <Th>Servicio</Th>
                  <Th className="text-center">Opciones</Th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-slate-50 hover:bg-slate-50"
                  >
                    <Td>{p.nombres}</Td>
                    <Td>
                      {(p.apellido_pat || "") + " " + (p.apellido_mat || "")}
                    </Td>
                    <Td>{p.correo || "—"}</Td>
                    <Td>{p.telefono || "—"}</Td>
                    <Td>{p.lastServiceName || "—"}</Td>
                    <Td className="text-center">
                      <div className="inline-flex gap-1">
                        <button
                          className="h-7 px-2 rounded-md border border-slate-300 text-[11px] hover:bg-slate-100"
                          onClick={() => handleOpenProfile(p)}
                        >
                          Ver
                        </button>
                        <button
                          className="h-7 px-2 rounded-md border border-slate-300 text-[11px] hover:bg-slate-100"
                          onClick={() => handleOpenEdit(p)}
                        >
                          Editar
                        </button>
                        <button
                          className="h-7 px-2 rounded-md border border-rose-300 text-[11px] text-rose-600 hover:bg-rose-50"
                          onClick={() => handleDeletePatient(p)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
                {filteredPatients.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center text-slate-400 py-8 text-xs"
                    >
                      No se encontraron pacientes con ese criterio.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modales */}
      {profileOpen && selectedPatient && (
        <PatientProfileModal
          patient={selectedPatient}
          onClose={() => setProfileOpen(false)}
        />
      )}

      {formOpen && (
        <PatientFormModal
          mode={formMode}
          patient={formMode === "edit" ? selectedPatient : null}
          onClose={() => setFormOpen(false)}
          onSave={handleSavePatient}
        />
      )}
    </>
  );
}

/* =========================
   Modal: Ver perfil paciente
   ========================= */

function PatientProfileModal({ patient, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              Perfil de paciente
            </h2>
            <p className="text-xs text-slate-500">
              Detalle general del paciente.
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:bg-slate-100 text-xs"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-700">
          <InfoRow label="Nombre completo">
            {getFullName(patient)}
          </InfoRow>
          <InfoRow label="Correo">
            {patient.correo || "—"}
          </InfoRow>
          <InfoRow label="Teléfono">
            {patient.telefono || "—"}
          </InfoRow>
          <InfoRow label="Fecha de nacimiento">
            {patient.fecha_nac || "—"}
          </InfoRow>
          <InfoRow label="Género">
            {patient.genero || "—"}
          </InfoRow>
          <InfoRow label="Registrado el">
            {patient.registro || "—"}
          </InfoRow>
          <InfoRow label="Último servicio">
            {patient.lastServiceName || "Sin registros de citas"}
          </InfoRow>
          <InfoRow label="Molestia / motivo">
            {patient.molestia || "—"}
          </InfoRow>
          <InfoRow label="Notas">
            {patient.notas || "—"}
          </InfoRow>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md text-xs border border-slate-300 bg-white hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Modal: Crear / editar paciente
   ========================= */

function PatientFormModal({ mode, patient, onClose, onSave }) {
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    nombres: patient?.nombres ?? "",
    apellido_pat: patient?.apellido_pat ?? "",
    apellido_mat: patient?.apellido_mat ?? "",
    correo: patient?.correo ?? "",
    telefono: patient?.telefono ?? "",
    fecha_nac: patient?.fecha_nac ?? "",
    genero: patient?.genero ?? "",
    molestia: patient?.molestia ?? "",
    notas: patient?.notas ?? "",
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              {isEdit ? "Editar paciente" : "Nuevo paciente"}
            </h2>
            <p className="text-xs text-slate-500">
              {isEdit
                ? "Actualiza los datos del paciente."
                : "Completa la información básica del paciente."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:bg-slate-100 text-xs"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block mb-1 font-semibold text-slate-600">
                Nombre(s)
              </label>
              <input
                type="text"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={form.nombres}
                onChange={(e) => handleChange("nombres", e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold text-slate-600">
                Apellido paterno
              </label>
              <input
                type="text"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={form.apellido_pat}
                onChange={(e) => handleChange("apellido_pat", e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold text-slate-600">
                Apellido materno
              </label>
              <input
                type="text"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={form.apellido_mat}
                onChange={(e) => handleChange("apellido_mat", e.target.value)}
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold text-slate-600">
                Correo
              </label>
              <input
                type="email"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={form.correo}
                onChange={(e) => handleChange("correo", e.target.value)}
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold text-slate-600">
                Teléfono
              </label>
              <input
                type="text"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={form.telefono}
                onChange={(e) => handleChange("telefono", e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold text-slate-600">
                Fecha de nacimiento
              </label>
              <input
                type="date"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={form.fecha_nac}
                onChange={(e) => handleChange("fecha_nac", e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold text-slate-600">
                Género
              </label>
              <select
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
                value={form.genero}
                onChange={(e) => handleChange("genero", e.target.value)}
              >
                <option value="">Selecciona…</option>
                <option value="femenino">Femenino</option>
                <option value="masculino">Masculino</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-semibold text-slate-600">
                Molestia / motivo de consulta
              </label>
              <textarea
                rows={2}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm resize-none"
                value={form.molestia}
                onChange={(e) => handleChange("molestia", e.target.value)}
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold text-slate-600">
                Notas adicionales
              </label>
              <textarea
                rows={2}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm resize-none"
                value={form.notas}
                onChange={(e) => handleChange("notas", e.target.value)}
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-md text-xs border border-slate-300 bg-white hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-md text-xs bg-violet-600 text-white hover:bg-violet-700"
            >
              {isEdit ? "Guardar cambios" : "Crear paciente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* Row simple para el modal de perfil */
function InfoRow({ label, children }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-32 text-[11px] font-semibold text-slate-500">
        {label}
      </span>
      <span className="flex-1 text-[11px] text-slate-700">{children}</span>
    </div>
  );
}
