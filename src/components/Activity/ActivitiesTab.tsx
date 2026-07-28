import React, { useEffect, useState, useCallback } from 'react';
import { getActivitiesByOpportunity, createActivity, updateActivity, deleteActivity, getActivityTypes } from '../../services/activitiesService';

import Modal from '../Modal/Modal';
import Loader from '../Loader/Loader';

import { Plus, Search } from 'lucide-react';
import Notification from '../Modal/Notification';
import type { Activity, TypeActivity } from '../../core/models/Activity';
import type { Opportunity } from '../../core/models/Opportunity';
import ActivitiesTable from './ActivitiesTable';
import ActivityForm from './ActivityForm';
import Input from '../shared/Input';
import Button from '../shared/Button';

interface Props {
    opportunityId: string;
    opportunity?: Opportunity;
}

const ActivitiesTab: React.FC<Props> = ({ opportunityId, opportunity }) => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [activityTypes, setActivityTypes] = useState<TypeActivity[]>([]);
    const [editing, setEditing] = useState<Activity | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pageSize, setPageSize] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    const [notification, setNotification] = useState({
        show: false,
        type: 'success' as 'success' | 'error' | 'warning' | 'confirmation',
        title: '',
        message: '',
        onConfirm: () => {},
        onCancel: () => {},
    });

    const hideNotification = () => setNotification({ ...notification, show: false });

    const fetchActivities = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getActivitiesByOpportunity({ opportunityId });
            setActivities(data);
        } catch {
            setNotification({
                show: true, type: 'error', title: 'Error', message: 'No se pudieron cargar las actividades', onConfirm: hideNotification, onCancel: hideNotification
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
                setActivityTypes(types.filter(t => t.blnstatus));
            } catch (error) {
                console.error("Failed to fetch activity types", error);
            }
        };
        fetchTypes();
    }, [fetchActivities]);

    const handleCreate = async (activity: Partial<Activity>) => {
        setLoading(true);
        try {
            // Aseguramos que la actividad se asocie a la oportunidad actual
            await createActivity({ ...activity, opportunityId });
            setModalOpen(false);
            setNotification({
                show: true, type: 'success', title: '¡Éxito!', message: 'Actividad creada correctamente', onConfirm: hideNotification, onCancel: hideNotification
            });
            fetchActivities();
        } catch (error) {
            setNotification({
                show: true, type: 'error', title: 'Error', message: 'No se pudo crear la actividad', onConfirm: hideNotification, onCancel: hideNotification
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
            const { id, user, opportunity, userId, ...updateData } = activity as Activity;
            await updateActivity(id, updateData);
            setEditing(null);
            setModalOpen(false);
            setNotification({
                show: true, type: 'success', title: '¡Éxito!', message: 'Actividad actualizada correctamente', onConfirm: hideNotification, onCancel: hideNotification
            });
            fetchActivities();
        } catch (error) {
            setNotification({
                show: true, type: 'error', title: 'Error', message: 'No se pudo actualizar la actividad', onConfirm: hideNotification, onCancel: hideNotification
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (activity: Activity) => {
        if (!activity.id) return;
        setNotification({
            show: true,
            type: 'confirmation',
            title: '¿Eliminar actividad?',
            message: 'Esta acción no se puede deshacer.',
            onConfirm: async () => {
                hideNotification();
                try {
                    await deleteActivity(activity.id);
                    setNotification({
                        show: true, type: 'success', title: '¡Éxito!', message: 'Actividad eliminada.', onConfirm: hideNotification, onCancel: hideNotification
                    });
                    fetchActivities();
                } catch {
                    setNotification({
                        show: true, type: 'error', title: 'Error', message: 'No se pudo eliminar la actividad.', onConfirm: hideNotification, onCancel: hideNotification
                    });
                }
            },
            onCancel: hideNotification,
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

    const filteredActivities = activities.filter(activity => {
        const search = searchTerm.toLowerCase();
        if (!search) return true;

        const activityText = activity.activity?.toLowerCase() || '';
        const activityTypeText = activity.typeActivity?.strname?.toLowerCase() || '';
        const dateText = new Date(activity.date).toLocaleString('es-MX').toLowerCase();
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
    const paginatedActivities = pageSize > 0 ? filteredActivities.slice((currentPage - 1) * pageSize, currentPage * pageSize) : filteredActivities;

    return (
        <div className="p-4 flex flex-col h-full max-h-[80vh]">
            <Notification {...notification} />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4 w-full">
                <div className="flex-grow w-full sm:w-auto">
                    <Input
                        type="text"
                        placeholder="Buscar en actividades..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        inputPrefix={<Search size={18} />}
                    />
                </div>
                <Button
                    variant="success"
                    className="w-full sm:w-auto whitespace-nowrap h-[54px]"
                    onClick={openCreateModal}
                >
                    <Plus size={18} className="mr-2" /> Nueva Actividad
                </Button>
            </div>
            {loading ? (
                <Loader />
            ) : (
                <ActivitiesTable
                    activities={paginatedActivities}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
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
            <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
                <ActivityForm
                    initialData={editing ? { ...editing, opportunity: editing.opportunity || opportunity } : { opportunityId, opportunity }}
                    activityTypes={activityTypes}
                    onSubmit={editing ? handleUpdate : handleCreate}
                    onCancel={() => setModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default ActivitiesTab;