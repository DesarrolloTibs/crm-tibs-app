import React, { useState, useEffect } from 'react';
import { Sliders } from 'lucide-react';
import Modal from '@shared/components/Modal';
import Button from '@shared/components/Button';
import Input from '@shared/components/Input';
import TextArea from '@shared/components/TextArea';
import { useFormValidation } from '@shared/components/useFormValidation';
import {
  AVAILABLE_TOOLS,
  subAgentValidationSchema,
  type SubAgent,
  type SubAgentFormData,
} from '../schemas/aiAgent.schema';

interface AiSubAgentModalProps {
  open: boolean;
  editingSubAgent: SubAgent | null;
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
  saving: boolean;
}

export const AiSubAgentModal: React.FC<AiSubAgentModalProps> = ({
  open,
  editingSubAgent,
  onClose,
  onSave,
  saving,
}) => {
  const [subAgentKey, setSubAgentKey] = useState('');
  const [subAgentName, setSubAgentName] = useState('');
  const [subAgentDescription, setSubAgentDescription] = useState('');
  const [subAgentContext, setSubAgentContext] = useState('');
  const [subAgentTools, setSubAgentTools] = useState<string[]>([]);
  const [subAgentTemperature, setSubAgentTemperature] = useState(0.7);

  const { errors, setError, clearErrors } = useFormValidation<SubAgentFormData>();

  useEffect(() => {
    if (open) {
      if (editingSubAgent) {
        setSubAgentKey(editingSubAgent.key);
        setSubAgentName(editingSubAgent.name);
        setSubAgentDescription(editingSubAgent.description || '');
        setSubAgentContext(editingSubAgent.context || '');
        setSubAgentTools(editingSubAgent.tools || []);
        setSubAgentTemperature(editingSubAgent.temperature ?? 0.7);
      } else {
        setSubAgentKey('');
        setSubAgentName('');
        setSubAgentDescription('');
        setSubAgentContext('');
        setSubAgentTools([]);
        setSubAgentTemperature(0.7);
      }
      clearErrors();
    }
  }, [open, editingSubAgent]);

  // Drag and drop de herramientas
  const handleDragStart = (e: React.DragEvent, toolKey: string) => {
    e.dataTransfer.setData('text/plain', toolKey);
  };

  const handleDropToAssigned = (e: React.DragEvent) => {
    e.preventDefault();
    const toolKey = e.dataTransfer.getData('text/plain');
    if (toolKey && !subAgentTools.includes(toolKey)) {
      setSubAgentTools((prev) => [...prev, toolKey]);
    }
  };

  const handleDropToAvailable = (e: React.DragEvent) => {
    e.preventDefault();
    const toolKey = e.dataTransfer.getData('text/plain');
    if (toolKey && subAgentTools.includes(toolKey)) {
      setSubAgentTools((prev) => prev.filter((t) => t !== toolKey));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const addTool = (toolKey: string) => {
    if (!subAgentTools.includes(toolKey)) {
      setSubAgentTools((prev) => [...prev, toolKey]);
    }
  };

  const removeTool = (toolKey: string) => {
    setSubAgentTools((prev) => prev.filter((t) => t !== toolKey));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    const normalizedKey = subAgentKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    const candidateData: SubAgentFormData = {
      key: normalizedKey,
      name: subAgentName.trim(),
      description: subAgentDescription.trim(),
      context: subAgentContext.trim(),
      temperature: subAgentTemperature,
      tools: subAgentTools,
      isActive: editingSubAgent ? editingSubAgent.isActive : true,
    };

    try {
      await subAgentValidationSchema.validate(candidateData, { abortEarly: false });

      await onSave({
        id: editingSubAgent?.id || undefined,
        ...candidateData,
      });
    } catch (err: any) {
      if (err.inner) {
        err.inner.forEach((validationError: any) => {
          if (validationError.path) {
            setError(validationError.path as keyof SubAgentFormData, validationError.message);
          }
        });
      }
    }
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-2xl" height="h-[95vh]">
      <div className="pb-4 border-b border-slate-150 flex justify-between items-center pr-8 text-left">
        <div>
          <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
            <Sliders size={18} className="text-indigo-600" />
            {editingSubAgent ? `Editar Sub-Agente: ${subAgentName}` : 'Crear Nuevo Sub-Agente'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Define los parámetros de comportamiento, directiva para el enrutador y asigna herramientas del CRM.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-left">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label="Clave Única (Key) - Minúsculas y guiones bajos"
              id="subAgentKey"
              type="text"
              value={subAgentKey}
              onChange={(e) =>
                setSubAgentKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
              }
              placeholder="Ej: soporte_tecnico"
              required
              disabled={!!editingSubAgent}
            />
            {errors.key && <p className="text-rose-600 text-[11px] font-semibold mt-1">{errors.key}</p>}
          </div>

          <div>
            <Input
              label="Nombre del Sub-Agente"
              id="subAgentName"
              type="text"
              value={subAgentName}
              onChange={(e) => setSubAgentName(e.target.value)}
              placeholder="Ej: Agente de Soporte Técnico"
              required
            />
            {errors.name && <p className="text-rose-600 text-[11px] font-semibold mt-1">{errors.name}</p>}
          </div>
        </div>

        <div>
          <Input
            label="Descripción para el Enrutamiento (Guía al Router de cuándo invocarlo)"
            id="subAgentDescription"
            type="text"
            value={subAgentDescription}
            onChange={(e) => setSubAgentDescription(e.target.value)}
            placeholder="Ej: Úsalo cuando el cliente tenga problemas técnicos con su cuenta o reporte fallas."
            required
          />
          {errors.description && (
            <p className="text-rose-600 text-[11px] font-semibold mt-1">{errors.description}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="subAgentContext"
            className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5"
          >
            Instrucciones de Comportamiento / Prompt del Agente
          </label>
          <TextArea
            id="subAgentContext"
            value={subAgentContext}
            onChange={(e) => setSubAgentContext(e.target.value)}
            placeholder="Defina las directivas del sub-agente: tono de comunicación, políticas del departamento, reglas para cotizar, etc."
            rows={5}
            required
          />
          {errors.context && (
            <p className="text-rose-600 text-[11px] font-semibold mt-1">{errors.context}</p>
          )}
        </div>

        {/* Calibrador de Temperatura */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Temperatura del Sub-Agente (Creatividad vs Precisión)
            </label>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
              {subAgentTemperature}
            </span>
          </div>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.1"
            value={subAgentTemperature}
            onChange={(e) => setSubAgentTemperature(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
            <span>Preciso (0.0)</span>
            <span>Equilibrado (0.5)</span>
            <span>Creativo (1.0)</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Para agentes <strong>comerciales</strong> o de <strong>consulta de catálogo</strong>, se recomienda temperatura <strong>baja (0.1 — 0.3)</strong> para evitar alucinaciones. Para agentes <strong>conversacionales</strong>, una temperatura <strong>media (0.5 — 0.7)</strong> genera respuestas más fluidas.
          </p>
        </div>

        {/* Panel Drag & Drop de Herramientas */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Herramientas del CRM Asignadas
          </label>
          <p className="text-[11px] text-slate-400 pb-1">
            Arrastra las tarjetas o haz clic sobre ellas para agregarlas o removerlas del agente.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Disponibles */}
            <div
              className="border border-dashed border-slate-300 rounded-xl p-3.5 bg-slate-50 min-h-[200px]"
              onDragOver={handleDragOver}
              onDrop={handleDropToAvailable}
            >
              <h5 className="text-[10px] font-extrabold text-slate-400 uppercase mb-2 tracking-wider">
                Disponibles en el CRM
              </h5>
              <div className="space-y-2">
                {AVAILABLE_TOOLS.filter((t) => !subAgentTools.includes(t.key)).map((tool) => (
                  <div
                    key={tool.key}
                    draggable
                    onDragStart={(e) => handleDragStart(e, tool.key)}
                    onClick={() => addTool(tool.key)}
                    className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-2xs hover:border-indigo-400 hover:shadow-xs transition-all cursor-grab active:cursor-grabbing text-xs flex justify-between items-center group select-none"
                    title="Arrastra o haz clic para agregar"
                  >
                    <div>
                      <span className="font-bold text-slate-700 block text-left">{tool.label}</span>
                      <span className="text-[10px] text-slate-400 block text-left leading-normal">{tool.desc}</span>
                    </div>
                    <span className="text-slate-300 font-extrabold group-hover:text-indigo-600 transition-colors text-base pr-1">
                      +
                    </span>
                  </div>
                ))}
                {AVAILABLE_TOOLS.filter((t) => !subAgentTools.includes(t.key)).length === 0 && (
                  <div className="text-[11px] text-slate-400 text-center py-10">
                    Todas las herramientas están asignadas
                  </div>
                )}
              </div>
            </div>

            {/* Asignadas */}
            <div
              className="border border-dashed border-indigo-200 rounded-xl p-3.5 bg-indigo-50/20 min-h-[200px]"
              onDragOver={handleDragOver}
              onDrop={handleDropToAssigned}
            >
              <h5 className="text-[10px] font-extrabold text-indigo-600 uppercase mb-2 tracking-wider">
                Habilitadas para este Agente
              </h5>
              <div className="space-y-2">
                {subAgentTools.map((toolKey) => {
                  const tool = AVAILABLE_TOOLS.find((t) => t.key === toolKey);
                  if (!tool) return null;
                  return (
                    <div
                      key={toolKey}
                      draggable
                      onDragStart={(e) => handleDragStart(e, toolKey)}
                      onClick={() => removeTool(toolKey)}
                      className="bg-white border border-indigo-150 rounded-lg p-2.5 shadow-2xs hover:border-rose-400 hover:shadow-xs transition-all cursor-grab active:cursor-grabbing text-xs flex justify-between items-center group select-none"
                      title="Arrastra o haz clic para remover"
                    >
                      <div>
                        <span className="font-bold text-indigo-950 block text-left">{tool.label}</span>
                        <span className="text-[10px] text-indigo-600/80 block text-left leading-normal">{tool.desc}</span>
                      </div>
                      <span className="text-slate-300 font-extrabold group-hover:text-rose-500 transition-colors text-base pr-1">
                        ×
                      </span>
                    </div>
                  );
                })}
                {subAgentTools.length === 0 && (
                  <div className="text-[11px] text-slate-400 text-center py-10">
                    Arrastra herramientas aquí para habilitarlas
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-150 pt-4 mt-6">
          <Button type="button" variant="secondary" onClick={onClose} className="px-4 py-2 text-xs font-bold">
            Cancelar
          </Button>
          <Button type="submit" variant="success" loading={saving} className="px-4 py-2 text-xs font-bold">
            Guardar Sub-Agente
          </Button>
        </div>
      </form>
    </Modal>
  );
};
