import React, { useEffect, useState } from 'react';
import { getClients, createClient, updateClient, deleteClient } from '../services/clientsService';
import type { Client } from '../core/models/Client';
import ClientForm from '../components/Client/ClientForm';
import Modal from '../components/Modal/Modal';
import ConfirmModal from '../components/Modal/ConfirmModal';
import Loader from '../components/Loader/Loader';
import Swal from 'sweetalert2';
import { Edit, Trash2, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const PAGE_SIZE = 6;

const ClientsPage: React.FC = () => {
    const { isAdmin } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [editing, setEditing] = useState<Client | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

    // Filtros
    const [filterNombre, setFilterNombre] = useState('');
    const [filterEmpresa, setFilterEmpresa] = useState('');
    const [filterCorreo, setFilterCorreo] = useState('');

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);

    // Loader
    const [loading, setLoading] = useState(false);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const data = await getClients();
            setClients(data);
        } catch (error) {
            Swal.fire('Error', 'No se pudieron cargar los clientes', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleCreate = async (client: Client) => {
        setLoading(true);
        try {
            await createClient(client);
            setModalOpen(false);
            Swal.fire('¡Éxito!', 'Cliente creado correctamente', 'success');
            fetchClients();
        } catch (error) {
            Swal.fire('Error', 'No se pudo crear el cliente', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (client: Client) => {
        if (client.id) {
            setLoading(true);
            try {
                const { id, ...updateData } = client;
                await updateClient(client.id, updateData);
                setEditing(null);
                setModalOpen(false);
                Swal.fire('¡Éxito!', 'Cliente actualizado correctamente', 'success');
                fetchClients();
            } catch (error) {
                Swal.fire('Error', 'No se pudo actualizar el cliente', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleDelete = async (id: string) => {
        setLoading(true);
        try {
            await deleteClient(id);
            Swal.fire('¡Eliminado!', 'Cliente eliminado correctamente', 'success');
            fetchClients();
        } catch (error) {
            Swal.fire('Error', 'No se pudo eliminar el cliente', 'error');
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditing(null);
        setModalOpen(true);
    };

    const openEditModal = (client: Client) => {
        setEditing(client);
        setModalOpen(true);
    };

    const openDeleteConfirm = (client: Client) => {
        setClientToDelete(client);
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (clientToDelete) {
            await handleDelete(clientToDelete.id!);
            setConfirmOpen(false);
            setClientToDelete(null);
        }
    };

    // Filtrado
    const filteredClients = clients.filter(client =>
        client.nombre.toLowerCase().includes(filterNombre.toLowerCase()) &&
        client.empresa.toLowerCase().includes(filterEmpresa.toLowerCase()) &&
        client.correo.toLowerCase().includes(filterCorreo.toLowerCase())
    );

    // Paginación
    const totalPages = Math.ceil(filteredClients.length / PAGE_SIZE);
    const paginatedClients = filteredClients.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filterNombre, filterEmpresa, filterCorreo]);

    return (
            <>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Clientes</h1>
                    <button
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
                        onClick={openCreateModal}
                    >
                        <User size={18} /> Nuevo Cliente
                    </button>
                </div>
                {/* Filtros */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="Filtrar por nombre"
                        value={filterNombre}
                        onChange={e => setFilterNombre(e.target.value)}
                        className="border rounded px-3 py-2"
                    />
                    <input
                        type="text"
                        placeholder="Filtrar por empresa"
                        value={filterEmpresa}
                        onChange={e => setFilterEmpresa(e.target.value)}
                        className="border rounded px-3 py-2"
                    />
                    <input
                        type="text"
                        placeholder="Filtrar por correo"
                        value={filterCorreo}
                        onChange={e => setFilterCorreo(e.target.value)}
                        className="border rounded px-3 py-2"
                    />
                </div>
                {/* Loader */}
                {loading ? (
                    <Loader />
                ) : (
                    <>
                        {/* Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {paginatedClients.map(client => (
                                <div key={client.id} className="bg-white shadow-lg rounded-lg p-6 flex flex-col justify-between transition-transform hover:scale-105 hover:shadow-xl border border-gray-100">
                                    <div>
                                        <div className="flex items-center mb-2">
                                            <div className="bg-blue-100 text-blue-700 rounded-full w-10 h-10 flex items-center justify-center font-bold mr-3">
                                                {client.nombre.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-lg">{client.nombre} {client.apellido}</div>
                                                <div className="text-gray-500 text-sm">{client.empresa}</div>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-600 mb-1">
                                            <span className="font-semibold">Puesto:</span> {client.puesto}
                                        </div>
                                        <div className="text-sm text-gray-600 mb-1">
                                            <span className="font-semibold">Correo:</span> {client.correo}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            <span className="font-semibold">Teléfono:</span> {client.telefono}
                                        </div>
                                    </div>
                                    <div className="mt-4 flex space-x-2 justify-end">
                                        <button
                                            className="flex items-center bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                                            onClick={() => openEditModal(client)}
                                            title="Editar"
                                        >
                                            <Edit size={16} className="mr-1" /> Editar
                                        </button>
                                        {isAdmin && (
                                            <button
                                                className="flex items-center bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                                                onClick={() => openDeleteConfirm(client)}
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} className="mr-1" /> Eliminar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Paginación */}
                        <div className="flex justify-center items-center mt-8 space-x-2">
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i + 1}
                                    className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                    onClick={() => handlePageChange(i + 1)}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </>
                )}
                <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
                    <ClientForm
                        initialData={editing || undefined}
                        onSubmit={editing ? handleUpdate : handleCreate}
                    />
                </Modal>
                <ConfirmModal
                    open={confirmOpen}
                    onClose={() => setConfirmOpen(false)}
                    onConfirm={confirmDelete}
                    message={`¿Seguro que deseas eliminar a ${clientToDelete?.nombre} ${clientToDelete?.apellido}?`}
                />
            </>
    );
};

export default ClientsPage;