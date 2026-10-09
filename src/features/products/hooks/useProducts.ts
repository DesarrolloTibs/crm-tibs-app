import { useState, useEffect, useCallback, useMemo } from 'react';
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
import useDebounce from './useDebounce';
import useNotification from './useNotification';
import type { ProductFiltersState } from '../components/Product/ProductFiltersBar';

const INITIAL_FILTERS: ProductFiltersState = {
  nombre: '',
  status: 'all',
};

export function useProducts() {
  const { selectedTenant } = useConfigStore();
  const schemaName = selectedTenant?.schema_name;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  // Grouped filters state
  const [filters, setFilters] = useState<ProductFiltersState>(INITIAL_FILTERS);

  // Debounced search for smooth typing
  const debouncedNombre = useDebounce(filters.nombre, 250);

  // Reusable notification hook
  const { notification, showSuccess, showError, showConfirmation } = useNotification();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch {
      showError('No se pudieron cargar los productos del catálogo');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, schemaName]);

  const handleCreate = async (
    productData: Partial<Product>,
    stagedCoverFile: File | null,
    stagedSpecs: { id: string; file: File; title: string }[]
  ) => {
    setLoading(true);
    try {
      const newProduct = await createProduct(productData);
      if (stagedCoverFile && newProduct.id) {
        await uploadProductCoverImage(newProduct.id, stagedCoverFile);
      }
      if (stagedSpecs.length > 0 && newProduct.id) {
        for (const sf of stagedSpecs) {
          await uploadProductFile(newProduct.id, sf.file, sf.title);
        }
      }
      setIsFormModalOpen(false);
      showSuccess('Producto creado correctamente en el catálogo.');
      fetchProducts();
    } catch {
      showError('No se pudo crear el producto.');
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
      await updateProduct(editingProduct.id, productData);
      if (stagedCoverFile) {
        await uploadProductCoverImage(editingProduct.id, stagedCoverFile);
      }
      setEditingProduct(null);
      setIsFormModalOpen(false);
      showSuccess('Producto actualizado correctamente.');
      fetchProducts();
    } catch {
      showError('No se pudo actualizar el producto.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = useCallback(
    (product: Product) => {
      if (!product.id) return;
      const isActivating = !product.status;
      showConfirmation({
        title: `¿Deseas ${isActivating ? 'activar' : 'desactivar'} el producto?`,
        message: isActivating
          ? 'El producto volverá a estar disponible.'
          : 'El producto no se podrá seleccionar para nuevas oportunidades.',
        onConfirm: async () => {
          try {
            await updateProductStatus(product.id!, isActivating);
            showSuccess(
              `Producto ${isActivating ? 'activado' : 'desactivado'} correctamente.`
            );
            fetchProducts();
          } catch {
            showError('No se pudo cambiar el estado del producto.');
          }
        },
      });
    },
    [showConfirmation, showSuccess, showError, fetchProducts]
  );

  const handleDeleteConfirm = useCallback(
    (product: Product) => {
      showConfirmation({
        title: '¿Eliminar producto del catálogo?',
        message: `¿Estás seguro de eliminar "${product.nombre}"? Esto eliminará todos sus archivos y lo desasociará de oportunidades existentes.`,
        onConfirm: async () => {
          if (!product.id) return;
          setLoading(true);
          try {
            await deleteProduct(product.id);
            showSuccess('El producto se ha eliminado correctamente.');
            fetchProducts();
          } catch {
            showError('No se pudo eliminar el producto.');
          } finally {
            setLoading(false);
          }
        },
      });
    },
    [showConfirmation, showSuccess, showError, fetchProducts]
  );

  const handleFilterChange = useCallback(
    <K extends keyof ProductFiltersState>(key: K, value: ProductFiltersState[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleClearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsFormModalOpen(true);
  };

  const updateEditingProduct = useCallback((product: Product) => {
    setEditingProduct(product);
    setProducts((prev) => (prev.map((p) => (p.id === product.id ? product : p))));
  }, []);

  const filteredProducts = useMemo(() => {
    const q = debouncedNombre.trim().toLowerCase();
    return products.filter((p) => {
      const matchesNombre =
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        (p.descripcion || '').toLowerCase().includes(q);
      const matchesStatus =
        filters.status === 'all'
          ? true
          : filters.status === 'active'
          ? p.status === true
          : p.status === false;
      return matchesNombre && matchesStatus;
    });
  }, [products, debouncedNombre, filters.status]);

  return {
    products: filteredProducts,
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
  };
}

export default useProducts;
