
import React, { useState, useEffect, useMemo } from 'react';
import Select, { type SingleValue } from 'react-select';

import { getOpportunities } from '../../services/opportunitiesService';
import type { Activity } from '../../core/models/Activity';
import type { Opportunity } from '../../core/models/Opportunity';
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
    "Presentación Servicios Presencial",
    "Presentación Servicios En Línea",
    "Evento",
    "Seguimiento Oportunidad",
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
        opportunityId: initialData?.opportunityId || '',
        ...initialData, // Sobrescribimos 'date' después de esparcir initialData
        date: formatDateTimeForInput(initialData?.date || new Date().toISOString()),
    });
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

    useEffect(() => {
        const fetchOpportunities = async () => {
            try {
                const allOpportunities = await getOpportunities();
                let userOpportunities = allOpportunities;

                // Si el usuario no es admin, filtramos por su ID
                if (!isAdmin && user?.sub) {
                    userOpportunities = allOpportunities.filter(op => op.ejecutivo_id === user.sub);
                }

                setOpportunities(userOpportunities);
            } catch (error) {
                console.error('Failed to fetch opportunities', error);
            }
        };
        fetchOpportunities();
    }, [isAdmin, user]);

    const opportunityOptions: SelectOption[] = useMemo(() =>
        opportunities.map(op => ({
            value: op.id,
            label: `${op.nombre_proyecto} (${op.cliente?.nombre} - ${op.empresa})`,
        })),
    [opportunities]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleOpportunityChange = (selectedOption: SingleValue<SelectOption>) => {
        setForm({
            ...form,
            opportunityId: selectedOption ? selectedOption.value : '',
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(form);
    };

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
                        <input id="date" name="date" type="datetime-local" value={form.date} onChange={handleChange} required className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="activity" className="block text-sm font-medium text-gray-700 mb-1">Actividad</label>
                        <input id="activity" name="activity" value={form.activity} onChange={handleChange} placeholder="Descripción breve de la actividad" required maxLength={80} className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="opportunityId" className="block text-sm font-medium text-gray-700 mb-1">Oportunidad (Opcional)</label>
                        <Select
                            inputId="opportunityId"
                            name="opportunityId"
                            options={opportunityOptions}
                            value={opportunityOptions.find(option => option.value === form.opportunityId)}
                            onChange={handleOpportunityChange}
                            placeholder="-- Seleccione una oportunidad --"
                            isClearable
                            isDisabled={!!initialData?.opportunityId && !initialData?.id} // Deshabilita si es nueva actividad con ID de oportunidad
                            isSearchable
                            noOptionsMessage={() => 'No se encontraron oportunidades'}
                        />
                    </div>
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
