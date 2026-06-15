import React, { useState } from 'react';
import type { Company } from '../../core/models/Company';
import { Edit, Inbox, UserCheck, UserX, ChevronDown, ChevronUp, Building } from 'lucide-react';

interface Props {
  companies: Company[];
  onEdit: (company: Company) => void;
  onUpdateStatus: (company: Company) => void;
  isAdmin: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const CompaniesTable: React.FC<Props> = ({ companies, onEdit, onUpdateStatus, isAdmin, currentPage, totalPages, onPageChange }) => {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate block md:table" style={{ borderSpacing: '0 0.75rem' }}>
        <thead className="hidden md:table-header-group">
          <tr>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Empresa</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Correo</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Teléfono</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Sitio Web</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Ejecutivo</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Contactos</th>
            <th className="p-4"></th>
          </tr>
        </thead>
        <tbody className="block md:table-row-group">
          {companies.length > 0 ? (
            companies.map(company => {
              const isExpanded = expandedRows[company.id!];
              const contactNames = company.contacts?.map(c => `${c.nombre} ${c.apellido}`).join(', ') || 'Sin contactos';
              return (
                <tr key={company.id} className="bg-white shadow-sm rounded-lg transition-all hover:shadow-md hover:-translate-y-px block md:table-row mb-4 md:mb-0">
                  <td className="p-4 block md:table-cell border-b border-gray-100 md:border-none md:rounded-l-lg">
                    <div className="flex flex-col md:block">
                      <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Empresa</span>
                      <div className="flex items-center gap-2">
                        <Building size={16} className="text-gray-400" />
                        <p className="font-semibold text-gray-900">{company.nombre}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 block md:table-cell border-b border-gray-100 md:border-none">
                    <div className="flex flex-col md:block">
                      <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Correo</span>
                      <p className="text-gray-700">{company.correo || '-'}</p>
                    </div>
                  </td>
                  <td className={`p-4 border-b border-gray-100 md:border-none ${isExpanded ? 'block md:table-cell' : 'hidden md:table-cell'}`}>
                    <div className="flex flex-col md:block">
                      <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Teléfono</span>
                      <p className="text-gray-700">{company.telefono || '-'}</p>
                    </div>
                  </td>
                  <td className="p-4 block md:table-cell border-b border-gray-100 md:border-none">
                    <div className="flex flex-col md:block">
                      <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Sitio Web</span>
                      {company.website ? (
                        <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {company.website}
                        </a>
                      ) : (
                        <p className="text-gray-700">-</p>
                      )}
                    </div>
                  </td>
                  <td className={`p-4 border-b border-gray-100 md:border-none ${isExpanded ? 'block md:table-cell' : 'hidden md:table-cell'}`}>
                    <div className="flex flex-col md:block">
                      <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Estado</span>
                      <span className={`relative inline-block px-3 py-1 font-semibold leading-tight ${company.estatus ? 'text-green-900' : 'text-red-900'} max-w-fit`}>
                        <span aria-hidden className={`absolute inset-0 ${company.estatus ? 'bg-green-200' : 'bg-red-200'} opacity-50 rounded-full`}></span>
                        <span className="relative">{company.estatus ? 'Activo' : 'Inactivo'}</span>
                      </span>
                    </div>
                  </td>
                  <td className={`p-4 border-b border-gray-100 md:border-none ${isExpanded ? 'block md:table-cell' : 'hidden md:table-cell'}`}>
                    <div className="flex flex-col md:block">
                      <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Ejecutivo</span>
                      <p className="text-gray-700">{company.ejecutivo?.username ?? 'N/A'}</p>
                    </div>
                  </td>
                  <td className={`p-4 border-b border-gray-100 md:border-none ${isExpanded ? 'block md:table-cell' : 'hidden md:table-cell'}`}>
                    <div className="flex flex-col md:block">
                      <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Contactos</span>
                      <p className="text-gray-700 text-sm truncate max-w-xs" title={contactNames}>
                        {company.contacts?.length || 0} ({contactNames})
                      </p>
                    </div>
                  </td>
                  <td className="p-4 block md:table-cell md:rounded-r-lg">
                    <div className="flex justify-between md:justify-end items-center mt-2 md:mt-0">
                      <button 
                        onClick={() => toggleRow(company.id!)} 
                        className="md:hidden text-blue-600 font-medium text-sm flex items-center hover:bg-blue-50 px-2 py-1 rounded"
                      >
                        {isExpanded ? <ChevronUp size={16} className="mr-1"/> : <ChevronDown size={16} className="mr-1"/>}
                        {isExpanded ? 'Menos' : 'Más'} detalles
                      </button>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => onEdit(company)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => onUpdateStatus(company)}
                            className={`p-2 text-gray-500 rounded-full ${company.estatus ? 'hover:text-yellow-600 hover:bg-yellow-100' : 'hover:text-green-600 hover:bg-green-100'}`}
                            title={company.estatus ? 'Desactivar' : 'Reactivar'}
                          >
                            {company.estatus ? <UserX size={18} /> : <UserCheck size={18} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr className="block md:table-row w-full">
              <td colSpan={8} className="text-center py-16 block md:table-cell w-full">
                <div className="flex flex-col items-center justify-center text-center text-gray-500 w-full mx-auto">
                  <Inbox size={48} className="mb-4 mx-auto" />
                  <h3 className="text-xl font-semibold text-center w-full">No se encontraron empresas</h3>
                  <p className="text-sm text-center w-full mt-1">Intenta ajustar los filtros o crear una nueva empresa.</p>
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

export default CompaniesTable;
