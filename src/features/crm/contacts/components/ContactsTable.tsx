import { useMemo } from 'react';
import { Users, Search, X, UserPlus } from 'lucide-react';
import Table from '@shared/components/Table';
import Button from '@shared/components/Button';
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
          <div className="relative w-full sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              placeholder="Buscar por nombre, correo, empresa..."
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
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

          {/* Filtro por Categoría */}
          <select
            value={filters.category}
            onChange={(e) =>
              onFilterChange('category', e.target.value as ClientCategoryType | 'all')
            }
            className="py-1.5 px-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">Todas las Categorías</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

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
        loading={loading}
        emptyTitle={hasActiveFilters ? 'Sin resultados para la búsqueda' : 'No hay contactos registrados'}
        emptyMessage={
          hasActiveFilters
            ? 'No encontramos contactos que coincidan con los criterios seleccionados. Prueba restableciendo los filtros.'
            : 'Comienza registrando tu primer contacto o prospecto comercial para iniciar el seguimiento.'
        }
        footerRow={
          <tr>
            <td colSpan={columns.length} className="px-4 py-3 bg-slate-50/80 border-t border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium w-full">
                <span>
                  Mostrando <strong className="text-slate-800">{clients.length}</strong> de{' '}
                  <strong className="text-slate-800">{totalCount}</strong> contactos registrados
                </span>
                {hasActiveFilters && (
                  <button
                    onClick={onClearFilters}
                    className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
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
