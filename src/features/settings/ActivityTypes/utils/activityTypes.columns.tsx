import { Edit2, Trash2, Tag } from 'lucide-react';
import type { ColumnDef } from '@shared/components/Table';
import Button from '@shared/components/Button';
import Badge from '@shared/components/Badge';
import type { TypeActivity } from '../schemas/activityTypes.schema';
import { getActivityColor } from '../../../../utils/activityColors';

interface ActivityTypesColumnsCallbacks {
  onEdit: (type: TypeActivity) => void;
  onDelete: (type: TypeActivity) => void;
}

export const getActivityTypesColumns = ({
  onEdit,
  onDelete,
}: ActivityTypesColumnsCallbacks): ColumnDef<TypeActivity, unknown>[] => [
  {
    id: 'strname',
    accessorKey: 'strname',
    header: 'Tipo de Actividad',
    cell: ({ row }) => {
      const type = row.original;
      const color = getActivityColor(type.strname);

      return (
        <div className="flex items-center gap-3 py-1">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs"
            style={{
              backgroundColor: color.bg,
              borderColor: color.border,
              color: color.text,
            }}
            title={`Color en agenda: ${type.strname}`}
          >
            <Tag size={15} />
          </div>
          <span className="font-bold text-slate-800 text-sm">
            {type.strname}
          </span>
        </div>
      );
    },
    meta: {
      mobileLabel: 'Tipo de Actividad',
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
      headerClassName: 'w-44 text-center',
      cellClassName: 'w-44 text-center',
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => {
      const type = row.original;
      return (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(type);
            }}
            className="hover:!text-indigo-600 hover:!bg-indigo-50 !rounded-lg"
            title="Editar tipo"
            aria-label={`Editar ${type.strname}`}
          >
            <Edit2 size={16} />
          </Button>
          <Button
            variant="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(type);
            }}
            className="hover:!text-rose-600 hover:!bg-rose-50 !rounded-lg"
            title="Eliminar tipo"
            aria-label={`Eliminar ${type.strname}`}
          >
            <Trash2 size={16} />
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
