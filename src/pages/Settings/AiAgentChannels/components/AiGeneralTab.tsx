import React, { useState } from 'react';
import {
  Brain,
  Sliders,
  UserCheck,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react';
import Button from '../../../../components/shared/Button';
import Input from '../../../../components/shared/Input';
import Select from '../../../../components/shared/Select';
import { AiOrchestratorCanvas } from './AiOrchestratorCanvas';
import { AiSubAgentsTable } from './AiSubAgentsTable';
import type { SubAgent, SubAgentStatusFilter } from '../schemas/aiAgent.schema';
import { REMINDER_OFFSET_OPTIONS } from '../schemas/aiAgent.schema';

interface AiGeneralTabProps {
  isActive: boolean;
  setIsActive: (val: boolean) => void;
  temperature: number;
  setTemperature: (val: number) => void;
  historyMessageLimit: number;
  setHistoryMessageLimit: (val: number) => void;
  defaultUserId: string;
  setDefaultUserId: (val: string) => void;
  reminderOffsetMinutes: number;
  setReminderOffsetMinutes: (val: number) => void;
  users: any[];
  subAgents: SubAgent[];
  onOpenCreateSubAgent: () => void;
  onOpenEditSubAgent: (agent: SubAgent) => void;
  onDeleteSubAgent: (id: string) => void;
  onToggleSubAgentStatus: (agent: SubAgent) => void;
  onOpenRouterModal: () => void;
  onSaveGeneralConfig: (e: React.FormEvent) => Promise<void>;
  saving: boolean;
  subAgentsLoading: boolean;
}

export const AiGeneralTab: React.FC<AiGeneralTabProps> = ({
  isActive,
  setIsActive,
  temperature,
  setTemperature,
  historyMessageLimit,
  setHistoryMessageLimit,
  defaultUserId,
  setDefaultUserId,
  reminderOffsetMinutes,
  setReminderOffsetMinutes,
  users,
  subAgents,
  onOpenCreateSubAgent,
  onOpenEditSubAgent,
  onDeleteSubAgent,
  onToggleSubAgentStatus,
  onOpenRouterModal,
  onSaveGeneralConfig,
  saving,
  subAgentsLoading,
}) => {
  const [viewMode, setViewMode] = useState<'canvas' | 'table'>('canvas');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubAgentStatusFilter>('all');

  const userOptions = users.map((u) => ({
    value: u.id,
    label: `${u.username} (${u.role})`,
  }));

  const filteredSubAgents = subAgents.filter((agent) => {
    const matchesSearch =
      !searchTerm ||
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (agent.description && agent.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && agent.isActive) ||
      (statusFilter === 'inactive' && !agent.isActive);

    return matchesSearch && matchesStatus;
  });

  return (
    <form onSubmit={onSaveGeneralConfig} className="space-y-6 text-left w-full">
      {/* Switch Principal de Respuesta Automática */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-indigo-100 rounded-xl text-indigo-700">
            <Brain size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">
              Respuesta Automática del Agente IA
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Habilita o deshabilita la inferencia automática del modelo en todos los canales de mensajería
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
          <span className="ml-3 text-xs font-bold text-slate-700">
            {isActive ? 'Activo' : 'Inactivo'}
          </span>
        </label>
      </div>

      {/* Selector de Modo de Vista (Lienzo Gráfico vs Tabla TanStack) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-800 text-sm">
              Gestión de Flujo y Sub-Agentes
            </h4>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {subAgents.length} registrados
            </span>
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('canvas')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'canvas'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid size={13} />
              <span>Lienzo Visual</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <TableIcon size={13} />
              <span>Vista Tabla</span>
            </button>
          </div>
        </div>

        {viewMode === 'canvas' ? (
          <AiOrchestratorCanvas
            subAgents={subAgents}
            onOpenCreateSubAgent={onOpenCreateSubAgent}
            onOpenEditSubAgent={onOpenEditSubAgent}
            onDeleteSubAgent={onDeleteSubAgent}
            onToggleSubAgentStatus={onToggleSubAgentStatus}
            onOpenRouterModal={onOpenRouterModal}
          />
        ) : (
          <AiSubAgentsTable
            subAgents={filteredSubAgents}
            totalCount={subAgents.length}
            loading={subAgentsLoading}
            onEdit={onOpenEditSubAgent}
            onDelete={(agent) => agent.id && onDeleteSubAgent(agent.id)}
            onToggleStatus={onToggleSubAgentStatus}
            onCreate={onOpenCreateSubAgent}
            onOpenRouterModal={onOpenRouterModal}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
        )}
      </div>

      {/* Parámetros de la IA del Tenant */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sliders className="text-amber-500" size={18} />
          <h4 className="font-bold text-slate-800 text-sm">
            Parámetros de Inferencia del Tenant
          </h4>
        </div>

        {/* Temperatura */}
        <div className="space-y-2 pt-1">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Temperatura Global de la IA (Creatividad vs Precisión)
            </label>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
              {temperature}
            </span>
          </div>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-slate-400 font-medium">
            <span>Preciso (0.0)</span>
            <span>Equilibrado (0.5)</span>
            <span>Creativo (1.0)</span>
          </div>
        </div>

        {/* Límite de Historial */}
        <div className="pt-3 border-t border-slate-100 space-y-1">
          <label
            htmlFor="historyMessageLimit"
            className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1"
          >
            Límite de Historial de Mensajes para la IA (Omnicanal)
          </label>
          <p className="text-xs text-slate-500 mb-2 leading-relaxed">
            Número de mensajes más recientes del cliente recuperados entre todos sus canales y enviados como contexto al modelo.
          </p>
          <Input
            id="historyMessageLimit"
            type="number"
            min={3}
            max={50}
            value={historyMessageLimit}
            onChange={(e) => setHistoryMessageLimit(parseInt(e.target.value, 10) || 10)}
            placeholder="Ej: 10"
          />
        </div>
      </div>

      {/* Asignación y Recordatorios */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <UserCheck className="text-emerald-500" size={18} />
          <h4 className="font-bold text-slate-800 text-sm">
            Asignación y Tiempos de Recordatorio
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="defaultUserId"
              className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
            >
              Ejecutivo Asignado por Defecto
            </label>
            <Select
              inputId="defaultUserId"
              value={userOptions.find((opt) => opt.value === defaultUserId)}
              onChange={(selected) => setDefaultUserId(selected ? selected.value : '')}
              options={userOptions}
              isClearable
              placeholder="-- Seleccionar Ejecutivo --"
            />
          </div>

          <div>
            <label
              htmlFor="reminderOffsetMinutes"
              className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
            >
              Tiempo de Recordatorio por Defecto
            </label>
            <Select
              inputId="reminderOffsetMinutes"
              value={REMINDER_OFFSET_OPTIONS.find((opt) => opt.value === reminderOffsetMinutes)}
              onChange={(selected) => {
                if (selected) setReminderOffsetMinutes(selected.value);
              }}
              options={REMINDER_OFFSET_OPTIONS}
              isSearchable={false}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" variant="success" loading={saving} className="px-5 py-2.5 text-xs font-bold">
          Guardar Configuración
        </Button>
      </div>
    </form>
  );
};
