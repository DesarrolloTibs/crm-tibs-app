import React from 'react';
import type { ActiveTab, ChartType, CurrencyFilter } from '../../hooks/useDashboard';
import type { DashboardIndicator } from '../../services/reportsService';
import { formatCurrency } from '../../utils/formatters';
import VisualChart from './VisualChart';

interface PdfSummaryTemplateProps {
  activeTab: ActiveTab;
  kpiIndicators: DashboardIndicator[];
  kpiValues: Record<string, number>;
  activeCurrency: string;
  chart1Type: ChartType;
  chart2Type: ChartType;
  chart3Type: ChartType;
  openOppsByMonth: { label: string; value: number }[];
  salesByMonth: { label: string; value: number }[];
  oppsByStage: { label: string; value: number }[];
  ticketsOpenByMonth: { label: string; value: number }[];
  ticketsClosedByMonth: { label: string; value: number }[];
  ticketsCancelledByMonth: { label: string; value: number }[];
  pipelineLabel: string;
  helpdeskLabel: string;
  executiveLabel: string;
  periodLabel: string;
  currencyFilter: CurrencyFilter;
  startDate: string;
  endDate: string;
}

const PdfSummaryTemplate: React.FC<PdfSummaryTemplateProps> = (props) => {
  const { activeTab, kpiIndicators, kpiValues, activeCurrency, chart1Type, chart2Type, chart3Type,
    openOppsByMonth, salesByMonth, oppsByStage, ticketsOpenByMonth, ticketsClosedByMonth, ticketsCancelledByMonth,
    pipelineLabel, helpdeskLabel, executiveLabel, periodLabel, currencyFilter,
  } = props;

  const COLOR_MAP: Record<string, string> = { blue:'#3b82f6', green:'#10b981', purple:'#8b5cf6', orange:'#f59e0b', red:'#ef4444' };
  const chart1Data = activeTab === 'commercial' ? openOppsByMonth : ticketsOpenByMonth;
  const chart2Data = activeTab === 'commercial' ? salesByMonth : ticketsClosedByMonth;
  const chart3Data = activeTab === 'commercial' ? oppsByStage : ticketsCancelledByMonth;

  return (
    <div id="pdf-summary-wrapper" style={{ height:0, overflow:'hidden', position:'relative' }}>
      <div id="dashboard-pdf-summary" style={{ width:'1120px', padding:'30px', backgroundColor:'#f8fafc', display:'flex', flexDirection:'column', gap:'24px' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'2px solid #e2e8f0', paddingBottom:'16px' }}>
          <div>
            <h1 style={{ fontSize:'22px', fontWeight:900, color:'#1e293b', margin:0 }}>REPORTE EJECUTIVO DE DESEMPEÑO</h1>
            <p style={{ fontSize:'11px', color:'#64748b', margin:'4px 0 0 0', fontWeight:'bold' }}>CRM Tibs - Reportes Consolidados</p>
          </div>
          <div style={{ textAlign:'right', fontSize:'10px', color:'#64748b', lineHeight:'1.4' }}>
            <div><strong>Generado:</strong> {new Date().toLocaleDateString('es-MX')}</div>
            <div><strong>Módulo:</strong> {activeTab==='commercial'?'Resumen Comercial':'Mesa de Ayuda'}</div>
            <div><strong>{activeTab==='commercial'?'Pipeline:':'Mesa:'}</strong> {activeTab==='commercial'?pipelineLabel:helpdeskLabel}</div>
            <div><strong>Ejecutivo:</strong> {executiveLabel}</div>
            <div><strong>Periodo:</strong> {periodLabel.replace(/[()]/g,'')}</div>
            {activeTab==='commercial'&&<div><strong>Moneda:</strong> {currencyFilter==='consolidado'?'Consolidado en Pesos (MXN)':currencyFilter==='USD'?'Solo Dólares (USD)':'Solo Pesos (MXN)'}</div>}
          </div>
        </div>

        {/* KPIs */}
        <div>
          <h2 style={{ fontSize:'10px', fontWeight:900, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'10px' }}>Indicadores Clave (KPIs)</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'12px' }}>
            {kpiIndicators.map(ind => {
              const v = kpiValues[ind.id!]||0;
              const disp = ind.type==='sum'?formatCurrency(v,activeCurrency):v;
              return (
                <div key={ind.id} style={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderLeft:`5px solid ${COLOR_MAP[ind.color]||'#64748b'}`, borderRadius:'12px', padding:'14px 12px', minHeight:'85px', display:'flex', flexDirection:'column', justifyContent:'space-between', boxSizing:'border-box' }}>
                  <div style={{ fontSize:'8.5px', fontWeight:'bold', color:'#64748b', textTransform:'uppercase' }}>{ind.title}</div>
                  <div><span style={{ fontSize:'18px', fontWeight:950, color:'#0f172a' }}>{disp}</span><br/><span style={{ fontSize:'8px', color:'#94a3b8', textTransform:'uppercase', fontWeight:'bold' }}>{ind.type==='sum'?'Suma importes':'Registros'}</span></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Charts */}
        <div>
          <h2 style={{ fontSize:'10px', fontWeight:900, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'10px' }}>Gráficos del Período</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px' }}>
            {[
              { title: activeTab==='commercial'?`Opps por Mes de Cierre ${periodLabel}`:`Tickets Abiertos ${periodLabel}`, data:chart1Data, type:chart1Type, color:'#4f46e5', gradId:'c1pdf', isCurrency:false },
              { title: activeTab==='commercial'?`Ventas Ganadas ${periodLabel}`:`Tickets Cerrados ${periodLabel}`, data:chart2Data, type:chart2Type, color:'#10b981', gradId:'c2pdf', isCurrency:activeTab==='commercial' },
              { title: activeTab==='commercial'?`Oportunidades por Etapa ${periodLabel}`:`Tickets Cancelados ${periodLabel}`, data:chart3Data, type:chart3Type, color:'#f43f5e', gradId:'c3pdf', isCurrency:false },
            ].map((c,i) => (
              <div key={i} style={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:'16px', padding:'12px' }}>
                <h3 style={{ fontSize:'9px', fontWeight:900, color:'#475569', textTransform:'uppercase', marginBottom:'10px', borderBottom:'1px solid #f1f5f9', paddingBottom:'6px' }}>{c.title}</h3>
                <VisualChart type={c.type} data={c.data} colorHex={c.color} colorGradId={c.gradId} isCurrency={c.isCurrency} activeCurrency={activeCurrency} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfSummaryTemplate;
