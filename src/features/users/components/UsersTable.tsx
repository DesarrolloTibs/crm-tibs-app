import React, { useMemo } from 'react';
import type { User } from '../../core/models/User';
import { Edit, UserCheck, UserX, Camera } from 'lucide-react';
import Table, { type ColumnDef } from '../shared/Table';

interface Props {
  users: User[];
  onEdit: (user: User) => void;
  onUpdateStatus: (user: User) => void;
  onUploadImage: (user: User) => void;
  isAdmin: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  maxHeight?: string;
  loading?: boolean;
}

const UsersTable: React.FC<Props> = ({
  users,
  onEdit,
  onUpdateStatus,
  onUploadImage,
  isAdmin,
  currentPage,
  totalPages,
  onPageChange,
  maxHeight,
  loading = false,
}) => {
  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        id: 'username',
        accessorKey: 'username',
        header: 'Usuario',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center space-x-3">
              {user.profileImageUrl ? (
                <img
                  src={`${import.meta.env.VITE_BASE_URL}${user.profileImageUrl}`}
                  alt={user.username}
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-bold shrink-0">
                  {user.username.substring(0, 2).toUpperCase()}
                </div>
              )}
              <p className="font-semibold text-gray-900">{user.username}</p>
            </div>
          );
        },
        meta: {
          mobileLabel: 'Usuario',
        },
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ getValue }) => (
          <p className="text-gray-700">{getValue<string>() || '-'}</p>
        ),
        meta: {
          mobileLabel: 'Email',
          hideOnMobile: true,
        },
      },
      {
        accessorKey: 'role',
        header: 'Rol',
        cell: ({ getValue }) => {
          const role = getValue<string>();
          const label =
            role === 'admin'
              ? 'Administrador'
              : role === 'executive'
              ? 'Ejecutivo'
              : role === 'superadmin'
              ? 'SuperAdministrador'
              : role;
          return <p className="text-gray-700 capitalize">{label}</p>;
        },
        meta: {
          mobileLabel: 'Rol',
        },
      },
      {
        accessorKey: 'isActive',
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
        id: 'acciones',
        header: '',
        enableSorting: false,
        meta: {
          align: 'right',
        },
        cell: ({ row }) => {
          const user = row.original;
          if (!isAdmin) return null;
          return (
            <div className="flex space-x-1 justify-end">
              <button
                onClick={() => onEdit(user)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full cursor-pointer transition-colors"
                title="Editar"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => onUploadImage(user)}
                className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-100 rounded-full cursor-pointer transition-colors"
                title="Subir imagen de perfil"
              >
                <Camera size={18} />
              </button>
              <button
                onClick={() => onUpdateStatus(user)}
                className={`p-2 text-gray-500 rounded-full cursor-pointer transition-colors ${
                  user.isActive
                    ? 'hover:text-yellow-600 hover:bg-yellow-100'
                    : 'hover:text-green-600 hover:bg-green-100'
                }`}
                title={user.isActive ? 'Desactivar' : 'Reactivar'}
              >
                {user.isActive ? <UserX size={18} /> : <UserCheck size={18} />}
              </button>
            </div>
          );
        },
      },
    ],
    [isAdmin, onEdit, onUpdateStatus, onUploadImage]
  );

  const isExternalPagination =
    typeof totalPages === 'number' && typeof onPageChange === 'function';

  return (
    <Table
      data={users}
      columns={columns}
      variant="cards"
      loading={loading}
      emptyTitle="No se encontraron usuarios"
      emptyMessage="Intenta ajustar los filtros o crear un nuevo usuario."
      enablePagination={!isExternalPagination}
      initialPageSize={10}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
      maxHeight={maxHeight}
    />
  );
};

export default UsersTable;