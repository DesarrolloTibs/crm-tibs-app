import React from 'react';
import { Building } from 'lucide-react';
import CompanyForm from '../components/Company/CompanyForm';
import Modal from '../components/Modal/Modal';
import CompaniesTable from '../components/Company/CompaniesTable';
import Notification from '../components/Modal/Notification';
import Button from '../components/shared/Button';
import CompanyFiltersBar from '../components/Company/CompanyFiltersBar';
import { useCompanies } from '../hooks/useCompanies';
import { useAuth } from '../hooks/useAuth';
import type { Company } from '../core/models/Company';

const CompaniesPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const {
    companies,
    loading,
    editing,
    modalOpen,
    setModalOpen,
    notification,
    executives,
    filters,
    handleFilterChange,
    handleClearFilters,
    handleCreate,
    handleUpdate,
    handleUpdateStatus,
    openCreateModal,
    openEditModal,
  } = useCompanies();

  return (
    <>
      <Notification {...notification} />

      {/* Header and Filter Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Empresas</h1>

        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 items-center">
          <CompanyFiltersBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            executives={executives}
          />

          <Button
            variant="success"
            className="w-full sm:w-auto h-[38px] py-0 px-4 whitespace-nowrap flex items-center justify-center"
            onClick={openCreateModal}
          >
            <Building size={18} className="mr-2" /> Nueva Empresa
          </Button>
        </div>
      </div>

      {/* Shared Table with internal TanStack pagination and sticky headers */}
      <CompaniesTable
        companies={companies}
        loading={loading}
        onEdit={openEditModal}
        onUpdateStatus={handleUpdateStatus}
        isAdmin={isAdmin}
      />

      {/* Lazy Modal for Form */}
      {modalOpen && (
        <Modal open onClose={() => setModalOpen(false)}>
          <CompanyForm
            initialData={editing || undefined}
            onSubmit={
              editing
                ? (handleUpdate as (c: Company) => void)
                : (handleCreate as (c: Company) => void)
            }
            onCancel={() => setModalOpen(false)}
          />
        </Modal>
      )}
    </>
  );
};

export default CompaniesPage;
