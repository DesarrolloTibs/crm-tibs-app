import React, { useState } from 'react';
import type { Client } from '../../core/models/Client';

interface Props {
    initialData?: Client;
    onSubmit: (client: Client) => void;
}

const ClientForm: React.FC<Props> = ({ initialData, onSubmit }) => {
    const [form, setForm] = useState<Client>(initialData || {
        nombre: '',
        apellido: '',
        correo: '',
        empresa: '',
        puesto: '',
        telefono: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
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
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700">
                Guardar
            </button>
        </form>
    );
};

export default ClientForm;