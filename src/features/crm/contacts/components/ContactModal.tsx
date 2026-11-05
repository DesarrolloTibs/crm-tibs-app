import React from 'react';
import Modal from '@shared/components/Modal';
import { ContactForm } from './ContactForm';
import type { Client, ContactFormData } from '../schemas/contacts.schema';
import { Edit, UserPlus } from 'lucide-react';

interface ContactModalProps {
  open: boolean;
  editingClient?: Client | null;
  executives: { value: string; label: string }[];
  companies: { value: string; label: string }[];
  onClose: () => void;
  onSubmit: (data: ContactFormData) => Promise<void>;
  submitting?: boolean;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  open,
  editingClient,
  executives,
  companies,
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
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
            {editingClient ? <Edit size={20} /> : <UserPlus size={20} />}
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">
              {editingClient
                ? `Editar Contacto: ${editingClient.nombre} ${editingClient.apellido}`
                : 'Nuevo Contacto / Prospecto'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {editingClient
                ? 'Actualiza los datos personales, empresa matriz y asignación comercial del contacto.'
                : 'Registra una nueva persona de contacto, tomador de decisiones o lead en el CRM.'}
            </p>
          </div>
        </div>

        {/* Formulario */}
        <ContactForm
          initialData={editingClient}
          executives={executives}
          companies={companies}
          onSubmit={onSubmit}
          onCancel={onClose}
          submitting={submitting}
        />
      </div>
    </Modal>
  );
};
