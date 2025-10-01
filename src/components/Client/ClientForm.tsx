import React, { useState } from 'react';
import type { Client } from '../../core/models/Client';

interface Props {
    initialData?: Client;
    onSubmit: (client: Client) => void;
}

const ClientForm: React.FC<Props> = ({ initialData, onSubmit }) => {
    const [form, setForm] = useState<Client>({
        nombre: '',
        apellido: '',
        correo: '',
        empresa: '',
        puesto: '',
        telefono: '',
        estatus: true, // Default to active
        ...initialData,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        // Cast is necessary because of the mixed types
        const inputValue = isCheckbox ? (e.target as HTMLInputElement).checked : value;

        setForm({ ...form, [name]: inputValue });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(form);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" required className="border rounded px-3 py-2" />
                <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido" required className="border rounded px-3 py-2" />
                <input name="correo" value={form.correo} onChange={handleChange} placeholder="Correo" required className="border rounded px-3 py-2 col-span-2" />
                <input name="empresa" value={form.empresa} onChange={handleChange} placeholder="Empresa" required className="border rounded px-3 py-2" />
                <input name="puesto" value={form.puesto} onChange={handleChange} placeholder="Puesto" required className="border rounded px-3 py-2" />
                <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono" required className="border rounded px-3 py-2 col-span-2" />
                <div className="flex items-center col-span-2">
                    <input
                        id="estatus"
                        name="estatus"
                        type="checkbox"
                        checked={form.estatus}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <label htmlFor="estatus" className="ml-2 block text-sm text-gray-900">Cliente Activo</label>
                </div>
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700">
                Guardar
            </button>
        </form>
    );
};

export default ClientForm;