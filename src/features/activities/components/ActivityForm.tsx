import React, { useState, useEffect, useMemo } from 'react';
import type { SingleValue, MultiValue } from 'react-select';
import { Bell, BellOff, ArrowRight, Check, Briefcase, Clock, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import type {
  Activity,
  TypeActivity,
  ActivityReminder,
  Opportunity,
  Client,
  Company,
  ActivityFormData,
} from '../schemas/activities.schema';
import {
  formatDateTimeForInput,
  validateActivityForm,
} from '../utils/activities.helpers';

import { useAuth } from '@features/auth';
import { getOpportunities, getOpportunity } from '@core/services/opportunitiesService';
import { getActiveClients } from '@core/services/clientsService';
import { getCompanies } from '@core/services/companiesService';

import FormField from '@shared/components/FormField';
import TextArea from '@shared/components/TextArea';
import Select from '@shared/components/Select';
import Button from '@shared/components/Button';

interface ActivityFormProps {
  initialData?: Partial<Activity> | null;
  activityTypes: TypeActivity[];
  onSubmit: (activity: Partial<Activity>) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
  opportunities?: Opportunity[];
  clients?: Client[];
  companies?: Company[];
}

interface SelectOption {
  value: string;
  label: string;
}

export const ActivityForm: React.FC<ActivityFormProps> = ({
  initialData,
  activityTypes,
  onSubmit,
  onCancel,
  submitting = false,
  opportunities: propOpportunities,
  clients: propClients,
  companies: propCompanies,
}) => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Entidades auxiliares
  const [internalOpportunities, setInternalOpportunities] = useState<Opportunity[]>([]);
  const [internalClients, setInternalClients] = useState<Client[]>([]);
  const [internalCompanies, setInternalCompanies] = useState<Company[]>([]);

  const opportunities = propOpportunities ?? internalOpportunities;
  const clients = propClients ?? internalClients;
  const companies = propCompanies ?? internalCompanies;

  // Estado del formulario
  const [formData, setFormData] = useState<ActivityFormData>(() => {
    const opp = initialData?.opportunity;
    const initialCompanyId = initialData?.companyId ?? (opp?.companyId || null);
    const initialClientId = initialData?.clientId ?? (opp?.cliente_id || null);
    const initialContactIds =
      initialData?.contacts?.map((c) => c.id!) || (opp?.contacts?.map((c) => c.id!) || []);

    const defaultLinkType: 'company' | 'contact' =
      initialCompanyId || opp?.companyId ? 'company' : initialClientId || opp?.cliente_id ? 'contact' : 'company';

    return {
      activity: initialData?.activity || '',
      typeActivityId: initialData?.typeActivityId ?? (activityTypes[0]?.id || null),
      date: formatDateTimeForInput(initialData?.date || new Date().toISOString()),
      linkType: defaultLinkType,
      companyId: initialCompanyId,
      contactIds: initialContactIds,
      clientId: initialClientId,
      opportunityId: initialData?.opportunityId ?? null,
      flaghistory: initialData?.flaghistory || false,
      reminderEnabled: Boolean(initialData?.reminder),
      reminderTitle: initialData?.reminder?.title || '',
      reminderDate: formatDateTimeForInput(initialData?.reminder?.date) || '',
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const isReminderNotified = Boolean(initialData?.reminder?.notified);

  // Cargar catálogos si no fueron provistos por props
  useEffect(() => {
    if (propOpportunities && propClients && propCompanies) return;

    let isMounted = true;
    const fetchCatalogs = async () => {
      try {
        const [allOpps, activeClients, allCompanies] = await Promise.all([
          !propOpportunities ? getOpportunities().catch(() => []) : Promise.resolve([]),
          !propClients ? getActiveClients().catch(() => []) : Promise.resolve([]),
          !propCompanies ? getCompanies().catch(() => []) : Promise.resolve([]),
        ]);

        if (!isMounted) return;

        if (!propOpportunities) {
          let userOpps = allOpps;
          if (!isAdmin && user?.sub) {
            userOpps = allOpps.filter((op) => op.ejecutivo_id === user.sub);
          }

          if (initialData?.opportunity && !userOpps.some((op) => op.id === initialData.opportunity!.id)) {
            userOpps = [initialData.opportunity, ...userOpps];
          } else if (initialData?.opportunityId && !userOpps.some((op) => op.id === initialData.opportunityId)) {
            try {
              const singleOpp = await getOpportunity(initialData.opportunityId);
              if (singleOpp && isMounted) {
                userOpps = [singleOpp, ...userOpps];
              }
            } catch {
              // Ignore single fetch error
            }
          }
          setInternalOpportunities(userOpps);
        }

        if (!propClients) {
          setInternalClients(activeClients);
        }

        if (!propCompanies) {
          setInternalCompanies(allCompanies.filter((c) => c.estatus !== false));
        }
      } catch (err) {
        console.error('Error al cargar catálogos en ActivityForm:', err);
      }
    };

    fetchCatalogs();
    return () => {
      isMounted = false;
    };
  }, [propOpportunities, propClients, propCompanies, isAdmin, user?.sub, initialData?.opportunity, initialData?.opportunityId]);

  // Sincronizar autocompletado si se selecciona una oportunidad con empresa o contacto
  useEffect(() => {
    if (formData.opportunityId && !formData.companyId && !formData.clientId && opportunities.length > 0) {
      const opp = opportunities.find((o) => o.id === formData.opportunityId);
      if (opp) {
        if (opp.companyId) {
          setFormData((prev) => ({
            ...prev,
            linkType: 'company',
            companyId: opp.companyId ?? null,
            contactIds: prev.contactIds?.length ? prev.contactIds : (opp.contacts?.map((c) => c.id!) || []),
          }));
        } else if (opp.cliente_id) {
          setFormData((prev) => ({
            ...prev,
            linkType: 'contact',
            clientId: opp.cliente_id ?? null,
          }));
        }
      }
    }
  }, [formData.opportunityId, opportunities]);

  // Manejo de cambios en campos directos
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleBlur = async (field: keyof ActivityFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const result = await validateActivityForm(formData);
    if (!result.isValid && result.errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: result.errors[field] }));
    }
  };

  // Manejo de tipo de actividad
  const handleTypeActivityChange = (selected: SingleValue<SelectOption>) => {
    const val = selected ? (selected.value === 'null' ? null : parseInt(selected.value, 10)) : null;
    setFormData((prev) => ({ ...prev, typeActivityId: val }));
    if (errors.typeActivityId) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.typeActivityId;
        return next;
      });
    }
  };

  // Manejo de vinculación
  const handleLinkTypeChange = (type: 'company' | 'contact') => {
    setFormData((prev) => ({
      ...prev,
      linkType: type,
      companyId: type === 'company' ? prev.companyId : null,
      contactIds: type === 'company' ? prev.contactIds : [],
      clientId: type === 'contact' ? prev.clientId : null,
    }));
  };

  const handleCompanyChange = (selected: SingleValue<SelectOption>) => {
    setFormData((prev) => ({
      ...prev,
      companyId: selected ? selected.value : null,
      contactIds: [],
    }));
  };

  const handleContactsChange = (selected: MultiValue<SelectOption>) => {
    const ids = selected ? selected.map((opt) => opt.value) : [];
    if (ids.includes('all')) {
      const realContactIds = companyContactOptions
        .filter((opt) => opt.value !== 'all')
        .map((opt) => opt.value);
      const allSelected = realContactIds.every((id) => formData.contactIds?.includes(id));
      setFormData((prev) => ({
        ...prev,
        contactIds: allSelected ? [] : realContactIds,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        contactIds: ids,
      }));
    }
  };

  const handleClientChange = (selected: SingleValue<SelectOption>) => {
    setFormData((prev) => ({
      ...prev,
      clientId: selected ? selected.value : null,
    }));
  };

  const handleOpportunityChange = (selected: SingleValue<SelectOption>) => {
    const oppId = selected?.value ?? null;
    const selectedOpp = opportunities.find((op) => op.id === oppId);

    setFormData((prev) => {
      const updated: ActivityFormData = {
        ...prev,
        opportunityId: oppId,
        flaghistory: Boolean(selected) && prev.flaghistory,
      };

      if (selectedOpp) {
        if (selectedOpp.companyId) {
          updated.linkType = 'company';
          updated.companyId = selectedOpp.companyId ?? null;
          updated.clientId = null;
          updated.contactIds = selectedOpp.contacts?.map((c) => c.id!) || [];
        } else if (selectedOpp.cliente_id) {
          updated.linkType = 'contact';
          updated.clientId = selectedOpp.cliente_id ?? null;
          updated.companyId = null;
          updated.contactIds = [];
        }
      }
      return updated;
    });
  };

  // Toggle recordatorio
  const handleToggleReminder = () => {
    if (isReminderNotified) return;
    setFormData((prev) => {
      const nextEnabled = !prev.reminderEnabled;
      return {
        ...prev,
        reminderEnabled: nextEnabled,
        reminderTitle: nextEnabled ? prev.reminderTitle || prev.activity : '',
        reminderDate: nextEnabled ? prev.reminderDate || prev.date : '',
      };
    });
  };

  // Envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { isValid, errors: validationErrors } = await validateActivityForm(formData);

    if (!isValid) {
      setErrors(validationErrors);
      setTouched({
        activity: true,
        typeActivityId: true,
        date: true,
        reminderTitle: formData.reminderEnabled,
        reminderDate: formData.reminderEnabled,
      });
      return;
    }

    const payload: Partial<Activity & { contactIds?: string[]; reminder?: ActivityReminder | null }> = {
      activity: formData.activity,
      typeActivityId: formData.typeActivityId,
      date: formData.date,
      opportunityId: formData.opportunityId,
      flaghistory: formData.flaghistory,
    };

    if (formData.linkType === 'company') {
      payload.companyId = formData.companyId;
      payload.clientId = null;
      payload.contactIds = formData.contactIds;
    } else {
      payload.companyId = null;
      payload.clientId = formData.clientId;
      payload.contactIds = formData.clientId ? [formData.clientId] : [];
    }

    if (formData.reminderEnabled && formData.reminderTitle && formData.reminderDate) {
      payload.reminder = {
        title: formData.reminderTitle,
        date: formData.reminderDate,
      };
    } else {
      payload.reminder = null;
    }

    await onSubmit(payload);
  };

  // Mapeo de opciones para selects
  const extendedActivityTypes = useMemo(() => {
    const list = [...activityTypes];
    if (initialData?.typeActivity && !list.some((t) => t.id === initialData.typeActivity!.id)) {
      list.push(initialData.typeActivity);
    }
    return list;
  }, [activityTypes, initialData?.typeActivity]);

  const activityTypeOptions = useMemo(
    () =>
      extendedActivityTypes.map((t) => ({
        value: String(t.id),
        label: t.strname,
      })),
    [extendedActivityTypes]
  );

  const companyOptions = useMemo(
    () =>
      companies.map((c) => ({
        value: c.id!,
        label: c.nombre,
      })),
    [companies]
  );

  const clientOptions = useMemo(
    () =>
      clients.map((c) => ({
        value: c.id!,
        label: `${c.nombre} ${c.apellido || ''} ${c.company?.nombre || c.empresa ? `(${c.company?.nombre || c.empresa})` : ''}`.trim(),
      })),
    [clients]
  );

  const companyContactOptions = useMemo(() => {
    if (!formData.companyId) return [];
    const list = clients
      .filter((c) => c.companyId === formData.companyId || !c.companyId)
      .map((c) => ({
        value: c.id!,
        label: `${c.nombre} ${c.apellido || ''}`.trim(),
      }));

    if (list.length > 0) {
      return [{ value: 'all', label: 'Seleccionar todos' }, ...list];
    }
    return list;
  }, [clients, formData.companyId]);

  const opportunityOptions = useMemo(
    () =>
      opportunities.map((op) => ({
        value: op.id,
        label: `${op.nombre_proyecto} (${op.company?.nombre || op.cliente?.nombre || op.empresa || 'Sin asociar'})`,
      })),
    [opportunities]
  );

  const selectedTypeOption =
    activityTypeOptions.find((opt) => opt.value === String(formData.typeActivityId)) || null;

  const selectedCompanyOption =
    companyOptions.find((opt) => opt.value === formData.companyId) || null;

  const selectedClientOption =
    clientOptions.find((opt) => opt.value === formData.clientId) || null;

  const selectedContactsOption = companyContactOptions.filter(
    (opt) => opt.value !== 'all' && formData.contactIds?.includes(opt.value)
  );

  const selectedOpportunityOption =
    opportunityOptions.find((opt) => opt.value === formData.opportunityId) ||
    (initialData?.opportunity && initialData.opportunity.id === formData.opportunityId
      ? {
          value: initialData.opportunity.id,
          label: `${initialData.opportunity.nombre_proyecto} (${initialData.opportunity.company?.nombre || 'Sin asociar'})`,
        }
      : null);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Sección 1: Información de la Actividad ── */}
      <div className="space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 block">
            1. Detalles de la Cita o Actividad
          </span>
          <p className="text-xs text-slate-400 mt-0.5">
            Define el tipo de compromiso, fecha de ejecución y descripción del evento.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Select
              label="Tipo de Actividad *"
              inputId="activity-type"
              name="typeActivityId"
              options={activityTypeOptions}
              value={selectedTypeOption}
              onChange={handleTypeActivityChange}
              placeholder="-- Selecciona tipo --"
              required
            />
            {touched.typeActivityId && errors.typeActivityId && (
              <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.typeActivityId}</p>
            )}
          </div>

          <FormField
            id="activity-date"
            label="Fecha y Hora *"
            name="date"
            type="datetime-local"
            value={formData.date}
            onChange={handleChange}
            onBlur={() => handleBlur('date')}
            error={touched.date ? errors.date : undefined}
            inputPrefix={<Clock size={15} className="text-slate-400" />}
            required
          />
        </div>

        <div>
          <TextArea
            id="activity-description"
            label="Descripción de la Actividad *"
            name="activity"
            value={formData.activity}
            onChange={handleChange}
            onBlur={() => handleBlur('activity')}
            placeholder="Ej. Reunión presencial para revisión de cotización y alcance..."
            rows={3}
            required
            className="resize-none"
            error={touched.activity && errors.activity ? errors.activity : undefined}
          />
        </div>
      </div>

      {/* ── Sección 2: Vinculación Comercial & Pipeline ── */}
      <div className="space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 block">
            2. Vinculación Comercial & Contactos
          </span>
          <p className="text-xs text-slate-400 mt-0.5">
            Asocia la actividad a una empresa matriz, contacto directo u oportunidad del embudo.
          </p>
        </div>

        {/* Selector de modo de vinculación */}
        <div>
          <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Tipo de Vinculación
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleLinkTypeChange('company')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                formData.linkType === 'company'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Briefcase size={14} />
              <span>Cuenta de Empresa (B2B)</span>
            </button>

            <button
              type="button"
              onClick={() => handleLinkTypeChange('contact')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                formData.linkType === 'contact'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText size={14} />
              <span>Contacto Individual</span>
            </button>
          </div>
        </div>

        {formData.linkType === 'company' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Select
                label="Empresa / Cuenta Matriz"
                inputId="activity-company"
                name="companyId"
                options={companyOptions}
                value={selectedCompanyOption}
                onChange={handleCompanyChange}
                placeholder="-- Selecciona una empresa --"
                isClearable
                isSearchable
                noOptionsMessage={() => 'No se encontraron empresas'}
              />
            </div>

            <div>
              <Select
                label="Contactos Convocados (Opcional)"
                inputId="activity-contacts"
                name="contactIds"
                isMulti
                options={companyContactOptions}
                value={selectedContactsOption}
                onChange={handleContactsChange}
                placeholder={
                  formData.companyId
                    ? '-- Selecciona uno o más contactos --'
                    : '-- Selecciona primero una empresa --'
                }
                isClearable
                isSearchable
                isDisabled={!formData.companyId}
                noOptionsMessage={() => 'No hay contactos disponibles'}
              />
            </div>
          </div>
        ) : (
          <div>
            <Select
              label="Contacto Individual"
              inputId="activity-client"
              name="clientId"
              options={clientOptions}
              value={selectedClientOption}
              onChange={handleClientChange}
              placeholder="-- Selecciona un contacto --"
              isClearable
              isSearchable
              noOptionsMessage={() => 'No se encontraron contactos'}
            />
          </div>
        )}

        <div>
          <div className="flex items-center gap-2">
            <div className="flex-grow">
              <Select
                label="Oportunidad del Embudo (Opcional)"
                inputId="activity-opportunity"
                name="opportunityId"
                options={opportunityOptions}
                value={selectedOpportunityOption}
                onChange={handleOpportunityChange}
                placeholder="-- Asociar a un negocio comercial --"
                isClearable
                isSearchable
                isDisabled={Boolean(initialData?.opportunityId)}
                noOptionsMessage={() => 'No se encontraron oportunidades'}
              />
            </div>
            {initialData?.opportunityId && (
              <Button
                type="button"
                variant="icon"
                onClick={() => navigate(`/pipeline?opportunityId=${initialData.opportunityId}`)}
                className="mt-6 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 !p-2 shrink-0"
                title="Abrir oportunidad en Pipeline"
              >
                <ArrowRight size={18} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Sección 3: Recordatorio & Alertas ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 block">
              3. Alerta de Recordatorio
            </span>
            <p className="text-xs text-slate-400 mt-0.5">
              Configura un aviso previo con notificación y campanita de seguimiento.
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleReminder}
            disabled={isReminderNotified || submitting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isReminderNotified
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : formData.reminderEnabled
                ? 'bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {formData.reminderEnabled ? (
              <Bell size={13} className={isReminderNotified ? '' : 'text-amber-600 animate-bounce'} />
            ) : (
              <BellOff size={13} className="text-slate-400" />
            )}
            <span>
              {isReminderNotified
                ? 'Enviado'
                : formData.reminderEnabled
                ? 'Recordatorio Activo'
                : 'Sin Recordatorio'}
            </span>
          </button>
        </div>

        {formData.reminderEnabled && (
          <div className="p-4 bg-amber-50/60 border border-amber-200/70 rounded-2xl space-y-3">
            <FormField
              id="reminder-title"
              label="Título de la Alerta *"
              name="reminderTitle"
              value={formData.reminderTitle}
              onChange={handleChange}
              onBlur={() => handleBlur('reminderTitle')}
              placeholder="Ej. Llamar 10 min antes para confirmar acceso..."
              maxLength={100}
              error={touched.reminderTitle ? errors.reminderTitle : undefined}
              disabled={isReminderNotified}
              inputPrefix={<Bell size={14} className="text-amber-500" />}
            />

            <FormField
              id="reminder-date"
              label="Fecha y Hora de la Notificación *"
              name="reminderDate"
              type="datetime-local"
              value={formData.reminderDate}
              onChange={handleChange}
              onBlur={() => handleBlur('reminderDate')}
              error={touched.reminderDate ? errors.reminderDate : undefined}
              disabled={isReminderNotified}
              inputPrefix={<Clock size={14} className="text-amber-500" />}
            />
          </div>
        )}
      </div>

      {/* ── Botones de Acción (Sticky al fondo) ── */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs flex items-center justify-end gap-3 pt-4 pb-2 border-t border-slate-100 mt-6 z-10 -mx-6 sm:-mx-7 px-6 sm:px-7">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancelar
        </Button>

        <Button
          type="submit"
          variant="success"
          disabled={submitting}
          loading={submitting}
          className="gap-2 shadow-sm"
        >
          <Check size={16} />
          {initialData?.id ? 'Guardar Cambios' : 'Registrar Actividad'}
        </Button>
      </div>
    </form>
  );
};

export default ActivityForm;
