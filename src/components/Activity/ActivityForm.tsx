import React, { useState, useEffect, useMemo } from 'react';
import Select, { type SingleValue, type MultiValue } from 'react-select';

import { getOpportunities } from '../../services/opportunitiesService';
import { getActiveClients } from '../../services/clientsService';
import type { Activity, TypeActivity } from '../../core/models/Activity';
import type { Opportunity } from '../../core/models/Opportunity';
import type { Client } from '../../core/models/Client';
import { useAuth } from '../../hooks/useAuth';
import { getCompanies } from '../../services/companiesService';
import type { Company } from '../../core/models/Company';

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
    const [linkType, setLinkType] = useState<'company' | 'contact'>(
        initialData?.companyId ? 'company' : 'contact'
    );
    const [companies, setCompanies] = useState<Company[]>([]);
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

    const opportunityOptions = useMemo(() => {
        let filteredOpportunities = opportunities;

        if (linkType === 'company' && form.companyId) {
            filteredOpportunities = opportunities.filter(
                op => op.companyId === form.companyId
            );
        } else if (linkType === 'contact' && form.clientId) {
            filteredOpportunities = opportunities.filter(
                op => op.cliente_id === form.clientId
            );
        }

        return filteredOpportunities.map(op => ({
            value: op.id,
            label: `${op.nombre_proyecto} (${op.company?.nombre || op.cliente?.nombre || op.empresa || 'Sin asociar'})`,
        }));
    }, [opportunities, linkType, form.companyId, form.clientId]);

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
            parsedValue = value ? parseInt(value, 10) : null;
        } else if (type === 'checkbox') {
            parsedValue = checked;
        }

        setForm({
            ...form,
            [name]: parsedValue,
        });
    };

    const handleOpportunityChange = (selectedOption: SingleValue<SelectOption>) => {
        setForm({
            ...form,
            opportunityId: selectedOption?.value ?? null,
            flaghistory: !!selectedOption && form.flaghistory,
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalActivity = { ...form };
        if (linkType === 'company') {
            finalActivity.clientId = null;
        } else {
            finalActivity.companyId = null;
            finalActivity.contactIds = form.clientId ? [form.clientId] : [];
        }
        onSubmit(finalActivity);
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
                        <label htmlFor="typeActivityId" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Actividad</label>
                        <select id="typeActivityId" name="typeActivityId" value={form.typeActivityId || ''} onChange={handleChange} required className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="">Seleccione un tipo</option>
                            {activityTypes.map(type => (
                                <option key={type.id} value={type.id}>{type.strname}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                        <input id="date" name="date" type="datetime-local" value={form.date} onChange={handleChange} required className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 bg-white appearance-none min-w-0" />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="activity" className="block text-sm font-medium text-gray-700 mb-1">Actividad</label>
                        <input id="activity" name="activity" value={form.activity || ''} onChange={handleChange} placeholder="Descripción breve de la actividad" required maxLength={80} className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Vinculación</label>
                        <div className="flex gap-4 mt-1">
                            <label className="inline-flex items-center cursor-pointer">
                                <input type="radio" className="form-radio text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-gray-300" name="linkType" value="company" checked={linkType === 'company'} onChange={() => { setLinkType('company'); setForm(prev => ({ ...prev, clientId: null })); }} />
                                <span className="ml-2 text-sm text-gray-700">Empresa (Cuenta)</span>
                            </label>
                            <label className="inline-flex items-center cursor-pointer">
                                <input type="radio" className="form-radio text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-gray-300" name="linkType" value="contact" checked={linkType === 'contact'} onChange={() => { setLinkType('contact'); setForm(prev => ({ ...prev, companyId: null, contactIds: [] })); }} />
                                <span className="ml-2 text-sm text-gray-700">Contacto Individual</span>
                            </label>
                        </div>
                    </div>

                    {linkType === 'company' ? (
                        <>
                            <div className="md:col-span-2">
                                <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                                <Select
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
                                <label htmlFor="contactIds" className="block text-sm font-medium text-gray-700 mb-1">Contactos Asociados (Opcional)</label>
                                <Select
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
                            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
                            <Select
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
                        <label htmlFor="opportunityId" className="block text-sm font-medium text-gray-700 mb-1">Oportunidad (Opcional)</label>
                        <Select
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
                    {form.opportunityId && (
                        <div className="md:col-span-2 flex items-center">
                            <input
                                id="flaghistory"
                                name="flaghistory"
                                type="checkbox"
                                checked={form.flaghistory || false}
                                onChange={handleChange}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="flaghistory" className="ml-2 block text-sm font-medium text-gray-700">
                                Agregar a Historial
                            </label>
                        </div>
                    )}
                </div>
            </fieldset>

            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onCancel} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
                    Cancelar
                </button>
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    Guardar
                </button>
            </div>
        </form>
    );
};

export default ActivityForm;
