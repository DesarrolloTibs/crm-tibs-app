import React from 'react';
import { Building, User as UserIcon } from 'lucide-react';
import type { Company } from '../core/models/Company';
import ClientForm from '../components/Client/ClientForm';
import CompanyForm from '../components/Company/CompanyForm';
import Modal from '../components/Modal/Modal';
import ClientsTable from '../components/Client/ClientsTable';
import CompaniesTable from '../components/Company/CompaniesTable';
import Notification from '../components/Modal/Notification';
import Button from '../components/shared/Button';
import ClientFiltersBar from '../components/Client/ClientFiltersBar';
import { useClients } from '../hooks/useClients';
import { useAuth } from '../hooks/useAuth';

const ClientsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const {
    viewSubModule,
    setViewSubModule,
    filteredClients,
    filteredCompanies,
    loading,
    notification,
    executives,
    filters,
    handleFilterChange,
    handleClearFilters,
    // Modals
    editingClient,
    editingCompany,
    clientModalOpen,
    setClientModalOpen,
    companyModalOpen,
    setCompanyModalOpen,
    openCreateModal,
    openEditClientModal,
    openEditCompanyModal,
    // CRUD Handlers
    handleCreateClient,
    handleUpdateClient,
    handleUpdateClientStatus,
    handleCreateCompany,
    handleUpdateCompany,
    handleUpdateCompanyStatus,
  } = useClients();

  const isContacts = viewSubModule === 'contacts';

  return (
    <>
      <Notification {...notification} />

      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
          <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => setViewSubModule('contacts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                isContacts ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserIcon size={15} /> Contactos
            </button>
            <button
              onClick={() => setViewSubModule('companies')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                !isContacts ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building size={15} /> Empresas (Cuentas)
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 items-center">
          <ClientFiltersBar
            viewSubModule={viewSubModule}
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
            {isContacts ? (
              <>
                <UserIcon size={18} className="mr-2" /> Nuevo Contacto
              </>
            ) : (
              <>
                <Building size={18} className="mr-2" /> Nueva Empresa
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Table Content */}
      {isContacts ? (
        <ClientsTable
          clients={filteredClients}
          loading={loading}
          onEdit={openEditClientModal}
          onUpdateStatus={handleUpdateClientStatus}
          isAdmin={isAdmin}
        />
      ) : (
        <CompaniesTable
          companies={filteredCompanies}
          loading={loading}
          onEdit={openEditCompanyModal}
          onUpdateStatus={handleUpdateCompanyStatus}
          isAdmin={isAdmin}
        />
      )}

      {/* Modals rendered conditionally to optimize memory & re-renders */}
      {clientModalOpen && (
        <Modal open onClose={() => setClientModalOpen(false)}>
          <ClientForm
            initialData={editingClient || undefined}
            onSubmit={editingClient ? handleUpdateClient : handleCreateClient}
            onCancel={() => setClientModalOpen(false)}
          />
        </Modal>
      )}

      {companyModalOpen && (
        <Modal open onClose={() => setCompanyModalOpen(false)}>
          <CompanyForm
            initialData={editingCompany || undefined}
            onSubmit={
              editingCompany
                ? (handleUpdateCompany as (c: Company) => void)
                : (handleCreateCompany as (c: Company) => void)
            }
            onCancel={() => setCompanyModalOpen(false)}
          />
        </Modal>
      )}
    </>
  );
};

export default ClientsPage;
