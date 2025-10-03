import React, { useEffect, useState } from 'react';
import { getClients, createClient, updateClient, deleteClient } from '../services/clientsService';
import type { Client } from '../core/models/Client';
import ClientForm from '../components/Client/ClientForm';
import Modal from '../components/Modal/Modal';
import ConfirmModal from '../components/Modal/ConfirmModal';
import Loader from '../components/Loader/Loader';
import ClientsTable from '../components/Client/ClientsTable';
import Swal from 'sweetalert2';
import { User, Filter, XCircle, Search, Building, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const PAGE_SIZE = 10;

const ClientsPage: React.FC = () => {
    const { isAdmin } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [editing, setEditing] = useState<Client | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

    const [showFilters, setShowFilters] = useState(false);
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

    const handleClearFilters = () => {
        setFilterNombre('');
        setFilterEmpresa('');
        setFilterCorreo('');
    };

    return (
            <>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Clientes</h1>
                    <div className="flex items-center space-x-4">
                        <button
                            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 flex items-center gap-2 transition-colors"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter size={16} />
                            <span>Filtros</span>
                        </button>
                        <button
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                            onClick={openCreateModal}
                        >
                            <User size={18} /> Nuevo Cliente
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
                                    placeholder="Filtrar por nombre"
                                    value={filterNombre}
                                    onChange={e => setFilterNombre(e.target.value)}
                                    className="w-full border rounded-lg pl-10 pr-4 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                                    <Building size={20} />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Filtrar por empresa"
                                    value={filterEmpresa}
                                    onChange={e => setFilterEmpresa(e.target.value)}
                                    className="w-full border rounded-lg pl-10 pr-4 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                                    <Mail size={20} />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Filtrar por correo"
                                    value={filterCorreo}
                                    onChange={e => setFilterCorreo(e.target.value)}
                                    className="w-full border rounded-lg pl-10 pr-4 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                    </div>
                )}
                {/* Loader */}
                {loading ? (
                    <Loader />
                ) : (
                    <>
                        <ClientsTable
                            clients={paginatedClients}
                            onEdit={openEditModal}
                            onDelete={openDeleteConfirm}
                            isAdmin={isAdmin}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </>
                )}
                <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
                    <ClientForm
                        initialData={editing || undefined}
                        onSubmit={editing ? handleUpdate : handleCreate}
                        onCancel={() => setModalOpen(false)}
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