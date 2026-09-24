import React, { useMemo, useState } from 'react';
import { Filter, XCircle } from 'lucide-react';
import Select from 'react-select';
import Input from '../shared/Input';
import Button from '../shared/Button';
import UnifiedSearchBar, { type SearchBadge } from '../shared/UnifiedSearchBar';

export interface CompanyFiltersState {
  nombre: string;
  correo: string;
  ejecutivoId: string | null;
}

interface CompanyFiltersBarProps {
  filters: CompanyFiltersState;
  onFilterChange: <K extends keyof CompanyFiltersState>(
    key: K,
    value: CompanyFiltersState[K]
  ) => void;
  onClearFilters: () => void;
  executives: { value: string; label: string }[];
}

export const CompanyFiltersBar: React.FC<CompanyFiltersBarProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  executives,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const badges = useMemo(() => {
    const list: SearchBadge[] = [];

    if (filters.correo) {
      list.push({
        id: 'correo',
        label: `Correo: ${filters.correo}`,
        icon: <Filter size={10} />,
        onRemove: () => onFilterChange('correo', ''),
      });
    }

    if (filters.ejecutivoId) {
      const exec = executives.find((e) => e.value === filters.ejecutivoId);
      list.push({
        id: 'ejecutivo',
        label: exec?.label || 'Ejecutivo',
        icon: <Filter size={10} />,
        onRemove: () => onFilterChange('ejecutivoId', null),
      });
    }

    return list;
  }, [filters, executives, onFilterChange]);

  const hasAnyFilterActive = !!filters.correo || !!filters.ejecutivoId;
  const placeholderText = !hasAnyFilterActive ? 'Buscar por nombre...' : '';

  return (
    <UnifiedSearchBar
      searchTerm={filters.nombre}
      onSearchChange={(val) => onFilterChange('nombre', val)}
      placeholder={placeholderText}
      badges={badges}
      showFilters={showFilters}
      setShowFilters={setShowFilters}
      dropdownWidthClass="w-[320px]"
    >
      <div className="w-full flex flex-col gap-3">
        <div>
          <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none">
            Correo
          </h4>
          <Input
            type="text"
            placeholder="Filtrar por correo"
            value={filters.correo}
            onChange={(e) => onFilterChange('correo', e.target.value)}
          />
        </div>

        <div>
          <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none">
            Ejecutivo
          </h4>
          <Select<{ value: string; label: string }>
            inputId="ejecutivo-filter"
            options={executives}
            value={executives.find((o) => o.value === filters.ejecutivoId) || null}
            onChange={(o) => onFilterChange('ejecutivoId', o ? o.value : null)}
            placeholder="Filtrar por ejecutivo"
            isClearable
            isSearchable
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
          className="gap-1.5 w-full justify-start text-xs"
        >
          <XCircle size={14} /> Limpiar Filtros
        </Button>
      </div>
    </UnifiedSearchBar>
  );
};

export default CompanyFiltersBar;
