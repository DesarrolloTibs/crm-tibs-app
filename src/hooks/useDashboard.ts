import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useConfigStore } from '../store/useConfigStore';
import { getDashboardData } from '../services/reportsService';
import type { DashboardIndicator } from '../services/reportsService';
import type { Opportunity } from '../core/models/Opportunity';
import type { Ticket } from '../core/models/Ticket';
import { formatCurrency, getMonthYearString } from '../utils/formatters';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

export type ActiveTab = 'commercial' | 'support';
export type DatePeriod = 'all' | 'month' | 'quarter' | 'year' | 'custom';
export type CurrencyFilter = 'consolidado' | 'USD' | 'MXN';
export type ChartType = 'bar' | 'line' | 'pie' | 'table';

export interface DashboardFilters {
  activeTab: ActiveTab;
  selectedPipelineId: string;
  selectedHelpdeskId: string;
  selectedExecutiveId: string;
  datePeriod: DatePeriod;
  startDate: string;
  endDate: string;
  currencyFilter: CurrencyFilter;
  chart1Type: ChartType;
  chart2Type: ChartType;
  chart3Type: ChartType;
  tableSearch: string;
  currentPage: number;
  showFilters: boolean;
  selectedKpiId: string | null;
  selectedChartFilter: { chartKey: 'month' | 'stage' | 'priority' | 'type'; value: string } | null;
}

export interface DashboardSetters {
  setActiveTab: (v: ActiveTab) => void;
  setSelectedPipelineId: (v: string) => void;
  setSelectedHelpdeskId: (v: string) => void;
  setSelectedExecutiveId: (v: string) => void;
  setDatePeriod: (v: DatePeriod) => void;
  setStartDate: (v: string) => void;
  setEndDate: (v: string) => void;
  setCurrencyFilter: (v: CurrencyFilter) => void;
  setChart1Type: (v: ChartType) => void;
  setChart2Type: (v: ChartType) => void;
  setChart3Type: (v: ChartType) => void;
  setTableSearch: (v: string) => void;
  setCurrentPage: (v: number | ((prev: number) => number)) => void;
  setShowFilters: (v: boolean) => void;
  setSelectedKpiId: (v: string | null) => void;
  setSelectedChartFilter: (v: DashboardFilters['selectedChartFilter']) => void;
  handleSelectPeriod: (periodId: DatePeriod) => void;
  handleStartDateChange: (val: string) => void;
  handleEndDateChange: (val: string) => void;
  handleChartClick: (chartKey: 'month' | 'stage' | 'priority' | 'type', value: string) => void;
  handleExportPDF: () => Promise<void>;
  handleExportExcel: () => void;
}

interface DashboardData {
  indicators: DashboardIndicator[];
  pipelines: any[];
  helpdesks: any[];
  opportunities: Opportunity[];
  tickets: Ticket[];
  activities: any[];
  executives: any[];
}

