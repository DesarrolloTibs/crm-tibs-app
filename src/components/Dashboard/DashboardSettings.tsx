import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, AlertCircle, BarChart3, LifeBuoy, CheckCircle2, LayoutDashboard } from 'lucide-react';
import {
  getIndicators,
  createIndicator,
  updateIndicator,
  deleteIndicator,
} from '../../services/reportsService';
import type { DashboardIndicator } from '../../services/reportsService';
import { getPipelines } from '../../services/pipelinesService';
import { getHelpdesks } from '../../services/ticketsService';
import Button from '../shared/Button';
import Input from '../shared/Input';
import Select from '../shared/Select';
import Loader from '../Loader/Loader';
import Modal from '../Modal/Modal';
import Notification from '../Modal/Notification';
import SettingsContainer from '../shared/SettingsContainer';

const COLOR_OPTIONS = [
  { value: 'blue',   label: 'Azul',    bg: 'bg-blue-500',    ring: 'ring-blue-400'    },
  { value: 'green',  label: 'Verde',   bg: 'bg-emerald-500', ring: 'ring-emerald-400' },
  { value: 'purple', label: 'Morado',  bg: 'bg-violet-500',  ring: 'ring-violet-400'  },
  { value: 'orange', label: 'Naranja', bg: 'bg-amber-500',   ring: 'ring-amber-400'   },
  { value: 'red',    label: 'Rojo',    bg: 'bg-rose-500',    ring: 'ring-rose-400'    },
];

// ─── Tab descriptor ───────────────────────────────────────────────────────────
type ChartKey = 'abiertas' | 'ventas' | 'tickets' | 'cerrados' | 'cancelados';

interface ChartTab {
  key: ChartKey;
  label: string;
  activeClass: string;
}

const COMMERCIAL_TABS: ChartTab[] = [
  { key: 'abiertas', label: 'Oportunidades Abiertas', activeClass: 'bg-white text-indigo-600 shadow-sm' },
  { key: 'ventas',   label: 'Ventas',                 activeClass: 'bg-white text-amber-600  shadow-sm' },
];

