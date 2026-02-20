import { useEffect, useMemo, useState } from "react";
import { Th, Td } from "./TableParts";
import { FilterBlock } from "./FilterBlock";
import { SlidersHorizontal, X } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

function getFullName(p) {
  return `${p.nombres || ""} ${p.apellido_pat || ""} ${p.apellido_mat || ""}`.trim();
}

function getProfessionalLabel(p) {
  const full = `${p.first_name || ""} ${p.last_name || ""}`.trim();
  return full || p.username || `Profesional #${p.id}`;
}

function formatDateMX(iso) {
  if (!iso) return "—";
  const [y, m, d] = String(iso).split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function formatTimeHM(hhmmss) {
  if (!hhmmss) return "—";
  return String(hhmmss).slice(0, 5);
}

function estadoTratamientoLabel(v) {
  if (v === "alta") return "Dado de alta";
  return "En tratamiento";
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
  const [filterProfessional, setFilterProfessional] = useState("Todos");
  const [filterService, setFilterService] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ✅ Drawer filtros (móvil)
  const [filtersOpen, setFiltersOpen] = useState(false);

  const logoutAndRedirect = () => {
    localStorage.removeItem("auth.access");
    localStorage.removeItem("auth.refresh");
    localStorage.removeItem("auth.user");
    window.location.href = "/login";
  };

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
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/api/citas/`, {
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/api/profesionales/`, {
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          }),
        ]);

        if (patientsResp.status === 401 || citasResp.status === 401 || profsResp.status === 401) {
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

  const reloadPatients = async () => {
    const token = localStorage.getItem("auth.access");
    if (!token) return logoutAndRedirect();

    try {
      setLoading(true);
      const resp = await fetch(`${API_BASE}/api/pacientes/`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      if (resp.status === 401) return logoutAndRedirect();

      const data = await resp.json();
      setPatients(data || []);
      if (data?.length && data[0].clinica) setDefaultClinicId(data[0].clinica);
    } catch (e) {
      console.error("Error recargando pacientes:", e);
    } finally {
      setLoading(false);
    }
  };

  // ========= Enriquecer pacientes con info de citas =========
  const enhancedPatients = useMemo(() => {
    const citasPorPaciente = new Map();

    citas.forEach((c) => {
      if (!c.paciente) return;
      if (!citasPorPaciente.has(c.paciente)) citasPorPaciente.set(c.paciente, []);
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
        if (!lastCita) lastCita = { ...c, _key: key };
        else if (key > lastCita._key) lastCita = { ...c, _key: key };
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
        branchLabel: "Fisionerv Centro",
        _citas: cp,
      };
    });
  }, [patients, citas]);

  const servicesForFilter = useMemo(() => {
    const set = new Set();
    enhancedPatients.forEach((p) => p.servicesSet?.forEach((s) => s && set.add(s)));
    return Array.from(set).sort();
  }, [enhancedPatients]);

  // ========= Handlers =========
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

  const handleDeletePatient = (patient) => {
    setDeleteTarget(patient);
    setDeleteOpen(true);
  };

  const confirmDeletePatient = async (patient) => {
    const token = localStorage.getItem("auth.access");
    if (!token) return logoutAndRedirect();

    try {
      const resp = await fetch(`${API_BASE}/api/pacientes/${patient.id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (resp.status === 401) return logoutAndRedirect();

      if (!resp.ok && resp.status !== 204) {
        const data = await resp.json().catch(() => null);
        console.error("Error al eliminar paciente:", data || resp.status);
        return;
      }

      setPatients((prev) => prev.filter((p) => p.id !== patient.id));
      setProfileOpen(false);
      setSelectedPatient(null);
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (e) {
      console.error("Error al eliminar paciente:", e);
    }
  };

  const handleSavePatient = async (formData) => {
    const token = localStorage.getItem("auth.access");
    if (!token) return logoutAndRedirect();

    const isEdit = formMode === "edit" && selectedPatient;
    const url = isEdit ? `${API_BASE}/api/pacientes/${selectedPatient.id}/` : `${API_BASE}/api/pacientes/`;
    const method = isEdit ? "PATCH" : "POST";

    const payload = {
      clinica: isEdit ? selectedPatient.clinica || defaultClinicId : defaultClinicId,
      nombres: formData.nombres,
      apellido_pat: formData.apellido_pat,
      apellido_mat: formData.apellido_mat || "",
      fecha_nac: formData.fecha_nac || null,
      genero: formData.genero || "",
      telefono: formData.telefono,
      correo: formData.correo || "",
      molestia: formData.molestia || "",
      notas: formData.notas || "",
      estado_tratamiento: formData.estado_tratamiento || "en_tratamiento",
      fecha_alta: formData.estado_tratamiento === "alta" ? (formData.fecha_alta || null) : null,
    };

    if (isEdit) delete payload.clinica;

    try {
      const resp = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (resp.status === 401) return logoutAndRedirect();

      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        console.error("Error al guardar paciente:", data || resp.status);
        return;
      }

      const saved = await resp.json();

      if (isEdit) setPatients((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
      else setPatients((prev) => [...prev, saved]);

      setFormOpen(false);
      setSelectedPatient(null);
    } catch (e) {
      console.error("Error al guardar paciente:", e);
    }
  };

  // ========= Aplicar búsqueda + filtros =========
  const filteredPatients = useMemo(() => {
    const term = search.toLowerCase();
    const profId = filterProfessional === "Todos" ? null : Number(filterProfessional);
    const serviceName = filterService === "Todos" ? null : filterService;
    const status = filterStatus;

    return enhancedPatients
      .filter((p) => {
        if (term) {
          const hayCoincidencia =
            p.fullName.toLowerCase().includes(term) ||
            (p.correo || "").toLowerCase().includes(term) ||
            (p.telefono || "").toLowerCase().includes(term);
          if (!hayCoincidencia) return false;
        }

        if (filterBranch !== "Todos" && p.branchLabel !== filterBranch) return false;
        if (profId && !p.professionalsSet.has(profId)) return false;
        if (serviceName && !p.servicesSet.has(serviceName)) return false;

        if (status === "Con reservas" && !p.hasReservations) return false;
        if (status === "Sin reservas" && p.hasReservations) return false;

        if (filterStartDate && (!p.registro || p.registro < filterStartDate)) return false;
        if (filterEndDate && (!p.registro || p.registro > filterEndDate)) return false;

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

  if (loading) {
    return (
      <div className="w-full p-6 text-sm text-slate-500">
        Cargando pacientes desde el servidor…
      </div>
    );
  }

  /* ========= UI filtros (reutilizable) ========= */
  const FiltersUI = (
    <>
      <h2 className="text-sm font-semibold text-slate-700">Filtros avanzados</h2>

      <FilterBlock title="Local/sede">
        <select
          className="w-full text-xs rounded-xl border border-slate-200 px-2 py-2 bg-slate-50"
          value={filterBranch}
          onChange={(e) => setFilterBranch(e.target.value)}
        >
          <option value="Todos">Todos</option>
          <option value="Fisionerv Centro">Fisionerv Centro</option>
        </select>
      </FilterBlock>

      <FilterBlock title="Profesional">
        <select
          className="w-full text-xs rounded-xl border border-slate-200 px-2 py-2 bg-slate-50"
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
          className="w-full text-xs rounded-xl border border-slate-200 px-2 py-2 bg-slate-50"
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
          className="w-full text-xs rounded-xl border border-slate-200 px-2 py-2 bg-slate-50"
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
          className="w-full text-xs rounded-xl border border-slate-200 px-2 py-2 mb-2"
          value={filterStartDate}
          onChange={(e) => setFilterStartDate(e.target.value)}
        />
        <input
          type="date"
          className="w-full text-xs rounded-xl border border-slate-200 px-2 py-2"
          value={filterEndDate}
          onChange={(e) => setFilterEndDate(e.target.value)}
        />
      </FilterBlock>
    </>
  );

  return (
    <div className="w-full overflow-hidden">
      <div className="flex min-h-[calc(100vh-64px)]">
        {/* ✅ Sidebar (solo desktop) */}
        <aside className="hidden lg:block w-72 bg-white border-r border-slate-200 p-4 space-y-4">
          {FiltersUI}
        </aside>

        {/* ✅ Drawer filtros (móvil/tablet) */}
        {filtersOpen ? (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-[86%] max-w-sm bg-white shadow-2xl border-r border-slate-200 p-4 overflow-auto">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Filtros</p>
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="h-9 w-9 rounded-xl border border-slate-200 inline-flex items-center justify-center hover:bg-slate-50"
                  title="Cerrar"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-4">{FiltersUI}</div>
              <div className="mt-4">
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="w-full rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:brightness-110"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Contenido principal */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-4 sm:px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Base de pacientes</h2>
              <p className="text-xs text-slate-500">{patients.length} pacientes registrados.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* ✅ botón filtros en móvil */}
              <button
                className="lg:hidden inline-flex items-center gap-2 text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                onClick={() => setFiltersOpen(true)}
              >
                <SlidersHorizontal size={16} />
                Filtros
              </button>

              <button
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                onClick={reloadPatients}
              >
                Cargar pacientes
              </button>
              <button
                className="text-xs px-3 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700"
                onClick={handleOpenCreate}
              >
                + Nuevo paciente
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 flex flex-col gap-3 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Busca por nombre, apellido, email o teléfono"
                  className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-slate-400"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <button className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50">
                Acciones ▾
              </button>
            </div>

            {/* ✅ clave: overflow-x-auto para tabla en móvil */}
            <div className="flex-1 overflow-auto bg-white rounded-2xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-[860px] w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <Th>Nombre</Th>
                      <Th>Apellido</Th>
                      <Th>Correo</Th>
                      <Th>Teléfono</Th>
                      <Th>Servicio</Th>
                      <Th>Estado</Th>
                      <Th className="text-center">Opciones</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((p) => (
                      <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <Td>{p.nombres}</Td>
                        <Td>{(p.apellido_pat || "") + " " + (p.apellido_mat || "")}</Td>
                        <Td>{p.correo || "—"}</Td>
                        <Td>{p.telefono || "—"}</Td>
                        <Td>{p.lastServiceName || "—"}</Td>
                        <Td>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ring-1 ${p.estado_tratamiento === "alta"
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                : "bg-amber-50 text-amber-700 ring-amber-200"
                              }`}
                          >
                            {estadoTratamientoLabel(p.estado_tratamiento)}
                          </span>
                        </Td>
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
                        <td colSpan={7} className="text-center text-slate-400 py-8 text-xs">
                          No se encontraron pacientes con ese criterio.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modales (los tuyos existentes) */}
      {profileOpen && selectedPatient && (
        <PatientProfileModal patient={selectedPatient} onClose={() => setProfileOpen(false)} />
      )}

      {formOpen && (
        <PatientFormModal
          mode={formMode}
          patient={formMode === "edit" ? selectedPatient : null}
          onClose={() => setFormOpen(false)}
          onSave={handleSavePatient}
        />
      )}

      {deleteOpen && deleteTarget && (
        <DeleteConfirmModal
          patient={deleteTarget}
          onClose={() => {
            setDeleteOpen(false);
            setDeleteTarget(null);
          }}
          onConfirm={() => confirmDeletePatient(deleteTarget)}
        />
      )}
    </div>
  );
}

