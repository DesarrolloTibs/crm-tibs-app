import React, { useState } from 'react';
import type { ColumnDef } from '../../../components/shared/Table';
import type { Activity } from '../schemas/activities.schema';
import Button from '../../../components/shared/Button';
import { getActivityColor } from '../../../utils/activityColors';
import { Edit, Trash2, Bell, Building, User, Calendar, Briefcase } from 'lucide-react';

interface ActivitiesColumnsParams {
  onEdit: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
}

/* ── Badge de Proveedor de Calendario Externo ── */
export const ExternalProviderBadge: React.FC<{ provider?: string | null }> = ({ provider }) => {
  if (!provider) return null;
  if (provider === 'google') {
    return (
      <span className="shrink-0 flex items-center" title="Sincronizado con Google Calendar">
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
      <span className="shrink-0 flex items-center" title="Sincronizado con Microsoft Outlook">
        <svg className="w-3.5 h-3.5" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="10.5" height="10.5" fill="#F25022"/>
          <rect x="12.5" y="0" width="10.5" height="10.5" fill="#7FBA00"/>
          <rect x="0" y="12.5" width="10.5" height="10.5" fill="#00A4EF"/>
          <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900"/>
        </svg>
      </span>
    );
  }
  return null;
};

/* ── Celda Interactiva de Recordatorio con Campanita y Tooltip ── */
export const ActivityReminderCell: React.FC<{
  reminder?: Activity['reminder'];
}> = ({ reminder }) => {
  const [activeTooltip, setActiveTooltip] = useState(false);

  if (!reminder) {
    return <div className="hidden md:block w-full h-full min-h-[18px]" />;
  }

  return (
    <div
      className={`relative group flex flex-col md:flex-row md:items-center md:justify-center cursor-pointer select-none w-full md:w-auto hover:z-30 ${
        activeTooltip ? 'z-30' : ''
      }`}
      onClick={(e) => {
        e.stopPropagation();
        if (window.innerWidth >= 768) {
          setActiveTooltip((prev) => !prev);
        }
      }}
      onMouseLeave={() => setActiveTooltip(false)}
    >
      <div className="flex items-center">
        <span className="md:hidden font-semibold text-xs text-slate-500 uppercase tracking-wider mr-2">
          Recordatorio:
        </span>
        <div className="p-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all duration-200 shadow-2xs flex items-center justify-center hover:scale-105 active:scale-95 w-fit">
          <Bell
            size={14}
            className="text-amber-600 md:animate-[swing_1s_ease-in-out_infinite] md:origin-top"
          />
        </div>
      </div>

      {/* Vista inline exclusiva para móvil */}
      <div className="md:hidden mt-2 bg-amber-50/80 border border-amber-200/60 rounded-xl p-3 text-xs text-amber-950 w-full max-w-xs shadow-2xs flex flex-col gap-1.5">
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

      {/* Tooltip con información del recordatorio (exclusivo desktop: lateral izquierdo) */}
      <div
        className={`hidden md:flex absolute right-full mr-3 top-1/2 -translate-y-1/2 ${
          activeTooltip ? 'md:flex' : 'md:hidden'
        } group-hover:md:flex flex-col bg-slate-900 text-white text-xs rounded-xl py-2.5 px-3.5 shadow-2xl z-50 w-72 pointer-events-none border border-slate-700/60`}
      >
        <div className="font-bold text-amber-400 border-b border-slate-700/80 pb-1 mb-1.5 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
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
        {/* Flechita apuntando a la campanita a la derecha */}
        <div className="absolute top-1/2 -translate-y-1/2 left-full border-4 border-transparent border-l-slate-900" />
      </div>
    </div>
  );
};

