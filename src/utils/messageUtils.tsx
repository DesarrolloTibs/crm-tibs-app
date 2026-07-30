import React from 'react';
import { FileText, Download } from 'lucide-react';

/** Renderiza el contenido de un mensaje, detectando links a PDF para mostrar un card descargable. */
export const renderMessageContent = (content: string): React.ReactNode => {
  if (!content) return null;

  const pdfMatch = content.match(
    /(https?:\/\/[^\s]+\.pdf|\/uploads\/[^\s]+\.pdf|uploads\/[^\s]+\.pdf)/i
  );

  if (pdfMatch) {
    const rawUrl = pdfMatch[0];
    const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3091';
    let fullUrl = rawUrl;
    if (rawUrl.startsWith('/uploads/')) fullUrl = `${baseUrl}${rawUrl}`;
    else if (rawUrl.startsWith('uploads/')) fullUrl = `${baseUrl}/${rawUrl}`;

    const textBefore = content
      .split(rawUrl)[0]
      .replace(/📄\s*\[Cotización en PDF\]\s*\([^)]*\):\s*/i, '')
      .trim();

    return (
      <div className="flex flex-col gap-2.5">
        {textBefore && <span>{textBefore}</span>}
        <a
          href={fullUrl}
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

  return <span>{content}</span>;
};