/* =========================
   Modales (los tuyos, sin cambios funcionales)
   ========================= */
function PatientProfileModal({ patient, onClose }) {
  const citasPaciente = useMemo(() => {
    const list = Array.isArray(patient?._citas) ? patient._citas : [];
    return [...list].sort((a, b) => {
      const ka = `${a.fecha || ""}T${a.hora_inicio || ""}`;
      const kb = `${b.fecha || ""}T${b.hora_inicio || ""}`;
      return ka.localeCompare(kb);
    });
  }, [patient]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-3">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Expediente del paciente</h2>
            <p className="text-xs text-slate-500">
              {getFullName(patient)} • {estadoTratamientoLabel(patient.estado_tratamiento)}
              {patient.estado_tratamiento === "alta" && patient.fecha_alta
                ? ` • Alta: ${formatDateMX(patient.fecha_alta)}`
                : ""}
            </p>
          </div>

          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-white text-sm"
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="p-5 border-b lg:border-b-0 lg:border-r border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800">Información general</h3>
            <p className="mt-1 text-xs text-slate-500">Datos básicos y estado del paciente.</p>

            <div className="mt-4 space-y-3 text-xs text-slate-700">
              <InfoRow label="Nombre completo">{getFullName(patient)}</InfoRow>
              <InfoRow label="Correo">{patient.correo || "—"}</InfoRow>
              <InfoRow label="Teléfono">{patient.telefono || "—"}</InfoRow>
              <InfoRow label="Fecha de nacimiento">
                {patient.fecha_nac ? formatDateMX(patient.fecha_nac) : "—"}
              </InfoRow>
              <InfoRow label="Género">{patient.genero || "—"}</InfoRow>
              <InfoRow label="Registrado">{patient.registro ? formatDateMX(patient.registro) : "—"}</InfoRow>
              <InfoRow label="Estado">{estadoTratamientoLabel(patient.estado_tratamiento)}</InfoRow>
              <InfoRow label="Fecha de alta">
                {patient.estado_tratamiento === "alta"
                  ? patient.fecha_alta
                    ? formatDateMX(patient.fecha_alta)
                    : "—"
                  : "—"}
              </InfoRow>
              <InfoRow label="Último servicio">{patient.lastServiceName || "Sin registros de citas"}</InfoRow>
              <InfoRow label="Molestia / motivo">{patient.molestia || "—"}</InfoRow>
              <InfoRow label="Notas">{patient.notas || "—"}</InfoRow>
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Expediente clínico</h3>
                <p className="mt-1 text-xs text-slate-500">Historial de citas registradas a nombre del paciente.</p>
              </div>
              <span className="text-[11px] rounded-full bg-slate-100 px-2.5 py-1 ring-1 ring-slate-200 text-slate-700">
                Total citas: <b>{citasPaciente.length}</b>
              </span>
            </div>

            <div className="mt-4 max-h-[60vh] overflow-auto rounded-xl border border-slate-200">
              {citasPaciente.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-600">
                  Aún no hay citas registradas para este paciente.
                </div>
              ) : (
                <table className="min-w-[720px] w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                    <tr>
                      <Th>Fecha</Th>
                      <Th>Hora</Th>
                      <Th>Servicio</Th>
                      <Th>Profesional</Th>
                      <Th>Estado</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {citasPaciente.map((c) => (
                      <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <Td>{c.fecha ? formatDateMX(c.fecha) : "—"}</Td>
                        <Td>
                          {formatTimeHM(c.hora_inicio)} - {formatTimeHM(c.hora_termina)}
                        </Td>
                        <Td>{c.servicio_nombre || "—"}</Td>
                        <Td>{c.profesional_nombre || "—"}</Td>
                        <Td>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 ring-1 ring-slate-200">
                            {c.estado || "—"}
                          </span>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs border border-slate-200 bg-white hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    estado_tratamiento: patient?.estado_tratamiento ?? "en_tratamiento",
    fecha_alta: patient?.fecha_alta ?? "",
  });

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(form);
  };

  const showAltaDate = form.estado_tratamiento === "alta";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-3">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl border border-slate-200">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {isEdit ? "Editar paciente" : "Nuevo paciente"}
            </h2>
            <p className="text-xs text-slate-500">
              {isEdit ? "Actualiza los datos del paciente." : "Completa la información básica del paciente."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-white text-sm"
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-auto max-h-[calc(90vh-76px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
            <Field label="Nombre(s)">
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={form.nombres}
                onChange={(e) => handleChange("nombres", e.target.value)}
                required
              />
            </Field>

            <Field label="Teléfono">
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={form.telefono}
                onChange={(e) => handleChange("telefono", e.target.value)}
                required
              />
            </Field>

            <Field label="Apellido paterno">
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={form.apellido_pat}
                onChange={(e) => handleChange("apellido_pat", e.target.value)}
                required
              />
            </Field>

            <Field label="Apellido materno">
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={form.apellido_mat}
                onChange={(e) => handleChange("apellido_mat", e.target.value)}
              />
            </Field>

            <Field label="Correo">
              <input
                type="email"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={form.correo}
                onChange={(e) => handleChange("correo", e.target.value)}
              />
            </Field>

            <Field label="Fecha de nacimiento">
              <input
                type="date"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={form.fecha_nac}
                onChange={(e) => handleChange("fecha_nac", e.target.value)}
              />
            </Field>

            <Field label="Género">
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                value={form.genero}
                onChange={(e) => handleChange("genero", e.target.value)}
              >
                <option value="">Selecciona…</option>
                <option value="femenino">Femenino</option>
                <option value="masculino">Masculino</option>
                <option value="otro">Otro</option>
              </select>
            </Field>

            <Field label="Estado del tratamiento">
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                value={form.estado_tratamiento}
                onChange={(e) => {
                  const v = e.target.value;
                  handleChange("estado_tratamiento", v);
                  if (v !== "alta") handleChange("fecha_alta", "");
                }}
              >
                <option value="en_tratamiento">En tratamiento</option>
                <option value="alta">Dado de alta</option>
              </select>
            </Field>

            <Field label="Fecha de alta">
              <input
                type="date"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-400"
                value={form.fecha_alta}
                onChange={(e) => handleChange("fecha_alta", e.target.value)}
                disabled={!showAltaDate}
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Solo aplica si el paciente está dado de alta (para tus gráficas).
              </p>
            </Field>

            <div className="lg:col-span-2">
              <Field label="Molestia / motivo de consulta">
                <textarea
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm resize-none"
                  value={form.molestia}
                  onChange={(e) => handleChange("molestia", e.target.value)}
                />
              </Field>
            </div>

            <div className="lg:col-span-2">
              <Field label="Notas adicionales">
                <textarea
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm resize-none"
                  value={form.notas}
                  onChange={(e) => handleChange("notas", e.target.value)}
                />
              </Field>
            </div>
          </div>

          <div className="pt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs border border-slate-200 bg-white hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl text-xs bg-violet-600 text-white hover:bg-violet-700">
              {isEdit ? "Guardar cambios" : "Crear paciente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block mb-1 font-semibold text-slate-600">{label}</label>
      {children}
    </div>
  );
}

function DeleteConfirmModal({ patient, onClose, onConfirm }) {
  const [text, setText] = useState("");
  const ok = text.trim().toLowerCase() === "eliminar";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <h3 className="text-base font-semibold text-slate-900">Eliminar paciente</h3>
          <p className="mt-1 text-xs text-slate-600">
            Esta acción no se puede deshacer. Para confirmar, escribe <b>eliminar</b>.
          </p>
        </div>

        <div className="p-5">
          <p className="text-sm text-slate-700">
            Paciente: <b>{getFullName(patient)}</b>
          </p>

          <input
            type="text"
            className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-rose-400"
            placeholder="Escribe: eliminar"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs border border-slate-200 bg-white hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => ok && onConfirm()}
              disabled={!ok}
              className="px-4 py-2 rounded-xl text-xs bg-rose-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rose-700"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, children }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-32 text-[11px] font-semibold text-slate-500">{label}</span>
      <span className="flex-1 text-[11px] text-slate-700">{children}</span>
    </div>
  );
}