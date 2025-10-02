import React, { useEffect, useState } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../services/usersService';
import type { User } from '../core/models/User';
import UserForm from '../components/User/UserForm';
import Modal from '../components/Modal/Modal';
import ConfirmModal from '../components/Modal/ConfirmModal';
import Loader from '../components/Loader/Loader';
import Swal from 'sweetalert2';
import { Edit, Trash2, UserPlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const UsersPage: React.FC = () => {
    const { isAdmin } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [editing, setEditing] = useState<User | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);

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

    const handleDelete = async (id: string) => {
        setLoading(true);
        try {
            await deleteUser(id);
            Swal.fire('¡Eliminado!', 'Usuario eliminado correctamente', 'success');
            fetchUsers();
        } catch (error) {
            Swal.fire('Error', 'No se pudo eliminar el usuario', 'error');
        } finally {
            setLoading(false);
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

    const openDeleteConfirm = (user: User) => {
        setUserToDelete(user);
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (userToDelete && userToDelete.id) {
            await handleDelete(userToDelete.id);
            setConfirmOpen(false);
            setUserToDelete(null);
        }
    };

    return (
        <>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Usuarios</h1>
                    {isAdmin && (
                        <button
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
                            onClick={openCreateModal}
                        >
                            <UserPlus size={18} /> Nuevo Usuario
                        </button>
                    )}
                </div>
                {loading ? (
                    <Loader />
                ) : (
                    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                        <table className="min-w-full leading-normal">
                            <thead>
                                <tr>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Usuario</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rol</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <p className="text-gray-900 whitespace-no-wrap">{user.username}</p>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <p className="text-gray-900 whitespace-no-wrap">{user.email}</p>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <p className="text-gray-900 whitespace-no-wrap capitalize">{user.role}</p>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <span className={`relative inline-block px-3 py-1 font-semibold leading-tight ${user.isActive ? 'text-green-900' : 'text-red-900'}`}>
                                                <span aria-hidden className={`absolute inset-0 ${user.isActive ? 'bg-green-200' : 'bg-red-200'} opacity-50 rounded-full`}></span>
                                                <span className="relative">{user.isActive ? 'Activo' : 'Inactivo'}</span>
                                            </span>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                                            {isAdmin && (
                                                <div className="flex space-x-2 justify-end">
                                                    <button
                                                        className="flex items-center bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                                                        onClick={() => openEditModal(user)}
                                                        title="Editar"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        className="flex items-center bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                                                        onClick={() => openDeleteConfirm(user)}
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
                    <UserForm
                        initialData={editing || undefined}
                        onSubmit={editing ? handleUpdate : handleCreate}
                    />
                </Modal>
                <ConfirmModal
                    open={confirmOpen}
                    onClose={() => setConfirmOpen(false)}
                    onConfirm={confirmDelete}
                    message={`¿Seguro que deseas eliminar a ${userToDelete?.username}?`}
                />
        </>
    );
};

export default UsersPage;
