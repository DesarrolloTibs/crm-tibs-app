import React, { useMemo, useRef, useEffect } from 'react';
import { Plus, Filter, XCircle } from 'lucide-react';
import ProductForm from '../components/Product/ProductForm';
import ProductFilesTab from '../components/Product/ProductFilesTab';
import Modal from '../components/Modal/Modal';
import Tabs from '../components/Tabs/Tabs';
import Loader from '../components/Loader/Loader';
import ProductsTable from '../components/Product/ProductsTable';
import Notification from '../components/Modal/Notification';
import Select from '../components/shared/Select';
import Button from '../components/shared/Button';
import UnifiedSearchBar from '../components/shared/UnifiedSearchBar';
import type { SearchBadge } from '../components/shared/UnifiedSearchBar';
import { useProducts } from '../hooks/useProducts';
import { useAuth } from '../hooks/useAuth';

const ProductsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const {
    products, loading, editingProduct, isFormModalOpen, setIsFormModalOpen,
    showFilters, setShowFilters, filterNombre, setFilterNombre,
    filterStatus, setFilterStatus, currentPage, setCurrentPage, totalPages,
    notification, handleCreate, handleUpdate, handleUpdateStatus, handleDeleteConfirm,
    openCreateModal, openEditModal, clearFilters, updateEditingProduct,
  } = useProducts();

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowFilters(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [setShowFilters]);

  const badges = useMemo(() => {
    const list: SearchBadge[] = [];
    if (filterStatus !== 'all') list.push({ id: 'status', label: filterStatus === 'active' ? 'Solo Activos' : 'Solo Inactivos', icon: <Filter size={10} />, onRemove: () => setFilterStatus('all') });
    return list;
  }, [filterStatus, setFilterStatus]);

  const modalContent = () => {
    if (!editingProduct?.id) {
      return <ProductForm onSubmit={handleCreate} onCancel={() => setIsFormModalOpen(false)} />;
    }
    return (
      <Tabs tabs={[
        { label: 'Datos', content: <ProductForm initialData={editingProduct} onSubmit={handleUpdate} onCancel={() => setIsFormModalOpen(false)} /> },
        { label: 'Fichas Técnicas', content: <ProductFilesTab product={editingProduct} onUploadSuccess={updateEditingProduct} /> },
      ]} />
    );
  };

  return (
    <>
      <Notification {...notification} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Catálogo de Productos</h1>
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 items-center">
          <UnifiedSearchBar ref={searchRef} searchTerm={filterNombre} onSearchChange={setFilterNombre} placeholder={filterStatus === 'all' ? 'Buscar por nombre o descripción...' : ''} badges={badges} showFilters={showFilters} setShowFilters={setShowFilters} dropdownWidthClass="w-[300px]">
            <div className="w-full flex flex-col gap-3">
              <div>
                <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none">Estado</h4>
                <Select value={{ value: filterStatus, label: filterStatus === 'all' ? 'Todos los Estados' : filterStatus === 'active' ? 'Solo Activos' : 'Solo Inactivos' }} onChange={opt => setFilterStatus(opt ? opt.value : 'all')} options={[{ value: 'all', label: 'Todos los Estados' }, { value: 'active', label: 'Solo Activos' }, { value: 'inactive', label: 'Solo Inactivos' }]} placeholder="Todos los Estados" />
              </div>
              <div className="border-t border-gray-100 my-1 pt-2 w-full" />
              <button type="button" onClick={clearFilters} className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 px-2 py-1.5 rounded w-full text-left hover:bg-red-50 transition-colors cursor-pointer shrink-0">
                <XCircle size={12} /> Limpiar Filtros
              </button>
            </div>
          </UnifiedSearchBar>
          <Button variant="success" className="w-full sm:w-auto whitespace-nowrap h-[38px] py-0 px-4 flex items-center justify-center" onClick={openCreateModal}>
            <Plus size={18} className="mr-2" /> Nuevo Producto
          </Button>
        </div>
      </div>

      {loading ? <Loader /> : (
        <ProductsTable products={products} onEdit={openEditModal} onDelete={handleDeleteConfirm} onUpdateStatus={handleUpdateStatus} isAdmin={isAdmin} currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}

      <Modal open={isFormModalOpen} onClose={() => setIsFormModalOpen(false)}>
        {modalContent()}
      </Modal>
    </>
  );
};

export default ProductsPage;
