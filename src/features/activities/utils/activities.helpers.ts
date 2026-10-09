import * as yup from 'yup';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  Activity,
  ActivityFormData,
  ActivityFiltersState,
  ActivityStats,
} from '../schemas/activities.schema';
import { activityValidationSchema } from '../schemas/activities.schema';

/**
 * Convierte una fecha ISO o string a formato compatible con input datetime-local (YYYY-MM-DDTHH:mm)
 */
export const formatDateTimeForInput = (isoString?: string): string => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  } catch {
    return '';
  }
};

/**
 * Valores iniciales por defecto para el formulario de actividad
 */
export const INITIAL_ACTIVITY_FORM: ActivityFormData = {
  activity: '',
  typeActivityId: null,
  date: formatDateTimeForInput(new Date().toISOString()),
  linkType: 'company',
  companyId: null,
  contactIds: [],
  clientId: null,
  opportunityId: null,
  flaghistory: false,
  reminderEnabled: false,
  reminderTitle: '',
  reminderDate: '',
};

/**
 * Valida de forma asíncrona los datos de una actividad contra el esquema Yup
 */
export const validateActivityForm = async (
  values: Partial<ActivityFormData>
): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
  try {
    await activityValidationSchema.validate(values, { abortEarly: false });
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
 * Calcula las métricas KPI del conjunto de actividades
 */
export const calculateActivityStats = (activities: Activity[]): ActivityStats => {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  let todayCount = 0;
  let upcomingCount = 0;
  let withReminderCount = 0;
  let externalSyncedCount = 0;

  for (const act of activities) {
    if (act.date) {
      const actDate = new Date(act.date);
      const actDateStr = !isNaN(actDate.getTime()) ? actDate.toISOString().slice(0, 10) : '';

      if (actDateStr === todayStr) {
        todayCount++;
      }

      if (!isNaN(actDate.getTime()) && actDate.getTime() > now.getTime()) {
        upcomingCount++;
      }
    }

    if (act.reminder && act.reminder.title) {
      withReminderCount++;
    }

    if (act.externalProvider) {
      externalSyncedCount++;
    }
  }

  return {
    total: activities.length,
    today: todayCount,
    upcoming: upcomingCount,
    withReminder: withReminderCount,
    externalSynced: externalSyncedCount,
  };
};

/**
 * Normaliza y filtra la colección de actividades según los filtros activos
 */
export const filterActivities = (
  activities: Activity[],
  filters: ActivityFiltersState
): Activity[] => {
  const normalizedSearch = filters.search.trim().toLowerCase();

  return activities.filter((act) => {
    // Coincidencia por texto libre (descripción, recordatorio, empresa, contacto, oportunidad)
    const titleMatch = (act.activity || '').toLowerCase().includes(normalizedSearch);
    const reminderMatch = Boolean(act.reminder?.title?.toLowerCase().includes(normalizedSearch));
    const companyMatch = Boolean(act.company?.nombre?.toLowerCase().includes(normalizedSearch));
    const clientMatch = Boolean(
      `${act.client?.nombre || ''} ${act.client?.apellido || ''}`.toLowerCase().includes(normalizedSearch)
    );
    const oppMatch = Boolean(act.opportunity?.nombre_proyecto?.toLowerCase().includes(normalizedSearch));

    const matchesSearch =
      !normalizedSearch ||
      titleMatch ||
      reminderMatch ||
      companyMatch ||
      clientMatch ||
      oppMatch;

    // Coincidencia por usuario
    const matchesUser =
      filters.userId === 'all' ||
      !filters.userId ||
      act.userId === filters.userId ||
      act.user?.id === filters.userId;

    // Coincidencia por tipo de actividad
    const matchesType =
      filters.typeActivityId === 'all' ||
      !filters.typeActivityId ||
      String(act.typeActivityId) === filters.typeActivityId;

    // Coincidencia por fecha exacta (YYYY-MM-DD)
    const matchesDate = !filters.date || (act.date && act.date.startsWith(filters.date));

    return matchesSearch && matchesUser && matchesType && matchesDate;
  });
};

/**
 * Exporta el listado actual de actividades a formato PDF
 */
export const exportActivitiesToPDF = (
  activities: Activity[],
  options: { userLabel: string; filterDate?: string; filterSearch?: string }
): void => {
  const hasReminders = activities.some((a) => Boolean(a.reminder));
  const headers = ['Actividad', 'Tipo', 'Fecha', 'Usuario', 'Relación', 'Oportunidad'];
  if (hasReminders) headers.push('Recordatorio');

  const rows = activities.map((act) => {
    const relacion = act.company
      ? `Empresa: ${act.company.nombre}`
      : act.client
      ? `Contacto: ${act.client.nombre} ${act.client.apellido || ''}`.trim()
      : '-';

    const row = [
      act.activity || '',
      act.typeActivity?.strname || 'N/A',
      act.date ? new Date(act.date).toLocaleString('es-MX') : '',
      act.user?.username || 'Sin asignar',
      relacion,
      act.opportunity?.nombre_proyecto || '-',
    ];

    if (hasReminders) {
      row.push(act.reminder ? act.reminder.title : '');
    }

    return row;
  });

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text('Reporte de Actividades — CRM TIBS', 40, 40);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Usuario: ${options.userLabel}`, 40, 58);
  if (options.filterDate) doc.text(`Fecha: ${options.filterDate}`, 240, 58);
  if (options.filterSearch) doc.text(`Búsqueda: "${options.filterSearch}"`, options.filterDate ? 380 : 240, 58);
  doc.text(`Generado el: ${new Date().toLocaleString('es-MX')}`, 40, 72);

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 85,
    styles: { fontSize: 7.5, cellPadding: 4, overflow: 'linebreak' },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 160 },
      1: { cellWidth: 70 },
      2: { cellWidth: 90 },
      3: { cellWidth: 70 },
      4: { cellWidth: 110 },
      5: { cellWidth: 100 },
      ...(hasReminders ? { 6: { cellWidth: 'auto' } } : {}),
    },
  });

  const userSuffix = options.userLabel !== 'Todos los usuarios' ? `_${options.userLabel}` : '';
  const dateSuffix = options.filterDate ? `_${options.filterDate}` : '';
  doc.save(`actividades${userSuffix}${dateSuffix}.pdf`);
};

/**
 * Exporta el listado actual de actividades a formato CSV
 */
export const exportActivitiesToCSV = (
  activities: Activity[],
  options: { userLabel: string; filterDate?: string }
): void => {
  const hasReminders = activities.some((a) => Boolean(a.reminder));
  const headers = ['Actividad', 'Tipo', 'Fecha', 'Usuario', 'Relación', 'Oportunidad'];
  if (hasReminders) headers.push('Recordatorio');

  const rows = activities.map((act) => {
    const relacion = act.company
      ? `Empresa: ${act.company.nombre}`
      : act.client
      ? `Contacto: ${act.client.nombre} ${act.client.apellido || ''}`.trim()
      : '';

    const row = [
      act.activity || '',
      act.typeActivity?.strname || '',
      act.date ? new Date(act.date).toLocaleString('es-MX') : '',
      act.user?.username || '',
      relacion,
      act.opportunity?.nombre_proyecto || '',
    ];

    if (hasReminders) {
      row.push(act.reminder ? act.reminder.title : '');
    }

    return row;
  });

  const csv = [
    headers.join(','),
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
  const userSuffix = options.userLabel !== 'Todos los usuarios' ? `_${options.userLabel}` : '';
  const dateSuffix = options.filterDate ? `_${options.filterDate}` : '';
  a.download = `actividades${userSuffix}${dateSuffix}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
