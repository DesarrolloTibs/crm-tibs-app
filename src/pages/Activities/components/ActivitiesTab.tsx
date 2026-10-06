import React, { useEffect, useState, useCallback } from 'react';
import {
  getActivitiesByOpportunity,
  createActivity,
  updateActivity,
  deleteActivity,
  getActivityTypes,
} from '../../../services/activitiesService';

import { Plus, Search } from 'lucide-react';
import Loader from '../../../components/Loader/Loader';
import Notification from '../../../components/shared/Notification';
import ConfirmModal from '../../../components/shared/ConfirmModal';
import Input from '../../../components/shared/Input';
import Button from '../../../components/shared/Button';
import type { Activity, TypeActivity } from '../schemas/activities.schema';
import type { Opportunity } from '../../../core/models/Opportunity';
import { ActivityModal } from './ActivityModal';
import Table, { type ColumnDef } from '../../../components/shared/Table';
import { getActivitiesColumns } from '../utils/activities.columns';

interface ActivitiesTabProps {
  opportunityId: string;
  opportunity?: Opportunity;
}

export const ActivitiesTab: React.FC<ActivitiesTabProps> = ({ opportunityId, opportunity }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityTypes, setActivityTypes] = useState<TypeActivity[]>([]);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

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

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getActivitiesByOpportunity({ opportunityId });
      setActivities(Array.isArray(data) ? data : []);
    } catch {
      notify({
        type: 'error',
        title: 'Error de Carga',
        message: 'No fue posible sincronizar las actividades de esta oportunidad.',
      });
    } finally {
      setLoading(false);
    }
  }, [opportunityId]);

  useEffect(() => {
    fetchActivities();
    const fetchTypes = async () => {
      try {
        const types = await getActivityTypes();
        setActivityTypes(types.filter((t) => t.blnstatus !== false));
      } catch (error) {
        console.error('Error al cargar tipos de actividad en ActivitiesTab:', error);
      }
    };
    fetchTypes();
  }, [fetchActivities]);

  const handleCreate = async (activity: Partial<Activity>) => {
    setLoading(true);
    try {
      await createActivity({ ...activity, opportunityId });
      setModalOpen(false);
      notify({
        type: 'success',
        title: 'Actividad Creada',
        message: 'La actividad fue vinculada exitosamente a la oportunidad.',
      });
      fetchActivities();
    } catch (error) {
      notify({
        type: 'error',
        title: 'Error al Guardar',
        message: 'No se pudo registrar la actividad.',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (activity: Partial<Activity>) => {
    if (!activity.id) return;
    setLoading(true);
    try {
      const { id, user: _u, opportunity: _o, userId: _uid, typeActivity: _ta, ...updateData } =
        activity as Activity;
      await updateActivity(id, updateData);
      setEditing(null);
      setModalOpen(false);
      notify({
        type: 'success',
        title: 'Actividad Actualizada',
        message: 'La actividad fue modificada correctamente.',
      });
      fetchActivities();
    } catch (error) {
      notify({
        type: 'error',
        title: 'Error al Actualizar',
        message: 'No se pudo actualizar la actividad.',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (activity: Activity) => {
    if (!activity.id) return;
    setConfirmConfig({
      open: true,
      title: '¿Eliminar Actividad?',
      description: `¿Estás seguro de que deseas eliminar la actividad '${activity.activity}'?`,
      onConfirm: async () => {
        try {
          await deleteActivity(activity.id!);
          notify({
            type: 'success',
            title: 'Actividad Eliminada',
            message: 'La actividad fue retirada de la oportunidad.',
          });
          fetchActivities();
        } catch {
          notify({
            type: 'error',
            title: 'Error al Eliminar',
            message: 'No fue posible eliminar la actividad.',
          });
        } finally {
          setConfirmConfig((prev) => ({ ...prev, open: false }));
        }
      },
    });
  };

  const openCreateModal = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEditModal = (activity: Activity) => {
    setEditing(activity);
    setModalOpen(true);
  };

  const filteredActivities = activities.filter((activity) => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;

    const activityText = activity.activity?.toLowerCase() || '';
    const activityTypeText = activity.typeActivity?.strname?.toLowerCase() || '';
    const dateText = activity.date ? new Date(activity.date).toLocaleString('es-MX').toLowerCase() : '';
    const userText = activity.user?.username?.toLowerCase() || '';

    return (
      activityText.includes(search) ||
      activityTypeText.includes(search) ||
      dateText.includes(search) ||
      userText.includes(search)
    );
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = pageSize > 0 ? Math.ceil(filteredActivities.length / pageSize) : 1;
  const paginatedActivities =
    pageSize > 0
      ? filteredActivities.slice((currentPage - 1) * pageSize, currentPage * pageSize)
      : filteredActivities;

  const columns = React.useMemo<ColumnDef<Activity>[]>(
    () =>
      getActivitiesColumns({
        onEdit: openEditModal,
        onDelete: handleDelete,
      }),
    []
  );

  return (
    <div className="p-4 flex flex-col h-full max-h-[80vh] space-y-4">
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full">
        <div className="flex-grow w-full sm:w-auto">
          <Input
            type="text"
            placeholder="Buscar en actividades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            inputPrefix={<Search size={16} />}
            className="text-xs"
          />
        </div>
        <Button
          variant="success"
          className="w-full sm:w-auto whitespace-nowrap !py-2 text-xs"
          onClick={openCreateModal}
        >
          <Plus size={16} className="mr-1.5" /> Nueva Actividad
        </Button>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <Table
          data={paginatedActivities}
          columns={columns}
          variant="cards"
          emptyTitle="Sin actividades"
          emptyMessage="No hay actividades registradas para esta oportunidad."
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          totalCount={activities.length}
          filteredCount={filteredActivities.length}
        />
      )}

      {modalOpen && (
        <ActivityModal
          open={modalOpen}
          editingActivity={
            editing
              ? { ...editing, opportunity: editing.opportunity || opportunity }
              : { opportunityId, opportunity }
          }
          activityTypes={activityTypes}
          onClose={() => setModalOpen(false)}
          onSubmit={editing ? handleUpdate : handleCreate}
        />
      )}
    </div>
  );
};

export default ActivitiesTab;
