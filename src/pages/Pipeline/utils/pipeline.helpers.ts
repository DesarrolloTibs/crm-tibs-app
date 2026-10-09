import * as yup from 'yup';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '../../../utils/formatters';
import type {
  Opportunity,
  Stage,
  OpportunityFormData,
  PipelineFiltersState,
  FilterRule,
  PipelineStats,
} from '../schemas/pipeline.schema';
import {
  opportunityValidationSchema,
  stageValidationSchema,
} from '../schemas/pipeline.schema';

/**
 * Normaliza cadenas eliminando tildes, signos diacríticos y espacios para comparaciones insensibles.
 */
export const normalizeSearchText = (text?: string | null): string => {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

/**
 * Obtiene la lista unificada y sin duplicados de contactos asociados a una oportunidad
 * (contacto principal directo, contactos asignados y contactos de la empresa vinculada).
 */
export const getAllOpportunityContacts = (
  opp: Opportunity
): { id?: string; name: string; email?: string }[] => {
  const list: { id?: string; name: string; email?: string }[] = [];

  if (opp.cliente) {
    const fullName = `${opp.cliente.nombre || ''} ${opp.cliente.apellido || ''}`.trim();
    if (fullName) {
      list.push({ id: opp.cliente.id, name: fullName, email: opp.cliente.correo });
    }
  }

  if (opp.contacts && Array.isArray(opp.contacts)) {
    opp.contacts.forEach((c) => {
      const fullName = `${c.nombre || ''} ${c.apellido || ''}`.trim();
      if (fullName && !list.some((existing) => existing.id && existing.id === c.id)) {
        list.push({ id: c.id, name: fullName, email: c.correo });
      }
    });
  }

  if (opp.company?.contacts && Array.isArray(opp.company.contacts)) {
    opp.company.contacts.forEach((c) => {
      const fullName = `${c.nombre || ''} ${c.apellido || ''}`.trim();
      if (fullName && !list.some((existing) => existing.id && existing.id === c.id)) {
        list.push({ id: c.id, name: fullName, email: c.correo });
      }
    });
  }

  return list;
};

/**
 * Estado inicial por defecto de los filtros del Pipeline
 */
export const getInitialPipelineFilters = (): PipelineFiltersState => {
  const currentYear = new Date().getFullYear();
  return {
    searchTerm: '',
    contactFilter: '',
    executiveFilter: '',
    statusFilter: '',
    archivedFilter: 'active',
    priorityFilter: null,
    startDate: `${currentYear}-01-01`,
    endDate: `${currentYear}-12-31`,
    isCustomFilterActive: false,
    customRules: [],
    matchType: 'any',
    includeArchived: false,
  };
};

/**
 * Valores iniciales por defecto para el formulario de oportunidad
 */
export const INITIAL_OPPORTUNITY_FORM: OpportunityFormData = {
  nombre_proyecto: '',
  description: '',
  linkType: 'company',
  companyId: null,
  cliente_id: null,
  contactIds: [],
  productIds: [],
  ejecutivo_id: '',
  moneda: 'MXN',
  tipoCambio: 1,
  monto_licenciamiento: 0,
  monto_servicios: 0,
  monto_total: 0,
  priority: 1,
  stage_id: '',
  linea_negocio_id: null,
  tipo_entrega_id: null,
  licenciamiento_id: null,
  estimated_closure_date: null,
  createdAt: null,
  empresa: null,
};

/**
 * Valida de forma asíncrona los datos de una Oportunidad contra el esquema Yup
 */
export const validateOpportunityForm = async (
  values: Partial<OpportunityFormData>
): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
  try {
    await opportunityValidationSchema.validate(values, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (err) {
    if (err instanceof yup.ValidationError) {
      const errors: Record<string, string> = {};
      err.inner.forEach((error) => {
        if (error.path && !errors[error.path]) {
          errors[error.path] = error.message;
        }
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { form: 'Error de validación inesperado' } };
  }
};

/**
 * Valida de forma asíncrona los datos de una Etapa contra el esquema Yup
 */
export const validateStageForm = async (
  values: Partial<Stage>
): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
  try {
    await stageValidationSchema.validate(values, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (err) {
    if (err instanceof yup.ValidationError) {
      const errors: Record<string, string> = {};
      err.inner.forEach((error) => {
        if (error.path && !errors[error.path]) {
          errors[error.path] = error.message;
        }
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { form: 'Error de validación inesperado' } };
  }
};

/**
 * Calcula las métricas financieras y operativas del Pipeline
 */
export const calculatePipelineStats = (
  opportunities: Opportunity[],
  stages: Stage[]
): PipelineStats => {
  let totalValueMXN = 0;
  let totalValueUSD = 0;
  let wonCount = 0;
  let wonValueMXN = 0;
  let wonValueUSD = 0;
  let lostCount = 0;
  let activeCount = 0;

  const stageMap = new Map<string, Stage>();
  stages.forEach((s) => stageMap.set(s.id, s));

  for (const opp of opportunities) {
    if (opp.archived) continue;

    const amount = Number(opp.monto_total) || 0;
    const isUSD = opp.moneda === 'USD';
    const stage = opp.stage || (opp.stage_id ? stageMap.get(opp.stage_id) : undefined);
    const stageType = Number(stage?.stage_type ?? 0);

    if (isUSD) {
      totalValueUSD += amount;
    } else {
      totalValueMXN += amount;
    }

    if (stageType === 1 || stage?.strname?.toLowerCase() === 'ganada') {
      wonCount++;
      if (isUSD) wonValueUSD += amount;
      else wonValueMXN += amount;
    } else if (stageType === 2 || stage?.strname?.toLowerCase() === 'perdida') {
      lostCount++;
    } else {
      activeCount++;
    }
  }

  return {
    totalOpportunities: opportunities.filter((o) => !o.archived).length,
    totalValueMXN,
    totalValueUSD,
    wonCount,
    wonValueMXN,
    wonValueUSD,
    activeCount,
    lostCount,
  };
};

/**
 * Filtra la colección de oportunidades con base en criterios estándar o reglas avanzadas
 */
export const filterOpportunities = (
  opportunities: Opportunity[],
  filters: PipelineFiltersState
): Opportunity[] => {
  const {
    searchTerm,
    contactFilter,
    executiveFilter,
    statusFilter,
    priorityFilter,
    archivedFilter,
    startDate,
    endDate,
    isCustomFilterActive,
    customRules,
    matchType,
    includeArchived,
  } = filters;

  return opportunities.filter((opp) => {
    if (!isCustomFilterActive) {
      const term = normalizeSearchText(searchTerm);
      const oppContacts = getAllOpportunityContacts(opp);

      let matchesSearch = true;
      if (term) {
        const matchesProject = normalizeSearchText(opp.nombre_proyecto).includes(term);
        const matchesCompany = normalizeSearchText(opp.company?.nombre || opp.empresa || '').includes(term);
        const matchesContacts = oppContacts.some(
          (c) =>
            normalizeSearchText(c.name).includes(term) ||
            (c.email && normalizeSearchText(c.email).includes(term))
        );
        const matchesExecutive = normalizeSearchText(opp.ejecutivo?.username || '').includes(term);
        const matchesBusinessLine = normalizeSearchText(opp.linea_negocio?.strname || '').includes(term);

        matchesSearch =
          matchesProject || matchesCompany || matchesContacts || matchesExecutive || matchesBusinessLine;
      }

      const matchesContact = contactFilter
        ? opp.cliente_id === contactFilter ||
          opp.cliente?.id === contactFilter ||
          oppContacts.some((c) => c.id === contactFilter)
        : true;
      const matchesExecutive = executiveFilter ? opp.ejecutivo_id === executiveFilter : true;
      const matchesStatus = statusFilter ? opp.stage_id === statusFilter : true;
      const matchesPriority = priorityFilter !== null ? (opp.priority ?? 0) >= priorityFilter : true;
      const matchesArchived =
        archivedFilter === 'all'
          ? true
          : archivedFilter === 'archived'
          ? opp.archived === true
          : opp.archived === false || opp.archived === undefined;

      let matchesDate = true;
      if (startDate || endDate) {
        const oppDateStr = opp.createdAt
          ? typeof opp.createdAt === 'string'
            ? opp.createdAt
            : (opp.createdAt as any).toISOString?.() || String(opp.createdAt)
          : '';
        if (oppDateStr) {
          const oppDayStr = oppDateStr.substring(0, 10);
          if (startDate && oppDayStr < startDate) matchesDate = false;
          if (endDate && oppDayStr > endDate) matchesDate = false;
        }
      }

      return (
        matchesSearch &&
        matchesContact &&
        matchesExecutive &&
        matchesStatus &&
        matchesPriority &&
        matchesArchived &&
        matchesDate
      );
    }

    if (!includeArchived && opp.archived) return false;
    if (customRules.length === 0) return true;

    const matchesRule = (rule: FilterRule): boolean => {
      let fv: any = '';
      if (rule.field === 'nombre_proyecto') fv = opp.nombre_proyecto;
      else if (rule.field === 'empresa') fv = opp.company?.nombre || opp.empresa || '';
      else if (rule.field === 'linea_negocio') fv = (opp as any).linea_negocio?.strname || '';
      else if (rule.field === 'monto_total') fv = Number(opp.monto_total) || 0;
      else if (rule.field === 'stage_id') fv = opp.stage_id;
      else if (rule.field === 'ejecutivo_id') fv = opp.ejecutivo_id;
      else if (rule.field === 'priority') fv = opp.priority ?? 0;
      else if (rule.field === 'contacto') {
        const contacts = getAllOpportunityContacts(opp);
        const val = normalizeSearchText(rule.value);
        if (rule.operator === 'eq') {
          return contacts.some(
            (c) => normalizeSearchText(c.name) === val || (c.email && normalizeSearchText(c.email) === val)
          );
        }
        if (rule.operator === 'not_contains') {
          return !contacts.some(
            (c) => normalizeSearchText(c.name).includes(val) || (c.email && normalizeSearchText(c.email).includes(val))
          );
        }
        return contacts.some(
          (c) => normalizeSearchText(c.name).includes(val) || (c.email && normalizeSearchText(c.email).includes(val))
        );
      }

      const val = normalizeSearchText(rule.value);
      const op = rule.operator;
      if (rule.field === 'monto_total') {
        const n = Number(rule.value) || 0;
        return op === 'eq' ? fv === n : op === 'gt' ? fv > n : op === 'lt' ? fv < n : true;
      }
      if (rule.field === 'stage_id' || rule.field === 'ejecutivo_id' || rule.field === 'priority') {
        const sfv = String(fv || '');
        if (op === 'eq') return sfv === rule.value;
        if (op === 'neq') return sfv !== rule.value;
        return true;
      }
      const sfv = normalizeSearchText(String(fv || ''));
      if (op === 'eq') return sfv === val;
      if (op === 'neq') return sfv !== val;
      if (op === 'contains') return sfv.includes(val);
      if (op === 'not_contains') return !sfv.includes(val);
      return true;
    };

    return matchType === 'any' ? customRules.some(matchesRule) : customRules.every(matchesRule);
  });
};

const EXPORT_HEADERS = [
  'Proyecto',
  'Cliente / Contactos',
  'Empresa',
  'Ejecutivo',
  'Etapa',
  'Monto',
  'Moneda',
  'Estado',
];

const buildExportRows = (opportunities: Opportunity[]): string[][] => {
  return opportunities.map((opp) => {
    const clienteName = opp.company
      ? (opp as any).contacts?.map((c: any) => `${c.nombre} ${c.apellido}`).join(', ') || 'Sin contactos'
      : opp.cliente
      ? `${opp.cliente.nombre} ${opp.cliente.apellido}`
      : '-';

    return [
      opp.nombre_proyecto || '',
      clienteName,
      opp.company ? opp.company.nombre : opp.empresa || '-',
      opp.ejecutivo?.username || 'No asignado',
      opp.stage?.strname || 'Sin etapa',
      formatCurrency(opp.monto_total, opp.moneda),
      opp.moneda || 'MXN',
      opp.archived ? 'Archivado' : 'Activo',
    ];
  });
};

/**
 * Exporta el reporte de oportunidades a formato PDF apaisado
 */
export const exportOpportunitiesToPDF = (
  opportunities: Opportunity[],
  options: { title?: string } = {}
): void => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text(options.title || 'Reporte de Oportunidades — Pipeline Comercial', 40, 40);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generado el: ${new Date().toLocaleString('es-MX')}`, 40, 58);
  doc.text(`Total de registros: ${opportunities.length}`, 240, 58);

  autoTable(doc, {
    head: [EXPORT_HEADERS],
    body: buildExportRows(opportunities),
    startY: 75,
    styles: { fontSize: 8, cellPadding: 5, overflow: 'linebreak' },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 150 },
      1: { cellWidth: 120 },
      2: { cellWidth: 100 },
      3: { cellWidth: 80 },
      4: { cellWidth: 80 },
      5: { cellWidth: 70 },
      6: { cellWidth: 50 },
      7: { cellWidth: 50 },
    },
  });

  doc.save(`pipeline_oportunidades_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * Exporta el listado de oportunidades a archivo CSV
 */
export const exportOpportunitiesToCSV = (opportunities: Opportunity[]): void => {
  const rows = buildExportRows(opportunities);
  const csv = [
    EXPORT_HEADERS.join(','),
    ...rows.map((r) =>
      r
        .map((v) => {
          const e = String(v).replace(/"/g, '""');
          return /[,"\n\r]/.test(e) ? `"${e}"` : e;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pipeline_oportunidades_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
