import React, { useMemo } from 'react';
import { ClipboardList, Search, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Opportunity } from '@core/models/Opportunity';
import type { Ticket } from '@core/models/Ticket';
import type { ActiveTab, CurrencyFilter } from '../hooks/useDashboard';
import { formatCurrency } from '@shared/utils/formatters';
import Table, { type ColumnDef } from '@shared/components/Table';
import Button from '@shared/components/Button';
import Input from '@shared/components/Input';

interface RecordsTableProps {
  activeTab: ActiveTab;
  tableDataList: (Opportunity | Ticket)[];
  paginatedList: (Opportunity | Ticket)[];
  loading?: boolean;
  tableSearch: string;
  onSearchChange: (v: string) => void;
  selectedKpiId: string | null;
  selectedChartFilter: { chartKey: string; value: string } | null;
  currentIndicators: any[];
  onClearKpi: () => void;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  totalCount: number;
  currencyFilter: CurrencyFilter;
  activeCurrency: string;
}

const RecordsTable: React.FC<RecordsTableProps> = ({
  activeTab,
  tableDataList,
  paginatedList,
  loading = false,
  tableSearch,
  onSearchChange,
  selectedKpiId,
  selectedChartFilter,
  currentIndicators,
  onClearKpi,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  totalCount,
  currencyFilter,
}) => {
  const navigate = useNavigate();

  const sectionTitle = selectedChartFilter
    ? `Registros filtrados por gráfico: "${selectedChartFilter.value}"`
    : selectedKpiId
    ? `Registros en: "${currentIndicators.find((i) => i.id === selectedKpiId)?.title}"`
    : activeTab === 'commercial'
    ? 'Oportunidades en este Pipeline'
    : 'Tickets en esta Mesa de Ayuda';

  const commercialColumns = useMemo<ColumnDef<Opportunity>[]>(
    () => [
      {
        id: 'nombre_proyecto',
        accessorKey: 'nombre_proyecto',
        header: 'Oportunidad / Proyecto',
        cell: ({ row }) => (
          <span className="font-bold text-slate-800 block max-w-[220px] truncate text-xs">
            {row.original.nombre_proyecto}
          </span>
        ),
        meta: {
          mobileLabel: 'Oportunidad',
        },
      },
      {
        id: 'cliente',
        accessorFn: (opp) =>
          opp.cliente
            ? `${opp.cliente.nombre} ${opp.cliente.apellido || ''}`.trim()
            : opp.empresa || 'N/A',
        header: 'Cliente',
        cell: ({ getValue }) => (
          <span className="text-xs font-semibold text-slate-700">{getValue<string>()}</span>
        ),
        meta: {
          mobileLabel: 'Cliente',
        },
      },
      {
        id: 'empresa',
        accessorFn: (opp) => opp.company?.nombre || opp.empresa || 'N/A',
        header: 'Empresa',
        cell: ({ getValue }) => (
          <span className="text-xs font-semibold text-slate-700">{getValue<string>()}</span>
        ),
        meta: {
          mobileLabel: 'Empresa',
          hideOnMobile: true,
        },
      },
      {
        id: 'ejecutivo',
        accessorFn: (opp) => opp.ejecutivo?.username || 'Sin asignar',
        header: 'Ejecutivo',
        cell: ({ getValue }) => (
          <span className="text-xs font-semibold text-slate-500">{getValue<string>()}</span>
        ),
        meta: {
          mobileLabel: 'Ejecutivo',
          hideOnMobile: true,
        },
      },
      {
        id: 'etapa',
        accessorFn: (opp) => opp.stage?.strname || 'N/A',
        header: 'Etapa',
        cell: ({ row }) => {
          const opp = row.original;
          return (
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold inline-block"
              style={{
                backgroundColor: opp.stage?.strcolor ? `${opp.stage.strcolor}15` : '#f1f5f9',
                color: opp.stage?.strcolor || '#64748b',
              }}
            >
              {opp.stage?.strname || 'N/A'}
            </span>
          );
        },
        meta: {
          mobileLabel: 'Etapa',
        },
      },
      {
        id: 'monto',
        accessorFn: (opp) => {
          const a = Number(opp.monto_total || 0);
          const rawTc = opp.tipoCambio ?? (opp as any).tipo_cambio;
          const tc = rawTc && Number(rawTc) > 0 ? Number(rawTc) : 1;
          return currencyFilter === 'consolidado' && opp.moneda === 'USD' ? a * tc : a;
        },
        header: 'Monto',
        cell: ({ row }) => {
          const opp = row.original;
          const a = Number(opp.monto_total || 0);
          const rawTc = opp.tipoCambio ?? (opp as any).tipo_cambio;
          const tc = rawTc && Number(rawTc) > 0 ? Number(rawTc) : 1;
          const formatted =
            currencyFilter === 'consolidado' && opp.moneda === 'USD'
              ? formatCurrency(a * tc, 'MXN')
              : formatCurrency(a, opp.moneda);
          return <span className="text-xs font-bold text-slate-900 tabular-nums">{formatted}</span>;
        },
        meta: {
          mobileLabel: 'Monto',
          align: 'right',
          cellClassName: 'text-right whitespace-nowrap',
        },
      },
      {
        id: 'accion',
        header: 'Acción',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-center md:justify-end">
            <Button
              variant="icon"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/pipeline?opportunityId=${row.original.id}`);
              }}
              className="!text-slate-400 hover:!text-indigo-600 hover:!bg-indigo-50"
              title="Ir a oportunidad"
            >
              <ArrowRight size={15} />
            </Button>
          </div>
        ),
        meta: {
          mobileLabel: 'Acción',
          align: 'right',
          headerClassName: 'w-14',
        },
      },
    ],
    [currencyFilter, navigate]
  );

  const supportColumns = useMemo<ColumnDef<Ticket>[]>(
    () => [
      {
        id: 'ticket_number',
        accessorKey: 'ticket_number',
        header: 'Nro Ticket',
        cell: ({ row }) => (
          <span className="text-xs font-black text-indigo-600">
            #{row.original.ticket_number.toString().padStart(5, '0')}
          </span>
        ),
        meta: {
          mobileLabel: 'Ticket',
        },
      },
      {
        id: 'strtitle',
        accessorKey: 'strtitle',
        header: 'Asunto',
        cell: ({ row }) => (
          <span className="text-xs font-bold text-slate-800 block max-w-[220px] truncate">
            {row.original.strtitle}
          </span>
        ),
        meta: {
          mobileLabel: 'Asunto',
        },
      },
      {
        id: 'priority',
        accessorKey: 'priority',
        header: 'Prioridad',
        cell: ({ row }) => {
          const p = row.original.priority;
          return (
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold inline-block ${
                p === 3
                  ? 'bg-rose-50 text-rose-600'
                  : p === 2
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {p === 3 ? 'Alta' : p === 2 ? 'Media' : 'Baja'}
            </span>
          );
        },
        meta: {
          mobileLabel: 'Prioridad',
        },
      },
      {
        id: 'tipo_incidencia',
        accessorFn: (t) => t.tipo_incidencia || 'Normal',
        header: 'Tipo Incidencia',
        cell: ({ getValue }) => (
          <span className="text-xs font-semibold text-slate-600">{getValue<string>()}</span>
        ),
        meta: {
          mobileLabel: 'Tipo',
          hideOnMobile: true,
        },
      },
      {
        id: 'cliente',
        accessorFn: (t) =>
          t.cliente
            ? `${t.cliente.nombre} ${t.cliente.apellido || ''}`.trim()
            : t.contactName || 'N/A',
        header: 'Cliente',
        cell: ({ getValue }) => (
          <span className="text-xs font-semibold text-slate-700">{getValue<string>()}</span>
        ),
        meta: {
          mobileLabel: 'Cliente',
        },
      },
      {
        id: 'responsable',
        accessorFn: (t) => t.responsable?.username || 'Sin asignar',
        header: 'Asignado a',
        cell: ({ getValue }) => (
          <span className="text-xs font-semibold text-slate-500">{getValue<string>()}</span>
        ),
        meta: {
          mobileLabel: 'Asignado a',
          hideOnMobile: true,
        },
      },
      {
        id: 'etapa',
        accessorFn: (t) => t.stage?.strname || 'N/A',
        header: 'Etapa',
        cell: ({ row }) => {
          const t = row.original;
          return (
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold inline-block"
              style={{
                backgroundColor: t.stage?.strcolor ? `${t.stage.strcolor}15` : '#f1f5f9',
                color: t.stage?.strcolor || '#64748b',
              }}
            >
              {t.stage?.strname || 'N/A'}
            </span>
          );
        },
        meta: {
          mobileLabel: 'Etapa',
        },
      },
      {
        id: 'accion',
        header: 'Acción',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-center md:justify-end">
            <Button
              variant="icon"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/helpdesk?ticketId=${row.original.id}`);
              }}
              className="!text-slate-400 hover:!text-indigo-600 hover:!bg-indigo-50"
              title="Ir a ticket"
            >
              <ArrowRight size={15} />
            </Button>
          </div>
        ),
        meta: {
          mobileLabel: 'Acción',
          align: 'right',
          headerClassName: 'w-14',
        },
      },
    ],
    [navigate]
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-md font-extrabold text-slate-800 flex items-center gap-2">
            <ClipboardList className="text-indigo-600" size={20} />
            {sectionTitle}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {selectedChartFilter
              ? `Solo registros del elemento "${selectedChartFilter.value}".`
              : selectedKpiId
              ? 'Solo registros del KPI seleccionado.'
              : 'Registros consolidados activos bajo las etapas elegidas.'}
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto items-center">
          <Input
            size="sm"
            type="text"
            value={tableSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={() => onSearchChange('')}
            clearTitle="Limpiar búsqueda"
            placeholder="Buscar..."
            inputPrefix={<Search size={15} />}
            containerClassName="flex-grow sm:flex-none sm:w-56"
            className="!py-2.5 !font-semibold"
          />
          {selectedKpiId && (
            <Button
              size="xs"
              variant="ghost"
              onClick={onClearKpi}
              className="!px-3.5 h-10 !text-xs !font-bold !text-indigo-600 bg-indigo-50 hover:!bg-indigo-100 !rounded-xl whitespace-nowrap"
            >
              Ver todos
            </Button>
          )}
        </div>
      </div>

      {/* Tabla estándar TanStack + TablePagination idéntica al módulo de Clientes */}
      {activeTab === 'commercial' ? (
        <Table<Opportunity>
          data={paginatedList as Opportunity[]}
          columns={commercialColumns}
          variant="cards"
          loading={loading}
          maxHeight="540px"
          minHeight="0px"
          keyExtractor={(opp) => opp.id}
          emptyTitle="No se encontraron registros"
          emptyMessage="No hay registros activos que coincidan con la búsqueda o filtros aplicados."
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          pageSize={pageSize}
          onPageSizeChange={onPageSizeChange}
          totalCount={totalCount}
          filteredCount={tableDataList.length}
        />
      ) : (
        <Table<Ticket>
          data={paginatedList as Ticket[]}
          columns={supportColumns}
          variant="cards"
          loading={loading}
          maxHeight="540px"
          minHeight="0px"
          keyExtractor={(t) => t.id}
          emptyTitle="No se encontraron registros"
          emptyMessage="No hay registros activos que coincidan con la búsqueda o filtros aplicados."
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          pageSize={pageSize}
          onPageSizeChange={onPageSizeChange}
          totalCount={totalCount}
          filteredCount={tableDataList.length}
        />
      )}
    </div>
  );
};

export default RecordsTable;
