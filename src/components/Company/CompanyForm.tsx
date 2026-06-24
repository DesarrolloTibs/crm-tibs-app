import React, { useState, useEffect } from 'react';
import type { Company } from '../../core/models/Company';
import { getUsers } from '../../services/usersService';
import type { User } from '../../core/models/User';
import Input from '../shared/Input';
import TextArea from '../shared/TextArea';
import Select from '../shared/Select';
import Button from '../shared/Button';

interface Props {
    initialData?: Company;
    onSubmit: (company: Company) => void;
    onCancel: () => void;
}

const CompanyForm: React.FC<Props> = ({ initialData, onSubmit, onCancel }) => {
    const [form, setForm] = useState<Partial<Company>>({
        nombre: '',
        correo: '',
        telefono: '',
        website: '',
        direccion: '',
        estatus: true,
        ejecutivo_id: '',
        ...initialData,
    });
    const [executives, setExecutives] = useState<User[]>([]);

    useEffect(() => {
        const loadExecutives = async () => {
            try {
                const users = await getUsers();
                setExecutives(users);
            } catch (error) {
                console.error('Failed to fetch executives:', error);
            }
        };
        loadExecutives();
    }, []);

    const executiveOptions = executives.map(user => ({
        value: user.id,
        label: user.username,
    }));

    const selectedExecutiveValue = executiveOptions.find(option => option.value === form.ejecutivo_id) || null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prevForm => ({ ...prevForm, [name]: value }));
    };

    const handleExecutiveChange = (selectedOption: any) => {
        setForm(prevForm => ({ ...prevForm, ejecutivo_id: selectedOption ? selectedOption.value : '' }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onSubmit(form as Company);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 p-2 font-sans">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{initialData ? 'Editar' : 'Nueva'} Empresa</h2>

            <fieldset className="space-y-4">
                <legend className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 mb-4 w-full">Información General</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <Input
                            label="Nombre de la Empresa *"
                            id="nombre"
                            name="nombre"
                            value={form.nombre}
                            onChange={handleChange}
                            placeholder="Nombre oficial"
                            required
                        />
                    </div>
                    <Input
                        label="Correo Electrónico"
                        id="correo"
                        name="correo"
                        type="email"
                        value={form.correo || ''}
                        onChange={handleChange}
                        placeholder="contacto@empresa.com"
                    />
                    <Input
                        label="Teléfono"
                        id="telefono"
                        name="telefono"
                        value={form.telefono || ''}
                        onChange={handleChange}
                        placeholder="Teléfono de contacto"
                    />
                    <div className="md:col-span-2">
                        <Input
                            label="Sitio Web"
                            id="website"
                            name="website"
                            value={form.website || ''}
                            onChange={handleChange}
                            placeholder="www.empresa.com"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <TextArea
                            label="Dirección"
                            id="direccion"
                            name="direccion"
                            value={form.direccion || ''}
                            onChange={handleChange}
                            placeholder="Dirección física completa"
                            rows={2}
                        />
                    </div>
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

export default CompanyForm;
