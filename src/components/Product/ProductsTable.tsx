import React, { useMemo } from 'react';
import type { Product } from '../../core/models/Product';
import { Edit, Trash2, UserCheck, UserX, Package } from 'lucide-react';
import Table, { type ColumnDef } from '../shared/Table';

interface Props {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onUpdateStatus: (product: Product) => void;
  isAdmin: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  maxHeight?: string;
  loading?: boolean;
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
  maxHeight,
  loading = false,
}) => {
  const baseUrl = import.meta.env.VITE_BASE_URL || '';

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        id: 'portada',
        header: 'Portada',
        enableSorting: false,
        cell: ({ row }) => {
          const product = row.original;
          const coverUrl = product.imagenPortada
            ? `${baseUrl}${product.imagenPortada}`
            : null;
          return coverUrl ? (
            <img
              src={coverUrl}
              alt={product.nombre}
              className="w-10 h-10 object-cover rounded-lg border border-gray-200 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center border border-slate-200 shrink-0">
              <Package size={20} />
            </div>
          );
        },
        meta: {
          mobileLabel: 'Portada',
        },
      },
      {
        accessorKey: 'nombre',
        header: 'Nombre',
        cell: ({ getValue }) => (
          <p className="font-semibold text-gray-900">{getValue<string>()}</p>
        ),
        meta: {
          mobileLabel: 'Nombre',
        },
      },
      {
        accessorKey: 'descripcion',
        header: 'Descripción',
        cell: ({ getValue }) => {
          const val = getValue<string>();
          return (
            <p className="text-gray-600 text-sm truncate max-w-xs" title={val || ''}>
              {val || <span className="italic text-gray-400">Sin descripción</span>}
            </p>
          );
        },
        meta: {
          mobileLabel: 'Descripción',
          hideOnMobile: true,
        },
      },
      {
        id: 'precio',
        header: 'Precio Base / Unidad',
        accessorFn: (row) => row.precioBase,
        cell: ({ row }) => {
          const price = Number(row.original.precioBase || 0);
          const formatted = new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
          }).format(price);
          return (
            <p className="font-medium text-gray-900">
              {formatted}
              <span className="text-xs text-slate-500 ml-1 font-normal">
                / {row.original.unidadMedida || 'Pieza'}
              </span>
            </p>
          );
        },
        meta: {
          mobileLabel: 'Precio',
        },
      },
      {
        accessorKey: 'observaciones',
        header: 'Observaciones',
        cell: ({ getValue }) => {
          const val = getValue<string>();
          return (
            <p className="text-gray-600 text-sm truncate max-w-xs" title={val || ''}>
              {val || <span className="italic text-gray-400">Sin notas</span>}
            </p>
          );
        },
        meta: {
          mobileLabel: 'Observaciones',
          hideOnMobile: true,
        },
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ getValue }) => {
          const active = !!getValue<boolean>();
          return (
            <span
              className={`relative inline-block px-3 py-1 font-semibold leading-tight ${
                active ? 'text-green-900' : 'text-red-900'
              } max-w-fit`}
            >
              <span
                aria-hidden
                className={`absolute inset-0 ${
                  active ? 'bg-green-200' : 'bg-red-200'
                } opacity-50 rounded-full`}
              ></span>
              <span className="relative text-xs">{active ? 'Activo' : 'Inactivo'}</span>
            </span>
          );
        },
        meta: {
          mobileLabel: 'Estado',
          hideOnMobile: true,
        },
      },
      {
        id: 'creadoPor',
        header: 'Creado Por',
        accessorFn: (row) => row.createdBy?.username || 'Sistema',
        cell: ({ getValue }) => (
          <p className="text-gray-700 text-sm">{getValue<string>()}</p>
        ),
        meta: {
          mobileLabel: 'Creado Por',
          hideOnMobile: true,
        },
      },
      {
        id: 'acciones',
        header: '',
        enableSorting: false,
        meta: {
          align: 'right',
        },
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="flex justify-end items-center gap-1.5">
              <button
                onClick={() => onEdit(product)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
                title="Editar producto"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => onUpdateStatus(product)}
                className={`p-2 text-gray-500 rounded-full transition-colors cursor-pointer ${
                  product.status
                    ? 'hover:text-yellow-600 hover:bg-yellow-50'
                    : 'hover:text-green-600 hover:bg-green-50'
                }`}
                title={product.status ? 'Desactivar producto' : 'Activar producto'}
              >
                {product.status ? <UserX size={18} /> : <UserCheck size={18} />}
              </button>
              {isAdmin && (
                <button
                  onClick={() => onDelete(product)}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                  title="Eliminar producto físicamente"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [baseUrl, isAdmin, onEdit, onDelete, onUpdateStatus]
  );

  const isExternalPagination =
    typeof totalPages === 'number' && typeof onPageChange === 'function';

  return (
    <Table
      data={products}
      columns={columns}
      variant="cards"
      loading={loading}
      emptyTitle="No se encontraron productos"
      emptyMessage="Intenta ajustar los filtros o crear un nuevo producto."
      enablePagination={!isExternalPagination}
      initialPageSize={10}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
      maxHeight={maxHeight}
    />
  );
};

export default ProductsTable;
