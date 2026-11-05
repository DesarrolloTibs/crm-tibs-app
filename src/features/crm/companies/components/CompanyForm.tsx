import React, { useState, useEffect } from 'react';
import type { Company } from '@core/models/Company';
import type { CompanyFormData } from '../schemas/companies.schema';
import { validateCompanyForm, INITIAL_COMPANY_FORM } from '../utils/companies.helpers';
import Button from '@shared/components/Button';
import FormField from '@shared/components/FormField';
import Select from '@shared/components/Select';
import { Building2, Mail, Phone, Globe, MapPin, Check } from 'lucide-react';

interface CompanyFormProps {
  initialData?: Company | null;
  executives: { value: string; label: string }[];
  onSubmit: (data: CompanyFormData) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export const CompanyForm: React.FC<CompanyFormProps> = ({
  initialData,
  executives,
  onSubmit,
  onCancel,
  submitting = false,
}) => {
  const [formData, setFormData] = useState<CompanyFormData>(() => {
    if (!initialData) return INITIAL_COMPANY_FORM;

    return {
      nombre: initialData.nombre || '',
      correo: initialData.correo || '',
      telefono: initialData.telefono || '',
      website: initialData.website || '',
      direccion: initialData.direccion || '',
      ejecutivo_id: initialData.ejecutivo_id || null,
      estatus: initialData.estatus !== false,
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || '',
        correo: initialData.correo || '',
        telefono: initialData.telefono || '',
        website: initialData.website || '',
        direccion: initialData.direccion || '',
        ejecutivo_id: initialData.ejecutivo_id || null,
        estatus: initialData.estatus !== false,
      });
      setErrors({});
      setTouched({});
    } else {
      setFormData(INITIAL_COMPANY_FORM);
      setErrors({});
      setTouched({});
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleBlur = async (field: keyof CompanyFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const result = await validateCompanyForm(formData);
    if (!result.isValid && result.errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: result.errors[field] }));
    }
  };

  const handleExecutiveChange = (selectedOption: any) => {
    const value = selectedOption ? selectedOption.value : null;
    setFormData((prev) => ({ ...prev, ejecutivo_id: value }));
  };

  const handleToggleStatus = () => {
    setFormData((prev) => ({ ...prev, estatus: !prev.estatus }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { isValid, errors: validationErrors } = await validateCompanyForm(formData);

    if (!isValid) {
      setErrors(validationErrors);
      setTouched({
        nombre: true,
        correo: true,
        telefono: true,
        website: true,
        direccion: true,
      });
      return;
    }

    await onSubmit(formData);
  };

  const selectedExecutiveValue =
    executives.find((opt) => opt.value === formData.ejecutivo_id) || null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sección 1: Identidad Corporativa */}
      <div className="space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-violet-600 block">
            1. Identidad de la Empresa
          </span>
          <p className="text-xs text-slate-400 mt-0.5">
            Nombre legal o razón social comercial de la cuenta B2B.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <FormField
            id="company-nombre"
            label="Razón Social / Nombre Comercial *"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            onBlur={() => handleBlur('nombre')}
            placeholder="Ej. Acme Corporation S.A. de C.V."
            error={touched.nombre ? errors.nombre : undefined}
            inputPrefix={<Building2 size={15} className="text-slate-400" />}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            id="company-correo"
            label="Correo Corporativo General"
            name="correo"
            type="email"
            value={formData.correo || ''}
            onChange={handleChange}
            onBlur={() => handleBlur('correo')}
            placeholder="contacto@acme.com"
            error={touched.correo ? errors.correo : undefined}
            inputPrefix={<Mail size={15} className="text-slate-400" />}
          />

          <FormField
            id="company-telefono"
            label="Conmutador / Teléfono"
            name="telefono"
            value={formData.telefono || ''}
            onChange={handleChange}
            onBlur={() => handleBlur('telefono')}
            placeholder="Ej. +52 55 9876 5432"
            error={touched.telefono ? errors.telefono : undefined}
            inputPrefix={<Phone size={15} className="text-slate-400" />}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            id="company-website"
            label="Sitio Web Oficial"
            name="website"
            value={formData.website || ''}
            onChange={handleChange}
            onBlur={() => handleBlur('website')}
            placeholder="https://acme.com"
            error={touched.website ? errors.website : undefined}
            inputPrefix={<Globe size={15} className="text-slate-400" />}
          />

          <div>
            <Select
              label="Ejecutivo de Cuenta Asignado"
              inputId="company-ejecutivo"
              name="ejecutivo_id"
              options={executives}
              value={selectedExecutiveValue}
              onChange={handleExecutiveChange}
              placeholder="-- Asignar Ejecutivo --"
              isClearable
              isSearchable
            />
          </div>
        </div>
      </div>

      {/* Sección 2: Dirección y Localización */}
      <div className="space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-violet-600 block">
            2. Domicilio y Localización
          </span>
          <p className="text-xs text-slate-400 mt-0.5">
            Dirección física o fiscal de las oficinas matrices.
          </p>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="company-direccion"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
          >
            Dirección Fiscal o Completa
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3 pointer-events-none text-slate-400">
              <MapPin size={16} />
            </div>
            <textarea
              id="company-direccion"
              name="direccion"
              rows={3}
              value={formData.direccion || ''}
              onChange={handleChange}
              onBlur={() => handleBlur('direccion')}
              placeholder="Ej. Av. Insurgentes Sur 1602, Crédito Constructor, Benito Juárez, CDMX"
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
            />
          </div>
          {touched.direccion && errors.direccion && (
            <p className="text-[11px] text-red-600 mt-1">{errors.direccion}</p>
          )}
        </div>
      </div>

      {/* Switch de Estado */}
      <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
        <div>
          <span className="text-xs font-bold text-slate-800 block">
            Estado de Operación
          </span>
          <span className="text-[11px] text-slate-500">
            {formData.estatus
              ? 'La empresa está activa para facturación, oportunidades y gestión comercial.'
              : 'La empresa está suspendida; los asesores no podrán emitir cotizaciones hacia esta cuenta.'}
          </span>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={formData.estatus}
          onClick={handleToggleStatus}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-2 ${
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
          {initialData ? 'Guardar Cambios' : 'Registrar Empresa'}
        </Button>
      </div>
    </form>
  );
};
