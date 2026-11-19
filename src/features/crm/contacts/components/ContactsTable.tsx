import { useMemo } from 'react';
import { Users, Search, UserPlus } from 'lucide-react';
import Table from '@shared/components/Table';
import Button from '@shared/components/Button';
import Input from '@shared/components/Input';
import Select from '@shared/components/Select';
import type { Client, ContactFiltersState } from '../schemas/contacts.schema';
import { ClientCategory, type ClientCategoryType } from '@core/models/Client';
import { getContactsColumns } from '../utils/contacts.columns';

interface ContactsTableProps {
  clients: Client[];
  totalCount: number;
  loading: boolean;
  isAdmin: boolean;
  filters: ContactFiltersState;
  onFilterChange: <K extends keyof ContactFiltersState>(key: K, value: ContactFiltersState[K]) => void;
  onClearFilters: () => void;
  onEdit: (client: Client) => void;
  onToggleStatus: (client: Client) => void;
  onCreateNew: () => void;
}

export const ContactsTable: React.FC<ContactsTableProps> = ({
  clients,
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
      getContactsColumns({
        onEdit,
        onToggleStatus,
        isAdmin,
      }),
    [onEdit, onToggleStatus, isAdmin]
  );

  const hasActiveFilters =
    Boolean(filters.search.trim()) ||
    filters.status !== 'all' ||
    filters.category !== 'all' ||
    filters.ejecutivoId !== 'all';

  const categoryOptions = Object.values(ClientCategory);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
      {/* Encabezado y Controles de la Tabla */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-indigo-600" size={18} />
            Directorio de Contactos
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Personas naturales, tomadores de decisiones y prospectos vinculados a cuentas de negocio.
          </p>
        </div>

        {/* Controles de Búsqueda, Filtros y Nuevo Contacto */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Campo de Búsqueda */}
          <Input
            size="sm"
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            onClear={() => onFilterChange('search', '')}
            clearTitle="Limpiar búsqueda"
            placeholder="Buscar por nombre, correo, empresa..."
            inputPrefix={<Search size={14} />}
            containerClassName="w-full sm:w-60"
          />

          {/* Filtro por Categoría */}
          <div className="w-44">
            <Select
              size="sm"
              value={[
                { value: 'all', label: 'Todas las Categorías' },
                ...categoryOptions.map((cat) => ({ value: cat, label: cat })),
              ].find((opt) => opt.value === filters.category)}
              onChange={(selected: any) =>
                onFilterChange(
                  'category',
                  (selected?.value || 'all') as ClientCategoryType | 'all'
                )
              }
              options={[
                { value: 'all', label: 'Todas las Categorías' },
                ...categoryOptions.map((cat) => ({ value: cat, label: cat })),
              ]}
            />
          </div>

          {/* Filtro de Estado */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onFilterChange('status', 'all')}
              className={`!px-2.5 !py-1 !text-xs font-bold transition-all ${
                filters.status === 'all'
                  ? '!bg-white !text-indigo-700 shadow-xs'
                  : '!text-slate-500 hover:!text-slate-700'
              }`}
            >
              Todos
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
              Activos
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
              Inactivos
            </Button>
          </div>

          {/* Botón Nuevo Contacto */}
          <Button
            variant="success"
            onClick={onCreateNew}
            className="gap-2 text-xs !py-1.5"
          >
            <UserPlus size={15} />
            Nuevo Contacto
          </Button>
        </div>
      </div>

      {/* Tabla TanStack */}
      <Table
        data={clients}
        columns={columns}
        variant="cards"
        loading={loading}
        enablePagination
        initialPageSize={10}
        emptyTitle={hasActiveFilters ? 'Sin resultados para la búsqueda' : 'No hay contactos registrados'}
        emptyMessage={
          hasActiveFilters
            ? 'No encontramos contactos que coincidan con los criterios seleccionados. Prueba restableciendo los filtros.'
            : 'Comienza registrando tu primer contacto o prospecto comercial para iniciar el seguimiento.'
        }
      />
    </div>
  );
};
