import React, { useMemo, useState } from 'react';
import { Filter, XCircle, Mail } from 'lucide-react';
import Select from 'react-select';
import Input from '../shared/Input';
import Button from '../shared/Button';
import UnifiedSearchBar, { type SearchBadge } from '../shared/UnifiedSearchBar';

export interface UserFiltersState {
  username: string;
  email: string;
  role: string | null;
}

interface UserFiltersBarProps {
  filters: UserFiltersState;
  onFilterChange: <K extends keyof UserFiltersState>(
    key: K,
    value: UserFiltersState[K]
  ) => void;
  onClearFilters: () => void;
  roleOptions: { value: string; label: string }[];
}

export const UserFiltersBar: React.FC<UserFiltersBarProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  roleOptions,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const badges = useMemo(() => {
    const list: SearchBadge[] = [];

    if (filters.email) {
      list.push({
        id: 'email',
        label: `Email: ${filters.email}`,
        icon: <Filter size={10} />,
        onRemove: () => onFilterChange('email', ''),
      });
    }

    if (filters.role) {
      const roleObj = roleOptions.find((r) => r.value === filters.role);
      list.push({
        id: 'role',
        label: `Rol: ${roleObj?.label || filters.role}`,
        icon: <Filter size={10} />,
        onRemove: () => onFilterChange('role', null),
      });
    }

    return list;
  }, [filters, roleOptions, onFilterChange]);

  const hasAnyFilterActive = !!filters.email || !!filters.role;
  const placeholderText = !hasAnyFilterActive ? 'Buscar por usuario...' : '';

  return (
    <UnifiedSearchBar
      searchTerm={filters.username}
      onSearchChange={(val) => onFilterChange('username', val)}
      placeholder={placeholderText}
      badges={badges}
      showFilters={showFilters}
      setShowFilters={setShowFilters}
      dropdownWidthClass="w-[300px]"
    >
      <div className="w-full flex flex-col gap-3">
        <div>
          <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none">
            Email
          </h4>
          <Input
            type="text"
            placeholder="Filtrar por email"
            value={filters.email}
            onChange={(e) => onFilterChange('email', e.target.value)}
            inputPrefix={<Mail size={18} />}
          />
        </div>

        <div>
          <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none">
            Rol
          </h4>
          <Select<{ value: string; label: string }>
            inputId="user-role-filter"
            options={roleOptions}
            value={roleOptions.find((o) => o.value === filters.role) || null}
            onChange={(o) => onFilterChange('role', o ? o.value : null)}
            placeholder="Todos los Roles"
            isClearable
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

export default UserFiltersBar;
