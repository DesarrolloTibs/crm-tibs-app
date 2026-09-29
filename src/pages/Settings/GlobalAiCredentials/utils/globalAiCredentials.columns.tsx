import React from 'react';
import { Settings, Sparkles, Cpu, Server, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import type { ColumnDef } from '../../../../components/shared/Table';
import Button from '../../../../components/shared/Button';
import Badge from '../../../../components/shared/Badge';
import type { LlmProviderItem } from '../schemas/globalAiCredentials.schema';

interface GlobalAiColumnsCallbacks {
  onConfigure: (provider: LlmProviderItem) => void;
  onSetDefault: (provider: LlmProviderItem) => void;
}

export const getGlobalAiColumns = ({
  onConfigure,
  onSetDefault,
}: GlobalAiColumnsCallbacks): ColumnDef<LlmProviderItem, unknown>[] => [
  {
    id: 'provider',
    accessorKey: 'name',
    header: 'Proveedor & Motor',
    cell: ({ row }) => {
      const item = row.original;

      const getIcon = () => {
        if (item.id === 'gemini') {
          return (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-100 border border-blue-200/80 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
              <Sparkles size={18} />
            </div>
          );
        }
        if (item.id === 'openai') {
          return (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-100 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
              <Cpu size={18} />
            </div>
          );
        }
        return (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-50 to-blue-100 border border-sky-200/80 flex items-center justify-center text-sky-700 shrink-0 shadow-2xs">
            <Server size={18} />
          </div>
        );
      };

      return (
        <div className="flex items-center gap-3 py-1 text-left">
          {getIcon()}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-sm">{item.name}</span>
            </div>
            <span className="text-[11px] text-slate-400 block line-clamp-1">
              {item.vendor}
            </span>
          </div>
        </div>
      );
    },
    meta: {
      mobileLabel: 'Proveedor',
      headerClassName: 'text-left min-w-[220px]',
      cellClassName: 'text-left min-w-[220px]',
    },
  },
  {
    id: 'modelName',
    accessorKey: 'modelName',
    header: 'Modelo de Inferencia',
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex flex-col items-start gap-1 py-1">
          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100/90 border border-slate-200 px-2 py-0.5 rounded-md">
            {item.modelName}
          </span>
          {item.isDefault && (
            <span className="text-[10px] text-indigo-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Inferencia Activa
            </span>
          )}
        </div>
      );
    },
    meta: {
      mobileLabel: 'Modelo',
      headerClassName: 'text-left min-w-[170px]',
      cellClassName: 'text-left min-w-[170px]',
    },
  },
  {
    id: 'credentialsStatus',
    header: 'Estado de Credenciales',
    cell: ({ row }) => {
      const item = row.original;
      if (item.hasCredentials) {
        return (
          <div className="flex flex-col items-start gap-0.5">
            <Badge variant="success" size="sm" dot className="font-bold shadow-2xs">
              Conectado
            </Badge>
            {item.keyMasked && (
              <span className="text-[10px] font-mono text-slate-400">
                {item.keyMasked}
              </span>
            )}
          </div>
        );
      }
      return (
        <div className="flex flex-col items-start gap-0.5">
          <Badge variant="warning" size="sm" dot className="font-bold shadow-2xs">
            Sin Credenciales
          </Badge>
          <span className="text-[10px] text-amber-600/80">Requiere API Key</span>
        </div>
      );
    },
    meta: {
      mobileLabel: 'Credenciales',
      headerClassName: 'text-left min-w-[150px]',
      cellClassName: 'text-left min-w-[150px]',
    },
  },
  {
    id: 'role',
    header: 'Rol en Plataforma',
    cell: ({ row }) => {
      const item = row.original;
      if (item.isDefault) {
        return (
          <Badge variant="indigo" size="sm" dot className="font-bold shadow-2xs">
            Motor Principal Activo
          </Badge>
        );
      }

      return (
        <div className="flex items-center gap-1.5">
          <Badge variant="neutral" size="sm" className="font-semibold">
            Standby
          </Badge>
          {item.hasCredentials && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSetDefault(item);
              }}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-0.5 ml-1 transition-colors"
              title="Establecer como motor principal del CRM"
            >
              <span>Activar</span>
              <ArrowRight size={11} />
            </button>
          )}
        </div>
      );
    },
    meta: {
      mobileLabel: 'Rol',
      headerClassName: 'text-left min-w-[170px]',
      cellClassName: 'text-left min-w-[170px]',
    },
  },
  {
    id: 'embeddings',
    header: 'Embeddings / Parámetros',
    cell: ({ row }) => {
      const item = row.original;
      if (item.id === 'openai') {
        return (
          <div className="text-left py-1 text-xs">
            <span className="text-[11px] font-mono text-slate-600 block">
              {item.embeddingModel || 'text-embedding-ada-002'}
            </span>
            {item.endpoint ? (
              <span className="text-[10px] text-indigo-600 truncate block max-w-[160px]" title={item.endpoint}>
                Azure: {item.endpoint.replace('https://', '')}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">OpenAI Directo</span>
            )}
          </div>
        );
      }

      if (item.id === 'watsonx') {
        return (
          <div className="text-left py-1 text-xs">
            <span className="text-[11px] font-mono text-slate-600 block">
              {item.embeddingModel || 'ibm/slate-125m-english-rtrvr'}
            </span>
            <span className="text-[10px] text-slate-400">
              Región: {item.region || 'us-south'}
            </span>
          </div>
        );
      }

      return (
        <div className="text-left py-1 text-xs">
          <span className="text-[11px] text-slate-500">Nativo Multimodal</span>
          <span className="text-[10px] text-slate-400 block">Google AI Studio</span>
        </div>
      );
    },
    meta: {
      mobileLabel: 'Embeddings',
      headerClassName: 'text-left min-w-[180px]',
      cellClassName: 'text-left min-w-[180px]',
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onConfigure(item);
            }}
            className="!py-1.5 !px-3 !text-xs !font-bold gap-1.5 shadow-2xs hover:!border-indigo-300 hover:!text-indigo-700"
            title={`Configurar credenciales para ${item.name}`}
          >
            <Settings size={13} className="text-slate-500" />
            <span>Configurar</span>
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
