import axiosInstance from "../core/axios/axiosInstance";
import type { Product } from "../core/models/Product";
import { PRODUCTS } from "../global/endpoints";
import { configStore } from "../store/useConfigStore";

let productsCache: Record<string, { data: Product[]; timestamp: number }> = {};
let pendingProductsPromises: Record<string, Promise<Product[]>> = {};

export const clearProductsCache = () => {
  productsCache = {};
};

export const getProducts = async (forceRefresh = false): Promise<Product[]> => {
  const selectedTenant = configStore.getSelectedTenant();
  const currentSchema = selectedTenant?.schema_name || 'public';
  const now = Date.now();

  if (!forceRefresh && productsCache[currentSchema] && now - productsCache[currentSchema].timestamp < 3000) {
    return productsCache[currentSchema].data;
  }

  if (currentSchema in pendingProductsPromises) {
    return pendingProductsPromises[currentSchema];
  }

  const promise = (async () => {
    try {
      const response = await axiosInstance.get<Product[]>(PRODUCTS.PRODUCTS);
      const data = (Array.isArray(response.data) ? response.data : (response.data as any)?.data || []) as Product[];
      productsCache[currentSchema] = { data, timestamp: Date.now() };
      return data;
    } finally {
      delete pendingProductsPromises[currentSchema];
    }
  })();

  pendingProductsPromises[currentSchema] = promise;
  return promise;
};

export const getProduct = async (id: string): Promise<Product> => {
  const response = await axiosInstance.get<Product>(`${PRODUCTS.PRODUCTS}/${id}`);
  return response.data;
};

export const createProduct = async (productData: Partial<Product>): Promise<Product> => {
  const { id: _, createdBy: _1, files: _2, createdAt: _3, ...cleanProduct } = productData as any;
  const response = await axiosInstance.post<Product>(PRODUCTS.PRODUCTS, cleanProduct);
  return response.data;
};

export const updateProduct = async (id: string, productData: Partial<Product>): Promise<Product> => {
  const { id: _, createdBy: _1, files: _2, createdAt: _3, ...cleanProduct } = productData as any;
  const response = await axiosInstance.patch<Product>(`${PRODUCTS.PRODUCTS}/${id}`, cleanProduct);
  return response.data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  await axiosInstance.delete(`${PRODUCTS.PRODUCTS}/${id}`);
};

export const updateProductStatus = async (id: string, status: boolean): Promise<Product> => {
  const response = await axiosInstance.patch<Product>(`${PRODUCTS.PRODUCTS}/${id}/status`, { status });
  return response.data;
};

export const uploadProductCoverImage = async (id: string, file: File): Promise<Product> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosInstance.post<Product>(
    `${PRODUCTS.PRODUCTS}/${id}/cover-image`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

export const uploadProductFile = async (id: string, file: File, title?: string): Promise<Product> => {
  const formData = new FormData();
  formData.append('file', file);
  if (title) {
    formData.append('title', title);
  }
  const response = await axiosInstance.post<Product>(
    `${PRODUCTS.PRODUCTS}/${id}/files`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

export const downloadProductFile = async (productId: string, fileId: string): Promise<Blob> => {
  const response = await axiosInstance.get(
    `${PRODUCTS.PRODUCTS}/${productId}/files/${fileId}/download`,
    { responseType: 'blob' }
  );
  return response.data;
};

export const deleteProductFile = async (productId: string, fileId: string): Promise<Product> => {
  const response = await axiosInstance.delete<Product>(
    `${PRODUCTS.PRODUCTS}/${productId}/files/${fileId}`
  );
  return response.data;
};
