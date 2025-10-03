import React from 'react';
import type { Client } from '../../core/models/Client';
import { Edit, Inbox, UserCheck, UserX } from 'lucide-react';

interface Props {
  clients: Client[];
  onEdit: (client: Client) => void;
  onUpdateStatus: (client: Client) => void;
  isAdmin: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const ClientsTable: React.FC<Props> = ({ clients, onEdit, onUpdateStatus, isAdmin, currentPage, totalPages, onPageChange }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate" style={{ borderSpacing: '0 0.75rem' }}>
        <thead>
          <tr>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Empresa</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Correo</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Teléfono</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Puesto</th>
            <th className="p-4"></th>
          </tr>
        </thead>
        <tbody>
          {clients.length > 0 ? (
            clients.map(client => (
              <tr key={client.id} className="bg-white shadow-sm rounded-lg transition-all hover:shadow-md hover:-translate-y-px">
                <td className="p-4 rounded-l-lg">
                  <div className="flex items-center">
                  
                    <div>
                      <p className="font-semibold text-gray-900">{client.nombre} {client.apellido}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4"><p className="text-gray-700">{client.empresa}</p></td>
                <td className="p-4"><p className="text-gray-700">{client.correo}</p></td>
                <td className="p-4"><p className="text-gray-700">{client.telefono}</p></td>
                <td className="p-4">
                  <span className={`relative inline-block px-3 py-1 font-semibold leading-tight ${client.estatus ? 'text-green-900' : 'text-red-900'}`}>
                    <span aria-hidden className={`absolute inset-0 ${client.estatus ? 'bg-green-200' : 'bg-red-200'} opacity-50 rounded-full`}></span>
                    <span className="relative">{client.estatus ? 'Activo' : 'Inactivo'}</span>
                  </span>
                </td>
                <td className="p-4"><p className="text-gray-700">{client.puesto}</p></td>
                <td className="p-4 rounded-r-lg">
                  <div className="flex space-x-1 justify-end">
                    <button
                      onClick={() => onEdit(client)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full"
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => onUpdateStatus(client)}
                        className={`p-2 text-gray-500 rounded-full ${client.estatus ? 'hover:text-yellow-600 hover:bg-yellow-100' : 'hover:text-green-600 hover:bg-green-100'}`}
                        title={client.estatus ? 'Desactivar' : 'Reactivar'}
                      >
                        {client.estatus ? <UserX size={18} /> : <UserCheck size={18} />}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="text-center py-16">
                <div className="flex flex-col items-center text-gray-500">
                  <Inbox size={48} className="mb-4" />
                  <h3 className="text-xl font-semibold">No se encontraron clientes</h3>
                  <p className="text-sm">Intenta ajustar los filtros o crear un nuevo cliente.</p>
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

export default ClientsTable;