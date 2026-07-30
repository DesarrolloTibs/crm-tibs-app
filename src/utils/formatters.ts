/**
 * Shared formatting utilities for the CRM application.
 */

/** Formats a number as currency using Intl.NumberFormat */
export const formatCurrency = (amount: number, currency = 'MXN'): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/** Parses a date string or Date and returns a "MMM YYYY" string (e.g. "ENE 2024") */
export const getMonthYearString = (dateStr?: string | Date): string => {
  if (!dateStr) return 'Sin fecha';
  try {
    if (typeof dateStr === 'string') {
      const match = dateStr.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
      if (match) {
        const year = parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
        if (month >= 0 && month <= 11) {
          return `${months[month]} ${year}`;
        }
      }
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Sin fecha';
    return new Intl.DateTimeFormat('es-MX', { month: 'short', year: 'numeric' })
      .format(d)
      .toUpperCase();
  } catch {
    return 'Sin fecha';
  }
};
