import { useState, useEffect, useCallback } from 'react';
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
import { useConfigStore } from '../store/useConfigStore';

const PAGE_SIZE = 10;

export function useProducts() {
  const { selectedTenant } = useConfigStore();
  const schemaName = selectedTenant?.schema_name;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterNombre, setFilterNombre] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [notification, setNotification] = useState({
    show: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'confirmation',
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const hideNotification = useCallback(
    () => setNotification((prev) => ({ ...prev, show: false })),
    []
  );

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch {
      setNotification({ show: true, type: 'error', title: 'Error', message: 'No se pudieron cargar los productos del catálogo', onConfirm: hideNotification, onCancel: hideNotification });
    } finally {
      setLoading(false);
    }
  }, [hideNotification]);

  useEffect(() => { fetchProducts(); }, [fetchProducts, schemaName]);
  useEffect(() => { setCurrentPage(1); }, [filterNombre, filterStatus]);

  const handleCreate = async (
    productData: Partial<Product>,
    stagedCoverFile: File | null,
    stagedSpecs: { id: string; file: File; title: string }[]
  ) => {
    setLoading(true);
    try {
      const newProduct = await createProduct(productData);
      if (stagedCoverFile && newProduct.id) await uploadProductCoverImage(newProduct.id, stagedCoverFile);
      if (stagedSpecs.length > 0 && newProduct.id) {
        for (const sf of stagedSpecs) await uploadProductFile(newProduct.id, sf.file, sf.title);
      }
      setIsFormModalOpen(false);
      setNotification({ show: true, type: 'success', title: '¡Éxito!', message: 'Producto creado correctamente en el catálogo.', onConfirm: hideNotification, onCancel: hideNotification });
      fetchProducts();
    } catch {
      setNotification({ show: true, type: 'error', title: 'Error', message: 'No se pudo crear el producto.', onConfirm: hideNotification, onCancel: hideNotification });
    } finally { setLoading(false); }
  };

  const handleUpdate = async (productData: Partial<Product>, stagedCoverFile: File | null) => {
    if (!editingProduct?.id) return;
    setLoading(true);
    try {
      await updateProduct(editingProduct.id, productData);
      if (stagedCoverFile) await uploadProductCoverImage(editingProduct.id, stagedCoverFile);
      setEditingProduct(null);
      setIsFormModalOpen(false);
      setNotification({ show: true, type: 'success', title: '¡Éxito!', message: 'Producto actualizado correctamente.', onConfirm: hideNotification, onCancel: hideNotification });
      fetchProducts();
    } catch {
      setNotification({ show: true, type: 'error', title: 'Error', message: 'No se pudo actualizar el producto.', onConfirm: hideNotification, onCancel: hideNotification });
    } finally { setLoading(false); }
  };

  const handleUpdateStatus = async (product: Product) => {
    if (!product.id) return;
    const isActivating = !product.status;
    setNotification({
      show: true,
      type: 'confirmation',
      title: `¿Deseas ${isActivating ? 'activar' : 'desactivar'} el producto?`,
      message: isActivating ? 'El producto volverá a estar disponible.' : 'El producto no se podrá seleccionar para nuevas oportunidades.',
      onConfirm: async () => {
        hideNotification();
        try {
          await updateProductStatus(product.id!, isActivating);
          setNotification({ show: true, type: 'success', title: '¡Éxito!', message: `Producto ${isActivating ? 'activado' : 'desactivado'} correctamente.`, onConfirm: hideNotification, onCancel: hideNotification });
          fetchProducts();
        } catch {
          setNotification({ show: true, type: 'error', title: 'Error', message: 'No se pudo cambiar el estado del producto.', onConfirm: hideNotification, onCancel: hideNotification });
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
      message: `¿Estás seguro de eliminar "${product.nombre}"? Esto eliminará todos sus archivos y lo desasociará de oportunidades existentes.`,
      onConfirm: async () => {
        hideNotification();
        if (!product.id) return;
        setLoading(true);
        try {
          await deleteProduct(product.id);
          setNotification({ show: true, type: 'success', title: '¡Eliminado!', message: 'El producto se ha eliminado correctamente.', onConfirm: hideNotification, onCancel: hideNotification });
          fetchProducts();
        } catch {
          setNotification({ show: true, type: 'error', title: 'Error', message: 'No se pudo eliminar el producto.', onConfirm: hideNotification, onCancel: hideNotification });
        } finally { setLoading(false); }
      },
      onCancel: hideNotification,
    });
  };

  const openCreateModal = () => { setEditingProduct(null); setIsFormModalOpen(true); };
  const openEditModal = (product: Product) => { setEditingProduct(product); setIsFormModalOpen(true); };
  const clearFilters = () => { setFilterNombre(''); setFilterStatus('all'); };
  const updateEditingProduct = (product: Product) => {
    setEditingProduct(product);
    setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
  };

  const filteredProducts = products.filter((p) => {
    const matchesNombre = p.nombre.toLowerCase().includes(filterNombre.toLowerCase()) ||
      (p.descripcion || '').toLowerCase().includes(filterNombre.toLowerCase());
    const matchesStatus = filterStatus === 'all' ? true : filterStatus === 'active' ? p.status === true : p.status === false;
    return matchesNombre && matchesStatus;
  });

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return {
    products: paginatedProducts,
    loading,
    editingProduct,
    isFormModalOpen,
    setIsFormModalOpen,
    showFilters,
    setShowFilters,
    filterNombre,
    setFilterNombre,
    filterStatus,
    setFilterStatus,
    currentPage,
    setCurrentPage,
    totalPages,
    notification,
    hideNotification,
    handleCreate,
    handleUpdate,
    handleUpdateStatus,
    handleDeleteConfirm,
    openCreateModal,
    openEditModal,
    clearFilters,
    updateEditingProduct,
  };
}
