import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Building2, Sparkles, RefreshCw, Layers, Smartphone, Users,
  Activity, Clock
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useConfigStore } from '../../../store/useConfigStore';

// Componentes Compartidos del Sistema
import SettingsContainer from '../../../components/shared/SettingsContainer';
import Tabs, { type Tab } from '../../../components/shared/Tabs';
import Button from '../../../components/shared/Button';
import Notification from '../../../components/shared/Notification';
import SkeletonLoader from '../../../components/shared/SkeletonLoader';
import EmptyState from '../../../components/shared/EmptyState';

// Subcomponentes Modulares de Mi Empresa
import { CompanyProfileCard } from './components/CompanyProfileCard';
import { PlanSubscriptionOverview } from './components/PlanSubscriptionOverview';
import { BillingCycleSelector } from './components/BillingCycleSelector';
import { ChannelsConsumptionGrid } from './components/ChannelsConsumptionGrid';
import { TopConsumersGrid } from './components/TopConsumersGrid';
import { DailyTimelineChart } from './components/DailyTimelineChart';
import { InteractionHistoryTable } from './components/InteractionHistoryTable';
import { CourtesyOveragesModal } from './components/CourtesyOveragesModal';

// Esquemas y Tipos
import type {
  ConsumptionBreakdownResponse,
  TenantBillingCycle,
  TenantConsumptionData,
  CourtesyOveragesReportResponse,
  CycleSelectOption,
  NotificationState,
  RecentTransaction,
} from './schemas/myCompany.schema';

// Utilidades puras
import {
  normalizeSearchText,
  formatCycleDate,
  formatDateTime,
  formatFriendlyDate,
  formatShortDate,
  formatNumber,
  getChannelMeta,
  getActionDisplay,
  isSameDay,
} from './utils/myCompany.helpers';
import {
  exportInteractionHistoryToExcel,
  exportInteractionHistoryToPDF,
} from './utils/exportHistory.utils';
import {
  exportCourtesyReportToExcel,
  exportCourtesyReportToPDF,
} from './utils/exportCourtesy.utils';

// Servicios API
import {
  getConsumptionBreakdown,
  getBillingCycles,
  updateAllowExtra,
  getCourtesyOveragesReport,
} from '../../../services/tenantsService';
import type { SearchBadge } from '../../../components/shared/UnifiedSearchBar';

const DEFAULT_ACTIVE_OPTION: CycleSelectOption = {
  value: 'active',
  label: 'Período en curso (Activo)',
  isCustom: false,
  status: 'active',
};

