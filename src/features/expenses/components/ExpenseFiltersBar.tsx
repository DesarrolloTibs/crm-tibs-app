import React, { useMemo, useState } from 'react';
import { Filter, XCircle, Calendar } from 'lucide-react';
import Select, { type SingleValue } from 'react-select';
import Input from '../shared/Input';
import Button from '../shared/Button';
import UnifiedSearchBar, { type SearchBadge } from '../shared/UnifiedSearchBar';

export interface ExpenseFiltersState {
  concept: string;
  user: string | null;
  date: string;
}

interface ExpenseFiltersBarProps {
  filters: ExpenseFiltersState;
  onFilterChange: <K extends keyof ExpenseFiltersState>(
    key: K,
    value: ExpenseFiltersState[K]
  ) => void;
  onClearFilters: () => void;
  userOptions: { value: string; label: string }[];
}

export const ExpenseFiltersBar: React.FC<ExpenseFiltersBarProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  userOptions,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const badges = useMemo(() => {
    const list: SearchBadge[] = [];

    if (filters.user) {
      const userObj = userOptions.find((u) => u.value === filters.user);
      list.push({
        id: 'user',
        label: `Usuario: ${userObj?.label || 'Usuario'}`,
        icon: <Filter size={10} />,
        onRemove: () => onFilterChange('user', null),
      });
    }

    if (filters.date) {
      list.push({
        id: 'date',
        label: `Fecha: ${filters.date}`,
        icon: <Calendar size={10} />,
        onRemove: () => onFilterChange('date', ''),
      });
    }

    return list;
  }, [filters, userOptions, onFilterChange]);

  const hasAnyFilterActive = !!filters.user || !!filters.date;
  const placeholderText = !hasAnyFilterActive ? 'Buscar por concepto...' : '';

  return (
    <UnifiedSearchBar
      searchTerm={filters.concept}
      onSearchChange={(val) => onFilterChange('concept', val)}
      placeholder={placeholderText}
      badges={badges}
      showFilters={showFilters}
      setShowFilters={setShowFilters}
      dropdownWidthClass="w-[300px]"
    >
      <div className="w-full flex flex-col gap-3">
        <div>
          <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none">
            Usuario
          </h4>
          <Select<{ value: string; label: string }>
            inputId="expense-user-filter"
            options={userOptions}
            value={userOptions.find((o) => o.value === filters.user) || null}
            onChange={(sel: SingleValue<{ value: string; label: string }>) =>
              onFilterChange('user', sel ? sel.value : null)
            }
            placeholder="Filtrar por usuario"
            isClearable
            isSearchable
            noOptionsMessage={() => 'No se encontraron usuarios'}
            className="w-full text-sm"
          />
        </div>

        <div>
          <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none">
            Fecha
          </h4>
          <Input
            type="date"
            value={filters.date}
            onChange={(e) => onFilterChange('date', e.target.value)}
            className="text-xs bg-white cursor-pointer py-2 rounded-xl"
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

export default ExpenseFiltersBar;
