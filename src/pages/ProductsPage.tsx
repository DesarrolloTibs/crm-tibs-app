import React, { useEffect, useState } from 'react';
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
import { Filter, XCircle, Search, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Notification from '../components/Modal/Notification';

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

  return (
    <>
      <Notification {...notification} />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Catálogo de Productos</h1>
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
          <button
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 flex items-center justify-center gap-2 transition-colors w-full sm:w-auto shadow-sm whitespace-nowrap"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            <span>Filtros</span>
          </button>
          
          <button
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors w-full sm:w-auto shadow-sm whitespace-nowrap"
            onClick={openCreateModal}
          >
            <Plus size={18} /> Nuevo Producto
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Filtros</h3>
            <button
              onClick={handleClearFilters}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              <XCircle size={16} className="mr-1" />
              Limpiar filtros
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                <Search size={20} />
              </span>
              <input
                type="text"
                placeholder="Filtrar por nombre o descripción"
                value={filterNombre}
                onChange={(e) => setFilterNombre(e.target.value)}
                className="w-full border rounded-lg pl-10 pr-4 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              />
            </div>

            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 bg-white cursor-pointer font-medium"
              >
                <option value="all">Todos los Estados</option>
                <option value="active">Solo Activos</option>
                <option value="inactive">Solo Inactivos</option>
              </select>
            </div>
          </div>
        </div>
      )}

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
