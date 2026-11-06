import React, { useState, useEffect, useMemo } from 'react';
import Select from '@shared/components/Select';
import Input from '@shared/components/Input';
import Button from '@shared/components/Button';
import type { Expense } from '@core/models/Expense';
import { getActiveClients, getClients } from '@core/services/clientsService';
import { getAllOpportunities } from '@core/services/opportunitiesService';
import type { Client } from '@core/models/Client';
import type { Opportunity } from '@core/models/Opportunity';

interface Props {
    initialData?: Expense;
    onSubmit: (expense: Partial<Expense>) => Promise<void> | void;
    onCancel: () => void;
}

type AssociationType = 'client' | 'opportunity';

/**
 * Extrae el client_id de initialData tolerando relaciones anidadas o variantes de nombres
 */
const getInitialClientId = (data?: Expense | null): string | null => {
    if (!data) return null;
    return (
        data.client_id ||
        (data as any).clientId ||
        (data as any).cliente_id ||
        data.client?.id ||
        null
    );
};

/**
 * Extrae el opportunity_id de initialData tolerando relaciones anidadas o variantes de nombres
 */
const getInitialOpportunityId = (data?: Expense | null): string | null => {
    if (!data) return null;
    return (
        data.opportunity_id ||
        (data as any).opportunityId ||
        (data as any).oportunidad_id ||
        data.opportunity?.id ||
        null
    );
};

/**
 * Determina el tipo de asociación inicial según la presencia de oportunidad o cliente
 */
const getInitialAssociationType = (data?: Expense | null): AssociationType => {
    if (!data) return 'client';
    const oppId = getInitialOpportunityId(data);
    if (oppId || data.opportunity) {
        return 'opportunity';
    }
    return 'client';
};

/**
 * Formatea de forma segura la etiqueta de selección de cliente evitando guiones colgantes
 */
const formatClientLabel = (client: Client) => {
    const nombreCompleto = [client.nombre, client.apellido].map(s => s?.trim()).filter(Boolean).join(' ');
    const detalles = [client.company?.nombre || client.empresa, client.puesto].map(s => s?.trim()).filter(Boolean).join(' - ');
    return detalles ? `${nombreCompleto} (${detalles})` : nombreCompleto;
};

