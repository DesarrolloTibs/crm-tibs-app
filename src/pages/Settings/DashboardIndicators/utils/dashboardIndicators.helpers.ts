import type {
  DashboardIndicator,
  DashboardIndicatorFormData,
  DashboardIndicatorFilterState,
  DashboardIndicatorStats,
  ChartKey,
  ChartTab,
} from '../schemas/dashboardIndicators.schema';
import { dashboardIndicatorValidationSchema } from '../schemas/dashboardIndicators.schema';

export interface ColorOptionMeta {
  value: string;
  label: string;
  bg: string;
  ring: string;
  border: string;
  text: string;
  badgeBg: string;
  badgeText: string;
}

export const COLOR_OPTIONS: ColorOptionMeta[] = [
  {
    value: 'blue',
    label: 'Azul',
    bg: 'bg-blue-500',
    ring: 'ring-blue-400',
    border: 'border-blue-200',
    text: 'text-blue-600',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
  },
  {
    value: 'green',
    label: 'Verde',
    bg: 'bg-emerald-500',
    ring: 'ring-emerald-400',
    border: 'border-emerald-200',
    text: 'text-emerald-600',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
  },
  {
    value: 'purple',
    label: 'Morado',
    bg: 'bg-violet-500',
    ring: 'ring-violet-400',
    border: 'border-violet-200',
    text: 'text-violet-600',
    badgeBg: 'bg-violet-50',
    badgeText: 'text-violet-700',
  },
  {
    value: 'orange',
    label: 'Naranja',
    bg: 'bg-amber-500',
    ring: 'ring-amber-400',
    border: 'border-amber-200',
    text: 'text-amber-600',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
  },
  {
    value: 'red',
    label: 'Rojo',
    bg: 'bg-rose-500',
    ring: 'ring-rose-400',
    border: 'border-rose-200',
    text: 'text-rose-600',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
  },
];

export const COMMERCIAL_TABS: ChartTab[] = [
  { key: 'abiertas', label: 'Oportunidades Abiertas', activeClass: 'bg-white text-indigo-600 shadow-xs' },
  { key: 'ventas',   label: 'Ventas',                 activeClass: 'bg-white text-amber-600 shadow-xs' },
];

export const SUPPORT_TABS: ChartTab[] = [
  { key: 'tickets',    label: 'Tickets Abiertos', activeClass: 'bg-white text-indigo-600 shadow-xs' },
  { key: 'cerrados',   label: 'Tickets Cerrados', activeClass: 'bg-white text-emerald-600 shadow-xs' },
  { key: 'cancelados', label: 'Tickets Cancelados', activeClass: 'bg-white text-rose-600 shadow-xs' },
];

export const CHART_NAME_MAP: Record<ChartKey, string> = {
  abiertas:   'Gráfico: Oportunidades Abiertas',
  ventas:     'Gráfico: Ventas',
  tickets:    'Gráfico: Tickets Abiertos',
  cerrados:   'Gráfico: Tickets Cerrados',
  cancelados: 'Gráfico: Tickets Cancelados',
};

export const CHART_COLOR_MAP: Record<ChartKey, string> = {
  abiertas: 'blue',
  ventas: 'orange',
  tickets: 'blue',
  cerrados: 'green',
  cancelados: 'red',
};

/**
 * Obtiene los metadatos cromáticos correspondientes a una clave de color
 */
export const getIndicatorColorMeta = (colorKey?: string): ColorOptionMeta => {
  return COLOR_OPTIONS.find((c) => c.value === colorKey) || COLOR_OPTIONS[0];
};

/**
 * Formatea los nombres de las etapas asociadas a un indicador
 */
export const getStageNames = (
  stageIds: string[] | undefined,
  stages: Array<{ id: string; strname: string }>
): string => {
  if (!stageIds || stageIds.length === 0) return 'Todas las etapas / Sin selección';
  const names = stageIds
    .map((id) => stages.find((s) => s.id === id)?.strname)
    .filter(Boolean);
  return names.length > 0 ? names.join(', ') : 'Todas las etapas / Sin selección';
};

/**
 * Filtra los indicadores según el término de búsqueda, tipo y color
 */
export const filterDashboardIndicators = (
  indicators: DashboardIndicator[],
  filters: DashboardIndicatorFilterState
): DashboardIndicator[] => {
  const searchLower = filters.search.trim().toLowerCase();

  return indicators.filter((ind) => {
    // Excluir indicadores internos de gráficos analíticos
    if (ind.title?.startsWith('Gráfico:')) return false;

    // Filtro por texto de búsqueda
    const matchesSearch =
      !searchLower ||
      ind.title.toLowerCase().includes(searchLower);

    // Filtro por tipo de cálculo (conteo vs suma)
    const matchesType =
      filters.type === 'all' || ind.type === filters.type;

    // Filtro por color
    const matchesColor =
      filters.color === 'all' || ind.color === filters.color;

    return matchesSearch && matchesType && matchesColor;
  });
};

/**
 * Calcula estadísticas y métricas agregadas de los indicadores
 */
export const calculateIndicatorStats = (
  indicators: DashboardIndicator[]
): DashboardIndicatorStats => {
  // Excluir indicadores internos de gráficos
  const valid = indicators.filter((ind) => !ind.title?.startsWith('Gráfico:'));

  let countCards = 0;
  let sumCards = 0;
  const stagesSet = new Set<string>();

  valid.forEach((ind) => {
    if (ind.type === 'sum') {
      sumCards++;
    } else {
      countCards++;
    }
    if (Array.isArray(ind.stage_ids)) {
      ind.stage_ids.forEach((id: string) => stagesSet.add(id));
    }
  });

  return {
    total: valid.length,
    countCards,
    sumCards,
    totalStagesLinked: stagesSet.size,
  };
};

/**
 * Ejecutor reactivo de validación con Yup
 */
export const validateIndicatorForm = async (
  formData: Partial<DashboardIndicatorFormData>
): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
  try {
    await dashboardIndicatorValidationSchema.validate(formData, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (err: any) {
    const errors: Record<string, string> = {};
    if (err.inner && Array.isArray(err.inner)) {
      err.inner.forEach((validationError: any) => {
        if (validationError.path && !errors[validationError.path]) {
          errors[validationError.path] = validationError.message;
        }
      });
    }
    return { isValid: false, errors };
  }
};
