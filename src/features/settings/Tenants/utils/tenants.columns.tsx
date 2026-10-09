import {
  Calendar,
  Clock,
  ToggleLeft,
  ToggleRight,
  Pencil,
  Trash2,
  RefreshCw,
  Building2,
} from 'lucide-react';
import type { ColumnDef } from '@shared/components/Table';
import Button from '@shared/components/Button';
import Badge from '@shared/components/Badge';
import type { TenantPlanInfo } from '../schemas/tenants.schema';

interface TenantsColumnsCallbacks {
  onEdit: (tenant: TenantPlanInfo) => void;
  onDelete: (tenant: TenantPlanInfo) => void;
  onToggleAllowExtra: (tenant: TenantPlanInfo) => void;
  onOpenQueue: (tenant: TenantPlanInfo) => void;
  queueSummaries: Record<number, { total: number; coverageUntil: string | null }>;
  togglingExtraId: number | null;
}

export const getTenantsColumns = ({
  onEdit,
  onDelete,
  onToggleAllowExtra,
  onOpenQueue,
  queueSummaries,
  togglingExtraId,
}: TenantsColumnsCallbacks): ColumnDef<TenantPlanInfo, unknown>[] => [
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Organización',
    cell: ({ row }) => {
      const t = row.original;
      return (
        <div className="flex items-center gap-3 py-1">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600 shadow-2xs">
            <Building2 size={18} />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-800 text-sm truncate" title={t.name}>
              {t.name}
            </div>
            <div className="text-xs font-mono text-indigo-600 flex items-center gap-1 mt-0.5">
              <span>{t.schema_name}</span>
            </div>
          </div>
        </div>
      );
    },
    meta: {
      mobileLabel: 'Organización',
      headerClassName: 'text-left min-w-[200px]',
      cellClassName: 'text-left',
    },
  },
  {
    id: 'plan',
    header: 'Plan Actual',
    cell: ({ row }) => {
      const t = row.original;
      if (!t.plan) {
        return (
          <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-lg font-medium inline-block">
            Sin Plan
          </span>
        );
      }

      return (
        <div className="space-y-0.5">
          <div className="font-semibold text-slate-700 text-xs flex items-center gap-1.5">
            {t.plan.plan_name}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {t.plan.tokens_limit.toLocaleString()} tokens / {t.plan.billing_period_months} m.
          </div>
        </div>
      );
    },
    meta: {
      mobileLabel: 'Plan Actual',
      headerClassName: 'text-left min-w-[160px]',
      cellClassName: 'text-left',
    },
  },
  {
    id: 'next_renewal_date',
    header: 'Próxima Renovación',
    cell: ({ row }) => {
      const t = row.original;
      const queuedSummary = queueSummaries?.[t.id];
      const queuedCount = Number(t.total_queued_periods ?? queuedSummary?.total ?? 0);
      const coverageUntil = t.coverage_until ?? queuedSummary?.coverageUntil ?? t.next_renewal_date;

      if (!t.next_renewal_date) {
        return <span className="text-xs text-slate-400">N/A</span>;
      }

      return (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-700">
            <Calendar size={13} className="text-slate-400 shrink-0" />
            <span>{new Date(t.next_renewal_date).toLocaleDateString()}</span>
          </div>
          {queuedCount > 0 && (
            <div className="flex flex-col gap-0.5">
              <Button
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenQueue(t);
                }}
                title={coverageUntil ? `Ver cola de renovación: ${queuedCount} período(s) respaldados. Cobertura proyectada hasta ${new Date(coverageUntil).toLocaleDateString()}` : `Ver cola de renovación: ${queuedCount} período(s) respaldados.`}
                className="inline-flex items-center gap-1 !text-[11px] !font-semibold text-indigo-700 bg-indigo-50 hover:!bg-indigo-100 border border-indigo-200/80 !px-2 !py-0.5 !rounded-full transition-colors w-fit"
              >
                <Clock size={11} className="text-indigo-500" />
                <span>+{queuedCount} en cola</span>
              </Button>
              {coverageUntil && coverageUntil !== t.next_renewal_date && (
                <span className="text-[10px] text-slate-400 font-mono pl-0.5" title={`Cobertura proyectada: ${new Date(coverageUntil).toLocaleDateString()}`}>
                  Hasta {new Date(coverageUntil).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>
      );
    },
    meta: {
      mobileLabel: 'Próxima Renovación',
      headerClassName: 'text-left min-w-[150px]',
      cellClassName: 'text-left',
    },
  },
  {
    id: 'allow_extra',
    header: 'Consumo Excedente',
    cell: ({ row }) => {
      const t = row.original;
      const isToggling = togglingExtraId === t.id;

      return (
        <Button
          variant="ghost"
          disabled={isToggling}
          onClick={(e) => {
            e.stopPropagation();
            onToggleAllowExtra(t);
          }}
          title={t.allow_extra ? 'Clic para bloquear sobreconsumo' : 'Clic para permitir sobreconsumo'}
          className={`flex items-center gap-1.5 !text-xs !font-semibold !px-2.5 !py-1 !rounded-lg transition-all shadow-2xs ${
            t.allow_extra
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:!bg-emerald-100'
              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:!bg-slate-200'
          }`}
        >
          {isToggling ? (
            <RefreshCw size={14} className="animate-spin text-slate-500" />
          ) : t.allow_extra ? (
            <ToggleRight size={16} />
          ) : (
            <ToggleLeft size={16} />
          )}
          <span>{t.allow_extra ? 'Permitido' : 'Bloqueado'}</span>
        </Button>
      );
    },
    meta: {
      mobileLabel: 'Consumo Excedente',
      headerClassName: 'text-left min-w-[140px]',
      cellClassName: 'text-left',
    },
  },
  {
    id: 'is_active',
    header: 'Estado',
    cell: ({ row }) => {
      const isActive = row.original.is_active;

      return (
        <Badge
          variant={isActive ? 'success' : 'error'}
          size="sm"
          dot
          className="font-bold shadow-2xs"
        >
          {isActive ? 'Activa' : 'Expirada / Inactiva'}
        </Badge>
      );
    },
    meta: {
      mobileLabel: 'Estado',
      headerClassName: 'text-left min-w-[130px]',
      cellClassName: 'text-left',
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => {
      const t = row.original;

      return (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(t);
            }}
            title="Gestionar organización (Datos, Plan y Cola)"
            className="!inline-flex !items-center !justify-center !h-8 !py-0 !px-2.5 !text-xs !font-semibold !normal-case !tracking-normal gap-1 bg-slate-100 hover:!bg-indigo-50 text-slate-700 hover:!text-indigo-700 !border-slate-200 hover:!border-indigo-200 shadow-2xs"
          >
            <Pencil size={13} />
            <span>Editar</span>
          </Button>

          <Button
            variant="ghost-danger"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(t);
            }}
            title="Eliminar organización permanentemente"
            className="!inline-flex !items-center !justify-center !h-8 !w-8 !p-0 bg-red-50 text-red-600 hover:!bg-red-100 !rounded-lg"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      );
    },
    meta: {
      mobileLabel: 'Acciones',
      align: 'right',
      headerClassName: 'w-32 text-right',
      cellClassName: 'w-32 text-right',
    },
  },
];
