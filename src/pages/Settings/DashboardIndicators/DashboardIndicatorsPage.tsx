import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  LifeBuoy,
  Plus,
  RefreshCw,
} from 'lucide-react';

// Servicios API
import {
  getIndicators,
  createIndicator,
  updateIndicator,
  deleteIndicator,
} from '../../../services/reportsService';
import { getPipelines } from '../../../services/pipelinesService';
import { getHelpdesks } from '../../../services/ticketsService';

// Store Global
import { useConfigStore } from '../../../store/useConfigStore';

// Componentes Compartidos del Sistema
import SettingsContainer from '../../../components/shared/SettingsContainer';
import Button from '../../../components/shared/Button';
import Select from '../../../components/shared/Select';
import ConfirmModal from '../../../components/shared/ConfirmModal';
import Notification from '../../../components/shared/Notification';
import Loader from '../../../components/Loader/Loader';

// Subcomponentes Modulares de Indicadores de Dashboard
import { DashboardIndicatorsStatsBanner } from './components/DashboardIndicatorsStatsBanner';
import { DashboardIndicatorsTable } from './components/DashboardIndicatorsTable';
import { DashboardIndicatorModal } from './components/DashboardIndicatorModal';
import { DashboardChartStagesConfig } from './components/DashboardChartStagesConfig';

// Esquemas y Tipos
import type {
  DashboardIndicator,
  DashboardIndicatorFormData,
  DashboardIndicatorFilterState,
  IndicatorModule,
  IndicatorTypeFilter,
  ChartKey,
  NotificationState,
} from './schemas/dashboardIndicators.schema';

// Utilidades y Helpers
import {
  COMMERCIAL_TABS,
  SUPPORT_TABS,
  CHART_NAME_MAP,
  CHART_COLOR_MAP,
  filterDashboardIndicators,
  calculateIndicatorStats,
} from './utils/dashboardIndicators.helpers';

