import React from 'react';
import type { Product } from '../../core/models/Product';
import { Edit, Trash2, UserCheck, UserX, Package, Inbox } from 'lucide-react';

interface Props {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onUpdateStatus: (product: Product) => void;
  isAdmin: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const ProductsTable: React.FC<Props> = ({
  products,
  onEdit,
  onDelete,
  onUpdateStatus,
  isAdmin,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const baseUrl = import.meta.env.VITE_BASE_URL || '';

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(price);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate block md:table" style={{ borderSpacing: '0 0.75rem' }}>
        <thead className="hidden md:table-header-group">
          <tr>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider w-16">Portada</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Descripción</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Precio Base</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Creado Por</th>
            <th className="p-4 text-right text-sm font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="block md:table-row-group">
          {products.length > 0 ? (
            products.map((product) => {
              const coverUrl = product.imagenPortada ? `${baseUrl}${product.imagenPortada}` : null;
              return (
                <tr
                  key={product.id}
                  className="bg-white shadow-sm rounded-lg transition-all hover:shadow-md hover:-translate-y-px block md:table-row mb-4 md:mb-0"
                >
                  {/* Thumbnail Image */}
                  <td className="p-4 block md:table-cell border-b border-gray-100 md:border-none md:rounded-l-lg">
                    <div className="flex flex-col md:block">
                      <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">
                        Portada
                      </span>
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt={product.nombre}
                          className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center border border-slate-200">
                          <Package size={20} />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Name */}
                  <td className="p-4 block md:table-cell border-b border-gray-100 md:border-none">
                    <div className="flex flex-col md:block">
                      <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">
                        Nombre
                      </span>
                      <p className="font-semibold text-gray-900">{product.nombre}</p>
                    </div>
                  </td>

                  {/* Description */}
                  <td className="p-4 block md:table-cell border-b border-gray-100 md:border-none">
                    <div className="flex flex-col md:block">
                      <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">
                        Descripción
                      </span>
                      <p className="text-gray-600 text-sm truncate max-w-xs" title={product.descripcion || ''}>
                        {product.descripcion || <span className="italic text-gray-400">Sin descripción</span>}
                      </p>
                    </div>
                  </td>

                  {/* Base Price */}
                  <td className="p-4 block md:table-cell border-b border-gray-100 md:border-none">
                    <div className="flex flex-col md:block">
                      <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">
                        Precio Base
                      </span>
                      <p className="font-medium text-gray-900">
                        {product.requiere_analisis || product.precioBase === null || product.precioBase === undefined ? (
                          <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-semibold border border-indigo-100">
                            A la medida
                          </span>
                        ) : (
                          formatPrice(Number(product.precioBase))
                        )}
                      </p>
                    </div>
                  </td>



                  {/* Status */}
                  <td className="p-4 block md:table-cell border-b border-gray-100 md:border-none">
                    <div className="flex flex-col md:block">
                      <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">
                        Estado
                      </span>
                      <span
                        className={`relative inline-block px-3 py-1 font-semibold leading-tight ${
                          product.status ? 'text-green-900' : 'text-red-900'
                        } max-w-fit`}
                      >
                        <span
                          aria-hidden
                          className={`absolute inset-0 ${product.status ? 'bg-green-200' : 'bg-red-200'} opacity-50 rounded-full`}
                        ></span>
                        <span className="relative text-xs">{product.status ? 'Activo' : 'Inactivo'}</span>
                      </span>
                    </div>
                  </td>

                  {/* Created By */}
                  <td className="p-4 block md:table-cell border-b border-gray-100 md:border-none">
                    <div className="flex flex-col md:block">
                      <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">
                        Creado Por
                      </span>
                      <p className="text-gray-700 text-sm">{product.createdBy?.username || 'Sistema'}</p>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="p-4 block md:table-cell md:rounded-r-lg">
                    <div className="flex justify-end items-center gap-1.5 mt-2 md:mt-0">
                      <button
                        onClick={() => onEdit(product)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Editar producto"
                      >
                        <Edit size={18} />
                      </button>

                      <button
                        onClick={() => onUpdateStatus(product)}
                        className={`p-2 text-gray-500 rounded-full transition-colors ${
                          product.status ? 'hover:text-yellow-600 hover:bg-yellow-50' : 'hover:text-green-600 hover:bg-green-50'
                        }`}
                        title={product.status ? 'Desactivar producto' : 'Activar producto'}
                      >
                        {product.status ? <UserX size={18} /> : <UserCheck size={18} />}
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => onDelete(product)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Eliminar producto físicamente"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr className="block md:table-row w-full">
              <td colSpan={7} className="text-center py-16 block md:table-cell w-full">
                <div className="flex flex-col items-center justify-center text-center text-gray-500 w-full mx-auto">
                  <Inbox size={48} className="mb-4 mx-auto" />
                  <h3 className="text-xl font-semibold text-center w-full">No se encontraron productos</h3>
                  <p className="text-sm text-center w-full mt-1">Intenta ajustar los filtros o crear un nuevo producto.</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 p-4">
          <div className="flex space-x-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === i + 1
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
                onClick={() => onPageChange(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsTable;
