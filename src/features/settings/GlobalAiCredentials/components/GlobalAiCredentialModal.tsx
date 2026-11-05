import React from 'react';
import Modal from '@shared/components/Modal';
import { GlobalAiCredentialForm } from './GlobalAiCredentialForm';
import type {
  LlmProviderItem,
  GlobalAiConfig,
  GlobalAiCredentialsFormData,
} from '../schemas/globalAiCredentials.schema';
import { KeyRound } from 'lucide-react';

interface GlobalAiCredentialModalProps {
  open: boolean;
  provider: LlmProviderItem | null;
  config: GlobalAiConfig;
  onClose: () => void;
  onSubmit: (data: GlobalAiCredentialsFormData) => Promise<void>;
  submitting?: boolean;
}

export const GlobalAiCredentialModal: React.FC<GlobalAiCredentialModalProps> = ({
  open,
  provider,
  config,
  onClose,
  onSubmit,
  submitting = false,
}) => {
  if (!open || !provider) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="max-w-2xl"
      height="h-auto"
      padding="p-6 sm:p-8"
      className="max-h-[92vh]"
    >
      <div className="space-y-6">
        {/* Encabezado del Modal */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
            <KeyRound size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">
              Credenciales: {provider.name}
            </h3>
            <p className="text-xs text-slate-400">
              Configura las llaves de acceso de API y el modelo predeterminado para este proveedor.
            </p>
          </div>
        </div>

        {/* Formulario Modular con validación Yup */}
        <GlobalAiCredentialForm
          provider={provider}
          config={config}
          onSubmit={onSubmit}
          onCancel={onClose}
          submitting={submitting}
        />
      </div>
    </Modal>
  );
};

export default GlobalAiCredentialModal;
