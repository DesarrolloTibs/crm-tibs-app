import React, { useMemo, useState, useRef } from 'react';
import {
  User,
  Tag,
  CalendarDays,
  RotateCcw,
} from 'lucide-react';
import UnifiedSearchBar, { type SearchBadge } from '../../../components/shared/UnifiedSearchBar';
import Button from '../../../components/shared/Button';
import Select from '../../../components/shared/Select';
import type {
  TypeActivity,
  ActivityFiltersState,
} from '../schemas/activities.schema';

interface ActivitiesFiltersProps {
  filters: ActivityFiltersState;
  onFilterChange: <K extends keyof ActivityFiltersState>(
    key: K,
    value: ActivityFiltersState[K]
  ) => void;
  onClearFilters: () => void;
  activityTypes: TypeActivity[];
  userOptions?: { value: string; label: string }[];
  isAdmin: boolean;
  currentUserId?: string;
  currentUserName?: string;
  className?: string;
}

const formatDateBadge = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month) return dateStr;
  if (day) {
    return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
    });
  }
  return dateStr;
};

export const ActivitiesFilters: React.FC<ActivitiesFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  activityTypes,
  userOptions = [],
  isAdmin,
  currentUserId,
  currentUserName,
  className,
}) => {
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  const fullUserOptions = useMemo(() => {
    const list = [
      { value: 'all', label: 'Todos los ejecutivos' },
      ...userOptions,
    ];
    if (currentUserId && !list.some((o) => o.value === currentUserId)) {
      list.push({
        value: currentUserId,
        label: currentUserName ? `${currentUserName} (Yo)` : 'Mi Usuario',
      });
    }
    return list;
  }, [userOptions, currentUserId, currentUserName]);

  const typeOptions = useMemo(
    () => [
      { value: 'all', label: 'Todos los tipos' },
      ...activityTypes.map((t) => ({
        value: String(t.id),
        label: t.strname,
      })),
    ],
    [activityTypes]
  );

  const badges = useMemo<SearchBadge[]>(() => {
    const list: SearchBadge[] = [];

    // Badge de Usuario (activo si userId no es 'all')
    if (filters.userId && filters.userId !== 'all') {
      const userLabel =
        fullUserOptions.find((o) => o.value === filters.userId)?.label ||
        (filters.userId === currentUserId && currentUserName ? currentUserName : 'Usuario');

      list.push({
        id: 'user',
        label: userLabel,
        icon: <User size={10} />,
        onRemove: () => {
          if (isAdmin) {
            onFilterChange('userId', 'all');
          }
        },
      });
    }

    // Badge de Tipo de Actividad
    if (filters.typeActivityId && filters.typeActivityId !== 'all') {
      const typeLabel =
        typeOptions.find((o) => o.value === filters.typeActivityId)?.label || 'Tipo';
      list.push({
        id: 'type',
        label: typeLabel,
        icon: <Tag size={10} />,
        onRemove: () => onFilterChange('typeActivityId', 'all'),
      });
    }

    // Badge de Fecha
    if (filters.date) {
      list.push({
        id: 'date',
        label: formatDateBadge(filters.date),
        icon: <CalendarDays size={10} />,
        onRemove: () => onFilterChange('date', ''),
      });
    }

    return list;
  }, [
    filters.userId,
    filters.typeActivityId,
    filters.date,
    fullUserOptions,
    typeOptions,
    currentUserId,
    currentUserName,
    isAdmin,
    onFilterChange,
  ]);

  const placeholder = badges.length === 0 ? 'Buscar actividad...' : '';

  return (
    <UnifiedSearchBar
      ref={searchDropdownRef}
      searchTerm={filters.search}
      onSearchChange={(val) => onFilterChange('search', val)}
      placeholder={placeholder}
      badges={badges}
      showFilters={showFilters}
      setShowFilters={setShowFilters}
      dropdownWidthClass="w-[420px]"
      dropdownAlign="right"
      className={className || "w-full sm:w-[280px] md:w-[340px] lg:w-[380px]"}
    >
      {/* Panel desplegable con selectores */}
      <div className="flex flex-col sm:flex-row gap-4 w-full">
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          {/* Selector de Usuario / Ejecutivo: EXCLUSIVO para Admin y SuperAdmin */}
          {isAdmin && (
            <div>
              <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none flex items-center gap-1">
                <User size={10} /> Usuario / Ejecutivo
              </h4>
              <Select
                inputId="activities-unified-user"
                options={fullUserOptions}
                value={
                  fullUserOptions.find((o) => o.value === filters.userId) ||
                  (filters.userId === currentUserId && currentUserId
                    ? { value: currentUserId, label: currentUserName || 'Mi Usuario' }
                    : fullUserOptions[0])
                }
                onChange={(opt: any) => onFilterChange('userId', opt?.value || 'all')}
                placeholder="Todos los usuarios"
                isClearable={false}
                isSearchable
                className="text-xs"
              />
            </div>
          )}

          <div>
            <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none flex items-center gap-1">
              <Tag size={10} /> Tipo de Actividad
            </h4>
            <Select
              inputId="activities-unified-type"
              options={typeOptions}
              value={typeOptions.find((o) => o.value === filters.typeActivityId) || typeOptions[0]}
              onChange={(opt: any) => onFilterChange('typeActivityId', opt?.value || 'all')}
              placeholder="Todos los tipos"
              className="text-xs"
            />
          </div>
        </div>

        <div className="hidden sm:block w-px bg-gray-100 self-stretch" />

        <div className="flex flex-col gap-3 flex-1 min-w-0">
          <div>
            <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 select-none flex items-center gap-1">
              <CalendarDays size={10} /> Fecha
            </h4>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => onFilterChange('date', e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
            />
          </div>

          <div className="border-t border-gray-100 pt-2 mt-auto">
            <Button
              variant="ghost"
              onClick={() => {
                onClearFilters();
                setShowFilters(false);
              }}
              className="gap-1.5 w-full justify-start text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <RotateCcw size={12} /> Limpiar Filtros
            </Button>
          </div>
        </div>
      </div>
    </UnifiedSearchBar>
  );
};

export default ActivitiesFilters;
