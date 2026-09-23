import React, { useMemo } from 'react';
import type { Company } from '../../core/models/Company';
import { Edit, UserCheck, UserX, Building } from 'lucide-react';
import Table, { type ColumnDef } from '../shared/Table';

interface Props {
  companies: Company[];
  onEdit: (company: Company) => void;
  onUpdateStatus: (company: Company) => void;
  isAdmin: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  maxHeight?: string;
  loading?: boolean;
}

const CompaniesTable: React.FC<Props> = ({
  companies,
  onEdit,
  onUpdateStatus,
  isAdmin,
  currentPage,
  totalPages,
  onPageChange,
  maxHeight,
  loading = false,
}) => {
  const columns = useMemo<ColumnDef<Company>[]>(
    () => [
      {
        id: 'nombre',
        accessorKey: 'nombre',
        header: 'Empresa',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Building size={16} className="text-gray-400 shrink-0" />
            <p className="font-semibold text-gray-900">{row.original.nombre}</p>
          </div>
        ),
        meta: {
          mobileLabel: 'Empresa',
        },
      },
      {
        accessorKey: 'correo',
        header: 'Correo',
        cell: ({ getValue }) => (
          <p className="text-gray-700">{getValue<string>() || '-'}</p>
        ),
        meta: {
          mobileLabel: 'Correo',
        },
      },
      {
        accessorKey: 'telefono',
        header: 'Teléfono',
        cell: ({ getValue }) => (
          <p className="text-gray-700">{getValue<string>() || '-'}</p>
        ),
        meta: {
          mobileLabel: 'Teléfono',
          hideOnMobile: true,
        },
      },
      {
        accessorKey: 'website',
        header: 'Sitio Web',
        cell: ({ getValue }) => {
          const val = getValue<string>();
          if (!val) return <p className="text-gray-700">-</p>;
          const href = val.startsWith('http') ? val : `https://${val}`;
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline max-w-[180px] truncate block"
            >
              {val}
            </a>
          );
        },
        meta: {
          mobileLabel: 'Sitio Web',
        },
      },
      {
        accessorKey: 'estatus',
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
              <span className="relative">{active ? 'Activo' : 'Inactivo'}</span>
            </span>
          );
        },
        meta: {
          mobileLabel: 'Estado',
          hideOnMobile: true,
        },
      },
      {
        id: 'ejecutivo',
        header: 'Ejecutivo',
        accessorFn: (row) => row.ejecutivo?.username ?? 'N/A',
        cell: ({ getValue }) => (
          <p className="text-gray-700">{getValue<string>()}</p>
        ),
        meta: {
          mobileLabel: 'Ejecutivo',
          hideOnMobile: true,
        },
      },
      {
        id: 'contactos',
        header: 'Contactos',
        accessorFn: (row) =>
          row.contacts?.map((c) => `${c.nombre} ${c.apellido}`).join(', ') || 'Sin contactos',
        cell: ({ row, getValue }) => {
          const names = getValue<string>();
          const count = row.original.contacts?.length || 0;
          return (
            <p className="text-gray-700 text-sm truncate max-w-xs" title={names}>
              {count} ({names})
            </p>
          );
        },
        meta: {
          mobileLabel: 'Contactos',
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
          const company = row.original;
          return (
            <div className="flex space-x-1 justify-end">
              <button
                onClick={() => onEdit(company)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full cursor-pointer transition-colors"
                title="Editar"
              >
                <Edit size={18} />
              </button>
              {isAdmin && (
                <button
                  onClick={() => onUpdateStatus(company)}
                  className={`p-2 text-gray-500 rounded-full cursor-pointer transition-colors ${
                    company.estatus
                      ? 'hover:text-yellow-600 hover:bg-yellow-100'
                      : 'hover:text-green-600 hover:bg-green-100'
                  }`}
                  title={company.estatus ? 'Desactivar' : 'Reactivar'}
                >
                  {company.estatus ? <UserX size={18} /> : <UserCheck size={18} />}
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
      data={companies}
      columns={columns}
      variant="cards"
      loading={loading}
      emptyTitle="No se encontraron empresas"
      emptyMessage="Intenta ajustar los filtros o crear una nueva empresa."
      enablePagination={!isExternalPagination}
      initialPageSize={10}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
      maxHeight={maxHeight}
    />
  );
};

export default CompaniesTable;
