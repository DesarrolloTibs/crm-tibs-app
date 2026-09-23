import React, { useMemo } from 'react';
import type { Client } from '../../core/models/Client';
import { Edit, UserCheck, UserX } from 'lucide-react';
import Table, { type ColumnDef } from '../shared/Table';

interface Props {
  clients: Client[];
  onEdit: (client: Client) => void;
  onUpdateStatus: (client: Client) => void;
  isAdmin: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  maxHeight?: string;
  loading?: boolean;
}

const ClientsTable: React.FC<Props> = ({
  clients,
  onEdit,
  onUpdateStatus,
  isAdmin,
  currentPage,
  totalPages,
  onPageChange,
  maxHeight,
  loading = false,
}) => {
  const columns = useMemo<ColumnDef<Client>[]>(
    () => [
      {
        id: 'cliente',
        header: 'Cliente',
        accessorFn: (row) => `${row.nombre} ${row.apellido}`,
        cell: ({ row }) => (
          <p className="font-semibold text-gray-900">
            {row.original.nombre} {row.original.apellido}
          </p>
        ),
        meta: {
          mobileLabel: 'Cliente',
        },
      },
      {
        id: 'empresa',
        header: 'Empresa',
        accessorFn: (row) => row.company?.nombre || row.empresa || '',
        cell: ({ row }) => (
          <p className="text-gray-700">
            {row.original.company?.nombre || row.original.empresa || '-'}
          </p>
        ),
        meta: {
          mobileLabel: 'Empresa',
        },
      },
      {
        accessorKey: 'correo',
        header: 'Correo',
        cell: ({ getValue }) => (
          <p className="text-gray-700">{getValue<string>()}</p>
        ),
        meta: {
          mobileLabel: 'Correo',
          hideOnMobile: true,
        },
      },
      {
        accessorKey: 'telefono',
        header: 'Teléfono',
        cell: ({ getValue }) => (
          <p className="text-gray-700">{getValue<string>()}</p>
        ),
        meta: {
          mobileLabel: 'Teléfono',
        },
      },
      {
        accessorKey: 'category',
        header: 'Categoría',
        cell: ({ getValue }) => (
          <p className="text-gray-700">{getValue<string>() ?? 'N/A'}</p>
        ),
        meta: {
          mobileLabel: 'Categoría',
          hideOnMobile: true,
        },
      },
      {
        accessorKey: 'estatus',
        header: 'Estado',
        cell: ({ getValue }) => {
          const status = getValue<boolean>();
          return (
            <span
              className={`relative inline-block px-3 py-1 font-semibold leading-tight ${
                status ? 'text-green-900' : 'text-red-900'
              } max-w-fit`}
            >
              <span
                aria-hidden
                className={`absolute inset-0 ${
                  status ? 'bg-green-200' : 'bg-red-200'
                } opacity-50 rounded-full`}
              ></span>
              <span className="relative">{status ? 'Activo' : 'Inactivo'}</span>
            </span>
          );
        },
        meta: {
          mobileLabel: 'Estado',
          hideOnMobile: true,
        },
      },
      {
        accessorKey: 'puesto',
        header: 'Puesto',
        cell: ({ getValue }) => (
          <p className="text-gray-700">{getValue<string>()}</p>
        ),
        meta: {
          mobileLabel: 'Puesto',
          hideOnMobile: true,
        },
      },
      {
        id: 'ejecutivo',
        header: 'Ejecutivo',
        accessorFn: (row) => row.ejecutivo?.username ?? '',
        cell: ({ row }) => (
          <p className="text-gray-700">{row.original.ejecutivo?.username ?? 'N/A'}</p>
        ),
        meta: {
          mobileLabel: 'Ejecutivo',
          hideOnMobile: true,
        },
      },
      {
        id: 'acciones',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const client = row.original;
          return (
            <div className="flex space-x-1">
              <button
                onClick={() => onEdit(client)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full cursor-pointer"
                title="Editar"
              >
                <Edit size={18} />
              </button>
              {isAdmin && (
                <button
                  onClick={() => onUpdateStatus(client)}
                  className={`p-2 text-gray-500 rounded-full cursor-pointer ${
                    client.estatus
                      ? 'hover:text-yellow-600 hover:bg-yellow-100'
                      : 'hover:text-green-600 hover:bg-green-100'
                  }`}
                  title={client.estatus ? 'Desactivar' : 'Reactivar'}
                >
                  {client.estatus ? <UserX size={18} /> : <UserCheck size={18} />}
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [isAdmin, onEdit, onUpdateStatus]
  );

  const isExternalPagination =
    typeof totalPages === 'number' && typeof onPageChange === 'function';

  return (
    <Table
      data={clients}
      columns={columns}
      variant="cards"
      loading={loading}
      emptyTitle="No se encontraron clientes"
      emptyMessage="Intenta ajustar los filtros o crear un nuevo cliente."
      enablePagination={!isExternalPagination}
      initialPageSize={10}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
      maxHeight={maxHeight}
    />
  );
};

export default ClientsTable;