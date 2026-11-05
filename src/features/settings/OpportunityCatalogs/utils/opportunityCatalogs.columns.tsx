import { Edit2, Trash2, Tag, FolderKanban } from 'lucide-react';
import type { ColumnDef } from '@shared/components/Table';
import Button from '@shared/components/Button';
import Badge from '@shared/components/Badge';
import type { OpportunityCatalogOption } from '../schemas/opportunityCatalogs.schema';

interface OpportunityCatalogsColumnsCallbacks {
  onEdit: (option: OpportunityCatalogOption) => void;
  onDelete: (option: OpportunityCatalogOption) => void;
  onToggleStatus: (option: OpportunityCatalogOption) => void;
  onViewOpportunities: (option: OpportunityCatalogOption) => void;
}

export const getOpportunityCatalogsColumns = ({
  onEdit,
  onDelete,
  onToggleStatus,
  onViewOpportunities,
}: OpportunityCatalogsColumnsCallbacks): ColumnDef<OpportunityCatalogOption, unknown>[] => [
  {
    id: 'strname',
    accessorKey: 'strname',
    header: 'Nombre de la Opción',
    cell: ({ row }) => {
      const option = row.original;
      return (
        <div className="flex items-center gap-3 py-1">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
            <Tag size={15} />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold text-slate-800 text-sm">
              {option.strname}
            </span>
          </div>
        </div>
      );
    },
    meta: {
      mobileLabel: 'Nombre de Opción',
      headerClassName: 'text-left',
      cellClassName: 'text-left',
    },
  },
  {
    id: 'opportunities',
    header: 'Uso en Oportunidades',
    cell: ({ row }) => {
      const option = row.original;
      const count = option.opportunities?.length ?? 0;
      const hasOpportunities = count > 0;

      if (hasOpportunities) {
        return (
          <Button
            type="button"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onViewOpportunities(option);
            }}
            className="!inline-flex !items-center !gap-1.5 !px-2.5 !py-1 !rounded-lg !text-xs !font-bold !text-indigo-600 hover:!text-indigo-800 hover:!bg-indigo-50/80 transition-all border border-indigo-100/80 shadow-2xs cursor-pointer"
            title="Ver oportunidades asociadas"
          >
            <FolderKanban size={13} className="text-indigo-500 shrink-0" />
            <span>Ver Oportunidades ({count})</span>
          </Button>
        );
      }

      if (option.isUsed) {
        return (
          <Badge variant="indigo" size="sm" className="font-bold shadow-2xs">
            En Uso
          </Badge>
        );
      }

      return (
        <Badge variant="neutral" size="sm" className="font-medium">
          Sin Asignar
        </Badge>
      );
    },
    meta: {
      mobileLabel: 'Uso en Oportunidades',
      align: 'center',
      headerClassName: 'w-52 text-center',
      cellClassName: 'w-52 text-center',
    },
  },
  {
    id: 'blnstatus',
    accessorKey: 'blnstatus',
    header: 'Estado',
    cell: ({ row }) => {
      const option = row.original;
      const isActive = option.blnstatus;

      return (
        <div className="flex items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus(option);
            }}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isActive ? 'bg-indigo-600' : 'bg-slate-200'
            }`}
            title={isActive ? 'Desactivar opción' : 'Activar opción'}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                isActive ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
          <Badge
            variant={isActive ? 'success' : 'neutral'}
            size="sm"
            dot
            className="font-bold shadow-2xs"
          >
            {isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
      );
    },
    meta: {
      mobileLabel: 'Estado',
      align: 'center',
      headerClassName: 'w-44 text-center',
      cellClassName: 'w-44 text-center',
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => {
      const option = row.original;
      const isInUse = Boolean(option.isUsed || (option.opportunities && option.opportunities.length > 0));

      return (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(option);
            }}
            className="hover:!text-indigo-600 hover:!bg-indigo-50 !rounded-lg"
            title="Editar nombre de la opción"
            aria-label={`Editar ${option.strname}`}
          >
            <Edit2 size={16} />
          </Button>

          <div className="relative group inline-block">
            <Button
              variant="icon"
              onClick={(e) => {
                e.stopPropagation();
                if (!isInUse) {
                  onDelete(option);
                }
              }}
              disabled={isInUse}
              className={`!rounded-lg ${
                isInUse
                  ? '!text-slate-300 !cursor-not-allowed hover:!bg-transparent'
                  : 'hover:!text-rose-600 hover:!bg-rose-50'
              }`}
              title={isInUse ? undefined : 'Eliminar opción'}
              aria-label={`Eliminar ${option.strname}`}
            >
              <Trash2 size={16} />
            </Button>
            {isInUse && (
              <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-900/95 backdrop-blur-xs text-white text-[10px] p-2 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 text-center font-medium leading-normal z-30 select-none">
                No se puede eliminar porque está en uso en oportunidades. Desactívala para archivarla.
                <div className="absolute top-full right-3 border-4 border-transparent border-t-slate-900/95" />
              </div>
            )}
          </div>
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
