import React, { useEffect, useState } from 'react';
import { getActivityTypes, createActivityType, updateActivityType, deleteActivityType } from '../../services/activitiesService';
import type { TypeActivity } from '../../core/models/Activity';
import ActivityTypeForm from './ActivityTypeForm';
import ActivityTypesTable from './ActivityTypesTable';
import Modal from '../Modal/Modal';
import Loader from '../Loader/Loader';
import { Filter, XCircle, Search, Plus } from 'lucide-react';
import Notification from '../Modal/Notification';

const PAGE_SIZE = 10;

const ActivityTypesSettings: React.FC = () => {
    const [types, setTypes] = useState<TypeActivity[]>([]);
    const [editing, setEditing] = useState<TypeActivity | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const [showFilters, setShowFilters] = useState(false);
    const [filterName, setFilterName] = useState('');

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

    const hideNotification = () => setNotification(prev => ({ ...prev, show: false }));

    const fetchTypes = async () => {
        setLoading(true);
        try {
            const data = await getActivityTypes();
            setTypes(data);
        } catch (error) {
            setNotification({
                show: true,
                type: 'error',
                title: 'Error',
                message: 'No se pudieron cargar los tipos de actividad',
                onConfirm: hideNotification,
                onCancel: hideNotification,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTypes();
    }, []);

    const handleCreate = async (type: Partial<TypeActivity>) => {
        setLoading(true);
        try {
            await createActivityType(type);
            setModalOpen(false);
            setNotification({
                show: true,
                type: 'success',
                title: '¡Éxito!',
                message: 'Tipo de actividad creado correctamente',
                onConfirm: hideNotification,
                onCancel: hideNotification,
            });
            fetchTypes();
        } catch (error: any) {
            const msg = error.response?.data?.message || 'No se pudo crear el tipo de actividad';
            setNotification({
                show: true,
                type: 'error',
                title: 'Error',
                message: Array.isArray(msg) ? msg.join(', ') : msg,
                onConfirm: hideNotification,
                onCancel: hideNotification,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (type: Partial<TypeActivity>) => {
        if (type.id) {
            setLoading(true);
            try {
                const { id, ...updateData } = type;
                await updateActivityType(id, updateData);
                setEditing(null);
                setModalOpen(false);
                setNotification({
                    show: true,
                    type: 'success',
                    title: '¡Éxito!',
                    message: 'Tipo de actividad actualizado correctamente',
                    onConfirm: hideNotification,
                    onCancel: hideNotification,
                });
                fetchTypes();
            } catch (error: any) {
                const msg = error.response?.data?.message || 'No se pudo actualizar el tipo de actividad';
                setNotification({
                    show: true,
                    type: 'error',
                    title: 'Error',
                    message: Array.isArray(msg) ? msg.join(', ') : msg,
                    onConfirm: hideNotification,
                    onCancel: hideNotification,
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleDelete = async (type: TypeActivity) => {
        if (!type.id) return;
        setNotification({
            show: true,
            type: 'confirmation',
            title: '¿Seguro que deseas eliminar este tipo?',
            message: 'Si tiene actividades asignadas, pasarán a mostrarse con el tipo predeterminado "Tipo de actividad eliminada". Esta acción no se puede deshacer.',
            onConfirm: async () => {
                hideNotification();
                try {
                    await deleteActivityType(type.id);
                    setNotification({
                        show: true,
                        type: 'success',
                        title: '¡Éxito!',
                        message: 'Tipo de actividad eliminado correctamente.',
                        onConfirm: hideNotification,
                        onCancel: hideNotification,
                    });
                    fetchTypes();
                } catch (error: any) {
                    const msg = error.response?.data?.message || 'No se pudo eliminar el tipo de actividad.';
                    setNotification({
                        show: true,
                        type: 'error',
                        title: 'Error',
                        message: Array.isArray(msg) ? msg.join(', ') : msg,
                        onConfirm: hideNotification,
                        onCancel: hideNotification,
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

    const openEditModal = (type: TypeActivity) => {
        setEditing(type);
        setModalOpen(true);
    };

    // Filtrado
    const filteredTypes = types.filter(type =>
        type.strname.toLowerCase().includes(filterName.toLowerCase())
    );

    // Paginación
    const totalPages = Math.ceil(filteredTypes.length / PAGE_SIZE);
    const paginatedTypes = filteredTypes.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [filterName]);

    const handleClearFilters = () => {
        setFilterName('');
    };

    return (
        <>
            <Notification {...notification} />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-gray-100 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Tipos de Actividad</h2>
                    <p className="text-sm text-gray-500 mt-1">Crea, edita o elimina los tipos de actividades disponibles en tu CRM.</p>
                </div>
                <div className="flex w-full sm:w-auto gap-3">
                    <button
                        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 flex items-center justify-center gap-2 transition-colors w-full sm:w-auto shadow-sm whitespace-nowrap text-sm"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter size={14} />
                        <span>Filtros</span>
                    </button>
                    <button
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors w-full sm:w-auto shadow-sm whitespace-nowrap text-sm"
                        onClick={openCreateModal}
                    >
                        <Plus size={16} /> Nuevo Tipo
                    </button>
                </div>
            </div>

            {showFilters && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 animate-fade-in-down">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-semibold text-gray-700">Filtros</h3>
                        <button onClick={handleClearFilters} className="flex items-center text-xs text-blue-600 hover:text-blue-800">
                            <XCircle size={14} className="mr-1" />
                            Limpiar filtros
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                                <Search size={16} />
                            </span>
                            <input
                                type="text"
                                placeholder="Filtrar por nombre del tipo"
                                value={filterName}
                                onChange={e => setFilterName(e.target.value)}
                                className="w-full border rounded-lg pl-9 pr-4 py-1.5 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            />
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <Loader />
            ) : (
                <ActivityTypesTable
                    types={paginatedTypes}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            )}

            <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
                <ActivityTypeForm
                    initialData={editing || undefined}
                    onSubmit={editing ? handleUpdate : handleCreate}
                    onCancel={() => setModalOpen(false)}
                />
            </Modal>
        </>
    );
};

export default ActivityTypesSettings;
