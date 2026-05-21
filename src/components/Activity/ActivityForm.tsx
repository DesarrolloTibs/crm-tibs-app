
import React, { useState, useEffect, useMemo } from 'react';
import Select, { type SingleValue } from 'react-select';

import { getOpportunities } from '../../services/opportunitiesService';
import { getActiveClients } from '../../services/clientsService';
import type { Activity } from '../../core/models/Activity';
import type { Opportunity } from '../../core/models/Opportunity';
import type { Client } from '../../core/models/Client';
import { useAuth } from '../../hooks/useAuth';

interface Props {
    initialData?: Partial<Activity>;
    onSubmit: (activity: Partial<Activity>) => void;
    onCancel: () => void;
}

interface SelectOption {
    value: string;
    label: string;
}

const activityTypes = [
    "Correo",
    "Evento",
    "Presentación Servicios Presencial",
    "Presentación Servicios En Línea",
    "Seguimiento Oportunidad Línea",
    "Seguimiento Oportunidad Presencial",
    "Llamada",
     "Otros"
    
];

const formatDateTimeForInput = (isoString?: string) => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        // Restamos el offset de la zona horaria para que la hora se muestre correctamente en el input local
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        return date.toISOString().slice(0, 16);
    } catch (error) {
        return '';
    }
};

const ActivityForm: React.FC<Props> = ({ initialData, onSubmit, onCancel }) => {
    const { user, isAdmin } = useAuth();
    const [form, setForm] = useState<Partial<Activity>>({
        activity: '',
        activityType: 'Correo',
        opportunityId: initialData?.opportunityId ?? null,
        clientId: initialData?.clientId ?? null,
        flaghistory: initialData?.flaghistory || false,
        ...initialData,
        date: formatDateTimeForInput(initialData?.date || new Date().toISOString()),
    });
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [clients, setClients] = useState<Client[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const allOpportunities = await getOpportunities();
                let userOpportunities = allOpportunities;

                if (!isAdmin && user?.sub) {
                    userOpportunities = allOpportunities.filter(op => op.ejecutivo_id === user.sub);
                }

                setOpportunities(userOpportunities);

                const activeClients = await getActiveClients();
                setClients(activeClients);

            } catch (error) {
                console.error('Failed to fetch data', error);
            }
        };
        fetchData();
    }, [isAdmin, user]);

    const opportunityOptions: SelectOption[] = useMemo(() => {
        let filteredOpportunities = opportunities;

        if (form.clientId) {
            filteredOpportunities = opportunities.filter(
                op => op.cliente?.id === form.clientId
            );
        }

        return filteredOpportunities.map(op => ({
            value: op.id,
            label: `${op.nombre_proyecto} (${op.cliente?.nombre} - ${op.empresa})`,
        }));
    }, [opportunities, form.clientId]);

    const clientOptions: SelectOption[] = useMemo(() =>
        clients.filter(client => client.id !== undefined).map(client => ({
            value: client.id as string,
            label: `${client.nombre} (${client.empresa})`,
        })),
    [clients]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        setForm({
            ...form,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleOpportunityChange = (selectedOption: SingleValue<SelectOption>) => {
        setForm({
            ...form,
            opportunityId: selectedOption?.value ?? null,
            flaghistory: !!selectedOption && form.flaghistory,
        });
    };

    const handleClientChange = (selectedOption: SingleValue<SelectOption>) => {
        setForm({
            ...form,
            clientId: selectedOption ? selectedOption.value : null,
            opportunityId: null, // Resetear la oportunidad al cambiar el cliente
            flaghistory: false, // Resetear el historial al cambiar el cliente
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(form);
    };

    // Determina el valor para el Select de Oportunidad.
    // Si opportunityId es null, el valor del Select debe ser null para que se reinicie visualmente.
    const selectedOpportunityValue = form.opportunityId
        ? opportunityOptions.find(option => option.value === form.opportunityId) || null
        : null;
    return (
        <form onSubmit={handleSubmit} className="space-y-8 p-2">
            <h2 className="text-2xl font-bold text-gray-800">{initialData?.id ? 'Editar' : 'Nueva'} Actividad</h2>

            <fieldset className="space-y-4">
                <legend className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4 w-full">Detalles de la Actividad</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="activityType" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Actividad</label>
                        <select id="activityType" name="activityType" value={form.activityType} onChange={handleChange} required className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="">Seleccione un tipo</option>
                            {activityTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                        <input id="date" name="date" type="datetime-local" value={form.date} onChange={handleChange} required className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 bg-white appearance-none min-w-0" />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="activity" className="block text-sm font-medium text-gray-700 mb-1">Actividad</label>
                        <input id="activity" name="activity" value={form.activity} onChange={handleChange} placeholder="Descripción breve de la actividad" required maxLength={80} className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">Cliente (Opcional)</label>
                        <Select
                            inputId="clientId"
                            name="clientId"
                            options={clientOptions}
                            value={clientOptions.find(option => option.value === form.clientId)}
                            onChange={handleClientChange}
                            placeholder="-- Seleccione un cliente --"
                            isClearable
                            isSearchable
                            noOptionsMessage={() => 'No se encontraron clientes'}
                        />
                    </div>
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
