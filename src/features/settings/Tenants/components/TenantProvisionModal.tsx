import React, { useState, useEffect } from 'react';
import { Building2, User, Mail, X, Plus } from 'lucide-react';
import Modal from '../../../../components/shared/Modal';
import Button from '../../../../components/shared/Button';
import FormField from '../../../../components/shared/FormField';
import Select from '../../../../components/shared/Select';
import type { Plan, ProvisionTenantFormData } from '../schemas/tenants.schema';
import { validateProvisionForm } from '../utils/tenants.helpers';

interface TenantProvisionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: ProvisionTenantFormData) => Promise<void>;
  plans: Plan[];
  submitting: boolean;
}

export const TenantProvisionModal: React.FC<TenantProvisionModalProps> = ({
  open,
  onClose,
  onSubmit,
  plans,
  submitting,
}) => {
  const [formData, setFormData] = useState<ProvisionTenantFormData>({
    tenantName: '',
    adminUsername: '',
    adminEmail: '',
    planId: undefined,
    billingPeriodMonths: 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open) {
      setFormData({
        tenantName: '',
        adminUsername: '',
        adminEmail: '',
        planId: plans[0]?.plan_id,
        billingPeriodMonths: plans[0]?.billing_period_months || 1,
      });
      setErrors({});
      setTouched({});
    }
  }, [open, plans]);

  const planOptions = plans.map((p) => ({
    value: p.plan_id,
    label: `${p.plan_name} — $${Number(p.price).toFixed(2)} (${p.tokens_limit.toLocaleString()} tokens)`,
  }));

  const handleChangeField = (field: keyof ProvisionTenantFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleBlurField = async (field: keyof ProvisionTenantFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const result = await validateProvisionForm(formData);
    if (!result.isValid && result.errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: result.errors[field] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const result = await validateProvisionForm(formData);
    if (!result.isValid) {
      setErrors(result.errors);
      setTouched({
        tenantName: true,
        adminUsername: true,
        adminEmail: true,
      });
      return;
    }

    await onSubmit(formData);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="max-w-md"
      height="h-auto"
      padding="p-6"
      className="rounded-2xl shadow-xl"
      hideCloseButton={true}
    >
      <div className="space-y-4">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Building2 size={20} />
            </div>
            <span>Provisionar Organización</span>
          </h3>
          <Button
            variant="icon"
            onClick={onClose}
            className="!text-slate-400 hover:!text-slate-600 !p-1 hover:!bg-slate-100"
          >
            <X size={18} />
          </Button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            id="provision-tenant-name"
            label="Nombre de la Organización"
            name="tenantName"
            value={formData.tenantName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleChangeField('tenantName', e.target.value)
            }
            onBlur={() => handleBlurField('tenantName')}
            placeholder="ej. Empresa Acme SA"
            required
            error={touched.tenantName ? errors.tenantName : undefined}
            inputPrefix={<Building2 size={16} className="text-slate-400" />}
          />

          <FormField
            id="provision-admin-username"
            label="Username del Admin Inicial"
            name="adminUsername"
            value={formData.adminUsername}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleChangeField('adminUsername', e.target.value)
            }
            onBlur={() => handleBlurField('adminUsername')}
            placeholder="ej. admin_acme"
            required
            error={touched.adminUsername ? errors.adminUsername : undefined}
            inputPrefix={<User size={16} className="text-slate-400" />}
          />

          <FormField
            id="provision-admin-email"
            label="Email del Admin Inicial"
            name="adminEmail"
            type="email"
            value={formData.adminEmail}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleChangeField('adminEmail', e.target.value)
            }
            onBlur={() => handleBlurField('adminEmail')}
            placeholder="admin@acme.com"
            required
            error={touched.adminEmail ? errors.adminEmail : undefined}
            inputPrefix={<Mail size={16} className="text-slate-400" />}
          />

          <div>
            <label
              htmlFor="provisionPlanId"
              className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5"
            >
              Plan Inicial
            </label>
            <Select
              inputId="provisionPlanId"
              value={planOptions.find((opt) => opt.value === formData.planId)}
              onChange={(selected: any) => {
                const planId = selected ? Number(selected.value) : undefined;
                const foundPlan = plans.find((p) => p.plan_id === planId);
                setFormData((prev) => ({
                  ...prev,
                  planId,
                  billingPeriodMonths: foundPlan?.billing_period_months || 1,
                }));
              }}
              options={planOptions}
              isSearchable={false}
              placeholder="Seleccione un plan inicial..."
            />
          </div>

          {/* Pie de acciones */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={submitting}
              className="!py-2 !px-4 !text-xs !font-semibold !normal-case !tracking-normal"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="indigo"
              loading={submitting}
              disabled={submitting}
              className="!py-2 !px-4 !text-xs !font-bold !normal-case !tracking-normal flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={15} />
              <span>Crear Esquema</span>
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
