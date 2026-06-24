import React, { useState, useEffect } from 'react';
import { ClientCategory, type Client } from '../../core/models/Client';
import { getUsers } from '../../services/usersService';
import type { User } from '../../core/models/User';
import { getCompanies } from '../../services/companiesService';
import type { Company } from '../../core/models/Company';
import Input from '../shared/Input';
import Select from '../shared/Select';
import CreatableSelect from '../shared/CreatableSelect';
import Button from '../shared/Button';

interface Props {
    initialData?: Client;
    onSubmit: (client: Client) => void;
    onCancel: () => void;
}

const ClientForm: React.FC<Props> = ({ initialData, onSubmit, onCancel }) => {
    const [form, setForm] = useState<Partial<Client>>({
        nombre: '',
        apellido: '',
        correo: '',
        empresa: '',
        puesto: '',
        telefono: '',
        estatus: true,
        ejecutivo_id: '',
        companyId: null,
        category: ClientCategory.CONTACTO,
        ...initialData,
    });
    const [executives, setExecutives] = useState<User[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [users, companiesData] = await Promise.all([
                    getUsers(),
                    getCompanies()
                ]);
                setExecutives(users);
                setCompanies(companiesData.filter(c => c.estatus));
            } catch (error) {
                console.error('Failed to fetch loadData:', error);
            }
        };
        loadData();
    }, []);

    const executiveOptions = executives.map(user => ({
        value: user.id,
        label: user.username,
    }));

    const companyOptions = companies.map(c => ({
        value: c.id,
        label: c.nombre,
    }));

    const categoryOptions = Object.values(ClientCategory).map(c => ({
        value: c,
        label: c,
    }));

    const selectedExecutiveValue = executiveOptions.find(option => option.value === form.ejecutivo_id) || null;

    const selectedCompanyValue = form.companyId 
        ? companyOptions.find(opt => opt.value === form.companyId)
        : form.empresa 
            ? { value: '', label: form.empresa }
            : null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const inputValue = isCheckbox ? (e.target as HTMLInputElement).checked : value;

        setForm(prevForm => ({ ...prevForm, [name]: inputValue }));
    };

    const handleExecutiveChange = (selectedOption: any) => {
        setForm(prevForm => ({ ...prevForm, ejecutivo_id: selectedOption ? selectedOption.value : '' }));
    };

    const handleCompanyChange = (selectedOption: any) => {
        if (!selectedOption) {
            setForm(prev => ({ ...prev, companyId: null, empresa: '' }));
        } else if (selectedOption.__isNew__) {
            setForm(prev => ({ ...prev, companyId: null, empresa: selectedOption.label }));
        } else {
            setForm(prev => ({ ...prev, companyId: selectedOption.value, empresa: selectedOption.label }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onSubmit(form as Client);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 p-2 font-sans">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{initialData ? 'Editar' : 'Nuevo'} Cliente</h2>

            <fieldset className="space-y-4">
                <legend className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 mb-4 w-full">Información de Contacto</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Nombre *"
                        id="nombre"
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                        placeholder="Nombre del cliente"
                        required
                    />
                    <Input
                        label="Apellido *"
                        id="apellido"
                        name="apellido"
                        value={form.apellido}
                        onChange={handleChange}
                        placeholder="Apellido del cliente"
                        required
                    />
                    <div className="md:col-span-2">
                        <Input
                            label="Correo Electrónico *"
                            id="correo"
                            name="correo"
                            type="email"
                            value={form.correo}
                            onChange={handleChange}
                            placeholder="ejemplo@correo.com"
                            required
                        />
                    </div>
                    <div className="md:col-span-2">
                        <Input
                            label="Teléfono"
                            id="telefono"
                            name="telefono"
                            value={form.telefono}
                            onChange={handleChange}
                            placeholder="Ej: 55 1234 5678"
                        />
                    </div>
                </div>
            </fieldset>

            <fieldset className="space-y-4">
                <legend className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 mb-4 w-full">Información Laboral</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CreatableSelect
                        label="Empresa"
                        inputId="empresa"
                        name="empresa"
                        options={companyOptions}
                        value={selectedCompanyValue}
                        onChange={handleCompanyChange}
                        placeholder="Buscar o escribir empresa..."
                        isClearable
                        isSearchable
                        formatCreateLabel={(inputValue) => `Usar empresa de texto libre "${inputValue}"`}
                    />

                    <Input
                        label="Puesto *"
                        id="puesto"
                        name="puesto"
                        value={form.puesto}
                        onChange={handleChange}
                        placeholder="Puesto del cliente"
                        required
                    />
                    
                    <Select
                        label="Categoría *"
                        id="category"
                        name="category"
                        options={categoryOptions}
                        value={categoryOptions.find(opt => opt.value === form.category)}
                        onChange={(val: any) => setForm(prev => ({ ...prev, category: val ? val.value : ClientCategory.CONTACTO }))}
                        required
                    />
                    
                    <div className="md:col-span-2">
                        <Select
                            label="Ejecutivo Asignado *"
                            inputId="ejecutivo_id"
                            name="ejecutivo_id"
                            options={executiveOptions}
                            value={selectedExecutiveValue}
                            onChange={handleExecutiveChange}
                            placeholder="-- Asignar a un Ejecutivo --"
                            isClearable
                            isSearchable
                            required
                        />
                    </div>
                </div>
            </fieldset>

            <div className="flex justify-end space-x-3 pt-4">
                <Button
                    type="button"
                    onClick={onCancel}
                    variant="secondary"
                    className="px-6 py-3"
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    variant="success"
                    className="px-6 py-3"
                >
                    Guardar
                </Button>
            </div>
        </form>
    );
};

export default ClientForm;