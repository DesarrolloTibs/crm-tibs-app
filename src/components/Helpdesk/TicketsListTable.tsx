import React from 'react';
import type { Ticket } from '../../core/models/Ticket';
import { Clock, Building2, User, AlertTriangle } from 'lucide-react';

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
}

const TicketsListTable: React.FC<Props> = ({ 
  tickets, 
  onTicketClick, 
  currentPage, 
  totalPages, 
  onPageChange,
  pageSize,
  onPageSizeChange,
  totalCount,
  filteredCount
}) => {
  const getDaysInStage = (ticket: Ticket) => {
    const enteredDate = ticket.stage_entered_at ? new Date(ticket.stage_entered_at) : new Date(ticket.fecha_apertura);
    const diffTime = Math.max(0, Date.now() - enteredDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-wider">
              <th className="py-3.5 px-4 text-center w-20">Número</th>
              <th className="py-3.5 px-4">Asunto</th>
              <th className="py-3.5 px-4">Cliente / Contacto</th>
              <th className="py-3.5 px-4">Incidencia</th>
              <th className="py-3.5 px-4 text-center w-28">Prioridad</th>
              <th className="py-3.5 px-4">Apertura</th>
              <th className="py-3.5 px-4">Responsable</th>
              <th className="py-3.5 px-4 text-center w-36">Etapa</th>
              <th className="py-3.5 px-4 text-center w-28">Semáforo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-10 text-slate-400 text-xs italic">
                  Ningún ticket coincide con los filtros aplicados.
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => {
                const numStr = ticket.ticket_number.toString().padStart(5, '0');
                const customerName = ticket.cliente ? `${ticket.cliente.nombre} ${ticket.cliente.apellido}` : (ticket.contactName || 'Cliente Externo');
                const companyName = ticket.cliente ? (ticket.cliente.company?.nombre || ticket.cliente.empresa) : ticket.contactEmail;

                // Stage days alert limit
                const days = getDaysInStage(ticket);
                const limitDays = ticket.stage?.intmaxdays;
                const isRed = limitDays !== undefined && limitDays !== null && limitDays > 0 && days > limitDays;
                const isYellow = limitDays !== undefined && limitDays !== null && limitDays > 0 && !isRed && days >= (limitDays / 2);

                const hoursSinceCreated = Math.floor(Math.max(0, Date.now() - new Date(ticket.fecha_apertura).getTime()) / (1000 * 60 * 60));
                const isUnattendedAlert = !ticket.responsable && hoursSinceCreated >= 24;

                return (
                  <tr
                    key={ticket.id}
                    onDoubleClick={() => {
                      if (window.innerWidth >= 1024) {
                        onTicketClick(ticket);
                      }
                    }}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        onTicketClick(ticket);
                      }
                    }}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer text-xs group"
                  >
                    {/* Número */}
                    <td className="py-3.5 px-4 font-bold text-indigo-600 text-center select-none">
                      #{numStr}
                    </td>

                    {/* Asunto */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      <div className="flex items-center gap-1.5">
                        {isUnattendedAlert && (
                          <span className="bg-red-100 text-red-700 p-0.5 rounded" title="¡Ticket desatendido por más de 24 horas!">
                            <AlertTriangle size={12} className="stroke-[2.5]" />
                          </span>
                        )}
                        <span className="truncate max-w-[200px]" title={ticket.strtitle}>
                          {ticket.strtitle}
                        </span>
                      </div>
                    </td>

                    {/* Cliente / Contacto */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{customerName}</span>
                        {companyName && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Building2 size={10} />
                            {companyName}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Incidencia */}
                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      {ticket.tipo_incidencia}
                    </td>

                    {/* Prioridad */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex justify-center gap-0.5">
                        {[1, 2, 3].map((star) => (
                          <svg
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= (ticket.priority ?? 0) ? 'text-amber-400 fill-current' : 'text-slate-200'
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
                    </td>

                    {/* Apertura */}
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {new Date(ticket.fecha_apertura).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Responsable */}
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {ticket.responsable ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px] font-black border border-slate-350">
                            {ticket.responsable.username.substring(0, 2).toUpperCase()}
                          </div>
                          <span>{ticket.responsable.username}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic font-medium flex items-center gap-1">
                          <User size={12} /> Sin asignar
                        </span>
                      )}
                    </td>

                    {/* Etapa */}
                    <td className="py-3.5 px-4 text-center">
                      {ticket.stage ? (
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block border border-black/5"
                          style={{
                            backgroundColor: (ticket.stage.strcolor || '#e2e8f0') + '20',
                            color: ticket.stage.strcolor || '#475569',
                          }}
                        >
                          {ticket.stage.strname}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">N/A</span>
                      )}
                    </td>

                    {/* Semáforo */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex justify-center">
                        {limitDays ? (
                          <span
                            className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                              isRed 
                                ? 'text-red-600 bg-red-50 border-red-200/50' 
                                : isYellow
                                ? 'text-amber-600 bg-amber-50 border-amber-200/50'
                                : 'text-slate-400 bg-slate-50 border-slate-100/60'
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
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 p-4 gap-4 bg-slate-50/50 rounded-xl border border-slate-100/60 print:hidden">
        {/* Left Side: pageSize input and record details */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 select-none">
          <span>Mostrar</span>
          <input
            type="number"
            min="0"
            value={pageSize === 0 ? '' : pageSize}
            onChange={(e) => {
              const val = e.target.value;
              onPageSizeChange(val === '' ? 0 : Math.max(0, parseInt(val, 10)));
            }}
            placeholder="Todos"
            className="w-16 text-center border border-slate-300 rounded-lg py-1.5 px-2 text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white outline-none"
          />
          <span>registros de {filteredCount} (total: {totalCount})</span>
        </div>

        {/* Right Side: Page navigation buttons */}
        {totalPages && totalPages > 1 && onPageChange && currentPage && (
          <div className="flex space-x-1.5">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border select-none cursor-pointer ${
                  currentPage === i + 1
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-500/10'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
                onClick={() => onPageChange(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketsListTable;
