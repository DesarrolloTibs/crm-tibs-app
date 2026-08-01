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

    // Usar onClick con window.open para forzar apertura externa y evitar React Router
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
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

