import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useConfigStore } from '../../../store/useConfigStore';
import { createAppSocket, safeDisconnect } from '../../../core/socket/socketClient';

// Tipos, Esquemas y Helpers
import type {
  Activity,
  TypeActivity,
  ActivityFiltersState,
  ActivityViewMode,
  Opportunity,
  Client,
  Company,
} from '../schemas/activities.schema';
import {
  filterActivities,
  exportActivitiesToPDF,
  exportActivitiesToCSV,
} from '../utils/activities.helpers';

// Servicios API
import {
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  getActivityTypes,
} from '../../../services/activitiesService';
import { getOpportunities } from '../../../services/opportunitiesService';
import { getActiveClients } from '../../../services/clientsService';
import { getCompanies } from '../../../services/companiesService';
import { getActiveUsers } from '../../../services/usersService';

export interface ActivityNotification {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'confirmation';
  title: string;
  message: string;
}

export interface ActivityConfirmConfig {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
}

export interface UseActivitiesOptions {
  defaultView?: ActivityViewMode;
}

export const INITIAL_ACTIVITY_FILTERS: ActivityFiltersState = {
  search: '',
  userId: 'all',
  typeActivityId: 'all',
  date: '',
};

export function useActivities(options: UseActivitiesOptions = {}) {
  const { defaultView = 'calendar' } = options;
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const isPrivilegedUser = Boolean(
    isAdmin || isSuperAdmin || (user && (user.role === 'admin' || user.role === 'superadmin'))
  );
  const { selectedTenant } = useConfigStore();
  const schemaName = selectedTenant?.schema_name;

  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get('view') as ActivityViewMode | null;

  // Estado de vista activa (Calendario vs Listado)
  const [activeView, setActiveView] = useState<ActivityViewMode>(() => {
    if (viewParam === 'calendar' || viewParam === 'table') return viewParam;
    return defaultView;
  });

  const handleChangeView = useCallback(
    (view: ActivityViewMode) => {
      setActiveView(view);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('view', view);
        return next;
      });
    },
    [setSearchParams]
  );

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
    ...INITIAL_ACTIVITY_FILTERS,
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
  const [confirmConfig, setConfirmConfig] = useState<ActivityConfirmConfig>({
    open: false,
    title: '',
    description: '',
    onConfirm: async () => {},
  });

  // Notificación compartida
  const [notification, setNotification] = useState<ActivityNotification>({
    show: false,
    type: 'success',
    title: '',
    message: '',
  });

  const notify = useCallback(
    (notif: {
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
    },
    []
  );

  const hideNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, show: false }));
  }, []);

  const closeConfirmModal = useCallback(() => {
    setConfirmConfig((prev) => ({ ...prev, open: false }));
  }, []);

  // Guard ref contra peticiones redundantes
  const isFetchingRef = useRef<boolean>(false);
  const isInitialConnectRef = useRef<boolean>(true);

  // Carga paralela de entidades
  const loadModuleData = useCallback(
    async (isManual = false) => {
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
    },
    [notify]
  );

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
      query: { tenantSchema: schemaName || 'public' },
    });

    socket.on('connect', () => {
      // Asegurar suscripción reactiva a la sala del tenant activo
      socket.emit('set_tenant', { tenantSchema: schemaName || 'public' });

      if (!isInitialConnectRef.current) {
        console.log('Reconectado a WebSocket de Actividades. Sincronizando...');
        loadModuleDataRef.current(true);
      } else {
        isInitialConnectRef.current = false;
        console.log('Conectado a WebSocket de Actividades');
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

  const handleFilterChange = useCallback(
    <K extends keyof ActivityFiltersState>(key: K, value: ActivityFiltersState[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setCurrentPage(1);
    },
    []
  );

  const handleClearFilters = useCallback(() => {
    setFilters({
      ...INITIAL_ACTIVITY_FILTERS,
      userId: user?.id || 'all',
    });
    setCurrentPage(1);
  }, [user?.id]);

  // ----------------------------------------------------
  // Operaciones CRUD
  // ----------------------------------------------------
  const handleOpenCreate = useCallback(() => {
    setEditingActivity(null);
    setModalOpen(true);
  }, []);

  const handleOpenCreateWithDate = useCallback((dateStr: string) => {
    setEditingActivity({ date: dateStr });
    setModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((activity: Activity) => {
    setEditingActivity(activity);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingActivity(null);
  }, []);

  const handleSubmitActivity = useCallback(
    async (formData: Partial<Activity>) => {
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
    },
    [editingActivity, notify, loadModuleData]
  );

  const handleDeleteActivity = useCallback(
    (activity: Activity) => {
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
    },
    [notify, loadModuleData]
  );

  // Exportaciones
  const getActiveUserLabel = useCallback(() => {
    if (!isAdmin) return user?.username || 'Ejecutivo';
    if (filters.userId === 'all') return 'Todos los usuarios';
    return (
      executives.find((e) => e.value === filters.userId)?.label ||
      (filters.userId === user?.id ? user?.username : 'Usuario') ||
      'Usuario'
    );
  }, [isAdmin, user?.username, user?.id, filters.userId, executives]);

  const handleExportPDF = useCallback(() => {
    exportActivitiesToPDF(filteredActivities, {
      userLabel: getActiveUserLabel(),
      filterDate: filters.date,
      filterSearch: filters.search,
    });
  }, [filteredActivities, getActiveUserLabel, filters.date, filters.search]);

  const handleExportCSV = useCallback(() => {
    exportActivitiesToCSV(filteredActivities, {
      userLabel: getActiveUserLabel(),
      filterDate: filters.date,
    });
  }, [filteredActivities, getActiveUserLabel, filters.date]);

  return {
    user,
    isAdmin,
    isSuperAdmin,
    isPrivilegedUser,
    activeView,
    handleChangeView,
    activities,
    activityTypes,
    executives,
    opportunities,
    clients,
    companies,
    loading,
    submitting,
    filters,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    modalOpen,
    setModalOpen,
    editingActivity,
    confirmConfig,
    notification,
    filteredActivities,
    paginatedActivities,
    handleFilterChange,
    handleClearFilters,
    handleOpenCreate,
    handleOpenCreateWithDate,
    handleOpenEdit,
    handleCloseModal,
    handleSubmitActivity,
    handleDeleteActivity,
    handleExportPDF,
    handleExportCSV,
    loadModuleData,
    notify,
    hideNotification,
    closeConfirmModal,
  };
}

export default useActivities;
