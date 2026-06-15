import React, { useEffect, useState, useMemo } from 'react';
import { getClients, createClient, updateClient, updateClientStatus } from '../services/clientsService';
import { getCompanies, createCompany, updateCompany, updateCompanyStatus } from '../services/companiesService';
import { getActiveUsers } from '../services/usersService';
import { ClientCategory, type Client } from '../core/models/Client';
import type { Company } from '../core/models/Company';
import ClientForm from '../components/Client/ClientForm';
import CompanyForm from '../components/Company/CompanyForm';
import Modal from '../components/Modal/Modal';
import Loader from '../components/Loader/Loader';
import ClientsTable from '../components/Client/ClientsTable';
import CompaniesTable from '../components/Company/CompaniesTable';
import { User, Filter, XCircle, Search, Building, Mail, User as UserIcon, LayoutGrid } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Notification from '../components/Modal/Notification';
import Select from 'react-select';

const PAGE_SIZE = 10;

type ViewSubModule = 'contacts' | 'companies';

const ClientsPage: React.FC = () => {
    const { isAdmin } = useAuth();
    const [viewSubModule, setViewSubModule] = useState<ViewSubModule>('contacts');
    
    // Estados Clientes (Contactos)
    const [clients, setClients] = useState<Client[]>([]);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [clientModalOpen, setClientModalOpen] = useState(false);

    // Estados Empresas
    const [companies, setCompanies] = useState<Company[]>([]);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [companyModalOpen, setCompanyModalOpen] = useState(false);

    // Filtros Comunes
    const [showFilters, setShowFilters] = useState(false);
    const [filterNombre, setFilterNombre] = useState('');
    const [filterEmpresa, setFilterEmpresa] = useState('');
    const [filterCorreo, setFilterCorreo] = useState('');
    const [filterEjecutivoId, setFilterEjecutivoId] = useState<string | null>(null);
    const [filterCategory, setFilterCategory] = useState<string | null>(null);
    const [executives, setExecutives] = useState<{ value: string; label: string }[]>([]);

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
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

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [clientsData, companiesData] = await Promise.all([
                getClients(),
                getCompanies()
            ]);
            setClients(clientsData);
            setCompanies(companiesData);
        } catch (error) {
            setNotification({
                show: true, type: 'error', title: 'Error', message: 'No se pudieron cargar los datos', onConfirm: hideNotification, onCancel: hideNotification
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllData();
        const fetchExecutives = async () => {
            try {
                const users = await getActiveUsers();
                const executiveOptions = users
                    .filter(user => user.id)
                    .map(user => ({ value: user.id!, label: user.username }));
                setExecutives(executiveOptions);
            } catch (error) {
                console.error("Error fetching executives:", error);
            }
        };
        fetchExecutives();
    }, []);

    // Handlers Clientes (Contactos)
    const handleCreateClient = async (client: Client) => {
        setLoading(true);
        try {
            const { ejecutivo, company, ...clientData } = client as any;
            await createClient(clientData);
            setClientModalOpen(false);
            setNotification({
                show: true, type: 'success', title: '¡Éxito!', message: 'Contacto creado correctamente', onConfirm: hideNotification, onCancel: hideNotification
            });
            loadAllData();
        } catch (error) {
            setNotification({
                show: true, type: 'error', title: 'Error', message: 'No se pudo crear el contacto', onConfirm: hideNotification, onCancel: hideNotification
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateClient = async (client: Client) => {
        if (client.id) {
            setLoading(true);
            try {
                const { id, ejecutivo, company, ...updateData } = client as any;
                await updateClient(id, updateData);
                setEditingClient(null);
                setClientModalOpen(false);
                setNotification({
                    show: true, type: 'success', title: '¡Éxito!', message: 'Contacto actualizado correctamente', onConfirm: hideNotification, onCancel: hideNotification
                });
                loadAllData();
            } catch (error) {
                setNotification({
                    show: true, type: 'error', title: 'Error', message: 'No se pudo actualizar el contacto', onConfirm: hideNotification, onCancel: hideNotification
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleUpdateClientStatus = async (client: Client) => {
        if (!client.id) return;
        const clientId = client.id;
        const isActivating = !client.estatus;
        setNotification({
            show: true,
            type: 'confirmation',
            title: `¿Seguro que deseas ${isActivating ? 'reactivar' : 'desactivar'} este contacto?`,
            message: isActivating ? 'El contacto volverá a estar activo.' : 'El contacto se marcará como inactivo.',
            onConfirm: async () => {
                hideNotification();
                try {
                    await updateClientStatus(clientId, isActivating);
                    setNotification({
                        show: true, type: 'success', title: '¡Éxito!', message: `Contacto ${isActivating ? 'reactivado' : 'desactivado'} correctamente.`, onConfirm: hideNotification, onCancel: hideNotification
                    });
                    loadAllData();
                } catch (error) {
                    setNotification({
                        show: true, type: 'error', title: 'Error', message: `No se pudo ${isActivating ? 'reactivar' : 'desactivar'} el contacto.`, onConfirm: hideNotification, onCancel: hideNotification
                    });
                }
            },
            onCancel: hideNotification,
        });
    };

    // Handlers Empresas
    const handleCreateCompany = async (company: Company) => {
        setLoading(true);
        try {
            const { ejecutivo, contacts, ...companyData } = company as any;
            await createCompany(companyData);
            setCompanyModalOpen(false);
            setNotification({
                show: true, type: 'success', title: '¡Éxito!', message: 'Empresa creada correctamente', onConfirm: hideNotification, onCancel: hideNotification
            });
            loadAllData();
        } catch (error) {
            setNotification({
                show: true, type: 'error', title: 'Error', message: 'No se pudo crear la empresa', onConfirm: hideNotification, onCancel: hideNotification
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateCompany = async (company: Company) => {
        if (company.id) {
            setLoading(true);
            try {
                const { id, ejecutivo, contacts, ...updateData } = company as any;
                await updateCompany(id, updateData);
                setEditingCompany(null);
                setCompanyModalOpen(false);
                setNotification({
                    show: true, type: 'success', title: '¡Éxito!', message: 'Empresa actualizada correctamente', onConfirm: hideNotification, onCancel: hideNotification
                });
                loadAllData();
            } catch (error) {
                setNotification({
                    show: true, type: 'error', title: 'Error', message: 'No se pudo actualizar la empresa', onConfirm: hideNotification, onCancel: hideNotification
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleUpdateCompanyStatus = async (company: Company) => {
        if (!company.id) return;
        const companyId = company.id;
        const isActivating = !company.estatus;
        setNotification({
            show: true,
            type: 'confirmation',
            title: `¿Seguro que deseas ${isActivating ? 'reactivar' : 'desactivar'} esta empresa?`,
            message: isActivating ? 'La empresa volverá a estar activa.' : 'La empresa se marcará como inactiva.',
            onConfirm: async () => {
                hideNotification();
                try {
                    await updateCompanyStatus(companyId, isActivating);
                    setNotification({
                        show: true, type: 'success', title: '¡Éxito!', message: `Empresa ${isActivating ? 'reactivada' : 'desactivada'} correctamente.`, onConfirm: hideNotification, onCancel: hideNotification
                    });
                    loadAllData();
                } catch (error) {
                    setNotification({
                        show: true, type: 'error', title: 'Error', message: `No se pudo ${isActivating ? 'reactivar' : 'desactivar'} la empresa.`, onConfirm: hideNotification, onCancel: hideNotification
                    });
                }
            },
            onCancel: hideNotification,
        });
    };

    const openCreateModal = () => {
        if (viewSubModule === 'contacts') {
            setEditingClient(null);
            setClientModalOpen(true);
        } else {
            setEditingCompany(null);
            setCompanyModalOpen(true);
        }
    };

    const openEditClientModal = (client: Client) => {
        setEditingClient(client);
        setClientModalOpen(true);
    };

    const openEditCompanyModal = (company: Company) => {
        setEditingCompany(company);
        setCompanyModalOpen(true);
    };

    // Filtrado
    const filteredClients = useMemo(() => 
        clients.filter(client =>
            (client.nombre + ' ' + client.apellido).toLowerCase().includes(filterNombre.toLowerCase()) &&
            (client.company?.nombre || client.empresa || '').toLowerCase().includes(filterEmpresa.toLowerCase()) &&
            client.correo.toLowerCase().includes(filterCorreo.toLowerCase()) &&
            (!filterEjecutivoId || client.ejecutivo_id === filterEjecutivoId) &&
            (!filterCategory || client.category === filterCategory)
        ),
    [clients, filterNombre, filterEmpresa, filterCorreo, filterEjecutivoId, filterCategory]);

    const filteredCompanies = useMemo(() =>
        companies.filter(company =>
            company.nombre.toLowerCase().includes(filterNombre.toLowerCase()) &&
            (company.correo || '').toLowerCase().includes(filterCorreo.toLowerCase()) &&
            (!filterEjecutivoId || company.ejecutivo_id === filterEjecutivoId)
        ),
    [companies, filterNombre, filterCorreo, filterEjecutivoId]);

    const activeListLength = viewSubModule === 'contacts' ? filteredClients.length : filteredCompanies.length;
    const totalPages = Math.ceil(activeListLength / PAGE_SIZE);

    const paginatedClients = useMemo(() =>
        filteredClients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredClients, currentPage]);

    const paginatedCompanies = useMemo(() =>
        filteredCompanies.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredCompanies, currentPage]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Reset page when filters or sub-module change
    useEffect(() => {
        setCurrentPage(1);
    }, [filterNombre, filterEmpresa, filterCorreo, filterEjecutivoId, filterCategory, viewSubModule]);

    const handleClearFilters = () => {
        setFilterNombre('');
        setFilterEmpresa('');
        setFilterCorreo('');
        setFilterEjecutivoId(null);
        setFilterCategory(null);
    };

    return (
        <>
            <Notification {...notification} />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
                    
                    {/* Selector de sub-vista */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
                        <button
                            onClick={() => setViewSubModule('contacts')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                                viewSubModule === 'contacts'
                                    ? 'bg-white text-indigo-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <UserIcon size={15} />
                            Contactos
                        </button>
                        <button
                            onClick={() => setViewSubModule('companies')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                                viewSubModule === 'companies'
                                    ? 'bg-white text-indigo-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Building size={15} />
                            Empresas (Cuentas)
                        </button>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                    <button
                        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 flex items-center justify-center gap-2 transition-colors w-full sm:w-auto shadow-sm whitespace-nowrap"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter size={16} />
                        <span>Filtros</span>
                    </button>
                    <button
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors w-full sm:w-auto shadow-sm whitespace-nowrap"
                        onClick={openCreateModal}
                    >
                        {viewSubModule === 'contacts' ? (
                            <>
                                <UserIcon size={18} /> Nuevo Contacto
                            </>
                        ) : (
                            <>
                                <Building size={18} /> Nueva Empresa
                            </>
                        )}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                        {viewSubModule === 'contacts' && (
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
                        )}
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
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                                <UserIcon size={20} />
                            </span>
                            <Select
                                inputId="ejecutivo-filter"
                                options={executives}
                                value={executives.find(option => option.value === filterEjecutivoId) || null}
                                onChange={option => setFilterEjecutivoId(option ? option.value : null)}
                                placeholder="Filtrar por ejecutivo"
                                isClearable
                                isSearchable
                                className="w-full"
                                styles={{
                                    input: (base) => ({ ...base, paddingLeft: '28px' }),
                                    placeholder: (base) => ({ ...base, paddingLeft: '28px' }),
                                    singleValue: (base) => ({...base, paddingLeft: '28px'})
                                }}
                            />
                        </div>
                        {viewSubModule === 'contacts' && (
                            <div>
                                <select
                                    value={filterCategory || ''}
                                    onChange={e => setFilterCategory(e.target.value || null)}
                                    className="w-full border rounded-lg px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">Todas las categorías</option>
                                    {Object.values(ClientCategory).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Loader y Tablas */}
            {loading ? (
                <Loader />
            ) : viewSubModule === 'contacts' ? (
                <ClientsTable
                    clients={paginatedClients}
                    onEdit={openEditClientModal}
                    onUpdateStatus={handleUpdateClientStatus}
                    isAdmin={isAdmin}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            ) : (
                <CompaniesTable
                    companies={paginatedCompanies}
                    onEdit={openEditCompanyModal}
                    onUpdateStatus={handleUpdateCompanyStatus}
                    isAdmin={isAdmin}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            )}

            {/* Modal para Contacto */}
            <Modal open={clientModalOpen} onClose={() => setClientModalOpen(false)}>
                <ClientForm
                    initialData={editingClient || undefined}
                    onSubmit={editingClient ? handleUpdateClient : handleCreateClient}
                    onCancel={() => setClientModalOpen(false)}
                />
            </Modal>

            {/* Modal para Empresa */}
            <Modal open={companyModalOpen} onClose={() => setCompanyModalOpen(false)}>
                <CompanyForm
                    initialData={editingCompany || undefined}
                    onSubmit={editingCompany ? handleUpdateCompany : handleCreateCompany}
                    onCancel={() => setCompanyModalOpen(false)}
                />
            </Modal>
        </>
    );
};

export default ClientsPage;ClientsPage;