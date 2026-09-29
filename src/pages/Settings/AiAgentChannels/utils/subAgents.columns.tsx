import { Edit2, Trash2, Sliders, Power } from 'lucide-react';
import type { ColumnDef } from '../../../../components/shared/Table';
import Button from '../../../../components/shared/Button';
import Badge from '../../../../components/shared/Badge';
import type { SubAgent } from '../schemas/aiAgent.schema';

interface SubAgentsColumnsCallbacks {
  onEdit: (agent: SubAgent) => void;
  onDelete: (agent: SubAgent) => void;
  onToggleStatus: (agent: SubAgent) => void;
}

export const getSubAgentsColumns = ({
  onEdit,
  onDelete,
  onToggleStatus,
}: SubAgentsColumnsCallbacks): ColumnDef<SubAgent, unknown>[] => [
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Sub-Agente',
    cell: ({ row }) => {
      const agent = row.original;
      return (
        <div className="flex items-center gap-3 py-1">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs transition-colors ${
              agent.isActive
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
          >
            <Sliders size={17} />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-slate-800 text-sm block truncate">
              {agent.name}
            </span>
            <span className="text-[10px] font-mono text-slate-400 block truncate">
              {agent.key}
            </span>
          </div>
        </div>
      );
    },
    meta: {
      mobileLabel: 'Sub-Agente',
      headerClassName: 'text-left',
      cellClassName: 'text-left',
    },
  },
  {
    id: 'description',
    accessorKey: 'description',
    header: 'Propósito y Directiva',
    cell: ({ row }) => {
      const agent = row.original;
      return (
        <p className="text-xs text-slate-600 line-clamp-2 max-w-sm leading-relaxed" title={agent.description}>
          {agent.description || <span className="text-slate-400 italic">Sin descripción</span>}
        </p>
      );
    },
    meta: {
      mobileLabel: 'Directiva',
      headerClassName: 'text-left',
      cellClassName: 'text-left',
    },
  },
  {
    id: 'tools',
    header: 'Herramientas',
    cell: ({ row }) => {
      const tools = row.original.tools || [];
      if (tools.length === 0) {
        return <span className="text-[11px] text-slate-400 italic">Conversacional puro</span>;
      }
      return (
        <div className="flex flex-wrap gap-1 max-w-[220px]">
          {tools.slice(0, 2).map((toolKey) => (
            <span
              key={toolKey}
              className="text-[9px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100 truncate max-w-[90px]"
              title={toolKey}
            >
              {toolKey
                .replace('createOpportunity', 'Crear Opp')
                .replace('modifyOpportunity', 'Mod Opp')
                .replace('registerContact', 'Reg Contacto')
                .replace('updateContact', 'Act Contacto')
                .replace('checkAvailability', 'Disponibilidad')
                .replace('createActivity', 'Actividad')
                .replace('createTicket', 'Ticket')
                .replace('consult_product_catalog', 'Catálogo')}
            </span>
          ))}
          {tools.length > 2 && (
            <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md border border-slate-200">
              +{tools.length - 2}
            </span>
          )}
        </div>
      );
    },
    meta: {
      mobileLabel: 'Herramientas',
      headerClassName: 'text-left',
      cellClassName: 'text-left',
    },
  },
  {
    id: 'temperature',
    header: 'Temperatura',
    cell: ({ row }) => {
      const temp = row.original.temperature ?? 0.7;
      return (
        <span
          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg"
          title={`Temperatura: ${temp}`}
        >
          🌡 {temp}
        </span>
      );
    },
    meta: {
      mobileLabel: 'Temperatura',
      align: 'center',
      headerClassName: 'w-28 text-center',
      cellClassName: 'w-28 text-center',
    },
  },
  {
    id: 'isActive',
    header: 'Estado',
    cell: ({ row }) => {
      const isActive = row.original.isActive;
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
      headerClassName: 'w-28 text-center',
      cellClassName: 'w-28 text-center',
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => {
      const agent = row.original;
      return (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="icon"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus(agent);
            }}
            className={`hover:!bg-slate-100 !rounded-lg ${
              agent.isActive ? 'text-emerald-600 hover:text-emerald-700' : 'text-slate-400 hover:text-slate-600'
            }`}
            title={agent.isActive ? 'Desactivar sub-agente' : 'Activar sub-agente'}
            aria-label="Conmutar estado"
          >
            <Power size={15} />
          </Button>
          <Button
            variant="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(agent);
            }}
            className="hover:!text-indigo-600 hover:!bg-indigo-50 !rounded-lg"
            title="Editar sub-agente"
            aria-label={`Editar ${agent.name}`}
          >
            <Edit2 size={15} />
          </Button>
          <Button
            variant="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(agent);
            }}
            className="hover:!text-rose-600 hover:!bg-rose-50 !rounded-lg"
            title="Eliminar sub-agente"
            aria-label={`Eliminar ${agent.name}`}
          >
            <Trash2 size={15} />
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
