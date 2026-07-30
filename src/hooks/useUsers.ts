import { useState, useEffect, useMemo, useRef } from 'react';
import { getUsers, createUser, updateUser, updateUserStatus } from '../services/usersService';
import type { User } from '../core/models/User';
import { useAuth } from './useAuth';

const PAGE_SIZE = 10;
type NotifType = 'success' | 'error' | 'warning' | 'confirmation';
interface Notif { show: boolean; type: NotifType; title: string; message: string; onConfirm: () => void; onCancel: () => void; }
const NOTIF_OFF: Notif = { show: false, type: 'success', title: '', message: '', onConfirm: () => {}, onCancel: () => {} };

export function useUsers() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [editing, setEditing] = useState<User | null>(null);
  const [uploadingUser, setUploadingUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterUsername, setFilterUsername] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [notification, setNotification] = useState<Notif>(NOTIF_OFF);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  const hideNotification = () => setNotification(prev => ({ ...prev, show: false }));
  const showSuccess = (msg: string) => setNotification({ show: true, type: 'success', title: '¡Éxito!', message: msg, onConfirm: hideNotification, onCancel: hideNotification });
  const showError = (msg: string) => setNotification({ show: true, type: 'error', title: 'Error', message: msg, onConfirm: hideNotification, onCancel: hideNotification });

  useEffect(() => {
    const h = (e: MouseEvent) => { if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) setShowFilters(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => { setCurrentPage(1); }, [filterUsername, filterEmail, filterRole]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      setUsers(Array.isArray(res) ? res : (res as any)?.data || []);
    }
    catch { showError('No se pudieron cargar los usuarios'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (user: User) => {
    setLoading(true);
    try { await createUser(user); setModalOpen(false); showSuccess('Usuario creado correctamente'); fetchUsers(); }
    catch { showError('No se pudo crear el usuario'); }
    finally { setLoading(false); }
  };

  const handleUpdate = async (user: User) => {
    if (!user.id) return;
    setLoading(true);
    try { const { id, ...d } = user; await updateUser(id, d); setEditing(null); setModalOpen(false); showSuccess('Usuario actualizado correctamente'); fetchUsers(); }
    catch { showError('No se pudo actualizar el usuario'); }
    finally { setLoading(false); }
  };

  const handleUpdateStatus = async (user: User) => {
    if (!user.id) return;
    const isActivating = !user.isActive;
    setNotification({ show: true, type: 'confirmation', title: `¿${isActivating?'Reactivar':'Desactivar'} este usuario?`, message: isActivating?'El usuario podrá iniciar sesión.':'El usuario no podrá iniciar sesión.',
      onConfirm: async () => { hideNotification(); try { await updateUserStatus(user.id!, isActivating); showSuccess(`Usuario ${isActivating?'reactivado':'desactivado'} correctamente.`); fetchUsers(); } catch { showError(`No se pudo ${isActivating?'reactivar':'desactivar'} el usuario.`); } },
      onCancel: hideNotification });
  };

  const openCreateModal = () => { setEditing(null); setModalOpen(true); };
  const openEditModal = (u: User) => { setEditing(u); setModalOpen(true); };
  const openUploadModal = (u: User) => setUploadingUser(u);
  const closeUploadModal = () => setUploadingUser(null);
  const handleUploadSuccess = () => { closeUploadModal(); fetchUsers(); };

  const safeUsers = Array.isArray(users) ? users : [];
  const filteredUsers = useMemo(() => safeUsers.filter(u => (u.username || '').toLowerCase().includes(filterUsername.toLowerCase()) && (u.email || '').toLowerCase().includes(filterEmail.toLowerCase()) && (filterRole ? u.role === filterRole : true)), [safeUsers, filterUsername, filterEmail, filterRole]);
  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const paginatedUsers = useMemo(() => filteredUsers.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE), [filteredUsers, currentPage]);

  const handleClearFilters = () => { setFilterUsername(''); setFilterEmail(''); setFilterRole(''); };
  const roleOptions = useMemo(() => [{ value: '', label: 'Todos los Roles' },{ value: 'admin', label: 'Admin' },{ value: 'executive', label: 'Executive' }], []);

  return {
    isAdmin, users, editing, uploadingUser, modalOpen, setModalOpen, loading, showFilters, setShowFilters,
    filterUsername, setFilterUsername, filterEmail, setFilterEmail, filterRole, setFilterRole,
    currentPage, setCurrentPage, notification, searchDropdownRef,
    filteredUsers, paginatedUsers, totalPages, roleOptions,
    handleCreate, handleUpdate, handleUpdateStatus,
    openCreateModal, openEditModal, openUploadModal, closeUploadModal, handleUploadSuccess, handleClearFilters,
  };
}
