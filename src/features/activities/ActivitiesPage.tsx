import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, Plus } from 'lucide-react';
import { useAuth } from '@features/auth';
import { useConfigStore } from '@/store/useConfigStore';
import { createAppSocket, safeDisconnect } from '@core/socket/socketClient';

// Componentes Compartidos
import Button from '@shared/components/Button';
import Notification from '@shared/components/Notification';
import ConfirmModal from '@shared/components/ConfirmModal';

// Subcomponentes Modulares de Actividades
import { ActivitiesNavTabs } from './components/ActivitiesNavTabs';
import { ActivitiesFilters } from './components/ActivitiesFilters';
import { ActivitiesTable } from './components/ActivitiesTable';
import { ActivityModal } from './components/ActivityModal';
import ActivitiesCalendar from './components/calendar/ActivitiesCalendar';

// Tipos, Esquemas y Helpers
import type {
  Activity,
  TypeActivity,
  ActivityFiltersState,
  ActivityViewMode,
  Opportunity,
  Client,
  Company,
} from './schemas/activities.schema';
import {
  filterActivities,
  exportActivitiesToPDF,
  exportActivitiesToCSV,
} from './utils/activities.helpers';

// Servicios API
import {
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  getActivityTypes,
} from '@core/services/activitiesService';
import { getOpportunities } from '@core/services/opportunitiesService';
import { getActiveClients } from '@core/services/clientsService';
import { getCompanies } from '@core/services/companiesService';
import { getActiveUsers } from '@core/services/usersService';

interface ActivitiesPageProps {
  defaultView?: ActivityViewMode;
}

const INITIAL_FILTERS: ActivityFiltersState = {
  search: '',
  userId: 'all',
  typeActivityId: 'all',
  date: '',
};

