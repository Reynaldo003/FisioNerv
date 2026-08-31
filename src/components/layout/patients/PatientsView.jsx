// src/components/layout/patients/PatientsView.jsx

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Cake,
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  FileText,
  FolderOpen,
  HeartPulse,
  Mail,
  Pencil,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  UploadCloud,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { FilterBlock } from "./FilterBlock";
import { Td, Th } from "./TableParts";
import {
  apiRequest,
  normalizarLista,
  pacientesApi,
} from "../../../services/patientsApi";


const PAGE_SIZE = 10;


function getFullName(paciente) {
  return `${paciente?.nombres || ""} ${paciente?.apellido_pat || ""} ${paciente?.apellido_mat || ""}`.trim();
}


function getInitials(paciente) {
  const values = [paciente?.nombres, paciente?.apellido_pat].filter(Boolean);

  return (
    values
      .map((value) => String(value).trim()[0]?.toUpperCase())
      .join("") || "P"
  );
}


function getProfessionalLabel(profesional) {
  const fullName = `${profesional?.first_name || ""} ${profesional?.last_name || ""}`.trim();

  return (
    fullName ||
    profesional?.username ||
    `Profesional #${profesional?.id || ""}`
  );
}


function formatDateMX(value) {
  if (!value) return "—";

  const iso = String(value).split("T")[0];
  const [year, month, day] = iso.split("-");

  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}


function formatTimeHM(value) {
  if (!value) return "—";
  return String(value).slice(0, 5);
}


