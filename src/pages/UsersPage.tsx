import React, { useEffect, useState, useMemo, useRef } from 'react';
import { getUsers, createUser, updateUser, updateUserStatus } from '../services/usersService'; // Asumiendo que updateUserStatus existe
import type { User } from '../core/models/User';
import UserForm from '../components/User/UserForm';
import UsersTable from '../components/User/UsersTable';
import Modal from '../components/Modal/Modal';
import Loader from '../components/Loader/Loader';
import { UserPlus, Filter, XCircle, Mail } from 'lucide-react';
import ProfileImageUploadModal from '../components/User/ProfileImageUploadModal';
import { useAuth } from '../hooks/useAuth';
import Notification from '../components/Modal/Notification';
import Select from '../components/shared/Select';
import Input from '../components/shared/Input';
import Button from '../components/shared/Button';
import UnifiedSearchBar from '../components/shared/UnifiedSearchBar';
import type { SearchBadge } from '../components/shared/UnifiedSearchBar';

const PAGE_SIZE = 10;

const UsersPage: React.FC = () => {
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

    const hideNotification = () => setNotification({ ...notification, show: false });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            setNotification({
                show: true,
                type: 'error',
                title: 'Error',
                message: 'No se pudieron cargar los usuarios',
                onConfirm: hideNotification,
                onCancel: hideNotification,            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreate = async (user: User) => {
        setLoading(true);
        try {
            await createUser(user);
            setModalOpen(false);
            setNotification({
                show: true,
                type: 'success',
                title: '¡Éxito!',
                message: 'Usuario creado correctamente',
                onConfirm: hideNotification,
                onCancel: hideNotification,            });
            fetchUsers();
        } catch (error) {
            setNotification({
                show: true,
                type: 'error',
                title: 'Error',
                message: 'No se pudo crear el usuario',
                onConfirm: hideNotification,
                onCancel: hideNotification,            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (user: User) => {
        if (user.id) {
            setLoading(true);
            try {
                const { id, ...updateData } = user;
                await updateUser(id, updateData);
                setEditing(null);
                setModalOpen(false);
                setNotification({
                    show: true,
                    type: 'success',
                    title: '¡Éxito!',
                    message: 'Usuario actualizado correctamente',
                    onConfirm: hideNotification,
                    onCancel: hideNotification,                });
                fetchUsers();
            } catch (error) {
                setNotification({
                    show: true,
                    type: 'error',
                    title: 'Error',
                    message: 'No se pudo actualizar el usuario',
                    onConfirm: hideNotification,
                    onCancel: hideNotification,                });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleUpdateStatus = async (user: User) => {
        if (!user.id) return;
        const userId = user.id; // Guardamos el id en una constante segura
        const isActivating = !user.isActive;
        setNotification({
            show: true,
            type: 'confirmation',
            title: `¿Seguro que deseas ${isActivating ? 'reactivar' : 'desactivar'} este usuario?`,
            message: isActivating ? 'El usuario podrá iniciar sesión.' : 'El usuario no podrá iniciar sesión.',
            onConfirm: async () => {
                hideNotification();
                try {
                    await updateUserStatus(userId, isActivating);
                    setNotification({
                        show: true, type: 'success', title: '¡Éxito!', message: `Usuario ${isActivating ? 'reactivado' : 'desactivado'} correctamente.`, onConfirm: hideNotification, onCancel: hideNotification
                    });
                    fetchUsers();
                } catch (error) {
                    setNotification({
                        show: true, type: 'error', title: 'Error', message: `No se pudo ${isActivating ? 'reactivar' : 'desactivar'} el usuario.`, onConfirm: hideNotification, onCancel: hideNotification
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

    const openEditModal = (user: User) => {
        setEditing(user);
        setModalOpen(true);
    };

    const openUploadModal = (user: User) => {
        setUploadingUser(user);
    };

    const closeUploadModal = () => {
        setUploadingUser(null);
    };

    const handleUploadSuccess = () => {
        closeUploadModal();
        fetchUsers(); // Recargar usuarios para mostrar la nueva imagen
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(filterUsername.toLowerCase()) &&
        user.email.toLowerCase().includes(filterEmail.toLowerCase()) &&
        (filterRole ? user.role === filterRole : true)
    );

    const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [filterUsername, filterEmail, filterRole]);

    const handleClearFilters = () => {
        setFilterUsername('');
        setFilterEmail('');
        setFilterRole('');
    };

    const roleOptions = useMemo(() => [
        { value: '', label: 'Todos los Roles' },
        { value: 'admin', label: 'Admin' },
        { value: 'executive', label: 'Executive' },
    ], []);

    const badges = useMemo(() => {
        const list: SearchBadge[] = [];
        if (filterEmail) {
            list.push({
                id: 'email',
                label: `Email: ${filterEmail}`,
                icon: <Filter size={10} />,
                onRemove: () => setFilterEmail('')
            });
        }
        if (filterRole) {
            const roleLabel = roleOptions.find(opt => opt.value === filterRole)?.label || 'Rol';
            list.push({
                id: 'role',
                label: `Rol: ${roleLabel}`,
                icon: <Filter size={10} />,
                onRemove: () => setFilterRole('')
            });
        }
        return list;
    }, [filterEmail, filterRole, roleOptions]);

    return (
        <>
                <Notification {...notification} />
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
                    <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 items-center">
                        <UnifiedSearchBar
                            ref={searchDropdownRef}
                            searchTerm={filterUsername}
                            onSearchChange={setFilterUsername}
                            placeholder={!filterEmail && !filterRole ? "Buscar por usuario..." : ""}
                            badges={badges}
                            showFilters={showFilters}
                            setShowFilters={setShowFilters}
                            dropdownWidthClass="w-[300px]"
                        >
                            <div className="w-full flex flex-col gap-3">
                                <div>
                                    <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none">Email</h4>
                                    <Input
                                        type="text"
                                        placeholder="Filtrar por email"
                                        value={filterEmail}
                                        onChange={e => setFilterEmail(e.target.value)}
                                        inputPrefix={<Mail size={18} />}
                                    />
                                </div>
                                <div>
                                    <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none">Rol</h4>
                                    <Select
                                        options={roleOptions}
                                        value={roleOptions.find(opt => opt.value === filterRole)}
                                        onChange={(selected) => setFilterRole(selected ? selected.value : '')}
                                        placeholder="Todos los Roles"
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
                            variant="primary"
                            onClick={openCreateModal}
                            className="w-full sm:w-auto h-[38px] py-0 px-4 flex items-center justify-center whitespace-nowrap"
                        >
                            <UserPlus size={18} className="mr-2" /> Nuevo Usuario
                        </Button>
                    </div>
                </div>
                {loading ? (
                    <Loader />
                ) : (
                    <UsersTable
                        users={paginatedUsers}
                        onEdit={openEditModal}
                        onUpdateStatus={handleUpdateStatus}
                        onUploadImage={openUploadModal}
                        isAdmin={isAdmin}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                )}
                <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
                    <UserForm
                        initialData={editing || undefined}
                        onSubmit={editing ? handleUpdate : handleCreate}
                        onCancel={() => setModalOpen(false)}
                    />
                </Modal>
                {/* Nuevo Modal para subir imagen */}
                <Modal open={!!uploadingUser} onClose={closeUploadModal}>
                    {uploadingUser && (
                        <ProfileImageUploadModal
                            user={uploadingUser}
                            onClose={closeUploadModal}
                            onUploadSuccess={handleUploadSuccess}
                        />
                    )}
                </Modal>
        </>
    );
};

export default UsersPage;
