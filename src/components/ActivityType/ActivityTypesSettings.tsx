import React, { useEffect, useState, useMemo, useRef } from 'react';
import { getActivityTypes, createActivityType, updateActivityType, deleteActivityType } from '../../services/activitiesService';
import type { TypeActivity } from '../../core/models/Activity';
import ActivityTypeForm from './ActivityTypeForm';
import ActivityTypesTable from './ActivityTypesTable';
import Modal from '../Modal/Modal';
import Loader from '../Loader/Loader';
import { Filter, XCircle, Plus, ClipboardList } from 'lucide-react';
import Notification from '../Modal/Notification';
import Button from '../shared/Button';
import Select from '../shared/Select';
import UnifiedSearchBar from '../shared/UnifiedSearchBar';
import type { SearchBadge } from '../shared/UnifiedSearchBar';
import SettingsContainer from '../shared/SettingsContainer';

const PAGE_SIZE = 10;

const ActivityTypesSettings: React.FC = () => {
    const [types, setTypes] = useState<TypeActivity[]>([]);
    const [editing, setEditing] = useState<TypeActivity | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const [showFilters, setShowFilters] = useState(false);
    const [filterName, setFilterName] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);

    const searchDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
                setShowFilters(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    const statusOptions = useMemo(() => [
        { value: 'all', label: 'Todos los Estados' },
        { value: 'active', label: 'Activo' },
        { value: 'inactive', label: 'Inactivo' },
    ], []);

    const badges = useMemo(() => {
        const list: SearchBadge[] = [];
        if (filterStatus && filterStatus !== 'all') {
            const statusLabel = statusOptions.find(opt => opt.value === filterStatus)?.label || 'Estado';
            list.push({
                id: 'status',
                label: `Estado: ${statusLabel}`,
                icon: <Filter size={10} />,
                onRemove: () => setFilterStatus('all')
            });
        }
        return list;
    }, [filterStatus, statusOptions]);

    // Filtrado
    const filteredTypes = types.filter(type => {
        const matchesName = type.strname.toLowerCase().includes(filterName.toLowerCase());
        const matchesStatus =
            filterStatus === 'all' ||
            (filterStatus === 'active' && type.blnstatus) ||
            (filterStatus === 'inactive' && !type.blnstatus);
        return matchesName && matchesStatus;
    });

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
    }, [filterName, filterStatus]);

    const handleClearFilters = () => {
        setFilterName('');
        setFilterStatus('all');
    };

    return (
        <SettingsContainer
            title="Tipos de Actividad"
            description="Crea, edita o elimina los tipos de actividades disponibles en tu CRM."
            icon={<ClipboardList size={18} />}
            rightAction={
                <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 items-center">
                    <UnifiedSearchBar
                        ref={searchDropdownRef}
                        searchTerm={filterName}
                        onSearchChange={setFilterName}
                        placeholder={badges.length === 0 ? "Buscar por nombre..." : ""}
                        badges={badges}
                        showFilters={showFilters}
                        setShowFilters={setShowFilters}
                        dropdownWidthClass="w-[300px]"
                    >
                        <div className="w-full flex flex-col gap-3">
                            <div>
                                <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none">Estado</h4>
                                <Select
                                    options={statusOptions}
                                    value={statusOptions.find(opt => opt.value === filterStatus)}
                                    onChange={(selected) => setFilterStatus(selected ? selected.value : 'all')}
                                    placeholder="Todos los Estados"
                                />
                            </div>
                            <div className="border-t border-gray-100 my-1 pt-2 w-full" />
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 px-2 py-1.5 rounded w-full text-left hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                            >
                                <XCircle size={12} />
                                Limpiar Filtros
                            </button>
                        </div>
                    </UnifiedSearchBar>
                    <Button
                        variant="success"
                        onClick={openCreateModal}
                        className="w-full sm:w-auto h-[38px] py-0 px-4 flex items-center justify-center whitespace-nowrap"
                    >
                        <Plus size={16} className="mr-2" /> Nuevo Tipo
                    </Button>
                </div>
            }
        >
            <Notification {...notification} />
            
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
        </SettingsContainer>
    );
};

export default ActivityTypesSettings;
