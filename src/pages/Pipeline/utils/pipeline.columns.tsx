import type { Opportunity } from '../schemas/pipeline.schema';
import type { ColumnDef } from '../../../components/shared/Table';
import Badge from '../../../components/shared/Badge';
import Button from '../../../components/shared/Button';
import { formatNumber } from '../../../utils/formatters';
import { Edit, Trash2, Archive, ArchiveRestore, Check, X } from 'lucide-react';

export interface OpportunityColumnsOptions {
  isAdmin: boolean;
  onEdit: (opportunity: Opportunity) => void;
  onDelete: (opportunity: Opportunity) => void;
  onArchive: (opportunity: Opportunity) => void;
}

/**
 * Genera la definición de columnas para la tabla TanStack de Oportunidades del Pipeline
 */
export const getOpportunityColumns = ({
  isAdmin,
  onEdit,
  onDelete,
  onArchive,
}: OpportunityColumnsOptions): ColumnDef<Opportunity>[] => [
  {
    id: 'nombre_proyecto',
    accessorKey: 'nombre_proyecto',
    header: 'Proyecto',
    cell: ({ row }) => (
      <div>
        <p className="text-slate-900 font-semibold">{row.original.nombre_proyecto}</p>
        {row.original.linea_negocio?.strname && (
          <span className="inline-block mt-0.5 text-[11px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100/80">
            {row.original.linea_negocio.strname}
          </span>
        )}
      </div>
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
          <p className="text-slate-800 font-semibold">{opp.company.nombre}</p>
          <p className="text-slate-400 text-xs">
            {opp.contacts?.map((c) => `${c.nombre} ${c.apellido}`).join(', ') || 'Sin contactos asignados'}
          </p>
        </div>
      ) : (
        <div>
          <p className="text-slate-800 font-semibold">
            {opp.cliente ? `${opp.cliente.nombre} ${opp.cliente.apellido}` : '-'}
          </p>
          <p className="text-slate-400 text-xs">{opp.empresa || '-'}</p>
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
      <p className="text-slate-700 font-medium">
        {row.original.ejecutivo?.username || 'No asignado'}
      </p>
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
      const stageType = Number(opp.stage?.stage_type ?? 0);

      return (
        <span
          className="px-2.5 py-1 text-xs font-semibold rounded-full w-fit border inline-flex items-center gap-1 shadow-2xs"
          style={{
            backgroundColor: `${stageColor}1A`,
            color: stageColor,
            borderColor: `${stageColor}33`,
          }}
        >
          {stageType === 1 && (
            <Check size={11} className="stroke-[3] text-emerald-600 shrink-0" />
          )}
          {stageType === 2 && (
            <X size={11} className="stroke-[3] text-rose-600 shrink-0" />
          )}
          <span>{stageName}</span>
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
      <p className="text-slate-900 font-bold md:text-right">
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
      <span className="text-xs font-bold text-slate-500 md:text-center block">
        {row.original.moneda || 'MXN'}
      </span>
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
      const isArchived = Boolean(row.original.archived);
      return (
        <div className="flex md:justify-center">
          <Badge variant={isArchived ? 'warning' : 'success'} dot>
            {isArchived ? 'Archivado' : 'Activo'}
          </Badge>
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
        <div className="flex items-center space-x-1 justify-end">
          <Button
            variant="icon"
            onClick={(e) => {
              e.stopPropagation();
              onArchive(opp);
            }}
            className="text-slate-400 hover:text-amber-600 hover:bg-amber-50 !p-1.5"
            title={opp.archived ? 'Desarchivar' : 'Archivar'}
          >
            {opp.archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
          </Button>
          {isAdmin && (
            <>
              <Button
                variant="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(opp);
                }}
                className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 !p-1.5"
                title="Editar"
              >
                <Edit size={16} />
              </Button>
              <Button
                variant="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(opp);
                }}
                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 !p-1.5"
                title="Eliminar"
              >
                <Trash2 size={16} />
              </Button>
            </>
          )}
        </div>
      );
    },
    meta: {
      align: 'right',
    },
  },
];
