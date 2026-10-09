import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CourtesyOveragesReportResponse, CourtesyOverageTenantReport } from '../schemas/myCompany.schema';
import { formatNumber, formatFriendlyDate } from './myCompany.helpers';

/**
 * Exporta el reporte consolidado de cortesías a Excel (.xlsx nativo)
 */
export const exportCourtesyReportToExcel = (reportData: CourtesyOveragesReportResponse): void => {
  if (!reportData || !reportData.report.length) return;

  // 1. Hoja de Datos principales
  const dataRows = reportData.report.map((item: CourtesyOverageTenantReport, idx: number) => ({
    '#': idx + 1,
    'Organización': item.tenant_name,
    'Esquema': item.schema_name,
    'Plan Contratado': item.plan_name,
    'Consumo Extra': item.allow_extra ? 'Habilitado' : 'Bloqueado',
    'Cuota Base': item.tokens_limit,
    'Cortesía Absorbida': item.tokens_overage_absorbed,
    'Consumo Total': item.total_tokens_consumed,
    'Próximo Corte': item.next_renewal_date ? formatFriendlyDate(item.next_renewal_date) : 'N/A',
  }));

  // 2. Hoja de Resumen Ejecutivo / KPIs
  const summaryRows = [
    { 'Métrica Global': 'Plataforma', 'Valor': 'Billy Sales & Services' },
    { 'Métrica Global': 'Reporte', 'Valor': 'Consolidado de Cortesías de Servicio (Global SaaS)' },
    { 'Métrica Global': 'Total de Organizaciones', 'Valor': reportData.total_tenants },
    { 'Métrica Global': 'Organizaciones con Cortesía Técnica', 'Valor': reportData.tenants_with_courtesy_overage },
    { 'Métrica Global': 'Total Recursos Absorbidos por Plataforma (Tokens)', 'Valor': reportData.total_tokens_absorbed },
    { 'Métrica Global': 'Fecha y Hora de Emisión', 'Valor': new Date().toLocaleString('es-MX') },
  ];

  const wb = XLSX.utils.book_new();

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 45 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen Ejecutivo');

  const wsData = XLSX.utils.json_to_sheet(dataRows);
  wsData['!cols'] = [
    { wch: 5 },   // #
    { wch: 28 },  // Organización
    { wch: 22 },  // Esquema
    { wch: 18 },  // Plan Contratado
    { wch: 16 },  // Consumo Extra
    { wch: 16 },  // Cuota Base
    { wch: 20 },  // Cortesía Absorbida
    { wch: 18 },  // Consumo Total
    { wch: 22 },  // Próximo Corte
  ];
  XLSX.utils.book_append_sheet(wb, wsData, 'Detalle Organizaciones');

  XLSX.writeFile(wb, `reporte_cortesias_global_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

/**
 * Exporta el reporte consolidado de cortesías a PDF (formato horizontal)
 */
export const exportCourtesyReportToPDF = (reportData: CourtesyOveragesReportResponse): void => {
  if (!reportData || !reportData.report.length) return;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
  const nowStr = new Date().toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  // Encabezado
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text('Billy Sales & Services — Reporte Consolidado de Cortesías de Servicio', 40, 42);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Auditoría global de desbordes absorbidos por la plataforma SaaS sin costo para organizaciones.', 40, 58);
  doc.text(`Fecha y hora de emisión: ${nowStr}`, 40, 72);

  // Resumen Métricas
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(40, 84, 712, 36, 4, 4, 'F');

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Total de Organizaciones: ${reportData.total_tenants}`, 55, 106);
  doc.text(`Organizaciones con Cortesía: ${reportData.tenants_with_courtesy_overage}`, 260, 106);
  doc.text(`Total Recursos Absorbidos: +${formatNumber(reportData.total_tokens_absorbed)}`, 490, 106);

  // Columnas y Filas
  const headers = [
    'Organización',
    'Esquema',
    'Plan',
    'Consumo Extra',
    'Cuota Base',
    'Cortesía Absorbida',
    'Consumo Total',
    'Próximo Corte',
  ];

  const rows = reportData.report.map((item: CourtesyOverageTenantReport) => [
    item.tenant_name,
    item.schema_name,
    item.plan_name,
    item.allow_extra ? 'Habilitado' : 'Bloqueado',
    formatNumber(item.tokens_limit),
    item.tokens_overage_absorbed > 0 ? `+${formatNumber(item.tokens_overage_absorbed)}` : '0',
    formatNumber(item.total_tokens_consumed),
    item.next_renewal_date ? formatFriendlyDate(item.next_renewal_date) : 'N/A',
  ]);

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 130,
    styles: {
      fontSize: 8,
      cellPadding: 6,
      overflow: 'linebreak',
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [109, 40, 217],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [250, 245, 255],
    },
    columnStyles: {
      0: { cellWidth: 120, fontStyle: 'bold' },
      1: { cellWidth: 90 },
      2: { cellWidth: 70 },
      3: { cellWidth: 75, halign: 'center' },
      4: { cellWidth: 75, halign: 'right' },
      5: { cellWidth: 85, halign: 'right', textColor: [126, 34, 206], fontStyle: 'bold' },
      6: { cellWidth: 85, halign: 'right', fontStyle: 'bold' },
      7: { cellWidth: 112, halign: 'center' },
    },
  });

  // Numeración de páginas
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

  doc.save(`reporte_cortesias_global_${new Date().toISOString().slice(0, 10)}.pdf`);
};
