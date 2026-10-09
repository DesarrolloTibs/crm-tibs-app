import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { RecentTransaction } from '../schemas/myCompany.schema';
import {
  formatDateTime,
  getChannelMeta,
  getActionDisplay,
  formatNumber,
} from './myCompany.helpers';

export interface ExportHistoryOptions {
  transactions: RecentTransaction[];
  orgName: string;
  schemaName: string;
  planName: string;
  periodLabel: string;
  transactionFilter: 'all' | 'plan' | 'extra';
  transactionSearch: string;
}

/**
 * Exporta el historial de interacciones a Excel (.xlsx nativo) bajo la marca Billy Sales & Services
 */
export const exportInteractionHistoryToExcel = async (options: ExportHistoryOptions): Promise<void> => {
  const XLSX = await import('xlsx');
  const {
    transactions,
    orgName,
    schemaName,
    planName,
    periodLabel,
    transactionFilter,
    transactionSearch,
  } = options;

  const totalTokensInView = transactions.reduce((acc, tx) => acc + (tx.total_tokens || 0), 0);

  // 1. Hoja Historial de Interacciones (sin ID)
  const transactionsRows = transactions.map((tx) => ({
    'Fecha y Hora': formatDateTime(tx.fecha_procesamiento),
    'Canal': getChannelMeta(tx.channel).label,
    'Origen / Contacto': tx.user_name ? `Equipo: ${tx.user_name}` : tx.client_name ? `Cliente: ${tx.client_name}` : 'Base de Conocimiento',
    'Conversación / Ref': tx.conversation_id || 'N/A',
    'Acción Realizada': getActionDisplay(tx.accion).label,
    'Consultas (Prompt)': tx.prompt_tokens,
    'Respuestas (Completion)': tx.completion_tokens,
    'Total Recursos (Tokens)': tx.total_tokens,
    'Tipo de Cuota': tx.is_extra ? 'Consumo Extra' : 'Cuota del Plan',
    'Modelo IA': tx.model_name || 'N/A',
  }));

  // 2. Hoja Resumen Ejecutivo
  const summaryRows = [
    { 'Métrica': 'Plataforma', 'Valor': 'Billy Sales & Services' },
    { 'Métrica': 'Módulo', 'Valor': 'Auditoría — Historial de Interacciones Recientes' },
    { 'Métrica': 'Organización', 'Valor': orgName },
    { 'Métrica': 'Esquema (Tenant)', 'Valor': schemaName },
    { 'Métrica': 'Plan Contratado', 'Valor': planName },
    { 'Métrica': 'Período Consultado', 'Valor': periodLabel },
    { 'Métrica': 'Total de Interacciones en Vista', 'Valor': transactions.length },
    { 'Métrica': 'Total Recursos en Vista (Tokens)', 'Valor': totalTokensInView },
    { 'Métrica': 'Filtro de Cuota Activo', 'Valor': transactionFilter === 'all' ? 'Todas' : transactionFilter === 'plan' ? 'Solo Cuota Base' : 'Solo Consumo Extra' },
    { 'Métrica': 'Búsqueda Activa', 'Valor': transactionSearch.trim() || 'Sin filtro de texto' },
    { 'Métrica': 'Fecha de Emisión', 'Valor': new Date().toLocaleString('es-MX') },
  ];

  const wb = XLSX.utils.book_new();

  const wsTx = XLSX.utils.json_to_sheet(transactionsRows);
  wsTx['!cols'] = [
    { wch: 22 }, // Fecha y Hora
    { wch: 18 }, // Canal
    { wch: 26 }, // Origen / Contacto
    { wch: 22 }, // Conversación Ref
    { wch: 30 }, // Acción Realizada
    { wch: 20 }, // Consultas
    { wch: 24 }, // Respuestas
    { wch: 24 }, // Total Recursos
    { wch: 16 }, // Tipo de Cuota
    { wch: 18 }, // Modelo IA
  ];
  XLSX.utils.book_append_sheet(wb, wsTx, 'Historial Interacciones');

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 35 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen Auditoría');

  const tenantSlug = schemaName.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(wb, `historial_interacciones_${tenantSlug}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

/**
 * Exporta el historial de interacciones a PDF (formato horizontal) bajo la marca Billy Sales & Services
 */
export const exportInteractionHistoryToPDF = (options: ExportHistoryOptions): void => {
  const {
    transactions,
    orgName,
    schemaName,
    planName,
    periodLabel,
    transactionFilter,
    transactionSearch,
  } = options;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
  const nowStr = new Date().toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const totalTokensInView = transactions.reduce((acc, tx) => acc + (tx.total_tokens || 0), 0);

  // Encabezado
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text('Billy Sales & Services — Historial de Interacciones Recientes', 40, 42);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Organización: ${orgName} (${schemaName})  |  Plan: ${planName}  |  Período: ${periodLabel}`, 40, 58);
  doc.text(`Fecha de emisión: ${nowStr}`, 40, 72);

  // Resumen KPI en PDF
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(40, 84, 712, 36, 4, 4, 'F');

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Total Interacciones: ${transactions.length}`, 55, 106);
  doc.text(`Filtro Cuota: ${transactionFilter === 'all' ? 'Todas' : transactionFilter === 'plan' ? 'Cuota Base' : 'Consumo Extra'}`, 230, 106);
  doc.text(`Total Recursos en Vista: ${formatNumber(totalTokensInView)}`, 410, 106);
  doc.text(`Búsqueda: ${transactionSearch.trim() || 'Sin filtro'}`, 590, 106);

  // Tabla Única: Historial de Interacciones Recientes (sin ID)
  const txHeaders = [
    'Fecha / Hora',
    'Canal',
    'Origen / Contacto',
    'Acción Realizada',
    'Consultas',
    'Respuestas',
    'Total Recursos',
    'Cuota',
  ];

  const txData = transactions.map(tx => [
    formatDateTime(tx.fecha_procesamiento),
    getChannelMeta(tx.channel).label,
    tx.user_name ? `Equipo: ${tx.user_name}` : tx.client_name ? `Cliente: ${tx.client_name}` : 'Base Conocimiento',
    getActionDisplay(tx.accion).label,
    formatNumber(tx.prompt_tokens),
    formatNumber(tx.completion_tokens),
    formatNumber(tx.total_tokens),
    tx.is_extra ? 'Consumo Extra' : 'Cuota Plan',
  ]);

  autoTable(doc, {
    head: [txHeaders],
    body: txData,
    startY: 132,
    styles: {
      fontSize: 7.5,
      cellPadding: 5.5,
      overflow: 'linebreak',
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [16, 185, 129], // Emerald 600
      textColor: 255,
      fontStyle: 'bold',
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 115 }, // Fecha / Hora
      1: { cellWidth: 75 },  // Canal
      2: { cellWidth: 115 }, // Origen / Contacto
      3: { cellWidth: 135 }, // Acción Realizada
      4: { cellWidth: 65, halign: 'right' }, // Consultas
      5: { cellWidth: 65, halign: 'right' }, // Respuestas
      6: { cellWidth: 80, halign: 'right', fontStyle: 'bold' }, // Total Recursos
      7: { cellWidth: 62, halign: 'center' }, // Cuota
    },
  });

  // Numeración de páginas al pie de cada página
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Billy Sales & Services  |  Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 20,
      { align: 'center' }
    );
  }

  const tenantSlug = schemaName.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`historial_interacciones_${tenantSlug}_${new Date().toISOString().slice(0, 10)}.pdf`);
};
