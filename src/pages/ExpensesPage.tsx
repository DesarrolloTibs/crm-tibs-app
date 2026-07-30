import React, { useMemo } from 'react';
import { Plus, Filter, XCircle, Calendar } from 'lucide-react';
import ExpensesTable from '../components/Expense/ExpensesTable';
import ExpenseForm from '../components/Expense/ExpenseForm';
import Modal from '../components/Modal/Modal';
import Loader from '../components/Loader/Loader';
import Notification from '../components/Modal/Notification';
import ReceiptUploadModal from '../components/Expense/ReceiptUploadModal';
import Select from '../components/shared/Select';
import Input from '../components/shared/Input';
import Button from '../components/shared/Button';
import UnifiedSearchBar from '../components/shared/UnifiedSearchBar';
import type { SearchBadge } from '../components/shared/UnifiedSearchBar';
import { useExpenses } from '../hooks/useExpenses';

const ExpensesPage: React.FC = () => {
  const {
    paginatedExpenses, loading, modalOpen, setModalOpen,
    editingExpense, uploadingExpense,
    showFilters, setShowFilters,
    filterConcept, setFilterConcept,
    filterUser, setFilterUser,
    filterDate, setFilterDate,
    currentPage, setCurrentPage,
    notification, searchDropdownRef,
    userOptions, handleUserFilterChange, totalPages,
    handleCreate, handleUpdate, handleDelete,
    openCreateModal, openEditModal, openUploadModal, closeUploadModal, handleUploadSuccess, handleClearFilters,
  } = useExpenses();

  const badges = useMemo(() => {
    const list: SearchBadge[] = [];
    if (filterUser) list.push({ id: 'user', label: userOptions.find(o => o.value === filterUser)?.label || 'Usuario', icon: <Filter size={10} />, onRemove: () => setFilterUser('') });
    if (filterDate) list.push({ id: 'date', label: filterDate, icon: <Calendar size={10} />, onRemove: () => setFilterDate('') });
    return list;
  }, [filterUser, filterDate, userOptions, setFilterUser, setFilterDate]);

  return (
    <>
      <Notification {...notification} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Gastos</h1>
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 items-center">
          <UnifiedSearchBar ref={searchDropdownRef} searchTerm={filterConcept} onSearchChange={setFilterConcept} placeholder={!filterUser && !filterDate ? 'Buscar por concepto...' : ''} badges={badges} showFilters={showFilters} setShowFilters={setShowFilters} dropdownWidthClass="w-[300px]">
            <div className="w-full flex flex-col gap-3">
              <div>
                <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none">Usuario</h4>
                <Select inputId="user-filter" options={userOptions} value={filterUser ? userOptions.find(o => o.value === filterUser) : null} onChange={handleUserFilterChange} placeholder="Filtrar por usuario" isClearable isSearchable noOptionsMessage={() => 'No se encontraron usuarios'} />
              </div>
              <div>
                <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none">Fecha</h4>
                <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="text-xs bg-white cursor-pointer py-2 rounded-xl" />
              </div>
              <div className="border-t border-gray-100 my-1 pt-2 w-full" />
              <button type="button" onClick={handleClearFilters} className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 px-2 py-1.5 rounded w-full text-left hover:bg-red-50 transition-colors cursor-pointer shrink-0">
                <XCircle size={12} /> Limpiar Filtros
              </button>
            </div>
          </UnifiedSearchBar>
          <Button variant="success" onClick={openCreateModal} className="w-full sm:w-auto py-2.5 px-4 h-[38px] flex items-center justify-center whitespace-nowrap">
            <Plus size={18} className="mr-2" /> Nuevo Gasto
          </Button>
        </div>
      </div>

      {loading ? <Loader /> : (
        <ExpensesTable expenses={paginatedExpenses} onEdit={openEditModal} onDelete={handleDelete} currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} onUploadReceipt={openUploadModal} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <ExpenseForm initialData={editingExpense} onSubmit={editingExpense ? handleUpdate : handleCreate} onCancel={() => setModalOpen(false)} />
      </Modal>
      <Modal open={!!uploadingExpense} onClose={closeUploadModal}>
        {uploadingExpense && <ReceiptUploadModal expense={uploadingExpense} onClose={closeUploadModal} onUploadSuccess={handleUploadSuccess} />}
      </Modal>
    </>
  );
};

export default ExpensesPage;