export const ActivitiesPage: React.FC<ActivitiesPageProps> = ({ defaultView = 'calendar' }) => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const isPrivilegedUser = Boolean(isAdmin || isSuperAdmin || (user && (user.role === 'admin' || user.role === 'superadmin')));
  const { selectedTenant } = useConfigStore();
  const schemaName = selectedTenant?.schema_name;

  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get('view') as ActivityViewMode | null;

  // Estado de vista activa (Calendario vs Listado)
  const [activeView, setActiveView] = useState<ActivityViewMode>(() => {
    if (viewParam === 'calendar' || viewParam === 'table') return viewParam;
    return defaultView;
  });

  const handleChangeView = (view: ActivityViewMode) => {
    setActiveView(view);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('view', view);
      return next;
    });
  };

  // Estados de Entidades
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityTypes, setActivityTypes] = useState<TypeActivity[]>([]);
  const [executives, setExecutives] = useState<{ value: string; label: string }[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  // Estados de Carga
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Estados de Filtros (por defecto el usuario autenticado)
  const [filters, setFilters] = useState<ActivityFiltersState>(() => ({
    ...INITIAL_FILTERS,
    userId: user?.id || 'all',
  }));

  const initializedUserFilterRef = useRef<boolean>(false);

  // 1. Inicializar filtro con el usuario autenticado una vez resuelta la sesión
  useEffect(() => {
    if (user?.id && !initializedUserFilterRef.current) {
      setFilters((prev) => ({
        ...prev,
        userId: user.id,
      }));
      initializedUserFilterRef.current = true;
    }
  }, [user?.id]);

  // 2. Si el usuario no es admin ni superadmin, asegurar que el filtro esté siempre anclado a su propio ID
  useEffect(() => {
    if (user?.id && !isPrivilegedUser) {
      setFilters((prev) => (prev.userId !== user.id ? { ...prev, userId: user.id } : prev));
    }
  }, [user?.id, isPrivilegedUser]);

  // Paginación de Tabla
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Estados de Modales
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingActivity, setEditingActivity] = useState<Partial<Activity> | null>(null);

  // Modal de Confirmación para Eliminación
  const [confirmConfig, setConfirmConfig] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: async () => {},
  });

  // Notificación compartida
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'confirmation';
    title: string;
    message: string;
  }>({
    show: false,
    type: 'success',
    title: '',
    message: '',
  });

  const notify = (notif: {
    type: 'success' | 'error' | 'warning' | 'confirmation';
    title: string;
    message: string;
  }) => {
    setNotification({
      show: true,
      type: notif.type,
      title: notif.title,
      message: notif.message,
    });
  };

  // Guard ref contra peticiones redundantes
  const isFetchingRef = useRef<boolean>(false);
  const isInitialConnectRef = useRef<boolean>(true);

  // Carga paralela de entidades
  const loadModuleData = useCallback(async (isManual = false) => {
    if (isFetchingRef.current && !isManual) return;
    isFetchingRef.current = true;

    try {
      if (isManual) {
        setLoading(true);
      }

      const [activitiesData, typesData, usersData, oppsData, clientsData, companiesData] =
        await Promise.all([
          getActivities(),
          getActivityTypes().catch(() => []),
          getActiveUsers().catch(() => []),
          getOpportunities().catch(() => []),
          getActiveClients().catch(() => []),
          getCompanies().catch(() => []),
        ]);

      setActivities(Array.isArray(activitiesData) ? activitiesData : []);
      setActivityTypes(
        Array.isArray(typesData) ? typesData.filter((t) => t.blnstatus !== false) : []
      );

      if (Array.isArray(usersData)) {
        setExecutives(
          usersData
            .filter((u) => u.id)
            .map((u) => ({
              value: u.id!,
              label: u.username || 'Usuario sin nombre',
            }))
        );
      }

      setOpportunities(Array.isArray(oppsData) ? oppsData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setCompanies(
        Array.isArray(companiesData) ? companiesData.filter((c) => c.estatus !== false) : []
      );
    } catch (err) {
      console.error('Error al cargar datos del módulo de actividades:', err);
      notify({
        type: 'error',
        title: 'Error de Sincronización',
        message: 'No fue posible sincronizar las actividades con el servidor. Por favor reintenta.',
      });
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  const loadModuleDataRef = useRef(loadModuleData);
  loadModuleDataRef.current = loadModuleData;

  useEffect(() => {
    loadModuleData();
  }, [schemaName, loadModuleData]);

  // ── Sincronización en Tiempo Real vía WebSockets ──
  useEffect(() => {
    isInitialConnectRef.current = true;
    const socket = createAppSocket({
      namespace: 'activities',
    });

    socket.on('connect', () => {
      if (!isInitialConnectRef.current) {
        console.log('Reconectado a WebSocket de Actividades. Sincronizando...');
        loadModuleDataRef.current(true);
      } else {
        isInitialConnectRef.current = false;
        console.log('Connectado a WebSocket de Actividades');
      }
    });

    socket.on('disconnect', (reason) => {
      console.warn('Desconexión en Activities WebSocket:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('Error de conexión en Activities WebSocket:', err.message);
    });

    socket.on('activityCreated', (newActivity: Activity) => {
      setActivities((prev) =>
        prev.some((a) => a.id === newActivity.id) ? prev : [newActivity, ...prev]
      );
    });

    socket.on('activityUpdated', (updatedActivity: Activity) => {
      setActivities((prev) =>
        prev.map((a) => (a.id === updatedActivity.id ? updatedActivity : a))
      );
    });

    socket.on('activityDeleted', (deletedId: string) => {
      setActivities((prev) => prev.filter((a) => a.id !== deletedId));
    });

    socket.on('activityTypeCreated', (newType: TypeActivity) => {
      setActivityTypes((prev) =>
        prev.some((t) => t.id === newType.id)
          ? prev
          : [...prev, newType].sort((a, b) => a.strname.localeCompare(b.strname))
      );
    });

    socket.on('activityTypeUpdated', (updatedType: TypeActivity) => {
      setActivityTypes((prev) =>
        prev.map((t) => (t.id === updatedType.id ? updatedType : t))
      );
    });

    socket.on('activityTypeDeleted', (deletedTypeId: number) => {
      setActivityTypes((prev) => prev.filter((t) => t.id !== deletedTypeId));
    });

    return () => {
      safeDisconnect(socket);
    };
  }, [schemaName]);

  // Filtrado reactivo

  const filteredActivities = useMemo(
    () => filterActivities(activities, filters),
    [activities, filters]
  );

  const paginatedActivities = useMemo(() => {
    if (pageSize === 0) return filteredActivities;
    const start = (currentPage - 1) * pageSize;
    return filteredActivities.slice(start, start + pageSize);
  }, [filteredActivities, currentPage, pageSize]);

  const totalPages = pageSize === 0 ? 1 : Math.ceil(filteredActivities.length / pageSize);

  const handleFilterChange = <K extends keyof ActivityFiltersState>(
    key: K,
    value: ActivityFiltersState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      ...INITIAL_FILTERS,
      userId: user?.id || 'all',
    });
    setCurrentPage(1);
  };

  // ----------------------------------------------------
  // Operaciones CRUD
  // ----------------------------------------------------
  const handleOpenCreate = () => {
    setEditingActivity(null);
    setModalOpen(true);
  };

  const handleOpenCreateWithDate = (dateStr: string) => {
    setEditingActivity({ date: dateStr });
    setModalOpen(true);
  };

  const handleOpenEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setModalOpen(true);
  };

  const handleSubmitActivity = async (formData: Partial<Activity>) => {
    setSubmitting(true);
    try {
      if (editingActivity?.id) {
        const { id, user: _u, opportunity: _o, userId: _uid, typeActivity: _ta, ...updateData } =
          formData as Activity;
        await updateActivity(editingActivity.id, updateData);
        notify({
          type: 'success',
          title: 'Actividad Actualizada',
          message: 'La actividad ha sido modificada correctamente en el calendario.',
        });
      } else {
        await createActivity(formData);
        notify({
          type: 'success',
          title: 'Actividad Agendada',
          message: 'La cita ha sido registrada exitosamente en la agenda del CRM.',
        });
      }
      setModalOpen(false);
      setEditingActivity(null);
      await loadModuleData(true);
    } catch (err) {
      console.error('Error al guardar actividad:', err);
      notify({
        type: 'error',
        title: 'Error al Guardar',
        message: 'No fue posible guardar la actividad. Por favor revisa los datos e inténtalo de nuevo.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteActivity = (activity: Activity) => {
    if (!activity.id) return;

    setConfirmConfig({
      open: true,
      title: '¿Eliminar Actividad?',
      description: `¿Estás seguro de que deseas eliminar la actividad '${activity.activity}'? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          await deleteActivity(activity.id!);
          notify({
            type: 'success',
            title: 'Actividad Eliminada',
            message: 'La actividad ha sido retirada de la agenda y de las oportunidades vinculadas.',
          });
          await loadModuleData(true);
        } catch (err) {
          console.error('Error al eliminar actividad:', err);
          notify({
            type: 'error',
            title: 'Error de Eliminación',
            message: 'No fue posible eliminar la actividad en el servidor.',
          });
        } finally {
          setConfirmConfig((prev) => ({ ...prev, open: false }));
        }
      },
    });
  };

  // Exportaciones
  const getActiveUserLabel = () => {
    if (!isAdmin) return user?.username || 'Ejecutivo';
    if (filters.userId === 'all') return 'Todos los usuarios';
    return (
      executives.find((e) => e.value === filters.userId)?.label ||
      (filters.userId === user?.id ? user?.username : 'Usuario') ||
      'Usuario'
    );
  };

  const handleExportPDF = () => {
    exportActivitiesToPDF(filteredActivities, {
      userLabel: getActiveUserLabel(),
      filterDate: filters.date,
      filterSearch: filters.search,
    });
  };

  const handleExportCSV = () => {
    exportActivitiesToCSV(filteredActivities, {
      userLabel: getActiveUserLabel(),
      filterDate: filters.date,
    });
  };

  return (
    <>
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onConfirm={() => setNotification((prev) => ({ ...prev, show: false }))}
      />

      <ConfirmModal
        open={confirmConfig.open}
        message={confirmConfig.description}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, open: false }))}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
      />

      {/* Contenedor Principal */}
      <div className="space-y-6">
        {/* Cabecera Principal del Módulo con Selector de Vista, Sockets y Refresco */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
              <CalendarDays size={24} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Agenda Comercial
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Gestión integral de citas, reuniones, demos y bitácora de seguimiento comercial.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Navegación por Vistas (Tabla vs Calendario) */}
            <ActivitiesNavTabs
              activeView={activeView}
              onChangeView={handleChangeView}
              activitiesCount={activities.length}
            />

            {/* Filtro Unificado en el lugar del botón Actualizar */}
            <ActivitiesFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              activityTypes={activityTypes}
              userOptions={executives}
              isAdmin={isPrivilegedUser}
              currentUserId={user?.id}
              currentUserName={user?.username}
            />

            {/* Botón Nueva Cita rápido */}
            <Button
              variant="success"
              onClick={handleOpenCreate}
              className="gap-2 !py-2 !px-4 text-xs font-bold tracking-wide shadow-2xs whitespace-nowrap"
            >
              <Plus size={15} />
              <span>Nueva Actividad</span>
            </Button>
          </div>
        </div>

        {/* Renderizado de Vista Activa */}
        {activeView === 'calendar' ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-xs">
            <ActivitiesCalendar
              activities={filteredActivities}
              activityTypes={activityTypes}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteActivity}
              onCreateWithDate={handleOpenCreateWithDate}
              selectedDate={filters.date}
            />
          </div>
        ) : (
          <ActivitiesTable
            activities={paginatedActivities}
            totalCount={activities.length}
            filteredCount={filteredActivities.length}
            loading={loading}
            filters={filters}
            onClearFilters={handleClearFilters}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteActivity}
            onExportPDF={handleExportPDF}
            onExportCSV={handleExportCSV}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>

      {/* Modal de Actividades */}
      {modalOpen && (
        <ActivityModal
          open={modalOpen}
          editingActivity={editingActivity}
          activityTypes={activityTypes}
          onClose={() => {
            setModalOpen(false);
            setEditingActivity(null);
          }}
          onSubmit={handleSubmitActivity}
          submitting={submitting}
          opportunities={opportunities}
          clients={clients}
          companies={companies}
        />
      )}
    </>
  );
};

export default ActivitiesPage;
