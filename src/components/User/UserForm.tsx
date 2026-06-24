import React, { useState, useEffect } from 'react';
import type { User } from '../../core/models/User';
import Input from '../shared/Input';
import Select from '../shared/Select';
import Button from '../shared/Button';

interface Props {
    initialData?: User;
    onSubmit: (user: User) => void;
    onCancel: () => void;
}

const roleOptions = [
    { value: 'admin', label: 'Administrador' },
    { value: 'executive', label: 'Ejecutivo' }
];

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleRoleSelectChange = (option: any) => {
        setForm(prev => ({
            ...prev,
            role: option ? option.value : 'executive'
        }));
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
                    <Input
                        label="Nombre de Usuario"
                        id="username"
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                        placeholder="Ej: jsmith"
                        required
                    />
                    <Input
                        label="Correo Electrónico"
                        id="email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="ejemplo@correo.com"
                        required
                    />
                    <div className="md:col-span-2">
                        <Input
                            label={initialData ? "Nueva Contraseña (opcional)" : "Contraseña"}
                            id="password"
                            name="password"
                            type="password"
                            value={form.password || ''}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required={!initialData}
                        />
                    </div>
                </div>
            </fieldset>

            <fieldset className="space-y-4">
                <legend className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4 w-full">Permisos y Estado</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Select
                            label="Rol"
                            options={roleOptions}
                            value={roleOptions.find(opt => opt.value === form.role)}
                            onChange={handleRoleSelectChange}
                        />
                    </div>
                </div>
            </fieldset>

            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" variant="success">
                    Guardar
                </Button>
            </div>
        </form>
    );
};

export default UserForm;
