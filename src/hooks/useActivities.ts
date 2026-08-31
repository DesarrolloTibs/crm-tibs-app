import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { type SingleValue } from 'react-select';
import { io } from 'socket.io-client';
import { getActivities, createActivity, updateActivity, deleteActivity, getActivityTypes } from '../services/activitiesService';
import { getUsers } from '../services/usersService';
import { useAuth } from './useAuth';
import { useConfigStore } from '../store/useConfigStore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Activity, TypeActivity } from '../core/models/Activity';
import type { User as UserModel } from '../core/models/User';

export interface SelectOption { value: string; label: string; }

type NotifType = 'success' | 'error' | 'warning' | 'confirmation';
interface Notif { show: boolean; type: NotifType; title: string; message: string; onConfirm: () => void; onCancel: () => void; }
const NOTIF_OFF: Notif = { show: false, type: 'success', title: '', message: '', onConfirm: () => {}, onCancel: () => {} };

const EXPORT_HEADERS_BASE = ['Actividad', 'Tipo', 'Fecha', 'Usuario', 'Relación', 'Oportunidad'];

export function useActivities() {
  const { isAdmin, user } = useAuth();
  const { selectedTenant } = useConfigStore();
  const schemaName = selectedTenant?.schema_name;

  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityTypes, setActivityTypes] = useState<TypeActivity[]>([]);
  const [users, setUsers] = useState<UserModel[]>([]);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('calendar');
  const [initialDate, setInitialDate] = useState<string | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [filterTitle, setFilterTitle] = useState('');
  const [filterUser, setFilterUser] = useState(isAdmin && user?.id ? user.id : '');
  const [filterDate, setFilterDate] = useState('');
  const [filterType, setFilterType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<Notif>(NOTIF_OFF);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const initializedUserFilterRef = useRef(false);

  useEffect(() => {
    if (user?.id && isAdmin && !initializedUserFilterRef.current) {
      setFilterUser(user.id);
      initializedUserFilterRef.current = true;
    }
  }, [user?.id, isAdmin]);

  useEffect(() => {
    initializedUserFilterRef.current = false;
  }, [schemaName]);

  const hideNotification = () => setNotification(prev => ({ ...prev, show: false }));
  const showSuccess = (msg: string) => setNotification({ show: true, type: 'success', title: '¡Éxito!', message: msg, onConfirm: hideNotification, onCancel: hideNotification });
  const showError = (msg: string) => setNotification({ show: true, type: 'error', title: 'Error', message: msg, onConfirm: hideNotification, onCancel: hideNotification });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) setShowFilters(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setCurrentPage(1); }, [filterTitle, filterUser, filterDate, filterType, pageSize]);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try { const data = await getActivities(); setActivities(data); }
    catch { showError('No se pudieron cargar las actividades'); }
    finally { setLoading(false); }
  }, []);

  const fetchActivityTypes = useCallback(async () => {
    try { const types = await getActivityTypes(); setActivityTypes(types.filter(t => t.blnstatus)); }
    catch { console.error('Failed to fetch activity types'); }
  }, []);

  useEffect(() => { fetchActivities(); fetchActivityTypes(); }, [fetchActivities, fetchActivityTypes, schemaName]);

  // ── Socket.io ──
  useEffect(() => {
    const rawUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
    const socketPath = rawUrl.includes('/backend') ? '/backend/socket.io' : '/socket.io';
    const originUrl = rawUrl.replace(/\/backend\/?$/, '');
    const socket = io(`${originUrl}/activities`, { path: socketPath });

    socket.on('connect', () => console.log('Connected to Activities WebSocket server'));

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
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    getUsers().then(d => setUsers(d.sort((a, b) => a.username.localeCompare(b.username)))).catch(console.error);
  }, [isAdmin]);

  const handleCreate = async (activity: Partial<Activity>) => {
    setLoading(true);
    try { await createActivity(activity); setModalOpen(false); showSuccess('Actividad creada correctamente'); fetchActivities(); }
    catch { showError('No se pudo crear la actividad'); throw new Error('create failed'); }
    finally { setLoading(false); }
  };

  const handleUpdate = async (activity: Partial<Activity>) => {
    if (!activity.id) return;
    setLoading(true);
    try {
      const { id, user: _u, opportunity: _o, userId: _uid, typeActivity: _ta, ...updateData } = activity as Activity;
      await updateActivity(id, updateData);
      setEditing(null); setModalOpen(false);
      showSuccess('Actividad actualizada correctamente'); fetchActivities();
    } catch { showError('No se pudo actualizar la actividad'); throw new Error('update failed'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (activity: Activity) => {
    if (!activity.id) return;
    setNotification({
      show: true, type: 'confirmation',
      title: '¿Seguro que deseas eliminar esta actividad?',
      message: 'Esta acción no se puede deshacer.',
      onConfirm: async () => {
        hideNotification();
        try { await deleteActivity(activity.id); showSuccess('Actividad eliminada correctamente.'); fetchActivities(); }
        catch { showError('No se pudo eliminar la actividad.'); }
      },
      onCancel: hideNotification,
    });
  };

  const openCreateModal = () => { setEditing(null); setInitialDate(undefined); setModalOpen(true); };
  const openCreateModalWithDate = (date: string) => { setEditing(null); setInitialDate(date); setModalOpen(true); };
  const openEditModal = (activity: Activity) => { setEditing(activity); setInitialDate(undefined); setModalOpen(true); };

  const userOptions: SelectOption[] = useMemo(() =>
    users.filter((u): u is UserModel & { id: string } => !!u.id).map(u => ({ value: u.id, label: u.username })),
    [users]
  );

  const typeOptions: SelectOption[] = useMemo(() =>
    activityTypes.map(t => ({ value: String(t.id), label: t.strname })),
    [activityTypes]
  );

  const handleUserFilterChange = (sel: SingleValue<SelectOption>) => setFilterUser(sel ? sel.value : '');

  const filteredActivities = useMemo(() => activities.filter(a => {
    const matchesTitle = a.activity.toLowerCase().includes(filterTitle.toLowerCase()) || (a.reminder?.title || '').toLowerCase().includes(filterTitle.toLowerCase());
    const matchesUser = filterUser ? (a.userId === filterUser || a.user?.id === filterUser) : true;
    const matchesDate = filterDate ? a.date.startsWith(filterDate) : true;
    const matchesType = filterType ? String(a.typeActivityId) === filterType : true;
    return matchesTitle && matchesUser && matchesDate && matchesType;
  }), [activities, filterTitle, filterUser, filterDate, filterType]);

  const totalPages = pageSize === 0 ? 1 : Math.ceil(filteredActivities.length / pageSize);
  const paginatedActivities = useMemo(() => pageSize === 0 ? filteredActivities : filteredActivities.slice((currentPage-1)*pageSize, currentPage*pageSize), [filteredActivities, currentPage, pageSize]);

  const handleClearFilters = () => { setFilterTitle(''); setFilterUser(''); setFilterDate(''); setFilterType(''); };

  const formatDateBadge = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    if (!year || !month) return dateStr;
    if (day) return new Date(Number(year), Number(month)-1, Number(day)).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
    return dateStr;
  };

  const hasReminders = filteredActivities.some(a => !!a.reminder);
  const EXPORT_HEADERS = [...EXPORT_HEADERS_BASE, ...(hasReminders ? ['Recordatorio'] : [])];

  const buildExportRows = () => filteredActivities.map(activity => {
    const relacion = activity.company ? `Empresa: ${activity.company.nombre}` : activity.client ? `Contacto: ${activity.client.nombre} ${activity.client.apellido||''}`.trim() : '';
    const row = [activity.activity||'', activity.typeActivity?.strname||'', activity.date ? new Date(activity.date).toLocaleString('es-MX') : '', activity.user?.username||'', relacion, activity.opportunity?.nombre_proyecto||''];
    if (hasReminders) row.push(activity.reminder ? activity.reminder.title : '');
    return row;
  });

  const getActiveUserLabel = () => isAdmin ? (filterUser ? (users.find(u => u.id === filterUser)?.username || (filterUser === user?.id ? user?.username : 'Usuario')) : 'Todos los usuarios') : (user?.username || '');

  const handleExportPDF = () => {
    const rows = buildExportRows();
    const activeUsername = getActiveUserLabel();
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
    doc.setFontSize(16); doc.setTextColor(40,40,40); doc.text('Reporte de Actividades', 40, 40);
    doc.setFontSize(9); doc.setTextColor(100,100,100);
    doc.text(`Usuario: ${activeUsername}`, 40, 58);
    if (filterDate) doc.text(`Fecha: ${filterDate}`, 240, 58);
    if (filterTitle) doc.text(`Búsqueda: "${filterTitle}"`, filterDate?360:240, 58);
    doc.text(`Generado el: ${new Date().toLocaleString('es-MX')}`, 40, 70);
    autoTable(doc, { head:[EXPORT_HEADERS], body:rows, startY:82, styles:{fontSize:7.5,cellPadding:4,overflow:'linebreak'}, headStyles:{fillColor:[79,70,229],textColor:255,fontStyle:'bold'}, alternateRowStyles:{fillColor:[245,245,255]}, columnStyles:{0:{cellWidth:160},1:{cellWidth:70},2:{cellWidth:85},3:{cellWidth:60},4:{cellWidth:100},5:{cellWidth:100},...(hasReminders?{6:{cellWidth:'auto'}}:{})} });
    const userSuffix = activeUsername !== 'Todos los usuarios' ? `_${activeUsername}` : '';
    const dateSuffix = filterDate ? `_${filterDate}` : '';
    doc.save(`actividades${userSuffix}${dateSuffix}.pdf`);
  };

  const handleExportCSV = () => {
    const rows = buildExportRows();
    const activeUsername = getActiveUserLabel();
    const csv = [EXPORT_HEADERS.join(','), ...rows.map(r => r.map(v => { const e=String(v).replace(/"/g,'""'); return /[,"\n\r]/.test(e)?`"${e}"`:e; }).join(','))].join('\n');
    const blob = new Blob(['\ufeff'+csv], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url;
    const userSuffix = activeUsername !== 'Todos los usuarios' ? `_${activeUsername}` : '';
    const dateSuffix = filterDate ? `_${filterDate}` : '';
    a.download = `actividades${userSuffix}${dateSuffix}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return {
    isAdmin, user, activities, activityTypes, users, editing, modalOpen, setModalOpen,
    viewMode, setViewMode, initialDate, showFilters, setShowFilters,
    filterTitle, setFilterTitle, filterUser, setFilterUser, filterDate, setFilterDate,
    filterType, setFilterType, currentPage, setCurrentPage, pageSize, setPageSize,
    loading, notification, searchDropdownRef,
    userOptions, typeOptions, handleUserFilterChange,
    filteredActivities, paginatedActivities, totalPages,
    handleCreate, handleUpdate, handleDelete,
    openCreateModal, openCreateModalWithDate, openEditModal,
    handleClearFilters, formatDateBadge, hasReminders,
    handleExportPDF, handleExportCSV,
  };
}
