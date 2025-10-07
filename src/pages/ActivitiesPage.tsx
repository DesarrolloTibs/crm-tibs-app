import React, { useEffect, useState, useCallback,useMemo } from 'react';
import { getActivities, createActivity, updateActivity, deleteActivity } from '../services/activitiesService';
import Select, { type SingleValue } from 'react-select';
import { getUsers } from '../services/usersService';

import ActivityForm from '../components/Activity/ActivityForm';
import Modal from '../components/Modal/Modal';
import Loader from '../components/Loader/Loader';
import ActivitiesTable from '../components/Activity/ActivitiesTable';
import { PlusCircle, Filter, XCircle, Search, User, Calendar } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Notification from '../components/Modal/Notification';
import type { Activity } from '../core/models/Activity';
import type { User as UserModel } from '../core/models/User';

interface SelectOption {
    value: string;
    label: string;
}

const PAGE_SIZE = 10;

const ActivitiesPage: React.FC = () => {
    const { isAdmin } = useAuth();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [users, setUsers] = useState<UserModel[]>([]);
    const [editing, setEditing] = useState<Activity | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const [showFilters, setShowFilters] = useState(false);
    const [filterTitle, setFilterTitle] = useState('');
    const [filterUser, setFilterUser] = useState('');
    const [filterDate, setFilterDate] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);

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
            const data = await getActivities();
            setActivities(data);
        } catch {
            setNotification({
                show: true, type: 'error', title: 'Error', message: 'No se pudieron cargar las actividades', onConfirm: hideNotification, onCancel: hideNotification
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersData = await getUsers();
                setUsers(usersData.sort((a, b) => a.username.localeCompare(b.username)));
            } catch (error) {
                console.error("Failed to fetch users for filter", error);
            }
        };
        fetchUsers();
    }, []);

    const handleCreate = async (activity: Partial<Activity>) => {
        setLoading(true);
        try {
            await createActivity(activity);
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
        if (activity.id) {
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
        }
    };

    const handleDelete = async (activity: Activity) => {
        if (!activity.id) return;
        setNotification({
            show: true,
            type: 'confirmation',
            title: `¿Seguro que deseas eliminar esta actividad?`,
            message: 'Esta acción no se puede deshacer.',
            onConfirm: async () => {
                hideNotification();
                try {
                    await deleteActivity(activity.id);
                    setNotification({
                        show: true, type: 'success', title: '¡Éxito!', message: `Actividad eliminada correctamente.`, onConfirm: hideNotification, onCancel: hideNotification
                    });
                    fetchActivities();
                } catch {
                    setNotification({
                        show: true, type: 'error', title: 'Error', message: `No se pudo eliminar la actividad.`, onConfirm: hideNotification, onCancel: hideNotification
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

    const userOptions: SelectOption[] = useMemo(() =>
        users
            .filter((user): user is UserModel & { id: string } => !!user.id) // Aseguramos que el usuario y su id existen
            .map(user => ({
                value: user.id,
                label: user.username,
            })),
    [users]);

    const handleUserFilterChange = (selectedOption: SingleValue<SelectOption>) => {
        setFilterUser(selectedOption ? selectedOption.value : '');
    };


    const filteredActivities = activities.filter(activity =>
        activity.activity.toLowerCase().includes(filterTitle.toLowerCase()) &&
        (filterUser ? activity.userId === filterUser : true) &&
        (filterDate ? activity.date.startsWith(filterDate) : true)
    );

    const totalPages = Math.ceil(filteredActivities.length / PAGE_SIZE);
    const paginatedActivities = filteredActivities.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [filterTitle, filterUser, filterDate]);

    const handleClearFilters = () => {
        setFilterTitle('');
        setFilterUser('');
        setFilterDate('');
    };

    return (
        <>
            <Notification {...notification} />
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Actividades</h1>
                <div className="flex items-center space-x-4">
                    <button
                        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 flex items-center gap-2 transition-colors"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter size={16} />
                        <span>Filtros</span>
                    </button>
                    <button
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                        onClick={openCreateModal}
                    >
                        <PlusCircle size={18} /> Nueva Actividad
                    </button>
                </div>
            </div>
            {showFilters && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 animate-fade-in-down">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-700">Filtros</h3>
                        <button onClick={handleClearFilters} className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                            <XCircle size={16} className="mr-1" />
                            Limpiar filtros
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                                <Search size={20} />
                            </span>
                            <input
                                type="text"
                                placeholder="Filtrar por actividad"
                                value={filterTitle}
                                onChange={e => setFilterTitle(e.target.value)}
                                className="w-full border rounded-lg pl-10 pr-4 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                                <User size={20} />
                            </span>
                            <Select
                                inputId="user-filter"
                                options={userOptions}
                                value={filterUser ? userOptions.find(option => option.value === filterUser) : null}
                                onChange={handleUserFilterChange}
                                placeholder="Filtrar por usuario"
                                isClearable
                                isSearchable
                                noOptionsMessage={() => 'No se encontraron usuarios'}
                                styles={{ input: (base) => ({ ...base, paddingLeft: '28px' }) }}
                            />
                        </div>
                        <div className="relative">
                             <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                                <Calendar size={20} />
                            </span>
                            <input
                                type="date"
                                value={filterDate}
                                onChange={e => setFilterDate(e.target.value)}
                                className="w-full border rounded-lg pl-10 pr-4 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>
                </div>
            )}
            {loading ? (
                <Loader />
            ) : (
                <>
                    <ActivitiesTable
                        activities={paginatedActivities}
                        onEdit={openEditModal}
                        onDelete={handleDelete}
                        isAdmin={isAdmin}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </>
            )}
            <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
                <ActivityForm
                    initialData={editing || undefined}
                    onSubmit={editing ? handleUpdate : handleCreate}
                    onCancel={() => setModalOpen(false)}
                />
            </Modal>
        </>
    );
};

export default ActivitiesPage;