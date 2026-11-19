import React, { useState, useEffect } from 'react';
import type { TypeActivity, ActivityTypeFormData } from '../schemas/activityTypes.schema';
import { validateActivityTypeForm } from '../utils/activityTypes.helpers';
import Button from '@shared/components/Button';
import FormField from '@shared/components/FormField';
import Switch from '@shared/components/Switch';
import { Tag, Check } from 'lucide-react';

interface ActivityTypeFormProps {
  initialData?: TypeActivity | null;
  onSubmit: (data: ActivityTypeFormData) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export const ActivityTypeForm: React.FC<ActivityTypeFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  submitting = false,
}) => {
  const [formData, setFormData] = useState<ActivityTypeFormData>({
    strname: initialData?.strname || '',
    blnstatus: initialData?.blnstatus ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        strname: initialData.strname,
        blnstatus: initialData.blnstatus,
      });
      setErrors({});
      setTouched({});
    }
  }, [initialData]);

  const handleChangeName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, strname: value }));

    if (errors.strname) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.strname;
        return next;
      });
    }
  };

  const handleBlurName = async () => {
    setTouched((prev) => ({ ...prev, strname: true }));
    const result = await validateActivityTypeForm(formData);
    if (!result.isValid && result.errors.strname) {
      setErrors((prev) => ({ ...prev, strname: result.errors.strname }));
    }
  };

  const handleToggleStatus = () => {
    setFormData((prev) => ({ ...prev, blnstatus: !prev.blnstatus }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { isValid, errors: validationErrors } = await validateActivityTypeForm(formData);

    if (!isValid) {
      setErrors(validationErrors);
      setTouched({ strname: true });
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Campo Nombre con FormField y Yup */}
      <div className="space-y-1">
        <FormField
          id="activity-type-name"
          label="Nombre de la Tipología"
          name="strname"
          value={formData.strname}
          onChange={handleChangeName}
          onBlur={handleBlurName}
          placeholder="Ej. Reunión Comercial, Llamada de Prospección, Demostración..."
          maxLength={50}
          autoFocus
          error={touched.strname ? errors.strname : undefined}
          inputPrefix={<Tag size={16} className="text-slate-400" />}
          className="!py-3 !rounded-xl"
        />
        <p className="text-[11px] text-slate-400 ml-1">
          Máximo 50 caracteres. Este nombre se mostrará en los selectores de eventos y filtros de agenda.
        </p>
      </div>

      {/* Toggle de Estado Activo / Inactivo */}
      <Switch
        id="activity-type-status-toggle"
        checked={formData.blnstatus}
        onChange={handleToggleStatus}
        label="Habilitado para selección"
        description="Si está activo, los ejecutivos podrán seleccionar esta tipología al crear o modificar actividades. Si lo desactivas, se mantendrá en el historial pero no se ofrecerá para nuevos registros."
        className="bg-white rounded-2xl border-slate-200/90 p-4 gap-4"
      />

      {/* Acciones de Guardar / Cancelar */}
      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={submitting}
          className="!py-2.5 !px-4 text-xs font-semibold"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="success"
          disabled={submitting}
          className="!py-2.5 !px-5 text-xs font-bold shadow-xs gap-1.5"
        >
          <Check size={15} />
          <span>{submitting ? 'Guardando...' : initialData ? 'Actualizar Tipo' : 'Guardar Tipo'}</span>
        </Button>
      </div>
    </form>
  );
};
