import { Edit2, Trash2, Layers } from 'lucide-react';
import type { ColumnDef } from '@shared/components/Table';
import Button from '@shared/components/Button';
import Badge from '@shared/components/Badge';
import type { DashboardIndicator } from '../schemas/dashboardIndicators.schema';
import { getIndicatorColorMeta, getStageNames } from './dashboardIndicators.helpers';

interface DashboardIndicatorsColumnsCallbacks {
  onEdit: (indicator: DashboardIndicator) => void;
  onDelete: (indicator: DashboardIndicator) => void;
  stages: Array<{ id: string; strname: string }>;
}

export const getDashboardIndicatorsColumns = ({
  onEdit,
  onDelete,
  stages,
}: DashboardIndicatorsColumnsCallbacks): ColumnDef<DashboardIndicator, unknown>[] => [
  {
    id: 'title',
    accessorKey: 'title',
    header: 'Nombre del Indicador',
    cell: ({ row }) => {
      const ind = row.original;
      const colorMeta = getIndicatorColorMeta(ind.color);

      return (
        <div className="flex items-center gap-3 py-1">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${colorMeta.border} ${colorMeta.badgeBg} shadow-2xs`}
            title={`Color de tarjeta: ${colorMeta.label}`}
          >
            <span
              className={`w-3.5 h-3.5 rounded-full ${colorMeta.bg} ring-2 ring-offset-1 ${colorMeta.ring}/40`}
            />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-slate-800 text-sm block leading-tight">
              {ind.title}
            </span>
            <span className="text-[11px] text-slate-400 capitalize">
              Tarjeta {colorMeta.label.toLowerCase()}
            </span>
          </div>
        </div>
      );
    },
    meta: {
      mobileLabel: 'Indicador',
      headerClassName: 'text-left min-w-[200px]',
      cellClassName: 'text-left',
    },
  },
  {
    id: 'type',
    accessorKey: 'type',
    header: 'Tipo de Métrica',
    cell: ({ row }) => {
      const isSum = row.original.type === 'sum';
      return (
        <Badge
          variant={isSum ? 'success' : 'indigo'}
          size="sm"
          dot
          className="font-bold shadow-2xs"
        >
          {isSum ? '$ Suma de Montos' : 'Conteo (Registros)'}
        </Badge>
      );
    },
    meta: {
      mobileLabel: 'Tipo',
      align: 'center',
      headerClassName: 'w-44 text-center',
      cellClassName: 'w-44 text-center',
    },
  },
  {
    id: 'stages',
    header: 'Etapas Vinculadas',
    cell: ({ row }) => {
      const ind = row.original;
      const stageCount = ind.stage_ids?.length || 0;
      const formattedStages = getStageNames(ind.stage_ids, stages);

      return (
        <div className="flex items-center gap-2 max-w-md py-1">
          <Badge
            variant={stageCount > 0 ? 'purple' : 'neutral'}
            size="sm"
            className="shrink-0 font-bold"
          >
            <Layers size={11} className="mr-0.5" />
            {stageCount > 0 ? `${stageCount} etapa${stageCount !== 1 ? 's' : ''}` : 'Todas'}
          </Badge>
          <span
            className="text-xs text-slate-500 truncate"
            title={formattedStages}
          >
            {formattedStages}
          </span>
        </div>
      );
    },
    meta: {
      mobileLabel: 'Etapas',
      headerClassName: 'text-left min-w-[220px]',
      cellClassName: 'text-left',
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => {
      const ind = row.original;
      return (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(ind);
            }}
            className="hover:!text-indigo-600 hover:!bg-indigo-50 !rounded-lg"
            title="Editar indicador"
            aria-label={`Editar ${ind.title}`}
          >
            <Edit2 size={16} />
          </Button>
          <Button
            variant="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(ind);
            }}
            className="hover:!text-rose-600 hover:!bg-rose-50 !rounded-lg"
            title="Eliminar indicador"
            aria-label={`Eliminar ${ind.title}`}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      );
    },
    meta: {
      mobileLabel: 'Acciones',
      align: 'right',
      headerClassName: 'w-24 text-right',
      cellClassName: 'w-24 text-right',
    },
  },
];