export const MyCompanyPage: React.FC = () => {
  const { isAdmin, isSuperAdmin } = useAuth();
  const { selectedTenant, setSelectedTenant } = useConfigStore();

  const tenantId = selectedTenant?.id;
  const tenantSchema = selectedTenant?.schema_name;

  // Índice de sub-pestaña activa (Tabs compartidas)
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);

  // Estados de consumo y desglose analítico
  const [breakdown, setBreakdown] = useState<ConsumptionBreakdownResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingExtra, setTogglingExtra] = useState<boolean>(false);

  // Estados de Ciclos de Facturación e Histórico
  const [billingCycles, setBillingCycles] = useState<TenantBillingCycle[]>([]);
  const [loadingCycles, setLoadingCycles] = useState<boolean>(false);
  const [selectedCycleOption, setSelectedCycleOption] = useState<CycleSelectOption>(DEFAULT_ACTIVE_OPTION);
  const [selectedPeriodMode, setSelectedPeriodMode] = useState<'active' | 'previous' | 'cycle' | 'custom'>('active');

  // Filtros aplicados al backend vs borrador del selector de fechas
  const [appliedStartDate, setAppliedStartDate] = useState<string>('');
  const [appliedEndDate, setAppliedEndDate] = useState<string>('');
  const [draftStartDate, setDraftStartDate] = useState<string>('');
  const [draftEndDate, setDraftEndDate] = useState<string>('');
  const [showCustomRangePicker, setShowCustomRangePicker] = useState<boolean>(false);
  const [showPeriodFilters, setShowPeriodFilters] = useState<boolean>(false);

  // Filtros del Historial de Interacciones
  const [transactionSearch, setTransactionSearch] = useState<string>('');
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'plan' | 'extra'>('all');

  // Filtro interactivo por día seleccionado desde la Actividad Diaria
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);

  // ── Guards y referencias para evitar duplicidad de peticiones y bloqueos de red ──
  const isFetchingCyclesRef = useRef<boolean>(false);
  const lastFetchedCyclesTenantRef = useRef<string | null>(null);
  const billingCyclesRef = useRef<TenantBillingCycle[]>([]);

  const isFetchingBreakdownRef = useRef<boolean>(false);
  const lastFetchedBreakdownKeyRef = useRef<string | null>(null);
  const hasFetchedBreakdownRef = useRef<boolean>(false);

  // Mantener sincronizado el ref de ciclos para consumo sin re-renders en cadena
  useEffect(() => {
    billingCyclesRef.current = billingCycles;
  }, [billingCycles]);

  const handleToggleDateFilter = useCallback((date: string) => {
    setSelectedDateFilter(prev => (prev === date ? null : date));
  }, []);

  const handleClearDateFilter = useCallback(() => {
    setSelectedDateFilter(null);
  }, []);

  // Reporte Global de Cortesías (SuperAdmin Modal)
  const [showCourtesyModal, setShowCourtesyModal] = useState<boolean>(false);
  const [courtesyReport, setCourtesyReport] = useState<CourtesyOveragesReportResponse | null>(null);
  const [loadingCourtesyReport, setLoadingCourtesyReport] = useState<boolean>(false);

  // Notificación compartida
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: 'success',
    title: '',
    message: '',
  });

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  const notify = (notif: { type: 'success' | 'error' | 'warning' | 'confirmation'; title: string; message: string }) => {
    setNotification({
      show: true,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      onConfirm: hideNotification,
    });
  };

  // ── 1. Carga de Ciclos de Facturación (Estrictamente una sola vez por tenant) ──
  const fetchBillingCycles = useCallback(async (forced = false) => {
    if (!tenantSchema) return;

    // Guard 1: Evitar llamadas concurrentes en vuelo
    if (isFetchingCyclesRef.current) {
      return;
    }

    // Guard 2: Si ya cargamos para este tenant y no es un refresco forzado, evitar llamada duplicada
    if (!forced && lastFetchedCyclesTenantRef.current === tenantSchema) {
      return;
    }

    isFetchingCyclesRef.current = true;
    lastFetchedCyclesTenantRef.current = tenantSchema;
    setLoadingCycles(true);

    try {
      const cycles = await getBillingCycles({
        tenantId,
        schemaName: tenantSchema,
      });
      const resolvedCycles = cycles || [];
      setBillingCycles(resolvedCycles);
      billingCyclesRef.current = resolvedCycles;
    } catch (err) {
      console.warn('No se pudieron obtener ciclos de facturación:', err);
      // Permitir reintentar en caso de fallo
      lastFetchedCyclesTenantRef.current = null;
    } finally {
      isFetchingCyclesRef.current = false;
      setLoadingCycles(false);
    }
  }, [tenantId, tenantSchema]);

  // ── 2. Carga del Desglose de Consumo (Con filtros de período y guard anti-duplicados) ──
  const fetchConsumptionData = useCallback(async (isManualRefresh = false) => {
    if (!tenantSchema) {
      setLoading(false);
      return;
    }

    const cycleIdParam = selectedPeriodMode === 'cycle'
      ? selectedCycleOption.cycleId
      : selectedPeriodMode === 'previous'
        ? (selectedCycleOption.cycleId || billingCyclesRef.current.find(c => c.status === 'closed' || c.status === 'superseded')?.id)
        : undefined;

    const queryKey = `${tenantSchema}|${selectedPeriodMode}|${cycleIdParam ?? ''}|${appliedStartDate}|${appliedEndDate}`;

    // Guard 1: Evitar llamadas idénticas concurrentes en vuelo
    if (isFetchingBreakdownRef.current && lastFetchedBreakdownKeyRef.current === queryKey) {
      return;
    }

    // Guard 2: Si no es manual y ya tenemos datos para esta query exacta, omitir duplicado
    if (!isManualRefresh && lastFetchedBreakdownKeyRef.current === queryKey && hasFetchedBreakdownRef.current) {
      return;
    }

    isFetchingBreakdownRef.current = true;
    lastFetchedBreakdownKeyRef.current = queryKey;

    if (isManualRefresh) {
      setLoading(true);
    }
    setError(null);

    try {
      const params: {
        tenantId?: number;
        schemaName?: string;
        startDate?: string;
        endDate?: string;
        cycleId?: number;
      } = {
        schemaName: tenantSchema,
      };
      if (tenantId) params.tenantId = tenantId;

      if (selectedPeriodMode === 'custom' && appliedStartDate && appliedEndDate) {
        params.startDate = appliedStartDate;
        params.endDate = appliedEndDate;
      } else if (selectedPeriodMode === 'cycle' && selectedCycleOption.cycleId) {
        params.cycleId = selectedCycleOption.cycleId;
      } else if (selectedPeriodMode === 'previous') {
        if (cycleIdParam) {
          params.cycleId = cycleIdParam;
        } else if (appliedStartDate && appliedEndDate) {
          params.startDate = appliedStartDate;
          params.endDate = appliedEndDate;
        }
      }

      const data = await getConsumptionBreakdown(params, isManualRefresh);
      hasFetchedBreakdownRef.current = true;
      setBreakdown(data);
    } catch (err: any) {
      console.error('Error al cargar desglose de consumo:', err);
      setError(err?.response?.data?.message || 'No se pudo cargar la información de consumo de la empresa.');
      lastFetchedBreakdownKeyRef.current = null;
    } finally {
      isFetchingBreakdownRef.current = false;
      setLoading(false);
    }
  }, [
    tenantId,
    tenantSchema,
    selectedPeriodMode,
    selectedCycleOption.cycleId,
    appliedStartDate,
    appliedEndDate,
  ]);

  // ── 3. Coordinación de ciclo de vida: Inicialización y cambio de Tenant ──
  useEffect(() => {
    if (!tenantSchema) {
      setLoading(false);
      return;
    }

    // Resetear estados de período cuando cambia el tenant seleccionado
    setSelectedPeriodMode('active');
    setSelectedCycleOption(DEFAULT_ACTIVE_OPTION);
    setAppliedStartDate('');
    setAppliedEndDate('');
    setDraftStartDate('');
    setDraftEndDate('');
    setShowCustomRangePicker(false);
    setSelectedDateFilter(null);

    // Cargar ciclos estrictamente una sola vez por tenant
    fetchBillingCycles();
  }, [tenantSchema, fetchBillingCycles]);

  // Limpiar filtro de día específico al cambiar de modo de período o rango de fechas
  useEffect(() => {
    setSelectedDateFilter(null);
  }, [selectedPeriodMode, selectedCycleOption.cycleId, appliedStartDate, appliedEndDate]);

  // ── 4. Carga reactiva de consumo al cambiar parámetros de consulta ──
  useEffect(() => {
    fetchConsumptionData();
  }, [fetchConsumptionData]);

  // ── 5. Refresco manual unificado (sin caché, datos en fresco) ──
  const handleManualRefresh = useCallback(async () => {
    await Promise.all([
      fetchBillingCycles(true),
      fetchConsumptionData(true),
    ]);
  }, [fetchBillingCycles, fetchConsumptionData]);

  // Ciclo anterior inmediato para acceso rápido
  const previousCycle = useMemo(() => {
    if (!billingCycles.length) return null;
    return billingCycles.find(c => c.status === 'closed' || c.status === 'superseded') || null;
  }, [billingCycles]);

  // Otros ciclos históricos
  const otherHistoricalCycles = useMemo(() => {
    if (!billingCycles.length) return [];
    return billingCycles.filter(c => c.status !== 'active' && c.id !== previousCycle?.id);
  }, [billingCycles, previousCycle]);

  // Indica si la consulta actual corresponde a un período histórico
  const isHistorical = useMemo(() => {
    return selectedPeriodMode !== 'active' || Boolean(selectedCycleOption.cycleId);
  }, [selectedPeriodMode, selectedCycleOption.cycleId]);

  // ── Handlers de Selección de Período ──
  const handleSelectActivePeriod = () => {
    setSelectedPeriodMode('active');
    setSelectedCycleOption(DEFAULT_ACTIVE_OPTION);
    setAppliedStartDate('');
    setAppliedEndDate('');
    setDraftStartDate('');
    setDraftEndDate('');
    setShowCustomRangePicker(false);
    setShowPeriodFilters(false);
  };

  const handleSelectPreviousPeriod = () => {
    if (previousCycle) {
      setSelectedPeriodMode('previous');
      setSelectedCycleOption({
        value: `cycle-${previousCycle.id}`,
        label: `Ciclo anterior: ${formatCycleDate(previousCycle.start_date)} - ${formatCycleDate(previousCycle.closed_at || previousCycle.end_date)}`,
        cycleId: previousCycle.id,
        status: previousCycle.status,
        cycle: previousCycle,
      });
      setAppliedStartDate('');
      setAppliedEndDate('');
    } else {
      const now = new Date();
      const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const startStr = firstDayPrevMonth.toISOString().slice(0, 10);
      const endStr = lastDayPrevMonth.toISOString().slice(0, 10);

      setSelectedPeriodMode('previous');
      setSelectedCycleOption({
        value: 'previous-calendar-month',
        label: `Mes anterior (${formatCycleDate(startStr)} - ${formatCycleDate(endStr)})`,
        isCustom: true,
      });
      setAppliedStartDate(startStr);
      setAppliedEndDate(endStr);
    }
    setShowCustomRangePicker(false);
    setShowPeriodFilters(false);
  };

  const handleSelectSpecificCycle = (cycle: TenantBillingCycle) => {
    setSelectedPeriodMode('cycle');
    setSelectedCycleOption({
      value: `cycle-${cycle.id}`,
      label: `Ciclo: ${formatCycleDate(cycle.start_date)} - ${formatCycleDate(cycle.closed_at || cycle.end_date)}`,
      cycleId: cycle.id,
      status: cycle.status,
      cycle,
    });
    setAppliedStartDate('');
    setAppliedEndDate('');
    setShowCustomRangePicker(false);
    setShowPeriodFilters(false);
  };

  const handleToggleCustomRangeMode = () => {
    setShowCustomRangePicker(prev => !prev);
    if (!draftStartDate) {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setDraftStartDate(thirtyDaysAgo.toISOString().slice(0, 10));
      setDraftEndDate(now.toISOString().slice(0, 10));
    }
  };

  const handleApplyCustomRange = () => {
    if (!draftStartDate || !draftEndDate) return;
    if (new Date(draftStartDate) > new Date(draftEndDate)) {
      notify({
        type: 'warning',
        title: 'Rango no válido',
        message: 'La fecha inicial no puede ser posterior a la fecha final.',
      });
      return;
    }
    setAppliedStartDate(draftStartDate);
    setAppliedEndDate(draftEndDate);
    setSelectedPeriodMode('custom');
    setSelectedCycleOption({
      value: `custom-${draftStartDate}-${draftEndDate}`,
      label: `Rango: ${formatCycleDate(draftStartDate)} - ${formatCycleDate(draftEndDate)}`,
      isCustom: true,
    });
    setShowPeriodFilters(false);
  };

  // SearchBadges interactivos para UnifiedSearchBar
  const periodBadges = useMemo<SearchBadge[]>(() => {
    if (selectedPeriodMode === 'active') return [];

    let label = 'Histórico';
    if (selectedPeriodMode === 'previous') {
      label = previousCycle
        ? `Anterior: ${formatCycleDate(previousCycle.start_date)}`
        : 'Mes Anterior';
    } else if (selectedPeriodMode === 'cycle' && selectedCycleOption.cycle) {
      label = `Ciclo: ${formatCycleDate(selectedCycleOption.cycle.start_date)}`;
    } else if (selectedPeriodMode === 'custom' && appliedStartDate && appliedEndDate) {
      label = `${formatCycleDate(appliedStartDate)} - ${formatCycleDate(appliedEndDate)}`;
    }

    return [
      {
        id: 'active-period-badge',
        label,
        type: 'status',
        icon: <Clock size={12} className="text-purple-600" />,
        onRemove: handleSelectActivePeriod,
      },
    ];
  }, [selectedPeriodMode, previousCycle, selectedCycleOption, appliedStartDate, appliedEndDate]);

  // ── Conmutar Consumo Adicional (allow_extra) ──
  const handleToggleAllowExtra = async () => {
    const targetTenantId = breakdown?.summary?.tenant_id || selectedTenant?.id;
    if (!targetTenantId) return;

    if (isHistorical) {
      notify({
        type: 'warning',
        title: 'Operación no permitida',
        message: 'La tolerancia de consumo adicional solo puede modificarse en el ciclo de facturación activo.',
      });
      return;
    }

    const currentAllowExtra = Boolean(breakdown?.summary?.allow_extra);
    const newValue = !currentAllowExtra;

    setTogglingExtra(true);
    try {
      await updateAllowExtra(targetTenantId, newValue);

      setBreakdown((prev: ConsumptionBreakdownResponse | null) => {
        if (!prev) return null;
        return {
          ...prev,
          summary: {
            ...prev.summary,
            allow_extra: newValue,
          },
        };
      });

      if (selectedTenant && selectedTenant.id === targetTenantId) {
        setSelectedTenant({
          ...selectedTenant,
          allow_extra: newValue,
        });
      }

      notify({
        type: 'success',
        title: newValue ? 'Margen Adicional Habilitado' : 'Margen Adicional Deshabilitado',
        message: newValue
          ? 'El Asistente continuará respondiendo mediante consumo adicional con un tope estricto del 100% al agotarse la cuota base.'
          : 'Las consultas al Asistente se suspenderán automáticamente al agotarse la cuota base para prevenir cobros adicionales.',
      });
    } catch (err: any) {
      console.error('Error al actualizar allow_extra:', err);
      notify({
        type: 'error',
        title: 'Error de Configuración',
        message: err?.response?.data?.message || 'No se pudo actualizar el estado de consumo adicional.',
      });
    } finally {
      setTogglingExtra(false);
    }
  };

  // ── Modal de Reporte Consolidado de Cortesías (SuperAdmin) ──
  const handleOpenCourtesyModal = async () => {
    setShowCourtesyModal(true);
    setLoadingCourtesyReport(true);
    try {
      const data = await getCourtesyOveragesReport();
      setCourtesyReport(data);
    } catch (err) {
      console.error('Error al cargar reporte consolidado de cortesías:', err);
      notify({
        type: 'error',
        title: 'Error de Carga',
        message: 'No se pudo obtener el reporte consolidado de cortesías técnicas.',
      });
    } finally {
      setLoadingCourtesyReport(false);
    }
  };

  // ── Transacciones filtradas por día, tipo de cuota y texto ──
  const filteredTransactions = useMemo<RecentTransaction[]>(() => {
    if (!breakdown?.recent_transactions?.length) return [];
    return breakdown.recent_transactions.filter((t: RecentTransaction) => {
      // 1. Filtro interactivo por día específico (desde Actividad Diaria)
      if (selectedDateFilter && !isSameDay(t.fecha_procesamiento, selectedDateFilter)) {
        return false;
      }

      // 2. Filtro por tipo de cuota
      if (transactionFilter === 'plan' && t.is_extra) return false;
      if (transactionFilter === 'extra' && !t.is_extra) return false;

      // Si no hay término de búsqueda, mostrar según los filtros de día y cuota
      if (!transactionSearch.trim()) return true;

      const cleanQuery = normalizeSearchText(transactionSearch);
      if (!cleanQuery) return true;
      const queryWords = cleanQuery.split(/\s+/).filter(Boolean);

      // 1. FECHA: formateada (con hora), amigable, componentes numéricos e ISO crudo
      let dateVariations = '';
      if (t.fecha_procesamiento) {
        const formattedFull = formatDateTime(t.fecha_procesamiento);
        const formattedFriendly = formatFriendlyDate(t.fecha_procesamiento);
        const formattedShort = formatShortDate(t.fecha_procesamiento);
        const d = new Date(t.fecha_procesamiento);
        let numericFormats = '';
        if (!isNaN(d.getTime())) {
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = String(d.getFullYear());
          const hours = String(d.getHours()).padStart(2, '0');
          const minutes = String(d.getMinutes()).padStart(2, '0');
          const seconds = String(d.getSeconds()).padStart(2, '0');
          numericFormats = `${day}/${month}/${year} ${day}-${month}-${year} ${day}/${month} ${year}-${month}-${day} ${hours}:${minutes} ${hours}:${minutes}:${seconds}`;
        }
        dateVariations = `${t.fecha_procesamiento} ${formattedFull} ${formattedFriendly} ${formattedShort} ${numericFormats}`;
      }

      // 2. CANAL: identificador crudo, etiqueta visual de negocio y sinónimos
      const channelMeta = getChannelMeta(t.channel);
      let channelTerms = `${t.channel || ''} ${channelMeta.label}`;
      const chLower = (t.channel || '').toLowerCase();
      if (chLower.includes('webchat')) channelTerms += ' webchat crm chat interno';
      if (chLower.includes('rag')) channelTerms += ' base de conocimiento rag kb documentos';
      if (chLower.includes('whatsapp')) channelTerms += ' whatsapp wa';

      // 3. ORIGEN / CONTACTO: usuario de equipo, cliente, base de conocimiento y ref conversación
      let originTerms = '';
      if (t.user_name) {
        originTerms += `equipo: ${t.user_name} equipo ${t.user_name} `;
      }
      if (t.client_name) {
        originTerms += `cliente: ${t.client_name} cliente ${t.client_name} `;
      }
      if (!t.user_name && !t.client_name) {
        originTerms += 'base de conocimiento sistema ';
      }
      if (t.conversation_id) {
        originTerms += `ref: ${t.conversation_id} ref ${t.conversation_id} `;
      }

      // 4. ACCIÓN REALIZADA: acción cruda, etiqueta visual de negocio y sinónimos
      const actionDisplay = getActionDisplay(t.accion);
      const actionTerms = `${t.accion || ''} ${actionDisplay.label} ${String(t.accion || '').replace(/_/g, ' ')}`;

      // 5. TIPO DE CUOTA Y METADATOS
      const quotaTerms = t.is_extra ? 'consumo extra extra' : 'cuota del plan plan base plan';
      const modelTerms = t.model_name || '';
      const tokenTerms = `${t.total_tokens || ''} ${formatNumber(t.total_tokens)}`;

      // Corpus consolidado normalizado
      const fullSearchableCorpus = normalizeSearchText(
        `${dateVariations} ${channelTerms} ${originTerms} ${actionTerms} ${quotaTerms} ${modelTerms} ${tokenTerms}`
      );

      // Verificación multi-palabra: todas las palabras del query deben coincidir
      return queryWords.every(word => fullSearchableCorpus.includes(word));
    });
  }, [breakdown?.recent_transactions, selectedDateFilter, transactionSearch, transactionFilter]);

  // Etiqueta legible de período para reportes
  const periodExportLabel = useMemo(() => {
    let base = 'Período en curso (Activo)';
    if (selectedPeriodMode === 'previous' && previousCycle) {
      base = `Ciclo Anterior (${formatCycleDate(previousCycle.start_date)} - ${formatCycleDate(previousCycle.end_date)})`;
    } else if (selectedPeriodMode === 'cycle' && selectedCycleOption.cycle) {
      base = `Ciclo: ${formatCycleDate(selectedCycleOption.cycle.start_date)} - ${formatCycleDate(selectedCycleOption.cycle.end_date)}`;
    } else if (selectedPeriodMode === 'custom') {
      base = `Rango Personalizado (${appliedStartDate || 'Inicio'} a ${appliedEndDate || 'Fin'})`;
    }
    if (selectedDateFilter) {
      base += ` - Filtro por día: ${formatShortDate(selectedDateFilter)}`;
    }
    return base;
  }, [selectedPeriodMode, previousCycle, selectedCycleOption, appliedStartDate, appliedEndDate, selectedDateFilter]);

  // Handlers de Exportación del Historial
  const handleExportHistoryExcel = () => {
    if (!filteredTransactions.length) {
      notify({
        type: 'warning',
        title: 'Sin datos para exportar',
        message: 'No existen registros en el historial para los filtros de búsqueda aplicados.',
      });
      return;
    }
    exportInteractionHistoryToExcel({
      transactions: filteredTransactions,
      orgName: selectedTenant?.name || breakdown?.summary?.tenant_name || 'Organización',
      schemaName: selectedTenant?.schema_name || breakdown?.schema_name || 'public',
      planName: breakdown?.summary?.plan_name || 'Plan Estándar',
      periodLabel: periodExportLabel,
      transactionFilter,
      transactionSearch,
    });
  };

  const handleExportHistoryPDF = () => {
    if (!filteredTransactions.length) {
      notify({
        type: 'warning',
        title: 'Sin datos para exportar',
        message: 'No existen registros en el historial para los filtros de búsqueda aplicados.',
      });
      return;
    }
    exportInteractionHistoryToPDF({
      transactions: filteredTransactions,
      orgName: selectedTenant?.name || breakdown?.summary?.tenant_name || 'Organización',
      schemaName: selectedTenant?.schema_name || breakdown?.schema_name || 'public',
      planName: breakdown?.summary?.plan_name || 'Plan Estándar',
      periodLabel: periodExportLabel,
      transactionFilter,
      transactionSearch,
    });
  };

  // Datos consolidados de consumo
  const consumption: TenantConsumptionData | null = breakdown?.summary ?? null;

  // ── Definición de Sub-pestañas mediante Tabs compartidas ──
  const subTabs: Tab[] = useMemo(() => [
    {
      label: 'Perfil & Datos Generales',
      icon: <Building2 size={15} />,
      content: (
        <CompanyProfileCard
          consumption={consumption}
          onLogoUpdated={(newLogo) => {
            setBreakdown((prev: ConsumptionBreakdownResponse | null) => {
              if (!prev) return null;
              return {
                ...prev,
                summary: {
                  ...prev.summary,
                  logo: newLogo,
                },
              };
            });
          }}
          onNotify={notify}
        />
      ),
    },
    {
      label: 'Plan & Suscripción',
      icon: <Layers size={15} />,
      content: (
        <PlanSubscriptionOverview
          consumption={consumption}
          isSuperAdmin={isSuperAdmin}
          isHistorical={isHistorical}
          togglingExtra={togglingExtra}
          onToggleExtra={handleToggleAllowExtra}
        />
      ),
    },
    {
      label: `Canales de Atención${(breakdown?.by_channel?.length || 0) > 0 ? ` (${breakdown?.by_channel?.length})` : ''}`,
      icon: <Smartphone size={15} />,
      content: <ChannelsConsumptionGrid channels={breakdown?.by_channel} />,
    },
    {
      label: `Top Usuarios y Clientes${((breakdown?.top_users?.length || 0) + (breakdown?.top_clients?.length || 0)) > 0 ? ` (${(breakdown?.top_users?.length || 0) + (breakdown?.top_clients?.length || 0)})` : ''}`,
      icon: <Users size={15} />,
      content: (
        <TopConsumersGrid
          topUsers={breakdown?.top_users}
          topClients={breakdown?.top_clients}
        />
      ),
    },
    {
      label: `Tendencia & Historial${(breakdown?.recent_transactions?.length || 0) > 0 ? ` (${filteredTransactions.length})` : ''}`,
      icon: <Activity size={15} />,
      content: (
        <div className="space-y-6">
          <DailyTimelineChart
            dailyTimeline={breakdown?.daily_timeline}
            selectedDate={selectedDateFilter}
            onSelectDate={handleToggleDateFilter}
            onClearDateFilter={handleClearDateFilter}
          />
          <InteractionHistoryTable
            transactions={filteredTransactions}
            transactionSearch={transactionSearch}
            setTransactionSearch={setTransactionSearch}
            transactionFilter={transactionFilter}
            setTransactionFilter={setTransactionFilter}
            selectedDateFilter={selectedDateFilter}
            onClearDateFilter={handleClearDateFilter}
            onExportExcel={handleExportHistoryExcel}
            onExportPDF={handleExportHistoryPDF}
          />
        </div>
      ),
    },
  ], [
    consumption,
    isSuperAdmin,
    isHistorical,
    togglingExtra,
    breakdown,
    filteredTransactions,
    transactionSearch,
    transactionFilter,
    selectedDateFilter,
    handleToggleDateFilter,
    handleClearDateFilter,
    periodExportLabel,
  ]);

  // Si no es admin ni superadmin
  if (!isAdmin && !isSuperAdmin) {
    return (
      <div className="p-8 text-center text-rose-600 font-semibold bg-rose-50 rounded-2xl border border-rose-200">
        Acceso Restringido. Esta sección está reservada exclusivamente para administradores.
      </div>
    );
  }

  return (
    <SettingsContainer
      title={consumption?.tenant_name || selectedTenant?.name || 'Mi Empresa'}
      description="Consulte el estado general de su organización, administre la identidad gráfica oficial, supervise la suscripción contratada y audite el consumo de recursos de Inteligencia Artificial."
      icon={<Building2 size={20} />}
      rightAction={
        <div className="flex flex-wrap items-center gap-2">
          {isSuperAdmin && (
            <Button
              variant="indigo"
              onClick={handleOpenCourtesyModal}
              className="!py-2 !px-3.5 !text-xs !normal-case !tracking-normal gap-1.5 shadow-sm"
              title="Consultar reporte de cortesías técnicas asumidas por la plataforma"
            >
              <Sparkles size={14} />
              <span>Reporte Global de Cortesías</span>
            </Button>
          )}

          <Button
            variant="secondary"
            onClick={handleManualRefresh}
            disabled={loading}
            title="Actualizar datos de la empresa y consumo"
            className="!py-2 !px-3 !text-xs !normal-case !tracking-normal gap-1.5 shadow-xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-600' : 'text-slate-600'} />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6 pt-2">
        {/* MENSAJE CUANDO NO HAY ORGANIZACIÓN SELECCIONADA */}
        {!selectedTenant && !loading && (
          <EmptyState
            icon={<Building2 className="w-8 h-8 text-slate-400" />}
            title="Sin Organización Seleccionada"
            message="Seleccione una organización en la barra de navegación superior para visualizar su perfil, recursos y cuotas."
            className="bg-slate-50/70 border border-slate-200 rounded-2xl my-4"
          />
        )}

        {/* ALERTA DE ERROR */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-700">
            <span>{error}</span>
            <Button
              variant="ghost-danger"
              onClick={handleManualRefresh}
              className="!text-xs font-bold"
            >
              Reintentar
            </Button>
          </div>
        )}

        {/* SKELETON LOADER AL CARGAR */}
        {loading && !breakdown && (
          <div className="space-y-6">
            <SkeletonLoader variant="card" count={2} />
            <SkeletonLoader variant="line" count={4} />
          </div>
        )}

        {/* CONTENIDO PRINCIPAL CUANDO HAY DATOS */}
        {selectedTenant && breakdown && (
          <div className="space-y-6">
            {/* SELECTOR DE PERÍODOS DE FACTURACIÓN Y BÚSQUEDA UNIFICADA */}
            <BillingCycleSelector
              consumption={consumption}
              billingCycles={billingCycles}
              loadingCycles={loadingCycles}
              selectedPeriodMode={selectedPeriodMode}
              selectedCycleOption={selectedCycleOption}
              previousCycle={previousCycle}
              otherHistoricalCycles={otherHistoricalCycles}
              isHistorical={isHistorical}
              showPeriodFilters={showPeriodFilters}
              setShowPeriodFilters={setShowPeriodFilters}
              showCustomRangePicker={showCustomRangePicker}
              draftStartDate={draftStartDate}
              setDraftStartDate={setDraftStartDate}
              draftEndDate={draftEndDate}
              setDraftEndDate={setDraftEndDate}
              appliedStartDate={appliedStartDate}
              appliedEndDate={appliedEndDate}
              periodBadges={periodBadges}
              transactionSearch={transactionSearch}
              setTransactionSearch={setTransactionSearch}
              loading={loading}
              onSelectActivePeriod={handleSelectActivePeriod}
              onSelectPreviousPeriod={handleSelectPreviousPeriod}
              onSelectSpecificCycle={handleSelectSpecificCycle}
              onToggleCustomRangeMode={handleToggleCustomRangeMode}
              onApplyCustomRange={handleApplyCustomRange}
            />

            {/* SUB-PESTAÑAS DE NAVEGACIÓN MEDIANTE EL COMPONENTE COMPARTIDO Tabs */}
            <Tabs
              tabs={subTabs}
              activeIndex={activeTabIndex}
              onTabChange={(index: number) => setActiveTabIndex(index)}
            />
          </div>
        )}
      </div>

      {/* MODAL COMPARTIDO: REPORTE CONSOLIDADO DE CORTESÍAS (SUPERADMIN) */}
      <CourtesyOveragesModal
        open={showCourtesyModal}
        onClose={() => setShowCourtesyModal(false)}
        report={courtesyReport}
        loading={loadingCourtesyReport}
        onReload={handleOpenCourtesyModal}
        onExportExcel={() => courtesyReport && exportCourtesyReportToExcel(courtesyReport)}
        onExportPDF={() => courtesyReport && exportCourtesyReportToPDF(courtesyReport)}
        onInspectTenant={(tenant) => {
          setSelectedTenant({
            id: tenant.id,
            name: tenant.name,
            schema_name: tenant.schema_name,
            allow_extra: tenant.allow_extra,
          });
          setShowCourtesyModal(false);
        }}
      />

      {/* NOTIFICACIÓN COMPARTIDA */}
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onConfirm={notification.onConfirm || hideNotification}
        onCancel={notification.onCancel || hideNotification}
      />
    </SettingsContainer>
  );
};

export default MyCompanyPage;
