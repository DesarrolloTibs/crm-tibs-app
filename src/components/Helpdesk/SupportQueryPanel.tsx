import React, { useState } from 'react';
import { Search, ArrowLeft, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { queryTicketsPublic } from '../../services/ticketsService';
import Input from '../shared/Input';
import Button from '../shared/Button';
import LoginBackground from '../Login/LoginBackground';
import type { Ticket } from '../../core/models/Ticket';

const getStageBadgeStyles = (stageName: string, customColor?: string | null) => {
  if (customColor) return { backgroundColor: `${customColor}15`, color: customColor, borderColor: `${customColor}30` };
  const name = stageName.toLowerCase();
  if (name.includes('nuevo')) return { backgroundColor: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' };
  if (name.includes('proceso') || name.includes('atendiendo')) return { backgroundColor: '#fef3c7', color: '#d97706', borderColor: '#fde68a' };
  if (name.includes('espera')) return { backgroundColor: '#ffedd5', color: '#ea580c', borderColor: '#fed7aa' };
  if (name.includes('resuelto') || name.includes('solucionado')) return { backgroundColor: '#d1fae5', color: '#059669', borderColor: '#a7f3d0' };
  return { backgroundColor: '#e2e8f0', color: '#64748b', borderColor: '#cbd5e1' };
};

interface Props {
  activeTabMobile: 'register' | 'query';
  setActiveTabMobile: (v: 'register' | 'query') => void;
}

const SupportQueryPanel: React.FC<Props> = ({ activeTabMobile, setActiveTabMobile }) => {
  const [queryValue, setQueryValue] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState('');
  const [queriedTickets, setQueriedTickets] = useState<Ticket[] | null>(null);

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = queryValue.trim();
    if (!value) { setQueryError('Por favor, ingresa un correo o número de ticket.'); return; }
    setQueryLoading(true);
    setQueryError('');
    setQueriedTickets(null);
    try {
      const params: { email?: string; ticketNumber?: string } = value.includes('@') ? { email: value } : { ticketNumber: value };
      const data = await queryTicketsPublic(params);
      setQueriedTickets(data);
    } catch (err: any) {
      setQueryError(err.response?.data?.message || err.message || 'Error al buscar tickets');
    } finally {
      setQueryLoading(false);
    }
  };

  return (
    <div className={`${activeTabMobile === 'query' ? 'flex' : 'hidden lg:flex'} w-full lg:w-1/2 bg-slate-50 items-center justify-center relative overflow-hidden border-l border-slate-100 p-4 sm:p-8 min-h-screen lg:min-h-0`}>
      <div className="absolute inset-0"><LoginBackground /></div>

      <div className="relative z-10 bg-white/90 backdrop-blur-md shadow-2xl border border-slate-200/50 rounded-3xl p-6 sm:p-8 w-full max-w-[480px] flex flex-col max-h-[90vh] overflow-y-auto hide-scrollbar">
        {/* Mobile tab selector */}
        <div className="flex w-full mb-6 bg-slate-100 p-1 rounded-xl lg:hidden">
          <button type="button" onClick={() => setActiveTabMobile('register')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${activeTabMobile === 'register' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
            Registrar Ticket
          </button>
          <button type="button" onClick={() => setActiveTabMobile('query')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${activeTabMobile === 'query' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
            Consultar Estatus
          </button>
        </div>

        {queriedTickets === null ? (
          <div className="animate-in fade-in duration-500">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg text-white"><Search size={24} /></div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Consulta de Estatus</h2>
              <p className="text-slate-500 text-xs mt-2 max-w-xs mx-auto leading-relaxed">Ingresa tu correo electrónico registrado o número de ticket para conocer su estado de resolución.</p>
            </div>
            <form onSubmit={handleQuerySubmit} className="space-y-4">
              <Input label="Correo o Número de Ticket *" type="text" placeholder="Ej: correo@empresa.com o #00001" value={queryValue} onChange={e => setQueryValue(e.target.value)} required />
              {queryError && (
                <div className="bg-transparent border border-rose-200 text-rose-600 text-[10px] font-black uppercase tracking-widest text-center py-2.5 px-4 rounded-xl flex items-center justify-center gap-2">
                  <ShieldAlert size={14} className="stroke-[3]" /> {queryError}
                </div>
              )}
              <Button type="submit" variant="indigo" loading={queryLoading} className="py-4 w-full">BUSCAR TICKET</Button>
            </form>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500 flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <button onClick={() => { setQueriedTickets(null); setQueryError(''); }} className="flex items-center gap-1 text-[10px] font-black text-slate-500 hover:text-indigo-600 uppercase tracking-widest transition-colors">
                <ArrowLeft size={12} className="stroke-[3]" /> Nueva Consulta
              </button>
              <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                {queriedTickets.length} {queriedTickets.length === 1 ? 'Resultado' : 'Resultados'}
              </span>
            </div>

            {queriedTickets.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100"><AlertCircle size={20} /></div>
                <h3 className="font-bold text-slate-800 text-sm">Sin coincidencias</h3>
                <p className="text-slate-400 text-xs mt-1.5 max-w-[240px] mx-auto leading-relaxed">No encontramos ningún ticket asociado a "{queryValue}". Revisa que la información sea correcta.</p>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto pr-1 hide-scrollbar max-h-[60vh]">
                {queriedTickets.map(ticket => {
                  const numStr = ticket.ticket_number.toString().padStart(5, '0');
                  const badgeStyle = getStageBadgeStyles(ticket.stage?.strname || 'Nuevo', ticket.stage?.strcolor);
                  return (
                    <div key={ticket.id} className="p-4 bg-white border border-slate-150 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <span className="text-indigo-600 font-extrabold text-sm tracking-wider">#{numStr}</span>
                        <span style={badgeStyle} className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border">{ticket.stage?.strname || 'Nuevo'}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug mb-1">{ticket.strtitle}</h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400 font-medium mb-3">
                        <span>{ticket.tipo_incidencia}</span><span>•</span>
                        <span>{new Date(ticket.fecha_apertura).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                      <p className="text-slate-500 text-xs leading-relaxed bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 mb-3 whitespace-pre-line">{ticket.description}</p>
                      {ticket.notas_resolucion && (
                        <div className="bg-emerald-50/40 border border-emerald-150/55 rounded-xl p-3">
                          <div className="flex items-center gap-1.5 text-emerald-700 text-[10px] font-black uppercase tracking-wider mb-1">
                            <CheckCircle2 size={12} className="stroke-[2.5]" /> Resolución
                          </div>
                          <p className="text-slate-600 text-xs leading-relaxed">{ticket.notas_resolucion}</p>
                          {ticket.fecha_cierre && (
                            <p className="text-[9px] text-slate-400 font-medium mt-1">
                              Resuelto el {new Date(ticket.fecha_cierre).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportQueryPanel;
