import React, { useMemo, useState } from 'react';
import { Edit, Trash2, Bell } from 'lucide-react';
import type { Activity } from '../../core/models/Activity';
import Table, { type ColumnDef } from '../shared/Table';

interface Props {
  activities: Activity[];
  onEdit: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  totalCount: number;
  filteredCount: number;
  maxHeight?: string;
  loading?: boolean;
}

/* ── Badge de Proveedor Externo ── */
const ExternalProviderBadge: React.FC<{ provider?: string | null }> = ({ provider }) => {
  if (!provider) return null;
  if (provider === 'google') {
    return (
      <span className="shrink-0 flex" title="Sincronizado con Google Calendar">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.47-.47-.83-1.03-1.03-1.63z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
        </svg>
      </span>
    );
  }
  if (provider === 'outlook') {
    return (
      <span className="shrink-0 flex" title="Sincronizado con Outlook">
        <svg className="w-3.5 h-3.5" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="10.5" height="10.5" fill="#F25022"/>
          <rect x="12.5" y="0" width="10.5" height="10.5" fill="#7FBA00"/>
          <rect x="0" y="12.5" width="10.5" height="10.5" fill="#00A4EF"/>
          <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900"/>
        </svg>
      </span>
    );
  }
  if (provider === 'icloud') {
    return (
      <span className="shrink-0 flex" title="Sincronizado con iCloud">
        <svg className="w-3.5 h-3.5 text-sky-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.5 19A5.5 5.5 0 0 0 19 8.2c-.3 0-.6 0-.9.1A8 8 0 0 0 3 11.5c0 .3 0 .6.1.9A6 6 0 0 0 5.5 24H17.5z" fill="#0EA5E9" opacity="0.1" />
          <path d="M17.5 19A5.5 5.5 0 0 0 19 8.2c-.3 0-.6 0-.9.1A8 8 0 0 0 3 11.5c0 .3 0 .6.1.9A6 6 0 0 0 5.5 24H17.5z" stroke="#0EA5E9" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  return null;
};

/* ── Celda Interactiva de Recordatorio con Campanita y Tooltip ── */
const ActivityReminderCell: React.FC<{ reminder?: Activity['reminder'] }> = ({ reminder }) => {
  const [activeTooltip, setActiveTooltip] = useState(false);

  if (!reminder) {
    return <div className="hidden md:block w-full h-full min-h-[18px]" />;
  }

  return (
    <div
      className="relative group flex flex-col md:flex-row md:items-center md:justify-center cursor-pointer select-none w-full md:w-auto"
      onClick={(e) => {
        e.stopPropagation();
        if (window.innerWidth >= 768) {
          setActiveTooltip((prev) => !prev);
        }
      }}
      onMouseLeave={() => setActiveTooltip(false)}
    >
      <div className="flex items-center">
        <span className="md:hidden font-semibold text-xs text-gray-500 uppercase tracking-wider mr-2">
          Recordatorio:
        </span>
        <div className="p-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full transition-all duration-200 shadow-xs flex items-center justify-center hover:scale-105 active:scale-95 w-fit">
          <Bell
            size={15}
            className="text-amber-600 md:animate-[swing_1s_ease-in-out_infinite] md:origin-top"
          />
        </div>
      </div>

      {/* Vista inline exclusiva para móvil */}
      <div className="md:hidden mt-2 bg-amber-50/70 border border-amber-200/50 rounded-xl p-3 text-xs text-amber-900 w-full max-w-xs shadow-xs flex flex-col gap-1.5">
        <div className="font-bold text-amber-800 uppercase tracking-wider text-[9px] flex items-center gap-1.5">
          <Bell size={10} className="text-amber-600" />
          Recordatorio Activo
        </div>
        <div className="font-semibold text-amber-950 break-words whitespace-normal leading-snug">
          {reminder.title}
        </div>
        <div className="text-[10px] text-amber-700 font-medium">
          {new Date(reminder.date).toLocaleString('es-MX', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>

      {/* Tooltip con información del recordatorio (exclusivo para desktop) */}
      <div
        className={`hidden md:flex absolute bottom-full mb-2 ${
          activeTooltip ? 'md:flex' : 'md:hidden'
        } group-hover:md:flex flex-col bg-slate-900 text-white text-xs rounded-lg py-2.5 px-3 shadow-xl z-50 w-72 pointer-events-none right-[-20px] border border-slate-700/50`}
      >
        <div className="font-bold text-amber-400 border-b border-slate-700 pb-1 mb-1.5 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
          <Bell size={10} className="text-amber-400" />
          Recordatorio Activo
        </div>
        <div className="font-semibold text-slate-100 break-words whitespace-normal leading-snug">
          {reminder.title}
        </div>
        <div className="text-[10px] text-slate-400 mt-1.5 font-medium">
          {new Date(reminder.date).toLocaleString('es-MX', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
        <div className="absolute top-full right-[32px] border-4 border-transparent border-t-slate-900" />
      </div>
    </div>
  );
};

const ActivitiesTable: React.FC<Props> = ({
  activities,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  totalCount,
  filteredCount,
  maxHeight,
  loading = false,
}) => {
  const columns = useMemo<ColumnDef<Activity>[]>(
    () => [
      {
        id: 'activity',
        accessorKey: 'activity',
        header: 'Actividad',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="flex-1 font-medium text-gray-900">{row.original.activity}</span>
            <ExternalProviderBadge provider={row.original.externalProvider} />
          </div>
        ),
        meta: {
          mobileLabel: 'Actividad',
        },
      },
      {
        id: 'tipo',
        header: 'Tipo',
        accessorFn: (act) => act.typeActivity?.strname || 'N/A',
        cell: ({ row }) => (
          <p className="text-gray-600">{row.original.typeActivity?.strname || 'N/A'}</p>
        ),
        meta: {
          mobileLabel: 'Tipo',
        },
      },
      {
        id: 'fecha',
        accessorKey: 'date',
        header: 'Fecha',
        cell: ({ row }) => (
          <p className="text-gray-600">{new Date(row.original.date).toLocaleString()}</p>
        ),
        meta: {
          mobileLabel: 'Fecha',
        },
      },
      {
        id: 'usuario',
        header: 'Usuario',
        accessorFn: (act) => act.user?.username || '',
        cell: ({ row }) => (
          <p className="text-gray-600">{row.original.user?.username || 'Sin asignar'}</p>
        ),
        meta: {
          mobileLabel: 'Usuario',
          hideOnMobile: true,
        },
      },
      {
        id: 'relacion',
        header: 'Relación',
        accessorFn: (act) =>
          act.company?.nombre || (act.client ? `${act.client.nombre} ${act.client.apellido}` : ''),
        cell: ({ row }) => {
          const act = row.original;
          if (act.company) {
            return <p className="font-semibold text-gray-800">Empresa: {act.company.nombre}</p>;
          }
          if (act.client) {
            return (
              <p className="text-gray-600">
                Contacto: {act.client.nombre} {act.client.apellido}
              </p>
            );
          }
          return <span className="text-gray-400 italic">-</span>;
        },
        meta: {
          mobileLabel: 'Relación',
          hideOnMobile: true,
        },
      },
      {
        id: 'oportunidad',
        header: 'Oportunidad',
        accessorFn: (act) => act.opportunity?.nombre_proyecto || '',
        cell: ({ row }) => (
          <p className="text-gray-600">{row.original.opportunity?.nombre_proyecto || '-'}</p>
        ),
        meta: {
          mobileLabel: 'Oportunidad',
          hideOnMobile: true,
        },
      },
      {
        id: 'reminder',
        header: '',
        enableSorting: false,
        cell: ({ row }) => <ActivityReminderCell reminder={row.original.reminder} />,
        meta: {
          mobileLabel: 'Recordatorio',
          hideOnMobile: true,
          align: 'center',
          headerClassName: 'w-12',
        },
      },
      {
        id: 'actions',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => {
          const act = row.original;
          return (
            <div className="flex space-x-1 justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(act);
                }}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors cursor-pointer"
                title="Editar"
              >
                <Edit size={18} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(act);
                }}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors cursor-pointer"
                title="Eliminar"
              >
                <Trash2 size={18} />
              </button>
            </div>
          );
        },
        meta: {
          align: 'right',
          headerClassName: 'text-right',
        },
      },
    ],
    [onEdit, onDelete]
  );

  return (
    <Table
      data={activities}
      columns={columns}
      variant="cards"
      loading={loading}
      keyExtractor={(act) => act.id!}
      emptyTitle="No se encontraron actividades"
      emptyMessage="Intenta ajustar los filtros o crear una nueva actividad."
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
      pageSize={pageSize}
      onPageSizeChange={onPageSizeChange}
      totalCount={totalCount}
      filteredCount={filteredCount}
      maxHeight={maxHeight}
      containerClassName="pb-8"
    />
  );
};

export default ActivitiesTable;
