import { Edit2, Trash2, Layers, Zap, Calendar } from 'lucide-react';
import type { ColumnDef } from '../../../../components/shared/Table';
import Button from '../../../../components/shared/Button';
import Badge from '../../../../components/shared/Badge';
import type { Plan } from '../schemas/subscriptionPlans.schema';
import {
  formatPrice,
  formatTokens,
  formatBillingPeriod,
} from './subscriptionPlans.helpers';

interface SubscriptionPlansColumnsCallbacks {
  onEdit: (plan: Plan) => void;
  onDelete: (plan: Plan) => void;
}

export const getSubscriptionPlansColumns = ({
  onEdit,
  onDelete,
}: SubscriptionPlansColumnsCallbacks): ColumnDef<Plan, unknown>[] => [
  {
    id: 'plan_name',
    accessorKey: 'plan_name',
    header: 'Plan de Suscripción',
    cell: ({ row }) => {
      const plan = row.original;
      const { periodType } = formatBillingPeriod(plan.billing_period_months);

      return (
        <div className="flex items-center gap-3 py-1">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border bg-indigo-50 border-indigo-100 text-indigo-600 shadow-2xs"
            title={`Nivel de servicio: ${plan.plan_name}`}
          >
            <Layers size={17} />
          </div>
          <div>
            <span className="font-bold text-slate-800 text-sm block">
              {plan.plan_name}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              ID #{plan.plan_id} • Modalidad {periodType}
            </span>
          </div>
        </div>
      );
    },
    meta: {
      mobileLabel: 'Plan',
      headerClassName: 'text-left',
      cellClassName: 'text-left',
    },
  },
  {
    id: 'price',
    accessorKey: 'price',
    header: 'Precio (USD)',
    cell: ({ row }) => {
      const plan = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-extrabold text-slate-800 text-sm">
            {formatPrice(plan.price)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            facturación cíclica
          </span>
        </div>
      );
    },
    meta: {
      mobileLabel: 'Precio',
      align: 'left',
      headerClassName: 'text-left',
      cellClassName: 'text-left',
    },
  },
  {
    id: 'tokens_limit',
    accessorKey: 'tokens_limit',
    header: 'Límite de Tokens',
    cell: ({ row }) => {
      const plan = row.original;
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-700 font-mono font-bold text-xs shadow-2xs">
          <Zap size={13} className="text-indigo-500 shrink-0" />
          <span>{formatTokens(plan.tokens_limit)}</span>
        </div>
      );
    },
    meta: {
      mobileLabel: 'Cuota de Tokens',
      align: 'left',
      headerClassName: 'text-left',
      cellClassName: 'text-left',
    },
  },
  {
    id: 'billing_period_months',
    accessorKey: 'billing_period_months',
    header: 'Período',
    cell: ({ row }) => {
      const plan = row.original;
      const { label, periodType } = formatBillingPeriod(plan.billing_period_months);

      return (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
          <Calendar size={13} className="text-slate-400 shrink-0" />
          <span>{label}</span>
          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-semibold">
            {periodType}
          </span>
        </div>
      );
    },
    meta: {
      mobileLabel: 'Período',
      align: 'left',
      headerClassName: 'text-left',
      cellClassName: 'text-left',
    },
  },
  {
    id: 'blnstatus',
    accessorKey: 'blnstatus',
    header: 'Estado',
    cell: ({ row }) => {
      const isActive = row.original.blnstatus;
      return (
        <Badge
          variant={isActive ? 'success' : 'neutral'}
          size="sm"
          dot
          className="font-bold shadow-2xs"
        >
          {isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      );
    },
    meta: {
      mobileLabel: 'Estado',
      align: 'center',
      headerClassName: 'w-36 text-center',
      cellClassName: 'w-36 text-center',
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => {
      const plan = row.original;
      return (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(plan);
            }}
            className="hover:!text-indigo-600 hover:!bg-indigo-50 !rounded-lg"
            title="Editar plan de suscripción"
            aria-label={`Editar ${plan.plan_name}`}
          >
            <Edit2 size={16} />
          </Button>
          <Button
            variant="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(plan);
            }}
            className="hover:!text-rose-600 hover:!bg-rose-50 !rounded-lg"
            title="Desactivar plan"
            aria-label={`Desactivar ${plan.plan_name}`}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      );
    },
    meta: {
      mobileLabel: 'Acciones',
      align: 'right',
      headerClassName: 'w-28 text-right',
      cellClassName: 'w-28 text-right',
    },
  },
];
