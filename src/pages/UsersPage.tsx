import React, { useMemo } from 'react';
import { UserPlus, Filter, XCircle, Mail } from 'lucide-react';
import UserForm from '../components/User/UserForm';
import UsersTable from '../components/User/UsersTable';
import Modal from '../components/Modal/Modal';
import Loader from '../components/Loader/Loader';
import ProfileImageUploadModal from '../components/User/ProfileImageUploadModal';
import Notification from '../components/Modal/Notification';
import Select from '../components/shared/Select';
import Input from '../components/shared/Input';
import Button from '../components/shared/Button';
import UnifiedSearchBar from '../components/shared/UnifiedSearchBar';
import type { SearchBadge } from '../components/shared/UnifiedSearchBar';
import { useUsers } from '../hooks/useUsers';

const UsersPage: React.FC = () => {
  const {
    isAdmin, editing, uploadingUser, modalOpen, setModalOpen, loading,
    showFilters, setShowFilters, filterUsername, setFilterUsername,
    filterEmail, setFilterEmail, filterRole, setFilterRole,
    currentPage, setCurrentPage, notification, searchDropdownRef,
    paginatedUsers, totalPages, roleOptions,
    handleCreate, handleUpdate, handleUpdateStatus,
    openCreateModal, openEditModal, openUploadModal, closeUploadModal, handleUploadSuccess, handleClearFilters,
  } = useUsers();

  const badges = useMemo(() => {
    const list: SearchBadge[] = [];
    if (filterEmail) list.push({ id: 'email', label: `Email: ${filterEmail}`, icon: <Filter size={10} />, onRemove: () => setFilterEmail('') });
    if (filterRole) { const label = roleOptions.find(o => o.value === filterRole)?.label || 'Rol'; list.push({ id: 'role', label: `Rol: ${label}`, icon: <Filter size={10} />, onRemove: () => setFilterRole('') }); }
    return list;
  }, [filterEmail, filterRole, roleOptions, setFilterEmail, setFilterRole]);

  return (
    <>
      <Notification {...notification} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 items-center">
          <UnifiedSearchBar ref={searchDropdownRef} searchTerm={filterUsername} onSearchChange={setFilterUsername} placeholder={!filterEmail && !filterRole ? 'Buscar por usuario...' : ''} badges={badges} showFilters={showFilters} setShowFilters={setShowFilters} dropdownWidthClass="w-[300px]">
            <div className="w-full flex flex-col gap-3">
              <div>
                <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none">Email</h4>
                <Input type="text" placeholder="Filtrar por email" value={filterEmail} onChange={e => setFilterEmail(e.target.value)} inputPrefix={<Mail size={18} />} />
              </div>
              <div>
                <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none">Rol</h4>
                <Select options={roleOptions} value={roleOptions.find(o => o.value === filterRole)} onChange={sel => setFilterRole(sel ? sel.value : '')} placeholder="Todos los Roles" />
              </div>
              <div className="border-t border-gray-100 my-1 pt-2 w-full" />
              <button type="button" onClick={handleClearFilters} className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 px-2 py-1.5 rounded w-full text-left hover:bg-red-50 transition-colors cursor-pointer shrink-0">
                <XCircle size={12} /> Limpiar Filtros
              </button>
            </div>
          </UnifiedSearchBar>
          <Button variant="primary" onClick={openCreateModal} className="w-full sm:w-auto h-[38px] py-0 px-4 flex items-center justify-center whitespace-nowrap">
            <UserPlus size={18} className="mr-2" /> Nuevo Usuario
          </Button>
        </div>
      </div>

      {loading ? <Loader /> : (
        <UsersTable users={paginatedUsers} onEdit={openEditModal} onUpdateStatus={handleUpdateStatus} onUploadImage={openUploadModal} isAdmin={isAdmin} currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <UserForm initialData={editing || undefined} onSubmit={editing ? handleUpdate : handleCreate} onCancel={() => setModalOpen(false)} />
      </Modal>
      <Modal open={!!uploadingUser} onClose={closeUploadModal}>
        {uploadingUser && <ProfileImageUploadModal user={uploadingUser} onClose={closeUploadModal} onUploadSuccess={handleUploadSuccess} />}
      </Modal>
    </>
  );
};

export default UsersPage;
