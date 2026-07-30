import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { createTicket } from '../../services/ticketsService';
import Input from '../shared/Input';
import TextArea from '../shared/TextArea';
import Select from '../shared/Select';
import Button from '../shared/Button';

const incidenceTypeOptions = [
  { value: 'Soporte Técnico', label: 'Soporte Técnico' },
  { value: 'Facturación', label: 'Facturación' },
  { value: 'Garantía', label: 'Garantía' },
  { value: 'Dudas', label: 'Dudas' },
  { value: 'Otro', label: 'Otro' },
];

interface Props {
  activeTabMobile: 'register' | 'query';
  setActiveTabMobile: (v: 'register' | 'query') => void;
}

const SupportRegisterPanel: React.FC<Props> = ({ activeTabMobile, setActiveTabMobile }) => {
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [ticketTitle, setTicketTitle] = useState('');
  const [incidenceType, setIncidenceType] = useState('Soporte Técnico');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketSuccessNumber, setTicketSuccessNumber] = useState<string | null>(null);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportError, setSupportError] = useState('');

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !ticketTitle.trim() || !ticketDescription.trim()) {
      setSupportError('Por favor, completa los campos requeridos (*).');
      return;
    }
    setSupportLoading(true);
    setSupportError('');
    try {
      const ticket = await createTicket({
        strtitle: ticketTitle.trim(),
        tipo_incidencia: incidenceType,
        description: ticketDescription.trim(),
        priority: 0,
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        contactPhone: contactPhone.trim() || undefined,
        companyName: companyName.trim() || undefined,
      });
      setTicketSuccessNumber(ticket.ticket_number.toString().padStart(5, '0'));
    } catch (err: any) {
      setSupportError(err.response?.data?.message || err.message || 'Error al registrar el ticket');
    } finally {
      setSupportLoading(false);
    }
  };

  const resetForm = () => {
    setTicketSuccessNumber(null);
    setContactName(''); setContactEmail(''); setContactPhone('');
    setCompanyName(''); setTicketTitle(''); setTicketDescription('');
    setSupportError('');
  };

  return (
    <div className={`${activeTabMobile === 'register' ? 'flex' : 'hidden lg:flex'} w-full lg:w-1/2 items-center justify-center p-4 sm:p-8 bg-white z-10 relative`}>
      <div className="w-full max-w-[420px] py-4 animate-in fade-in slide-in-from-left-8 duration-700">
        {/* Mobile tab selector */}
        <div className="flex w-full mb-6 bg-slate-100 p-1 rounded-xl lg:hidden">
          <button type="button" onClick={() => setActiveTabMobile('register')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${activeTabMobile === 'register' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
            Registrar Ticket
          </button>
          <button type="button" onClick={() => setActiveTabMobile('query')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${activeTabMobile === 'query' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
            Consultar Estatus
          </button>
        </div>

        {ticketSuccessNumber ? (
          <div className="text-center py-6 animate-in zoom-in-95 duration-500">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">¡Ticket Registrado!</h2>
            <p className="text-slate-500 text-xs mt-2 max-w-xs mx-auto leading-relaxed">Tu solicitud ha sido registrada correctamente. El número de seguimiento asignado es:</p>
            <div className="my-6 inline-block bg-indigo-50 border border-indigo-100 px-6 py-3.5 rounded-2xl">
              <span className="text-indigo-600 font-black text-3xl tracking-wider">#{ticketSuccessNumber}</span>
            </div>
            <p className="text-slate-400 text-[10px] max-w-xs mx-auto mb-8 leading-relaxed">Un agente responsable comenzará a atender tu solicitud a la brevedad. Conserva este número para futuras aclaraciones.</p>
            <div className="space-y-3">
              <Button type="button" onClick={resetForm} variant="indigo" className="py-4 w-full">REGISTRAR OTRO TICKET</Button>
              <Link to="/login" className="inline-block text-[10px] font-black text-slate-500 hover:text-indigo-600 uppercase tracking-widest transition-colors mt-2">VOLVER AL INICIO DE SESIÓN</Link>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <div className="mb-6 text-left">
              <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <svg className="text-white w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mesa de Soporte</h1>
              <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.22em] mt-1">Registro de Incidencias</p>
            </div>
            <form onSubmit={handleSupportSubmit} className="space-y-4 lg:max-h-[65vh] lg:overflow-y-auto pr-1 hide-scrollbar">
              <Input label="Nombre Completo *" type="text" placeholder="Ej: Juan Pérez" value={contactName} onChange={e => setContactName(e.target.value)} required />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Correo Electrónico *" type="email" placeholder="correo@empresa.com" value={contactEmail} onChange={e => setContactEmail(e.target.value)} required />
                <Input label="Teléfono" type="tel" placeholder="5512345678" value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
              </div>
              <Input label="Empresa" type="text" placeholder="Empresa S.A." value={companyName} onChange={e => setCompanyName(e.target.value)} />
              <Input label="Título de Incidencia *" type="text" placeholder="Ej: Falla de carga de catálogo" value={ticketTitle} onChange={e => setTicketTitle(e.target.value)} required />
              <Select label="Tipo de Incidencia *" options={incidenceTypeOptions} value={incidenceTypeOptions.find(opt => opt.value === incidenceType)} onChange={(val: any) => setIncidenceType(val ? val.value : 'Soporte Técnico')} placeholder="Seleccione el tipo de incidencia..." required />
              <TextArea label="Descripción del Problema *" placeholder="Por favor describe detalladamente la incidencia..." value={ticketDescription} onChange={e => setTicketDescription(e.target.value)} required />
              {supportError && (
                <div className="bg-transparent border border-rose-200 text-rose-600 text-[10px] font-black uppercase tracking-widest text-center py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
                  <ShieldAlert size={14} className="stroke-[3]" /> {supportError}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Link to="/login" className="w-1/3">
                  <Button type="button" variant="secondary" className="w-full">CANCELAR</Button>
                </Link>
                <Button type="submit" variant="indigo" loading={supportLoading} className="w-2/3">REGISTRAR TICKET</Button>
              </div>
            </form>
          </div>
        )}
        <p className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center lg:text-left">
          © {new Date().getFullYear()} Billy Sales & Services • CRM para Gestión de Ventas
        </p>
      </div>
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-blue-600" />
    </div>
  );
};

export default SupportRegisterPanel;
