import React, { useState, useEffect } from 'react';
import type {
  OpportunityCatalogOption,
  CatalogOptionFormData,
} from '../schemas/opportunityCatalogs.schema';
import { validateCatalogOptionForm } from '../utils/opportunityCatalogs.helpers';
import Button from '@shared/components/Button';
import FormField from '@shared/components/FormField';
import Switch from '@shared/components/Switch';
import { Tag, Check } from 'lucide-react';

interface CatalogOptionFormProps {
  initialData?: OpportunityCatalogOption | null;
  existingOptions?: OpportunityCatalogOption[];
  catalogTitle: string;
  onSubmit: (data: CatalogOptionFormData) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export const CatalogOptionForm: React.FC<CatalogOptionFormProps> = ({
  initialData,
  existingOptions = [],
  catalogTitle,
  onSubmit,
  onCancel,
  submitting = false,
}) => {
  const [formData, setFormData] = useState<CatalogOptionFormData>({
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
    } else {
      setFormData({
        strname: '',
        blnstatus: true,
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
    const result = await validateCatalogOptionForm(formData, existingOptions, initialData?.id);
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

    const { isValid, errors: validationErrors } = await validateCatalogOptionForm(
      formData,
      existingOptions,
      initialData?.id
    );

    if (!isValid) {
      setErrors(validationErrors);
      setTouched({ strname: true });
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left">
      {/* Campo Nombre de Opción con FormField y Yup */}
      <div className="space-y-1">
        <FormField
          id="catalog-option-name"
          label={`Nombre de la Opción (${catalogTitle})`}
          name="strname"
          value={formData.strname}
          onChange={handleChangeName}
          onBlur={handleBlurName}
          placeholder={`Ej. Consultoría Cloud, Llave en Mano, Suscripción SaaS...`}
          maxLength={100}
          autoFocus
          error={touched.strname ? errors.strname : undefined}
          inputPrefix={<Tag size={16} className="text-slate-400" />}
          className="!py-3 !rounded-xl"
        />
        <p className="text-[11px] text-slate-400 ml-1">
          Máximo 100 caracteres. Esta etiqueta se desplegará en los selectores del formulario de oportunidades.
        </p>
      </div>

      {/* Switch de Estado Activo / Inactivo */}
      <Switch
        id="catalog-option-status-toggle"
        checked={formData.blnstatus}
        onChange={handleToggleStatus}
        label="Habilitada para selección en Oportunidades"
        description="Si está activa, los asesores podrán asignarla a nuevos proyectos y filtros. Al desactivarla, permanecerá en las oportunidades que ya la posean sin interrumpir reportes históricos."
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
          <span>
            {submitting
              ? 'Guardando...'
              : initialData
              ? 'Actualizar Opción'
              : 'Guardar Opción'}
          </span>
        </Button>
      </div>
    </form>
  );
};

export default CatalogOptionForm;
