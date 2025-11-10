import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import type { Client } from '../../core/models/Client';
import { getUsers } from '../../services/usersService';
import type { User } from '../../core/models/User';


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
        estatus: true, // Default to active
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

    const selectedExecutiveValue = executiveOptions.find(option => option.value === form.ejecutivo_id);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const inputValue = isCheckbox ? (e.target as HTMLInputElement).checked : value;

        setForm(prevForm => ({ ...prevForm, [name]: inputValue }));
    };

    const handleExecutiveChange = (selectedOption: any) => {
        setForm(prevForm => ({ ...prevForm, ejecutivo_id: selectedOption ? selectedOption.value : '' }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onSubmit(form as Client);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 p-2">
            <h2 className="text-2xl font-bold text-gray-800">{initialData ? 'Editar' : 'Nuevo'} Cliente</h2>

            <fieldset className="space-y-4">
                <legend className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4 w-full">Información de Contacto</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input id="nombre" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre del cliente" required className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                        <input id="apellido" name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido del cliente" required className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="correo" className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                        <input id="correo" name="correo" type="email" value={form.correo} onChange={handleChange} placeholder="ejemplo@correo.com" required className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input id="telefono" name="telefono" value={form.telefono} onChange={handleChange} placeholder="Ej: 55 1234 5678"  className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                </div>
            </fieldset>

            <fieldset className="space-y-4">
                <legend className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4 w-full">Información Laboral</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="empresa" className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                        <input id="empresa" name="empresa" value={form.empresa} onChange={handleChange} placeholder="Nombre de la empresa" required className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label htmlFor="puesto" className="block text-sm font-medium text-gray-700 mb-1">Puesto</label>
                        <input id="puesto" name="puesto" value={form.puesto} onChange={handleChange} placeholder="Puesto del cliente" required className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="ejecutivo_id" className="block text-sm font-medium text-gray-700 mb-1">Ejecutivo Asignado</label>
                        <Select inputId="ejecutivo_id" name="ejecutivo_id" options={executiveOptions} value={selectedExecutiveValue} onChange={handleExecutiveChange} placeholder="-- Asignar a un Ejecutivo --" isClearable isSearchable required />
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

export default ClientForm;