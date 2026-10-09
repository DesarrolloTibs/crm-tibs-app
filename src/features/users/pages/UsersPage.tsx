import React from 'react';
import { UserPlus } from 'lucide-react';
import UserForm from '../components/User/UserForm';
import UsersTable from '../components/User/UsersTable';
import Modal from '../components/Modal/Modal';
import ProfileImageUploadModal from '../components/User/ProfileImageUploadModal';
import Notification from '../components/Modal/Notification';
import Button from '../components/shared/Button';
import UserFiltersBar from '../components/User/UserFiltersBar';
import { useUsers } from '../hooks/useUsers';

const UsersPage: React.FC = () => {
  const {
    isAdmin,
    users,
    loading,
    editing,
    uploadingUser,
    modalOpen,
    setModalOpen,
    filters,
    roleOptions,
    notification,
    handleFilterChange,
    handleClearFilters,
    handleCreate,
    handleUpdate,
    handleUpdateStatus,
    openCreateModal,
    openEditModal,
    openUploadModal,
    closeUploadModal,
    handleUploadSuccess,
  } = useUsers();

  return (
    <>
      <Notification {...notification} />

      {/* Header and Filter Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>

        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 items-center">
          <UserFiltersBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            roleOptions={roleOptions}
          />

          <Button
            variant="primary"
            onClick={openCreateModal}
            className="w-full sm:w-auto h-[38px] py-0 px-4 flex items-center justify-center whitespace-nowrap"
          >
            <UserPlus size={18} className="mr-2" /> Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* Users Table with shared TanStack Table */}
      <UsersTable
        users={users}
        loading={loading}
        onEdit={openEditModal}
        onUpdateStatus={handleUpdateStatus}
        onUploadImage={openUploadModal}
        isAdmin={isAdmin}
      />

      {/* Lazy Modal for User Form */}
      {modalOpen && (
        <Modal open onClose={() => setModalOpen(false)}>
          <UserForm
            initialData={editing || undefined}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={() => setModalOpen(false)}
          />
        </Modal>
      )}

      {/* Lazy Modal for Profile Image Upload */}
      {uploadingUser && (
        <Modal open onClose={closeUploadModal}>
          <ProfileImageUploadModal
            user={uploadingUser}
            onClose={closeUploadModal}
            onUploadSuccess={handleUploadSuccess}
          />
        </Modal>
      )}
    </>
  );
};

export default UsersPage;
