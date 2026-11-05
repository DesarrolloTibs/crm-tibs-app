import React from 'react';
import Modal from '@shared/components/Modal';
import { CompanyForm } from './CompanyForm';
import type { Company, CompanyFormData } from '../schemas/companies.schema';
import { Edit, Building2 } from 'lucide-react';

interface CompanyModalProps {
  open: boolean;
  editingCompany?: Company | null;
  executives: { value: string; label: string }[];
  onClose: () => void;
  onSubmit: (data: CompanyFormData) => Promise<void>;
  submitting?: boolean;
}

export const CompanyModal: React.FC<CompanyModalProps> = ({
  open,
  editingCompany,
  executives,
  onClose,
  onSubmit,
  submitting = false,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="max-w-2xl"
      height="h-auto"
      className="rounded-3xl overflow-hidden shadow-2xl border border-slate-100"
      padding="p-6 sm:p-7"
    >
      <div className="space-y-6">
        {/* Cabecera del Modal */}
        <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4">
          <div className="w-11 h-11 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shrink-0 shadow-2xs">
            {editingCompany ? <Edit size={20} /> : <Building2 size={20} />}
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">
              {editingCompany
                ? `Editar Cuenta: ${editingCompany.nombre}`
                : 'Nueva Cuenta / Empresa B2B'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {editingCompany
                ? 'Actualiza los datos fiscales, conmutador, sitio web y asesor responsable de la cuenta.'
                : 'Da de alta una nueva empresa matriz u organización corporativa en la base de datos.'}
            </p>
          </div>
        </div>

        {/* Formulario */}
        <CompanyForm
          initialData={editingCompany}
          executives={executives}
          onSubmit={onSubmit}
          onCancel={onClose}
          submitting={submitting}
        />
      </div>
    </Modal>
  );
};
