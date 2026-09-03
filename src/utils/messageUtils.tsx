import React from 'react';
import { FileText, Download } from 'lucide-react';

/** Renderiza el contenido de un mensaje, detectando links a PDF para mostrar un card descargable. */
export const renderMessageContent = (content: string): React.ReactNode => {
  if (!content) return null;

  const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3091';

  // Detectar URLs de cotizaciones PDF: archivos .pdf directos O endpoints de la API pública
  const pdfMatch = content.match(
    /(https?:\/\/[^\s\)\]"]+\.pdf|https?:\/\/[^\s\)\]"]*\/api\/public\/quotations\/[a-f0-9\-]{36}|\/api\/public\/quotations\/[a-f0-9\-]{36}|\/uploads\/[^\s\)\]"]+\.pdf|uploads\/[^\s\)\]"]+\.pdf)/i
  );

  if (pdfMatch) {
    const rawUrl = pdfMatch[0];
    let fullUrl = rawUrl;

    // Construir URL absoluta si es relativa
    if (rawUrl.startsWith('/api/') || rawUrl.startsWith('/uploads/')) {
      fullUrl = `${baseUrl}${rawUrl}`;
    } else if (rawUrl.startsWith('uploads/')) {
      fullUrl = `${baseUrl}/${rawUrl}`;
    }

    // Extraer texto antes del enlace (sin la sintaxis markdown rota)
    const textBefore = content
      .split(rawUrl)[0]
      .replace(/📄\s*\[[^\]]*\]\s*\([^)]*\)\s*:?\s*/gi, '')
      .replace(/📄\s*\[[^\]]*\]\([^)]*\)\s*/gi, '')
      .trim();

    const handleClick = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        const response = await fetch(fullUrl);
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileNameMatch = fullUrl.match(/\/([^\/?#]+)$/);
        const fileName = fileNameMatch ? fileNameMatch[1] : 'cotizacion.pdf';
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error downloading file, falling back to new tab:", error);
        window.open(fullUrl, '_blank', 'noopener,noreferrer');
      }
    };

    return (
      <div className="flex flex-col gap-2.5">
        {textBefore && <span>{textBefore}</span>}
        <a
          href={fullUrl}
          onClick={handleClick}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-white/20 hover:bg-white/30 border border-white/40 rounded-xl p-3 text-white transition-all shadow-xs group"
          style={{ textDecoration: 'none' }}
        >
          <div className="p-2.5 bg-red-500 rounded-lg text-white group-hover:scale-105 transition-transform shadow-xs">
            <FileText size={20} />
          </div>
          <div className="flex flex-col text-left overflow-hidden">
            <span className="text-xs font-bold leading-tight truncate">Cotización en PDF</span>
            <span className="text-[11px] opacity-90 flex items-center gap-1 mt-0.5 font-medium underline underline-offset-2">
              Ver o descargar <Download size={12} />
            </span>
          </div>
        </a>
      </div>
    );
  }

  // Detectar cualquier otro enlace externo (https://) para renderizarlo como link cliqueable
  const urlMatch = content.match(/(https?:\/\/[^\s\)\]"]+)/i);
  if (urlMatch) {
    const url = urlMatch[0];
    const parts = content.split(url);
    const handleLinkClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      window.open(url, '_blank', 'noopener,noreferrer');
    };
    return (
      <span>
        {parts[0]}
        <a
          href={url}
          onClick={handleLinkClick}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 opacity-90 hover:opacity-100"
        >
          {url}
        </a>
        {parts[1] || ''}
      </span>
    );
  }

  return <span>{content}</span>;
};

/**
 * Normaliza y compara si dos fechas corresponden al mismo día de calendario.
 */
export const isSameDay = (d1: Date, d2: Date): boolean => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

/**
 * Formatea la hora de un mensaje (ej: "02:30 p. m.").
 */
export const formatMessageTime = (dateInput?: string | Date): string => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Obtiene la etiqueta para el divisor de fecha estilo WhatsApp:
 * - "Hoy"
 * - "Ayer"
 * - "3 de septiembre" (año actual) o "3 de septiembre de 2025" (otros años)
 */
export const getMessageDateDividerLabel = (dateInput?: string | Date): string => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  if (isSameDay(date, now)) {
    return 'Hoy';
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return 'Ayer';
  }

  const isCurrentYear = date.getFullYear() === now.getFullYear();
  if (isCurrentYear) {
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
    });
  }

  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export interface MessageDateGroup {
  dateKey: string;
  dateLabel: string;
  messages: any[];
}

/**
 * Agrupa una lista de mensajes cronológicamente por día.
 */
export const groupMessagesByDate = (messages: any[]): MessageDateGroup[] => {
  if (!messages || !Array.isArray(messages)) return [];

  const groups: MessageDateGroup[] = [];
  let currentGroup: MessageDateGroup | null = null;

  messages.forEach((msg) => {
    const msgDate = msg.createdAt ? new Date(msg.createdAt) : new Date();
    const dateKey = !isNaN(msgDate.getTime())
      ? `${msgDate.getFullYear()}-${String(msgDate.getMonth() + 1).padStart(2, '0')}-${String(msgDate.getDate()).padStart(2, '0')}`
      : 'unknown';

    if (!currentGroup || currentGroup.dateKey !== dateKey) {
      const dateLabel = getMessageDateDividerLabel(msg.createdAt);
      currentGroup = {
        dateKey,
        dateLabel: dateLabel || 'Fecha',
        messages: [msg],
      };
      groups.push(currentGroup);
    } else {
      currentGroup.messages.push(msg);
    }
  });

  return groups;
};

/**
 * Formatea la fecha para la lista lateral de conversaciones:
 * - Si es hoy: muestra la hora ("02:30 p. m.")
 * - Si fue ayer: muestra "Ayer"
 * - Si fue anterior: muestra "DD/MM/AA"
 */
export const formatSidebarDate = (dateInput?: string | Date): string => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  if (isSameDay(date, now)) {
    return formatMessageTime(date);
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return 'Ayer';
  }

  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
};

