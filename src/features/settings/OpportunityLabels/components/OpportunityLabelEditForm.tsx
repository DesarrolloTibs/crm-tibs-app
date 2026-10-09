import React, { useState, useEffect } from 'react';
import { ArrowLeft, HelpCircle, Info } from 'lucide-react';
import Button from '../../../../components/shared/Button';
import FormField from '../../../../components/shared/FormField';
import type { OpportunityLabel } from '../schemas/opportunityLabels.schema';
import {
  getFieldDefaultName,
  getFieldBadge,
  isNameDuplicate,
  validateOpportunityLabelForm,
} from '../utils/opportunityLabels.helpers';

interface OpportunityLabelEditFormProps {
  selectedLabel: OpportunityLabel;
  allLabels: OpportunityLabel[];
  onBack: () => void;
  onSave: (newName: string) => Promise<void>;
  loading: boolean;
  onNameChange?: (name: string) => void;
}

export const OpportunityLabelEditForm: React.FC<OpportunityLabelEditFormProps> = ({
  selectedLabel,
  allLabels,
  onBack,
  onSave,
  loading,
  onNameChange,
}) => {
  const [name, setName] = useState(selectedLabel.strname || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(selectedLabel.strname || '');
    setError(null);
    onNameChange?.(selectedLabel.strname || '');
  }, [selectedLabel, onNameChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    setError(null);
    onNameChange?.(val);
  };

  const handleBlur = async () => {
    const result = await validateOpportunityLabelForm(
      { strname: name },
      allLabels,
      selectedLabel.id
    );
    if (!result.isValid && result.errors.strname) {
      setError(result.errors.strname);
    }
  };

  const duplicate = isNameDuplicate(name, selectedLabel.id, allLabels);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();

    const result = await validateOpportunityLabelForm(
      { strname: cleanName },
      allLabels,
      selectedLabel.id
    );

    if (!result.isValid) {
      setError(result.errors.strname || 'Por favor verifica el nombre ingresado');
      return;
    }

    await onSave(cleanName);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in text-left">
      {/* Botón Volver al Paso 1 */}
      <Button
        type="button"
        variant="secondary"
        onClick={onBack}
        className="!py-2 !px-3.5 !text-[10px] w-fit font-bold uppercase tracking-wider"
      >
        <ArrowLeft size={14} className="mr-1" />
        Volver al Paso 1
      </Button>

      {/* Encabezado del Formulario */}
      <div className="border-b border-slate-100 pb-4">
        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
          {getFieldBadge(selectedLabel.field_key)}
        </span>
        <h3 className="text-lg font-bold text-slate-800 mt-1">
          Modificar etiqueta para: {getFieldDefaultName(selectedLabel.field_key)}
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Estás editando el campo dinámico del sistema.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <FormField
            id="opportunity-label-name"
            label="Nuevo Nombre de la Etiqueta"
            name="strname"
            type="text"
            value={name}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Escribe el nombre aquí..."
            maxLength={100}
            required
            autoFocus
            error={error && !duplicate ? error : undefined}
          />
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 ml-1">
            <HelpCircle size={12} className="shrink-0" />
            La etiqueta no puede estar vacía ni duplicada con las otras dos etiquetas del bloque.
          </p>
        </div>

        {/* Mensaje de Alerta en caso de Duplicidad */}
        {duplicate && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2 animate-fade-in">
            <Info size={16} className="text-red-600 shrink-0 mt-0.5" />
            <span className="text-xs text-red-800 font-semibold">
              Error: Este nombre ya está asignado a otra etiqueta. Por favor, elige un nombre único para evitar confusión.
            </span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onBack}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!name.trim() || duplicate}
            loading={loading}
            variant="success"
          >
            Guardar y Reemplazar
          </Button>
        </div>
      </form>
    </div>
  );
};
