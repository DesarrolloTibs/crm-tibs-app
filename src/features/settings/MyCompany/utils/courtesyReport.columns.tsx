import { ChevronRight } from 'lucide-react';
import type { ColumnDef } from '@shared/components/Table';
import Badge from '@shared/components/Badge';
import Button from '@shared/components/Button';
import type { CourtesyOverageTenantReport } from '../schemas/myCompany.schema';
import { formatNumber, formatFriendlyDate } from './myCompany.helpers';

interface GetCourtesyColumnsOptions {
  onInspectTenant: (tenant: {
    id: number;
    name: string;
    schema_name: string;
    allow_extra: boolean;
  }) => void;
}

export const getCourtesyColumns = (
  options: GetCourtesyColumnsOptions
): ColumnDef<CourtesyOverageTenantReport, any>[] => [
  {
    id: 'tenant_name',
    accessorKey: 'tenant_name',
    header: 'Organización',
    cell: ({ row }: any) => (
      <div>
        <div className="font-bold text-slate-900">{row.original.tenant_name}</div>
        <div className="text-[10px] font-mono text-indigo-600">{row.original.schema_name}</div>
      </div>
    ),
    meta: { mobileLabel: 'Organización' },
  },
  {
    id: 'plan_name',
    accessorKey: 'plan_name',
    header: 'Plan',
    cell: ({ row }: any) => <span className="font-semibold text-slate-700">{row.original.plan_name}</span>,
    meta: { mobileLabel: 'Plan' },
  },
  {
    id: 'allow_extra',
    accessorKey: 'allow_extra',
    header: 'Consumo Extra',
    cell: ({ row }: any) => (
      <div className="flex justify-center">
        <Badge variant={row.original.allow_extra ? 'success' : 'neutral'} size="sm">
          {row.original.allow_extra ? 'Habilitado' : 'Bloqueado'}
        </Badge>
      </div>
    ),
    meta: { align: 'center', mobileLabel: 'Consumo Extra' },
  },
  {
    id: 'tokens_limit',
    accessorKey: 'tokens_limit',
    header: 'Cuota Base',
    cell: ({ row }: any) => (
      <span className="font-mono font-medium">{formatNumber(row.original.tokens_limit)}</span>
    ),
    meta: { align: 'right', mobileLabel: 'Cuota Base' },
  },
  {
    id: 'tokens_overage_absorbed',
    accessorKey: 'tokens_overage_absorbed',
    header: 'Cortesía Absorbida',
    cell: ({ row }: any) => (
      <span className="font-mono font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
        +{formatNumber(row.original.tokens_overage_absorbed)}
      </span>
    ),
    meta: { align: 'right', mobileLabel: 'Cortesía Absorbida' },
  },
  {
    id: 'total_tokens_consumed',
    accessorKey: 'total_tokens_consumed',
    header: 'Consumo Total',
    cell: ({ row }: any) => (
      <span className="font-mono font-bold text-slate-900">{formatNumber(row.original.total_tokens_consumed)}</span>
    ),
    meta: { align: 'right', mobileLabel: 'Consumo Total' },
  },
  {
    id: 'next_renewal_date',
    accessorKey: 'next_renewal_date',
    header: 'Próximo Corte',
    cell: ({ row }: any) => (
      <span className="text-[11px] text-slate-500 whitespace-nowrap">
        {formatFriendlyDate(row.original.next_renewal_date)}
      </span>
    ),
    meta: { align: 'center', mobileLabel: 'Próximo Corte' },
  },
  {
    id: 'actions',
    header: 'Acción',
    cell: ({ row }: any) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="!text-indigo-600 hover:!text-indigo-800 !py-1 !px-2 gap-1 text-xs font-bold"
          onClick={() => {
            options.onInspectTenant({
              id: row.original.tenant_id,
              name: row.original.tenant_name,
              schema_name: row.original.schema_name,
              allow_extra: row.original.allow_extra,
            });
          }}
        >
          <span>Inspeccionar</span>
          <ChevronRight size={12} />
        </Button>
      </div>
    ),
    meta: { align: 'center', mobileLabel: 'Acción' },
  },
];
