import React from 'react';
import { Plus } from 'lucide-react';
import ExpensesTable from '../components/ExpensesTable';
import ExpenseForm from '../components/ExpenseForm';
import ReceiptUploadModal from '../components/ReceiptUploadModal';
import ExpenseFiltersBar from '../components/ExpenseFiltersBar';
import { useExpenses } from '../hooks/useExpenses';
import { Modal, Notification, Button } from '@shared/components';
import type { Expense } from '@core/models/Expense';

const ExpensesPage: React.FC = () => {
  const {
    expenses,
    loading,
    modalOpen,
    setModalOpen,
    editingExpense,
    uploadingExpense,
    filters,
    userOptions,
    notification,
    handleFilterChange,
    handleClearFilters,
    handleCreate,
    handleUpdate,
    handleDelete,
    openCreateModal,
    openEditModal,
    openUploadModal,
    closeUploadModal,
    handleUploadSuccess,
  } = useExpenses();

  return (
    <>
      <Notification {...notification} />

      {/* Header and Filter Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Gastos</h1>

        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 items-center">
          <ExpenseFiltersBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            userOptions={userOptions}
          />

          <Button
            variant="success"
            onClick={openCreateModal}
            className="w-full sm:w-auto py-2.5 px-4 h-[38px] flex items-center justify-center whitespace-nowrap"
          >
            <Plus size={18} className="mr-2" /> Nuevo Gasto
          </Button>
        </div>
      </div>

      {/* Shared Table */}
      <ExpensesTable
        expenses={expenses}
        loading={loading}
        onEdit={openEditModal}
        onDelete={handleDelete}
        onUploadReceipt={openUploadModal}
      />

      {/* Lazy Modal for Form */}
      {modalOpen && (
        <Modal open onClose={() => setModalOpen(false)}>
          <ExpenseForm
            initialData={editingExpense}
            onSubmit={(data: Partial<Expense>) =>
              editingExpense ? handleUpdate(data) : handleCreate(data)
            }
            onCancel={() => setModalOpen(false)}
          />
        </Modal>
      )}

      {/* Lazy Modal for Receipt Upload */}
      {uploadingExpense && (
        <Modal open onClose={closeUploadModal}>
          <ReceiptUploadModal
            expense={uploadingExpense}
            onClose={closeUploadModal}
            onUploadSuccess={handleUploadSuccess}
          />
        </Modal>
      )}
    </>
  );
};

export default ExpensesPage;
