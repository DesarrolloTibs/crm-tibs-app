import React, { useEffect, useState } from 'react';
import { getCompanies, createCompany, updateCompany, updateCompanyStatus } from '../services/companiesService';
import { getActiveUsers } from '../services/usersService';
import type { Company } from '../core/models/Company';
import CompanyForm from '../components/Company/CompanyForm';
import Modal from '../components/Modal/Modal';
import Loader from '../components/Loader/Loader';
import CompaniesTable from '../components/Company/CompaniesTable';
import { Filter, XCircle, Search, Mail, User as UserIcon, Building } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Notification from '../components/Modal/Notification';
import Select from 'react-select';

const PAGE_SIZE = 10;

const CompaniesPage: React.FC = () => {
    const { isAdmin } = useAuth();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [editing, setEditing] = useState<Company | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const [showFilters, setShowFilters] = useState(false);
    // Filtros
    const [filterNombre, setFilterNombre] = useState('');
    const [filterCorreo, setFilterCorreo] = useState('');
    const [filterEjecutivoId, setFilterEjecutivoId] = useState<string | null>(null);
    const [executives, setExecutives] = useState<{ value: string; label: string }[]>([]);

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

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const data = await getCompanies();
            setCompanies(data);
        } catch (error) {
            setNotification({
                show: true, type: 'error', title: 'Error', message: 'No se pudieron cargar las empresas', onConfirm: hideNotification, onCancel: hideNotification
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
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

    const handleCreate = async (company: Company) => {
        setLoading(true);
        try {
            const { ejecutivo, contacts, ...companyData } = company as any;
            await createCompany(companyData);
            setModalOpen(false);
            setNotification({
                show: true, type: 'success', title: '¡Éxito!', message: 'Empresa creada correctamente', onConfirm: hideNotification, onCancel: hideNotification
            });
            fetchCompanies();
        } catch (error) {
            setNotification({
                show: true, type: 'error', title: 'Error', message: 'No se pudo crear la empresa', onConfirm: hideNotification, onCancel: hideNotification
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (company: Company) => {
        if (company.id) {
            setLoading(true);
            try {
                const { id, ejecutivo, contacts, ...updateData } = company as any;
                await updateCompany(id, updateData);
                setEditing(null);
                setModalOpen(false);
                setNotification({
                    show: true, type: 'success', title: '¡Éxito!', message: 'Empresa actualizada correctamente', onConfirm: hideNotification, onCancel: hideNotification
                });
                fetchCompanies();
            } catch (error) {
                setNotification({
                    show: true, type: 'error', title: 'Error', message: 'No se pudo actualizar la empresa', onConfirm: hideNotification, onCancel: hideNotification
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleUpdateStatus = async (company: Company) => {
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
                    fetchCompanies();
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
        setEditing(null);
        setModalOpen(true);
    };

    const openEditModal = (company: Company) => {
        setEditing(company);
        setModalOpen(true);
    };

    // Filtrado
    const filteredCompanies = companies.filter(company =>
        company.nombre.toLowerCase().includes(filterNombre.toLowerCase()) &&
        (company.correo || '').toLowerCase().includes(filterCorreo.toLowerCase()) &&
        (!filterEjecutivoId || company.ejecutivo_id === filterEjecutivoId)
    );

    // Paginación
    const totalPages = Math.ceil(filteredCompanies.length / PAGE_SIZE);
    const paginatedCompanies = filteredCompanies.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filterNombre, filterCorreo, filterEjecutivoId]);

    const handleClearFilters = () => {
        setFilterNombre('');
        setFilterCorreo('');
        setFilterEjecutivoId(null);
    };

    return (
        <>
            <Notification {...notification} />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Empresas</h1>
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
                        <Building size={18} /> Nueva Empresa
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
                                value={executives.find(option => option.value === filterEjecutivoId)}
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
                    </div>
                </div>
            )}
            {loading ? (
                <Loader />
            ) : (
                <CompaniesTable
                    companies={paginatedCompanies}
                    onEdit={openEditModal}
                    onUpdateStatus={handleUpdateStatus}
                    isAdmin={isAdmin}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            )}
            <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
                <CompanyForm
                    initialData={editing || undefined}
                    onSubmit={editing ? handleUpdate : handleCreate}
                    onCancel={() => setModalOpen(false)}
                />
            </Modal>
        </>
    );
};

export default CompaniesPage;
