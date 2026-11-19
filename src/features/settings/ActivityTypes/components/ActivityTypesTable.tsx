import React, { useMemo } from 'react';
import { ClipboardList, Search } from 'lucide-react';
import Table from '@shared/components/Table';
import Button from '@shared/components/Button';
import Input from '@shared/components/Input';
import type { TypeActivity } from '../schemas/activityTypes.schema';
import { getActivityTypesColumns } from '../utils/activityTypes.columns';

interface ActivityTypesTableProps {
  types: TypeActivity[];
  totalCount: number;
  loading: boolean;
  onEdit: (type: TypeActivity) => void;
  onDelete: (type: TypeActivity) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: 'all' | 'active' | 'inactive';
  setStatusFilter: (filter: 'all' | 'active' | 'inactive') => void;
}

export const ActivityTypesTable: React.FC<ActivityTypesTableProps> = ({
  types,
  loading,
  onEdit,
  onDelete,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
}) => {
  const columns = useMemo(
    () =>
      getActivityTypesColumns({
        onEdit,
        onDelete,
      }),
    [onEdit, onDelete]
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
      {/* Encabezado y Controles idénticos al patrón de Mi Empresa (InteractionHistoryTable) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="text-indigo-600" size={18} />
            Catálogo de Tipos de Actividad
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Configuración y disponibilidad de categorías operativas para citas, llamadas y tareas comerciales.
          </p>
        </div>

        {/* Controles de Búsqueda y Filtro de Estado estilo Mi Empresa */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Input
            size="sm"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
            clearTitle="Limpiar búsqueda"
            placeholder="Buscar tipo por nombre..."
            inputPrefix={<Search size={14} />}
            containerClassName="w-full sm:w-64"
          />

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStatusFilter('all')}
              className={`!px-2.5 !py-1 !text-xs font-bold transition-all ${
                statusFilter === 'all'
                  ? '!bg-white !text-indigo-700 shadow-xs'
                  : '!text-slate-500 hover:!text-slate-700'
              }`}
            >
              Todos
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStatusFilter('active')}
              className={`!px-2.5 !py-1 !text-xs font-bold transition-all ${
                statusFilter === 'active'
                  ? '!bg-white !text-emerald-700 shadow-xs'
                  : '!text-slate-500 hover:!text-slate-700'
              }`}
            >
              Activos
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStatusFilter('inactive')}
              className={`!px-2.5 !py-1 !text-xs font-bold transition-all ${
                statusFilter === 'inactive'
                  ? '!bg-white !text-slate-700 shadow-xs'
                  : '!text-slate-500 hover:!text-slate-700'
              }`}
            >
              Inactivos
            </Button>
          </div>
        </div>
      </div>

      {/* Tabla compartida estándar con soporte responsive (idéntica a Mi Empresa) */}
      <Table<TypeActivity>
        columns={columns}
        data={types}
        variant="flat"
        maxHeight="520px"
        minHeight="180px"
        loading={loading}
        emptyTitle={searchTerm ? 'Sin coincidencias' : 'Sin tipos de actividad'}
        emptyMessage={
          searchTerm
            ? 'No se encontraron tipos de actividad que coincidan con la búsqueda.'
            : 'No hay tipos de actividad registrados en el sistema.'
        }
        keyExtractor={(t: TypeActivity) => t.id}
        enablePagination
        initialPageSize={10}
      />
    </div>
  );
};

export default ActivityTypesTable;
