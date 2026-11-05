import { UserCheck, Users } from 'lucide-react';
import type { ColumnDef } from '@shared/components/Table';
import Badge from '@shared/components/Badge';
import type { RecentTransaction } from '../schemas/myCompany.schema';
import {
  formatDateTime,
  getChannelMeta,
  getActionDisplay,
  formatNumber,
  formatTokensCompact,
} from './myCompany.helpers';

export const getInteractionHistoryColumns = (): ColumnDef<RecentTransaction, any>[] => [
  {
    id: 'fecha_procesamiento',
    accessorKey: 'fecha_procesamiento',
    header: 'Fecha / Hora',
    cell: ({ row }: any) => (
      <div className="py-0.5">
        <div className="font-mono text-[11px] text-slate-700 font-semibold">
          {formatDateTime(row.original.fecha_procesamiento)}
        </div>
      </div>
    ),
    meta: {
      mobileLabel: 'Fecha / Hora',
    },
  },
  {
    id: 'channel',
    accessorKey: 'channel',
    header: 'Canal',
    cell: ({ row }: any) => {
      const meta = getChannelMeta(row.original.channel);
      return (
        <Badge variant={meta.badgeVariant} size="sm">
          {meta.icon}
          <span>{meta.label}</span>
        </Badge>
      );
    },
    meta: {
      mobileLabel: 'Canal',
    },
  },
  {
    id: 'origen',
    header: 'Origen / Contacto',
    cell: ({ row }: any) => {
      const tx = row.original;
      return (
        <div>
          {tx.user_name ? (
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <UserCheck size={13} className="text-indigo-600 shrink-0" />
              <span className="truncate">Equipo: {tx.user_name}</span>
            </div>
          ) : tx.client_name ? (
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Users size={13} className="text-emerald-600 shrink-0" />
              <span className="truncate">Cliente: {tx.client_name}</span>
            </div>
          ) : (
            <span className="text-slate-500 text-[11px] font-medium">Base de Conocimiento</span>
          )}
          {tx.conversation_id && (
            <span className="text-[10px] font-mono text-slate-400 block truncate max-w-[140px]">
              Ref: {tx.conversation_id}
            </span>
          )}
        </div>
      );
    },
    meta: {
      mobileLabel: 'Origen',
    },
  },
  {
    id: 'accion',
    accessorKey: 'accion',
    header: 'Acción Realizada',
    cell: ({ row }: any) => {
      const actionInfo = getActionDisplay(row.original.accion);
      return (
        <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md border ${actionInfo.badgeClass}`}>
          {actionInfo.label}
        </span>
      );
    },
    meta: {
      mobileLabel: 'Acción',
    },
  },
  {
    id: 'total_tokens',
    accessorKey: 'total_tokens',
    header: 'Recursos',
    cell: ({ row }: any) => {
      const tx = row.original;
      return (
        <div className="text-right">
          <span
            className="font-mono font-bold text-slate-900 block"
            title={`Consultas: ${formatNumber(tx.prompt_tokens)} | Respuestas: ${formatNumber(tx.completion_tokens)}`}
          >
            {formatNumber(tx.total_tokens)}
          </span>
          <span className="text-[10px] text-slate-400">
            {formatTokensCompact(tx.prompt_tokens)} cons. / {formatTokensCompact(tx.completion_tokens)} resp.
          </span>
        </div>
      );
    },
    meta: {
      align: 'right',
      mobileLabel: 'Recursos',
    },
  },
  {
    id: 'is_extra',
    accessorKey: 'is_extra',
    header: 'Tipo de Cuota',
    cell: ({ row }: any) => (
      <div className="flex justify-center">
        {row.original.is_extra ? (
          <Badge variant="warning" size="sm">
            Consumo Extra
          </Badge>
        ) : (
          <Badge variant="success" size="sm">
            Cuota del Plan
          </Badge>
        )}
      </div>
    ),
    meta: {
      align: 'center',
      mobileLabel: 'Tipo de Cuota',
    },
  },
];
