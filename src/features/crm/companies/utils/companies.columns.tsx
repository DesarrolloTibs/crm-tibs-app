import type { ColumnDef } from '@shared/components/Table';
import type { Company } from '../schemas/companies.schema';
import Badge from '@shared/components/Badge';
import Button from '@shared/components/Button';
import {
  Edit,
  CheckCircle2,
  XCircle,
  Building2,
  Globe,
  Mail,
  Phone,
  Users,
} from 'lucide-react';

interface CompaniesColumnsParams {
  onEdit: (company: Company) => void;
  onToggleStatus: (company: Company) => void;
  isAdmin: boolean;
}

export const getCompaniesColumns = ({
  onEdit,
  onToggleStatus,
  isAdmin,
}: CompaniesColumnsParams): ColumnDef<Company>[] => {
  return [
    {
      id: 'empresa',
      header: 'Empresa / Cuenta B2B',
      accessorKey: 'nombre',
      cell: ({ row }) => {
        const company = row.original;
        const isActive = company.estatus !== false;

        return (
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-2xs ${
                isActive
                  ? 'bg-violet-50 text-violet-700 border border-violet-100'
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}
            >
              <Building2 size={16} />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-slate-800 text-sm block truncate hover:text-indigo-600 transition-colors">
                {company.nombre}
              </span>
              <span className="text-[11px] text-slate-400 block truncate font-medium">
                {company.direccion || 'Sin dirección fiscal registrada'}
              </span>
            </div>
          </div>
        );
      },
      meta: {
        mobileLabel: 'Empresa',
      },
    },
    {
      id: 'contactos',
      header: 'Contactos',
      accessorFn: (row) => row.contacts?.length || 0,
      cell: ({ row }) => {
        const count = row.original.contacts?.length || 0;
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
              <Users size={11} />
            </div>
            <span className="text-xs font-semibold text-slate-700">
              {count > 0 ? `${count} ${count === 1 ? 'contacto' : 'contactos'}` : 'Sin contactos'}
            </span>
          </div>
        );
      },
      meta: {
        mobileLabel: 'Contactos',
      },
    },
    {
      id: 'comunicacion',
      header: 'Contacto Corporativo',
      cell: ({ row }) => {
        const company = row.original;
        return (
          <div className="space-y-1">
            {company.correo && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Mail size={12} className="text-slate-400 shrink-0" />
                <a
                  href={`mailto:${company.correo}`}
                  className="truncate max-w-[200px] hover:text-indigo-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {company.correo}
                </a>
              </div>
            )}
            {company.telefono && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                <Phone size={11} className="text-slate-400 shrink-0" />
                <a
                  href={`tel:${company.telefono}`}
                  className="hover:text-indigo-600"
                  onClick={(e) => e.stopPropagation()}
                >
                  {company.telefono}
                </a>
              </div>
            )}
            {!company.correo && !company.telefono && (
              <span className="text-xs text-slate-400 italic">No especificado</span>
            )}
          </div>
        );
      },
      meta: {
        mobileLabel: 'Contacto',
        hideOnMobile: true,
      },
    },
    {
      accessorKey: 'website',
      header: 'Sitio Web',
      cell: ({ getValue }) => {
        const website = getValue<string>();
        if (!website) {
          return <span className="text-xs text-slate-400 italic">-</span>;
        }

        const href = website.startsWith('http') ? website : `https://${website}`;

        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-medium truncate max-w-[160px]"
          >
            <Globe size={12} className="shrink-0" />
            <span className="truncate">{website.replace(/^https?:\/\//, '')}</span>
          </a>
        );
      },
      meta: {
        mobileLabel: 'Sitio Web',
        hideOnMobile: true,
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
            {isActive ? 'Activa' : 'Inactiva'}
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
        const company = row.original;
        const isActive = company.estatus !== false;

        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="icon"
              onClick={() => onEdit(company)}
              className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 !p-1.5"
              title="Editar empresa"
            >
              <Edit size={15} />
            </Button>

            {isAdmin && (
              <Button
                variant="icon"
                onClick={() => onToggleStatus(company)}
                className={
                  isActive
                    ? 'text-slate-500 hover:text-red-600 hover:bg-red-50 !p-1.5'
                    : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 !p-1.5'
                }
                title={isActive ? 'Suspender empresa' : 'Reactivar empresa'}
              >
                {isActive ? <XCircle size={15} /> : <CheckCircle2 size={15} />}
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
