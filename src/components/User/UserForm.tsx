import React, { useState, useEffect } from 'react';
import type { User } from '../../core/models/User';

interface Props {
    initialData?: User;
    onSubmit: (user: User) => void;
}

const UserForm: React.FC<Props> = ({ initialData, onSubmit }) => {
    const [form, setForm] = useState<User>({
        username: '',
        email: '',
        password: '',
        role: 'executive',
        isActive: true,
        ...initialData,
    });

    useEffect(() => {
        if (initialData) {
            setForm({
                ...initialData,
                password: '' // No pre-llenar la contraseña por seguridad
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const inputValue = isCheckbox ? (e.target as HTMLInputElement).checked : value;

        setForm({ ...form, [name]: inputValue });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSend = { ...form };
        // No enviar la contraseña si no se ha modificado en el formulario de edición
        if (initialData && !dataToSend.password) {
            delete dataToSend.password;
        }
        onSubmit(dataToSend);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <input name="username" value={form.username} onChange={handleChange} placeholder="Nombre de Usuario" required className="border rounded px-3 py-2" />
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Correo Electrónico" required className="border rounded px-3 py-2" />
                <input name="password" type="password" value={form.password || ''} onChange={handleChange} placeholder={initialData ? "Nueva Contraseña (opcional)" : "Contraseña"} required={!initialData} className="border rounded px-3 py-2 col-span-2" />
                <select name="role" value={form.role} onChange={handleChange} className="border rounded px-3 py-2">
                    <option value='admin'>Administrador</option>
                    <option value='executive'>Ejecutivo</option>
                </select>
                <div className="flex items-center">
                    <input
                        id="isActive"
                        name="isActive"
                        type="checkbox"
                        checked={form.isActive}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Usuario Activo</label>
                </div>
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700">
                Guardar
            </button>
        </form>
    );
};

export default UserForm;
