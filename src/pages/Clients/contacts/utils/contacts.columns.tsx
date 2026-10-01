import type { ColumnDef } from '../../../../components/shared/Table';
import type { Client } from '../schemas/contacts.schema';
import { ClientCategory } from '../../../../core/models/Client';
import Badge from '../../../../components/shared/Badge';
import Button from '../../../../components/shared/Button';
import { Edit, UserCheck, UserX, Building, Mail, Phone } from 'lucide-react';

interface ContactsColumnsParams {
  onEdit: (client: Client) => void;
  onToggleStatus: (client: Client) => void;
  isAdmin: boolean;
}

const getCategoryBadgeVariant = (category?: string): 'info' | 'warning' | 'success' | 'neutral' => {
  switch (category) {
    case ClientCategory.CLIENTE:
      return 'success';
    case ClientCategory.LEAD:
      return 'warning';
    case ClientCategory.CONTACTO:
      return 'info';
    default:
      return 'neutral';
  }
};

/**
 * Obtiene las iniciales estilizadas para el avatar del contacto
 */
const getInitials = (name?: string, lastName?: string): string => {
  const n = (name || '').trim().charAt(0).toUpperCase();
  const l = (lastName || '').trim().charAt(0).toUpperCase();
  return `${n}${l}` || 'CL';
};

export const getContactsColumns = ({
  onEdit,
  onToggleStatus,
  isAdmin,
}: ContactsColumnsParams): ColumnDef<Client>[] => {
  return [
    {
      id: 'cliente',
      header: 'Contacto',
      accessorFn: (row) => `${row.nombre || ''} ${row.apellido || ''}`,
      cell: ({ row }) => {
        const client = row.original;
        const initials = getInitials(client.nombre, client.apellido);
        const isActive = client.estatus !== false;

        return (
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-2xs ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-slate-800 text-sm block truncate hover:text-indigo-600 transition-colors">
                {client.nombre} {client.apellido}
              </span>
              <span className="text-[11px] text-slate-400 block truncate font-medium">
                {client.puesto || 'Sin cargo asignado'}
              </span>
            </div>
          </div>
        );
      },
      meta: {
        mobileLabel: 'Contacto',
      },
    },
    {
      id: 'empresa',
      header: 'Empresa / Cuenta',
      accessorFn: (row) => row.company?.nombre || row.empresa || '',
      cell: ({ row }) => {
        const companyName = row.original.company?.nombre || row.original.empresa;

        if (!companyName) {
          return (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 italic">
              Independiente
            </span>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
              <Building size={12} />
            </div>
            <span className="text-xs font-semibold text-slate-700 truncate max-w-[180px]">
              {companyName}
            </span>
          </div>
        );
      },
      meta: {
        mobileLabel: 'Empresa',
      },
    },
    {
      accessorKey: 'correo',
      header: 'Comunicación',
      cell: ({ row }) => {
        const client = row.original;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Mail size={12} className="text-slate-400 shrink-0" />
              <a
                href={`mailto:${client.correo}`}
                className="truncate max-w-[200px] hover:text-indigo-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {client.correo}
              </a>
            </div>
            {client.telefono && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                <Phone size={11} className="text-slate-400 shrink-0" />
                <a
                  href={`tel:${client.telefono}`}
                  className="hover:text-indigo-600"
                  onClick={(e) => e.stopPropagation()}
                >
                  {client.telefono}
                </a>
              </div>
            )}
          </div>
        );
      },
      meta: {
        mobileLabel: 'Comunicación',
        hideOnMobile: true,
      },
    },
    {
      accessorKey: 'category',
      header: 'Categoría',
      cell: ({ getValue }) => {
        const category = getValue<string>() || ClientCategory.CONTACTO;
        return (
          <Badge variant={getCategoryBadgeVariant(category)} size="sm">
            {category}
          </Badge>
        );
      },
      meta: {
        mobileLabel: 'Categoría',
      },
    },
    {
      id: 'ejecutivo',
      header: 'Ejecutivo',
      accessorFn: (row) => row.ejecutivo?.username || '',
      cell: ({ row }) => {
        const executive = row.original.ejecutivo?.username;
        return (
          <span className="text-xs font-medium text-slate-600">
            {executive || <span className="text-slate-400 italic">Sin asignar</span>}
          </span>
        );
      },
      meta: {
        mobileLabel: 'Ejecutivo',
        hideOnMobile: true,
      },
    },
    {
      accessorKey: 'estatus',
      header: 'Estado',
      cell: ({ getValue }) => {
        const isActive = getValue<boolean>() !== false;
        return (
          <Badge
            variant={isActive ? 'success' : 'neutral'}
            dot
            size="sm"
          >
            {isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        );
      },
      meta: {
        mobileLabel: 'Estado',
      },
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => {
        const client = row.original;
        const isActive = client.estatus !== false;

        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="icon"
              onClick={() => onEdit(client)}
              className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 !p-1.5"
              title="Editar contacto"
            >
              <Edit size={15} />
            </Button>

            {isAdmin && (
              <Button
                variant="icon"
                onClick={() => onToggleStatus(client)}
                className={
                  isActive
                    ? 'text-slate-500 hover:text-red-600 hover:bg-red-50 !p-1.5'
                    : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 !p-1.5'
                }
                title={isActive ? 'Desactivar contacto' : 'Activar contacto'}
              >
                {isActive ? <UserX size={15} /> : <UserCheck size={15} />}
              </Button>
            )}
          </div>
        );
      },
      meta: {
        mobileLabel: 'Acciones',
      },
    },
  ];
};
