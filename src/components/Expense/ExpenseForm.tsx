import React, { useState, useEffect } from 'react';
import Select from '../shared/Select';
import Input from '../shared/Input';
import Button from '../shared/Button';
import type { Expense } from '../../core/models/Expense';
import { getActiveClients } from '../../services/clientsService';
import { getAllOpportunities } from '../../services/opportunitiesService'; // Assuming getAll exists or using getOpportunities
import type { Client } from '../../core/models/Client';
import type { Opportunity } from '../../core/models/Opportunity';

interface Props {
    initialData?: Expense;
    onSubmit: (expense: Partial<Expense>) => void;
    onCancel: () => void;
}

type AssociationType = 'client' | 'opportunity';

const ExpenseForm: React.FC<Props> = ({ initialData, onSubmit, onCancel }) => {
    const [form, setForm] = useState<Partial<Expense>>({
        fecha: new Date().toISOString().split('T')[0],
        concepto: '',
        monto: 0,
        client_id: '',
        opportunity_id: '',
        ...initialData
    });

    const [associationType, setAssociationType] = useState<AssociationType>(
        initialData?.opportunity_id ? 'opportunity' : 'client'
    );

    const [clients, setClients] = useState<Client[]>([]);
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

    // Formatting date for input if editing
    useEffect(() => {
        if (initialData?.fecha) {
            setForm(prev => ({ ...prev, fecha: initialData.fecha.split('T')[0] }));
        }
    }, [initialData]);

    useEffect(() => {
        const loadData = async () => {
            // Load clients
            try {
                const clientsData = await getActiveClients();
                setClients(clientsData);
            } catch (e) {
                console.error("Error loading clients", e);
            }

            // Load opportunities
            try {
                // Using getOpportunities assuming it returns all if no filter, or use a specific function if available
                // I saw getOpportunities in the service file taking optional dates.
                const oppsData = await getAllOpportunities(); // Using getAll if available provided in previous context
                setOpportunities(oppsData);
            } catch (e) {
                console.error("Error loading opportunities", e);
            }
        };
        loadData();
    }, []);

    const clientOptions = clients.map(c => ({ value: c.id, label: `${c.nombre} ${c.apellido} - ${c.empresa}` }));
    const opportunityOptions = opportunities.map(o => ({ value: o.id, label: `${o.nombre_proyecto} - ${o.empresa}` }));


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (option: any, field: 'client_id' | 'opportunity_id') => {
        setForm(prev => ({
            ...prev,
            [field]: option ? option.value : '',
            // Clear the other field to ensure mutual exclusivity logic on frontend state
            [field === 'client_id' ? 'opportunity_id' : 'client_id']: null
        }));
    };

    const handleAmountBlur = () => {
        if (form.monto !== undefined && String(form.monto) !== '') {
            const amount = Number(form.monto);
            if (!isNaN(amount)) {
                setForm(prev => ({
                    ...prev,
                    monto: amount.toFixed(2) as any
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

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        // Prepare payload - remove empty strings to avoid sending both as valid keys
        const payload: Partial<Expense> = {
            ...form,
            monto: Number(form.monto)
        };

        if (associationType === 'client' && !payload.client_id) {
            alert('Debes seleccionar un cliente');
            return;
        }
        if (associationType === 'opportunity' && !payload.opportunity_id) {
            alert('Debes seleccionar una oportunidad');
            return;
        }

        // Clean up the object to send only the relevant ID
        if (associationType === 'client') {
            payload.opportunity_id = null;
        } else {
            payload.client_id = null;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(payload);
        } finally {
            setIsSubmitting(false);
        }
    };


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
                            value={clientOptions.find(c => c.value === form.client_id)}
                            onChange={(opt) => handleSelectChange(opt, 'client_id')}
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
                            value={opportunityOptions.find(o => o.value === form.opportunity_id)}
                            onChange={(opt) => handleSelectChange(opt, 'opportunity_id')}
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
