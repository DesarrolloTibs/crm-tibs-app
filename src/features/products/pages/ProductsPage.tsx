import React from 'react';
import { Plus } from 'lucide-react';
import ProductForm from '../components/Product/ProductForm';
import ProductFilesTab from '../components/Product/ProductFilesTab';
import Modal from '../components/Modal/Modal';
import Tabs from '../components/Tabs/Tabs';
import ProductsTable from '../components/Product/ProductsTable';
import Notification from '../components/Modal/Notification';
import Button from '../components/shared/Button';
import ProductFiltersBar from '../components/Product/ProductFiltersBar';
import { useProducts } from '../hooks/useProducts';
import { useAuth } from '../hooks/useAuth';

const ProductsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const {
    products,
    loading,
    editingProduct,
    isFormModalOpen,
    setIsFormModalOpen,
    filters,
    notification,
    handleFilterChange,
    handleClearFilters,
    handleCreate,
    handleUpdate,
    handleUpdateStatus,
    handleDeleteConfirm,
    openCreateModal,
    openEditModal,
    updateEditingProduct,
  } = useProducts();

  const modalContent = () => {
    if (!editingProduct?.id) {
      return (
        <ProductForm
          onSubmit={handleCreate}
          onCancel={() => setIsFormModalOpen(false)}
        />
      );
    }
    return (
      <Tabs
        tabs={[
          {
            label: 'Datos',
            content: (
              <ProductForm
                initialData={editingProduct}
                onSubmit={handleUpdate}
                onCancel={() => setIsFormModalOpen(false)}
              />
            ),
          },
          {
            label: 'Fichas Técnicas',
            content: (
              <ProductFilesTab
                product={editingProduct}
                onUploadSuccess={updateEditingProduct}
              />
            ),
          },
        ]}
      />
    );
  };

  return (
    <>
      <Notification {...notification} />

      {/* Header and Filter Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Catálogo de Productos</h1>

        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 items-center">
          <ProductFiltersBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />

          <Button
            variant="success"
            className="w-full sm:w-auto whitespace-nowrap h-[38px] py-0 px-4 flex items-center justify-center"
            onClick={openCreateModal}
          >
            <Plus size={18} className="mr-2" /> Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Shared Table */}
      <ProductsTable
        products={products}
        loading={loading}
        onEdit={openEditModal}
        onDelete={handleDeleteConfirm}
        onUpdateStatus={handleUpdateStatus}
        isAdmin={isAdmin}
      />

      {/* Lazy Modal for Form / Tabs */}
      {isFormModalOpen && (
        <Modal open onClose={() => setIsFormModalOpen(false)}>
          {modalContent()}
        </Modal>
      )}
    </>
  );
};

export default ProductsPage;
