import React from 'react';
import type { User } from '../../core/models/User';
import { Edit, Trash2, Inbox } from 'lucide-react';

interface Props {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  isAdmin: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const UsersTable: React.FC<Props> = ({ users, onEdit, onDelete, isAdmin, currentPage, totalPages, onPageChange }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate" style={{ borderSpacing: '0 0.75rem' }}>
        <thead>
          <tr>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Email</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
            <th className="p-4"></th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map(user => (
              <tr key={user.id} className="bg-white shadow-sm rounded-lg transition-all hover:shadow-md hover:-translate-y-px">
                <td className="p-4 rounded-l-lg">
                  <p className="font-semibold text-gray-900">{user.username}</p>
                </td>
                <td className="p-4"><p className="text-gray-700">{user.email}</p></td>
                <td className="p-4"><p className="text-gray-700 capitalize">{user.role}</p></td>
                <td className="p-4">
                  <span className={`relative inline-block px-3 py-1 font-semibold leading-tight ${user.isActive ? 'text-green-900' : 'text-red-900'}`}>
                    <span aria-hidden className={`absolute inset-0 ${user.isActive ? 'bg-green-200' : 'bg-red-200'} opacity-50 rounded-full`}></span>
                    <span className="relative">{user.isActive ? 'Activo' : 'Inactivo'}</span>
                  </span>
                </td>
                <td className="p-4 rounded-r-lg text-right">
                  {isAdmin && (
                    <div className="flex space-x-1 justify-end">
                      <button
                        onClick={() => onEdit(user)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => onDelete(user)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="text-center py-16">
                <div className="flex flex-col items-center text-gray-500">
                  <Inbox size={48} className="mb-4" />
                  <h3 className="text-xl font-semibold">No se encontraron usuarios</h3>
                  <p className="text-sm">Intenta ajustar los filtros o crear un nuevo usuario.</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 p-4">
          <div className="flex space-x-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}
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

export default UsersTable;