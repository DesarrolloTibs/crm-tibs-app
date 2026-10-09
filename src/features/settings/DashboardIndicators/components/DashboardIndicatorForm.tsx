import React, { useState, useEffect } from 'react';
import type { DashboardIndicator, DashboardIndicatorFormData } from '../schemas/dashboardIndicators.schema';
import { validateIndicatorForm, COLOR_OPTIONS } from '../utils/dashboardIndicators.helpers';
import Button from '@shared/components/Button';
import FormField from '@shared/components/FormField';
import Select from '@shared/components/Select';
import { LayoutDashboard, AlertCircle, Check, CheckSquare, Square } from 'lucide-react';

interface DashboardIndicatorFormProps {
  initialData?: DashboardIndicator | null;
  onSubmit: (data: DashboardIndicatorFormData) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  activeModule: 'commercial' | 'support';
  stages: Array<{ id: string; strname: string }>;
}

const TYPE_OPTIONS = [
  { value: 'count', label: 'Contar Oportunidades (Cantidad / Volumen)' },
  { value: 'sum',   label: 'Sumar Monto Financiero ($ Total Ventas)' },
];

export const DashboardIndicatorForm: React.FC<DashboardIndicatorFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  submitting = false,
  activeModule,
  stages,
}) => {
  const [formData, setFormData] = useState<DashboardIndicatorFormData>({
    title: initialData?.title || '',
    type: (initialData?.type || (activeModule === 'commercial' ? 'count' : 'count')) as 'count' | 'sum',
    color: (initialData?.color || 'blue') as any,
    stage_ids: initialData?.stage_ids || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        type: (initialData.type || 'count') as 'count' | 'sum',
        color: (initialData.color || 'blue') as any,
        stage_ids: initialData.stage_ids || [],
      });
      setErrors({});
      setTouched({});
    }
  }, [initialData]);

  const handleChangeTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, title: value }));

    if (errors.title) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.title;
        return next;
      });
    }
  };

  const handleBlurTitle = async () => {
    setTouched((prev) => ({ ...prev, title: true }));
    const result = await validateIndicatorForm(formData);
    if (!result.isValid && result.errors.title) {
      setErrors((prev) => ({ ...prev, title: result.errors.title }));
    }
  };

  const handleToggleStage = (stageId: string) => {
    setFormData((prev) => {
      const exists = prev.stage_ids.includes(stageId);
      const nextStageIds = exists
        ? prev.stage_ids.filter((id) => id !== stageId)
        : [...prev.stage_ids, stageId];
      return { ...prev, stage_ids: nextStageIds };
    });
  };

  const handleSelectAllStages = () => {
    if (formData.stage_ids.length === stages.length) {
      // Deseleccionar todas
      setFormData((prev) => ({ ...prev, stage_ids: [] }));
    } else {
      // Seleccionar todas
      setFormData((prev) => ({ ...prev, stage_ids: stages.map((s) => s.id) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const normalizedData: DashboardIndicatorFormData = {
      ...formData,
      type: activeModule === 'commercial' ? formData.type : 'count',
    };

    const { isValid, errors: validationErrors } = await validateIndicatorForm(normalizedData);

    if (!isValid) {
      setErrors(validationErrors);
      setTouched({ title: true });
      return;
    }

    await onSubmit(normalizedData);
  };

  const allStagesSelected = stages.length > 0 && formData.stage_ids.length === stages.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Campo Título con FormField y Yup */}
      <div className="space-y-1">
        <FormField
          id="indicator-title"
          label="Título del Indicador KPI"
          name="title"
          value={formData.title}
          onChange={handleChangeTitle}
          onBlur={handleBlurTitle}
          placeholder="Ej. Citas Concretadas, Oportunidades Calificadas, Ventas VIP..."
          maxLength={60}
          autoFocus
          error={touched.title ? errors.title : undefined}
          inputPrefix={<LayoutDashboard size={16} className="text-slate-400" />}
          className="!py-3 !rounded-xl"
        />
        <p className="text-[11px] text-slate-400 ml-1">
          Máximo 60 caracteres. Se mostrará como tarjeta métrica en la parte superior del Dashboard.
        </p>
      </div>

      {/* Tipo de Operación (Solo Comercial) */}
      {activeModule === 'commercial' ? (
        <div>
          <Select
            label="Tipo de Cálculo"
            value={TYPE_OPTIONS.find((o) => o.value === formData.type)}
            onChange={(opt: any) =>
              setFormData((prev) => ({ ...prev, type: opt?.value || 'count' }))
            }
            options={TYPE_OPTIONS}
          />
          <p className="text-[11px] text-slate-400 mt-1 ml-1">
            {formData.type === 'sum'
              ? 'Calcula la suma acumulada de los importes monetarios de las oportunidades.'
              : 'Cuenta la cantidad total de acuerdos que se encuentran en las etapas seleccionadas.'}
          </p>
        </div>
      ) : (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <span className="font-semibold">Tipo de cálculo en Mesa de Ayuda:</span>
          <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
            Conteo de Tickets (Volumen)
          </span>
        </div>
      )}

      {/* Paleta Cromática */}
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
          Color de la Tarjeta en Dashboard
        </label>
        <div className="grid grid-cols-5 gap-2">
          {COLOR_OPTIONS.map((opt) => {
            const isSelected = formData.color === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, color: opt.value as any }))}
                title={opt.label}
                className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span className={`w-5 h-5 rounded-full ${opt.bg} flex items-center justify-center text-white`}>
                  {isSelected && <Check size={11} strokeWidth={3} />}
                </span>
                <span className={`text-[10px] font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-500'}`}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selector de Etapas Asociadas */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            Etapas Monitoreadas ({formData.stage_ids.length} seleccionada{formData.stage_ids.length !== 1 ? 's' : ''})
          </label>
          {stages.length > 0 && (
            <button
              type="button"
              onClick={handleSelectAllStages}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
            >
              {allStagesSelected ? (
                <>
                  <Square size={13} /> Deseleccionar todas
                </>
              ) : (
                <>
                  <CheckSquare size={13} /> Seleccionar todas
                </>
              )}
            </button>
          )}
        </div>

        {stages.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-amber-700 font-semibold bg-amber-50 p-3.5 rounded-xl border border-amber-200">
            <AlertCircle size={15} className="shrink-0" />
            No hay etapas activas en este pipeline/mesa. Crea etapas primero en la sección correspondiente.
          </div>
        ) : (
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {stages.map((stage) => {
              const isChecked = formData.stage_ids.includes(stage.id);
              return (
                <label
                  key={stage.id}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border cursor-pointer select-none transition-all ${
                    isChecked
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-800 font-bold shadow-2xs'
                      : 'bg-white border-slate-200/80 text-slate-600 hover:border-slate-300 font-medium'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleStage(stage.id)}
                    className="w-4 h-4 rounded accent-indigo-600 cursor-pointer shrink-0"
                  />
                  <span className="text-xs truncate">{stage.strname}</span>
                </label>
              );
            })}
          </div>
        )}
        <p className="text-[11px] text-slate-400 mt-1 ml-1">
          Si no seleccionas ninguna etapa, la tarjeta contabilizará todas las oportunidades/tickets del flujo.
        </p>
      </div>

      {/* Botones de Acción */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-4 border-t border-slate-100">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={submitting}
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto"
        >
          {submitting
            ? 'Guardando...'
            : initialData
            ? 'Actualizar Indicador'
            : 'Crear Indicador KPI'}
        </Button>
      </div>
    </form>
  );
};
