import React, { useState, useEffect } from 'react';
import type { User } from '../../core/models/User';

interface Props {
    initialData?: User;
    onSubmit: (user: User) => void;
    onCancel: () => void;
}

const UserForm: React.FC<Props> = ({ initialData, onSubmit, onCancel }) => {
    const [form, setForm] = useState<User>({
        username: '',
        email: '',
        password: '',
        role: 'executive', // Por defecto, el rol es ejecutivo
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
        setForm({ ...form, [e.target.name]: e.target.value });
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
        <form onSubmit={handleSubmit} className="space-y-8 p-2">
            <h2 className="text-2xl font-bold text-gray-800">{initialData ? 'Editar' : 'Nuevo'} Usuario</h2>

            <fieldset className="space-y-4">
                <legend className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4 w-full">Datos de Usuario</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Nombre de Usuario</label>
                        <input id="username" name="username" value={form.username} onChange={handleChange} placeholder="Ej: jsmith" required className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                        <input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="ejemplo@correo.com" required className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">{initialData ? "Nueva Contraseña (opcional)" : "Contraseña"}</label>
                        <input id="password" name="password" type="password" value={form.password || ''} onChange={handleChange} placeholder="••••••••" required={!initialData} className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                </div>
            </fieldset>

            <fieldset className="space-y-4">
                <legend className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4 w-full">Permisos y Estado</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                        <select id="role" name="role" value={form.role} onChange={handleChange} className="w-full border rounded px-3 py-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500">
                            <option value='admin'>Administrador</option>
                            <option value='executive'>Ejecutivo</option>
                        </select>
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

export default UserForm;
