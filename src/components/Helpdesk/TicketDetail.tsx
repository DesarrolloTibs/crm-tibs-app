import React, { useState, useEffect } from 'react';
import type { Ticket, TicketStage } from '../../core/models/Ticket';
import type { User } from '../../core/models/User';
import type { Client } from '../../core/models/Client';
import { getClients } from '../../services/clientsService';
import { getUsers } from '../../services/usersService';
import { useAuth } from '../../hooks/useAuth';
import StageStepper from '../shared/StageStepper';
import Select from '../shared/Select';
import Input from '../shared/Input';
import TextArea from '../shared/TextArea';
import Button from '../shared/Button';
import type { SingleValue } from 'react-select';
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

const TicketDetail: React.FC<Props> = ({ ticket, stages, onSave, onCancel, onConvertToOpportunity }) => {
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
            <Button
              type="button"
              onClick={handleAssignToMe}
              variant="secondary"
              className="!py-1.5 !px-3.5 !text-[10px] !tracking-wider"
            >
              Asignarme a mí
            </Button>
          )}
          {ticket && onConvertToOpportunity && (
            <Button
              type="button"
              onClick={() => onConvertToOpportunity(ticket)}
              variant="primary"
              className="!py-1.5 !px-3.5 !text-[10px] !tracking-wider flex items-center gap-1"
            >
              Convertir a Oportunidad
              <ArrowRight size={13} className="ml-1" />
            </Button>
          )}
        </div>

        {/* Fases del Workflow (Odoo Stepper) */}
        <StageStepper
          stages={stages}
          currentStageId={stageId}
          stageEnteredAt={ticket?.stage_entered_at}
          fallbackDate={ticket?.fecha_apertura}
          showDuration={!!ticket}
          onStageClick={(s) => handleStageClick(s as TicketStage)}
        />
      </div>

      {/* Título Principal */}
      <Input
        label="Asunto / Título del Ticket *"
        id="ticket_title"
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Ej: Falla en servidor de base de datos"
        required
      />

      {/* Grid de campos del ticket */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
        
        {/* Columna Izquierda: Información de Asignación */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1">
            <UserIcon size={14} className="text-slate-400" />
            Asignación e Incidencia
          </h3>

          <Select
            label="Agente Responsable"
            inputId="responsable_id_select"
            value={agentOptions.find(opt => opt.value === (responsableId || '')) || agentOptions[0]}
            onChange={(val: any) => setResponsableId(val && val.value ? val.value : null)}
            options={agentOptions}
            placeholder="-- Seleccione un Agente --"
            isSearchable
            isDisabled={isEjecutivo && ticket && !!ticket.responsable_id}
          />

          <Select
            label="Tipo de Incidencia *"
            inputId="tipo_incidencia_select"
            value={incidenceTypeOptions.find(opt => opt.value === incidenceType) || incidenceTypeOptions[0]}
            onChange={(val: any) => setIncidenceType(val ? val.value : 'Soporte Técnico')}
            options={incidenceTypeOptions}
            placeholder="Seleccione el tipo de incidencia..."
            isSearchable={false}
          />

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
          <Select
            label="Vincular Cliente Registrado"
            inputId="cliente_id_select"
            options={clientOptions}
            value={selectedClientValue}
            onChange={handleClientChange}
            placeholder="-- Seleccione un Cliente --"
            isClearable
            isSearchable
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              id="contact_name"
              label="Nombre de Contacto"
              type="text"
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              placeholder="Nombre del cliente"
            />
            <Input
              id="contact_email"
              label="Correo de Contacto"
              type="email"
              value={contactEmail}
              onChange={e => setContactEmail(e.target.value)}
              placeholder="correo@empresa.com"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              id="contact_phone"
              label="Teléfono"
              type="text"
              value={contactPhone}
              onChange={e => setContactPhone(e.target.value)}
              placeholder="Teléfono de contacto"
            />
            <Input
              id="company_name"
              label="Empresa"
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="Empresa del cliente"
            />
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
              <TextArea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Por favor describe detalladamente la incidencia..."
                className="w-full min-h-[140px]"
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
              <TextArea
                value={notasResolucion}
                onChange={e => setNotasResolucion(e.target.value)}
                placeholder="Ingresa las notas y comentarios sobre la resolución de este ticket..."
                className="w-full min-h-[140px]"
                error={isResolvedStage && !notasResolucion.trim() ? 'Las notas de resolución son obligatorias.' : undefined}
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
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="indigo"
          >
            Guardar Cambios
          </Button>
        </div>
      </div>
    </form>
  );
};

export default TicketDetail;
