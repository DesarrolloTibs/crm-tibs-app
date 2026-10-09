import React, { useState, useEffect } from 'react';
import type { Client } from '../../../../core/models/Client';
import { ClientCategory } from '../../../../core/models/Client';
import type { ContactFormData } from '../schemas/contacts.schema';
import { validateContactForm, INITIAL_CONTACT_FORM } from '../utils/contacts.helpers';
import Button from '../../../../components/shared/Button';
import FormField from '../../../../components/shared/FormField';
import Select from '../../../../components/shared/Select';
import CreatableSelect from '../../../../components/shared/CreatableSelect';
import { User, Mail, Phone, Briefcase, Check } from 'lucide-react';

interface ContactFormProps {
  initialData?: Client | null;
  executives: { value: string; label: string }[];
  companies: { value: string; label: string }[];
  onSubmit: (data: ContactFormData) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  initialData,
  executives,
  companies,
  onSubmit,
  onCancel,
  submitting = false,
}) => {
  const [formData, setFormData] = useState<ContactFormData>(() => {
    if (!initialData) return INITIAL_CONTACT_FORM;

    return {
      nombre: initialData.nombre || '',
      apellido: initialData.apellido || '',
      correo: initialData.correo || '',
      telefono: initialData.telefono || '',
      puesto: initialData.puesto || '',
      category: initialData.category || ClientCategory.CONTACTO,
      ejecutivo_id: initialData.ejecutivo_id || '',
      companyId: initialData.companyId || null,
      empresa: initialData.empresa || '',
      estatus: initialData.estatus !== false,
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || '',
        apellido: initialData.apellido || '',
        correo: initialData.correo || '',
        telefono: initialData.telefono || '',
        puesto: initialData.puesto || '',
        category: initialData.category || ClientCategory.CONTACTO,
        ejecutivo_id: initialData.ejecutivo_id || '',
        companyId: initialData.companyId || null,
        empresa: initialData.empresa || '',
        estatus: initialData.estatus !== false,
      });
      setErrors({});
      setTouched({});
    } else {
      setFormData(INITIAL_CONTACT_FORM);
      setErrors({});
      setTouched({});
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleBlur = async (field: keyof ContactFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const result = await validateContactForm(formData);
    if (!result.isValid && result.errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: result.errors[field] }));
    }
  };

  const handleExecutiveChange = (selectedOption: any) => {
    const value = selectedOption ? selectedOption.value : '';
    setFormData((prev) => ({ ...prev, ejecutivo_id: value }));
    if (errors.ejecutivo_id) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.ejecutivo_id;
        return next;
      });
    }
  };

  const handleCompanyChange = (selectedOption: any) => {
    if (!selectedOption) {
      setFormData((prev) => ({ ...prev, companyId: null, empresa: '' }));
    } else if (selectedOption.__isNew__) {
      setFormData((prev) => ({ ...prev, companyId: null, empresa: selectedOption.label }));
    } else {
      setFormData((prev) => ({ ...prev, companyId: selectedOption.value, empresa: selectedOption.label }));
    }
  };

  const handleCategoryChange = (selectedOption: any) => {
    const value = selectedOption ? selectedOption.value : ClientCategory.CONTACTO;
    setFormData((prev) => ({ ...prev, category: value }));
  };

  const handleToggleStatus = () => {
    setFormData((prev) => ({ ...prev, estatus: !prev.estatus }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { isValid, errors: validationErrors } = await validateContactForm(formData);

    if (!isValid) {
      setErrors(validationErrors);
      setTouched({
        nombre: true,
        apellido: true,
        correo: true,
        puesto: true,
        ejecutivo_id: true,
        category: true,
      });
      return;
    }

    await onSubmit(formData);
  };

  const categoryOptions = Object.values(ClientCategory).map((c) => ({
    value: c,
    label: c,
  }));

  const selectedExecutiveValue =
    executives.find((opt) => opt.value === formData.ejecutivo_id) || null;

  const selectedCompanyValue = formData.companyId
    ? companies.find((opt) => opt.value === formData.companyId) || {
        value: formData.companyId,
        label: formData.empresa || 'Empresa seleccionada',
      }
    : formData.empresa
    ? { value: '', label: formData.empresa }
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sección 1: Datos Personales & Contacto */}
      <div className="space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 block">
            1. Datos de Contacto
          </span>
          <p className="text-xs text-slate-400 mt-0.5">
            Información básica para comunicación directa y seguimiento comercial.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            id="contact-nombre"
            label="Nombre(s) *"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            onBlur={() => handleBlur('nombre')}
            placeholder="Ej. Juan Carlos"
            error={touched.nombre ? errors.nombre : undefined}
            inputPrefix={<User size={15} className="text-slate-400" />}
            autoFocus
          />

          <FormField
            id="contact-apellido"
            label="Apellido(s) *"
            name="apellido"
            value={formData.apellido}
            onChange={handleChange}
            onBlur={() => handleBlur('apellido')}
            placeholder="Ej. Pérez Gómez"
            error={touched.apellido ? errors.apellido : undefined}
            inputPrefix={<User size={15} className="text-slate-400" />}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            id="contact-correo"
            label="Correo Electrónico *"
            name="correo"
            type="email"
            value={formData.correo}
            onChange={handleChange}
            onBlur={() => handleBlur('correo')}
            placeholder="ejemplo@empresa.com"
            error={touched.correo ? errors.correo : undefined}
            inputPrefix={<Mail size={15} className="text-slate-400" />}
          />

          <FormField
            id="contact-telefono"
            label="Teléfono Directo"
            name="telefono"
            value={formData.telefono || ''}
            onChange={handleChange}
            onBlur={() => handleBlur('telefono')}
            placeholder="Ej. +52 55 1234 5678"
            error={touched.telefono ? errors.telefono : undefined}
            inputPrefix={<Phone size={15} className="text-slate-400" />}
          />
        </div>
      </div>

      {/* Sección 2: Información Laboral & Cuenta B2B */}
      <div className="space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 block">
            2. Información Laboral & Cuenta B2B
          </span>
          <p className="text-xs text-slate-400 mt-0.5">
            Asignación de cuenta empresarial matriz, puesto y ejecutivo responsable.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <CreatableSelect
              label="Empresa / Cuenta Matriz"
              inputId="contact-empresa"
              name="empresa"
              options={companies}
              value={selectedCompanyValue}
              onChange={handleCompanyChange}
              placeholder="Buscar o escribir nueva empresa..."
              isClearable
              isSearchable
              formatCreateLabel={(inputValue) => `Crear empresa de texto "${inputValue}"`}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Selecciona una cuenta existente o tipea para capturar una empresa libre.
            </p>
          </div>

          <FormField
            id="contact-puesto"
            label="Puesto o Cargo *"
            name="puesto"
            value={formData.puesto}
            onChange={handleChange}
            onBlur={() => handleBlur('puesto')}
            placeholder="Ej. Director de Operaciones"
            error={touched.puesto ? errors.puesto : undefined}
            inputPrefix={<Briefcase size={15} className="text-slate-400" />}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Select
              label="Categoría del Contacto *"
              id="contact-category"
              name="category"
              options={categoryOptions}
              value={categoryOptions.find((opt) => opt.value === formData.category)}
              onChange={handleCategoryChange}
              required
            />
          </div>

          <div>
            <Select
              label="Ejecutivo Asignado *"
              inputId="contact-ejecutivo"
              name="ejecutivo_id"
              options={executives}
              value={selectedExecutiveValue}
              onChange={handleExecutiveChange}
              placeholder="-- Asignar Ejecutivo --"
              isClearable
              isSearchable
              required
            />
            {touched.ejecutivo_id && errors.ejecutivo_id && (
              <p className="text-[11px] text-red-600 mt-1">{errors.ejecutivo_id}</p>
            )}
          </div>
        </div>
      </div>

      {/* Switch de Estado */}
      <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
        <div>
          <span className="text-xs font-bold text-slate-800 block">
            Estado de Disponibilidad
          </span>
          <span className="text-[11px] text-slate-500">
            {formData.estatus
              ? 'El contacto está activo para nuevas oportunidades, citas y cotizaciones.'
              : 'El contacto está deshabilitado u oculto para nuevas operaciones comerciales.'}
          </span>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={formData.estatus}
          onClick={handleToggleStatus}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
            formData.estatus ? 'bg-emerald-600' : 'bg-slate-300'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              formData.estatus ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Botones de Acción */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancelar
        </Button>

        <Button
          type="submit"
          variant="success"
          disabled={submitting}
          loading={submitting}
          className="gap-2"
        >
          <Check size={16} />
          {initialData ? 'Guardar Cambios' : 'Registrar Contacto'}
        </Button>
      </div>
    </form>
  );
};
