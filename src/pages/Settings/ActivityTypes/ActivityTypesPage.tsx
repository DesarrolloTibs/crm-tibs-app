import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ClipboardList, Plus, RefreshCw } from 'lucide-react';

// Componentes Compartidos del Sistema
import SettingsContainer from '../../../components/shared/SettingsContainer';
import Button from '../../../components/shared/Button';
import ConfirmModal from '../../../components/shared/ConfirmModal';
import Notification from '../../../components/shared/Notification';

// Subcomponentes Modulares de Tipos de Actividad
import { ActivityTypesStatsBanner } from './components/ActivityTypesStatsBanner';
import { ActivityTypesTable } from './components/ActivityTypesTable';
import { ActivityTypeModal } from './components/ActivityTypeModal';

// Esquemas y Tipos
import type {
  TypeActivity,
  ActivityTypeFormData,
  ActivityTypeFilterState,
  NotificationState,
} from './schemas/activityTypes.schema';

// Utilidades y Helpers
import {
  filterActivityTypes,
  calculateActivityTypeStats,
} from './utils/activityTypes.helpers';

// Servicios API
import {
  getActivityTypes,
  createActivityType,
  updateActivityType,
  deleteActivityType,
} from '../../../services/activitiesService';

export const ActivityTypesPage: React.FC = () => {
  // Estado de datos
  const [types, setTypes] = useState<TypeActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Filtros y Búsqueda
  const [filters, setFilters] = useState<ActivityTypeFilterState>({
    search: '',
    status: 'all',
  });

  // Estados de Modales
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingType, setEditingType] = useState<TypeActivity | null>(null);
  const [deletingType, setDeletingType] = useState<TypeActivity | null>(null);

  // Notificación compartida
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: 'success',
    title: '',
    message: '',
  });

  const hideNotification = () => {
    setNotification((prev) => ({ ...prev, show: false }));
  };

  const notify = (notif: {
    type: 'success' | 'error' | 'warning' | 'confirmation';
    title: string;
    message: string;
    onConfirm?: () => void;
  }) => {
    setNotification({
      show: true,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      onConfirm: notif.onConfirm || hideNotification,
    });
  };

  // Cargar tipos de actividad desde la API
  const fetchTypes = useCallback(async (isManual = false) => {
    try {
      if (isManual) setLoading(true);
      const data = await getActivityTypes();
      setTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar tipos de actividad:', err);
      notify({
        type: 'error',
        title: 'Error de Carga',
        message: 'No fue posible obtener los tipos de actividad desde el servidor. Por favor, reintenta.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  // Manejo de creación y edición
  const handleOpenCreate = () => {
    setEditingType(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (type: TypeActivity) => {
    setEditingType(type);
    setModalOpen(true);
  };

  const handleFormSubmit = async (formData: ActivityTypeFormData) => {
    setSubmitting(true);
    try {
      if (editingType?.id) {
        await updateActivityType(editingType.id, formData);
        notify({
          type: 'success',
          title: '¡Tipo Actualizado!',
          message: `El tipo de actividad "${formData.strname}" se ha modificado exitosamente.`,
        });
      } else {
        await createActivityType(formData);
        notify({
          type: 'success',
          title: '¡Tipo Registrado!',
          message: `El nuevo tipo de actividad "${formData.strname}" fue creado y está listo para usarse.`,
        });
      }

      setModalOpen(false);
      setEditingType(null);
      await fetchTypes();
    } catch (err: any) {
      console.error('Error al guardar tipo de actividad:', err);
      const errorMsg =
        err.response?.data?.message ||
        'Ocurrió un error inesperado al procesar la solicitud.';
      notify({
        type: 'error',
        title: 'Error al Guardar',
        message: Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Manejo de eliminación
  const handleOpenDelete = (type: TypeActivity) => {
    setDeletingType(type);
  };

  const handleConfirmDelete = async () => {
    if (!deletingType?.id) return;
    const typeToDelete = deletingType;
    setDeletingType(null);

    try {
      setLoading(true);
      await deleteActivityType(typeToDelete.id);
      notify({
        type: 'success',
        title: 'Tipo Eliminado',
        message: `El tipo "${typeToDelete.strname}" se eliminó correctamente.`,
      });
      await fetchTypes();
    } catch (err: any) {
      console.error('Error al eliminar tipo de actividad:', err);
      const errorMsg =
        err.response?.data?.message ||
        'No se pudo eliminar el tipo de actividad seleccionado.';
      notify({
        type: 'error',
        title: 'Error al Eliminar',
        message: Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrado y estadísticas calculadas
  const filteredTypes = useMemo(
    () => filterActivityTypes(types, filters),
    [types, filters]
  );

  const stats = useMemo(() => calculateActivityTypeStats(types), [types]);

  return (
    <SettingsContainer
      title="Tipos de Actividad"
      description="Crea, personaliza y organiza las categorías de citas, llamadas y tareas comerciales de tu equipo con identificación cromática en tiempo real."
      icon={<ClipboardList size={20} />}
      rightAction={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => fetchTypes(true)}
            disabled={loading}
            title="Recargar tipos de actividad"
            className="!py-2 !px-3 !text-xs !normal-case !tracking-normal gap-1.5 shadow-2xs"
          >
            <RefreshCw
              size={14}
              className={loading ? 'animate-spin text-indigo-650' : 'text-slate-600'}
            />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>

          <Button
            variant="success"
            onClick={handleOpenCreate}
            className="!py-2 !px-3.5 !text-xs !normal-case !tracking-normal gap-1.5 shadow-xs font-bold"
          >
            <Plus size={15} />
            <span>Nuevo Tipo</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6 pt-1">
        {/* Banner de Estadísticas Rápidas */}
        <ActivityTypesStatsBanner stats={stats} />

        {/* Tabla Compartida basada en el patrón de Mi Empresa */}
        <ActivityTypesTable
          types={filteredTypes}
          totalCount={types.length}
          loading={loading}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
          searchTerm={filters.search}
          setSearchTerm={(term) => setFilters((prev) => ({ ...prev, search: term }))}
          statusFilter={filters.status}
          setStatusFilter={(status) => setFilters((prev) => ({ ...prev, status }))}
        />
      </div>

      {/* MODAL DE CREACIÓN / EDICIÓN */}
      <ActivityTypeModal
        open={modalOpen}
        editingType={editingType}
        onClose={() => {
          setModalOpen(false);
          setEditingType(null);
        }}
        onSubmit={handleFormSubmit}
        submitting={submitting}
      />

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <ConfirmModal
        open={!!deletingType}
        onClose={() => setDeletingType(null)}
        onConfirm={handleConfirmDelete}
        message={`¿Estás seguro de que deseas eliminar el tipo de actividad "${deletingType?.strname}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar Tipo"
        cancelLabel="Cancelar"
        variant="danger"
      />

      {/* NOTIFICACIÓN MODAL COMPARTIDA */}
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onConfirm={notification.onConfirm || hideNotification}
        onCancel={notification.onCancel || hideNotification}
      />
    </SettingsContainer>
  );
};

export default ActivityTypesPage;
