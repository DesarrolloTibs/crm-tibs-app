/**
 * Utilidades de formateo compartidas y centralizadas para la aplicación CRM.
 */

export interface FormatCurrencyOptions {
  /** Cantidad de decimales a mostrar (por defecto 0 para mantener consistencia en KPIs/gráficas) */
  decimals?: number;
  /** Si debe incluir la clave de divisa al final (ej. "$1,250.00 MXN") */
  showCode?: boolean;
}

/**
 * Formatea un número o cadena numérica como divisa con símbolo $ y separadores de miles.
 * Maneja valores nulos, indefinidos, strings numéricos o cadenas ya preformateadas.
 *
 * @param amount - Valor numérico o cadena a formatear
 * @param currency - Código de moneda (ej. 'MXN', 'USD', default: 'MXN')
 * @param options - Opciones de decimales y clave de divisa
 */
export const formatCurrency = (
  amount?: number | string | null,
  currency = 'MXN',
  options?: FormatCurrencyOptions
): string => {
  const curr = currency?.toUpperCase() || 'MXN';
  const decimals = options?.decimals ?? 0;
  // Validar código de moneda ISO (3 letras), fallback a MXN si es inválido (ej. 'consolidado')
  const validCurrency = (curr.length === 3 && /^[A-Z]{3}$/.test(curr)) ? curr : 'MXN';

  const formatWithIntl = (val: number): string => {
    try {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: validCurrency,
        currencyDisplay: 'narrowSymbol',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(val);
    } catch {
      return `$${new Intl.NumberFormat('es-MX', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(val)}`;
    }
  };

  if (amount === null || amount === undefined || amount === '') {
    const zeroFormatted = formatWithIntl(0);
    return options?.showCode ? `${zeroFormatted} ${curr}` : zeroFormatted;
  }

  // Si ya viene preformateado como string con divisa
  if (typeof amount === 'string' && (amount.startsWith('$') || amount.includes('MXN') || amount.includes('USD'))) {
    return amount;
  }

  const num = typeof amount === 'number'
    ? amount
    : parseFloat(String(amount).replace(/[^0-9.-]/g, ''));

  if (isNaN(num)) {
    const zeroFormatted = formatWithIntl(0);
    return options?.showCode ? `${zeroFormatted} ${curr}` : zeroFormatted;
  }

  const formatted = formatWithIntl(num);
  return options?.showCode ? `${formatted} ${curr}` : formatted;
};

export interface FormatNumberOptions {
  /** Cantidad de decimales (default: 0) */
  decimals?: number;
  /** Si es true, retorna cadena vacía '' cuando el valor es null, undefined o '' (útil para inputs controlados) */
  emptyIfNull?: boolean;
}

/**
 * Formatea un número o texto numérico con separador de miles SIN símbolo de divisa.
 * Ideal para campos de entrada de formulario (inputs con prefix="$") y tablas sin signo.
 */
export const formatNumber = (
  value?: number | string | null,
  options?: FormatNumberOptions
): string => {
  if (value === null || value === undefined || value === '') {
    return options?.emptyIfNull ? '' : '0';
  }

  const num = typeof value === 'number'
    ? value
    : parseFloat(String(value).replace(/[^0-9.-]/g, ''));

  if (isNaN(num)) {
    return options?.emptyIfNull ? '' : '0';
  }

  const decimals = options?.decimals ?? 0;
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

/**
 * Convierte una fecha (string o Date) en formato abreviado "MMM YYYY" en mayúsculas (ej. "ENE 2024").
 */
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
