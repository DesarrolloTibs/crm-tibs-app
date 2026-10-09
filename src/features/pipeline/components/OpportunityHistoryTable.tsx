import React, { useMemo } from 'react';
import type { Opportunity } from '@core/models/Opportunity';
import { Edit, Trash2, Archive, ArchiveRestore, Check, X } from 'lucide-react';
import Table, { type ColumnDef } from '@shared/components/Table';

interface Props {
  opportunities: Opportunity[];
  onEdit: (opportunity: Opportunity) => void;
  onDelete: (opportunity: Opportunity) => void;
  onArchive: (opportunity: Opportunity) => void;
  isAdmin: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  totalCount: number;
  filteredCount: number;
  maxHeight?: string;
  loading?: boolean;
}

const formatNumber = (amount: number) => {
  return new Intl.NumberFormat('es-MX', { minimumFractionDigits: 0 }).format(amount || 0);
};

const OpportunityHistoryTable: React.FC<Props> = ({
  opportunities,
  onEdit,
  onDelete,
  onArchive,
  isAdmin,
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  totalCount,
  filteredCount,
  maxHeight,
  loading = false,
}) => {
  const columns = useMemo<ColumnDef<Opportunity>[]>(
    () => [
      {
        id: 'nombre_proyecto',
        accessorKey: 'nombre_proyecto',
        header: 'Proyecto',
        cell: ({ row }) => (
          <p className="text-gray-900 font-semibold">{row.original.nombre_proyecto}</p>
        ),
        meta: {
          mobileLabel: 'Proyecto',
        },
      },
      {
        id: 'cliente_empresa',
        header: 'Cliente / Empresa',
        accessorFn: (opp) =>
          opp.company?.nombre ||
          (opp.cliente ? `${opp.cliente.nombre} ${opp.cliente.apellido}` : '') ||
          opp.empresa ||
          '',
        cell: ({ row }) => {
          const opp = row.original;
          return opp.company ? (
            <div>
              <p className="text-gray-800 font-semibold">{opp.company.nombre}</p>
              <p className="text-gray-500 text-xs">
                {opp.contacts?.map((c) => `${c.nombre} ${c.apellido}`).join(', ') || 'Sin contactos'}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-gray-800 font-semibold">
                {opp.cliente ? `${opp.cliente.nombre} ${opp.cliente.apellido}` : '-'}
              </p>
              <p className="text-gray-500 text-xs">{opp.empresa || '-'}</p>
            </div>
          );
        },
        meta: {
          mobileLabel: 'Cliente / Empresa',
        },
      },
      {
        id: 'ejecutivo',
        header: 'Ejecutivo',
        accessorFn: (opp) => opp.ejecutivo?.username || '',
        cell: ({ row }) => (
          <p className="text-gray-700">{row.original.ejecutivo?.username || 'No asignado'}</p>
        ),
        meta: {
          mobileLabel: 'Ejecutivo',
          hideOnMobile: true,
        },
      },
      {
        id: 'etapa',
        header: 'Etapa',
        accessorFn: (opp) => opp.stage?.strname || '',
        cell: ({ row }) => {
          const opp = row.original;
          const stageName = opp.stage?.strname || 'Sin etapa';
          const stageColor = opp.stage?.strcolor || '#6B7280';
          return (
            <span
              className="px-2.5 py-1 text-xs font-semibold rounded-full w-fit border inline-flex items-center gap-1"
              style={{
                backgroundColor: `${stageColor}1A`,
                color: stageColor,
                borderColor: `${stageColor}33`,
              }}
            >
              {Number(opp.stage?.stage_type) === 1 && (
                <Check size={11} className="stroke-[3] text-emerald-600" />
              )}
              {Number(opp.stage?.stage_type) === 2 && (
                <X size={11} className="stroke-[3] text-rose-600" />
              )}
              {stageName}
            </span>
          );
        },
        meta: {
          mobileLabel: 'Etapa',
        },
      },
      {
        id: 'monto_total',
        accessorKey: 'monto_total',
        header: 'Monto',
        cell: ({ row }) => (
          <p className="text-gray-900 font-semibold md:text-right">
            ${formatNumber(row.original.monto_total)}
          </p>
        ),
        meta: {
          mobileLabel: 'Monto',
          align: 'right',
          hideOnMobile: true,
        },
      },
      {
        id: 'moneda',
        accessorKey: 'moneda',
        header: 'Moneda',
        cell: ({ row }) => (
          <p className="text-gray-700 md:text-center">{row.original.moneda}</p>
        ),
        meta: {
          mobileLabel: 'Moneda',
          align: 'center',
          hideOnMobile: true,
        },
      },
      {
        id: 'archived',
        header: 'Estado',
        accessorFn: (opp) => (opp.archived ? 1 : 0),
        cell: ({ row }) => {
          const isArchived = row.original.archived;
          return (
            <div className="flex md:justify-center">
              <span
                className={`relative inline-block px-3 py-1 font-semibold leading-tight w-fit text-xs ${
                  isArchived ? 'text-yellow-900' : 'text-green-900'
                }`}
              >
                <span
                  aria-hidden
                  className={`absolute inset-0 ${
                    isArchived ? 'bg-yellow-200' : 'bg-green-200'
                  } opacity-50 rounded-full`}
                />
                <span className="relative">{isArchived ? 'Archivado' : 'Activo'}</span>
              </span>
            </div>
          );
        },
        meta: {
          mobileLabel: 'Estado',
          align: 'center',
          hideOnMobile: true,
        },
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const opp = row.original;
          return (
            <div className="flex space-x-1 justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive(opp);
                }}
                className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-100 rounded-full transition-colors cursor-pointer"
                title={opp.archived ? 'Desarchivar' : 'Archivar'}
              >
                {opp.archived ? <ArchiveRestore size={18} /> : <Archive size={18} />}
              </button>
              {isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(opp);
                    }}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors cursor-pointer"
                    title="Editar"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(opp);
                    }}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </>
              )}
            </div>
          );
        },
        meta: {
          align: 'right',
        },
      },
    ],
    [isAdmin, onArchive, onEdit, onDelete]
  );

  return (
    <Table
      data={opportunities}
      columns={columns}
      variant="cards"
      loading={loading}
      keyExtractor={(opp) => opp.id!}
      emptyTitle="No se encontraron oportunidades"
      emptyMessage="Intenta ajustar los filtros o crear una nueva oportunidad."
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
      pageSize={pageSize}
      onPageSizeChange={onPageSizeChange}
      totalCount={totalCount}
      filteredCount={filteredCount}
      maxHeight={maxHeight}
    />
  );
};

export default OpportunityHistoryTable;