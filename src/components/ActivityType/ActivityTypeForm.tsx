import React, { useState } from 'react';
import type { TypeActivity } from '../../core/models/Activity';
import Input from '../shared/Input';
import Button from '../shared/Button';

interface Props {
    initialData?: TypeActivity;
    onSubmit: (type: Partial<TypeActivity>) => void;
    onCancel: () => void;
}

const ActivityTypeForm: React.FC<Props> = ({ initialData, onSubmit, onCancel }) => {
    const [form, setForm] = useState<Partial<TypeActivity>>({
        strname: '',
        blnstatus: true,
        ...initialData,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setForm(prevForm => ({
            ...prevForm,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onSubmit(form);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 p-2">
            <h2 className="text-2xl font-bold text-gray-800">{initialData ? 'Editar' : 'Nuevo'} Tipo de Actividad</h2>

            <fieldset className="space-y-4">
                <legend className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4 w-full">Detalles del Tipo</legend>
                <div className="grid grid-cols-1 gap-4">
                    <Input
                        label="Nombre del Tipo"
                        id="strname"
                        name="strname"
                        value={form.strname || ''}
                        onChange={handleChange}
                        placeholder="Ej. Reunión, Llamada, Correo..."
                        required
                        maxLength={50}
                    />
                    
                    <div className="flex items-center mt-2">
                        <input
                            id="blnstatus"
                            name="blnstatus"
                            type="checkbox"
                            checked={form.blnstatus || false}
                            onChange={handleChange}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                        />
                        <label htmlFor="blnstatus" className="ml-2 block text-sm font-medium text-gray-700 cursor-pointer select-none">
                            Activo (Permitir selección al crear/editar actividades)
                        </label>
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

export default ActivityTypeForm;
