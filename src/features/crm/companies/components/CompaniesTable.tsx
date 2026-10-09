import React, { useMemo } from 'react';
import { Building2, Search, X, Plus } from 'lucide-react';
import Table from '../../../../components/shared/Table';
import Button from '../../../../components/shared/Button';
import type { Company, CompanyFiltersState } from '../schemas/companies.schema';
import { getCompaniesColumns } from '../utils/companies.columns';

interface CompaniesTableProps {
  companies: Company[];
  totalCount: number;
  loading: boolean;
  isAdmin: boolean;
  filters: CompanyFiltersState;
  onFilterChange: <K extends keyof CompanyFiltersState>(key: K, value: CompanyFiltersState[K]) => void;
  onClearFilters: () => void;
  onEdit: (company: Company) => void;
  onToggleStatus: (company: Company) => void;
  onCreateNew: () => void;
}

export const CompaniesTable: React.FC<CompaniesTableProps> = ({
  companies,
  totalCount,
  loading,
  isAdmin,
  filters,
  onFilterChange,
  onClearFilters,
  onEdit,
  onToggleStatus,
  onCreateNew,
}) => {
  const columns = useMemo(
    () =>
      getCompaniesColumns({
        onEdit,
        onToggleStatus,
        isAdmin,
      }),
    [onEdit, onToggleStatus, isAdmin]
  );

  const hasActiveFilters =
    Boolean(filters.search.trim()) ||
    filters.status !== 'all' ||
    filters.ejecutivoId !== 'all';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
      {/* Encabezado y Controles */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="text-violet-600" size={18} />
            Directorio de Cuentas B2B
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Empresas, personas morales y cuentas corporativas matrices registradas en el sistema.
          </p>
        </div>

        {/* Controles de Búsqueda, Filtros y Nueva Empresa */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Campo de Búsqueda */}
          <div className="relative w-full sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              placeholder="Buscar por razón social, correo, teléfono..."
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 focus:bg-white transition-colors"
            />
            {filters.search && (
              <Button
                variant="icon"
                onClick={() => onFilterChange('search', '')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 !p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200"
                title="Limpiar búsqueda"
              >
                <X size={12} />
              </Button>
            )}
          </div>

          {/* Filtro de Estado */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onFilterChange('status', 'all')}
              className={`!px-2.5 !py-1 !text-xs font-bold transition-all ${
                filters.status === 'all'
                  ? '!bg-white !text-violet-700 shadow-xs'
                  : '!text-slate-500 hover:!text-slate-700'
              }`}
            >
              Todas
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onFilterChange('status', 'active')}
              className={`!px-2.5 !py-1 !text-xs font-bold transition-all ${
                filters.status === 'active'
                  ? '!bg-white !text-emerald-700 shadow-xs'
                  : '!text-slate-500 hover:!text-slate-700'
              }`}
            >
              Activas
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onFilterChange('status', 'inactive')}
              className={`!px-2.5 !py-1 !text-xs font-bold transition-all ${
                filters.status === 'inactive'
                  ? '!bg-white !text-slate-800 shadow-xs'
                  : '!text-slate-500 hover:!text-slate-700'
              }`}
            >
              Inactivas
            </Button>
          </div>

          {/* Botón Nueva Empresa */}
          <Button
            variant="success"
            onClick={onCreateNew}
            className="gap-2 text-xs !py-1.5"
          >
            <Plus size={15} />
            Nueva Empresa
          </Button>
        </div>
      </div>

      {/* Tabla TanStack */}
      <Table
        data={companies}
        columns={columns}
        loading={loading}
        emptyTitle={hasActiveFilters ? 'Sin resultados para la búsqueda' : 'No hay empresas registradas'}
        emptyMessage={
          hasActiveFilters
            ? 'No encontramos empresas con los filtros especificados. Prueba restableciendo los filtros.'
            : 'Comienza dando de alta la primera cuenta corporativa para asociar prospectos y contratos.'
        }
        footerRow={
          <tr>
            <td colSpan={columns.length} className="px-4 py-3 bg-slate-50/80 border-t border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium w-full">
                <span>
                  Mostrando <strong className="text-slate-800">{companies.length}</strong> de{' '}
                  <strong className="text-slate-800">{totalCount}</strong> empresas registradas
                </span>
                {hasActiveFilters && (
                  <button
                    onClick={onClearFilters}
                    className="text-violet-600 hover:text-violet-800 font-bold hover:underline cursor-pointer"
                  >
                    Restablecer vista
                  </button>
                )}
              </div>
            </td>
          </tr>
        }
      />
    </div>
  );
};
