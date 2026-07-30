import React, { useMemo } from 'react';
import { Building, Filter, XCircle } from 'lucide-react';
import CompanyForm from '../components/Company/CompanyForm';
import Modal from '../components/Modal/Modal';
import Loader from '../components/Loader/Loader';
import CompaniesTable from '../components/Company/CompaniesTable';
import Notification from '../components/Modal/Notification';
import Select from 'react-select';
import Input from '../components/shared/Input';
import Button from '../components/shared/Button';
import UnifiedSearchBar from '../components/shared/UnifiedSearchBar';
import type { SearchBadge } from '../components/shared/UnifiedSearchBar';
import { useCompanies } from '../hooks/useCompanies';
import { useAuth } from '../hooks/useAuth';
import type { Company } from '../core/models/Company';

const CompaniesPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const {
    companies, loading, editing, modalOpen, setModalOpen,
    showFilters, setShowFilters,
    filterNombre, setFilterNombre,
    filterCorreo, setFilterCorreo,
    filterEjecutivoId, setFilterEjecutivoId,
    executives, currentPage, setCurrentPage, totalPages,
    notification,
    handleCreate, handleUpdate, handleUpdateStatus,
    openCreateModal, openEditModal, clearFilters,
  } = useCompanies();

  const searchRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const h = (e: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowFilters(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [setShowFilters]);

  const badges = useMemo(() => {
    const list: SearchBadge[] = [];
    if (filterCorreo) list.push({ id: 'correo', label: `Correo: ${filterCorreo}`, icon: <Filter size={10} />, onRemove: () => setFilterCorreo('') });
    if (filterEjecutivoId) list.push({ id: 'ejecutivo', label: executives.find(e => e.value === filterEjecutivoId)?.label || 'Ejecutivo', icon: <Filter size={10} />, onRemove: () => setFilterEjecutivoId(null) });
    return list;
  }, [filterCorreo, filterEjecutivoId, executives, setFilterCorreo, setFilterEjecutivoId]);

  return (
    <>
      <Notification {...notification} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Empresas</h1>
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 items-center">
          <UnifiedSearchBar ref={searchRef} searchTerm={filterNombre} onSearchChange={setFilterNombre} placeholder={!filterCorreo && !filterEjecutivoId ? 'Buscar por nombre...' : ''} badges={badges} showFilters={showFilters} setShowFilters={setShowFilters} dropdownWidthClass="w-[320px]">
            <div className="w-full flex flex-col gap-3">
              <div>
                <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none">Correo</h4>
                <Input type="text" placeholder="Filtrar por correo" value={filterCorreo} onChange={e => setFilterCorreo(e.target.value)} />
              </div>
              <div>
                <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none">Ejecutivo</h4>
                <Select inputId="ejecutivo-filter" options={executives} value={executives.find(o => o.value === filterEjecutivoId) || null} onChange={(o: any) => setFilterEjecutivoId(o ? o.value : null)} placeholder="Filtrar por ejecutivo" isClearable isSearchable className="w-full" />
              </div>
              <div className="border-t border-gray-100 my-1 pt-2 w-full" />
              <button type="button" onClick={clearFilters} className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 px-2 py-1.5 rounded w-full text-left hover:bg-red-50 transition-colors cursor-pointer shrink-0">
                <XCircle size={12} /> Limpiar Filtros
              </button>
            </div>
          </UnifiedSearchBar>
          <Button variant="success" className="w-full sm:w-auto h-[38px] py-0 px-4 whitespace-nowrap flex items-center justify-center" onClick={openCreateModal}>
            <Building size={18} className="mr-2" /> Nueva Empresa
          </Button>
        </div>
      </div>

      {loading ? <Loader /> : (
        <CompaniesTable companies={companies} onEdit={openEditModal} onUpdateStatus={handleUpdateStatus} isAdmin={isAdmin} currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <CompanyForm initialData={editing || undefined} onSubmit={editing ? (handleUpdate as (c: Company) => void) : (handleCreate as (c: Company) => void)} onCancel={() => setModalOpen(false)} />
      </Modal>
    </>
  );
};

export default CompaniesPage;
