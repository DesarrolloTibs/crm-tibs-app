import React, { useState, useEffect } from 'react';
import type { Ticket, TicketStage } from '../../core/models/Ticket';
import type { User } from '../../core/models/User';
import type { Client } from '../../core/models/Client';
import { getClients } from '../../services/clientsService';
import { getUsers } from '../../services/usersService';
import { useAuth } from '../../hooks/useAuth';
import Select, { type SingleValue } from 'react-select';
import { User as UserIcon, LifeBuoy, AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';

interface Props {
  ticket?: Ticket;
  stages: TicketStage[];
  onSave: (ticketData: Partial<Ticket>) => void;
  onCancel: () => void;
  onDelete?: () => void;
  onConvertToOpportunity?: (ticket: Ticket) => void;
  onArchive?: (ticket: Ticket) => void;
}

interface SelectOption {
  value: string;
  label: string;
}

const formSelectStyles = {
  control: (baseStyles: any, state: any) => ({
    ...baseStyles,
    borderRadius: '0.5rem',
    borderColor: state.isFocused ? '#4f46e5' : '#cbd5e1',
    minHeight: '38px',
    backgroundColor: '#fff',
    boxShadow: state.isFocused ? '0 0 0 1px #4f46e5' : 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    '&:hover': {
      borderColor: state.isFocused ? '#4f46e5' : '#94a3b8'
    }
  }),
  valueContainer: (baseStyles: any) => ({
    ...baseStyles,
    padding: '0 12px',
  }),
  singleValue: (baseStyles: any) => ({
    ...baseStyles,
    color: '#334155',
  }),
  placeholder: (baseStyles: any) => ({
    ...baseStyles,
    color: '#94a3b8',
  }),
  menu: (baseStyles: any) => ({
    ...baseStyles,
    borderRadius: '0.5rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
    border: '1px solid #f1f5f9',
    overflow: 'hidden',
    marginTop: '4px',
    backgroundColor: '#ffffff',
    zIndex: 50,
  }),
  menuList: (baseStyles: any) => ({
    ...baseStyles,
    padding: '4px',
    backgroundColor: '#ffffff'
  }),
  option: (baseStyles: any, state: any) => ({
    ...baseStyles,
    borderRadius: '0.375rem',
    backgroundColor: state.isSelected 
      ? '#4f46e5' 
      : state.isFocused 
      ? '#eff6ff' 
      : 'transparent',
    color: state.isSelected ? '#ffffff' : '#334155',
    fontWeight: '500',
    fontSize: '13px',
    padding: '8px 12px',
    margin: '1px 0',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    '&:active': {
      backgroundColor: '#4f46e5'
    }
  }),
  indicatorSeparator: () => ({
    display: 'none'
  }),
  dropdownIndicator: (baseStyles: any, state: any) => ({
    ...baseStyles,
    color: state.isFocused ? '#4f46e5' : '#94a3b8',
    padding: '0 8px',
    transition: 'color 0.2s ease',
    '&:hover': {
      color: '#4f46e5'
    }
  }),
  clearIndicator: (baseStyles: any) => ({
    ...baseStyles,
    color: '#94a3b8',
    padding: '0 4px',
    '&:hover': {
      color: '#ef4444'
    }
  })
};

const TicketDetail: React.FC<Props> = ({ ticket, stages, onSave, onCancel, onDelete, onConvertToOpportunity, onArchive }) => {
  const { user: currentUser, isAdmin, isEjecutivo } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState(ticket?.strtitle || '');
  const [incidenceType, setIncidenceType] = useState(ticket?.tipo_incidencia || 'Soporte Técnico');
  const [description, setDescription] = useState(ticket?.description || '');
  const [priority, setPriority] = useState(ticket?.priority ?? 0);
  const [clienteId, setClienteId] = useState<string | null>(ticket?.cliente_id || null);
  const [responsableId, setResponsableId] = useState<string | null>(ticket?.responsable_id || null);
  const [stageId, setStageId] = useState<string>(ticket?.stage_id || stages.find(s => s.blninitial)?.id || '');
  const [notasResolucion, setNotasResolucion] = useState(ticket?.notas_resolucion || '');

  // Manual contact info states (external tickets)
  const [contactName, setContactName] = useState(ticket?.contactName || '');
  const [contactEmail, setContactEmail] = useState(ticket?.contactEmail || '');
  const [contactPhone, setContactPhone] = useState(ticket?.contactPhone || '');
  const [companyName, setCompanyName] = useState(ticket?.cliente ? (ticket.cliente.company?.nombre || ticket.cliente.empresa || '') : '');

  const [activeTab, setActiveTab] = useState<'desc' | 'resol'>('desc');
  const [validationError, setValidationError] = useState('');
  const [showStageDropdown, setShowStageDropdown] = useState(false);

  const getStageDuration = (enteredAtStr?: string | Date) => {
    if (!enteredAtStr) return '';
    const entered = new Date(enteredAtStr);
    const diffMs = Date.now() - entered.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 60) return `${Math.max(1, diffMins)}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const [allClients, allUsers] = await Promise.all([
          getClients(),
          getUsers(),
        ]);
        setClients(allClients);
        setUsers(allUsers.filter(u => u.isActive));
      } catch (err) {
        console.error('Error al cargar dependencias de ticket:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDependencies();
  }, []);

  const handleAssignToMe = () => {
    if (currentUser) {
      setResponsableId(currentUser.sub);
    }
  };

  const handleStageClick = (targetStage: TicketStage) => {
    setStageId(targetStage.id);
    if (targetStage.strname === 'Resuelto') {
      setActiveTab('resol');
    }
  };

  const currentStage = stages.find(s => s.id === stageId);
  const isResolvedStage = currentStage?.strname === 'Resuelto';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!title.trim() || !description.trim()) {
      setValidationError('El Asunto y la Descripción del problema son obligatorios.');
      return;
    }

    if (isResolvedStage && !notasResolucion.trim()) {
      setValidationError('Las notas de resolución son obligatorias para poder resolver el ticket.');
      setActiveTab('resol');
      return;
    }

    const payload: Partial<Ticket> = {
      strtitle: title.trim(),
      tipo_incidencia: incidenceType,
      description: description.trim(),
      priority,
      cliente_id: clienteId,
      responsable_id: responsableId,
      stage_id: stageId,
      notas_resolucion: isResolvedStage ? notasResolucion.trim() : (notasResolucion.trim() || null),
      contactName: contactName.trim() || null,
      contactEmail: contactEmail.trim() || null,
      contactPhone: contactPhone.trim() || null,
    };

    onSave(payload);
  };

  const clientOptions = clients.map(c => ({
    value: c.id!,
    label: `${c.nombre} ${c.apellido} (${c.company?.nombre || c.empresa || 'Sin empresa'})`,
  }));

  const selectedClientValue = clientOptions.find(option => option.value === clienteId) || null;

  const agentOptions = [
    { value: '', label: '-- Sin responsable --' },
    ...users.map(u => ({
      value: u.id,
      label: u.username,
    })),
  ];

  const incidenceTypeOptions = [
    { value: 'Soporte Técnico', label: 'Soporte Técnico' },
    { value: 'Facturación', label: 'Facturación' },
    { value: 'Garantía', label: 'Garantía' },
    { value: 'Dudas', label: 'Dudas' },
    { value: 'Otro', label: 'Otro' },
  ];

  const handleClientChange = (selectedOption: SingleValue<SelectOption>) => {
    const selectedId = selectedOption ? selectedOption.value : null;
    setClienteId(selectedId);
    if (selectedId) {
      const client = clients.find(c => c.id === selectedId);
      if (client) {
        setContactName(`${client.nombre} ${client.apellido}`);
        setContactEmail(client.correo);
        setContactPhone(client.telefono || '');
        setCompanyName(client.company?.nombre || client.empresa || '');
      }
    } else {
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setCompanyName('');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Barra superior de fases y acciones rápidas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex flex-wrap gap-2 items-center">
          {ticket && (isAdmin || !ticket.responsable_id) && (
            <button
              type="button"
              onClick={handleAssignToMe}
              className="px-3.5 py-1.5 border border-slate-350 hover:bg-white text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              Asignarme a mí
            </button>
          )}
          {ticket && onConvertToOpportunity && (
            <button
              type="button"
              onClick={() => onConvertToOpportunity(ticket)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1"
            >
              Convertir a Oportunidad
              <ArrowRight size={13} />
            </button>
          )}
        </div>

        {/* Fases del Workflow (Odoo Stepper) */}
        <div className="relative flex items-center self-end md:self-auto overflow-visible pb-1 md:pb-0">
          <div className="odoo-statusbar select-none">
            {(() => {
              const foldedNames = ['resuelto', 'cancelado', 'cancelada', 'ganada', 'perdida', 'lost', 'won', 'cancelled', 'solved', 'standby'];
              const activeStages = stages.filter(s => s.blnstatus);
              
              const mainStages = activeStages.filter(s => {
                const isFolded = foldedNames.includes(s.strname.trim().toLowerCase());
                return !isFolded || s.id === stageId;
              });

              const foldedStages = activeStages.filter(s => {
                const isFolded = foldedNames.includes(s.strname.trim().toLowerCase());
                return isFolded && s.id !== stageId;
              });

              return (
                <>
                  {mainStages.map((s) => {
                    const isActive = s.id === stageId;
                    const duration = isActive && ticket ? getStageDuration(ticket.stage_entered_at || ticket.fecha_apertura) : '';
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          handleStageClick(s);
                          setShowStageDropdown(false);
                        }}
                        className={`odoo-step cursor-pointer ${isActive ? 'active' : ''}`}
                      >
                        <span>{s.strname}</span>
                        {duration && (
                          <span className="text-[10px] font-normal text-teal-650 opacity-90 ml-1">
                            {duration}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  
                  {foldedStages.length > 0 && (
                    <div className="relative flex">
                      <button
                        type="button"
                        onClick={() => setShowStageDropdown(!showStageDropdown)}
                        className="odoo-step cursor-pointer px-4 font-bold"
                        title="Más etapas"
                      >
                        ...
                      </button>
                      
                      {showStageDropdown && (
                        <>
                          <div 
                            className="fixed inset-0 z-40 bg-transparent" 
                            onClick={() => setShowStageDropdown(false)}
                          />
                          <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-1 flex flex-col animate-in fade-in duration-100">
                            {foldedStages.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  handleStageClick(s);
                                  setShowStageDropdown(false);
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-md font-semibold transition-colors cursor-pointer"
                              >
                                {s.strname}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Título Principal */}
      <div className="space-y-1">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Asunto / Título del Ticket *</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Ej: Falla en servidor de base de datos"
          className="w-full border-b border-slate-300 focus:border-indigo-600 outline-none text-2xl font-black text-slate-800 pb-2 px-1 transition-colors"
          required
        />
      </div>

      {/* Grid de campos del ticket */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
        
        {/* Columna Izquierda: Información de Asignación */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1">
            <UserIcon size={14} className="text-slate-400" />
            Asignación e Incidencia
          </h3>

          <div>
            <label htmlFor="responsable_id_select" className="block text-xs font-semibold text-slate-600 mb-1">Agente Responsable</label>
            <Select
              inputId="responsable_id_select"
              value={agentOptions.find(opt => opt.value === (responsableId || '')) || agentOptions[0]}
              onChange={val => setResponsableId(val && val.value ? val.value : null)}
              options={agentOptions}
              placeholder="-- Seleccione un Agente --"
              isSearchable
              isDisabled={isEjecutivo && ticket && !!ticket.responsable_id}
              styles={formSelectStyles}
            />
          </div>

          <div>
            <label htmlFor="tipo_incidencia_select" className="block text-xs font-semibold text-slate-600 mb-1">Tipo de Incidencia *</label>
            <Select
              inputId="tipo_incidencia_select"
              value={incidenceTypeOptions.find(opt => opt.value === incidenceType) || incidenceTypeOptions[0]}
              onChange={val => setIncidenceType(val ? val.value : 'Soporte Técnico')}
              options={incidenceTypeOptions}
              placeholder="Seleccione el tipo de incidencia..."
              isSearchable={false}
              styles={formSelectStyles}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Prioridad (Estrellas)</label>
            <div className="flex gap-2 items-center h-[38px] border border-slate-300 rounded-lg px-3 bg-slate-50/50 w-max">
              {[1, 2, 3].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setPriority(prev => prev === star ? 0 : star)}
                  className="focus:outline-none transition-transform active:scale-95 cursor-pointer"
                >
                  <svg
                    className={`w-5 h-5 ${
                      star <= (priority ?? 0) ? 'text-amber-400 fill-current' : 'text-slate-300'
                    }`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
              ))}
              <span className="text-[10px] text-slate-500 font-bold ml-2 uppercase tracking-wide">
                {priority === 0 ? 'Sin prioridad' : priority === 1 ? 'Baja' : priority === 2 ? 'Media' : 'Alta'}
              </span>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Datos del Cliente */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1">
            <LifeBuoy size={14} className="text-slate-400" />
            Datos del Cliente / Contacto
          </h3>

          <div>
            <label htmlFor="cliente_id_select" className="block text-xs font-semibold text-slate-600 mb-1">Vincular Cliente Registrado</label>
            <Select
              inputId="cliente_id_select"
              options={clientOptions}
              value={selectedClientValue}
              onChange={handleClientChange}
              placeholder="-- Seleccione un Cliente --"
              isClearable
              isSearchable
              styles={formSelectStyles}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="contact_name" className="block text-xs font-semibold text-slate-600 mb-1">Nombre de Contacto</label>
              <input
                id="contact_name"
                type="text"
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                placeholder="Nombre del cliente"
                className="w-full border rounded-lg px-3 py-2 border-slate-300 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              />
            </div>
            <div>
              <label htmlFor="contact_email" className="block text-xs font-semibold text-slate-600 mb-1">Correo de Contacto</label>
              <input
                id="contact_email"
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder="correo@empresa.com"
                className="w-full border rounded-lg px-3 py-2 border-slate-300 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="contact_phone" className="block text-xs font-semibold text-slate-600 mb-1">Teléfono</label>
              <input
                id="contact_phone"
                type="text"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                placeholder="Teléfono de contacto"
                className="w-full border rounded-lg px-3 py-2 border-slate-300 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              />
            </div>
            <div>
              <label htmlFor="company_name" className="block text-xs font-semibold text-slate-600 mb-1">Empresa</label>
              <input
                id="company_name"
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Empresa del cliente"
                className="w-full border rounded-lg px-3 py-2 border-slate-300 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs inferiores: Descripción y Notas de resolución */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('desc')}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'desc'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Descripción del Problema
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('resol')}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 relative ${
              activeTab === 'resol'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Resolución
            {isResolvedStage && !notasResolucion.trim() && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            )}
          </button>
        </div>

        <div className="p-5">
          {activeTab === 'desc' ? (
            <div className="space-y-1">
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Por favor describe detalladamente la incidencia..."
                className="w-full min-h-[140px] outline-none text-slate-700 text-sm font-medium border border-slate-200 rounded-lg p-3 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                required
              />
            </div>
          ) : (
            <div className="space-y-3">
              {isResolvedStage && (
                <div className="flex gap-2 text-rose-800 border border-rose-200 bg-rose-50/40 p-3 rounded-lg text-xs items-center font-medium animate-fade-in">
                  <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                  <span>El ticket está en etapa **Resuelto**. Las notas de resolución son requeridas para poder guardar.</span>
                </div>
              )}
              <textarea
                value={notasResolucion}
                onChange={e => setNotasResolucion(e.target.value)}
                placeholder="Ingresa las notas y comentarios sobre la resolución de este ticket..."
                className={`w-full min-h-[140px] outline-none text-slate-700 text-sm font-medium border rounded-lg p-3 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white ${
                  isResolvedStage && !notasResolucion.trim() ? 'border-rose-300 bg-rose-50/10' : 'border-slate-200'
                }`}
              />
            </div>
          )}
        </div>
      </div>

      {/* Alertas de Validación del Cliente */}
      {validationError && (
        <div className="flex gap-2 border border-red-200 bg-red-50/30 text-red-600 text-xs font-bold uppercase tracking-wider py-3.5 px-4 rounded-xl items-center justify-center animate-in slide-in-from-top-2">
          <ShieldAlert size={16} className="stroke-[2.5]" />
          {validationError}
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex justify-end items-center border-t border-slate-100 pt-5">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-350 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </form>
  );
};

export default TicketDetail;
