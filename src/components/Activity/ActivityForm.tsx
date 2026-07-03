import React, { useState, useEffect, useMemo } from 'react';
import { type SingleValue, type MultiValue } from 'react-select';
import { Bell, BellOff, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { getOpportunities } from '../../services/opportunitiesService';
import { getActiveClients } from '../../services/clientsService';
import type { Activity, TypeActivity, ActivityReminder } from '../../core/models/Activity';
import type { Opportunity } from '../../core/models/Opportunity';
import type { Client } from '../../core/models/Client';
import { useAuth } from '../../hooks/useAuth';
import { getCompanies } from '../../services/companiesService';
import type { Company } from '../../core/models/Company';

import Input from '../shared/Input';
import TextArea from '../shared/TextArea';
import Select from '../shared/Select';
import Button from '../shared/Button';

interface Props {
    initialData?: Partial<Activity>;
    activityTypes: TypeActivity[];
    onSubmit: (activity: Partial<Activity>) => void;
    onCancel: () => void;
}

interface SelectOption {
    value: string;
    label: string;
}

const formatDateTimeForInput = (isoString?: string) => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        return date.toISOString().slice(0, 16);
    } catch (error) {
        return '';
    }
};

const ActivityForm: React.FC<Props> = ({ initialData, activityTypes, onSubmit, onCancel }) => {
    const { user, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [linkType, setLinkType] = useState<'company' | 'contact'>(
        initialData?.companyId ? 'company' : 'contact'
    );
    const [companies, setCompanies] = useState<Company[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState<Partial<Activity & { contactIds?: string[] }>>({
        activity: '',
        typeActivityId: initialData?.typeActivityId ?? (activityTypes[0]?.id || null),
        opportunityId: initialData?.opportunityId ?? null,
        clientId: initialData?.clientId ?? null,
        companyId: initialData?.companyId ?? null,
        contactIds: initialData?.contacts?.map(c => c.id!) || [],
        flaghistory: initialData?.flaghistory || false,
        ...initialData,
        date: formatDateTimeForInput(initialData?.date || new Date().toISOString()),
    });
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [clients, setClients] = useState<Client[]>([]);

    // ── Reminder state ────────────────────────────────────────────────────────
    const [reminderEnabled, setReminderEnabled] = useState<boolean>(!!initialData?.reminder);
    const [reminderForm, setReminderForm] = useState<{ title: string; date: string }>({
        title: initialData?.reminder?.title || '',
        date: formatDateTimeForInput(initialData?.reminder?.date) || '',
    });
    const isReminderNotified = !!initialData?.reminder?.notified;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [allOpportunities, activeClients, allCompanies] = await Promise.all([
                    getOpportunities(),
                    getActiveClients(),
                    getCompanies()
                ]);
                let userOpportunities = allOpportunities;

                if (!isAdmin && user?.sub) {
                    userOpportunities = allOpportunities.filter(op => op.ejecutivo_id === user.sub);
                }

                setOpportunities(userOpportunities);
                setClients(activeClients);
                setCompanies(allCompanies.filter(c => c.estatus));

            } catch (error) {
                console.error('Failed to fetch data', error);
            }
        };
        fetchData();
    }, [isAdmin, user]);

    const extendedActivityTypes = useMemo(() => {
        const hasCurrentType = activityTypes.some(type => type.id === form.typeActivityId);
        if (form.typeActivityId === null && initialData?.typeActivity) {
            const hasNullType = activityTypes.some(type => type.id === null);
            if (!hasNullType) {
                return [...activityTypes, initialData.typeActivity];
            }
        }
        if (form.typeActivityId && !hasCurrentType && initialData?.typeActivity) {
            return [...activityTypes, initialData.typeActivity];
        }
        return activityTypes;
    }, [activityTypes, form.typeActivityId, initialData?.typeActivity]);

    const opportunityOptions = useMemo(() => {
        return opportunities.map(op => ({
            value: op.id,
            label: `${op.nombre_proyecto} (${op.company?.nombre || op.cliente?.nombre || op.empresa || 'Sin asociar'})`,
        }));
    }, [opportunities]);

    const companyOptions = useMemo(() =>
        companies.map(c => ({
            value: c.id!,
            label: c.nombre,
        })),
        [companies]);

    const clientOptions = useMemo(() =>
        clients.map(c => ({
            value: c.id!,
            label: `${c.nombre} ${c.apellido} (${c.company?.nombre || c.empresa || 'Sin empresa'})`,
        })),
        [clients]);

    const companyContactOptions = useMemo(() => {
        if (!form.companyId) return [];
        const list = clients
            .filter(c => c.companyId === form.companyId || !c.companyId)
            .map(c => ({
                value: c.id!,
                label: `${c.nombre} ${c.apellido}`,
            }));
        if (list.length > 0) {
            return [{ value: 'all', label: 'Seleccionar todos' }, ...list];
        }
        return list;
    }, [clients, form.companyId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;

        let parsedValue: any = value;
        if (name === 'typeActivityId') {
            if (value === 'null') {
                parsedValue = null;
            } else {
                parsedValue = value ? parseInt(value, 10) : null;
            }
        } else if (type === 'checkbox') {
            parsedValue = checked;
        }

        setForm({
            ...form,
            [name]: parsedValue,
        });
    };

    const handleOpportunityChange = (selectedOption: SingleValue<SelectOption>) => {
        const oppId = selectedOption?.value ?? null;
        const selectedOpp = opportunities.find(op => op.id === oppId);

        setForm(prev => {
            const updated = {
                ...prev,
                opportunityId: oppId,
                flaghistory: !!selectedOption && prev.flaghistory,
            };

            if (selectedOpp) {
                if (selectedOpp.companyId) {
                    setLinkType('company');
                    updated.companyId = selectedOpp.companyId;
                    updated.clientId = null;
                    updated.contactIds = selectedOpp.contacts?.map(c => c.id!) || [];
                } else if (selectedOpp.cliente_id) {
                    setLinkType('contact');
                    updated.clientId = selectedOpp.cliente_id;
                    updated.companyId = null;
                    updated.contactIds = [];
                }
            }
            return updated;
        });
    };

    const handleCompanyChange = (selectedOption: SingleValue<SelectOption>) => {
        setForm(prev => ({
            ...prev,
            companyId: selectedOption ? selectedOption.value : null,
            contactIds: [],
            opportunityId: null,
        }));
    };

    const handleContactsChange = (selectedOptions: MultiValue<SelectOption>) => {
        const ids = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
        if (ids.includes('all')) {
            const realContactIds = companyContactOptions
                .filter(opt => opt.value !== 'all')
                .map(opt => opt.value);
            const allSelected = realContactIds.every(id => form.contactIds?.includes(id));
            setForm(prev => ({
                ...prev,
                contactIds: allSelected ? [] : realContactIds,
            }));
        } else {
            setForm(prev => ({
                ...prev,
                contactIds: ids,
            }));
        }
    };

    const handleClientChange = (selectedOption: SingleValue<SelectOption>) => {
        setForm(prev => ({
            ...prev,
            clientId: selectedOption ? selectedOption.value : null,
            opportunityId: null,
        }));
    };

    const handleReminderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setReminderForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        try {
            const finalActivity: Partial<Activity & { contactIds?: string[]; reminder?: ActivityReminder | null }> = { ...form };
            if (linkType === 'company') {
                finalActivity.clientId = null;
            } else {
                finalActivity.companyId = null;
                finalActivity.contactIds = form.clientId ? [form.clientId] : [];
            }
            // Incluir reminder o null para eliminarlo
            finalActivity.reminder = reminderEnabled ? reminderForm : null;
            await onSubmit(finalActivity);
        } catch (error) {
            console.error('Submit error:', error);
            setSubmitting(false);
        }
    };

    const handleRedirectOpportunity = () => {
        if (initialData?.opportunityId) {
            navigate(`/pipeline?opportunityId=${initialData.opportunityId}`);
        }
    };

    const selectedOpportunityValue = form.opportunityId
        ? opportunityOptions.find(option => option.value === form.opportunityId) || null
        : null;

    const selectedCompanyValue = form.companyId
        ? companyOptions.find(option => option.value === form.companyId) || null
        : null;

    const selectedClientValue = form.clientId
        ? clientOptions.find(option => option.value === form.clientId) || null
        : null;

    const selectedContactsValue = companyContactOptions.filter(option =>
        option.value !== 'all' && form.contactIds?.includes(option.value)
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-8 p-2">
            <h2 className="text-2xl font-bold text-gray-800">{initialData?.id ? 'Editar' : 'Nueva'} Actividad</h2>

            <fieldset className="space-y-4">
                <legend className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4 w-full">Detalles de la Actividad</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Select
                            label="Tipo de Actividad"
                            name="typeActivityId"
                            value={extendedActivityTypes
                                .map(type => ({ value: type.id === null ? 'null' : String(type.id), label: type.strname }))
                                .find(opt => opt.value === (form.typeActivityId === null ? 'null' : String(form.typeActivityId))) || null}
                            onChange={(opt) => {
                                const val = opt ? opt.value : 'null';
                                setForm({
                                    ...form,
                                    typeActivityId: val === 'null' ? null : parseInt(val, 10),
                                });
                            }}
                            options={extendedActivityTypes.map(type => ({
                                value: type.id === null ? 'null' : String(type.id),
                                label: type.strname
                            }))}
                            required
                            placeholder="Seleccione un tipo"
                        />
                    </div>
                    <div>
                        <Input
                            label="Fecha"
                            id="date"
                            name="date"
                            type="datetime-local"
                            value={form.date}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="md:col-span-2">
                        <TextArea
                            label="Actividad"
                            id="activity"
                            name="activity"
                            value={form.activity || ''}
                            onChange={handleChange}
                            placeholder="Descripción de la actividad"
                            required
                            rows={3}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tipo de Vinculación</label>
                        <div className="flex gap-4 mt-1">
                            <label className="inline-flex items-center cursor-pointer">
                                <input type="radio" className="form-radio text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-gray-300" name="linkType" value="company" checked={linkType === 'company'} onChange={() => { setLinkType('company'); setForm(prev => ({ ...prev, clientId: null })); }} />
                                <span className="ml-2 text-sm text-gray-700 font-medium">Empresa (Cuenta)</span>
                            </label>
                            <label className="inline-flex items-center cursor-pointer">
                                <input type="radio" className="form-radio text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-gray-300" name="linkType" value="contact" checked={linkType === 'contact'} onChange={() => { setLinkType('contact'); setForm(prev => ({ ...prev, companyId: null, contactIds: [] })); }} />
                                <span className="ml-2 text-sm text-gray-700 font-medium">Contacto Individual</span>
                            </label>
                        </div>
                    </div>

                    {linkType === 'company' ? (
                        <>
                            <div className="md:col-span-2">
                                <Select
                                    label="Empresa"
                                    inputId="companyId"
                                    name="companyId"
                                    options={companyOptions}
                                    value={selectedCompanyValue}
                                    onChange={handleCompanyChange}
                                    placeholder="-- Seleccione una empresa --"
                                    isClearable
                                    isSearchable
                                    noOptionsMessage={() => 'No se encontraron empresas'}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Select
                                    label="Contactos Asociados (Opcional)"
                                    inputId="contactIds"
                                    name="contactIds"
                                    isMulti
                                    options={companyContactOptions}
                                    value={selectedContactsValue}
                                    onChange={handleContactsChange}
                                    placeholder={form.companyId ? "-- Seleccione uno o más contactos --" : "-- Seleccione primero una empresa --"}
                                    isClearable
                                    isSearchable
                                    isDisabled={!form.companyId}
                                    noOptionsMessage={() => 'No se encontraron contactos'}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="md:col-span-2">
                            <Select
                                label="Contacto"
                                inputId="clientId"
                                name="clientId"
                                options={clientOptions}
                                value={selectedClientValue}
                                onChange={handleClientChange}
                                placeholder="-- Seleccione un contacto --"
                                isClearable
                                isSearchable
                                noOptionsMessage={() => 'No se encontraron contactos'}
                            />
                        </div>
                    )}

                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2">
                            <div className="flex-grow">
                                <Select
                                    label="Oportunidad (Opcional)"
                                    inputId="opportunityId"
                                    name="opportunityId"
                                    options={opportunityOptions}
                                    value={selectedOpportunityValue}
                                    onChange={handleOpportunityChange}
                                    placeholder="-- Seleccione una oportunidad --"
                                    isClearable
                                    isDisabled={!!initialData?.opportunityId && !initialData?.id}
                                    isSearchable
                                    noOptionsMessage={() => 'No se encontraron oportunidades'}
                                />
                            </div>
                            {initialData?.opportunityId && form.opportunityId === initialData.opportunityId && (
                                <button
                                    type="button"
                                    onClick={handleRedirectOpportunity}
                                    className="text-indigo-650 hover:text-indigo-800 p-1.5 transition-colors cursor-pointer shrink-0 flex items-center justify-center mt-4"
                                    title="Ir a la Oportunidad en el Pipeline"
                                >
                                    <ArrowRight size={22} className="stroke-[2.5]" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </fieldset>

            {/* ── Sección Recordatorio ───────────────────────────────────── */}
            <fieldset className="space-y-4">
                <legend className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4 w-full">
                    <div className="flex items-center justify-between">
                        <span>Recordatorio</span>
                        <button
                            type="button"
                            onClick={() => !isReminderNotified && setReminderEnabled(!reminderEnabled)}
                            disabled={isReminderNotified || submitting}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${isReminderNotified
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                                    : reminderEnabled
                                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                            title={
                                isReminderNotified
                                    ? 'El recordatorio ya ha sido enviado y no se puede modificar'
                                    : reminderEnabled
                                        ? 'Desactivar recordatorio'
                                        : 'Activar recordatorio'
                            }
                        >
                            {reminderEnabled ? (
                                <Bell size={16} className={isReminderNotified ? "" : "animate-pulse"} />
                            ) : (
                                <BellOff size={16} />
                            )}
                            {reminderEnabled ? (isReminderNotified ? 'Enviado' : 'Activado') : 'Desactivado'}
                        </button>
                    </div>
                </legend>

                {reminderEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-amber-50 border border-amber-200 rounded-lg p-4 animate-fade-in-down">
                        <div className="md:col-span-2">
                            <Input
                                label="Título del Recordatorio *"
                                id="reminderTitle"
                                name="title"
                                type="text"
                                value={reminderForm.title}
                                onChange={handleReminderChange}
                                placeholder="Ej: Llamar al cliente para seguimiento"
                                maxLength={100}
                                required={reminderEnabled}
                                disabled={isReminderNotified || submitting}
                                className={
                                    isReminderNotified
                                        ? 'border-gray-200 bg-gray-50/50 text-gray-500 cursor-not-allowed'
                                        : 'border-amber-300 focus:border-amber-500'
                                }
                            />
                        </div>
                        <div className="md:col-span-2">
                            <Input
                                label="Fecha y Hora del Recordatorio *"
                                id="reminderDate"
                                name="date"
                                type="datetime-local"
                                value={reminderForm.date}
                                onChange={handleReminderChange}
                                required={reminderEnabled}
                                disabled={isReminderNotified || submitting}
                                className={
                                    isReminderNotified
                                        ? 'border-gray-200 bg-gray-50/50 text-gray-500 cursor-not-allowed'
                                        : 'border-amber-300 focus:border-amber-500'
                                }
                            />
                        </div>
                    </div>
                )}
            </fieldset>

            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
                    Cancelar
                </Button>
                <Button type="submit" variant="success" loading={submitting}>
                    Guardar
                </Button>
            </div>
        </form>
    );
};

export default ActivityForm;
