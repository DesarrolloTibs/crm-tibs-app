import React, { useEffect, useState, useCallback } from 'react';
import { getActivitiesByOpportunity, createActivity, updateActivity, deleteActivity, getActivityTypes } from '../../services/activitiesService';

import Modal from '../Modal/Modal';
import Loader from '../Loader/Loader';

import { Plus, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Notification from '../Modal/Notification';
import type { Activity, TypeActivity } from '../../core/models/Activity';
import ActivitiesTable from './ActivitiesTable';
import ActivityForm from './ActivityForm';

interface Props {
    opportunityId: string;
}

const PAGE_SIZE = 5;

const ActivitiesTab: React.FC<Props> = ({ opportunityId }) => {
    const { isAdmin } = useAuth();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [activityTypes, setActivityTypes] = useState<TypeActivity[]>([]);
    const [editing, setEditing] = useState<Activity | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
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
        } catch {
            setNotification({
                show: true, type: 'error', title: 'Error', message: 'No se pudo crear la actividad', onConfirm: hideNotification, onCancel: hideNotification
            });
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
        } catch {
            setNotification({
                show: true, type: 'error', title: 'Error', message: 'No se pudo actualizar la actividad', onConfirm: hideNotification, onCancel: hideNotification
            });
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

    const totalPages = Math.ceil(filteredActivities.length / PAGE_SIZE);
    const paginatedActivities = filteredActivities.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return (
        <div className="p-4 flex flex-col h-full max-h-[80vh]">
            <Notification {...notification} />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <div className="relative flex-grow w-full sm:w-auto">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                        <Search size={20} />
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar en actividades..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full border rounded-lg pl-10 pr-4 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <button
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 w-full sm:w-auto shadow-sm whitespace-nowrap"
                    onClick={openCreateModal}
                >
                    <Plus size={18} /> Nueva Actividad
                </button>
            </div>
            {loading ? (
                <Loader />
            ) : (
                <ActivitiesTable
                    activities={paginatedActivities}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    isAdmin={isAdmin}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            )}
            <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
                <ActivityForm
                    initialData={editing || { opportunityId }}
                    activityTypes={activityTypes}
                    onSubmit={editing ? handleUpdate : handleCreate}
                    onCancel={() => setModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default ActivitiesTab;