export const DashboardIndicatorsPage: React.FC = () => {
  const { selectedTenant } = useConfigStore();
  const schemaName = selectedTenant?.schema_name;

  // Estados de datos
  const [activeModule, setActiveModule] = useState<IndicatorModule>('commercial');
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [helpdesks, setHelpdesks] = useState<any[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [selectedHelpdeskId, setSelectedHelpdeskId] = useState<string>('');
  const [indicators, setIndicators] = useState<DashboardIndicator[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Filtros de la tabla
  const [filters, setFilters] = useState<DashboardIndicatorFilterState>({
    search: '',
    type: 'all',
    color: 'all',
  });

  // Estados de modal de indicador
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingIndicator, setEditingIndicator] = useState<DashboardIndicator | null>(null);
  const [deletingIndicator, setDeletingIndicator] = useState<DashboardIndicator | null>(null);

  // Estados de configuración de gráficos
  const [activeChartSetting, setActiveChartSetting] = useState<ChartKey>('abiertas');
  const [chartStageIds, setChartStageIds] = useState<string[]>([]);
  const [savingChart, setSavingChart] = useState<boolean>(false);

  // Notificación compartida
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: 'success',
    title: '',
    message: '',
  });

  const hideNotification = () => {
    setNotification((prev) => ({ ...prev, show: false }));
  };

  const notify = (notif: {
    type: 'success' | 'error' | 'warning' | 'confirmation';
    title: string;
    message: string;
    onConfirm?: () => void;
  }) => {
    setNotification({
      show: true,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      onConfirm: notif.onConfirm || hideNotification,
    });
  };

  const safeArray = <T,>(val: any): T[] => {
    if (Array.isArray(val)) return val;
    if (val && Array.isArray(val.data)) return val.data;
    return [];
  };

  // Guard ref para evitar peticiones duplicadas simultáneas (StrictMode o remount)
  const isFetchingRef = useRef<boolean>(false);

  // Carga de datos unificada
  const loadData = useCallback(async (isManual = false) => {
    if (isFetchingRef.current && !isManual) return;
    isFetchingRef.current = true;

    try {
      if (isManual) setLoading(true);
      const [allIndicatorsRes, allPipelinesRes, allHelpdesksRes] = await Promise.all([
        getIndicators().catch(() => []),
        getPipelines().catch(() => []),
        getHelpdesks().catch(() => []),
      ]);

      const allIndicators = safeArray<DashboardIndicator>(allIndicatorsRes);
      const allPipelines = safeArray<any>(allPipelinesRes);
      const allHelpdesks = safeArray<any>(allHelpdesksRes);

      setIndicators(allIndicators);
      setPipelines(allPipelines);
      setHelpdesks(allHelpdesks);

      // Selección predeterminada coherente si aún no hay ID seleccionado o si ya no existe
      setSelectedPipelineId((prev) => {
        if (prev && allPipelines.some((p) => p.id === prev)) return prev;
        return allPipelines.length > 0 ? allPipelines[0].id : '';
      });

      setSelectedHelpdeskId((prev) => {
        if (prev && allHelpdesks.some((h) => h.id === prev)) return prev;
        return allHelpdesks.length > 0 ? allHelpdesks[0].id : '';
      });
    } catch (err) {
      console.error('Error al cargar configuraciones de dashboard:', err);
      notify({
        type: 'error',
        title: 'Error de Conexión',
        message: 'No fue posible sincronizar los indicadores con el servidor.',
      });
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, schemaName]);

  // Sincronizar tab de gráfico predeterminado al cambiar de módulo
  useEffect(() => {
    setActiveChartSetting(activeModule === 'commercial' ? 'abiertas' : 'tickets');
  }, [activeModule]);

  // Opciones de Selectores
  const pipelineOptions = useMemo(
    () => safeArray<any>(pipelines).map((p) => ({ value: p.id, label: p.strname })),
    [pipelines]
  );

  const helpdeskOptions = useMemo(
    () => safeArray<any>(helpdesks).map((h) => ({ value: h.id, label: h.strname })),
    [helpdesks]
  );

  // Etapas activas del módulo y flujo seleccionado
  const activeStages = useMemo(() => {
    if (activeModule === 'commercial') {
      const pipe = safeArray<any>(pipelines).find((p) => p.id === selectedPipelineId);
      return pipe && Array.isArray(pipe.stages) ? pipe.stages.filter((s: any) => s.blnstatus) : [];
    }
    const hd = safeArray<any>(helpdesks).find((h) => h.id === selectedHelpdeskId);
    return hd && Array.isArray(hd.stages) ? hd.stages.filter((s: any) => s.blnstatus) : [];
  }, [activeModule, pipelines, helpdesks, selectedPipelineId, selectedHelpdeskId]);

  // Indicadores KPI del módulo y flujo actual (excluyendo gráficos)
  const currentIndicators = useMemo(() => {
    return safeArray<DashboardIndicator>(indicators).filter((ind) => {
      if (ind.title?.startsWith('Gráfico:')) return false;
      if (activeModule === 'commercial') {
        return ind.pipeline_id === selectedPipelineId;
      }
      return ind.helpdesk_id === selectedHelpdeskId;
    });
  }, [indicators, activeModule, selectedPipelineId, selectedHelpdeskId]);

  // Indicadores filtrados por búsqueda, tipo y color
  const filteredIndicators = useMemo(
    () => filterDashboardIndicators(currentIndicators, filters),
    [currentIndicators, filters]
  );

  // Estadísticas KPI calculadas
  const stats = useMemo(
    () => calculateIndicatorStats(currentIndicators),
    [currentIndicators]
  );

  // Configuración del Gráfico Activo
  const activeChartIndicatorName = useMemo(() => {
    return CHART_NAME_MAP[activeChartSetting];
  }, [activeChartSetting]);

  const activeChartIndicator = useMemo(() => {
    return safeArray<DashboardIndicator>(indicators).find(
      (ind) =>
        ind.title === activeChartIndicatorName &&
        (activeModule === 'commercial'
          ? ind.pipeline_id === selectedPipelineId
          : ind.helpdesk_id === selectedHelpdeskId)
    );
  }, [indicators, activeChartIndicatorName, activeModule, selectedPipelineId, selectedHelpdeskId]);

  useEffect(() => {
    setChartStageIds(activeChartIndicator?.stage_ids || []);
  }, [activeChartIndicator]);

  const handleToggleChartStage = (stageId: string) => {
    setChartStageIds((prev) =>
      prev.includes(stageId) ? prev.filter((id) => id !== stageId) : [...prev, stageId]
    );
  };

  const handleSelectAllChartStages = () => {
    if (chartStageIds.length === activeStages.length) {
      setChartStageIds([]);
    } else {
      setChartStageIds(activeStages.map((s: any) => s.id));
    }
  };

  const handleSaveChartSetting = async () => {
    try {
      setSavingChart(true);
      const payload: Partial<DashboardIndicator> = {
        title: activeChartIndicatorName,
        type: activeChartSetting === 'ventas' ? 'sum' : 'count',
        color: CHART_COLOR_MAP[activeChartSetting],
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
      setIndicators(safeArray<DashboardIndicator>(allIndicators));
      notify({
        type: 'success',
        title: '¡Gráfico Configurado!',
        message: `La regla de etapas para "${activeChartIndicatorName}" se ha guardado correctamente.`,
      });
    } catch (err) {
      console.error('Error al guardar configuración de gráfico:', err);
      notify({
        type: 'error',
        title: 'Error de Guardado',
        message: 'No fue posible guardar la configuración del gráfico.',
      });
    } finally {
      setSavingChart(false);
    }
  };

  // Manejo de Modales de Creación / Edición
  const handleOpenCreate = () => {
    setEditingIndicator(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (ind: DashboardIndicator) => {
    setEditingIndicator(ind);
    setModalOpen(true);
  };

  const handleFormSubmit = async (formData: DashboardIndicatorFormData) => {
    setSubmitting(true);
    try {
      const payload: Partial<DashboardIndicator> = {
        title: formData.title.trim(),
        type: activeModule === 'commercial' ? formData.type : 'count',
        color: formData.color,
        stage_ids: formData.stage_ids || [],
        pipeline_id: activeModule === 'commercial' ? selectedPipelineId : null,
        helpdesk_id: activeModule === 'support' ? selectedHelpdeskId : null,
      };

      if (editingIndicator?.id) {
        await updateIndicator(editingIndicator.id, payload);
        notify({
          type: 'success',
          title: '¡Indicador Actualizado!',
          message: `El indicador KPI "${formData.title}" fue modificado correctamente.`,
        });
      } else {
        await createIndicator(payload);
        notify({
          type: 'success',
          title: '¡Indicador Creado!',
          message: `La tarjeta "${formData.title}" fue añadida y aparecerá en el Dashboard.`,
        });
      }

      setModalOpen(false);
      setEditingIndicator(null);
      await loadData();
    } catch (err: any) {
      console.error('Error al guardar indicador:', err);
      const errorMsg =
        err.response?.data?.message || 'Ocurrió un problema al guardar el indicador.';
      notify({
        type: 'error',
        title: 'Error al Guardar',
        message: Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Manejo de Eliminación
  const handleOpenDelete = (ind: DashboardIndicator) => {
    setDeletingIndicator(ind);
  };

  const handleConfirmDelete = async () => {
    if (!deletingIndicator?.id) return;
    const indToDelete = deletingIndicator;
    setDeletingIndicator(null);

    try {
      setLoading(true);
      await deleteIndicator(indToDelete.id!);
      notify({
        type: 'success',
        title: 'Indicador Eliminado',
        message: `El indicador "${indToDelete.title}" fue eliminado del Dashboard.`,
      });
      await loadData();
    } catch (err: any) {
      console.error('Error al eliminar indicador:', err);
      const errorMsg =
        err.response?.data?.message || 'No se pudo eliminar el indicador seleccionado.';
      notify({
        type: 'error',
        title: 'Error al Eliminar',
        message: Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const currentTabs = activeModule === 'commercial' ? COMMERCIAL_TABS : SUPPORT_TABS;

  if (loading && indicators.length === 0) {
    return <Loader />;
  }

  return (
    <SettingsContainer
      title="Métricas e Indicadores de Dashboard"
      description="Configura las tarjetas KPI personalizadas y define las reglas de etapas operativas que alimentan los gráficos analíticos."
      icon={<LayoutDashboard size={20} />}
      rightAction={
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            onClick={() => loadData(true)}
            className="flex items-center gap-1.5 !px-3 !py-1.5 text-xs text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 rounded-xl"
            title="Sincronizar indicadores con la base de datos"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>

          {/* Switch de Módulo: Pipeline vs Mesa de Ayuda */}
          <div className="flex bg-slate-100 p-1 rounded-2xl shrink-0 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveModule('commercial')}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeModule === 'commercial'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <BarChart3 size={13} />
              <span>Pipeline</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveModule('support')}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeModule === 'support'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LifeBuoy size={13} />
              <span>Mesa de Ayuda</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Selector de Flujo (Pipeline o Mesa) + Botón Crear Indicador */}
        <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <div className="flex-1 min-w-0">
              {activeModule === 'commercial' ? (
                <Select
                  label="Pipeline Comercial a Configurar"
                  value={pipelineOptions.find((o) => o.value === selectedPipelineId)}
                  onChange={(opt: any) => setSelectedPipelineId(opt?.value || '')}
                  options={pipelineOptions}
                />
              ) : (
                <Select
                  label="Mesa de Ayuda a Configurar"
                  value={helpdeskOptions.find((o) => o.value === selectedHelpdeskId)}
                  onChange={(opt: any) => setSelectedHelpdeskId(opt?.value || '')}
                  options={helpdeskOptions}
                />
              )}
            </div>
            <div className="sm:shrink-0">
              <Button
                type="button"
                onClick={handleOpenCreate}
                className="w-full sm:w-auto flex items-center justify-center gap-2 !py-2.5 shadow-xs"
              >
                <Plus size={16} />
                Añadir Indicador KPI
              </Button>
            </div>
          </div>
        </div>

        {/* Banner de Métricas y KPIs */}
        <DashboardIndicatorsStatsBanner stats={stats} />

        {/* Tabla TanStack Table de Indicadores */}
        <DashboardIndicatorsTable
          indicators={filteredIndicators}
          totalCount={currentIndicators.length}
          loading={loading}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
          searchTerm={filters.search}
          setSearchTerm={(search) => setFilters((prev) => ({ ...prev, search }))}
          typeFilter={filters.type}
          setTypeFilter={(type: IndicatorTypeFilter) => setFilters((prev) => ({ ...prev, type }))}
          colorFilter={filters.color}
          setColorFilter={(color) => setFilters((prev) => ({ ...prev, color }))}
          stages={activeStages}
          activeModule={activeModule}
        />

        {/* Configuración Modular de Etapas para Gráficos Analíticos */}
        <DashboardChartStagesConfig
          activeModule={activeModule}
          currentTabs={currentTabs}
          activeChartSetting={activeChartSetting}
          onSelectChartTab={(key) => setActiveChartSetting(key)}
          activeChartIndicatorName={activeChartIndicatorName}
          hasSavedIndicator={Boolean(activeChartIndicator)}
          chartStageIds={chartStageIds}
          onToggleChartStage={handleToggleChartStage}
          onSelectAllChartStages={handleSelectAllChartStages}
          activeStages={activeStages}
          onSaveChartSetting={handleSaveChartSetting}
          savingChart={savingChart}
        />
      </div>

      {/* Modal de Creación / Edición */}
      <DashboardIndicatorModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingIndicator(null);
        }}
        initialData={editingIndicator}
        onSubmit={handleFormSubmit}
        submitting={submitting}
        activeModule={activeModule}
        stages={activeStages}
      />

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmModal
        open={Boolean(deletingIndicator)}
        onClose={() => setDeletingIndicator(null)}
        onConfirm={handleConfirmDelete}
        message={`¿Estás seguro de que deseas eliminar el indicador KPI "${deletingIndicator?.title}"? Se removerá de las tarjetas superiores del Dashboard. Esta acción no afecta las oportunidades ni tickets en sí.`}
        confirmLabel="Eliminar Indicador"
        cancelLabel="Cancelar"
        variant="danger"
      />

      {/* Notificación Flotante Estandarizada */}
      <Notification {...notification} />
    </SettingsContainer>
  );
};

export default DashboardIndicatorsPage;
