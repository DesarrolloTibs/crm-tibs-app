import React, { useState } from 'react';
import { createTicket, queryTicketsPublic } from '../services/ticketsService';
import { Link } from 'react-router-dom';
import { ShieldAlert, Search, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import Input from '../components/shared/Input';
import TextArea from '../components/shared/TextArea';
import Select from '../components/shared/Select';
import Button from '../components/shared/Button';
import LoginBackground from '../components/Login/LoginBackground';
import type { Ticket } from '../core/models/Ticket';

const incidenceTypeOptions = [
    { value: 'Soporte Técnico', label: 'Soporte Técnico' },
    { value: 'Facturación', label: 'Facturación' },
    { value: 'Garantía', label: 'Garantía' },
    { value: 'Dudas', label: 'Dudas' },
    { value: 'Otro', label: 'Otro' }
];

const getStageBadgeStyles = (stageName: string, customColor?: string | null) => {
    if (customColor) {
        return { backgroundColor: `${customColor}15`, color: customColor, borderColor: `${customColor}30` };
    }
    const name = stageName.toLowerCase();
    if (name.includes('nuevo')) return { backgroundColor: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' };
    if (name.includes('proceso') || name.includes('atendiendo')) return { backgroundColor: '#fef3c7', color: '#d97706', borderColor: '#fde68a' };
    if (name.includes('espera')) return { backgroundColor: '#ffedd5', color: '#ea580c', borderColor: '#fed7aa' };
    if (name.includes('resuelto') || name.includes('solucionado')) return { backgroundColor: '#d1fae5', color: '#059669', borderColor: '#a7f3d0' };
    return { backgroundColor: '#e2e8f0', color: '#64748b', borderColor: '#cbd5e1' };
};

const SupportTicketPage: React.FC = () => {
    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [ticketTitle, setTicketTitle] = useState('');
    const [incidenceType, setIncidenceType] = useState('Soporte Técnico');
    const [ticketDescription, setTicketDescription] = useState('');
    const [ticketPriority] = useState(0);
    const [ticketSuccessNumber, setTicketSuccessNumber] = useState<string | null>(null);
    const [supportLoading, setSupportLoading] = useState(false);
    const [supportError, setSupportError] = useState('');

    const [activeTabMobile, setActiveTabMobile] = useState<'register' | 'query'>('register');
    const [queryValue, setQueryValue] = useState('');
    const [queryLoading, setQueryLoading] = useState(false);
    const [queryError, setQueryError] = useState('');
    const [queriedTickets, setQueriedTickets] = useState<Ticket[] | null>(null);

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
                priority: ticketPriority,
                contactName: contactName.trim(),
                contactEmail: contactEmail.trim().toLowerCase(),
                contactPhone: contactPhone.trim() || undefined,
                companyName: companyName.trim() || undefined,
            });

            const numStr = ticket.ticket_number.toString().padStart(5, '0');
            setTicketSuccessNumber(numStr);
        } catch (err: any) {
            setSupportError(err.response?.data?.message || err.message || 'Error al registrar el ticket');
        } finally {
            setSupportLoading(false);
        }
    };

    const resetForm = () => {
        setTicketSuccessNumber(null);
        setContactName('');
        setContactEmail('');
        setContactPhone('');
        setCompanyName('');
        setTicketTitle('');
        setTicketDescription('');
        setSupportError('');
    };

    const handleQuerySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const value = queryValue.trim();
        if (!value) {
            setQueryError('Por favor, ingresa un correo o número de ticket.');
            return;
        }

        setQueryLoading(true);
        setQueryError('');
        setQueriedTickets(null);

        try {
            let params: { email?: string; ticketNumber?: string } = {};
            if (value.includes('@')) {
                params.email = value;
            } else {
                params.ticketNumber = value;
            }

            const data = await queryTicketsPublic(params);
            setQueriedTickets(data);
        } catch (err: any) {
            setQueryError(err.response?.data?.message || err.message || 'Error al buscar tickets');
        } finally {
            setQueryLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full lg:overflow-hidden overflow-y-auto bg-white font-sans">
            
            {/* Sección Izquierda: Formulario */}
            <div className={`${activeTabMobile === 'register' ? 'flex' : 'hidden lg:flex'} w-full lg:w-1/2 items-center justify-center p-4 sm:p-8 bg-white z-10 relative`}>
                <div className="w-full max-w-[420px] py-4 animate-in fade-in slide-in-from-left-8 duration-700">

                    {/* Selector de pestañas para móviles */}
                    <div className="flex w-full mb-6 bg-slate-100 p-1 rounded-xl lg:hidden">
                        <button
                            type="button"
                            onClick={() => setActiveTabMobile('register')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${
                                activeTabMobile === 'register' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Registrar Ticket
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTabMobile('query')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${
                                activeTabMobile === 'query' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Consultar Estatus
                        </button>
                    </div>

                    {ticketSuccessNumber ? (
                        /* Vista de Éxito en Ticket */
                        <div className="text-center py-6 animate-in zoom-in-95 duration-500">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                ¡Ticket Registrado!
                            </h2>
                            <p className="text-slate-500 text-xs mt-2 max-w-xs mx-auto leading-relaxed">
                                Tu solicitud ha sido registrada correctamente. El número de seguimiento asignado es:
                            </p>
                            
                            <div className="my-6 inline-block bg-indigo-50 border border-indigo-100 px-6 py-3.5 rounded-2xl">
                                <span className="text-indigo-600 font-black text-3xl tracking-wider">
                                    #{ticketSuccessNumber}
                                </span>
                            </div>

                            <p className="text-slate-400 text-[10px] max-w-xs mx-auto mb-8 leading-relaxed">
                                Un agente responsable comenzará a atender tu solicitud a la brevedad. Conserva este número para futuras aclaraciones.
                            </p>

                            <div className="space-y-3">
                                <Button
                                    type="button"
                                    onClick={resetForm}
                                    variant="indigo"
                                    className="py-4 w-full"
                                >
                                    REGISTRAR OTRO TICKET
                                </Button>
                                
                                <Link
                                    to="/login"
                                    className="inline-block text-[10px] font-black text-slate-500 hover:text-indigo-600 uppercase tracking-widest transition-colors mt-2"
                                >
                                    VOLVER AL INICIO DE SESIÓN
                                </Link>
                            </div>
                        </div>
                    ) : (
                        /* Formulario Público de Soporte */
                        <div className="animate-in fade-in duration-500">
                            <div className="mb-6 text-left">
                                <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                                    <svg className="text-white w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                    Mesa de Soporte
                                </h1>
                                <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.22em] mt-1">
                                    Registro de Incidencias
                                </p>
                            </div>

                            <form onSubmit={handleSupportSubmit} className="space-y-4 lg:max-h-[65vh] lg:overflow-y-auto pr-1 hide-scrollbar">
                                <Input
                                    label="Nombre Completo *"
                                    type="text"
                                    placeholder="Ej: Juan Pérez"
                                    value={contactName}
                                    onChange={e => setContactName(e.target.value)}
                                    required
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Input
                                        label="Correo Electrónico *"
                                        type="email"
                                        placeholder="correo@empresa.com"
                                        value={contactEmail}
                                        onChange={e => setContactEmail(e.target.value)}
                                        required
                                    />
                                    <Input
                                        label="Teléfono"
                                        type="tel"
                                        placeholder="5512345678"
                                        value={contactPhone}
                                        onChange={e => setContactPhone(e.target.value)}
                                    />
                                </div>

                                <Input
                                    label="Empresa"
                                    type="text"
                                    placeholder="Empresa S.A."
                                    value={companyName}
                                    onChange={e => setCompanyName(e.target.value)}
                                />

                                <Input
                                    label="Título de Incidencia *"
                                    type="text"
                                    placeholder="Ej: Falla de carga de catálogo"
                                    value={ticketTitle}
                                    onChange={e => setTicketTitle(e.target.value)}
                                    required
                                />

                                <Select
                                    label="Tipo de Incidencia *"
                                    options={incidenceTypeOptions}
                                    value={incidenceTypeOptions.find(opt => opt.value === incidenceType)}
                                    onChange={(val: any) => setIncidenceType(val ? val.value : 'Soporte Técnico')}
                                    placeholder="Seleccione el tipo de incidencia..."
                                    required
                                />

                                <TextArea
                                    label="Descripción del Problema *"
                                    placeholder="Por favor describe detalladamente la incidencia..."
                                    value={ticketDescription}
                                    onChange={e => setTicketDescription(e.target.value)}
                                    required
                                />

                                {supportError && (
                                    <div className="bg-transparent border border-rose-200 text-rose-600 text-[10px] font-black uppercase tracking-widest text-center py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
                                        <ShieldAlert size={14} className="stroke-[3]" />
                                        {supportError}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <Link to="/login" className="w-1/3">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="w-full"
                                        >
                                            CANCELAR
                                        </Button>
                                    </Link>
                                    
                                    <Button
                                        type="submit"
                                        variant="indigo"
                                        loading={supportLoading}
                                        className="w-2/3"
                                    >
                                        REGISTRAR TICKET
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Footer Info */}
                    <p className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center lg:text-left">
                        © {new Date().getFullYear()} Billy Sales & Services • CRM para Gestión de Ventas
                    </p>
                </div>

                {/* Decoración lateral sutil en el lado izquierdo */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-blue-600"></div>
            </div>

            {/* Sección Derecha: Consulta de Estatus */}
            <div className={`${activeTabMobile === 'query' ? 'flex' : 'hidden lg:flex'} w-full lg:w-1/2 bg-slate-50 items-center justify-center relative overflow-hidden border-l border-slate-100 p-4 sm:p-8 min-h-screen lg:min-h-0`}>
                <div className="absolute inset-0">
                    <LoginBackground />
                </div>

                {/* Contenedor tipo Tarjeta Premium */}
                <div className="relative z-10 bg-white/90 backdrop-blur-md shadow-2xl border border-slate-200/50 rounded-3xl p-6 sm:p-8 w-full max-w-[480px] flex flex-col max-h-[90vh] overflow-y-auto hide-scrollbar">
                    
                    {/* Selector de pestañas para móviles dentro de la sección de consulta (cuando está activa) */}
                    <div className="flex w-full mb-6 bg-slate-100 p-1 rounded-xl lg:hidden">
                        <button
                            type="button"
                            onClick={() => setActiveTabMobile('register')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${
                                activeTabMobile === 'register' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Registrar Ticket
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTabMobile('query')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${
                                activeTabMobile === 'query' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Consultar Estatus
                        </button>
                    </div>

                    {queriedTickets === null ? (
                        /* Vista de Búsqueda */
                        <div className="animate-in fade-in duration-500">
                            <div className="text-center mb-6">
                                <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg text-white">
                                    <Search size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                    Consulta de Estatus
                                </h2>
                                <p className="text-slate-500 text-xs mt-2 max-w-xs mx-auto leading-relaxed">
                                    Ingresa tu correo electrónico registrado o número de ticket para conocer su estado de resolución.
                                </p>
                            </div>

                            <form onSubmit={handleQuerySubmit} className="space-y-4">
                                <Input
                                    label="Correo o Número de Ticket *"
                                    type="text"
                                    placeholder="Ej: correo@empresa.com o #00001"
                                    value={queryValue}
                                    onChange={e => setQueryValue(e.target.value)}
                                    required
                                />

                                {queryError && (
                                    <div className="bg-transparent border border-rose-200 text-rose-600 text-[10px] font-black uppercase tracking-widest text-center py-2.5 px-4 rounded-xl flex items-center justify-center gap-2">
                                        <ShieldAlert size={14} className="stroke-[3]" />
                                        {queryError}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    variant="indigo"
                                    loading={queryLoading}
                                    className="py-4 w-full"
                                >
                                    BUSCAR TICKET
                                </Button>
                            </form>
                        </div>
                    ) : (
                        /* Vista de Resultados */
                        <div className="animate-in fade-in duration-500 flex flex-col h-full">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                                <button
                                    onClick={() => {
                                        setQueriedTickets(null);
                                        setQueryError('');
                                    }}
                                    className="flex items-center gap-1 text-[10px] font-black text-slate-500 hover:text-indigo-600 uppercase tracking-widest transition-colors"
                                >
                                    <ArrowLeft size={12} className="stroke-[3]" /> Nueva Consulta
                                </button>
                                <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                                    {queriedTickets.length} {queriedTickets.length === 1 ? 'Resultado' : 'Resultados'}
                                </span>
                            </div>

                            {queriedTickets.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100">
                                        <AlertCircle size={20} />
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-sm">Sin coincidencias</h3>
                                    <p className="text-slate-400 text-xs mt-1.5 max-w-[240px] mx-auto leading-relaxed">
                                        No encontramos ningún ticket asociado a "{queryValue}". Revisa que la información sea correcta.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4 overflow-y-auto pr-1 hide-scrollbar max-h-[60vh]">
                                    {queriedTickets.map(ticket => {
                                        const numStr = ticket.ticket_number.toString().padStart(5, '0');
                                        const badgeStyle = getStageBadgeStyles(ticket.stage?.strname || 'Nuevo', ticket.stage?.strcolor);
                                        
                                        return (
                                            <div key={ticket.id} className="p-4 bg-white border border-slate-150 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                                <div className="flex justify-between items-start mb-2 gap-2">
                                                    <span className="text-indigo-600 font-extrabold text-sm tracking-wider">
                                                        #{numStr}
                                                    </span>
                                                    <span 
                                                        style={badgeStyle}
                                                        className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border"
                                                    >
                                                        {ticket.stage?.strname || 'Nuevo'}
                                                    </span>
                                                </div>

                                                <h4 className="font-bold text-slate-900 text-sm leading-snug mb-1">
                                                    {ticket.strtitle}
                                                </h4>
                                                
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400 font-medium mb-3">
                                                    <span>{ticket.tipo_incidencia}</span>
                                                    <span>•</span>
                                                    <span>{new Date(ticket.fecha_apertura).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                                </div>

                                                <p className="text-slate-500 text-xs leading-relaxed bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 mb-3 whitespace-pre-line">
                                                    {ticket.description}
                                                </p>

                                                {/* Comentarios de Resolución (si aplica) */}
                                                {ticket.notas_resolucion && (
                                                    <div className="bg-emerald-50/40 border border-emerald-150/55 rounded-xl p-3">
                                                        <div className="flex items-center gap-1.5 text-emerald-700 text-[10px] font-black uppercase tracking-wider mb-1">
                                                            <CheckCircle2 size={12} className="stroke-[2.5]" />
                                                            Resolución
                                                        </div>
                                                        <p className="text-slate-600 text-xs leading-relaxed">
                                                            {ticket.notas_resolucion}
                                                        </p>
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

        </div>
    );
};

export default SupportTicketPage;
