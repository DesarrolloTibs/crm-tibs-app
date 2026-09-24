import { useState, useEffect, useMemo, useCallback } from 'react';
import { getUsers, createUser, updateUser, updateUserStatus } from '../services/usersService';
import type { User } from '../core/models/User';
import { useAuth } from './useAuth';
import { useConfigStore } from '../store/useConfigStore';
import useDebounce from './useDebounce';
import useNotification from './useNotification';
import type { UserFiltersState } from '../components/User/UserFiltersBar';

const INITIAL_FILTERS: UserFiltersState = {
  username: '',
  email: '',
  role: null,
};

export function useUsers() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const { selectedTenant } = useConfigStore();
  const schemaName = selectedTenant?.schema_name;

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [uploadingUser, setUploadingUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Grouped filters state
  const [filters, setFilters] = useState<UserFiltersState>(INITIAL_FILTERS);

  // Debounced text inputs for smooth typing
  const debouncedUsername = useDebounce(filters.username, 250);
  const debouncedEmail = useDebounce(filters.email, 250);

  // Standard notification & confirmation modal hook
  const { notification, showSuccess, showError, showConfirmation } = useNotification();

  const fetchUsers = useCallback(async (force = false) => {
    setLoading(true);
    try {
      const res = await getUsers(force);
      setUsers(Array.isArray(res) ? res : []);
    } catch {
      showError('No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, schemaName]);

  const handleCreate = async (user: User) => {
    setLoading(true);
    try {
      const userData = { ...user };
      delete userData.id;
      await createUser(userData);
      setModalOpen(false);
      showSuccess('Usuario creado correctamente');
      fetchUsers(true);
    } catch {
      showError('No se pudo crear el usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (user: User) => {
    if (!user.id) return;
    setLoading(true);
    try {
      const { id, ...userData } = user;
      await updateUser(id, userData);
      setEditing(null);
      setModalOpen(false);
      showSuccess('Usuario actualizado correctamente');
      fetchUsers(true);
    } catch {
      showError('No se pudo actualizar el usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = useCallback((user: User) => {
    if (!user.id) return;
    const isActivating = !user.isActive;
    showConfirmation({
      title: `¿${isActivating ? 'Reactivar' : 'Desactivar'} este usuario?`,
      message: isActivating
        ? 'El usuario podrá iniciar sesión.'
        : 'El usuario no podrá iniciar sesión.',
      onConfirm: async () => {
        try {
          await updateUserStatus(user.id!, isActivating);
          showSuccess(`Usuario ${isActivating ? 'reactivado' : 'desactivado'} correctamente.`);
          fetchUsers(true);
        } catch {
          showError(`No se pudo ${isActivating ? 'reactivar' : 'desactivar'} el usuario.`);
        }
      },
    });
  }, [showConfirmation, showSuccess, showError, fetchUsers]);

  const handleFilterChange = useCallback(
    <K extends keyof UserFiltersState>(key: K, value: UserFiltersState[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleClearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  const openCreateModal = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditing(u);
    setModalOpen(true);
  };

  const openUploadModal = (u: User) => setUploadingUser(u);
  const closeUploadModal = () => setUploadingUser(null);
  const handleUploadSuccess = () => {
    closeUploadModal();
    fetchUsers(true);
  };

  const roleOptions = useMemo(() => {
    if (isSuperAdmin && !selectedTenant) {
      return [
        { value: 'superadmin', label: 'SuperAdministrador' },
        { value: 'admin', label: 'Administrador' },
        { value: 'executive', label: 'Ejecutivo' },
      ];
    }
    return [
      { value: 'admin', label: 'Administrador' },
      { value: 'executive', label: 'Ejecutivo' },
    ];
  }, [isSuperAdmin, selectedTenant]);

  const filteredUsers = useMemo(() => {
    const uName = debouncedUsername.trim().toLowerCase();
    const uEmail = debouncedEmail.trim().toLowerCase();

    return users.filter((u) => {
      const matchesName = !uName || (u.username || '').toLowerCase().includes(uName);
      const matchesEmail = !uEmail || (u.email || '').toLowerCase().includes(uEmail);
      const matchesRole = !filters.role || u.role === filters.role;

      return matchesName && matchesEmail && matchesRole;
    });
  }, [users, debouncedUsername, debouncedEmail, filters.role]);

  return {
    isAdmin,
    users: filteredUsers,
    loading,
    editing,
    uploadingUser,
    modalOpen,
    setModalOpen,
    filters,
    roleOptions,
    notification,
    handleFilterChange,
    handleClearFilters,
    handleCreate,
    handleUpdate,
    handleUpdateStatus,
    openCreateModal,
    openEditModal,
    openUploadModal,
    closeUploadModal,
    handleUploadSuccess,
  };
}

export default useUsers;
