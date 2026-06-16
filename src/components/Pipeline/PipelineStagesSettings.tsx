import React, { useEffect, useState } from 'react';
import { getMainPipeline, updateMainPipeline } from '../../services/pipelinesService';
import type { Stage } from '../../core/models/Opportunity';
import { ArrowUp, ArrowDown, Plus, Trash2, Save, Info, Check, Sliders } from 'lucide-react';
import Notification from '../Modal/Notification';
import Loader from '../Loader/Loader';

interface Props {
  onSaveSuccess?: () => void;
  onlyPipelineDetails?: boolean;
}

const PipelineStagesSettings: React.FC<Props> = ({ onSaveSuccess, onlyPipelineDetails = false }) => {
  const [pipelineName, setPipelineName] = useState('');
  const [pipelineDescription, setPipelineDescription] = useState('');
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [notification, setNotification] = useState({
    show: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'confirmation',
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const hideNotification = () => setNotification(prev => ({ ...prev, show: false }));

  const showSuccess = (message: string) => {
    setNotification({
      show: true,
      type: 'success',
      title: '¡Éxito!',
      message,
      onConfirm: hideNotification,
      onCancel: hideNotification,
    });
  };

  const showError = (message: string) => {
    setNotification({
      show: true,
      type: 'error',
      title: 'Error de Validación',
      message,
      onConfirm: hideNotification,
      onCancel: hideNotification,
    });
  };

  const enforceFirstActiveIsInitial = (currentStages: Stage[]): Stage[] => {
    let firstActiveFound = false;
    return currentStages.map(s => {
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
    } catch (error) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo cargar la configuración del pipeline.',
        onConfirm: hideNotification,
        onCancel: hideNotification,
      });
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
    };
    setStages(prev => enforceFirstActiveIsInitial([...prev, newStage]));
  };

  const handleRemoveStage = (index: number) => {
    const stageToRemove = stages[index];
    // Solo permitimos eliminar si es una etapa nueva no guardada en BD
    if (stageToRemove.id && stageToRemove.id.startsWith('temp-')) {
      const newStages = stages.filter((_, idx) => idx !== index);
      // Reordenar display_order
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

    // Swap
    const temp = newStages[index];
    newStages[index] = newStages[targetIndex];
    newStages[targetIndex] = temp;

    // Reasignar display_order
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
      showError('El nombre del pipeline no puede estar vacío.');
      return;
    }

    setSaving(true);
    try {
      // 1. Debe existir al menos una etapa activa
      const activeStages = stages.filter(s => s.blnstatus);
      if (activeStages.length === 0) {
        showError('Debe existir al menos una etapa activa.');
        setSaving(false);
        return;
      }

      // 2. Debe existir exactamente una etapa inicial activa
      const initialActiveStages = activeStages.filter(s => s.blninitial);
      if (initialActiveStages.length !== 1) {
        showError('Debe existir exactamente una etapa inicial activa en el pipeline.');
        setSaving(false);
        return;
      }

      // 3. No se permiten nombres duplicados
      const names = stages.map(s => s.strname.trim().toLowerCase());
      const uniqueNames = new Set(names);
      if (names.length !== uniqueNames.size) {
        showError('No se permiten nombres de etapas duplicados.');
        setSaving(false);
        return;
      }

      // 4. Los nombres de las etapas no deben estar vacíos
      if (stages.some(s => !s.strname.trim())) {
        showError('El nombre de todas las etapas activas o inactivas debe estar completo.');
        setSaving(false);
        return;
      }

      const stagesPayload = stages.map(s => {
        const payloadItem: any = {
          strname: s.strname.trim(),
          blnstatus: s.blnstatus,
          display_order: s.display_order,
          strcolor: s.strcolor || '#3b82f6',
          blninitial: s.blninitial,
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

      showSuccess('Configuración del pipeline guardada correctamente.');
      onSaveSuccess?.();
      loadData();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Ocurrió un error al actualizar la configuración.';
      showError(Array.isArray(msg) ? msg.join(', ') : msg);
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
    <>
      <Notification {...notification} />
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="border-b border-gray-100 pb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Sliders size={20} className="text-blue-600" />
            {onlyPipelineDetails ? 'Configuración del Pipeline' : 'Configuración del Pipeline Comercial'}
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
                Las etapas existentes vinculadas a la base de datos no se pueden eliminar directamente para evitar la pérdida en cascada de oportunidades. 
                Si deseas retirar una etapa del flujo activo, simplemente desmarca su casilla <strong>Activo</strong>. Las oportunidades asignadas a etapas desactivadas seguirán existiendo en el historial.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Pipeline Details Form */}
          <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-5 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Detalles del Pipeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase">Nombre del Pipeline</label>
                <input
                  type="text"
                  value={pipelineName}
                  onChange={e => setPipelineName(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  placeholder="Ej. Pipeline Principal"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase">Descripción</label>
                <input
                  type="text"
                  value={pipelineDescription}
                  onChange={e => setPipelineDescription(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  placeholder="Descripción breve del pipeline"
                />
              </div>
            </div>
          </div>

          {/* Stages List */}
          <div className="flex flex-col gap-4 border-t border-gray-100 pt-6 mt-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Etapas del Proceso</h3>
              {!onlyPipelineDetails && (
                <button
                  type="button"
                  onClick={handleAddStage}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus size={14} />
                  Agregar Etapa
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {stages.map((stage, idx) => {
                const isNew = stage.id && stage.id.startsWith('temp-');

                if (onlyPipelineDetails) {
                  return (
                    <div
                      key={stage.id}
                      className={`flex items-center justify-between bg-white border rounded-xl p-4 transition-all shadow-sm ${
                        !stage.blnstatus ? 'opacity-60 bg-gray-50 border-gray-200' : 'border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3.5 h-3.5 rounded-full border border-gray-200 shadow-sm animate-pulse" 
                          style={{ backgroundColor: stage.strcolor || '#3b82f6' }} 
                        />
                        <span className="font-semibold text-slate-700 text-sm select-none flex items-center gap-2">
                          {stage.strname}
                          {stage.blninitial && (
                            <span className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full">
                              Inicial
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`active-p-${stage.id}`}
                          checked={stage.blnstatus}
                          onChange={e => updateStageField(idx, 'blnstatus', e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <label htmlFor={`active-p-${stage.id}`} className="text-xs font-semibold text-gray-600 cursor-pointer select-none">
                          Activo
                        </label>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={stage.id}
                    className={`flex flex-col md:flex-row items-center gap-4 bg-white border rounded-xl p-4 transition-all shadow-sm ${
                      !stage.blnstatus ? 'opacity-60 bg-gray-50 border-gray-200' : 'border-gray-100 hover:border-gray-300'
                    }`}
                  >
                    {/* Reordenamiento */}
                    <div className="flex md:flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => moveStage(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Subir orden"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStage(idx, 'down')}
                        disabled={idx === stages.length - 1}
                        className="p-1 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Bajar orden"
                      >
                        <ArrowDown size={16} />
                      </button>
                    </div>

                    {/* Color Dot Picker */}
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-gray-500 md:hidden">Color</label>
                      <div className="relative w-8 h-8 rounded-full border border-gray-200 overflow-hidden cursor-pointer shadow-sm hover:scale-105 transition-transform" style={{ backgroundColor: stage.strcolor || '#3b82f6' }}>
                        <input
                          type="color"
                          value={stage.strcolor || '#3b82f6'}
                          onChange={e => updateStageField(idx, 'strcolor', e.target.value)}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Stage Name Input */}
                    <div className="flex-1 w-full flex flex-col gap-1">
                      <input
                        type="text"
                        value={stage.strname}
                        onChange={e => updateStageField(idx, 'strname', e.target.value)}
                        placeholder="Nombre de la etapa (ej. Propuesta)"
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                        required
                      />
                    </div>

                    {/* Active Checkbox */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`active-${stage.id}`}
                        checked={stage.blnstatus}
                        onChange={e => updateStageField(idx, 'blnstatus', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <label htmlFor={`active-${stage.id}`} className="text-xs font-semibold text-gray-600 cursor-pointer select-none">
                        Activo
                      </label>
                    </div>

                    {/* Initial Badge */}
                    <div className="flex items-center gap-2">
                      {stage.blninitial ? (
                        <span className="text-xs font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full flex items-center gap-1">
                          Etapa Inicial
                          <Check size={12} className="text-green-600" />
                        </span>
                      ) : stage.blnstatus ? (
                        <span className="text-xs text-slate-400 font-medium italic">
                          (Secundaria)
                        </span>
                      ) : null}
                    </div>

                    {/* Remove Action (Only for unsaved stages) */}
                    <div className="w-10 flex justify-end">
                      {isNew ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveStage(idx)}
                          className="p-1.5 rounded text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Eliminar etapa nueva"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <br/>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 mt-4">
            <button
              type="button"
              onClick={loadData}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Restablecer
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm"
            >
              <Save size={16} />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default PipelineStagesSettings;
