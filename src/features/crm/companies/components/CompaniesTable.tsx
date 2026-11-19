import React, { useMemo } from 'react';
import { Building2, Search, Plus } from 'lucide-react';
import Table from '@shared/components/Table';
import Button from '@shared/components/Button';
import Input from '@shared/components/Input';
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
  loading,
  isAdmin,
  filters,
  onFilterChange,
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
          <Input
            size="sm"
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            onClear={() => onFilterChange('search', '')}
            clearTitle="Limpiar búsqueda"
            placeholder="Buscar por razón social, correo, teléfono..."
            inputPrefix={<Search size={14} />}
            containerClassName="w-full sm:w-60"
            className="focus:border-violet-500"
          />

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
        variant="cards"
        loading={loading}
        enablePagination
        initialPageSize={10}
        emptyTitle={hasActiveFilters ? 'Sin resultados para la búsqueda' : 'No hay empresas registradas'}
        emptyMessage={
          hasActiveFilters
            ? 'No encontramos empresas con los filtros especificados. Prueba restableciendo los filtros.'
            : 'Comienza dando de alta la primera cuenta corporativa para asociar prospectos y contratos.'
        }
      />
    </div>
  );
};
