import React, { useMemo, useState } from 'react';
import { Filter, XCircle } from 'lucide-react';
import Select, { type SingleValue } from 'react-select';
import Button from '../shared/Button';
import UnifiedSearchBar, { type SearchBadge } from '../shared/UnifiedSearchBar';

export interface ProductFiltersState {
  nombre: string;
  status: 'all' | 'active' | 'inactive';
}

interface ProductFiltersBarProps {
  filters: ProductFiltersState;
  onFilterChange: <K extends keyof ProductFiltersState>(
    key: K,
    value: ProductFiltersState[K]
  ) => void;
  onClearFilters: () => void;
}

const statusOptions: { value: 'all' | 'active' | 'inactive'; label: string }[] = [
  { value: 'all', label: 'Todos los Estados' },
  { value: 'active', label: 'Solo Activos' },
  { value: 'inactive', label: 'Solo Inactivos' },
];

export const ProductFiltersBar: React.FC<ProductFiltersBarProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const badges = useMemo(() => {
    const list: SearchBadge[] = [];

    if (filters.status !== 'all') {
      list.push({
        id: 'status',
        label: filters.status === 'active' ? 'Solo Activos' : 'Solo Inactivos',
        icon: <Filter size={10} />,
        onRemove: () => onFilterChange('status', 'all'),
      });
    }

    return list;
  }, [filters.status, onFilterChange]);

  const hasAnyFilterActive = filters.status !== 'all';
  const placeholderText = !hasAnyFilterActive ? 'Buscar por nombre o descripción...' : '';

  return (
    <UnifiedSearchBar
      searchTerm={filters.nombre}
      onSearchChange={(val) => onFilterChange('nombre', val)}
      placeholder={placeholderText}
      badges={badges}
      showFilters={showFilters}
      setShowFilters={setShowFilters}
      dropdownWidthClass="w-[300px]"
    >
      <div className="w-full flex flex-col gap-3">
        <div>
          <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none">
            Estado
          </h4>
          <Select<{ value: 'all' | 'active' | 'inactive'; label: string }>
            inputId="product-status-filter"
            options={statusOptions}
            value={statusOptions.find((o) => o.value === filters.status) || statusOptions[0]}
            onChange={(sel: SingleValue<{ value: 'all' | 'active' | 'inactive'; label: string }>) =>
              onFilterChange('status', sel ? sel.value : 'all')
            }
            placeholder="Todos los Estados"
            isClearable={false}
            isSearchable={false}
            className="w-full text-sm"
          />
        </div>

        <div className="border-t border-gray-100 my-1 pt-2 w-full" />
        <Button
          variant="ghost-danger"
          onClick={() => {
            onClearFilters();
            setShowFilters(false);
          }}
          className="gap-1.5 w-full justify-start text-xs font-semibold"
        >
          <XCircle size={14} /> Limpiar Filtros
        </Button>
      </div>
    </UnifiedSearchBar>
  );
};

export default ProductFiltersBar;
