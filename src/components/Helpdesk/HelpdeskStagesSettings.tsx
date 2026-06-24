import React, { useEffect, useState } from 'react';
import { getMainHelpdesk, updateMainHelpdesk } from '../../services/ticketsService';
import type { TicketStage } from '../../core/models/Ticket';
import { ArrowUp, ArrowDown, Plus, Trash2, Save, Info, Check, Sliders } from 'lucide-react';
import Notification from '../Modal/Notification';
import Loader from '../Loader/Loader';

interface Props {
  onSaveSuccess?: () => void;
  onlyHelpdeskDetails?: boolean;
}

const HelpdeskStagesSettings: React.FC<Props> = ({ onSaveSuccess, onlyHelpdeskDetails = false }) => {
  const [helpdeskName, setHelpdeskName] = useState('');
  const [helpdeskDescription, setHelpdeskDescription] = useState('');
  const [stages, setStages] = useState<TicketStage[]>([]);
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

  const enforceFirstActiveIsInitial = (currentStages: TicketStage[]): TicketStage[] => {
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
      const helpdesk = await getMainHelpdesk();
      setHelpdeskName(helpdesk.strname);
      setHelpdeskDescription(helpdesk.strdescription || '');
      setStages(enforceFirstActiveIsInitial(helpdesk.stages || []));
    } catch (error) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo cargar la configuración de la mesa de ayuda.',
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
    const newStage: TicketStage = {
      id: `temp-${Date.now()}`,
      strname: '',
      blnstatus: true,
      helpdesk_id: '',
      display_order: stages.length,
      strcolor: '#6366f1',
      blninitial: false,
      intmaxdays: null,
      dtmcreated: '',
      dtmlastmodified: '',
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

  const updateStageField = (index: number, field: keyof TicketStage, value: any) => {
    const newStages = [...stages];
    newStages[index] = { ...newStages[index], [field]: value };
    setStages(enforceFirstActiveIsInitial(newStages));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!helpdeskName.trim()) {
      showError('El nombre de la mesa de ayuda no puede estar vacío.');
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
      const initialActiveStages = initialActiveStagesFilter(activeStages);
      if (initialActiveStages.length !== 1) {
        showError('Debe existir exactamente una etapa inicial activa en la mesa de ayuda.');
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
          strcolor: s.strcolor || '#6366f1',
          blninitial: s.blninitial,
          intmaxdays: s.intmaxdays !== undefined && s.intmaxdays !== null ? Number(s.intmaxdays) : null,
        };
        if (s.id && !s.id.startsWith('temp-')) {
          payloadItem.id = s.id;
        }
        return payloadItem;
      });

      await updateMainHelpdesk({
        strname: helpdeskName.trim(),
        strdescription: helpdeskDescription.trim(),
        stages: stagesPayload,
      });

      showSuccess('Configuración de la mesa de ayuda guardada correctamente.');
      onSaveSuccess?.();
      loadData();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Ocurrió un error al actualizar la configuración.';
      showError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSaving(false);
    }
  };

  const initialActiveStagesFilter = (activeStagesList: TicketStage[]) => {
    return activeStagesList.filter(s => s.blninitial);
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
            <Sliders size={20} className="text-indigo-650" />
            {onlyHelpdeskDetails ? 'Configuración de la Mesa de Ayuda' : 'Configuración de la Mesa de Ayuda Principal'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {onlyHelpdeskDetails 
              ? 'Modifica el nombre y descripción de la mesa de ayuda en uso.' 
              : 'Modifica los detalles generales de la mesa de ayuda y administra las etapas dinámicas del tablero kanban.'}
          </p>
        </div>

        {/* Info Alert */}
        {!onlyHelpdeskDetails && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex gap-3 text-indigo-800 text-sm">
            <Info size={18} className="shrink-0 mt-0.5 text-indigo-600" />
            <div>
              <p className="font-semibold">Información sobre eliminación de etapas</p>
              <p className="mt-0.5 text-indigo-700 leading-relaxed">
                Las etapas existentes vinculadas a la base de datos no se pueden eliminar directamente para evitar la pérdida en cascada de tickets. 
                Si deseas retirar una etapa del flujo activo, simplemente desmarca su casilla <strong>Activo</strong>. Los tickets asignados a etapas desactivadas seguirán existiendo en el historial.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Helpdesk Details Form */}
          <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-5 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Detalles de la Mesa de Ayuda</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase">Nombre de la Mesa de Ayuda</label>
                <input
                  type="text"
                  value={helpdeskName}
                  onChange={e => setHelpdeskName(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  placeholder="Ej. Mesa de Ayuda Principal"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase">Descripción</label>
                <input
                  type="text"
                  value={helpdeskDescription}
                  onChange={e => setHelpdeskDescription(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  placeholder="Descripción breve de la mesa"
                />
              </div>
            </div>
          </div>

          {/* Stages List */}
          <div className="flex flex-col gap-4 border-t border-gray-100 pt-6 mt-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Etapas del Proceso</h3>
              {!onlyHelpdeskDetails && (
                <button
                  type="button"
                  onClick={handleAddStage}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus size={14} />
                  Agregar Etapa
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {/* Column headers */}
              {stages.length > 0 && !onlyHelpdeskDetails && (
                <div className="flex items-center gap-3 px-3 pb-1 border-b border-gray-100">
                  <div className="w-[14px] shrink-0"></div>
                  <div className="w-8 shrink-0 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Color</div>
                  <div className="flex-grow text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Nombre</div>
                  <div className="w-16 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Días</div>
                  <div className="w-16 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Estado</div>
                  <div className="w-[42px] text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tipo</div>
                  <div className="w-7 shrink-0"></div>
                </div>
              )}
              {stages.map((stage, idx) => {
                const isNew = stage.id && stage.id.startsWith('temp-');
                return (
                  <div key={stage.id} className={`flex items-center gap-3 bg-white border rounded-xl px-3 py-2 shadow-sm transition-all ${
                    !stage.blnstatus 
                      ? 'opacity-60 border-gray-200 bg-gray-50' 
                      : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                  }`}>
                    {/* Reorder arrows */}
                    {!onlyHelpdeskDetails && (
                      <div className="flex flex-col shrink-0">
                        <button type="button" onClick={() => moveStage(idx, 'up')} disabled={idx === 0}
                          className="p-0.5 text-gray-400 hover:text-indigo-600 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer">
                          <ArrowUp size={13} />
                        </button>
                        <button type="button" onClick={() => moveStage(idx, 'down')} disabled={idx === stages.length - 1}
                          className="p-0.5 text-gray-400 hover:text-indigo-600 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer">
                          <ArrowDown size={13} />
                        </button>
                      </div>
                    )}

                    {/* Color picker */}
                    <div
                      className="relative w-8 h-8 rounded-lg border border-gray-200 overflow-hidden cursor-pointer shrink-0 hover:ring-2 hover:ring-indigo-400 transition-all shadow-sm"
                      style={{ backgroundColor: stage.strcolor || '#6366f1' }}
                      title="Cambiar color"
                    >
                      <input
                        type="color"
                        value={stage.strcolor || '#6366f1'}
                        onChange={e => updateStageField(idx, 'strcolor', e.target.value)}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      />
                    </div>

                    {/* Name */}
                    <input
                      type="text"
                      value={stage.strname}
                      onChange={e => updateStageField(idx, 'strname', e.target.value)}
                      placeholder="Nombre de la etapa…"
                      className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium bg-white"
                      required
                    />

                    {/* Days limit */}
                    <input
                      type="number"
                      min="0"
                      placeholder="∞"
                      value={stage.intmaxdays !== undefined && stage.intmaxdays !== null ? stage.intmaxdays : ''}
                      onChange={e => {
                        const val = e.target.value;
                        updateStageField(idx, 'intmaxdays', val === '' ? null : parseInt(val, 10));
                      }}
                      className="w-16 shrink-0 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center font-medium bg-white"
                      title="Días límite en etapa (vacío = sin límite)"
                    />

                    {/* Active toggle */}
                    <label className="relative inline-flex items-center cursor-pointer shrink-0" title="Activo/Inactivo">
                      <input
                        type="checkbox"
                        checked={stage.blnstatus}
                        onChange={e => updateStageField(idx, 'blnstatus', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:ring-1 peer-focus:ring-indigo-400 rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>

                    {/* Initial/Secondary/Inactive badge */}
                    <div className="w-[42px] text-center shrink-0">
                      {stage.blninitial ? (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                          <Check size={9} /> Inicial
                        </span>
                      ) : stage.blnstatus ? (
                        <span className="text-[9px] text-slate-400">2da</span>
                      ) : (
                        <span className="text-[9px] text-gray-300">Off</span>
                      )}
                    </div>

                    {/* Delete unsaved */}
                    <div className="w-7 shrink-0 flex justify-center">
                      {isNew ? (
                        <button type="button" onClick={() => handleRemoveStage(idx)}
                          className="p-1 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 cursor-pointer">
                          <Trash2 size={14} />
                        </button>
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
            <button
              type="button"
              onClick={loadData}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-150 transition-colors disabled:opacity-50"
            >
              Restablecer
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm"
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

export default HelpdeskStagesSettings;
