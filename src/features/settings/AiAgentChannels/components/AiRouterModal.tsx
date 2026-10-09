import React, { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';
import Modal from '@shared/components/Modal';
import Button from '@shared/components/Button';
import TextArea from '@shared/components/TextArea';
import { useFormValidation } from '@shared/components/useFormValidation';
import { routerPromptValidationSchema, type RouterPromptFormData } from '../schemas/aiAgent.schema';

interface AiRouterModalProps {
  open: boolean;
  initialPrompt: string;
  onClose: () => void;
  onSave: (prompt: string) => Promise<void>;
  saving: boolean;
}

export const AiRouterModal: React.FC<AiRouterModalProps> = ({
  open,
  initialPrompt,
  onClose,
  onSave,
  saving,
}) => {
  const [context, setContext] = useState(initialPrompt);
  const { errors, setError, clearErrors } = useFormValidation<RouterPromptFormData>();

  useEffect(() => {
    if (open) {
      setContext(initialPrompt);
      clearErrors();
    }
  }, [open, initialPrompt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    try {
      await routerPromptValidationSchema.validate({ context }, { abortEarly: false });
      await onSave(context);
    } catch (err: any) {
      if (err.inner) {
        err.inner.forEach((validationError: any) => {
          if (validationError.path) {
            setError(validationError.path as keyof RouterPromptFormData, validationError.message);
          }
        });
      }
    }
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-2xl" height="h-auto max-h-[90vh]">
      <div className="pb-4 border-b border-slate-150 flex justify-between items-center pr-8 text-left">
        <div>
          <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
            <Brain size={18} className="text-indigo-600" />
            Configurar Agente Principal (Enrutador)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Define las directivas y reglas de clasificación que utiliza el enrutador para derivar chats a sub-agentes.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-left">
        <div>
          <label
            htmlFor="agentRouterContext"
            className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5"
          >
            Prompt de Directivas e Instrucciones de Enrutamiento
          </label>
          <p className="text-xs text-slate-400 pb-2 leading-relaxed">
            Instruye al modelo sobre cómo clasificar las consultas entrantes (ventas, soporte, cotizaciones, agendas)
            para activar al sub-agente correspondiente de forma desatendida.
          </p>
          <TextArea
            id="agentRouterContext"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Ej: Eres el orquestador principal. Analiza la intención del cliente..."
            rows={12}
            required
            className={errors.context ? 'border-rose-400 focus:border-rose-500' : ''}
          />
          {errors.context && (
            <p className="text-rose-600 text-[11px] font-semibold mt-1">{errors.context}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-150 pt-4 mt-6">
          <Button type="button" variant="secondary" onClick={onClose} className="px-4 py-2 text-xs font-bold">
            Cancelar
          </Button>
          <Button type="submit" variant="success" loading={saving} className="px-4 py-2 text-xs font-bold">
            Guardar Prompt
          </Button>
        </div>
      </form>
    </Modal>
  );
};