const ExpenseForm: React.FC<Props> = ({ initialData, onSubmit, onCancel }) => {
    const [form, setForm] = useState<{
        fecha: string;
        concepto: string;
        monto: number | string;
    }>(() => ({
        fecha: initialData?.fecha ? initialData.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
        concepto: initialData?.concepto || '',
        monto: initialData?.monto !== undefined ? Number(initialData.monto) : 0,
    }));

    const [clientId, setClientId] = useState<string | null>(() => getInitialClientId(initialData));
    const [opportunityId, setOpportunityId] = useState<string | null>(() => getInitialOpportunityId(initialData));
    const [associationType, setAssociationType] = useState<AssociationType>(() => getInitialAssociationType(initialData));

    const [clients, setClients] = useState<Client[]>([]);
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Sincronizar estado cuando cambie initialData (al abrir o cambiar de registro en edición)
    useEffect(() => {
        if (initialData) {
            setForm({
                fecha: initialData.fecha ? initialData.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
                concepto: initialData.concepto || '',
                monto: initialData.monto !== undefined ? Number(initialData.monto) : 0,
            });
            setClientId(getInitialClientId(initialData));
            setOpportunityId(getInitialOpportunityId(initialData));
            setAssociationType(getInitialAssociationType(initialData));
        }
    }, [initialData]);

    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            // Cargar clientes
            try {
                let clientsData: Client[] = [];
                try {
                    clientsData = await getActiveClients();
                } catch {
                    clientsData = await getClients();
                }
                if (isMounted) setClients(Array.isArray(clientsData) ? clientsData : []);
            } catch (e) {
                console.error("Error loading clients", e);
            }

            // Cargar oportunidades
            try {
                const oppsData = await getAllOpportunities();
                if (isMounted) setOpportunities(Array.isArray(oppsData) ? oppsData : []);
            } catch (e) {
                console.error("Error loading opportunities", e);
            }
        };
        loadData();
        return () => {
            isMounted = false;
        };
    }, []);

    // Opciones de clientes, asegurando que el cliente inicial esté disponible para preselección
    const clientOptions = useMemo(() => {
        const options = clients.map(c => ({
            value: c.id!,
            label: formatClientLabel(c),
        }));

        const initClientId = getInitialClientId(initialData);
        if (initClientId && !options.some(o => o.value === initClientId)) {
            const label = initialData?.client
                ? formatClientLabel(initialData.client as any)
                : 'Cliente actual';
            options.unshift({
                value: initClientId,
                label,
            });
        }
        return options;
    }, [clients, initialData]);

    // Opciones de oportunidades, asegurando que la oportunidad inicial esté disponible para preselección
    const opportunityOptions = useMemo(() => {
        const options = opportunities.map(o => ({
            value: o.id!,
            label: `${o.nombre_proyecto}${o.empresa ? ` - ${o.empresa}` : ''}`,
        }));

        const initOppId = getInitialOpportunityId(initialData);
        if (initOppId && !options.some(o => o.value === initOppId)) {
            const label = initialData?.opportunity?.nombre_proyecto || 'Oportunidad actual';
            options.unshift({
                value: initOppId,
                label,
            });
        }
        return options;
    }, [opportunities, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleClientChange = (option: { value: string; label: string } | null) => {
        setClientId(option ? option.value : null);
    };

    const handleOpportunityChange = (option: { value: string; label: string } | null) => {
        setOpportunityId(option ? option.value : null);
    };

    const handleAmountBlur = () => {
        if (form.monto !== undefined && String(form.monto) !== '') {
            const amount = Number(form.monto);
            if (!isNaN(amount)) {
                setForm(prev => ({
                    ...prev,
                    monto: Number(amount.toFixed(2))
                }));
            }
        }
    };

    const handleAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === ',') {
            e.preventDefault();
        }
    };

    const handleAssociationTypeChange = (type: AssociationType) => {
        setAssociationType(type);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (associationType === 'client' && !clientId) {
            alert('Debes seleccionar un cliente');
            return;
        }
        if (associationType === 'opportunity' && !opportunityId) {
            alert('Debes seleccionar una oportunidad');
            return;
        }

        // Sanitizar payload: enviar únicamente los campos editables sin metadatos ni relaciones
        const payload: Partial<Expense> = {
            fecha: form.fecha,
            concepto: form.concepto.trim(),
            monto: Number(form.monto),
            client_id: associationType === 'client' ? clientId || null : null,
            opportunity_id: associationType === 'opportunity' ? opportunityId || null : null,
        };

        setIsSubmitting(true);
        try {
            await onSubmit(payload);
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedClientOption = useMemo(
        () => clientOptions.find(c => c.value === clientId) || null,
        [clientOptions, clientId]
    );

    const selectedOpportunityOption = useMemo(
        () => opportunityOptions.find(o => o.value === opportunityId) || null,
        [opportunityOptions, opportunityId]
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-6 p-2">
            <h2 className="text-2xl font-bold text-gray-800">{initialData ? 'Editar' : 'Registrar'} Gasto</h2>

            <div className="border-b border-gray-200 pb-4 mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">Asociar Gasto a:</label>
                <div className="flex space-x-6 mb-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="radio"
                            name="associationType"
                            checked={associationType === 'client'}
                            onChange={() => handleAssociationTypeChange('client')}
                            className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Cliente</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="radio"
                            name="associationType"
                            checked={associationType === 'opportunity'}
                            onChange={() => handleAssociationTypeChange('opportunity')}
                            className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Oportunidad</span>
                    </label>
                </div>

                {associationType === 'client' ? (
                    <div className="animate-fade-in">
                        <Select
                            label="Seleccionar Cliente"
                            options={clientOptions}
                            value={selectedClientOption}
                            onChange={handleClientChange}
                            placeholder="Buscar cliente..."
                            isClearable
                            isSearchable
                        />
                    </div>
                ) : (
                    <div className="animate-fade-in">
                        <Select
                            label="Seleccionar Oportunidad"
                            options={opportunityOptions}
                            value={selectedOpportunityOption}
                            onChange={handleOpportunityChange}
                            placeholder="Buscar oportunidad..."
                            isClearable
                            isSearchable
                        />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="Fecha"
                    type="date"
                    name="fecha"
                    value={form.fecha}
                    onChange={handleChange}
                    required
                />
                <Input
                    label="Monto"
                    type="number"
                    name="monto"
                    value={form.monto}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    onBlur={handleAmountBlur}
                    onKeyDown={handleAmountKeyDown}
                    placeholder="0.00"
                    inputPrefix="$"
                />
                <div className="md:col-span-2">
                    <Input
                        label="Concepto"
                        type="text"
                        name="concepto"
                        value={form.concepto}
                        onChange={handleChange}
                        required
                        placeholder="Descripción del gasto"
                    />
                </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
                    Cancelar
                </Button>
                <Button type="submit" variant="success" disabled={isSubmitting} loading={isSubmitting}>
                    Guardar Gasto
                </Button>
            </div>
        </form>
    );
};

export default ExpenseForm;