export function useDashboard() {
  const { isAdmin } = useAuth();
  const { selectedTenant } = useConfigStore();
  const schemaName = selectedTenant?.schema_name;
  const [searchParams, setSearchParams] = useSearchParams();
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // ── Raw data ──
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  // ── Filters ──
  const [activeTab, setActiveTab] = useState<ActiveTab>('commercial');
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [selectedHelpdeskId, setSelectedHelpdeskId] = useState('');
  const [selectedExecutiveId, setSelectedExecutiveId] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [datePeriod, setDatePeriod] = useState<DatePeriod>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyFilter>('consolidado');
  const [selectedKpiId, setSelectedKpiId] = useState<string | null>(null);
  const [selectedChartFilter, setSelectedChartFilter] = useState<DashboardFilters['selectedChartFilter']>(null);
  const [chart1Type, setChart1Type] = useState<ChartType>('bar');
  const [chart2Type, setChart2Type] = useState<ChartType>('line');
  const [chart3Type, setChart3Type] = useState<ChartType>('pie');
  const [tableSearch, setTableSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // ── Reset interactive filters on tab/filter change ──
  useEffect(() => {
    setSelectedChartFilter(null);
    setSelectedKpiId(null);
    setTableSearch('');
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    setSelectedKpiId(null);
    setTableSearch('');
    setCurrentPage(1);
  }, [activeTab, selectedPipelineId, selectedHelpdeskId, selectedExecutiveId, datePeriod, startDate, endDate, currencyFilter]);

  // ── Fetch ──
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getDashboardData();
      const safePipelines = Array.isArray(res?.pipelines) ? res.pipelines : [];
      const safeHelpdesks = Array.isArray(res?.helpdesks) ? res.helpdesks : [];
      const safeOpps = Array.isArray(res?.opportunities) ? res.opportunities : [];
      const safeTickets = Array.isArray(res?.tickets) ? res.tickets : [];

      safeOpps.forEach((o: any) => {
        o._createdAtTime = o.createdAt ? new Date(o.createdAt).getTime() : 0;
        o._closureTime = o.estimated_closure_date ? new Date(o.estimated_closure_date).getTime() : 0;
      });
      safeTickets.forEach((t: any) => {
        t._fechaAperturaTime = t.fecha_apertura ? new Date(t.fecha_apertura).getTime() : 0;
      });

      const normalizedData: DashboardData = {
        indicators: Array.isArray(res?.indicators) ? res.indicators : [],
        pipelines: safePipelines,
        helpdesks: safeHelpdesks,
        opportunities: safeOpps,
        tickets: safeTickets,
        activities: Array.isArray(res?.activities) ? res.activities : [],
        executives: Array.isArray(res?.executives) ? res.executives : [],
      };

      setData(normalizedData);
      if (safePipelines.length > 0) setSelectedPipelineId(safePipelines[0].id);
      else setSelectedPipelineId('');
      if (safeHelpdesks.length > 0) setSelectedHelpdeskId(safeHelpdesks[0].id);
      else setSelectedHelpdeskId('');
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [schemaName]);

  // ── Apply query params once data loads ──
  useEffect(() => {
    if (!data) return;
    let changed = false;
    const qTab = searchParams.get('tab');
    if (qTab === 'commercial' || qTab === 'helpdesk') { setActiveTab(qTab === 'helpdesk' ? 'support' : 'commercial'); changed = true; }
    const qExec = searchParams.get('executive');
    if (qExec) { setSelectedExecutiveId(qExec); changed = true; }
    const qDateStart = searchParams.get('dateStart');
    const qDateEnd = searchParams.get('dateEnd');
    if (qDateStart || qDateEnd) {
      if (qDateStart) setStartDate(qDateStart);
      if (qDateEnd) setEndDate(qDateEnd);
      setDatePeriod('custom');
      changed = true;
    }
    const qPipeline = searchParams.get('pipeline');
    if (qPipeline) { setSelectedPipelineId(qPipeline); changed = true; }
    const qHelpdesk = searchParams.get('helpdesk');
    if (qHelpdesk) { setSelectedHelpdeskId(qHelpdesk); changed = true; }
    if (changed) setSearchParams({}, { replace: true });
  }, [data]);

  // ── Period helpers ──
  const handleSelectPeriod = (periodId: DatePeriod) => {
    setDatePeriod(periodId);
    if (periodId === 'all') { setStartDate(''); setEndDate(''); return; }
    if (periodId === 'custom') return;
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth();
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (periodId === 'month') { setStartDate(fmt(new Date(y,m,1))); setEndDate(fmt(new Date(y,m+1,0))); }
    else if (periodId === 'quarter') { const qm = Math.floor(m/3)*3; setStartDate(fmt(new Date(y,qm,1))); setEndDate(fmt(new Date(y,qm+3,0))); }
    else if (periodId === 'year') { setStartDate(fmt(new Date(y,0,1))); setEndDate(fmt(new Date(y,12,0))); }
  };
  const handleStartDateChange = (val: string) => { setStartDate(val); setDatePeriod(!val && !endDate ? 'all' : 'custom'); };
  const handleEndDateChange = (val: string) => { setEndDate(val); setDatePeriod(!startDate && !val ? 'all' : 'custom'); };
  const handleChartClick = (chartKey: 'month' | 'stage' | 'priority' | 'type', value: string) => {
    setSelectedChartFilter(prev => prev?.chartKey === chartKey && prev?.value === value ? null : { chartKey, value });
    setCurrentPage(1);
  };

  // ── Select options ──
  const pipelineOptions = useMemo(() => data?.pipelines.map(p => ({ value: p.id, label: p.strname })) ?? [], [data]);
  const helpdeskOptions = useMemo(() => data?.helpdesks.map(h => ({ value: h.id, label: h.strname })) ?? [], [data]);
  const executiveOptions = useMemo(() => {
    if (!data) return [];
    return [{ value: 'all', label: 'Todos los ejecutivos' }, ...data.executives.map(e => ({ value: e.id, label: `${e.username} (${e.role})` }))];
  }, [data]);
  const activeCurrency = useMemo(() => currencyFilter === 'USD' ? 'USD' : 'MXN', [currencyFilter]);

  // ── Filtered data ──
  const filteredOpps = useMemo(() => {
    if (!data) return [];
    let list = data.opportunities.filter(o => o.pipeline_id === selectedPipelineId);
    if (selectedExecutiveId !== 'all') list = list.filter(o => o.ejecutivo_id === selectedExecutiveId);
    if (currencyFilter === 'USD') list = list.filter(o => o.moneda === 'USD');
    else if (currencyFilter === 'MXN') list = list.filter(o => o.moneda === 'MXN');
    if (startDate || endDate) {
      const s = startDate ? new Date(startDate).getTime() : -Infinity;
      const e = endDate ? new Date(endDate).setHours(23,59,59,999) : Infinity;
      list = list.filter(o => { const t=(o as any)._createdAtTime||0; return t>=s && t<=e; });
    } else if (datePeriod !== 'all') {
      const now = new Date(), cy = now.getFullYear(), cm = now.getMonth();
      list = list.filter(o => {
        const d = o.createdAt ? new Date(o.createdAt) : null;
        if (!d) return false;
        if (datePeriod==='month') return d.getMonth()===cm && d.getFullYear()===cy;
        if (datePeriod==='quarter') { const diff=(cy-d.getFullYear())*12+cm-d.getMonth(); return diff>=0&&diff<3; }
        if (datePeriod==='year') return d.getFullYear()===cy;
        return true;
      });
    }
    return list;
  }, [data, selectedPipelineId, selectedExecutiveId, datePeriod, startDate, endDate, currencyFilter]);

  const filteredTickets = useMemo(() => {
    if (!data) return [];
    let list = data.tickets.filter(t => t.helpdesk_id === selectedHelpdeskId);
    if (selectedExecutiveId !== 'all') list = list.filter(t => t.responsable_id === selectedExecutiveId);
    if (startDate || endDate) {
      const s = startDate ? new Date(startDate).getTime() : -Infinity;
      const e = endDate ? new Date(endDate).setHours(23,59,59,999) : Infinity;
      list = list.filter(t => { const time=(t as any)._fechaAperturaTime||0; return time>=s && time<=e; });
    } else if (datePeriod !== 'all') {
      const now = new Date(), cy = now.getFullYear(), cm = now.getMonth();
      list = list.filter(t => {
        const d = t.fecha_apertura ? new Date(t.fecha_apertura) : null;
        if (!d) return false;
        if (datePeriod==='month') return d.getMonth()===cm && d.getFullYear()===cy;
        if (datePeriod==='quarter') { const diff=(cy-d.getFullYear())*12+cm-d.getMonth(); return diff>=0&&diff<3; }
        if (datePeriod==='year') return d.getFullYear()===cy;
        return true;
      });
    }
    return list;
  }, [data, selectedHelpdeskId, selectedExecutiveId, datePeriod, startDate, endDate]);

  const currentIndicators = useMemo(() => {
    if (!data) return [];
    return activeTab === 'commercial'
      ? data.indicators.filter(ind => ind.pipeline_id === selectedPipelineId)
      : data.indicators.filter(ind => ind.helpdesk_id === selectedHelpdeskId);
  }, [data, activeTab, selectedPipelineId, selectedHelpdeskId]);

  const kpiIndicators = useMemo(() => currentIndicators.filter(ind => !ind.title.startsWith('Gráfico:')), [currentIndicators]);

  const currentStages = useMemo(() => {
    if (!data) return [];
    if (activeTab === 'commercial') { const p = data.pipelines.find(p => p.id === selectedPipelineId); return p ? p.stages : []; }
    const h = data.helpdesks.find(h => h.id === selectedHelpdeskId); return h ? h.stages : [];
  }, [data, activeTab, selectedPipelineId, selectedHelpdeskId]);

  const showDashboardStagesMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    currentStages.forEach((s: any) => { map[s.id] = s.bln_show_dashboard !== false; });
    return map;
  }, [currentStages]);

  const visibleOpps = useMemo(() => filteredOpps.filter(o => showDashboardStagesMap[o.stage_id] !== false), [filteredOpps, showDashboardStagesMap]);
  const visibleTickets = useMemo(() => filteredTickets.filter(t => showDashboardStagesMap[t.stage_id] !== false), [filteredTickets, showDashboardStagesMap]);

  // ── KPI values ──
  const kpiValues = useMemo(() => {
    const values: Record<string, number> = {};
    currentIndicators.forEach(ind => {
      const stageSet = new Set(ind.stage_ids || []);
      if (activeTab === 'commercial') {
        const opps = visibleOpps.filter(o => stageSet.has(o.stage_id));
        values[ind.id!] = ind.type === 'sum'
          ? opps.reduce((sum, o) => { const a=Number(o.monto_total||0); return sum+(currencyFilter==='consolidado'&&o.moneda==='USD'?a*(o.tipoCambio&&o.tipoCambio>0?o.tipoCambio:1):a); }, 0)
          : opps.length;
      } else {
        values[ind.id!] = visibleTickets.filter(t => stageSet.has(t.stage_id)).length;
      }
    });
    return values;
  }, [currentIndicators, activeTab, visibleOpps, visibleTickets, currencyFilter]);

  // ── Table data ──
  const tableDataList = useMemo(() => {
    if (activeTab === 'commercial') {
      let list = visibleOpps;
      if (selectedKpiId) { const ind=currentIndicators.find(i=>i.id===selectedKpiId); if(ind){const s=new Set(ind.stage_ids||[]); list=list.filter(o=>s.has(o.stage_id));} }
      if (selectedChartFilter) {
        const {chartKey,value}=selectedChartFilter;
        if (chartKey==='stage') list=list.filter(o=>o.stage?.strname===value);
        else if (chartKey==='month') list=list.filter(o=>getMonthYearString(o.estimated_closure_date||o.createdAt)===value);
      }
      if (tableSearch.trim()) { const s=tableSearch.toLowerCase(); list=list.filter(o=>(o.nombre_proyecto||'').toLowerCase().includes(s)||(o.cliente?.nombre||'').toLowerCase().includes(s)||(o.cliente?.apellido||'').toLowerCase().includes(s)||(o.company?.nombre||'').toLowerCase().includes(s)||(o.stage?.strname||'').toLowerCase().includes(s)); }
      return list;
    } else {
      let list = visibleTickets;
      if (selectedKpiId) { const ind=currentIndicators.find(i=>i.id===selectedKpiId); if(ind){const s=new Set(ind.stage_ids||[]); list=list.filter(t=>s.has(t.stage_id));} }
      if (selectedChartFilter) {
        const {chartKey,value}=selectedChartFilter;
        if (chartKey==='stage') list=list.filter(t=>t.stage?.strname===value);
        else if (chartKey==='priority') list=list.filter(t=>(t.priority===3?'Alta':t.priority===2?'Media':'Baja')===value);
        else if (chartKey==='type') list=list.filter(t=>(t.tipo_incidencia||'Sin tipo')===value);
        else if (chartKey==='month') list=list.filter(t=>getMonthYearString(t.fecha_apertura)===value);
      }
      if (tableSearch.trim()) { const s=tableSearch.toLowerCase(); list=list.filter(t=>(t.strtitle||'').toLowerCase().includes(s)||(t.ticket_number||'').toString().includes(s)||(t.tipo_incidencia||'').toLowerCase().includes(s)||(t.cliente?.nombre||'').toLowerCase().includes(s)||(t.cliente?.apellido||'').toLowerCase().includes(s)||(t.stage?.strname||'').toLowerCase().includes(s)); }
      return list;
    }
  }, [activeTab, visibleOpps, visibleTickets, selectedKpiId, currentIndicators, selectedChartFilter, tableSearch]);

  const paginatedTableList = useMemo(() => tableDataList.slice((currentPage-1)*pageSize, currentPage*pageSize), [tableDataList, currentPage]);

  // ── Chart aggregations ──
  const openOppsByMonth = useMemo(() => {
    if (activeTab !== 'commercial') return [];
    const openInd = currentIndicators.find(i => i.title.toLowerCase().includes('abierta')||i.title.toLowerCase().includes('citas')||i.color==='blue'||i.color==='purple');
    const openIds = openInd ? new Set(openInd.stage_ids||[]) : null;
    const opps = visibleOpps.filter(o => openIds ? openIds.has(o.stage_id) : o.stage&&!['ganada','perdida','cancelada','standby'].includes(o.stage.strname.toLowerCase()));
    const counts: Record<string,number> = {};
    opps.forEach(o => { const k=getMonthYearString(o.estimated_closure_date); counts[k]=(counts[k]||0)+1; });
    return Object.entries(counts).map(([label,value])=>({label,value}));
  }, [activeTab, visibleOpps, currentIndicators]);

  const salesByMonth = useMemo(() => {
    if (activeTab !== 'commercial') return [];
    const salesInd = currentIndicators.find(i => i.type==='sum'||i.title.toLowerCase().includes('venta')||i.title.toLowerCase().includes('ganada')||i.color==='orange'||i.color==='green');
    const wonIds = salesInd ? new Set(salesInd.stage_ids||[]) : null;
    const wonOpps = visibleOpps.filter(o => wonIds ? wonIds.has(o.stage_id) : o.stage&&o.stage.strname.toLowerCase()==='ganada');
    const sums: Record<string,number> = {};
    wonOpps.forEach(o => { const k=getMonthYearString(o.estimated_closure_date||o.createdAt); const a=Number(o.monto_total||0); const v=currencyFilter==='consolidado'&&o.moneda==='USD'?a*(o.tipoCambio&&o.tipoCambio>0?o.tipoCambio:1):a; sums[k]=(sums[k]||0)+v; });
    return Object.entries(sums).map(([label,value])=>({label,value}));
  }, [activeTab, visibleOpps, currencyFilter, currentIndicators]);

  const oppsByStage = useMemo(() => {
    if (activeTab !== 'commercial') return [];
    const counts: Record<string,number> = {};
    visibleOpps.forEach(o => { if(o.stage) counts[o.stage.strname]=(counts[o.stage.strname]||0)+1; });
    return Object.entries(counts).map(([label,value])=>({label,value}));
  }, [activeTab, visibleOpps]);

  const ticketsOpenByMonth = useMemo(() => {
    if (activeTab !== 'support') return [];
    const ind = currentIndicators.find(i=>i.title==='Gráfico: Tickets Abiertos');
    const stageSet = ind?.stage_ids?.length ? new Set(ind.stage_ids) : null;
    const filtered = stageSet ? visibleTickets.filter(t=>stageSet.has(t.stage_id)) : visibleTickets;
    const sums: Record<string,number> = {};
    filtered.forEach(t=>{const k=getMonthYearString(t.fecha_apertura); sums[k]=(sums[k]||0)+1;});
    return Object.entries(sums).map(([label,value])=>({label,value}));
  }, [activeTab, visibleTickets, currentIndicators]);

  const ticketsClosedByMonth = useMemo(() => {
    if (activeTab !== 'support') return [];
    const ind = currentIndicators.find(i=>i.title==='Gráfico: Tickets Cerrados');
    const stageSet = ind?.stage_ids?.length ? new Set(ind.stage_ids) : null;
    if (!stageSet) return [];
    const filtered = visibleTickets.filter(t=>stageSet.has(t.stage_id));
    const sums: Record<string,number> = {};
    filtered.forEach(t=>{const k=getMonthYearString(t.fecha_apertura); sums[k]=(sums[k]||0)+1;});
    return Object.entries(sums).map(([label,value])=>({label,value}));
  }, [activeTab, visibleTickets, currentIndicators]);

  const ticketsCancelledByMonth = useMemo(() => {
    if (activeTab !== 'support') return [];
    const ind = currentIndicators.find(i=>i.title==='Gráfico: Tickets Cancelados');
    const stageSet = ind?.stage_ids?.length ? new Set(ind.stage_ids) : null;
    if (!stageSet) return [];
    const filtered = visibleTickets.filter(t=>stageSet.has(t.stage_id));
    const sums: Record<string,number> = {};
    filtered.forEach(t=>{const k=getMonthYearString(t.fecha_apertura); sums[k]=(sums[k]||0)+1;});
    return Object.entries(sums).map(([label,value])=>({label,value}));
  }, [activeTab, visibleTickets, currentIndicators]);

  // ── Period label helper ──
  const getPeriodLabel = () => {
    if (datePeriod === 'custom') return `(${startDate||'Mín'} a ${endDate||'Máx'})`;
    return datePeriod === 'month' ? '(Este Mes)' : datePeriod === 'quarter' ? '(Este Trimestre)' : datePeriod === 'year' ? '(Este Año)' : '(Todo)';
  };

  // ── KPI gradient helper ──
  const getKpiBgGradient = (color: string) => {
    const map: Record<string,string> = { blue:'from-blue-600 to-sky-400 text-white', green:'from-emerald-600 to-teal-400 text-white', purple:'from-violet-600 to-indigo-400 text-white', orange:'from-amber-500 to-orange-400 text-white', red:'from-rose-600 to-red-400 text-white' };
    return map[color] || 'from-slate-600 to-slate-400 text-white';
  };

  // ── Export PDF ──
  const handleExportPDF = async () => {
    try {
      const element = document.getElementById('dashboard-pdf-summary');
      const wrapper = document.getElementById('pdf-summary-wrapper');
      if (!element) return;
      if (wrapper) wrapper.setAttribute('style','height:auto!important;overflow:visible!important;position:absolute!important;top:-9999px!important;left:0!important;width:1120px!important;');
      await new Promise(r => setTimeout(r, 300));
      const canvas = await html2canvas(element, { scale:2, useCORS:true, logging:false, backgroundColor:'#f8fafc', windowWidth:1200, scrollX:0, scrollY:0 });
      if (wrapper) wrapper.setAttribute('style','height:0!important;overflow:hidden!important;position:relative!important;');
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation:'landscape', unit:'pt', format:'letter' });
      const pw = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight();
      const m = 20, cw = pw-m*2, ch = (canvas.height*cw)/canvas.width;
      pdf.addImage(imgData,'JPEG',m,m,cw,Math.min(ch,ph-m*2));
      if (tableDataList.length > 0) {
        pdf.addPage();
        pdf.setFontSize(14); pdf.setTextColor(40,40,40); pdf.text('Listado Detallado de Registros',30,40);
        pdf.setFontSize(8); pdf.setTextColor(100,100,100);
        pdf.text(`Filtros - Rango: ${startDate||'Mín'} a ${endDate||'Máx'} | Moneda: ${currencyFilter}`,30,55);
        if (activeTab === 'commercial') {
          autoTable(pdf, { head:[['Oportunidad','Cliente','Empresa','Ejecutivo','Etapa','Monto']], body:(tableDataList as Opportunity[]).map(o=>{const a=Number(o.monto_total||0);const d=currencyFilter==='consolidado'&&o.moneda==='USD'?formatCurrency(a*(o.tipoCambio&&o.tipoCambio>0?o.tipoCambio:1),'MXN'):formatCurrency(a,o.moneda);return[o.nombre_proyecto||'N/A',o.cliente?`${o.cliente.nombre} ${o.cliente.apellido}`:o.empresa||'N/A',o.company?.nombre||o.empresa||'N/A',o.ejecutivo?.username||'Sin asignar',o.stage?.strname||'N/A',d];}), startY:70, styles:{fontSize:7.5,cellPadding:5}, headStyles:{fillColor:[79,70,229],textColor:255}, alternateRowStyles:{fillColor:[248,250,252]} });
        } else {
          autoTable(pdf, { head:[['Nro Ticket','Asunto','Prioridad','Tipo','Cliente','Asignado a','Etapa']], body:(tableDataList as Ticket[]).map(t=>[`#${t.ticket_number.toString().padStart(5,'0')}`,t.strtitle||'N/A',t.priority===3?'Alta':t.priority===2?'Media':'Baja',t.tipo_incidencia||'Normal',t.cliente?`${t.cliente.nombre} ${t.cliente.apellido}`:t.contactName||'N/A',t.responsable?.username||'Sin asignar',t.stage?.strname||'N/A']), startY:70, styles:{fontSize:7.5,cellPadding:5}, headStyles:{fillColor:[79,70,229],textColor:255}, alternateRowStyles:{fillColor:[248,250,252]} });
        }
      }
      pdf.save(`Reporte_Dashboard_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (err) { console.error('Error al exportar PDF:', err); }
  };

  // ── Export Excel ──
  const handleExportExcel = () => {
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"/><style>body{font-family:Arial}.title{font-size:16px;font-weight:bold}.kpi-table,.data-table{border-collapse:collapse;width:100%}.kpi-table td,.kpi-table th,.data-table td,.data-table th{border:1px solid #e2e8f0;padding:8px;font-size:11px}.kpi-table th,.data-table th{background:#4f46e5;color:white;font-weight:bold}</style></head><body><div class="title">Reporte Dashboard - CRM Tibs</div><p>Generado: ${new Date().toLocaleString('es-MX')}</p><h3>KPIs</h3><table class="kpi-table"><thead><tr><th>Indicador</th><th>Operación</th><th>Valor</th></tr></thead><tbody>${currentIndicators.map(i=>{const v=kpiValues[i.id!]||0;return`<tr><td>${i.title}</td><td>${i.type==='sum'?`Suma (${activeCurrency})`:'Conteo'}</td><td>${i.type==='sum'?formatCurrency(v,activeCurrency):v}</td></tr>`;}).join('')}</tbody></table><h3>Registros</h3><table class="data-table"><thead>${activeTab==='commercial'?'<tr><th>Oportunidad</th><th>Cliente</th><th>Empresa</th><th>Ejecutivo</th><th>Etapa</th><th>Monto</th></tr>':'<tr><th>Nro Ticket</th><th>Asunto</th><th>Prioridad</th><th>Tipo</th><th>Cliente</th><th>Asignado a</th><th>Etapa</th></tr>'}</thead><tbody>${activeTab==='commercial'?(tableDataList as Opportunity[]).map(o=>{const a=Number(o.monto_total||0);const v=currencyFilter==='consolidado'&&o.moneda==='USD'?a*(o.tipoCambio||1):a;return`<tr><td>${o.nombre_proyecto||''}</td><td>${o.cliente?`${o.cliente.nombre} ${o.cliente.apellido||''}`.trim():o.empresa||''}</td><td>${o.company?.nombre||o.empresa||''}</td><td>${o.ejecutivo?.username||'Sin asignar'}</td><td>${o.stage?.strname||''}</td><td>${v.toFixed(2)}</td></tr>`;}).join(''):(tableDataList as Ticket[]).map(t=>`<tr><td>#${t.ticket_number.toString().padStart(5,'0')}</td><td>${t.strtitle||''}</td><td>${t.priority===3?'Alta':t.priority===2?'Media':'Baja'}</td><td>${t.tipo_incidencia||'Normal'}</td><td>${t.cliente?`${t.cliente.nombre} ${t.cliente.apellido||''}`.trim():t.contactName||''}</td><td>${t.responsable?.username||'Sin asignar'}</td><td>${t.stage?.strname||''}</td></tr>`).join('')}</tbody></table></body></html>`;
    const blob = new Blob(['\ufeff'+html],{type:'application/vnd.ms-excel;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Reporte_Dashboard_${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return {
    // data
    loading, data, isAdmin,
    // filters
    activeTab, selectedPipelineId, selectedHelpdeskId, selectedExecutiveId,
    showFilters, datePeriod, startDate, endDate, currencyFilter,
    selectedKpiId, selectedChartFilter,
    chart1Type, chart2Type, chart3Type, tableSearch, currentPage, pageSize,
    // setters
    setActiveTab, setSelectedPipelineId, setSelectedHelpdeskId, setSelectedExecutiveId,
    setShowFilters, setCurrencyFilter, setSelectedKpiId, setSelectedChartFilter,
    setChart1Type, setChart2Type, setChart3Type, setTableSearch, setCurrentPage,
    setStartDate, setEndDate,
    handleSelectPeriod, handleStartDateChange, handleEndDateChange, handleChartClick,
    handleExportPDF, handleExportExcel,
    // select options
    pipelineOptions, helpdeskOptions, executiveOptions, activeCurrency,
    // computed
    currentIndicators, kpiIndicators, kpiValues, visibleOpps, visibleTickets,
    tableDataList, paginatedTableList,
    openOppsByMonth, salesByMonth, oppsByStage,
    ticketsOpenByMonth, ticketsClosedByMonth, ticketsCancelledByMonth,
    getPeriodLabel, getKpiBgGradient,
    // refs
    searchDropdownRef,
  };
}