function formatFileSize(bytes = 0) {
  const value = Number(bytes || 0);

  if (!value) return "0 KB";

  if (value < 1024 * 1024) {
    return `${Math.max(1, Math.round(value / 1024))} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}


function todayISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function estadoTratamientoLabel(value) {
  return value === "alta" ? "Dado de alta" : "En tratamiento";
}


function getBirthdayInfo(fechaNac) {
  if (!fechaNac) {
    return {
      isToday: false,
      daysUntil: null,
    };
  }

  const [, monthString, dayString] = String(fechaNac)
    .split("T")[0]
    .split("-");

  const month = Number(monthString);
  const day = Number(dayString);

  if (!month || !day) {
    return {
      isToday: false,
      daysUntil: null,
    };
  }

  const today = new Date();
  const todayClean = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  let birthday = new Date(
    today.getFullYear(),
    month - 1,
    day,
  );

  if (birthday < todayClean) {
    birthday = new Date(
      today.getFullYear() + 1,
      month - 1,
      day,
    );
  }

  const daysUntil = Math.round(
    (birthday - todayClean) / 86400000,
  );

  return {
    isToday: daysUntil === 0,
    daysUntil,
  };
}


function getPatientBirthdayInfo(paciente) {
  if (
    typeof paciente?.cumple_hoy === "boolean" ||
    paciente?.dias_para_cumple !== undefined
  ) {
    return {
      isToday: Boolean(paciente?.cumple_hoy),
      daysUntil:
        paciente?.dias_para_cumple === null ||
          paciente?.dias_para_cumple === undefined
          ? null
          : Number(paciente.dias_para_cumple),
    };
  }

  return getBirthdayInfo(paciente?.fecha_nac);
}


function getVisiblePages(current, total) {
  if (total <= 5) {
    return Array.from(
      { length: total },
      (_, index) => index + 1,
    );
  }

  if (current <= 3) {
    return [1, 2, 3, 4, 5];
  }

  if (current >= total - 2) {
    return [
      total - 4,
      total - 3,
      total - 2,
      total - 1,
      total,
    ];
  }

  return [
    current - 2,
    current - 1,
    current,
    current + 1,
    current + 2,
  ];
}


function showError(error, fallback) {
  console.error(error);
  window.alert(error?.message || fallback);
}


export function PatientsView() {
  const [patients, setPatients] = useState([]);
  const [citas, setCitas] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filterBranch, setFilterBranch] = useState("Todos");
  const [filterProfessional, setFilterProfessional] = useState("Todos");
  const [filterService, setFilterService] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    paciente: null,
    citas: [],
    documentos: [],
    historial_clinico: [],
  });

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);


  const loadMainData = useCallback(async () => {
    try {
      setLoading(true);

      const [
        patientsData,
        citasData,
        professionalsData,
        summaryData,
        birthdaysData,
      ] = await Promise.all([
        pacientesApi.listar(),
        apiRequest("/api/citas/"),
        apiRequest("/api/profesionales/"),
        pacientesApi.resumen(),
        pacientesApi.cumpleanos(7),
      ]);

      setPatients(normalizarLista(patientsData));
      setCitas(normalizarLista(citasData));
      setProfessionals(normalizarLista(professionalsData));
      setSummary(summaryData || null);
      setBirthdays(normalizarLista(birthdaysData));
    } catch (error) {
      showError(
        error,
        "No fue posible cargar la información de pacientes.",
      );
    } finally {
      setLoading(false);
    }
  }, []);


  const refreshSummaryAndBirthdays = useCallback(async () => {
    try {
      const [summaryData, birthdaysData] = await Promise.all([
        pacientesApi.resumen(),
        pacientesApi.cumpleanos(7),
      ]);

      setSummary(summaryData || null);
      setBirthdays(normalizarLista(birthdaysData));
    } catch (error) {
      console.error(
        "No fue posible actualizar resumen/cumpleaños:",
        error,
      );
    }
  }, []);


  useEffect(() => {
    loadMainData();
  }, [loadMainData]);


  const citasPorPaciente = useMemo(() => {
    const map = new Map();

    citas.forEach((cita) => {
      if (!cita?.paciente) return;

      if (!map.has(cita.paciente)) {
        map.set(cita.paciente, []);
      }

      map.get(cita.paciente).push(cita);
    });

    return map;
  }, [citas]);


  const enhancedPatients = useMemo(() => {
    return patients.map((paciente) => {
      const patientAppointments =
        citasPorPaciente.get(paciente.id) || [];

      const servicesSet = new Set();
      const professionalsSet = new Set();

      patientAppointments.forEach((cita) => {
        if (cita.servicio_nombre) {
          servicesSet.add(cita.servicio_nombre);
        }

        if (cita.profesional) {
          professionalsSet.add(Number(cita.profesional));
        }
      });

      return {
        ...paciente,
        fullName: getFullName(paciente),
        lastServiceName:
          paciente.ultimo_servicio ||
          patientAppointments[0]?.servicio_nombre ||
          "",
        servicesSet,
        professionalsSet,
        hasReservations:
          Number(paciente.total_citas || 0) > 0 ||
          patientAppointments.length > 0,
        branchLabel:
          paciente.clinica_nombre || "Sin clínica",
        _citas: patientAppointments,
      };
    });
  }, [patients, citasPorPaciente]);


  const selectedPatientResolved = useMemo(() => {
    if (!selectedPatient) return null;

    return (
      enhancedPatients.find(
        (paciente) =>
          paciente.id === selectedPatient.id,
      ) || selectedPatient
    );
  }, [selectedPatient, enhancedPatients]);


  const profilePatient = useMemo(() => {
    if (!selectedPatientResolved) return null;

    return {
      ...selectedPatientResolved,
      ...(profileData.paciente || {}),
      _citas:
        profileData.citas?.length ||
          profileData.paciente
          ? profileData.citas || []
          : selectedPatientResolved._citas || [],
    };
  }, [
    selectedPatientResolved,
    profileData.paciente,
    profileData.citas,
  ]);


  const servicesForFilter = useMemo(() => {
    const values = new Set();

    enhancedPatients.forEach((paciente) => {
      paciente.servicesSet?.forEach((service) => {
        if (service) values.add(service);
      });

      if (paciente.ultimo_servicio) {
        values.add(paciente.ultimo_servicio);
      }
    });

    return Array.from(values).sort();
  }, [enhancedPatients]);


  const branchesForFilter = useMemo(() => {
    return Array.from(
      new Set(
        enhancedPatients
          .map((paciente) => paciente.branchLabel)
          .filter(Boolean),
      ),
    ).sort();
  }, [enhancedPatients]);


  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();

    const professionalId =
      filterProfessional === "Todos"
        ? null
        : Number(filterProfessional);

    const service =
      filterService === "Todos"
        ? null
        : filterService;

    return enhancedPatients
      .filter((paciente) => {
        if (term) {
          const matches =
            paciente.fullName
              .toLowerCase()
              .includes(term) ||
            (paciente.correo || "")
              .toLowerCase()
              .includes(term) ||
            (paciente.telefono || "")
              .toLowerCase()
              .includes(term);

          if (!matches) return false;
        }

        if (
          filterBranch !== "Todos" &&
          paciente.branchLabel !== filterBranch
        ) {
          return false;
        }

        if (
          professionalId &&
          !paciente.professionalsSet.has(
            professionalId,
          )
        ) {
          return false;
        }

        if (
          service &&
          !paciente.servicesSet.has(service) &&
          paciente.ultimo_servicio !== service
        ) {
          return false;
        }

        if (
          filterStatus === "Con reservas" &&
          !paciente.hasReservations
        ) {
          return false;
        }

        if (
          filterStatus === "Sin reservas" &&
          paciente.hasReservations
        ) {
          return false;
        }

        const registro = String(
          paciente.registro || "",
        ).split("T")[0];

        if (
          filterStartDate &&
          (!registro || registro < filterStartDate)
        ) {
          return false;
        }

        if (
          filterEndDate &&
          (!registro || registro > filterEndDate)
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) =>
        a.fullName.localeCompare(b.fullName),
      );
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


  useEffect(() => {
    setPage(1);
  }, [
    search,
    filterBranch,
    filterProfessional,
    filterService,
    filterStatus,
    filterStartDate,
    filterEndDate,
  ]);


  const totalPages = Math.max(
    1,
    Math.ceil(filteredPatients.length / PAGE_SIZE),
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const visiblePages = getVisiblePages(
    currentPage,
    totalPages,
  );


  const metrics = useMemo(() => {
    if (summary) {
      return {
        total: Number(summary.total || 0),
        treatment: Number(
          summary.en_tratamiento || 0,
        ),
        appointments: Number(
          summary.sesiones || 0,
        ),
        discharged: Number(
          summary.dados_alta || 0,
        ),
      };
    }

    return {
      total: patients.length,
      treatment: patients.filter(
        (paciente) =>
          paciente.estado_tratamiento !== "alta",
      ).length,
      appointments: citas.length,
      discharged: patients.filter(
        (paciente) =>
          paciente.estado_tratamiento === "alta",
      ).length,
    };
  }, [summary, patients, citas]);


  const clearFilters = () => {
    setSearch("");
    setFilterBranch("Todos");
    setFilterProfessional("Todos");
    setFilterService("Todos");
    setFilterStatus("Todos");
    setFilterStartDate("");
    setFilterEndDate("");
  };


  const syncPatient = (updatedPatient) => {
    if (!updatedPatient?.id) return;

    setPatients((current) =>
      current.map((patient) =>
        patient.id === updatedPatient.id
          ? {
            ...patient,
            ...updatedPatient,
          }
          : patient,
      ),
    );

    setSelectedPatient((current) =>
      current?.id === updatedPatient.id
        ? {
          ...current,
          ...updatedPatient,
        }
        : current,
    );

    setProfileData((current) => {
      if (
        current?.paciente?.id !==
        updatedPatient.id
      ) {
        return current;
      }

      return {
        ...current,
        paciente: {
          ...current.paciente,
          ...updatedPatient,
        },
      };
    });
  };


  const loadPatientProfile = async (
    patientId,
    showLoader = true,
  ) => {
    try {
      if (showLoader) {
        setProfileLoading(true);
      }

      const expediente =
        await pacientesApi.expediente(patientId);

      setProfileData({
        paciente: expediente?.paciente || null,
        citas: Array.isArray(expediente?.citas)
          ? expediente.citas
          : [],
        documentos: Array.isArray(
          expediente?.documentos,
        )
          ? expediente.documentos
          : [],
        historial_clinico: Array.isArray(
          expediente?.historial_clinico,
        )
          ? expediente.historial_clinico
          : [],
      });

      if (expediente?.paciente) {
        syncPatient(expediente.paciente);
      }

      return expediente;
    } catch (error) {
      showError(
        error,
        "No fue posible cargar el expediente del paciente.",
      );

      return null;
    } finally {
      if (showLoader) {
        setProfileLoading(false);
      }
    }
  };


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


  const handleOpenProfile = async (patient) => {
    setSelectedPatient(patient);

    setProfileData({
      paciente: patient,
      citas: patient._citas || [],
      documentos: [],
      historial_clinico: [],
    });

    setProfileOpen(true);

    await loadPatientProfile(patient.id);
  };


  const handleDeletePatient = (patient) => {
    setDeleteTarget(patient);
    setDeleteOpen(true);
  };


  const handleChangePatientPhoto = async (
    patientId,
    file,
  ) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      window.alert(
        "Selecciona una imagen válida.",
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      window.alert(
        "La fotografía no debe superar 5 MB.",
      );
      return;
    }

    try {
      setActionLoading(true);

      const updated =
        await pacientesApi.subirFoto(
          patientId,
          file,
        );

      syncPatient(updated);
      await refreshSummaryAndBirthdays();
    } catch (error) {
      showError(
        error,
        "No fue posible guardar la fotografía.",
      );
    } finally {
      setActionLoading(false);
    }
  };


  const handleRemovePatientPhoto = async (
    patientId,
  ) => {
    try {
      setActionLoading(true);

      const updated =
        await pacientesApi.eliminarFoto(
          patientId,
        );

      syncPatient(updated);
      await refreshSummaryAndBirthdays();
    } catch (error) {
      showError(
        error,
        "No fue posible eliminar la fotografía.",
      );
    } finally {
      setActionLoading(false);
    }
  };


  const handleAddDocuments = async (
    patientId,
    fileList,
    documentType = "otro",
  ) => {
    const files = Array.from(fileList || []);

    if (!files.length) return;

    try {
      setActionLoading(true);

      const uploaded = [];

      for (const file of files) {
        const document =
          await pacientesApi.subirDocumento(
            patientId,
            file,
            documentType,
            "",
          );

        uploaded.push(document);
      }

      setProfileData((current) => ({
        ...current,
        documentos: [
          ...uploaded.reverse(),
          ...(current.documentos || []),
        ],
      }));
    } catch (error) {
      showError(
        error,
        "No fue posible cargar uno de los documentos.",
      );

      await loadPatientProfile(
        patientId,
        false,
      );
    } finally {
      setActionLoading(false);
    }
  };


  const handleRemoveDocument = async (
    patientId,
    documentId,
  ) => {
    try {
      setActionLoading(true);

      await pacientesApi.eliminarDocumento(
        patientId,
        documentId,
      );

      setProfileData((current) => ({
        ...current,
        documentos: (
          current.documentos || []
        ).filter(
          (document) =>
            document.id !== documentId,
        ),
      }));
    } catch (error) {
      showError(
        error,
        "No fue posible eliminar el documento.",
      );
    } finally {
      setActionLoading(false);
    }
  };


  const handleAddClinicalEntry = async (
    patientId,
    entry,
  ) => {
    try {
      setActionLoading(true);

      const created =
        await pacientesApi.crearRegistroClinico(
          patientId,
          {
            fecha: entry.fecha,
            titulo: entry.titulo,
            descripcion: entry.descripcion,
          },
        );

      setProfileData((current) => ({
        ...current,
        historial_clinico: [
          created,
          ...(current.historial_clinico || []),
        ],
      }));
    } catch (error) {
      showError(
        error,
        "No fue posible guardar el registro clínico.",
      );
    } finally {
      setActionLoading(false);
    }
  };


  const handleRemoveClinicalEntry = async (
    patientId,
    entryId,
  ) => {
    try {
      setActionLoading(true);

      await pacientesApi.eliminarRegistroClinico(
        patientId,
        entryId,
      );

      setProfileData((current) => ({
        ...current,
        historial_clinico: (
          current.historial_clinico || []
        ).filter(
          (entry) => entry.id !== entryId,
        ),
      }));
    } catch (error) {
      showError(
        error,
        "No fue posible eliminar el registro clínico.",
      );
    } finally {
      setActionLoading(false);
    }
  };


  const handleSavePatient = async (formData) => {
    const isEdit =
      formMode === "edit" &&
      selectedPatientResolved;

    const payload = {
      nombres: formData.nombres.trim(),
      apellido_pat:
        formData.apellido_pat.trim(),
      apellido_mat:
        formData.apellido_mat.trim(),
      fecha_nac: formData.fecha_nac || null,
      genero: formData.genero || "",
      telefono: formData.telefono.trim(),
      correo: formData.correo.trim(),
      molestia: formData.molestia.trim(),
      notas: formData.notas.trim(),
      estado_tratamiento:
        formData.estado_tratamiento ||
        "en_tratamiento",
      fecha_alta:
        formData.estado_tratamiento ===
          "alta"
          ? formData.fecha_alta || null
          : null,
    };

    if (
      !isEdit &&
      patients[0]?.clinica
    ) {
      payload.clinica =
        patients[0].clinica;
    }

    try {
      setActionLoading(true);

      let saved = isEdit
        ? await pacientesApi.actualizar(
          selectedPatientResolved.id,
          payload,
        )
        : await pacientesApi.crear(payload);

      if (formData._photoFile) {
        saved =
          await pacientesApi.subirFoto(
            saved.id,
            formData._photoFile,
          );
      } else if (
        isEdit &&
        formData._removePhoto
      ) {
        saved =
          await pacientesApi.eliminarFoto(
            saved.id,
          );
      }

      if (isEdit) {
        syncPatient(saved);
      } else {
        setPatients((current) => [
          ...current,
          saved,
        ]);
      }

      await refreshSummaryAndBirthdays();

      setFormOpen(false);
      setSelectedPatient(null);
    } catch (error) {
      showError(
        error,
        "No fue posible guardar el paciente.",
      );
    } finally {
      setActionLoading(false);
    }
  };


  const confirmDeletePatient = async (
    patient,
    deleteAppointments,
  ) => {
    try {
      setActionLoading(true);

      await pacientesApi.eliminar(
        patient.id,
        deleteAppointments,
      );

      setPatients((current) =>
        current.filter(
          (item) => item.id !== patient.id,
        ),
      );

      setCitas((current) =>
        current.filter(
          (cita) =>
            cita.paciente !== patient.id,
        ),
      );

      setBirthdays((current) =>
        current.filter(
          (item) => item.id !== patient.id,
        ),
      );

      setProfileOpen(false);
      setSelectedPatient(null);
      setDeleteOpen(false);
      setDeleteTarget(null);

      await refreshSummaryAndBirthdays();
    } catch (error) {
      if (error?.status === 409) {
        window.alert(
          "Este paciente tiene citas asociadas. Marca la opción para eliminar también sus citas.",
        );
      } else {
        showError(
          error,
          "No fue posible eliminar el paciente.",
        );
      }
    } finally {
      setActionLoading(false);
    }
  };


  const FiltersUI = (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-black text-slate-800">
          Filtros avanzados
        </h2>
        <p className="mt-0.5 text-[11px] text-slate-400">
          Segmenta la base de pacientes.
        </p>
      </div>

      <FilterBlock title="Localidad">
        <select
          className="filter-input"
          value={filterBranch}
          onChange={(event) =>
            setFilterBranch(event.target.value)
          }
        >
          <option value="Todos">
            Todos
          </option>

          {branchesForFilter.map((branch) => (
            <option
              key={branch}
              value={branch}
            >
              {branch}
            </option>
          ))}
        </select>
      </FilterBlock>

      <FilterBlock title="Profesional">
        <select
          className="filter-input"
          value={filterProfessional}
          onChange={(event) =>
            setFilterProfessional(
              event.target.value,
            )
          }
        >
          <option value="Todos">
            Todos
          </option>

          {professionals.map(
            (professional) => (
              <option
                key={professional.id}
                value={professional.id}
              >
                {getProfessionalLabel(
                  professional,
                )}
              </option>
            ),
          )}
        </select>
      </FilterBlock>

      <FilterBlock title="Servicio">
        <select
          className="filter-input"
          value={filterService}
          onChange={(event) =>
            setFilterService(
              event.target.value,
            )
          }
        >
          <option value="Todos">
            Todos
          </option>

          {servicesForFilter.map(
            (service) => (
              <option
                key={service}
                value={service}
              >
                {service}
              </option>
            ),
          )}
        </select>
      </FilterBlock>

      <FilterBlock title="Estado de la reserva">
        <select
          className="filter-input"
          value={filterStatus}
          onChange={(event) =>
            setFilterStatus(
              event.target.value,
            )
          }
        >
          <option value="Todos">
            Todos
          </option>
          <option value="Con reservas">
            Con reservas
          </option>
          <option value="Sin reservas">
            Sin reservas
          </option>
        </select>
      </FilterBlock>

      <FilterBlock title="Pacientes creados en el periodo">
        <div className="space-y-2">
          <input
            type="date"
            className="filter-input"
            value={filterStartDate}
            onChange={(event) =>
              setFilterStartDate(
                event.target.value,
              )
            }
          />

          <input
            type="date"
            className="filter-input"
            value={filterEndDate}
            onChange={(event) =>
              setFilterEndDate(
                event.target.value,
              )
            }
          />
        </div>
      </FilterBlock>

      <button
        onClick={clearFilters}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 transition hover:bg-slate-50"
      >
        <RefreshCw size={14} />
        Limpiar filtros
      </button>
    </div>
  );


  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw
            size={25}
            className="mx-auto animate-spin text-blue-600"
          />
          <p className="mt-3 text-sm font-semibold text-slate-600">
            Cargando pacientes...
          </p>
        </div>
      </div>
    );
  }


  return (
    <>
      <style>{`
        .filter-input{width:100%;height:40px;border-radius:10px;border:1px solid rgb(226 232 240);background:white;padding:0 12px;font-size:12px;color:rgb(51 65 85);outline:none;transition:.2s}
        .filter-input:focus{border-color:rgb(99 102 241);box-shadow:0 0 0 3px rgb(99 102 241 / .10)}
        .form-control{width:100%;height:42px;border-radius:11px;border:1px solid rgb(226 232 240);background:white;padding:0 12px;font-size:12px;font-weight:500;color:rgb(51 65 85);outline:none;transition:.2s}
        .form-control:focus{border-color:rgb(99 102 241);box-shadow:0 0 0 4px rgb(99 102 241 / .10)}
      `}</style>

      <div className="min-h-full w-full bg-[#f6f7fb] p-4 sm:p-5 xl:p-6">
        <div className="mx-auto max-w-[1750px]">
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-[22px] font-black tracking-tight text-slate-900">
                Pacientes
              </h1>

              <div className="mt-1 flex items-center gap-2 text-[11px] font-medium text-slate-400">
                <span>
                  Panel administrativo
                </span>
                <span>›</span>
                <span className="text-slate-600">
                  Pacientes
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  setFiltersOpen(true)
                }
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
              >
                <SlidersHorizontal
                  size={15}
                />
                Filtros
              </button>

              <button
                onClick={loadMainData}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <RefreshCw size={15} />
                Actualizar
              </button>

              <button
                onClick={handleOpenCreate}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#3047e8] px-4 text-xs font-black text-white shadow-sm transition hover:bg-[#263bd0]"
              >
                <Plus size={16} />
                Nuevo paciente
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Base de pacientes"
              value={metrics.total}
              helper="Total registrados"
              icon={Users}
              iconClass="bg-indigo-50 text-indigo-600"
            />

            <KpiCard
              label="En tratamiento"
              value={metrics.treatment}
              helper="Pacientes activos"
              icon={HeartPulse}
              iconClass="bg-emerald-50 text-emerald-600"
            />

            <KpiCard
              label="Sesiones realizadas"
              value={metrics.appointments}
              helper="Citas registradas"
              icon={ClipboardList}
              iconClass="bg-blue-50 text-blue-600"
            />

            <KpiCard
              label="Dados de alta"
              value={metrics.discharged}
              helper="Tratamientos concluidos"
              icon={BadgeCheck}
              iconClass="bg-amber-50 text-amber-600"
            />
          </div>

          <BirthdayPanel
            birthdays={birthdays}
            onOpenPatient={(birthday) => {
              const patient =
                enhancedPatients.find(
                  (item) =>
                    item.id === birthday.id,
                );

              if (patient) {
                handleOpenProfile(patient);
              }
            }}
          />

          <div className="mt-4 grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)]">
            <aside className="hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:block">
              {FiltersUI}
            </aside>

            <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-black text-slate-800">
                    Base de pacientes
                  </h2>

                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {filteredPatients.length} paciente
                    {filteredPatients.length ===
                      1
                      ? ""
                      : "s"}{" "}
                    encontrado
                    {filteredPatients.length ===
                      1
                      ? ""
                      : "s"}
                    .
                  </p>
                </div>

                <button
                  onClick={handleOpenCreate}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#3047e8] px-3 text-[11px] font-black text-white transition hover:bg-[#263bd0]"
                >
                  <Plus size={14} />
                  Nuevo paciente
                </button>
              </div>

              <div className="border-b border-slate-100 p-4">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value,
                      )
                    }
                    placeholder="Buscar por nombre, apellido, email o teléfono..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-xs font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px]">
                  <thead className="border-b border-slate-200 bg-[#fafbfc]">
                    <tr>
                      <Th>Paciente</Th>
                      <Th>Correo</Th>
                      <Th>Teléfono</Th>
                      <Th>Servicio</Th>
                      <Th>Estado</Th>
                      <Th className="text-center">
                        Opciones
                      </Th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedPatients.map(
                      (patient) => {
                        const birthday =
                          getPatientBirthdayInfo(
                            patient,
                          );

                        return (
                          <tr
                            key={patient.id}
                            className={`border-b border-slate-100 transition hover:bg-slate-50/80 ${birthday.isToday
                                ? "bg-amber-50/40"
                                : ""
                              }`}
                          >
                            <Td>
                              <div className="flex min-w-[220px] items-center gap-3">
                                <PatientAvatar
                                  patient={
                                    patient
                                  }
                                  photoUrl={
                                    patient.foto_url
                                  }
                                  size="sm"
                                />

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() =>
                                        handleOpenProfile(
                                          patient,
                                        )
                                      }
                                      className="truncate text-left text-[11px] font-black uppercase text-slate-800 hover:text-indigo-600"
                                    >
                                      {patient.fullName ||
                                        "Sin nombre"}
                                    </button>

                                    {birthday.isToday && (
                                      <span
                                        title="¡Hoy es su cumpleaños!"
                                        className="inline-flex h-6 items-center gap-1 rounded-full bg-amber-100 px-2 text-[10px] font-black text-amber-700 ring-1 ring-amber-200"
                                      >
                                        <Cake
                                          size={
                                            13
                                          }
                                        />
                                        Cumple
                                      </span>
                                    )}
                                  </div>

                                  <p className="mt-0.5 text-[10px] text-slate-400">
                                    ID: FIS-
                                    {String(
                                      patient.id,
                                    ).padStart(
                                      6,
                                      "0",
                                    )}
                                  </p>
                                </div>
                              </div>
                            </Td>

                            <Td>
                              {patient.correo ||
                                "—"}
                            </Td>

                            <Td>
                              {patient.telefono ||
                                "—"}
                            </Td>

                            <Td>
                              {patient.lastServiceName ||
                                "Sin sesiones"}
                            </Td>

                            <Td>
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${patient.estado_tratamiento ===
                                    "alta"
                                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                    : "bg-amber-50 text-amber-700 ring-amber-200"
                                  }`}
                              >
                                {estadoTratamientoLabel(
                                  patient.estado_tratamiento,
                                )}
                              </span>
                            </Td>

                            <Td className="text-center">
                              <div className="inline-flex gap-1.5">
                                <TableButton
                                  onClick={() =>
                                    handleOpenProfile(
                                      patient,
                                    )
                                  }
                                >
                                  Ver
                                </TableButton>

                                <TableButton
                                  onClick={() =>
                                    handleOpenEdit(
                                      patient,
                                    )
                                  }
                                >
                                  Editar
                                </TableButton>

                                <TableButton
                                  danger
                                  onClick={() =>
                                    handleDeletePatient(
                                      patient,
                                    )
                                  }
                                >
                                  Eliminar
                                </TableButton>
                              </div>
                            </Td>
                          </tr>
                        );
                      },
                    )}

                    {!paginatedPatients.length && (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-14 text-center"
                        >
                          <Users
                            size={32}
                            className="mx-auto text-slate-300"
                          />
                          <p className="mt-3 text-sm font-bold text-slate-500">
                            No encontramos
                            pacientes
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Cambia los filtros o
                            la búsqueda.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {!!filteredPatients.length && (
                <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[11px] font-medium text-slate-400">
                    Mostrando{" "}
                    {(currentPage - 1) *
                      PAGE_SIZE +
                      1}{" "}
                    a{" "}
                    {Math.min(
                      currentPage *
                      PAGE_SIZE,
                      filteredPatients.length,
                    )}{" "}
                    de{" "}
                    {
                      filteredPatients.length
                    }{" "}
                    pacientes
                  </p>

                  <div className="flex items-center gap-1.5">
                    <PaginationButton
                      disabled={
                        currentPage === 1
                      }
                      onClick={() =>
                        setPage((value) =>
                          Math.max(
                            1,
                            value - 1,
                          ),
                        )
                      }
                    >
                      <ChevronLeft
                        size={14}
                      />
                    </PaginationButton>

                    {visiblePages.map(
                      (pageNumber) => (
                        <PaginationButton
                          key={pageNumber}
                          active={
                            pageNumber ===
                            currentPage
                          }
                          onClick={() =>
                            setPage(
                              pageNumber,
                            )
                          }
                        >
                          {pageNumber}
                        </PaginationButton>
                      ),
                    )}

                    <PaginationButton
                      disabled={
                        currentPage ===
                        totalPages
                      }
                      onClick={() =>
                        setPage((value) =>
                          Math.min(
                            totalPages,
                            value + 1,
                          ),
                        )
                      }
                    >
                      <ChevronRight
                        size={14}
                      />
                    </PaginationButton>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
            onClick={() =>
              setFiltersOpen(false)
            }
          />

          <div className="absolute left-0 top-0 h-full w-[88%] max-w-sm overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Filtros
                </h3>
                <p className="text-[11px] text-slate-400">
                  Filtra tu base de
                  pacientes.
                </p>
              </div>

              <button
                onClick={() =>
                  setFiltersOpen(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                <X size={16} />
              </button>
            </div>

            {FiltersUI}

            <button
              onClick={() =>
                setFiltersOpen(false)
              }
              className="mt-5 h-10 w-full rounded-xl bg-indigo-600 text-xs font-black text-white"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      )}

      {profileOpen &&
        profilePatient && (
          <PatientProfileModal
            patient={profilePatient}
            data={profileData}
            loading={profileLoading}
            actionLoading={
              actionLoading
            }
            onClose={() =>
              setProfileOpen(false)
            }
            onEdit={() => {
              setProfileOpen(false);
              handleOpenEdit(
                profilePatient,
              );
            }}
            onChangePhoto={(file) =>
              handleChangePatientPhoto(
                profilePatient.id,
                file,
              )
            }
            onRemovePhoto={() =>
              handleRemovePatientPhoto(
                profilePatient.id,
              )
            }
            onAddDocuments={(
              files,
              type,
            ) =>
              handleAddDocuments(
                profilePatient.id,
                files,
                type,
              )
            }
            onRemoveDocument={(id) =>
              handleRemoveDocument(
                profilePatient.id,
                id,
              )
            }
            onAddClinicalEntry={(
              entry,
            ) =>
              handleAddClinicalEntry(
                profilePatient.id,
                entry,
              )
            }
            onRemoveClinicalEntry={(
              id,
            ) =>
              handleRemoveClinicalEntry(
                profilePatient.id,
                id,
              )
            }
          />
        )}

      {formOpen && (
        <PatientFormModal
          mode={formMode}
          patient={
            formMode === "edit"
              ? selectedPatientResolved
              : null
          }
          loading={actionLoading}
          onClose={() => {
            setFormOpen(false);
            setSelectedPatient(null);
          }}
          onSave={handleSavePatient}
        />
      )}

      {deleteOpen &&
        deleteTarget && (
          <DeleteConfirmModal
            patient={deleteTarget}
            appointmentCount={
              Number(
                deleteTarget.total_citas ||
                deleteTarget._citas
                  ?.length ||
                0,
              )
            }
            loading={actionLoading}
            onClose={() => {
              setDeleteOpen(false);
              setDeleteTarget(null);
            }}
            onConfirm={(
              deleteAppointments,
            ) =>
              confirmDeletePatient(
                deleteTarget,
                deleteAppointments,
              )
            }
          />
        )}
    </>
  );
}


function BirthdayPanel({
  birthdays,
  onOpenPatient,
}) {
  if (!birthdays.length) {
    return null;
  }

  return (
    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <Cake size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-black text-slate-800">
            Cumpleaños próximos
          </h3>

          <p className="mt-1 text-[11px] text-slate-500">
            Pacientes que cumplen años
            durante los próximos 7 días.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {birthdays.map(
              (birthday) => (
                <button
                  key={birthday.id}
                  onClick={() =>
                    onOpenPatient(
                      birthday,
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-3 py-2 text-left transition hover:border-amber-300 hover:bg-amber-50"
                >
                  <PatientAvatar
                    patient={birthday}
                    photoUrl={
                      birthday.foto_url
                    }
                    size="sm"
                  />

                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-700">
                      {getFullName(
                        birthday,
                      )}
                    </p>

                    <p className="mt-0.5 text-[10px] font-bold text-amber-700">
                      {birthday.dias_para_cumple ===
                        0
                        ? "Cumple hoy"
                        : `En ${birthday.dias_para_cumple} día${birthday.dias_para_cumple === 1 ? "" : "s"}`}
                    </p>
                  </div>
                </button>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


const PROFILE_SECTIONS = [
  {
    key: "general",
    label: "Información general",
    icon: UserRound,
  },
  {
    key: "clinical",
    label: "Historial clínico",
    icon: HeartPulse,
  },
  {
    key: "appointments",
    label: "Citas y sesiones",
    icon: CalendarDays,
  },
  {
    key: "evaluations",
    label: "Evaluaciones",
    icon: ClipboardList,
  },
  {
    key: "documents",
    label: "Documentos",
    icon: FolderOpen,
  },
  {
    key: "billing",
    label: "Facturación",
    icon: FileText,
  },
  {
    key: "notes",
    label: "Notas",
    icon: Pencil,
  },
  {
    key: "reminders",
    label: "Recordatorios",
    icon: CalendarDays,
  },
];


function PatientProfileModal({
  patient,
  data,
  loading,
  actionLoading,
  onClose,
  onEdit,
  onChangePhoto,
  onRemovePhoto,
  onAddDocuments,
  onRemoveDocument,
  onAddClinicalEntry,
  onRemoveClinicalEntry,
}) {
  const [section, setSection] =
    useState("general");

  const citasPaciente = useMemo(() => {
    const list = Array.isArray(data?.citas)
      ? data.citas
      : [];

    return [...list].sort((a, b) => {
      const keyA = `${a.fecha || ""}T${a.hora_inicio || ""}`;
      const keyB = `${b.fecha || ""}T${b.hora_inicio || ""}`;

      return keyB.localeCompare(keyA);
    });
  }, [data?.citas]);

  const lastAppointment =
    citasPaciente[0];

  const birthday =
    getPatientBirthdayInfo(patient);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-3 backdrop-blur-sm sm:p-5">
      <div
        className="absolute inset-0"
        onClick={onClose}
      />

      <div className="relative z-10 flex h-[94vh] w-full max-w-[1450px] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-[#f8f9fc] shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-black text-slate-900">
              Expediente del paciente
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Consulta la información
              médica, documentos y
              sesiones.
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
          >
            <X size={19} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <aside className="w-full shrink-0 border-b border-slate-200 bg-white p-4 lg:w-[280px] lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-4 lg:flex-col lg:text-center">
              <div className="relative shrink-0">
                <PatientAvatar
                  patient={patient}
                  photoUrl={
                    patient.foto_url
                  }
                  size="xl"
                />

                <label
                  className={`absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-indigo-600 text-white shadow-md transition hover:bg-indigo-700 ${actionLoading
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                    }`}
                  title="Cambiar fotografía"
                >
                  <Camera size={15} />

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={
                      actionLoading
                    }
                    onChange={(event) => {
                      onChangePhoto(
                        event.target
                          .files?.[0],
                      );
                      event.target.value =
                        "";
                    }}
                  />
                </label>
              </div>

              <div className="min-w-0">
                <h3 className="truncate text-base font-black uppercase text-slate-900">
                  {getFullName(patient)}
                </h3>

                <div className="mt-2 flex flex-wrap items-center gap-2 lg:justify-center">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-black ring-1 ${patient.estado_tratamiento ===
                        "alta"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : "bg-amber-50 text-amber-700 ring-amber-200"
                      }`}
                  >
                    {estadoTratamientoLabel(
                      patient.estado_tratamiento,
                    )}
                  </span>

                  {birthday.isToday && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-700 ring-1 ring-amber-200">
                      <Cake size={12} />
                      Cumpleaños
                    </span>
                  )}
                </div>

                <p className="mt-2 text-[10px] font-medium text-slate-400">
                  ID: FIS-
                  {String(
                    patient.id,
                  ).padStart(6, "0")}
                </p>
              </div>
            </div>

            <div className="mt-5 flex gap-2 lg:flex-col">
              <button
                onClick={onEdit}
                disabled={actionLoading}
                className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-[11px] font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <Pencil size={13} />
                Editar
              </button>

              {patient.foto_url && (
                <button
                  onClick={onRemovePhoto}
                  disabled={actionLoading}
                  className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 text-[11px] font-black text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                >
                  <Trash2 size={13} />
                  Quitar foto
                </button>
              )}
            </div>

            <div className="mt-5 hidden space-y-1 lg:block">
              {PROFILE_SECTIONS.map(
                ({
                  key,
                  label,
                  icon: Icon,
                }) => (
                  <button
                    key={key}
                    onClick={() =>
                      setSection(key)
                    }
                    className={`flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[11px] font-bold transition ${section === key
                        ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                      }`}
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                ),
              )}
            </div>

            <select
              value={section}
              onChange={(event) =>
                setSection(
                  event.target.value,
                )
              }
              className="mt-4 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 lg:hidden"
            >
              {PROFILE_SECTIONS.map(
                (item) => (
                  <option
                    key={item.key}
                    value={item.key}
                  >
                    {item.label}
                  </option>
                ),
              )}
            </select>
          </aside>

          <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
            {loading ? (
              <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                  <RefreshCw
                    size={24}
                    className="mx-auto animate-spin text-indigo-600"
                  />
                  <p className="mt-3 text-xs font-bold text-slate-500">
                    Cargando expediente...
                  </p>
                </div>
              </div>
            ) : (
              <>
                {section ===
                  "general" && (
                    <GeneralSection
                      patient={patient}
                      citasPaciente={
                        citasPaciente
                      }
                      lastAppointment={
                        lastAppointment
                      }
                    />
                  )}

                {section ===
                  "clinical" && (
                    <ClinicalHistorySection
                      entries={
                        data.historial_clinico ||
                        []
                      }
                      disabled={
                        actionLoading
                      }
                      onAdd={
                        onAddClinicalEntry
                      }
                      onRemove={
                        onRemoveClinicalEntry
                      }
                    />
                  )}

                {section ===
                  "appointments" && (
                    <AppointmentsSection
                      appointments={
                        citasPaciente
                      }
                    />
                  )}

                {section ===
                  "documents" && (
                    <DocumentsSection
                      documents={
                        data.documentos || []
                      }
                      disabled={
                        actionLoading
                      }
                      onAdd={
                        onAddDocuments
                      }
                      onRemove={
                        onRemoveDocument
                      }
                    />
                  )}

                {section ===
                  "evaluations" && (
                    <EmptySection
                      title="Evaluaciones"
                      description="La interfaz está preparada para conectar evaluaciones clínicas posteriormente."
                      icon={
                        ClipboardList
                      }
                    />
                  )}

                {section ===
                  "billing" && (
                    <EmptySection
                      title="Facturación"
                      description="Este apartado requiere definir el endpoint de pagos/facturas por paciente."
                      icon={FileText}
                    />
                  )}

                {section ===
                  "notes" && (
                    <NotesSection
                      patient={patient}
                    />
                  )}

                {section ===
                  "reminders" && (
                    <EmptySection
                      title="Recordatorios"
                      description="Aquí podremos agregar seguimientos, recordatorios de cita y tareas pendientes cuando exista su modelo de backend."
                      icon={
                        CalendarDays
                      }
                    />
                  )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}


function GeneralSection({
  patient,
  citasPaciente,
  lastAppointment,
}) {
  return (
    <div>
      <SectionTitle
        title="Información general"
        description="Datos generales y expediente de citas del paciente."
      />

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(320px,.8fr)_minmax(520px,1.5fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xs font-black text-slate-800">
            Información del paciente
          </h3>

          <div className="mt-5 space-y-4">
            <InfoRow
              icon={UserRound}
              label="Nombre completo"
            >
              {getFullName(patient)}
            </InfoRow>

            <InfoRow
              icon={Mail}
              label="Correo"
            >
              {patient.correo || "—"}
            </InfoRow>

            <InfoRow
              icon={Phone}
              label="Teléfono"
            >
              {patient.telefono || "—"}
            </InfoRow>

            <InfoRow
              icon={Cake}
              label="Fecha de nacimiento"
            >
              {formatDateMX(
                patient.fecha_nac,
              )}
            </InfoRow>

            <InfoRow
              icon={UserRound}
              label="Género"
            >
              {patient.genero || "—"}
            </InfoRow>

            <InfoRow
              icon={CalendarDays}
              label="Registrado"
            >
              {formatDateMX(
                patient.registro,
              )}
            </InfoRow>

            <InfoRow
              icon={HeartPulse}
              label="Estado"
            >
              {estadoTratamientoLabel(
                patient.estado_tratamiento,
              )}
            </InfoRow>

            <InfoRow
              icon={BadgeCheck}
              label="Fecha de alta"
            >
              {patient.estado_tratamiento ===
                "alta"
                ? formatDateMX(
                  patient.fecha_alta,
                )
                : "—"}
            </InfoRow>

            <InfoRow
              icon={ClipboardList}
              label="Último servicio"
            >
              {lastAppointment?.servicio_nombre ||
                patient.ultimo_servicio ||
                patient.lastServiceName ||
                "Sin registros"}
            </InfoRow>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
              Motivo / molestia
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              {patient.molestia ||
                "Sin información registrada."}
            </p>

            <p className="mt-4 text-[10px] font-black uppercase tracking-wide text-slate-400">
              Notas
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              {patient.notas ||
                "Sin notas registradas."}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="text-xs font-black text-slate-800">
                Expediente clínico
              </h3>
              <p className="mt-1 text-[11px] text-slate-400">
                Historial de citas
                registradas a nombre del
                paciente.
              </p>
            </div>

            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-black text-indigo-600">
              {citasPaciente.length} sesiones
            </span>
          </div>

          <div className="max-h-[520px] overflow-auto">
            {citasPaciente.length ? (
              <table className="w-full min-w-[760px]">
                <thead className="sticky top-0 border-b border-slate-200 bg-[#fafbfc]">
                  <tr>
                    <Th>Fecha</Th>
                    <Th>Hora</Th>
                    <Th>Servicio</Th>
                    <Th>
                      Profesional
                    </Th>
                    <Th>Estado</Th>
                  </tr>
                </thead>

                <tbody>
                  {citasPaciente.map(
                    (cita) => (
                      <tr
                        key={cita.id}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <Td>
                          {formatDateMX(
                            cita.fecha,
                          )}
                        </Td>

                        <Td>
                          {formatTimeHM(
                            cita.hora_inicio,
                          )}{" "}
                          -{" "}
                          {formatTimeHM(
                            cita.hora_termina,
                          )}
                        </Td>

                        <Td>
                          {cita.servicio_nombre ||
                            "—"}
                        </Td>

                        <Td>
                          {cita.profesional_nombre ||
                            "—"}
                        </Td>

                        <Td>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                            {cita.estado ||
                              "—"}
                          </span>
                        </Td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            ) : (
              <EmptyInside
                icon={CalendarDays}
                title="Sin citas registradas"
                text="Las sesiones del paciente aparecerán aquí."
              />
            )}
          </div>

          <div className="flex justify-end border-t border-slate-100 p-4">
            <button
              onClick={() =>
                window.print()
              }
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-600 hover:bg-slate-50"
            >
              <Printer size={14} />
              Imprimir expediente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


function AppointmentsSection({
  appointments,
}) {
  return (
    <div>
      <SectionTitle
        title="Citas y sesiones"
        description="Historial completo de sesiones relacionadas con el paciente."
      />

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {appointments.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead className="border-b border-slate-200 bg-[#fafbfc]">
                <tr>
                  <Th>Fecha</Th>
                  <Th>Horario</Th>
                  <Th>Servicio</Th>
                  <Th>Profesional</Th>
                  <Th>Estado</Th>
                </tr>
              </thead>

              <tbody>
                {appointments.map(
                  (cita) => (
                    <tr
                      key={cita.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <Td>
                        {formatDateMX(
                          cita.fecha,
                        )}
                      </Td>

                      <Td>
                        {formatTimeHM(
                          cita.hora_inicio,
                        )}{" "}
                        -{" "}
                        {formatTimeHM(
                          cita.hora_termina,
                        )}
                      </Td>

                      <Td>
                        {cita.servicio_nombre ||
                          "—"}
                      </Td>

                      <Td>
                        {cita.profesional_nombre ||
                          "—"}
                      </Td>

                      <Td>
                        {cita.estado || "—"}
                      </Td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyInside
            icon={CalendarDays}
            title="Sin citas registradas"
            text="Las sesiones aparecerán aquí cuando existan."
          />
        )}
      </div>
    </div>
  );
}


function ClinicalHistorySection({
  entries,
  disabled,
  onAdd,
  onRemove,
}) {
  const [form, setForm] = useState({
    fecha: todayISO(),
    titulo: "",
    descripcion: "",
  });

  const submit = async (event) => {
    event.preventDefault();

    if (
      !form.titulo.trim() ||
      !form.descripcion.trim()
    ) {
      return;
    }

    await onAdd({
      fecha: form.fecha || todayISO(),
      titulo: form.titulo.trim(),
      descripcion:
        form.descripcion.trim(),
    });

    setForm({
      fecha: todayISO(),
      titulo: "",
      descripcion: "",
    });
  };

  return (
    <div>
      <SectionTitle
        title="Historial clínico"
        description="Registra antecedentes, evolución, indicaciones o notas clínicas."
      />

      <div className="mt-5 grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <form
          onSubmit={submit}
          className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h3 className="text-xs font-black text-slate-800">
            Agregar registro clínico
          </h3>

          <div className="mt-4">
            <Field label="Fecha">
              <input
                type="date"
                className="form-control"
                value={form.fecha}
                disabled={disabled}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fecha:
                      event.target.value,
                  }))
                }
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Título">
              <input
                className="form-control"
                placeholder="Ej. Valoración inicial"
                value={form.titulo}
                disabled={disabled}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    titulo:
                      event.target.value,
                  }))
                }
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Descripción">
              <textarea
                rows={6}
                className="form-control !h-auto resize-none py-3"
                placeholder="Antecedentes, evolución, diagnóstico, indicaciones..."
                value={
                  form.descripcion
                }
                disabled={disabled}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    descripcion:
                      event.target.value,
                  }))
                }
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={disabled}
            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-xs font-black text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {disabled ? (
              <RefreshCw
                size={15}
                className="animate-spin"
              />
            ) : (
              <Plus size={15} />
            )}

            Agregar al historial
          </button>
        </form>

        <div className="space-y-3">
          {entries.length ? (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-black text-slate-800">
                        {entry.titulo}
                      </h4>

                      <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-600">
                        {formatDateMX(
                          entry.fecha,
                        )}
                      </span>
                    </div>

                    <p className="mt-3 whitespace-pre-line text-xs leading-5 text-slate-600">
                      {
                        entry.descripcion
                      }
                    </p>

                    {entry.profesional_nombre && (
                      <p className="mt-3 text-[10px] font-bold text-slate-400">
                        Registrado por{" "}
                        {
                          entry.profesional_nombre
                        }
                      </p>
                    )}
                  </div>

                  <button
                    disabled={disabled}
                    onClick={() =>
                      onRemove(
                        entry.id,
                      )
                    }
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-rose-500 transition hover:bg-rose-50 disabled:opacity-40"
                  >
                    <Trash2
                      size={14}
                    />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <EmptyInside
              icon={HeartPulse}
              title="Sin registros clínicos"
              text="Agrega el primer registro del historial del paciente."
            />
          )}
        </div>
      </div>
    </div>
  );
}


function DocumentsSection({
  documents,
  disabled,
  onAdd,
  onRemove,
}) {
  const [documentType, setDocumentType] =
    useState("otro");

  return (
    <div>
      <SectionTitle
        title="Documentos"
        description="Historias clínicas, estudios, consentimientos, recetas y documentos del paciente."
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-[220px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <Field label="Tipo de documento">
            <select
              className="form-control"
              value={documentType}
              disabled={disabled}
              onChange={(event) =>
                setDocumentType(
                  event.target.value,
                )
              }
            >
              <option value="historia_clinica">
                Historia clínica
              </option>
              <option value="estudio">
                Estudio
              </option>
              <option value="consentimiento">
                Consentimiento
              </option>
              <option value="receta">
                Receta
              </option>
              <option value="otro">
                Otro
              </option>
            </select>
          </Field>
        </div>

        <label
          className={`flex min-h-[150px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-6 text-center transition hover:bg-indigo-50 ${disabled
              ? "pointer-events-none opacity-50"
              : "cursor-pointer"
            }`}
        >
          <UploadCloud
            size={30}
            className="text-indigo-500"
          />

          <p className="mt-3 text-sm font-black text-slate-700">
            Cargar documentos
          </p>

          <p className="mt-1 text-xs text-slate-400">
            PDF, Word, JPG, PNG o WEBP ·
            máximo 15 MB por archivo
          </p>

          <span className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-[11px] font-black text-white">
            Seleccionar archivos
          </span>

          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
            className="hidden"
            disabled={disabled}
            onChange={(event) => {
              onAdd(
                event.target.files,
                documentType,
              );
              event.target.value = "";
            }}
          />
        </label>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-xs font-black text-slate-800">
            Archivos del paciente
          </h3>

          <p className="mt-1 text-[11px] text-slate-400">
            {documents.length} archivo(s).
          </p>
        </div>

        {documents.length ? (
          <div className="divide-y divide-slate-100">
            {documents.map(
              (document) => (
                <div
                  key={document.id}
                  className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <FileText
                        size={18}
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-slate-700">
                        {
                          document.nombre_original
                        }
                      </p>

                      <p className="mt-1 text-[10px] text-slate-400">
                        {formatFileSize(
                          document.tamano,
                        )}{" "}
                        ·{" "}
                        {document.tipo ||
                          "otro"}{" "}
                        · agregado{" "}
                        {formatDateMX(
                          document.creado,
                        )}
                      </p>

                      {document.subido_por_nombre && (
                        <p className="mt-1 text-[10px] text-slate-400">
                          Por{" "}
                          {
                            document.subido_por_nombre
                          }
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={
                        document.archivo_url
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[10px] font-black text-slate-600 hover:bg-slate-50"
                    >
                      <Download
                        size={12}
                      />
                      Abrir
                    </a>

                    <button
                      disabled={
                        disabled
                      }
                      onClick={() =>
                        onRemove(
                          document.id,
                        )
                      }
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-[10px] font-black text-rose-600 hover:bg-rose-100 disabled:opacity-40"
                    >
                      <Trash2
                        size={12}
                      />
                      Eliminar
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        ) : (
          <EmptyInside
            icon={FolderOpen}
            title="Sin documentos"
            text="Todavía no se han agregado archivos al expediente."
          />
        )}
      </div>
    </div>
  );
}


function NotesSection({ patient }) {
  return (
    <div>
      <SectionTitle
        title="Notas"
        description="Notas administrativas guardadas directamente en el expediente del paciente."
      />

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
          Notas actuales
        </p>

        <p className="mt-3 whitespace-pre-line text-xs leading-6 text-slate-600">
          {patient.notas ||
            "Sin notas registradas. Puedes editarlas desde “Editar paciente”."}
        </p>
      </div>
    </div>
  );
}


function PatientFormModal({
  mode,
  patient,
  loading,
  onClose,
  onSave,
}) {
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    nombres: patient?.nombres ?? "",
    apellido_pat:
      patient?.apellido_pat ?? "",
    apellido_mat:
      patient?.apellido_mat ?? "",
    correo: patient?.correo ?? "",
    telefono: patient?.telefono ?? "",
    fecha_nac:
      patient?.fecha_nac ?? "",
    genero: patient?.genero ?? "",
    molestia:
      patient?.molestia ?? "",
    notas: patient?.notas ?? "",
    estado_tratamiento:
      patient?.estado_tratamiento ??
      "en_tratamiento",
    fecha_alta:
      patient?.fecha_alta ?? "",
  });

  const [photoPreview, setPhotoPreview] =
    useState(patient?.foto_url || "");

  const [photoFile, setPhotoFile] =
    useState(null);

  const [removePhoto, setRemovePhoto] =
    useState(false);


  const change = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };


  const selectPhoto = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      window.alert(
        "Selecciona una imagen válida.",
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      window.alert(
        "La fotografía no debe superar 5 MB.",
      );
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setPhotoPreview(reader.result);
      setPhotoFile(file);
      setRemovePhoto(false);
    };

    reader.readAsDataURL(file);
  };


  const submit = async (event) => {
    event.preventDefault();

    await onSave({
      ...form,
      _photoFile: photoFile,
      _removePhoto: removePhoto,
    });
  };


  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/40 p-3 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={() =>
          !loading && onClose()
        }
      />

      <div className="relative z-10 max-h-[94vh] w-full max-w-5xl overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-black text-slate-900">
              {isEdit
                ? "Editar paciente"
                : "Nuevo paciente"}
            </h2>

            <p className="mt-0.5 text-[11px] text-slate-400">
              {isEdit
                ? "Actualiza la información del expediente."
                : "Registra un nuevo paciente en la clínica."}
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={submit}
          className="max-h-[calc(94vh-70px)] overflow-y-auto p-5 sm:p-6"
        >
          <div className="mb-6 flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:flex-row">
            <PatientAvatar
              patient={
                patient || {
                  nombres: form.nombres,
                  apellido_pat:
                    form.apellido_pat,
                }
              }
              photoUrl={photoPreview}
              size="lg"
            />

            <div className="text-center sm:text-left">
              <p className="text-xs font-black text-slate-700">
                Fotografía de perfil
              </p>

              <p className="mt-1 text-[11px] text-slate-400">
                JPG, PNG, WEBP y otros
                formatos de imagen válidos,
                hasta 5 MB.
              </p>

              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <label
                  className={`inline-flex h-9 items-center gap-2 rounded-xl bg-indigo-600 px-3 text-[11px] font-black text-white hover:bg-indigo-700 ${loading
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                    }`}
                >
                  <Camera size={14} />
                  Seleccionar foto

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={loading}
                    onChange={(event) => {
                      selectPhoto(
                        event.target
                          .files?.[0],
                      );
                      event.target.value =
                        "";
                    }}
                  />
                </label>

                {photoPreview && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setPhotoPreview("");
                      setPhotoFile(null);
                      setRemovePhoto(
                        Boolean(
                          patient?.foto_url,
                        ),
                      );
                    }}
                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-[11px] font-black text-rose-600 disabled:opacity-50"
                  >
                    <Trash2
                      size={13}
                    />
                    Quitar
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre(s)">
              <input
                className="form-control"
                value={form.nombres}
                disabled={loading}
                onChange={(event) =>
                  change(
                    "nombres",
                    event.target.value,
                  )
                }
                required
              />
            </Field>

            <Field label="Teléfono">
              <input
                className="form-control"
                value={form.telefono}
                disabled={loading}
                onChange={(event) =>
                  change(
                    "telefono",
                    event.target.value,
                  )
                }
                required
              />
            </Field>

            <Field label="Apellido paterno">
              <input
                className="form-control"
                value={
                  form.apellido_pat
                }
                disabled={loading}
                onChange={(event) =>
                  change(
                    "apellido_pat",
                    event.target.value,
                  )
                }
                required
              />
            </Field>

            <Field label="Apellido materno">
              <input
                className="form-control"
                value={
                  form.apellido_mat
                }
                disabled={loading}
                onChange={(event) =>
                  change(
                    "apellido_mat",
                    event.target.value,
                  )
                }
              />
            </Field>

            <Field label="Correo electrónico">
              <input
                type="email"
                className="form-control"
                value={form.correo}
                disabled={loading}
                onChange={(event) =>
                  change(
                    "correo",
                    event.target.value,
                  )
                }
              />
            </Field>

            <Field label="Fecha de nacimiento">
              <input
                type="date"
                className="form-control"
                value={
                  form.fecha_nac
                }
                disabled={loading}
                onChange={(event) =>
                  change(
                    "fecha_nac",
                    event.target.value,
                  )
                }
              />
            </Field>

            <Field label="Género">
              <select
                className="form-control"
                value={form.genero}
                disabled={loading}
                onChange={(event) =>
                  change(
                    "genero",
                    event.target.value,
                  )
                }
              >
                <option value="">
                  Selecciona...
                </option>
                <option value="femenino">
                  Femenino
                </option>
                <option value="masculino">
                  Masculino
                </option>
                <option value="otro">
                  Otro
                </option>
              </select>
            </Field>

            <Field label="Estado del tratamiento">
              <select
                className="form-control"
                value={
                  form.estado_tratamiento
                }
                disabled={loading}
                onChange={(event) => {
                  change(
                    "estado_tratamiento",
                    event.target.value,
                  );

                  if (
                    event.target
                      .value !== "alta"
                  ) {
                    change(
                      "fecha_alta",
                      "",
                    );
                  }
                }}
              >
                <option value="en_tratamiento">
                  En tratamiento
                </option>
                <option value="alta">
                  Dado de alta
                </option>
              </select>
            </Field>

            <Field label="Fecha de alta">
              <input
                type="date"
                className="form-control disabled:bg-slate-50 disabled:text-slate-400"
                value={
                  form.fecha_alta
                }
                disabled={
                  loading ||
                  form.estado_tratamiento !==
                  "alta"
                }
                onChange={(event) =>
                  change(
                    "fecha_alta",
                    event.target.value,
                  )
                }
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Molestia / motivo de consulta">
                <textarea
                  rows={3}
                  className="form-control !h-auto resize-none py-3"
                  value={
                    form.molestia
                  }
                  disabled={loading}
                  onChange={(event) =>
                    change(
                      "molestia",
                      event.target.value,
                    )
                  }
                />
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field label="Notas adicionales">
                <textarea
                  rows={3}
                  className="form-control !h-auto resize-none py-3"
                  value={form.notas}
                  disabled={loading}
                  onChange={(event) =>
                    change(
                      "notas",
                      event.target.value,
                    )
                  }
                />
              </Field>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-xs font-black text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && (
                <RefreshCw
                  size={14}
                  className="animate-spin"
                />
              )}

              {isEdit
                ? "Guardar cambios"
                : "Crear paciente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function DeleteConfirmModal({
  patient,
  appointmentCount,
  loading,
  onClose,
  onConfirm,
}) {
  const [text, setText] =
    useState("");

  const [
    deleteAppointments,
    setDeleteAppointments,
  ] = useState(false);

  const textConfirmed =
    text.trim().toLowerCase() ===
    "eliminar";

  const canDelete =
    textConfirmed &&
    (appointmentCount === 0 ||
      deleteAppointments);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={() =>
          !loading && onClose()
        }
      />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-100 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <AlertTriangle
              size={21}
            />
          </div>

          <h3 className="mt-4 text-base font-black text-slate-900">
            Eliminar paciente
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Estás por eliminar el
            expediente de{" "}
            <b>
              {getFullName(patient)}
            </b>
            .
          </p>
        </div>

        <div className="p-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-700">
                  Citas asociadas
                </p>

                <p className="mt-1 text-[11px] text-slate-400">
                  Este paciente tiene{" "}
                  {appointmentCount} cita
                  {appointmentCount ===
                    1
                    ? ""
                    : "s"}{" "}
                  registrada
                  {appointmentCount ===
                    1
                    ? ""
                    : "s"}
                  .
                </p>
              </div>

              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">
                {appointmentCount}
              </span>
            </div>
          </div>

          {!!appointmentCount && (
            <label
              className={`mt-3 flex cursor-pointer gap-3 rounded-xl border p-4 transition ${deleteAppointments
                  ? "border-rose-300 bg-rose-50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
            >
              <input
                type="checkbox"
                checked={
                  deleteAppointments
                }
                disabled={loading}
                onChange={(event) =>
                  setDeleteAppointments(
                    event.target
                      .checked,
                  )
                }
                className="mt-0.5 h-4 w-4 accent-rose-600"
              />

              <div>
                <p className="text-xs font-black text-slate-700">
                  Eliminar también
                  todas sus citas
                </p>

                <p className="mt-1 text-[11px] leading-4 text-slate-400">
                  El backend no permite
                  borrar un paciente que
                  conserva citas
                  asociadas. Para
                  eliminarlo debes
                  confirmar también la
                  eliminación de esas
                  citas.
                </p>
              </div>
            </label>
          )}

          <div className="mt-5">
            <label className="text-[11px] font-black text-slate-600">
              Para confirmar escribe{" "}
              <span className="text-rose-600">
                eliminar
              </span>
            </label>

            <input
              autoFocus
              value={text}
              disabled={loading}
              onChange={(event) =>
                setText(
                  event.target.value,
                )
              }
              placeholder="Escribe eliminar"
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 disabled:opacity-50"
            />
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              disabled={
                !canDelete || loading
              }
              onClick={() =>
                canDelete &&
                onConfirm(
                  deleteAppointments,
                )
              }
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-5 text-xs font-black text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading && (
                <RefreshCw
                  size={14}
                  className="animate-spin"
                />
              )}
              Eliminar paciente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


function PatientAvatar({
  patient,
  photoUrl,
  size = "sm",
}) {
  const sizes = {
    sm: "h-9 w-9 text-xs",
    lg: "h-20 w-20 text-xl",
    xl: "h-32 w-32 text-3xl",
  };

  return (
    <div
      className={`${sizes[size]} shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 to-blue-100 shadow-sm`}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={getFullName(patient)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-black text-indigo-600">
          {getInitials(patient)}
        </div>
      )}
    </div>
  );
}


function KpiCard({
  label,
  value,
  helper,
  icon: Icon,
  iconClass,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={21} />
        </div>

        <div>
          <p className="text-[11px] font-bold text-slate-400">
            {label}
          </p>

          <p className="mt-0.5 text-[24px] font-black leading-none tracking-tight text-slate-900">
            {Number(
              value || 0,
            ).toLocaleString()}
          </p>

          <p className="mt-1.5 text-[10px] text-slate-400">
            {helper}
          </p>
        </div>
      </div>
    </div>
  );
}


function TableButton({
  children,
  onClick,
  danger = false,
}) {
  return (
    <button
      onClick={onClick}
      className={`h-7 rounded-md border px-2.5 text-[10px] font-black transition ${danger
          ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
          : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
        }`}
    >
      {children}
    </button>
  );
}


function PaginationButton({
  children,
  onClick,
  active = false,
  disabled = false,
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[11px] font-black transition disabled:cursor-not-allowed disabled:opacity-30 ${active
          ? "bg-indigo-600 text-white shadow-sm"
          : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
        }`}
    >
      {children}
    </button>
  );
}


function SectionTitle({
  title,
  description,
}) {
  return (
    <div>
      <h2 className="text-base font-black text-slate-900">
        {title}
      </h2>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}


function Field({
  label,
  children,
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-black text-slate-600">
        {label}
      </label>
      {children}
    </div>
  );
}


function InfoRow({
  icon: Icon,
  label,
  children,
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
        <Icon size={14} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 break-words text-[11px] font-bold capitalize text-slate-700">
          {children}
        </p>
      </div>
    </div>
  );
}


function EmptyInside({
  icon: Icon,
  title,
  text,
}) {
  return (
    <div className="flex min-h-[250px] flex-col items-center justify-center p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon size={24} />
      </div>

      <p className="mt-4 text-sm font-black text-slate-600">
        {title}
      </p>

      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
        {text}
      </p>
    </div>
  );
}


function EmptySection({
  title,
  description,
  icon: Icon,
}) {
  return (
    <div>
      <SectionTitle
        title={title}
        description={description}
      />

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <EmptyInside
          icon={Icon}
          title={`${title} pendiente de conexión`}
          text="La estructura visual ya está preparada, pero falta un modelo/endpoint específico para persistir este apartado."
        />
      </div>
    </div>
  );
}
