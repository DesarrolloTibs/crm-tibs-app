import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  uploadProductCoverImage,
  uploadProductFile,
} from '../services/productsService';
import type { Product } from '../core/models/Product';
import ProductForm from '../components/Product/ProductForm';
import ProductFilesTab from '../components/Product/ProductFilesTab';
import Modal from '../components/Modal/Modal';
import Tabs from '../components/Tabs/Tabs';
import Loader from '../components/Loader/Loader';
import ProductsTable from '../components/Product/ProductsTable';
import { Filter, XCircle, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Notification from '../components/Modal/Notification';
import Select from '../components/shared/Select';
import Button from '../components/shared/Button';
import UnifiedSearchBar from '../components/shared/UnifiedSearchBar';
import type { SearchBadge } from '../components/shared/UnifiedSearchBar';

const PAGE_SIZE = 10;

const ProductsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterNombre, setFilterNombre] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all'); // 'all', 'active', 'inactive'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Loading indicator
  const [loading, setLoading] = useState(false);

  // Notifications
  const [notification, setNotification] = useState({
    show: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'confirmation',
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const searchDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hideNotification = () => setNotification((prev) => ({ ...prev, show: false }));

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los productos del catálogo',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreate = async (
    productData: Partial<Product>,
    stagedCoverFile: File | null,
    stagedSpecs: { id: string; file: File; title: string }[]
  ) => {
    setLoading(true);
    try {
      // 1. Crear el producto
      const newProduct = await createProduct(productData);

      // 2. Subir imagen de portada si existe
      if (stagedCoverFile && newProduct.id) {
        await uploadProductCoverImage(newProduct.id, stagedCoverFile);
      }

      // 3. Subir las fichas técnicas adjuntas
      if (stagedSpecs && stagedSpecs.length > 0 && newProduct.id) {
        for (const sf of stagedSpecs) {
          await uploadProductFile(newProduct.id, sf.file, sf.title);
        }
      }

      setIsFormModalOpen(false);
      setNotification({
        show: true,
        type: 'success',
        title: '¡Éxito!',
        message: 'Producto creado correctamente en el catálogo.',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
      fetchProducts();
    } catch (error) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo crear el producto.',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (
    productData: Partial<Product>,
    stagedCoverFile: File | null
  ) => {
    if (!editingProduct?.id) return;
    setLoading(true);
    try {
      // 1. Actualizar los datos del producto
      await updateProduct(editingProduct.id, productData);

      // 2. Subir o cambiar imagen de portada si hay un archivo staged
      if (stagedCoverFile) {
        await uploadProductCoverImage(editingProduct.id, stagedCoverFile);
      }

      setEditingProduct(null);
      setIsFormModalOpen(false);
      setNotification({
        show: true,
        type: 'success',
        title: '¡Éxito!',
        message: 'Producto actualizado correctamente.',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
      fetchProducts();
    } catch (error) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo actualizar el producto.',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (product: Product) => {
    if (!product.id) return;
    const isActivating = !product.status;
    setNotification({
      show: true,
      type: 'confirmation',
      title: `¿Deseas ${isActivating ? 'activar' : 'desactivar'} el producto?`,
      message: isActivating
        ? 'El producto volverá a estar disponible para asociar a oportunidades.'
        : 'El producto no se podrá seleccionar para nuevas oportunidades.',
      onConfirm: async () => {
        hideNotification();
        try {
          await updateProductStatus(product.id!, isActivating);
          setNotification({
            show: true,
            type: 'success',
            title: '¡Éxito!',
            message: `Producto ${isActivating ? 'activado' : 'desactivado'} correctamente.`,
            onConfirm: hideNotification,
            onCancel: hideNotification,
          });
          fetchProducts();
        } catch (error) {
          setNotification({
            show: true,
            type: 'error',
            title: 'Error',
            message: `No se pudo cambiar el estado del producto.`,
            onConfirm: hideNotification,
            onCancel: hideNotification,
          });
        }
      },
      onCancel: hideNotification,
    });
  };

  const handleDeleteConfirm = (product: Product) => {
    setNotification({
      show: true,
      type: 'confirmation',
      title: '¿Eliminar producto del catálogo?',
      message: `¿Estás seguro de que deseas eliminar permanentemente el producto "${product.nombre}"? Esto eliminará todos sus archivos adjuntos del servidor y lo desasociará de las oportunidades existentes (manteniendo las oportunidades intactas).`,
      onConfirm: async () => {
        hideNotification();
        if (!product.id) return;
        setLoading(true);
        try {
          await deleteProduct(product.id);
          setNotification({
            show: true,
            type: 'success',
            title: '¡Eliminado!',
            message: 'El producto se ha eliminado correctamente.',
            onConfirm: hideNotification,
            onCancel: hideNotification,
          });
          fetchProducts();
        } catch (error) {
          setNotification({
            show: true,
            type: 'error',
            title: 'Error',
            message: 'No se pudo eliminar el producto.',
            onConfirm: hideNotification,
            onCancel: hideNotification,
          });
        } finally {
          setLoading(false);
        }
      },
      onCancel: () => {
        hideNotification();
      },
    });
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsFormModalOpen(true);
  };

  const handleClearFilters = () => {
    setFilterNombre('');
    setFilterStatus('all');
  };

  // Filter products locally
  const filteredProducts = products.filter((product) => {
    const matchesNombre = product.nombre.toLowerCase().includes(filterNombre.toLowerCase()) ||
      (product.descripcion || '').toLowerCase().includes(filterNombre.toLowerCase());
    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'active'
        ? product.status === true
        : product.status === false;
    return matchesNombre && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filterNombre, filterStatus]);

  const getModalContent = () => {
    if (!editingProduct?.id) {
      return (
        <ProductForm
          onSubmit={handleCreate}
          onCancel={() => setIsFormModalOpen(false)}
        />
      );
    }

    const tabs = [
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
            onUploadSuccess={(updatedProduct) => {
              setEditingProduct(updatedProduct);
              setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
            }}
          />
        ),
      },
    ];
    return <Tabs tabs={tabs} />;
  };

  const badges = useMemo(() => {
    const list: SearchBadge[] = [];
    if (filterStatus !== 'all') {
      list.push({
        id: 'status',
        label: filterStatus === 'active' ? 'Solo Activos' : 'Solo Inactivos',
        icon: <Filter size={10} />,
        onRemove: () => setFilterStatus('all')
      });
    }
    return list;
  }, [filterStatus]);

  return (
    <>
      <Notification {...notification} />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Catálogo de Productos</h1>
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 items-center">
          <UnifiedSearchBar
            ref={searchDropdownRef}
            searchTerm={filterNombre}
            onSearchChange={setFilterNombre}
            placeholder={filterStatus === 'all' ? "Buscar por nombre o descripción..." : ""}
            badges={badges}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            dropdownWidthClass="w-[300px]"
          >
            <div className="w-full flex flex-col gap-3">
              <div>
                <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none">Estado</h4>
                <Select
                  value={{ value: filterStatus, label: filterStatus === 'all' ? 'Todos los Estados' : filterStatus === 'active' ? 'Solo Activos' : 'Solo Inactivos' }}
                  onChange={(opt) => setFilterStatus(opt ? opt.value : 'all')}
                  options={[
                    { value: 'all', label: 'Todos los Estados' },
                    { value: 'active', label: 'Solo Activos' },
                    { value: 'inactive', label: 'Solo Inactivos' }
                  ]}
                  placeholder="Todos los Estados"
                />
              </div>
              <div className="border-t border-gray-100 my-1 pt-2 w-full" />
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 px-2 py-1.5 rounded w-full text-left hover:bg-red-50 transition-colors cursor-pointer shrink-0"
              >
                <XCircle size={12} />
                Limpiar Filtros
              </button>
            </div>
          </UnifiedSearchBar>

          <Button
            variant="success"
            className="w-full sm:w-auto whitespace-nowrap h-[38px] py-0 px-4 flex items-center justify-center"
            onClick={openCreateModal}
          >
            <Plus size={18} className="mr-2" /> Nuevo Producto
          </Button>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <ProductsTable
          products={paginatedProducts}
          onEdit={openEditModal}
          onDelete={handleDeleteConfirm}
          onUpdateStatus={handleUpdateStatus}
          isAdmin={isAdmin}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      <Modal open={isFormModalOpen} onClose={() => setIsFormModalOpen(false)}>
        {getModalContent()}
      </Modal>
    </>
  );
};

export default ProductsPage;