const SUPPORT_TABS: ChartTab[] = [
  { key: 'tickets',    label: 'Abiertos',    activeClass: 'bg-white text-indigo-600 shadow-sm' },
  { key: 'cerrados',   label: 'Cerrados',    activeClass: 'bg-white text-emerald-600 shadow-sm' },
  { key: 'cancelados', label: 'Cancelados',  activeClass: 'bg-white text-rose-600    shadow-sm' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export const DashboardSettings: React.FC = () => {
  const [activeModule, setActiveModule] = useState<'commercial' | 'support'>('commercial');
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [helpdesks, setHelpdesks] = useState<any[]>([]);

  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [selectedHelpdeskId, setSelectedHelpdeskId] = useState<string>('');

  const [indicators, setIndicators] = useState<DashboardIndicator[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string>('');
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<'count' | 'sum'>('count');
  const [formColor, setFormColor] = useState('blue');
  const [formStageIds, setFormStageIds] = useState<string[]>([]);

  // Notification state
  const [notification, setNotification] = useState({
    show: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'confirmation',
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const hideNotification = () => setNotification(prev => ({ ...prev, show: false }));

  const showSuccess = (title: string, message: string) => {
    setNotification({ show: true, type: 'success', title, message, onConfirm: hideNotification, onCancel: hideNotification });
  };
  const showError = (title: string, message: string) => {
    setNotification({ show: true, type: 'error', title, message, onConfirm: hideNotification, onCancel: hideNotification });
  };

  // ── Selects ───────────────────────────────────────────────────────────────
  const pipelineOptions = useMemo(() => pipelines.map(p => ({ value: p.id, label: p.strname })), [pipelines]);
  const helpdeskOptions = useMemo(() => helpdesks.map(h => ({ value: h.id, label: h.strname })), [helpdesks]);
  const typeOptions = useMemo(() => [
    { value: 'count', label: 'Contar (Cantidad)' },
    { value: 'sum',   label: 'Sumar Monto ($ Ventas)' },
  ], []);

  // ── Data loading ──────────────────────────────────────────────────────────
  const loadData = async () => {
    try {
      setLoading(true);
      const [allIndicators, allPipelines, allHelpdesks] = await Promise.all([
        getIndicators(),
        getPipelines(),
        getHelpdesks(),
      ]);

      setIndicators(allIndicators);
      setPipelines(allPipelines);
      setHelpdesks(allHelpdesks);

      if (allPipelines.length > 0 && !selectedPipelineId) setSelectedPipelineId(allPipelines[0].id);
      if (allHelpdesks.length > 0 && !selectedHelpdeskId) setSelectedHelpdeskId(allHelpdesks[0].id);
    } catch (err) {
      console.error('Error al cargar configuraciones de dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ── Filtered KPI indicators (excluding chart-only ones) ───────────────────
  const filteredIndicators = indicators.filter(ind => {
    if (activeModule === 'commercial') return ind.pipeline_id === selectedPipelineId && !ind.title.startsWith('Gráfico:');
    return ind.helpdesk_id === selectedHelpdeskId && !ind.title.startsWith('Gráfico:');
  });

  // ── Chart stage configuration ─────────────────────────────────────────────
  const [activeChartSetting, setActiveChartSetting] = useState<ChartKey>('abiertas');
  const [chartStageIds, setChartStageIds] = useState<string[]>([]);
  const [savingChart, setSavingChart] = useState(false);

  useEffect(() => {
    setActiveChartSetting(activeModule === 'commercial' ? 'abiertas' : 'tickets');
  }, [activeModule]);

  const activeChartIndicatorName = useMemo(() => {
    const map: Record<ChartKey, string> = {
      abiertas:   'Gráfico: Oportunidades Abiertas',
      ventas:     'Gráfico: Ventas',
      tickets:    'Gráfico: Tickets Abiertos',
      cerrados:   'Gráfico: Tickets Cerrados',
      cancelados: 'Gráfico: Tickets Cancelados',
    };
    return map[activeChartSetting];
  }, [activeChartSetting]);

  const activeChartIndicator = useMemo(() => indicators.find(ind =>
    ind.title === activeChartIndicatorName &&
    (activeModule === 'commercial' ? ind.pipeline_id === selectedPipelineId : ind.helpdesk_id === selectedHelpdeskId)
  ), [indicators, activeChartIndicatorName, activeModule, selectedPipelineId, selectedHelpdeskId]);

  useEffect(() => {
    setChartStageIds(activeChartIndicator?.stage_ids || []);
  }, [activeChartIndicator]);

  const handleSaveChartSetting = async () => {
    try {
      setSavingChart(true);
      const colorMap: Record<ChartKey, string> = {
        abiertas: 'blue', ventas: 'orange', tickets: 'blue', cerrados: 'green', cancelados: 'red',
      };
      const payload: Partial<DashboardIndicator> = {
        title: activeChartIndicatorName,
        type: activeChartSetting === 'ventas' ? 'sum' : 'count',
        color: colorMap[activeChartSetting],
        stage_ids: chartStageIds,
        pipeline_id: activeModule === 'commercial' ? selectedPipelineId : null,
        helpdesk_id: activeModule === 'support' ? selectedHelpdeskId : null,
      };

      if (activeChartIndicator?.id) {
        await updateIndicator(activeChartIndicator.id, payload);
      } else {
        await createIndicator(payload);
      }

      const allIndicators = await getIndicators();
      setIndicators(allIndicators);
      showSuccess('¡Éxito!', 'La configuración del gráfico se ha guardado correctamente.');
    } catch (err) {
      console.error('Error al guardar configuración de gráfico:', err);
      showError('Error', 'No se pudo guardar la configuración del gráfico.');
    } finally {
      setSavingChart(false);
    }
  };

  // ── Active stages ─────────────────────────────────────────────────────────
  const activeStages = useMemo(() => {
    if (activeModule === 'commercial') {
      const pipe = pipelines.find(p => p.id === selectedPipelineId);
      return pipe ? pipe.stages.filter((s: any) => s.blnstatus) : [];
    }
    const hd = helpdesks.find(h => h.id === selectedHelpdeskId);
    return hd ? hd.stages.filter((s: any) => s.blnstatus) : [];
  }, [activeModule, pipelines, helpdesks, selectedPipelineId, selectedHelpdeskId]);

  // ── Modal handlers ────────────────────────────────────────────────────────
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormTitle('');
    setFormType('count');
    setFormColor('blue');
    setFormStageIds([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ind: DashboardIndicator) => {
    setModalMode('edit');
    setEditingId(ind.id!);
    setFormTitle(ind.title);
    setFormType(ind.type);
    setFormColor(ind.color || 'blue');
    setFormStageIds(ind.stage_ids || []);
    setIsModalOpen(true);
  };

  const handleToggleStageCheckbox = (stageId: string) => {
    setFormStageIds(prev => prev.includes(stageId) ? prev.filter(id => id !== stageId) : [...prev, stageId]);
  };

  const handleSaveIndicator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showError('Error', 'Por favor ingresa un título para el indicador.');
      return;
    }

    const payload: Partial<DashboardIndicator> = {
      title: formTitle.trim(),
      type: activeModule === 'commercial' ? formType : 'count',
      color: formColor,
      stage_ids: formStageIds,
      pipeline_id: activeModule === 'commercial' ? selectedPipelineId : null,
      helpdesk_id: activeModule === 'support' ? selectedHelpdeskId : null,
    };

    try {
      if (modalMode === 'create') {
        await createIndicator(payload);
        showSuccess('¡Éxito!', 'El indicador se ha añadido al dashboard.');
      } else {
        await updateIndicator(editingId, payload);
        showSuccess('¡Éxito!', 'El indicador se ha guardado correctamente.');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error al guardar indicador:', err);
      showError('Error', 'No se pudo guardar el indicador.');
    }
  };

  const handleDeleteIndicator = (id: string) => {
    setNotification({
      show: true,
      type: 'confirmation',
      title: '¿Estás seguro?',
      message: 'Este indicador se eliminará de las tarjetas del dashboard. No afectará las oportunidades ni tickets en sí.',
      onConfirm: async () => {
        try {
          hideNotification();
          await deleteIndicator(id);
          showSuccess('¡Eliminado!', 'El indicador ha sido eliminado.');
          loadData();
        } catch (err) {
          console.error('Error al eliminar indicador:', err);
          showError('Error', 'No se pudo eliminar el indicador.');
        }
      },
      onCancel: hideNotification,
    });
  };

  const getStageNames = (stageIds: string[]) => {
    if (!stageIds || stageIds.length === 0) return 'Sin etapas seleccionadas';
    const names = stageIds
      .map(id => activeStages.find((s: any) => s.id === id)?.strname)
      .filter(Boolean);
    return names.length > 0 ? names.join(', ') : 'Sin etapas seleccionadas';
  };

  const currentTabs = activeModule === 'commercial' ? COMMERCIAL_TABS : SUPPORT_TABS;

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) return <Loader />;

  return (
    <SettingsContainer
      title="Métricas e Indicadores de Dashboard"
      description="Configura las tarjetas KPI personalizadas mapeando etapas de Pipelines o Mesas de Ayuda."
      icon={<LayoutDashboard size={18} />}
      rightAction={
        <div className="flex bg-slate-100 p-1 rounded-2xl shrink-0">
          <button
            onClick={() => setActiveModule('commercial')}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
              activeModule === 'commercial'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BarChart3 size={13} />
            <span className="xs:hidden">Pipeline</span>
          </button>
          <button
            onClick={() => setActiveModule('support')}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
              activeModule === 'support'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LifeBuoy size={13} />
            <span className="xs:hidden">Mesa de Ayuda</span>
          </button>
        </div>
      }
    >

      {/* ── Pipeline / Helpdesk selector + Add button ───────────────────── */}
      <div className="p-5 sm:p-6 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <div className="flex-1 min-w-0">
            {activeModule === 'commercial' ? (
              <Select
                label="Pipeline Comercial"
                value={pipelineOptions.find(o => o.value === selectedPipelineId)}
                onChange={(opt: any) => setSelectedPipelineId(opt?.value || '')}
                options={pipelineOptions}
              />
            ) : (
              <Select
                label="Mesa de Ayuda"
                value={helpdeskOptions.find(o => o.value === selectedHelpdeskId)}
                onChange={(opt: any) => setSelectedHelpdeskId(opt?.value || '')}
                options={helpdeskOptions}
              />
            )}
          </div>
          <div className="sm:shrink-0">
            <Button onClick={handleOpenCreateModal} className="w-full sm:w-auto flex items-center justify-center gap-2">
              <Plus size={15} />
              Añadir Indicador KPI
            </Button>
          </div>
        </div>
      </div>

      {/* ── KPI Indicators list ─────────────────────────────────────────── */}
      <div className="p-5 sm:p-6 border-b border-slate-100">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
          Indicadores configurados
        </p>

        {filteredIndicators.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center px-4">
            <AlertCircle size={28} className="text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-600">Sin indicadores aún</p>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              Usa el botón «Añadir Indicador KPI» para crear tarjetas personalizadas que aparecerán en el Dashboard.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredIndicators.map((ind) => {
              const colorOpt = COLOR_OPTIONS.find(c => c.value === ind.color) || COLOR_OPTIONS[0];
              return (
                <div
                  key={ind.id}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 bg-white hover:bg-indigo-50/20 transition-all shadow-sm"
                >
                  {/* Left: info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <span className={`mt-0.5 shrink-0 w-3 h-3 rounded-full ${colorOpt.bg} ring-2 ring-offset-1 ${colorOpt.ring}/30`} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm leading-tight">{ind.title}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 font-bold uppercase rounded-md tracking-wide shrink-0">
                          {ind.type === 'sum' ? '$ Suma' : 'Conteo'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 leading-snug truncate">
                        <span className="font-semibold text-slate-500">Etapas:</span>{' '}
                        {getStageNames(ind.stage_ids)}
                      </p>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => handleOpenEditModal(ind)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                      title="Editar indicador"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteIndicator(ind.id!)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                      title="Eliminar indicador"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Chart Stages Configuration ──────────────────────────────────── */}
      <div className="p-5 sm:p-6">
        {/* Section header */}
        <div className="flex items-start gap-3 mb-5">
          <div className="p-2 bg-indigo-50 rounded-xl shrink-0">
            <BarChart3 className="text-indigo-600" size={16} />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-800">Configuración de Etapas para Gráficos</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Selecciona qué etapas se contabilizan en cada gráfico analítico del dashboard.
            </p>
          </div>
        </div>

        {/* Chart tab selector — wraps naturally on small screens */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-2xl mb-5">
          {currentTabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveChartSetting(tab.key)}
              className={`flex-1 min-w-[80px] py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
                activeChartSetting === tab.key
                  ? tab.activeClass
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active chart info badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Gráfico activo:
          </span>
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
            {activeChartIndicatorName}
          </span>
          {activeChartIndicator && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
              <CheckCircle2 size={10} /> Guardado
            </span>
          )}
        </div>

        {/* Stages checklist */}
        <div className="mb-5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block">
            Etapas incluidas en este gráfico
          </label>

          {activeStages.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-amber-700 font-semibold bg-amber-50 p-3.5 rounded-2xl border border-amber-100">
              <AlertCircle size={15} className="shrink-0" />
              No hay etapas activas en este módulo. Crea etapas primero desde la sección de configuración correspondiente.
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-52 overflow-y-auto">
              {activeStages.map((stage: any) => {
                const isChecked = chartStageIds.includes(stage.id);
                return (
                  <label
                    key={stage.id}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                      isChecked
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => setChartStageIds(prev =>
                        isChecked ? prev.filter(id => id !== stage.id) : [...prev, stage.id]
                      )}
                      className="w-4 h-4 rounded accent-indigo-600 cursor-pointer shrink-0"
                    />
                    <span className="text-xs font-semibold leading-tight">{stage.strname}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Save button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between gap-3 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-400 leading-snug">
            {chartStageIds.length === 0
              ? 'Sin etapas seleccionadas — el gráfico mostrará todos los tickets/oportunidades.'
              : `${chartStageIds.length} etapa${chartStageIds.length !== 1 ? 's' : ''} seleccionada${chartStageIds.length !== 1 ? 's' : ''}.`}
          </p>
          <Button
            type="button"
            onClick={handleSaveChartSetting}
            disabled={savingChart}
            className="shrink-0 w-full sm:w-auto"
          >
            {savingChart ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </div>
      </div>

      {/* ── Create / Edit Modal ─────────────────────────────────────────── */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="max-w-lg" height="h-auto">
        <h3 className="text-base font-extrabold text-slate-800 mb-1 pr-8">
          {modalMode === 'create' ? 'Crear Indicador KPI' : 'Editar Indicador KPI'}
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          {modalMode === 'create'
            ? 'El indicador aparecerá como tarjeta en la parte superior del Dashboard.'
            : 'Modifica el nombre, tipo, color o etapas de este indicador.'}
        </p>

        <form onSubmit={handleSaveIndicator} className="space-y-4">
          {/* Title */}
          <Input
            label="Título del Indicador"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="Ej. Citas Agendadas"
            required
          />

          {/* Type (commercial only) */}
          {activeModule === 'commercial' && (
            <Select
              label="Tipo de Operación"
              value={typeOptions.find(o => o.value === formType)}
              onChange={(opt: any) => setFormType(opt?.value || 'count')}
              options={typeOptions}
            />
          )}

          {/* Color picker */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
              Color de Tarjeta
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormColor(opt.value)}
                  title={opt.label}
                  className={`flex flex-col items-center justify-center gap-1.5 w-14 h-14 rounded-xl border-2 transition-all cursor-pointer ${
                    formColor === opt.value
                      ? `border-slate-800 bg-slate-50`
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full ${opt.bg}`} />
                  <span className="text-[9px] font-bold text-slate-500">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stages checkboxes */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
              Etapas Asociadas
            </label>
            {activeStages.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-amber-700 font-semibold bg-amber-50 p-3 rounded-xl border border-amber-100">
                <AlertCircle size={14} className="shrink-0" />
                Sin etapas activas para este pipeline/mesa.
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto">
                {activeStages.map((stage: any) => {
                  const checked = formStageIds.includes(stage.id);
                  return (
                    <label
                      key={stage.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer select-none transition-all ${
                        checked
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleStageCheckbox(stage.id)}
                        className="w-4 h-4 rounded accent-indigo-600 cursor-pointer shrink-0"
                      />
                      <span className="text-xs font-semibold leading-tight">{stage.strname}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              {modalMode === 'create' ? 'Crear Indicador' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Notification */}
      <Notification {...notification} />
    </SettingsContainer>
  );
};
