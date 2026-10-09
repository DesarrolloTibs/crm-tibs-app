import React, { useMemo } from 'react';
import type { Ticket } from '@core/models/Ticket';
import { Clock, Building2, User, AlertTriangle, Check, ChevronRight } from 'lucide-react';
import Table, { type ColumnDef } from '@shared/components/Table';

interface Props {
  tickets: Ticket[];
  onTicketClick: (ticket: Ticket) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  totalCount: number;
  filteredCount: number;
  variant?: 'cards' | 'flat';
  maxHeight?: string;
  loading?: boolean;
}

const getDaysInStage = (ticket: Ticket) => {
  const enteredDate = ticket.stage_entered_at
    ? new Date(ticket.stage_entered_at)
    : new Date(ticket.fecha_apertura);
  const diffTime = Math.max(0, Date.now() - enteredDate.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

const TicketsListTable: React.FC<Props> = ({
  tickets,
  onTicketClick,
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  totalCount,
  filteredCount,
  variant = 'cards',
  maxHeight,
  loading = false,
}) => {
  const columns = useMemo<ColumnDef<Ticket>[]>(
    () => [
      {
        id: 'ticket_number',
        accessorKey: 'ticket_number',
        header: 'Número',
        cell: ({ row }) => (
          <span className="font-bold text-indigo-600 select-none">
            #{row.original.ticket_number.toString().padStart(5, '0')}
          </span>
        ),
        meta: {
          mobileLabel: 'Número',
          align: 'center',
          headerClassName: 'w-24',
        },
      },
      {
        id: 'strtitle',
        accessorKey: 'strtitle',
        header: 'Asunto',
        cell: ({ row }) => {
          const ticket = row.original;
          const hoursSinceCreated = Math.floor(
            Math.max(0, Date.now() - new Date(ticket.fecha_apertura).getTime()) / (1000 * 60 * 60)
          );
          const isUnattendedAlert = !ticket.responsable && hoursSinceCreated >= 24;

          return (
            <div className="flex items-center gap-1.5 min-w-0">
              {isUnattendedAlert && (
                <span
                  className="bg-red-100 text-red-700 p-0.5 rounded shrink-0"
                  title="¡Ticket desatendido por más de 24 horas!"
                >
                  <AlertTriangle size={12} className="stroke-[2.5]" />
                </span>
              )}
              <span
                className="truncate max-w-[240px] font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors"
                title={ticket.strtitle}
              >
                {ticket.strtitle}
              </span>
            </div>
          );
        },
        meta: {
          mobileLabel: 'Asunto',
        },
      },
      {
        id: 'cliente_contacto',
        header: 'Cliente / Contacto',
        accessorFn: (ticket) =>
          ticket.cliente
            ? `${ticket.cliente.nombre} ${ticket.cliente.apellido} ${ticket.cliente.company?.nombre || ticket.cliente.empresa || ''}`
            : ticket.contactName || ticket.contactEmail || '',
        cell: ({ row }) => {
          const ticket = row.original;
          const customerName = ticket.cliente
            ? `${ticket.cliente.nombre} ${ticket.cliente.apellido}`
            : ticket.contactName || 'Cliente Externo';
          const companyName = ticket.cliente
            ? ticket.cliente.company?.nombre || ticket.cliente.empresa
            : ticket.contactEmail;

          return (
            <div className="flex flex-col">
              <span className="font-semibold text-slate-800">{customerName}</span>
              {companyName && (
                <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <Building2 size={10} className="shrink-0" />
                  {companyName}
                </span>
              )}
            </div>
          );
        },
        meta: {
          mobileLabel: 'Cliente / Contacto',
        },
      },
      {
        id: 'tipo_incidencia',
        accessorKey: 'tipo_incidencia',
        header: 'Incidencia',
        cell: ({ row }) => (
          <span className="font-medium text-slate-600">
            {row.original.tipo_incidencia || 'Normal'}
          </span>
        ),
        meta: {
          mobileLabel: 'Incidencia',
          hideOnMobile: true,
        },
      },
      {
        id: 'priority',
        accessorKey: 'priority',
        header: 'Prioridad',
        cell: ({ row }) => {
          const priority = row.original.priority ?? 0;
          return (
            <div className="flex items-center md:justify-center gap-0.5">
              {[1, 2, 3].map((star) => (
                <svg
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= priority ? 'text-amber-400 fill-current' : 'text-slate-200'
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
          );
        },
        meta: {
          mobileLabel: 'Prioridad',
          align: 'center',
          hideOnMobile: true,
        },
      },
      {
        id: 'fecha_apertura',
        accessorKey: 'fecha_apertura',
        header: 'Apertura',
        cell: ({ row }) => (
          <span className="text-slate-500 font-medium text-xs">
            {new Date(row.original.fecha_apertura).toLocaleDateString('es-MX', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        ),
        meta: {
          mobileLabel: 'Apertura',
          hideOnMobile: true,
        },
      },
      {
        id: 'responsable',
        header: 'Responsable',
        accessorFn: (ticket) => ticket.responsable?.username || '',
        cell: ({ row }) => {
          const responsable = row.original.responsable;
          return responsable ? (
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px] font-black border border-slate-300 shrink-0">
                {responsable.username.substring(0, 2).toUpperCase()}
              </div>
              <span className="truncate max-w-[120px]">{responsable.username}</span>
            </div>
          ) : (
            <span className="text-slate-400 italic font-medium flex items-center gap-1">
              <User size={12} className="shrink-0" /> Sin asignar
            </span>
          );
        },
        meta: {
          mobileLabel: 'Responsable',
          hideOnMobile: true,
        },
      },
      {
        id: 'stage',
        header: 'Etapa',
        accessorFn: (ticket) => ticket.stage?.strname || '',
        cell: ({ row }) => {
          const stage = row.original.stage;
          if (!stage) return <span className="text-slate-400 italic">N/A</span>;
          return (
            <div className="flex md:justify-center">
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 border border-black/5"
                style={{
                  backgroundColor: (stage.strcolor || '#e2e8f0') + '20',
                  color: stage.strcolor || '#475569',
                }}
              >
                {Number(stage.stage_type) === 1 && (
                  <Check size={10} className="stroke-[3] text-emerald-600" />
                )}
                {stage.strname}
              </span>
            </div>
          );
        },
        meta: {
          mobileLabel: 'Etapa',
          align: 'center',
        },
      },
      {
        id: 'semaforo',
        header: 'Semáforo',
        accessorFn: (ticket) => getDaysInStage(ticket),
        cell: ({ row }) => {
          const ticket = row.original;
          const days = getDaysInStage(ticket);
          const limitDays = ticket.stage?.intmaxdays;
          const isRed =
            limitDays !== undefined && limitDays !== null && limitDays > 0 && days > limitDays;
          const isYellow =
            limitDays !== undefined &&
            limitDays !== null &&
            limitDays > 0 &&
            !isRed &&
            days >= limitDays / 2;

          return (
            <div className="flex items-center md:justify-center">
              {limitDays ? (
                <span
                  className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                    isRed
                      ? 'text-red-600 bg-red-50 border-red-200/50'
                      : isYellow
                      ? 'text-amber-600 bg-amber-50 border-amber-200/50'
                      : 'text-slate-500 bg-slate-50 border-slate-200/60'
                  }`}
                  title={`Límite de etapa: ${limitDays} días`}
                >
                  <Clock size={10} />
                  {days}d / {limitDays}d
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 justify-center bg-slate-50/50 px-1.5 py-0.5 rounded border border-slate-100/60">
                  <Clock size={10} />
                  {days}d
                </span>
              )}
            </div>
          );
        },
        meta: {
          mobileLabel: 'Semáforo',
          align: 'center',
          hideOnMobile: true,
        },
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTicketClick(row.original);
            }}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
            title="Ver detalles"
          >
            <ChevronRight size={16} />
          </button>
        ),
        meta: {
          align: 'right',
        },
      },
    ],
    [onTicketClick]
  );

  return (
    <Table
      data={tickets}
      columns={columns}
      variant={variant}
      loading={loading}
      keyExtractor={(ticket) => ticket.id}
      onRowClick={onTicketClick}
      emptyTitle="Sin tickets"
      emptyMessage="Ningún ticket coincide con los filtros aplicados."
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
      pageSize={pageSize}
      onPageSizeChange={onPageSizeChange}
      totalCount={totalCount}
      filteredCount={filteredCount}
      maxHeight={maxHeight}
    />
  );
};

export default TicketsListTable;
