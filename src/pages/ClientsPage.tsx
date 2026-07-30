import React, { useMemo } from 'react';
import { Building, User as UserIcon, Filter, XCircle } from 'lucide-react';
import { ClientCategory } from '../core/models/Client';
import type { Company } from '../core/models/Company';
import ClientForm from '../components/Client/ClientForm';
import CompanyForm from '../components/Company/CompanyForm';
import Modal from '../components/Modal/Modal';
import Loader from '../components/Loader/Loader';
import ClientsTable from '../components/Client/ClientsTable';
import CompaniesTable from '../components/Company/CompaniesTable';
import Notification from '../components/Modal/Notification';
import Select from 'react-select';
import Input from '../components/shared/Input';
import Button from '../components/shared/Button';
import UnifiedSearchBar from '../components/shared/UnifiedSearchBar';
import type { SearchBadge } from '../components/shared/UnifiedSearchBar';
import { useClients } from '../hooks/useClients';
import { useAuth } from '../hooks/useAuth';

const ClientsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const {
    viewSubModule, setViewSubModule,
    editingClient, editingCompany,
    clientModalOpen, setClientModalOpen,
    companyModalOpen, setCompanyModalOpen,
    showFilters, setShowFilters,
    filterNombre, setFilterNombre,
    filterEmpresa, setFilterEmpresa,
    filterCorreo, setFilterCorreo,
    filterEjecutivoId, setFilterEjecutivoId,
    filterCategory, setFilterCategory,
    executives, currentPage, setCurrentPage,
    loading, notification, searchDropdownRef,
    paginatedClients, paginatedCompanies, totalPages,
    handleCreateClient, handleUpdateClient, handleUpdateClientStatus,
    handleCreateCompany, handleUpdateCompany, handleUpdateCompanyStatus,
    openCreateModal, openEditClientModal, openEditCompanyModal, handleClearFilters,
  } = useClients();

  const badges = useMemo(() => {
    const list: SearchBadge[] = [];
    if (viewSubModule === 'contacts' && filterEmpresa) list.push({ id: 'empresa', label: `Empresa: ${filterEmpresa}`, icon: <Filter size={10} />, onRemove: () => setFilterEmpresa('') });
    if (filterCorreo) list.push({ id: 'correo', label: `Correo: ${filterCorreo}`, icon: <Filter size={10} />, onRemove: () => setFilterCorreo('') });
    if (filterEjecutivoId) list.push({ id: 'ejecutivo', label: executives.find(e => e.value === filterEjecutivoId)?.label || 'Ejecutivo', icon: <Filter size={10} />, onRemove: () => setFilterEjecutivoId(null) });
    if (viewSubModule === 'contacts' && filterCategory) list.push({ id: 'categoria', label: `Cat: ${filterCategory}`, icon: <Filter size={10} />, onRemove: () => setFilterCategory(null) });
    return list;
  }, [viewSubModule, filterEmpresa, filterCorreo, filterEjecutivoId, filterCategory, executives, setFilterEmpresa, setFilterCorreo, setFilterEjecutivoId, setFilterCategory]);

  return (
    <>
      <Notification {...notification} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
          <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
            <button onClick={() => setViewSubModule('contacts')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewSubModule === 'contacts' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <UserIcon size={15} /> Contactos
            </button>
            <button onClick={() => setViewSubModule('companies')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewSubModule === 'companies' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Building size={15} /> Empresas (Cuentas)
            </button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 items-center">
          <UnifiedSearchBar ref={searchDropdownRef} searchTerm={filterNombre} onSearchChange={setFilterNombre} placeholder={!filterEmpresa && !filterCorreo && !filterEjecutivoId && !filterCategory ? 'Buscar por nombre...' : ''} badges={badges} showFilters={showFilters} setShowFilters={setShowFilters} dropdownWidthClass="w-[320px]">
            <div className="w-full flex flex-col gap-3">
              {viewSubModule === 'contacts' && (
                <div>
                  <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none">Empresa</h4>
                  <Input type="text" placeholder="Filtrar por empresa" value={filterEmpresa} onChange={e => setFilterEmpresa(e.target.value)} />
                </div>
              )}
              <div>
                <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none">Correo</h4>
                <Input type="text" placeholder="Filtrar por correo" value={filterCorreo} onChange={e => setFilterCorreo(e.target.value)} />
              </div>
              <div>
                <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none">Ejecutivo</h4>
                <Select inputId="ejecutivo-filter" options={executives} value={executives.find(o => o.value === filterEjecutivoId) || null} onChange={(o: any) => setFilterEjecutivoId(o ? o.value : null)} placeholder="Filtrar por ejecutivo" isClearable isSearchable className="w-full" />
              </div>
              {viewSubModule === 'contacts' && (
                <div>
                  <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none">Categoría</h4>
                  <Select options={[{ value: '', label: 'Todas las categorías' }, ...Object.values(ClientCategory).map(c => ({ value: c, label: c }))]} value={filterCategory ? { value: filterCategory, label: filterCategory } : { value: '', label: 'Todas las categorías' }} onChange={(o: any) => setFilterCategory(o?.value || null)} placeholder="Todas las categorías" />
                </div>
              )}
              <div className="border-t border-gray-100 my-1 pt-2 w-full" />
              <button type="button" onClick={handleClearFilters} className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 px-2 py-1.5 rounded w-full text-left hover:bg-red-50 transition-colors cursor-pointer shrink-0">
                <XCircle size={12} /> Limpiar Filtros
              </button>
            </div>
          </UnifiedSearchBar>
          <Button variant="success" className="w-full sm:w-auto h-[38px] py-0 px-4 whitespace-nowrap flex items-center justify-center" onClick={openCreateModal}>
            {viewSubModule === 'contacts' ? <><UserIcon size={18} className="mr-2" /> Nuevo Contacto</> : <><Building size={18} className="mr-2" /> Nueva Empresa</>}
          </Button>
        </div>
      </div>

      {loading ? <Loader /> : viewSubModule === 'contacts' ? (
        <ClientsTable clients={paginatedClients} onEdit={openEditClientModal} onUpdateStatus={handleUpdateClientStatus} isAdmin={isAdmin} currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      ) : (
        <CompaniesTable companies={paginatedCompanies} onEdit={openEditCompanyModal} onUpdateStatus={handleUpdateCompanyStatus} isAdmin={isAdmin} currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}

      <Modal open={clientModalOpen} onClose={() => setClientModalOpen(false)}>
        <ClientForm initialData={editingClient || undefined} onSubmit={editingClient ? handleUpdateClient : handleCreateClient} onCancel={() => setClientModalOpen(false)} />
      </Modal>
      <Modal open={companyModalOpen} onClose={() => setCompanyModalOpen(false)}>
        <CompanyForm initialData={editingCompany || undefined} onSubmit={editingCompany ? (handleUpdateCompany as (c: Company) => void) : (handleCreateCompany as (c: Company) => void)} onCancel={() => setCompanyModalOpen(false)} />
      </Modal>
    </>
  );
};

export default ClientsPage;
