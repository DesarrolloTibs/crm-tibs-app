import React, { useEffect, useState } from 'react';
import { getMainPipeline, updateMainPipeline } from '../../../../services/pipelinesService';
import type { Stage } from '../../schemas/pipeline.schema';
import { validateStageForm } from '../../utils/pipeline.helpers';
import { ArrowUp, ArrowDown, Plus, Trash2, Save, Info, Check, Sliders } from 'lucide-react';
import Loader from '../../../../components/shared/Loader';
import Input from '../../../../components/shared/Input';
import Button from '../../../../components/shared/Button';
import Badge from '../../../../components/shared/Badge';
import { showToast } from '../../../../utils/toast';

interface Props {
  onSaveSuccess?: () => void;
  onlyPipelineDetails?: boolean;
}

export const PipelineStagesSettingsDrawer: React.FC<Props> = ({
  onSaveSuccess,
  onlyPipelineDetails = false,
}) => {
  const [pipelineName, setPipelineName] = useState('');
  const [pipelineDescription, setPipelineDescription] = useState('');
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const enforceFirstActiveIsInitial = (currentStages: Stage[]): Stage[] => {
    let firstActiveFound = false;
    return currentStages.map((s) => {
      if (s.blnstatus && !firstActiveFound) {
        firstActiveFound = true;
        return { ...s, blninitial: true };
      }
      return { ...s, blninitial: false };
    });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const pipeline = await getMainPipeline();
      setPipelineName(pipeline.strname);
      setPipelineDescription(pipeline.strdescription || '');
      setStages(enforceFirstActiveIsInitial(pipeline.stages || []));
    } catch {
      showToast.error('No se pudo cargar la configuración del pipeline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddStage = () => {
    const newStage: Stage = {
      id: `temp-${Date.now()}`,
      strname: '',
      blnstatus: true,
      pipeline_id: '',
      display_order: stages.length,
      strcolor: '#3b82f6',
      blninitial: false,
      stage_type: 0,
      intmaxdays: null,
    };
    setStages((prev) => enforceFirstActiveIsInitial([...prev, newStage]));
  };

  const handleStageTypeChange = (index: number, newType: number) => {
    setStages((prev) => {
      return prev.map((s, idx) => {
        if (idx === index) {
          return { ...s, stage_type: newType };
        }
        if (newType === 1 && (s.stage_type === 1 || Number(s.stage_type) === 1)) {
          return { ...s, stage_type: 0 };
        }
        if (newType === 2 && (s.stage_type === 2 || Number(s.stage_type) === 2)) {
          return { ...s, stage_type: 0 };
        }
        return s;
      });
    });
  };

  const handleRemoveStage = (index: number) => {
    const stageToRemove = stages[index];
    if (stageToRemove.id && stageToRemove.id.startsWith('temp-')) {
      const newStages = stages.filter((_, idx) => idx !== index);
      newStages.forEach((s, idx) => {
        s.display_order = idx;
      });
      setStages(enforceFirstActiveIsInitial(newStages));
    }
  };

  const moveStage = (index: number, direction: 'up' | 'down') => {
    const newStages = [...stages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newStages.length) return;

    const temp = newStages[index];
    newStages[index] = newStages[targetIndex];
    newStages[targetIndex] = temp;

    newStages.forEach((s, idx) => {
      s.display_order = idx;
    });

    setStages(enforceFirstActiveIsInitial(newStages));
  };

  const updateStageField = (index: number, field: keyof Stage, value: any) => {
    const newStages = [...stages];
    newStages[index] = { ...newStages[index], [field]: value };
    setStages(enforceFirstActiveIsInitial(newStages));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pipelineName.trim()) {
      showToast.error('El nombre del pipeline no puede estar vacío.');
      return;
    }

    setSaving(true);
    try {
      for (const stage of stages) {
        const { isValid, errors: stageErrors } = await validateStageForm(stage);
        if (!isValid) {
          const firstError = Object.values(stageErrors)[0] || 'Datos de etapa inválidos';
          showToast.error(`Etapa "${stage.strname || 'Sin nombre'}": ${firstError}`);
          setSaving(false);
          return;
        }
      }

      const activeStages = stages.filter((s) => s.blnstatus);
      if (activeStages.length === 0) {
        showToast.error('Debe existir al menos una etapa activa.');
        setSaving(false);
        return;
      }

      const initialActiveStages = activeStages.filter((s) => s.blninitial);
      if (initialActiveStages.length !== 1) {
        showToast.error('Debe existir exactamente una etapa inicial activa.');
        setSaving(false);
        return;
      }

      const names = stages.map((s) => s.strname.trim().toLowerCase());
      const uniqueNames = new Set(names);
      if (names.length !== uniqueNames.size) {
        showToast.error('No se permiten nombres de etapas duplicados.');
        setSaving(false);
        return;
      }

      if (stages.some((s) => !s.strname.trim())) {
        showToast.error('El nombre de todas las etapas debe estar completo.');
        setSaving(false);
        return;
      }

      const wonStages = stages.filter((s) => Number(s.stage_type) === 1);
      if (wonStages.length > 1) {
        showToast.error('Solo puede haber máximo 1 etapa marcada como Ganada.');
        setSaving(false);
        return;
      }

      const lostStages = stages.filter((s) => Number(s.stage_type) === 2);
      if (lostStages.length > 1) {
        showToast.error('Solo puede haber máximo 1 etapa marcada como Perdida.');
        setSaving(false);
        return;
      }

      const stagesPayload = stages.map((s) => {
        const payloadItem: any = {
          strname: s.strname.trim(),
          blnstatus: s.blnstatus,
          display_order: s.display_order,
          strcolor: s.strcolor || '#3b82f6',
          blninitial: s.blninitial,
          stage_type: Number(s.stage_type ?? 0),
          intmaxdays:
            s.intmaxdays !== undefined && s.intmaxdays !== null
              ? Number(s.intmaxdays)
              : null,
        };
        if (s.id && !s.id.startsWith('temp-')) {
          payloadItem.id = s.id;
        }
        return payloadItem;
      });

      await updateMainPipeline({
        strname: pipelineName.trim(),
        strdescription: pipelineDescription.trim(),
        stages: stagesPayload,
      });

      showToast.success('Configuración del pipeline guardada correctamente.');
      onSaveSuccess?.();
      loadData();
    } catch (error: any) {
      const msg =
        error.response?.data?.message || 'Ocurrió un error al actualizar la configuración.';
      showToast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Sliders size={20} className="text-blue-600" />
          {onlyPipelineDetails
            ? 'Configuración del Pipeline'
            : 'Configuración del Pipeline Comercial'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {onlyPipelineDetails
            ? 'Modifica el nombre y descripción del pipeline comercial en uso.'
            : 'Modifica los detalles generales del pipeline comercial y administra las etapas dinámicas del tablero kanban.'}
        </p>
      </div>

      {/* Info Alert */}
      {!onlyPipelineDetails && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-blue-800 text-sm">
          <Info size={18} className="shrink-0 mt-0.5 text-blue-600" />
          <div>
            <p className="font-semibold">Información sobre eliminación de etapas</p>
            <p className="mt-0.5 text-blue-700 leading-relaxed">
              Las etapas existentes vinculadas a la base de datos no se pueden eliminar directamente
              para evitar la pérdida en cascada de oportunidades. Si deseas retirar una etapa del
              flujo activo, simplemente desmarca su casilla <strong>Activo</strong>.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Pipeline Details Form */}
        <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Detalles del Pipeline
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre del Pipeline *"
              type="text"
              value={pipelineName}
              onChange={(e) => setPipelineName(e.target.value)}
              placeholder="Ej. Pipeline Principal"
              required
            />
            <Input
              label="Descripción"
              type="text"
              value={pipelineDescription}
              onChange={(e) => setPipelineDescription(e.target.value)}
              placeholder="Descripción breve del pipeline"
            />
          </div>
        </div>

        {/* Stages List */}
        <div className="flex flex-col gap-4 border-t border-gray-100 pt-6 mt-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Etapas del Proceso
            </h3>
            {!onlyPipelineDetails && (
              <Button
                type="button"
                variant="primary"
                onClick={handleAddStage}
                className="!text-xs !py-1.5 !px-3 gap-1.5"
              >
                <Plus size={14} />
                <span>Agregar Etapa</span>
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {stages.length > 0 && !onlyPipelineDetails && (
              <div className="flex items-center gap-2.5 px-3 pb-1 border-b border-gray-100">
                <div className="w-[14px] shrink-0"></div>
                <div className="w-8 shrink-0 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Color
                </div>
                <div className="flex-grow text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Nombre
                </div>
                <div className="w-16 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Días
                </div>
                <div className="w-36 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Tipo de Etapa
                </div>
                <div className="w-9 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Estado
                </div>
                <div className="w-[42px] text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Flujo
                </div>
                <div className="w-7 shrink-0"></div>
              </div>
            )}
            {stages.map((stage, idx) => {
              const isNew = stage.id && stage.id.startsWith('temp-');
              return (
                <div
                  key={stage.id}
                  className={`flex items-center gap-2.5 bg-white border rounded-xl px-3 py-2 shadow-sm transition-all ${
                    !stage.blnstatus
                      ? 'opacity-60 border-gray-200 bg-gray-50'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  {/* Reorder arrows */}
                  {!onlyPipelineDetails && (
                    <div className="flex flex-col shrink-0">
                      <Button
                        variant="icon"
                        onClick={() => moveStage(idx, 'up')}
                        disabled={idx === 0}
                        className="!p-0.5 !text-gray-400 hover:!text-blue-600 disabled:!opacity-20"
                      >
                        <ArrowUp size={13} />
                      </Button>
                      <Button
                        variant="icon"
                        onClick={() => moveStage(idx, 'down')}
                        disabled={idx === stages.length - 1}
                        className="!p-0.5 !text-gray-400 hover:!text-blue-600 disabled:!opacity-20"
                      >
                        <ArrowDown size={13} />
                      </Button>
                    </div>
                  )}

                  {/* Color picker */}
                  <div
                    className="relative w-8 h-8 rounded-lg border border-gray-200 overflow-hidden cursor-pointer shrink-0 hover:ring-2 hover:ring-blue-400 transition-all shadow-sm"
                    style={{ backgroundColor: stage.strcolor || '#3b82f6' }}
                    title="Cambiar color"
                  >
                    <input
                      type="color"
                      value={stage.strcolor || '#3b82f6'}
                      onChange={(e) => updateStageField(idx, 'strcolor', e.target.value)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <Input
                      type="text"
                      value={stage.strname}
                      onChange={(e) => updateStageField(idx, 'strname', e.target.value)}
                      placeholder="Nombre de la etapa…"
                      className="!py-1.5 !px-2.5 !rounded-lg !text-sm font-medium"
                      required
                    />
                  </div>

                  {/* Days limit */}
                  <div className="w-16 shrink-0">
                    <Input
                      type="number"
                      min="0"
                      placeholder="∞"
                      value={
                        stage.intmaxdays !== undefined && stage.intmaxdays !== null
                          ? stage.intmaxdays
                          : ''
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        updateStageField(
                          idx,
                          'intmaxdays',
                          val === '' ? null : parseInt(val, 10)
                        );
                      }}
                      className="!py-1.5 !px-1 !rounded-lg !text-sm text-center font-medium"
                      title="Días límite en etapa (vacío = sin límite)"
                    />
                  </div>

                  {/* Stage Type Selector */}
                  <div className="w-36 shrink-0">
                    <select
                      value={Number(stage.stage_type ?? 0)}
                      onChange={(e) =>
                        handleStageTypeChange(idx, Number(e.target.value))
                      }
                      className={`w-full text-xs font-semibold rounded-lg px-2 py-2 border transition-all cursor-pointer outline-none focus:ring-2 focus:ring-indigo-400 ${
                        Number(stage.stage_type) === 1
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold'
                          : Number(stage.stage_type) === 2
                          ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                      title="Tipo de etapa / Cierre de oportunidad"
                    >
                      <option value={0}>Abierta / Proceso</option>
                      <option value={1}>✓ Ganada (Éxito)</option>
                      <option value={2}>✕ Perdida (Cierre)</option>
                    </select>
                  </div>

                  {/* Active toggle */}
                  <label
                    className="relative inline-flex items-center cursor-pointer shrink-0"
                    title="Activo/Inactivo"
                  >
                    <input
                      type="checkbox"
                      checked={stage.blnstatus}
                      onChange={(e) => updateStageField(idx, 'blnstatus', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:ring-1 peer-focus:ring-blue-400 rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>

                  {/* Initial badge */}
                  <div className="w-[48px] text-center shrink-0 flex justify-center">
                    {stage.blninitial ? (
                      <Badge variant="success" size="sm" className="!text-[9px] !px-1.5 !py-0.5">
                        <Check size={9} /> Inicial
                      </Badge>
                    ) : stage.blnstatus ? (
                      <span className="text-[9px] text-slate-400 font-medium">2da</span>
                    ) : (
                      <span className="text-[9px] text-gray-300 font-medium">Off</span>
                    )}
                  </div>

                  {/* Delete unsaved */}
                  <div className="w-7 shrink-0 flex justify-center">
                    {isNew ? (
                      <Button
                        variant="icon"
                        onClick={() => handleRemoveStage(idx)}
                        className="!text-red-400 hover:!text-red-600 hover:!bg-red-50"
                      >
                        <Trash2 size={14} />
                      </Button>
                    ) : (
                      <div className="w-7 h-7" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 mt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={loadData}
            disabled={saving}
          >
            Restablecer
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
            loading={saving}
            className="gap-2"
          >
            <Save size={16} />
            <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export const PipelineStagesSettings = PipelineStagesSettingsDrawer;
export default PipelineStagesSettingsDrawer;
