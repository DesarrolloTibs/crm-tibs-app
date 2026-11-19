import React, { useMemo } from 'react';
import { KeyRound, Search } from 'lucide-react';
import Table from '@shared/components/Table';
import Button from '@shared/components/Button';
import Input from '@shared/components/Input';
import type {
  LlmProviderItem,
  LlmStatusFilter,
} from '../schemas/globalAiCredentials.schema';
import { getGlobalAiColumns } from '../utils/globalAiCredentials.columns';

interface GlobalAiCredentialsTableProps {
  providers: LlmProviderItem[];
  totalCount: number;
  loading: boolean;
  onConfigure: (provider: LlmProviderItem) => void;
  onSetDefault: (provider: LlmProviderItem) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: LlmStatusFilter;
  setStatusFilter: (filter: LlmStatusFilter) => void;
}

export const GlobalAiCredentialsTable: React.FC<GlobalAiCredentialsTableProps> = ({
  providers,
  loading,
  onConfigure,
  onSetDefault,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
}) => {
  const columns = useMemo(
    () =>
      getGlobalAiColumns({
        onConfigure,
        onSetDefault,
      }),
    [onConfigure, onSetDefault]
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
      {/* Encabezado y Controles idénticos al patrón de Tipos de Actividad y Mi Empresa */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <KeyRound className="text-indigo-600" size={18} />
            Catálogo de Proveedores & Credenciales LLM
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Estado de conexión, llaves secretas de API y parámetros de vectorización por motor.
          </p>
        </div>

        {/* Controles de Búsqueda y Filtro de Estado */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Input
            size="sm"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
            clearTitle="Limpiar búsqueda"
            placeholder="Buscar motor por nombre..."
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
              onClick={() => setStatusFilter('configured')}
              className={`!px-2.5 !py-1 !text-xs font-bold transition-all ${
                statusFilter === 'configured'
                  ? '!bg-white !text-emerald-700 shadow-xs'
                  : '!text-slate-500 hover:!text-slate-700'
              }`}
            >
              Configurados
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStatusFilter('pending')}
              className={`!px-2.5 !py-1 !text-xs font-bold transition-all ${
                statusFilter === 'pending'
                  ? '!bg-white !text-amber-700 shadow-xs'
                  : '!text-slate-500 hover:!text-slate-700'
              }`}
            >
              Pendientes
            </Button>
          </div>
        </div>
      </div>

      {/* Tabla TanStack Table */}
      <Table<LlmProviderItem>
        columns={columns}
        data={providers}
        variant="flat"
        maxHeight="520px"
        minHeight="180px"
        loading={loading}
        emptyTitle={searchTerm ? 'Sin coincidencias' : 'Sin proveedores'}
        emptyMessage={
          searchTerm
            ? 'No se encontraron motores o proveedores que coincidan con la búsqueda.'
            : 'No hay proveedores registrados en el catálogo.'
        }
        keyExtractor={(item: LlmProviderItem) => item.id}
        enablePagination
        initialPageSize={10}
      />
    </div>
  );
};

export default GlobalAiCredentialsTable;
