import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { getActivities, createActivity, updateActivity, deleteActivity, getActivityTypes } from '../services/activitiesService';
import { type SingleValue } from 'react-select';
import { getUsers } from '../services/usersService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import ActivityForm from '../components/Activity/ActivityForm';
import Modal from '../components/Modal/Modal';
import Loader from '../components/Loader/Loader';
import ActivitiesTable from '../components/Activity/ActivitiesTable';
import ActivitiesCalendar from '../components/Activity/ActivitiesCalendar';
import { Plus, XCircle, User, LayoutGrid, Table2, FileSpreadsheet, FileText, CalendarDays, Tag } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Notification from '../components/Modal/Notification';
import type { Activity, TypeActivity } from '../core/models/Activity';
import type { User as UserModel } from '../core/models/User';

import Input from '../components/shared/Input';
import Select from '../components/shared/Select';
import Button from '../components/shared/Button';
import UnifiedSearchBar from '../components/shared/UnifiedSearchBar';
import type { SearchBadge } from '../components/shared/UnifiedSearchBar';

interface SelectOption {
    value: string;
    label: string;
}

type ViewMode = 'table' | 'calendar';

const ActivitiesPage: React.FC = () => {
    const { isAdmin, user } = useAuth();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [pageSize, setPageSize] = useState<number>(10);
    const [activityTypes, setActivityTypes] = useState<TypeActivity[]>([]);
    const [users, setUsers] = useState<UserModel[]>([]);
    const [editing, setEditing] = useState<Activity | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('calendar');
    const [initialDate, setInitialDate] = useState<string | undefined>(undefined);

    const [showFilters, setShowFilters] = useState(false);
    const [filterTitle, setFilterTitle] = useState('');
    const [filterUser, setFilterUser] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterType, setFilterType] = useState('');

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
        onConfirm: () => { },
        onCancel: () => { },
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

    const fetchActivityTypes = useCallback(async () => {
        try {
            const types = await getActivityTypes();
            // Filtrar solo los tipos activos (blnstatus === true)
            setActivityTypes(types.filter(t => t.blnstatus));
        } catch (error) {
            console.error("Failed to fetch activity types", error);
        }
    }, []);

    useEffect(() => {
        fetchActivities();
        fetchActivityTypes();
    }, [fetchActivities, fetchActivityTypes]);

    useEffect(() => {
        if (!isAdmin) return;
        const fetchUsers = async () => {
            try {
                const usersData = await getUsers();
                setUsers(usersData.sort((a, b) => a.username.localeCompare(b.username)));
            } catch (error) {
                console.error("Failed to fetch users for filter", error);
            }
        };
        fetchUsers();
    }, [isAdmin]);

    const handleCreate = async (activity: Partial<Activity>) => {
        setLoading(true);
        try {
            await createActivity(activity);
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
        if (activity.id) {
            setLoading(true);
            try {
                const { id, user, opportunity, userId, typeActivity, ...updateData } = activity as Activity;
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
        setInitialDate(undefined);
        setModalOpen(true);
    };

    const openCreateModalWithDate = (date: string) => {
        setEditing(null);
        setInitialDate(date);
        setModalOpen(true);
    };

    const openEditModal = (activity: Activity) => {
        setEditing(activity);
        setInitialDate(undefined);
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


    const filteredActivities = activities.filter(activity => {
        const matchesTitle = activity.activity.toLowerCase().includes(filterTitle.toLowerCase()) ||
            (activity.reminder?.title && activity.reminder.title.toLowerCase().includes(filterTitle.toLowerCase()));
            
        return matchesTitle &&
            (filterUser ? activity.userId === filterUser : true) &&
            (filterDate ? activity.date.startsWith(filterDate) : true) &&
            (filterType ? String(activity.typeActivityId) === filterType : true);
    });

    const totalPages = pageSize === 0 ? 1 : Math.ceil(filteredActivities.length / pageSize);
    const paginatedActivities = pageSize === 0 ? filteredActivities : filteredActivities.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [filterTitle, filterUser, filterDate, filterType, pageSize]);

    const handleClearFilters = () => {
        setFilterTitle('');
        setFilterUser('');
        setFilterDate('');
        setFilterType('');
    };

    // Columnas idénticas a la tabla en pantalla:
    // Actividad | Tipo | Fecha | Usuario | Relación | Oportunidad | Recordatorio (solo si hay alguno)
    const hasReminders = filteredActivities.some(a => !!a.reminder);

    const EXPORT_HEADERS = [
        'Actividad', 'Tipo', 'Fecha', 'Usuario', 'Relación', 'Oportunidad',
        ...(hasReminders ? ['Recordatorio'] : []),
    ];

    const buildExportRows = () =>
        filteredActivities.map(activity => {
            const relacion = activity.company
                ? `Empresa: ${activity.company.nombre}`
                : activity.client
                    ? `Contacto: ${activity.client.nombre} ${activity.client.apellido || ''}`.trim()
                    : '';
            const row = [
                activity.activity || '',
                activity.typeActivity?.strname || '',
                activity.date ? new Date(activity.date).toLocaleString('es-MX') : '',
                activity.user?.username || '',
                relacion,
                activity.opportunity?.nombre_proyecto || '',
            ];
            if (hasReminders) {
                row.push(activity.reminder ? activity.reminder.title : '');
            }
            return row;
        });

    const getActiveUserLabel = () =>
        isAdmin
            ? (filterUser ? users.find(u => u.id === filterUser)?.username || 'Todos los usuarios' : 'Todos los usuarios')
            : (user?.username || '');

    const handleExportPDF = () => {
        const rows = buildExportRows();
        const activeUsername = getActiveUserLabel();

        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });

        doc.setFontSize(16);
        doc.setTextColor(40, 40, 40);
        doc.text('Reporte de Actividades', 40, 40);

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Usuario: ${activeUsername}`, 40, 58);
        if (filterDate) doc.text(`Fecha: ${filterDate}`, 240, 58);
        if (filterTitle) doc.text(`Búsqueda: "${filterTitle}"`, filterDate ? 360 : 240, 58);
        doc.text(`Generado el: ${new Date().toLocaleString('es-MX')}`, 40, 70);

        autoTable(doc, {
            head: [EXPORT_HEADERS],
            body: rows,
            startY: 82,
            styles: { fontSize: 7.5, cellPadding: 4, overflow: 'linebreak' },
            headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 255] },
            columnStyles: {
                0: { cellWidth: 160 }, // Actividad
                1: { cellWidth: 70 },  // Tipo
                2: { cellWidth: 85 },  // Fecha
                3: { cellWidth: 60 },  // Usuario
                4: { cellWidth: 100 }, // Relación
                5: { cellWidth: 100 }, // Oportunidad
                ...(hasReminders ? { 6: { cellWidth: 'auto' } } : {}), // Recordatorio
            },
        });

        const userSuffix = activeUsername !== 'Todos los usuarios' ? `_${activeUsername}` : '';
        const dateSuffix = filterDate ? `_${filterDate}` : '';
        doc.save(`actividades${userSuffix}${dateSuffix}.pdf`);
    };

    const handleExportCSV = () => {
        const rows = buildExportRows();
        const activeUsername = getActiveUserLabel();

        const csvContent = [
            EXPORT_HEADERS.join(','),
            ...rows.map(row =>
                row.map(val => {
                    const escaped = String(val).replace(/"/g, '""');
                    return /[,\"\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        const userSuffix = activeUsername !== 'Todos los usuarios' ? `_${activeUsername}` : '';
        const dateSuffix = filterDate ? `_${filterDate}` : '';
        link.setAttribute('download', `actividades${userSuffix}${dateSuffix}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const typeOptions: SelectOption[] = useMemo(() =>
        activityTypes.map(t => ({ value: String(t.id), label: t.strname })),
        [activityTypes]
    );

    const formatDateBadge = (dateStr: string) => {
        if (!dateStr) return '';
        // dateStr is YYYY-MM-DD
        const [year, month, day] = dateStr.split('-');
        if (!year || !month) return dateStr;
        if (day) {
            const d = new Date(Number(year), Number(month) - 1, Number(day));
            return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
        }
        return dateStr;
    };

    const badges = useMemo(() => {
        const list: SearchBadge[] = [];
        if (filterUser) {
            list.push({
                id: 'user',
                label: userOptions.find(o => o.value === filterUser)?.label || 'Usuario',
                icon: <User size={10} />,
                onRemove: () => setFilterUser('')
            });
        }
        if (filterType) {
            list.push({
                id: 'type',
                label: typeOptions.find(o => o.value === filterType)?.label || 'Tipo',
                icon: <Tag size={10} />,
                onRemove: () => setFilterType('')
            });
        }
        if (filterDate) {
            list.push({
                id: 'date',
                label: formatDateBadge(filterDate),
                icon: <CalendarDays size={10} />,
                onRemove: () => setFilterDate('')
            });
        }
        return list;
    }, [filterUser, filterType, filterDate, userOptions, typeOptions]);

    return (
        <>
            <Notification {...notification} />

            {/* Cabecera de impresión (oculta en pantalla, visible al imprimir/exportar a PDF) */}
            <div className="hidden print-only-block mb-6 border-b border-gray-300 pb-4">
                <h1 className="text-3xl font-bold text-gray-900">Reporte de Actividades</h1>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>
                        <span className="font-semibold">Usuario:</span>{' '}
                        {isAdmin 
                            ? (filterUser ? userOptions.find(o => o.value === filterUser)?.label || 'Desconocido' : 'Todos los usuarios')
                            : (user?.username || 'Ejecutivo')}
                    </div>
                    {filterDate && (
                        <div>
                            <span className="font-semibold">Fecha:</span> {filterDate}
                        </div>
                    )}
                    {filterTitle && (
                        <div>
                            <span className="font-semibold">Búsqueda:</span> "{filterTitle}"
                        </div>
                    )}
                    <div>
                        <span className="font-semibold">Generado el:</span> {new Date().toLocaleString('es-MX')}
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
                <h1 className="text-2xl font-bold text-gray-800">Actividades</h1>
                <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 items-center">
                    {/* Toggle Tabla / Calendario */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1 shrink-0">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
                                viewMode === 'table'
                                    ? 'bg-white text-indigo-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Table2 size={15} />
                            Tabla
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
                                viewMode === 'calendar'
                                    ? 'bg-white text-indigo-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <LayoutGrid size={15} />
                            Calendario
                        </button>
                    </div>

                    <UnifiedSearchBar
                        ref={searchDropdownRef}
                        searchTerm={filterTitle}
                        onSearchChange={setFilterTitle}
                        placeholder={!filterUser && !filterDate && !filterType ? 'Buscar actividad...' : ''}
                        badges={badges}
                        showFilters={showFilters}
                        setShowFilters={setShowFilters}
                        dropdownWidthClass="w-[420px]"
                    >
                        <div className="flex gap-4 w-full">
                            {/* Columna izquierda */}
                            <div className="flex flex-col gap-3 flex-1 min-w-0">
                                {isAdmin && (
                                    <div>
                                        <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none flex items-center gap-1">
                                            <User size={9} /> Usuario
                                        </h4>
                                        <Select
                                            inputId="user-filter"
                                            options={userOptions}
                                            value={filterUser ? userOptions.find(option => option.value === filterUser) : null}
                                            onChange={handleUserFilterChange}
                                            placeholder="Todos los usuarios"
                                            isClearable
                                            isSearchable
                                            noOptionsMessage={() => 'No se encontraron usuarios'}
                                        />
                                    </div>
                                )}
                                <div>
                                    <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none flex items-center gap-1">
                                        <Tag size={9} /> Tipo de Actividad
                                    </h4>
                                    <Select
                                        inputId="type-filter"
                                        options={typeOptions}
                                        value={filterType ? typeOptions.find(o => o.value === filterType) : null}
                                        onChange={(opt: any) => setFilterType(opt ? opt.value : '')}
                                        placeholder="Todos los tipos"
                                        isClearable
                                    />
                                </div>
                            </div>

                            {/* Divisor vertical */}
                            <div className="w-px bg-gray-100 self-stretch" />

                            {/* Columna derecha */}
                            <div className="flex flex-col gap-3 flex-1 min-w-0">
                                <div>
                                    <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none flex items-center gap-1">
                                        <CalendarDays size={9} /> Fecha
                                    </h4>
                                    <Input
                                        type="date"
                                        value={filterDate}
                                        onChange={(e) => setFilterDate(e.target.value)}
                                        className="text-xs bg-white cursor-pointer py-2 rounded-xl"
                                    />
                                </div>
                                <div className="border-t border-gray-100 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleClearFilters}
                                        className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 px-2 py-1.5 rounded w-full text-left hover:bg-red-50 transition-colors cursor-pointer"
                                    >
                                        <XCircle size={12} />
                                        Limpiar Filtros
                                    </button>
                                </div>
                            </div>
                        </div>
                    </UnifiedSearchBar>

                    {/* Botones de Exportación (solo visibles en vista Tabla) */}
                    {viewMode === 'table' && (
                        <>
                            <Button
                                onClick={handleExportPDF}
                                variant="secondary"
                                className="text-red-500 border border-blue-100 hover:bg-red-50/50 w-full sm:w-auto h-[38px] py-0 px-4 flex items-center justify-center font-bold text-xs tracking-wider"
                            >
                                <FileText size={16} className="text-red-500 mr-2" />
                                <span>PDF</span>
                            </Button>
                            <Button
                                onClick={handleExportCSV}
                                variant="secondary"
                                className="text-emerald-600 border border-blue-100 hover:bg-emerald-50/50 w-full sm:w-auto h-[38px] py-0 px-4 flex items-center justify-center font-bold text-xs tracking-wider"
                            >
                                <FileSpreadsheet size={16} className="text-emerald-600 mr-2" />
                                <span>EXCEL</span>
                            </Button>
                        </>
                    )}

                    <Button
                        variant="success"
                        className="w-full sm:w-auto whitespace-nowrap h-[38px] py-0 px-4"
                        onClick={openCreateModal}
                    >
                        <Plus size={18} className="mr-2" /> Nueva Actividad
                    </Button>
                </div>
            </div>
            {loading ? (
                <Loader />
            ) : viewMode === 'calendar' ? (
                <ActivitiesCalendar
                    activities={filteredActivities}
                    activityTypes={activityTypes}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    onCreateWithDate={openCreateModalWithDate}
                />
            ) : (
                <>
                    <ActivitiesTable
                        activities={paginatedActivities}
                        onEdit={openEditModal}
                        onDelete={handleDelete}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        pageSize={pageSize}
                        onPageSizeChange={setPageSize}
                        totalCount={activities.length}
                        filteredCount={filteredActivities.length}
                    />
                </>
            )}
            <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
                <ActivityForm
                    initialData={editing ? editing : (initialDate ? { date: initialDate } : undefined)}
                    activityTypes={activityTypes}
                    onSubmit={editing ? handleUpdate : handleCreate}
                    onCancel={() => setModalOpen(false)}
                />
            </Modal>
        </>
    );
};

export default ActivitiesPage;