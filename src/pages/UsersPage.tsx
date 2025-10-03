import React, { useEffect, useState } from 'react';
import { getUsers, createUser, updateUser, updateUserStatus } from '../services/usersService'; // Asumiendo que updateUserStatus existe
import type { User } from '../core/models/User';
import UserForm from '../components/User/UserForm';
import UsersTable from '../components/User/UsersTable';
import Modal from '../components/Modal/Modal';
import Loader from '../components/Loader/Loader';
import Swal from 'sweetalert2';
import { UserPlus, Filter, XCircle, Search, Mail, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const PAGE_SIZE = 10;

const UsersPage: React.FC = () => {
    const { isAdmin } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [editing, setEditing] = useState<User | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filterUsername, setFilterUsername] = useState('');
    const [filterEmail, setFilterEmail] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error');
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
            Swal.fire('¡Éxito!', 'Usuario creado correctamente', 'success');
            fetchUsers();
        } catch (error) {
            Swal.fire('Error', 'No se pudo crear el usuario', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (user: User) => {
        if (user.id) {
            setLoading(true);
            try {
                const { id, ...updateData } = user;
                await updateUser(user.id, updateData);
                setEditing(null);
                setModalOpen(false);
                Swal.fire('¡Éxito!', 'Usuario actualizado correctamente', 'success');
                fetchUsers();
            } catch (error) {
                Swal.fire('Error', 'No se pudo actualizar el usuario', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleUpdateStatus = async (user: User) => {
        if (!user.id) return;
        const isActivating = !user.isActive;
        const result = await Swal.fire({
            title: `¿Seguro que deseas ${isActivating ? 'reactivar' : 'desactivar'} este usuario?`,
            text: isActivating ? 'El usuario podrá iniciar sesión.' : 'El usuario no podrá iniciar sesión.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: `Sí, ${isActivating ? 'reactivar' : 'desactivar'}`,
            cancelButtonText: 'Cancelar',
        });

        if (result.isConfirmed) {
            try {
                await updateUserStatus(user.id, isActivating);
                Swal.fire('¡Éxito!', `Usuario ${isActivating ? 'reactivado' : 'desactivado'} correctamente.`, 'success');
                fetchUsers();
            } catch (error) {
                Swal.fire('Error', `No se pudo ${isActivating ? 'reactivar' : 'desactivar'} el usuario.`, 'error');
            }
        }
    };

    const openCreateModal = () => {
        setEditing(null);
        setModalOpen(true);
    };

    const openEditModal = (user: User) => {
        setEditing(user);
        setModalOpen(true);
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

    return (
        <>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Usuarios</h1>
                    <div className="flex items-center space-x-4">
                        <button
                            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 flex items-center gap-2 transition-colors"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter size={16} />
                            <span>Filtros</span>
                        </button>
                        <button
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
                            onClick={openCreateModal}
                        >
                            <UserPlus size={18} /> Nuevo Usuario
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
                                    placeholder="Filtrar por usuario"
                                    value={filterUsername}
                                    onChange={e => setFilterUsername(e.target.value)}
                                    className="w-full border rounded-lg pl-10 pr-4 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                                    <Mail size={20} />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Filtrar por email"
                                    value={filterEmail}
                                    onChange={e => setFilterEmail(e.target.value)}
                                    className="w-full border rounded-lg pl-10 pr-4 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                                    <Shield size={20} />
                                </span>
                                <select
                                    value={filterRole}
                                    onChange={e => setFilterRole(e.target.value)}
                                    className="w-full border rounded-lg pl-10 pr-4 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                                >
                                    <option value="">Todos los Roles</option>
                                    <option value="admin">Admin</option>
                                    <option value="executive">Executive</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
                {loading ? (
                    <Loader />
                ) : (
                    <UsersTable
                        users={paginatedUsers}
                        onEdit={openEditModal}
                        onUpdateStatus={handleUpdateStatus}
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
        </>
    );
};

export default UsersPage;
