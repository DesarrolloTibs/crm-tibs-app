import React, { useState, useEffect, useMemo } from 'react';
import type { User } from '@core/models/User';
import Input from '@shared/components/Input';
import Select from '@shared/components/Select';
import Button from '@shared/components/Button';
import { useConfigStore } from '@/store/useConfigStore';
import { useAuth } from '@features/auth';
import { useFormValidation } from '@shared/hooks/useFormValidation';
import { validateWithSchema } from '@shared/utils/yupValidation';
import { createUserValidationSchema, type UserFormValues } from '../schemas/users.schema';

interface Props {
    initialData?: User;
    onSubmit: (user: User) => void;
    onCancel: () => void;
}

const UserForm: React.FC<Props> = ({ initialData, onSubmit, onCancel }) => {
    const { selectedTenant } = useConfigStore();
    const { isSuperAdmin } = useAuth();
    const isEditing = Boolean(initialData);

    const validationSchema = useMemo(
        () => createUserValidationSchema(isEditing),
        [isEditing]
    );

    const roleOptions = useMemo(() => {
        if (isSuperAdmin && !selectedTenant) {
            return [
                { value: 'superadmin', label: 'SuperAdministrador' },
                { value: 'admin', label: 'Administrador' },
                { value: 'executive', label: 'Ejecutivo' }
            ];
        }
        return [
            { value: 'admin', label: 'Administrador' },
            { value: 'executive', label: 'Ejecutivo' }
        ];
    }, [isSuperAdmin, selectedTenant]);

    const [form, setForm] = useState<User>({
        ...(initialData?.id ? { id: initialData.id } : {}),
        username: initialData?.username || '',
        email: initialData?.email || '',
        password: '',
        role: initialData?.role || ((!selectedTenant && isSuperAdmin) ? 'superadmin' : 'executive'),
        isActive: initialData?.isActive ?? true,
        ...(initialData?.profileImageUrl !== undefined ? { profileImageUrl: initialData.profileImageUrl } : {}),
    });

    const { errors, setErrors, clearError, clearErrors } =
        useFormValidation<UserFormValues>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setForm({
                ...(initialData.id ? { id: initialData.id } : {}),
                username: initialData.username || '',
                email: initialData.email || '',
                password: '', // No pre-llenar la contraseña por seguridad
                role: initialData.role,
                isActive: initialData.isActive ?? true,
                ...(initialData.profileImageUrl !== undefined ? { profileImageUrl: initialData.profileImageUrl } : {}),
            });
        } else {
            setForm({
                username: '',
                email: '',
                password: '',
                role: (!selectedTenant && isSuperAdmin) ? 'superadmin' : 'executive',
                isActive: true,
            });
        }
        clearErrors();
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        clearError(name as keyof UserFormValues);
    };

    const handleBlurField = async (field: keyof UserFormValues) => {
        const result = await validateWithSchema(validationSchema, form);
        if (!result.isValid && result.errors[field]) {
            setErrors(prev => ({ ...prev, [field]: result.errors[field] }));
        }
    };

    const handleRoleSelectChange = (option: { value: string; label: string } | null) => {
        setForm(prev => ({
            ...prev,
            role: (option ? option.value : 'executive') as User['role']
        }));
        clearError('role');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        const { isValid, errors: validationErrors } = await validateWithSchema(
            validationSchema,
            form
        );
        if (!isValid) {
            setErrors(validationErrors);
            return;
        }

        const dataToSend: User = {
            ...(initialData?.id ? { id: initialData.id } : {}),
            username: form.username.trim(),
            email: form.email.trim(),
            role: form.role,
            isActive: form.isActive ?? true,
            ...(form.profileImageUrl !== undefined ? { profileImageUrl: form.profileImageUrl } : {}),
            ...(form.password ? { password: form.password } : {}),
        };

        setIsSubmitting(true);
        try {
            await onSubmit(dataToSend);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-8 p-2">
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
                        onBlur={() => handleBlurField('username')}
                        placeholder="Ej: jsmith"
                        maxLength={50}
                        error={errors.username}
                        required
                    />
                    <Input
                        label="Correo Electrónico"
                        id="email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        onBlur={() => handleBlurField('email')}
                        placeholder="ejemplo@correo.com"
                        maxLength={100}
                        error={errors.email}
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
                            onBlur={() => handleBlurField('password')}
                            placeholder="Mínimo 8 caracteres, letras y números"
                            maxLength={72}
                            error={errors.password}
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
                            error={errors.role}
                        />
                    </div>
                </div>
            </fieldset>

            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
                    Cancelar
                </Button>
                <Button type="submit" variant="success" disabled={isSubmitting} loading={isSubmitting}>
                    Guardar
                </Button>
            </div>
        </form>
    );
};

export default UserForm;
