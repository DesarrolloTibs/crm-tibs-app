import React, { useEffect, useState } from 'react';
import { getClients, createClient, updateClient, updateClientStatus } from '../services/clientsService';
import type { Client } from '../core/models/Client';
import ClientForm from '../components/Client/ClientForm';
import Modal from '../components/Modal/Modal';
import Loader from '../components/Loader/Loader';
import ClientsTable from '../components/Client/ClientsTable';
import { User, Filter, XCircle, Search, Building, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Notification from '../components/Modal/Notification';

const PAGE_SIZE = 10;

const ClientsPage: React.FC = () => {
    const { isAdmin } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [editing, setEditing] = useState<Client | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const [showFilters, setShowFilters] = useState(false);
    // Filtros
    const [filterNombre, setFilterNombre] = useState('');
    const [filterEmpresa, setFilterEmpresa] = useState('');
    const [filterCorreo, setFilterCorreo] = useState('');

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);

    // Loader
    const [loading, setLoading] = useState(false);

    const [notification, setNotification] = useState({
        show: false,
        type: 'success' as 'success' | 'error' | 'warning' | 'confirmation',
        title: '',
        message: '',
        onConfirm: () => {},
        onCancel: () => {},
    });

    const hideNotification = () => setNotification({ ...notification, show: false });

    const fetchClients = async () => {
        setLoading(true);
        try {
            const data = await getClients();
            setClients(data);
        } catch (error) {
            setNotification({
                show: true, type: 'error', title: 'Error', message: 'No se pudieron cargar los clientes', onConfirm: hideNotification, onCancel: hideNotification
            });
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
            setNotification({
                show: true, type: 'success', title: '¡Éxito!', message: 'Cliente creado correctamente', onConfirm: hideNotification, onCancel: hideNotification
            });
            fetchClients();
        } catch (error) {
            setNotification({
                show: true, type: 'error', title: 'Error', message: 'No se pudo crear el cliente', onConfirm: hideNotification, onCancel: hideNotification
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (client: Client) => {
        if (client.id) {
            setLoading(true);
            try {
                const { id, ...updateData } = client;
                await updateClient(id, updateData);
                setEditing(null);
                setModalOpen(false);
                setNotification({
                    show: true, type: 'success', title: '¡Éxito!', message: 'Cliente actualizado correctamente', onConfirm: hideNotification, onCancel: hideNotification
                });
                fetchClients();
            } catch (error) {
                setNotification({
                    show: true, type: 'error', title: 'Error', message: 'No se pudo actualizar el cliente', onConfirm: hideNotification, onCancel: hideNotification
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleUpdateStatus = async (client: Client) => {
        if (!client.id) return; // Asegurarse de que el ID existe
        const clientId = client.id;
        const isActivating = !client.estatus;
        setNotification({
            show: true,
            type: 'confirmation',
            title: `¿Seguro que deseas ${isActivating ? 'reactivar' : 'desactivar'} este cliente?`,
            message: isActivating ? 'El cliente volverá a estar activo.' : 'El cliente se marcará como inactivo.',
            onConfirm: async () => {
                hideNotification();
                try {
                    await updateClientStatus(clientId, isActivating);
                    setNotification({
                        show: true, type: 'success', title: '¡Éxito!', message: `Cliente ${isActivating ? 'reactivado' : 'desactivado'} correctamente.`, onConfirm: hideNotification, onCancel: hideNotification
                    });
                    fetchClients(); // Vuelve a cargar los clientes para reflejar el cambio
                } catch (error) {
                    setNotification({
                        show: true, type: 'error', title: 'Error', message: `No se pudo ${isActivating ? 'reactivar' : 'desactivar'} el cliente.`, onConfirm: hideNotification, onCancel: hideNotification
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

    const openEditModal = (client: Client) => {
        setEditing(client);
        setModalOpen(true);
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
                <Notification {...notification} />
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
                            onUpdateStatus={handleUpdateStatus}
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
            </>
    );
};

export default ClientsPage;