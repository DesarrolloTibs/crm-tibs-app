import React, { useState } from 'react';
import type { Client } from '../../core/models/Client';
import { Edit, Inbox, UserCheck, UserX, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate block md:table" style={{ borderSpacing: '0 0.75rem' }}>
        <thead className="hidden md:table-header-group">
          <tr>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Empresa</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Correo</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Teléfono</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Categoría</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Puesto</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Ejecutivo</th>
            <th className="p-4"></th>
          </tr>
        </thead>
        <tbody className="block md:table-row-group">
          {clients.length > 0 ? (
            clients.map(client => {
              const isExpanded = expandedRows[client.id!];
              return (
                <tr key={client.id} className="bg-white shadow-sm rounded-lg transition-all hover:shadow-md hover:-translate-y-px block md:table-row mb-4 md:mb-0">
                  <td className="p-4 block md:table-cell border-b border-gray-100 md:border-none md:rounded-l-lg">
                    <div className="flex flex-col md:block">
                      <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Cliente</span>
                      <p className="font-semibold text-gray-900">{client.nombre} {client.apellido}</p>
                    </div>
                  </td>
                  <td className="p-4 block md:table-cell border-b border-gray-100 md:border-none">
                    <div className="flex flex-col md:block">
                      <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Empresa</span>
                      <p className="text-gray-700">{client.empresa}</p>
                    </div>
                  </td>
                  <td className={`p-4 border-b border-gray-100 md:border-none ${isExpanded ? 'block md:table-cell' : 'hidden md:table-cell'}`}>
                    <div className="flex flex-col md:block">
                      <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Correo</span>
                      <p className="text-gray-700">{client.correo}</p>
                    </div>
                  </td>
                  <td className="p-4 block md:table-cell border-b border-gray-100 md:border-none">
                    <div className="flex flex-col md:block">
                      <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Teléfono</span>
                      <p className="text-gray-700">{client.telefono}</p>
                    </div>
                  </td>
                  <td className={`p-4 border-b border-gray-100 md:border-none ${isExpanded ? 'block md:table-cell' : 'hidden md:table-cell'}`}>
                    <div className="flex flex-col md:block">
                      <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Categoría</span>
                      <p className="text-gray-700">{client.category ?? 'N/A'}</p>
                    </div>
                  </td>
                  <td className={`p-4 border-b border-gray-100 md:border-none ${isExpanded ? 'block md:table-cell' : 'hidden md:table-cell'}`}>
                    <div className="flex flex-col md:block">
                      <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Estado</span>
                      <span className={`relative inline-block px-3 py-1 font-semibold leading-tight ${client.estatus ? 'text-green-900' : 'text-red-900'} max-w-fit`}>
                        <span aria-hidden className={`absolute inset-0 ${client.estatus ? 'bg-green-200' : 'bg-red-200'} opacity-50 rounded-full`}></span>
                        <span className="relative">{client.estatus ? 'Activo' : 'Inactivo'}</span>
                      </span>
                    </div>
                  </td>
                  <td className={`p-4 border-b border-gray-100 md:border-none ${isExpanded ? 'block md:table-cell' : 'hidden md:table-cell'}`}>
                    <div className="flex flex-col md:block">
                      <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Puesto</span>
                      <p className="text-gray-700">{client.puesto}</p>
                    </div>
                  </td>
                  <td className={`p-4 border-b border-gray-100 md:border-none ${isExpanded ? 'block md:table-cell' : 'hidden md:table-cell'}`}>
                    <div className="flex flex-col md:block">
                      <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Ejecutivo</span>
                      <p className="text-gray-700">{client.ejecutivo?.username ?? 'N/A'}</p>
                    </div>
                  </td>
                  <td className="p-4 block md:table-cell md:rounded-r-lg">
                    <div className="flex justify-between md:justify-end items-center mt-2 md:mt-0">
                      <button 
                        onClick={() => toggleRow(client.id!)} 
                        className="md:hidden text-blue-600 font-medium text-sm flex items-center hover:bg-blue-50 px-2 py-1 rounded"
                      >
                        {isExpanded ? <ChevronUp size={16} className="mr-1"/> : <ChevronDown size={16} className="mr-1"/>}
                        {isExpanded ? 'Menos' : 'Más'} detalles
                      </button>
                      <div className="flex space-x-1">
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
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={9} className="text-center py-16 block md:table-cell w-full">
                <div className="flex flex-col items-center justify-center text-center text-gray-500 w-full">
                  <Inbox size={48} className="mb-4 mx-auto" />
                  <h3 className="text-xl font-semibold text-center w-full">No se encontraron clientes</h3>
                  <p className="text-sm text-center w-full mt-1">Intenta ajustar los filtros o crear un nuevo cliente.</p>
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