import React, { useMemo } from 'react';
import { TrendingUp, Briefcase, LifeBuoy, FileText, FileSpreadsheet } from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import Loader from '../components/shared/Loader';
import KpiSection from '../components/Dashboard/KpiSection';
import SalesCharts from '../components/Dashboard/SalesCharts';
import DashboardFilterBar from '../components/Dashboard/DashboardFilterBar';
import RecordsTable from '../components/Dashboard/RecordsTable';
import PdfSummaryTemplate from '../components/Dashboard/PdfSummaryTemplate';

const DashboardPage: React.FC = () => {
  const db = useDashboard();

  // Build badges for UnifiedSearchBar
  const badges = useMemo(() => {
    const list: any[] = [];
    if (db.activeTab === 'commercial') {
      const p = db.pipelineOptions.find(o=>o.value===db.selectedPipelineId);
      if (p && db.selectedPipelineId) list.push({ id:'pipeline', label:`Pipeline: ${p.label}`, onRemove:()=>db.pipelineOptions.length>0&&db.setSelectedPipelineId(db.pipelineOptions[0].value) });
    } else {
      const h = db.helpdeskOptions.find(o=>o.value===db.selectedHelpdeskId);
      if (h && db.selectedHelpdeskId) list.push({ id:'helpdesk', label:`Mesa: ${h.label}`, onRemove:()=>db.helpdeskOptions.length>0&&db.setSelectedHelpdeskId(db.helpdeskOptions[0].value) });
    }
    if (db.selectedExecutiveId !== 'all') {
      const e = db.executiveOptions.find(o=>o.value===db.selectedExecutiveId);
      if (e) list.push({ id:'executive', label:`Ejecutivo: ${e.label}`, onRemove:()=>db.setSelectedExecutiveId('all') });
    }
    if (db.datePeriod !== 'all') {
      const l = db.datePeriod==='month'?'Mes':db.datePeriod==='quarter'?'Trimestre':db.datePeriod==='year'?'Año':`${db.startDate||'Mín'} a ${db.endDate||'Máx'}`;
      list.push({ id:'period', label:`Periodo: ${l}`, onRemove:()=>{ db.setStartDate(''); db.setEndDate(''); db.handleSelectPeriod('all'); } });
    }
    if (db.activeTab==='commercial' && db.currencyFilter!=='consolidado') {
      list.push({ id:'currency', label:`Moneda: ${db.currencyFilter}`, onRemove:()=>db.setCurrencyFilter('consolidado') });
    }
    if (db.selectedKpiId) {
      const ind = db.currentIndicators.find(i=>i.id===db.selectedKpiId);
      if (ind) list.push({ id:'kpi', label:`KPI: ${ind.title}`, onRemove:()=>db.setSelectedKpiId(null) });
    }
    if (db.selectedChartFilter) {
      list.push({ id:'chartFilter', label:`Gráfico: ${db.selectedChartFilter.value}`, onRemove:()=>db.setSelectedChartFilter(null) });
    }
    return list;
  }, [db.activeTab, db.selectedPipelineId, db.pipelineOptions, db.selectedHelpdeskId, db.helpdeskOptions, db.selectedExecutiveId, db.executiveOptions, db.datePeriod, db.startDate, db.endDate, db.currencyFilter, db.selectedKpiId, db.currentIndicators, db.selectedChartFilter]);

  const charts: Parameters<typeof SalesCharts>[0]['charts'] = [
    { title: db.activeTab==='commercial' ? `Oportunidades Abiertas por Mes de Cierre ${db.getPeriodLabel()}` : `Tickets Abiertos por Mes ${db.getPeriodLabel()}`, data: db.activeTab==='commercial'?db.openOppsByMonth:db.ticketsOpenByMonth, chartType:db.chart1Type, onTypeChange:db.setChart1Type, colorHex:'#4f46e5', colorGradId:'chart1Grad', isCurrency:false, onElementClick:(l)=>db.handleChartClick('month',l) },
    { title: db.activeTab==='commercial' ? `Ventas Ganadas por Mes ${db.getPeriodLabel()}` : `Tickets Cerrados por Mes ${db.getPeriodLabel()}`, data: db.activeTab==='commercial'?db.salesByMonth:db.ticketsClosedByMonth, chartType:db.chart2Type, onTypeChange:db.setChart2Type, colorHex:db.activeTab==='commercial'?'#f59e0b':'#10b981', colorGradId:'chart2Grad', isCurrency:db.activeTab==='commercial', onElementClick:(l)=>db.handleChartClick('month',l) },
    { title: db.activeTab==='commercial' ? `Distribución por Etapa ${db.getPeriodLabel()}` : `Tickets Cancelados por Mes ${db.getPeriodLabel()}`, data: db.activeTab==='commercial'?db.oppsByStage:db.ticketsCancelledByMonth, chartType:db.chart3Type, onTypeChange:db.setChart3Type, colorHex:db.activeTab==='commercial'?'#8b5cf6':'#f43f5e', colorGradId:'chart3Grad', isCurrency:false, onElementClick:(l)=>db.handleChartClick(db.activeTab==='commercial'?'stage':'month',l) },
  ];

  if (db.loading && !db.data) return <Loader />;

  return (
    <div className="flex flex-col gap-6 select-none max-w-7xl mx-auto px-1 sm:px-3">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <TrendingUp className="text-indigo-600" size={26} /> Dashboard de Reportes
          </h1>
          <p className="text-xs text-slate-500 mt-1">Analiza el rendimiento del embudo de ventas y la mesa de ayuda en tiempo real.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto self-stretch md:self-auto justify-between md:justify-end">
          <div className="flex gap-2">
            <button onClick={db.handleExportPDF} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer shadow-sm active:scale-[0.98]" title="Exportar PDF">
              <FileText size={15} className="text-rose-500" /> Exportar PDF
            </button>
            <button onClick={db.handleExportExcel} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer shadow-sm active:scale-[0.98]" title="Exportar Excel">
              <FileSpreadsheet size={15} className="text-emerald-500" /> Exportar Excel
            </button>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            {([{ id:'commercial', label:'Resumen Comercial', icon:<Briefcase size={16}/> }, { id:'support', label:'Mesa de Ayuda', icon:<LifeBuoy size={16}/> }] as const).map(tab => (
              <button key={tab.id} onClick={() => db.setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-2 text-xs font-black uppercase rounded-xl transition-all duration-200 cursor-pointer ${db.activeTab===tab.id?'bg-white text-indigo-600 shadow-lg shadow-indigo-500/10':'text-slate-500 hover:text-slate-800'}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div id="dashboard-report-content" className="flex flex-col gap-6">
        <DashboardFilterBar
          searchDropdownRef={db.searchDropdownRef}
          activeTab={db.activeTab}
          tableSearch={db.tableSearch}
          onSearchChange={db.setTableSearch}
          badges={badges}
          showFilters={db.showFilters}
          setShowFilters={db.setShowFilters}
          pipelineOptions={db.pipelineOptions}
          helpdeskOptions={db.helpdeskOptions}
          executiveOptions={db.executiveOptions}
          selectedPipelineId={db.selectedPipelineId}
          selectedHelpdeskId={db.selectedHelpdeskId}
          selectedExecutiveId={db.selectedExecutiveId}
          onPipelineChange={db.setSelectedPipelineId}
          onHelpdeskChange={db.setSelectedHelpdeskId}
          onExecutiveChange={db.setSelectedExecutiveId}
          isAdmin={db.isAdmin}
          datePeriod={db.datePeriod}
          startDate={db.startDate}
          endDate={db.endDate}
          onSelectPeriod={db.handleSelectPeriod}
          onStartDateChange={db.handleStartDateChange}
          onEndDateChange={db.handleEndDateChange}
          currencyFilter={db.currencyFilter}
          onCurrencyChange={db.setCurrencyFilter}
          onReset={() => { db.setSelectedExecutiveId('all'); db.setStartDate(''); db.setEndDate(''); db.handleSelectPeriod('all'); db.setCurrencyFilter('consolidado'); db.setShowFilters(false); }}
        />

        <KpiSection
          loading={db.loading}
          indicators={db.kpiIndicators}
          kpiValues={db.kpiValues}
          activeCurrency={db.activeCurrency}
          selectedKpiId={db.selectedKpiId}
          onKpiClick={db.setSelectedKpiId}
          getKpiBgGradient={db.getKpiBgGradient}
        />

        <SalesCharts loading={db.loading} charts={charts} activeCurrency={db.activeCurrency} />

        <RecordsTable
          activeTab={db.activeTab}
          tableDataList={db.tableDataList as any}
          paginatedList={db.paginatedTableList as any}
          tableSearch={db.tableSearch}
          onSearchChange={db.setTableSearch}
          selectedKpiId={db.selectedKpiId}
          selectedChartFilter={db.selectedChartFilter}
          currentIndicators={db.currentIndicators}
          onClearKpi={() => db.setSelectedKpiId(null)}
          currentPage={db.currentPage}
          pageSize={db.pageSize}
          onPageChange={db.setCurrentPage}
          currencyFilter={db.currencyFilter}
          activeCurrency={db.activeCurrency}
        />
      </div>

      <PdfSummaryTemplate
        activeTab={db.activeTab}
        kpiIndicators={db.kpiIndicators}
        kpiValues={db.kpiValues}
        activeCurrency={db.activeCurrency}
        chart1Type={db.chart1Type}
        chart2Type={db.chart2Type}
        chart3Type={db.chart3Type}
        openOppsByMonth={db.openOppsByMonth}
        salesByMonth={db.salesByMonth}
        oppsByStage={db.oppsByStage}
        ticketsOpenByMonth={db.ticketsOpenByMonth}
        ticketsClosedByMonth={db.ticketsClosedByMonth}
        ticketsCancelledByMonth={db.ticketsCancelledByMonth}
        pipelineLabel={db.pipelineOptions.find(p=>p.value===db.selectedPipelineId)?.label||'Todos'}
        helpdeskLabel={db.helpdeskOptions.find(h=>h.value===db.selectedHelpdeskId)?.label||'Todos'}
        executiveLabel={db.selectedExecutiveId==='all'?'Todos los ejecutivos':db.executiveOptions.find(e=>e.value===db.selectedExecutiveId)?.label||'Todos'}
        periodLabel={db.getPeriodLabel()}
        currencyFilter={db.currencyFilter}
        startDate={db.startDate}
        endDate={db.endDate}
      />
    </div>
  );
};

export default DashboardPage;
