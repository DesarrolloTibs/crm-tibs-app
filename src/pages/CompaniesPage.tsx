import React, { useEffect, useState, useMemo, useRef } from 'react';
import { getCompanies, createCompany, updateCompany, updateCompanyStatus } from '../services/companiesService';
import { getActiveUsers } from '../services/usersService';
import type { Company } from '../core/models/Company';
import CompanyForm from '../components/Company/CompanyForm';
import Modal from '../components/Modal/Modal';
import Loader from '../components/Loader/Loader';
import CompaniesTable from '../components/Company/CompaniesTable';
import { Filter, XCircle, Building } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Notification from '../components/Modal/Notification';
import Select from 'react-select';
import Input from '../components/shared/Input';
import Button from '../components/shared/Button';
import UnifiedSearchBar from '../components/shared/UnifiedSearchBar';
import type { SearchBadge } from '../components/shared/UnifiedSearchBar';

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

    const badges = useMemo(() => {
        const list: SearchBadge[] = [];
        if (filterCorreo) {
            list.push({
                id: 'correo',
                label: `Correo: ${filterCorreo}`,
                icon: <Filter size={10} />,
                onRemove: () => setFilterCorreo('')
            });
        }
        if (filterEjecutivoId) {
            list.push({
                id: 'ejecutivo',
                label: executives.find(e => e.value === filterEjecutivoId)?.label || 'Ejecutivo',
                icon: <Filter size={10} />,
                onRemove: () => setFilterEjecutivoId(null)
            });
        }
        return list;
    }, [filterCorreo, filterEjecutivoId, executives]);

    return (
        <>
            <Notification {...notification} />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Empresas</h1>
                <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 items-center">
                    <UnifiedSearchBar
                        ref={searchDropdownRef}
                        searchTerm={filterNombre}
                        onSearchChange={setFilterNombre}
                        placeholder={!filterCorreo && !filterEjecutivoId ? "Buscar por nombre..." : ""}
                        badges={badges}
                        showFilters={showFilters}
                        setShowFilters={setShowFilters}
                        dropdownWidthClass="w-[320px]"
                    >
                        <div className="w-full flex flex-col gap-3">
                            <div>
                                <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none">Correo</h4>
                                <Input
                                    type="text"
                                    placeholder="Filtrar por correo"
                                    value={filterCorreo}
                                    onChange={e => setFilterCorreo(e.target.value)}
                                />
                            </div>
                            <div>
                                <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none">Ejecutivo</h4>
                                <Select
                                    inputId="ejecutivo-filter"
                                    options={executives}
                                    value={executives.find(option => option.value === filterEjecutivoId) || null}
                                    onChange={option => setFilterEjecutivoId(option ? option.value : null)}
                                    placeholder="Filtrar por ejecutivo"
                                    isClearable
                                    isSearchable
                                    className="w-full"
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
                        variant="success"
                        className="w-full sm:w-auto h-[38px] py-0 px-4 whitespace-nowrap flex items-center justify-center"
                        onClick={openCreateModal}
                    >
                        <Building size={18} className="mr-2" /> Nueva Empresa
                    </Button>
                </div>
            </div>
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