export const getActivitiesColumns = ({
  onEdit,
  onDelete,
}: ActivitiesColumnsParams): ColumnDef<Activity>[] => {
  return [
    {
      id: 'activity',
      header: 'Actividad',
      accessorKey: 'activity',
      cell: ({ row }) => {
        const act = row.original;
        const color = getActivityColor(act.typeActivity?.strname);

        return (
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5 border"
              style={{
                backgroundColor: color.bg,
                borderColor: color.border,
                color: color.text,
              }}
            >
              <Calendar size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm block truncate hover:text-indigo-600 transition-colors">
                  {act.activity}
                </span>
                <ExternalProviderBadge provider={act.externalProvider} />
              </div>
              {act.reminder && (
                <span className="text-[11px] text-amber-600 block truncate font-medium flex items-center gap-1 mt-0.5">
                  <Bell size={10} />
                  {act.reminder.title}
                </span>
              )}
            </div>
          </div>
        );
      },
      meta: {
        mobileLabel: 'Actividad',
      },
    },
    {
      id: 'tipo',
      header: 'Tipo',
      accessorFn: (act) => act.typeActivity?.strname || 'N/A',
      cell: ({ row }) => {
        const typeName = row.original.typeActivity?.strname || 'Sin tipo';
        const color = getActivityColor(typeName);

        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border"
            style={{
              backgroundColor: color.bg,
              color: color.text,
              borderColor: color.border,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color.text }} />
            {typeName}
          </span>
        );
      },
      meta: {
        mobileLabel: 'Tipo',
      },
    },
    {
      id: 'fecha',
      header: 'Fecha & Hora',
      accessorKey: 'date',
      cell: ({ row }) => {
        const dateStr = row.original.date;
        if (!dateStr) return <span className="text-slate-400 italic">-</span>;

        const date = new Date(dateStr);
        return (
          <div className="space-y-0.5 text-xs text-slate-600">
            <span className="font-semibold block text-slate-800">
              {date.toLocaleDateString('es-MX', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {date.toLocaleTimeString('es-MX', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        );
      },
      meta: {
        mobileLabel: 'Fecha',
      },
    },
    {
      id: 'usuario',
      header: 'Ejecutivo',
      accessorFn: (act) => act.user?.username || '',
      cell: ({ row }) => {
        const username = row.original.user?.username;
        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-100">
              <User size={12} />
            </div>
            <span className="text-xs font-semibold text-slate-700 truncate max-w-[140px]">
              {username || <span className="text-slate-400 italic">Sin asignar</span>}
            </span>
          </div>
        );
      },
      meta: {
        mobileLabel: 'Ejecutivo',
        hideOnMobile: true,
      },
    },
    {
      id: 'relacion',
      header: 'Empresa / Contacto',
      accessorFn: (act) =>
        act.company?.nombre || (act.client ? `${act.client.nombre} ${act.client.apellido || ''}` : ''),
      cell: ({ row }) => {
        const act = row.original;
        if (act.company) {
          return (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 shrink-0 border border-violet-100">
                <Building size={12} />
              </div>
              <span className="text-xs font-bold text-slate-800 truncate max-w-[160px]">
                {act.company.nombre}
              </span>
            </div>
          );
        }
        if (act.client) {
          return (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-100">
                <User size={12} />
              </div>
              <span className="text-xs font-semibold text-slate-700 truncate max-w-[160px]">
                {act.client.nombre} {act.client.apellido || ''}
              </span>
            </div>
          );
        }
        return <span className="text-xs text-slate-400 italic">Sin asociar</span>;
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
      cell: ({ row }) => {
        const oppName = row.original.opportunity?.nombre_proyecto;
        if (!oppName) return <span className="text-xs text-slate-400 italic">-</span>;

        return (
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <Briefcase size={12} className="text-slate-400 shrink-0" />
            <span className="truncate max-w-[140px]">{oppName}</span>
          </div>
        );
      },
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
      id: 'acciones',
      header: 'Acciones',
      enableSorting: false,
      cell: ({ row }) => {
        const act = row.original;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="icon"
              onClick={() => onEdit(act)}
              className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 !p-1.5"
              title="Editar actividad"
            >
              <Edit size={15} />
            </Button>
            <Button
              variant="icon"
              onClick={() => onDelete(act)}
              className="text-slate-500 hover:text-red-600 hover:bg-red-50 !p-1.5"
              title="Eliminar actividad"
            >
              <Trash2 size={15} />
            </Button>
          </div>
        );
      },
      meta: {
        mobileLabel: 'Acciones',
        align: 'right',
        headerClassName: 'text-right',
      },
    },
  ];
};
