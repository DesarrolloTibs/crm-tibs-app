import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getDashboardData } from '../services/reportsService';
import type { DashboardIndicator } from '../services/reportsService';
import type { Opportunity } from '../core/models/Opportunity';
import type { Ticket } from '../core/models/Ticket';
import type { Activity } from '../core/models/Activity';
import {
  TrendingUp,
  Briefcase,
  AlertCircle,
  BarChart3,
  PieChart,
  Table as TableIcon,
  LifeBuoy,
  ClipboardList,
  Search,
  FileSpreadsheet,
  FileText,
  ArrowRight
} from 'lucide-react';
import Select from '../components/shared/Select';
import Loader from '../components/Loader/Loader';
import Input from '../components/shared/Input';
import UnifiedSearchBar from '../components/shared/UnifiedSearchBar';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';

// Utility for currency formatting
const formatCurrency = (amount: number, currency = 'MXN') => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Date helper to parse and format month
const getMonthYearString = (dateStr?: string | Date) => {
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
    const formatter = new Intl.DateTimeFormat('es-MX', { month: 'short', year: 'numeric' });
    return formatter.format(d).toUpperCase();
  } catch {
    return 'Sin fecha';
  }
};

interface VisualChartProps {
  type: 'bar' | 'line' | 'pie' | 'table';
  data: { label: string; value: number }[];
  colorHex: string;
  colorGradId: string;
  isCurrency: boolean;
  activeCurrency: string;
  onElementClick?: (label: string) => void;
}

const VisualChart: React.FC<VisualChartProps> = ({
  type,
  data,
  colorHex,
  isCurrency,
  activeCurrency,
  onElementClick
}) => {
  if (data.length === 0) {
    return (
      <div className="flex justify-center items-center h-48 text-slate-400 text-xs">
        Sin datos disponibles
      </div>
    );
  }

  const renderValue = (val: number) => {
    return isCurrency ? formatCurrency(val, activeCurrency) : val;
  };

  switch (type) {
    case 'table':
      return (
        <div className="overflow-auto max-h-48">
          <table className="w-full text-left text-xs font-semibold text-slate-700">
            <thead className="bg-slate-50 text-[10px] text-slate-400 font-black uppercase">
              <tr>
                <th className="p-2.5 rounded-l-xl">Etiqueta</th>
                <th className="p-2.5 rounded-r-xl text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr
                  key={idx}
                  className="border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer select-none transition-colors"
                  onClick={() => onElementClick?.(item.label)}
                >
                  <td className="p-2.5 font-bold text-slate-800">{item.label}</td>
                  <td className="p-2.5 text-right font-black text-slate-700">{renderValue(item.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'bar':
      return (
        <div style={{ width: '100%', height: '192px', display: 'flex', alignItems: 'flex-end', boxSizing: 'border-box' }}>
          <svg style={{ width: '100%', height: '100%', display: 'block' }} viewBox="0 0 300 150">
            <line x1="20" y1="20" x2="290" y2="20" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="20" y1="65" x2="290" y2="65" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="20" y1="110" x2="290" y2="110" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="20" y1="130" x2="290" y2="130" stroke="#94a3b8" strokeWidth="1.5" />

            {data.map((item, idx) => {
              const totalBars = data.length;
              const maxVal = Math.max(...data.map(i => i.value), 1);
              const barWidth = Math.min(30, 200 / totalBars);
              const barGap = (250 - barWidth * totalBars) / (totalBars + 1);
              
              const x = 30 + barGap + idx * (barWidth + barGap);
              const height = (item.value / maxVal) * 100;
              const y = 130 - height;

              return (
                <g
                  key={idx}
                  className="group cursor-pointer"
                  onClick={() => onElementClick?.(item.label)}
                >
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={height}
                    fill={colorHex}
                    rx="4"
                    className="transition-all duration-300 hover:opacity-85 hover:fill-indigo-500"
                  />
                  <text
                    x={x + barWidth / 2}
                    y="142"
                    textAnchor="middle"
                    fontSize="8"
                    fontWeight="bold"
                    fill="#64748b"
                  >
                    {item.label}
                  </text>
                  <text
                    x={x + barWidth / 2}
                    y={y - 5}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="black"
                    fill={colorHex}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    {renderValue(item.value)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      );

    case 'line':
      return (
        <div style={{ width: '100%', height: '192px', display: 'flex', alignItems: 'flex-end', boxSizing: 'border-box' }}>
          <svg style={{ width: '100%', height: '100%', display: 'block' }} viewBox="0 0 300 150">
            <line x1="20" y1="20" x2="290" y2="20" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="20" y1="65" x2="290" y2="65" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="20" y1="110" x2="290" y2="110" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="20" y1="130" x2="290" y2="130" stroke="#94a3b8" strokeWidth="1.5" />

            {(() => {
              const totalPoints = data.length;
              const maxVal = Math.max(...data.map(i => i.value), 1);
              const xStep = totalPoints > 1 ? 240 / (totalPoints - 1) : 240;
              
              const points = data.map((item, idx) => {
                const x = totalPoints === 1 ? 150 : 30 + idx * xStep;
                const height = (item.value / maxVal) * 100;
                const y = 130 - height;
                return { x, y, label: item.label, value: item.value };
              });

              const linePath = totalPoints === 1
                ? `M 30 ${points[0].y} L 270 ${points[0].y}`
                : points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
              const areaPath = totalPoints > 1
                ? `${linePath} L ${points[totalPoints - 1].x} 130 L ${points[0].x} 130 Z`
                : totalPoints === 1
                  ? `M 30 ${points[0].y} L 270 ${points[0].y} L 270 130 L 30 130 Z`
                  : '';

              return (
                <g>
                  {areaPath && <path d={areaPath} fill={colorHex} fillOpacity="0.12" />}
                  <path d={linePath} fill="none" stroke={colorHex} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  
                  {points.map((p, idx) => (
                    <g
                      key={idx}
                      className="group cursor-pointer"
                      onClick={() => onElementClick?.(p.label)}
                    >
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="5"
                        fill="#ffffff"
                        stroke={colorHex}
                        strokeWidth="2.5"
                        className="cursor-pointer transition-all hover:r-6 hover:fill-indigo-500"
                      />
                      <text
                        x={p.x}
                        y="142"
                        textAnchor="middle"
                        fontSize="8"
                        fontWeight="bold"
                        fill="#64748b"
                      >
                        {p.label}
                      </text>
                      <text
                        x={p.x}
                        y={p.y - 8}
                        textAnchor="middle"
                        fontSize="8.5"
                        fontWeight="black"
                        fill={colorHex}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        {renderValue(p.value)}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })()}
          </svg>
        </div>
      );

    case 'pie':
      return (
        <div style={{ width: '100%', height: '192px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
          <svg style={{ width: '160px', height: '160px', flexShrink: 0, display: 'block' }} viewBox="0 0 100 100">
            {(() => {
              const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
              let accumulatedAngle = 0;
              const colors = ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#6366f1', '#14b8a6'];

              return data.map((item, idx) => {
                const percentage = item.value / total;
                const angle = percentage * 360;
                const color = colors[idx % colors.length];

                if (angle === 0) return null;

                // If slice is 100% (only 1 item has positive value), render a clean SVG circle element directly
                if (percentage >= 0.999) {
                  return (
                    <g
                      key={idx}
                      className="group cursor-pointer"
                      onClick={() => onElementClick?.(item.label)}
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="35"
                        fill="none"
                        stroke={color}
                        strokeWidth="12"
                        className="transition-all duration-300 hover:stroke-[15]"
                      />
                      <title>{`${item.label}: ${renderValue(item.value)} (100%)`}</title>
                    </g>
                  );
                }

                const x1 = 50 + 35 * Math.cos((accumulatedAngle - 90) * Math.PI / 180);
                const y1 = 50 + 35 * Math.sin((accumulatedAngle - 90) * Math.PI / 180);
                
                accumulatedAngle += angle;

                const x2 = 50 + 35 * Math.cos((accumulatedAngle - 90) * Math.PI / 180);
                const y2 = 50 + 35 * Math.sin((accumulatedAngle - 90) * Math.PI / 180);
                const largeArc = angle > 180 ? 1 : 0;

                const pathData = `M ${x1} ${y1} A 35 35 0 ${largeArc} 1 ${x2} ${y2}`;

                return (
                  <g
                    key={idx}
                    className="group cursor-pointer"
                    onClick={() => onElementClick?.(item.label)}
                  >
                    <path
                      d={pathData}
                      fill="none"
                      stroke={color}
                      strokeWidth="12"
                      className="transition-all duration-300 hover:stroke-[15]"
                    />
                    <title>{`${item.label}: ${renderValue(item.value)} (${(percentage * 100).toFixed(0)}%)`}</title>
                  </g>
                );
              });
            })()}
            <circle cx="50" cy="50" r="23" fill="#ffffff" />
          </svg>
          <div className="overflow-y-auto max-h-36 pl-3" style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {data.map((item, idx) => {
              const colors = ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#6366f1', '#14b8a6'];
              const color = colors[idx % colors.length];
              return (
                <div
                  key={idx}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '18px', lineHeight: '18px', boxSizing: 'border-box' }}
                  className="cursor-pointer hover:bg-slate-50 rounded px-1 transition-all select-none"
                  onClick={() => onElementClick?.(item.label)}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, display: 'inline-block', flexShrink: 0 }}></span>
                  <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 'bold', display: 'inline-block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '90px' }}>
                    {item.label}
                  </span>
                  <span style={{ fontSize: '9.5px', color: '#1e293b', fontWeight: 900, display: 'inline-block', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    ({renderValue(item.value)})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );

    default:
      return null;
  }
};

export const DashboardPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  
  // Data State
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    indicators: DashboardIndicator[];
    pipelines: any[];
    helpdesks: any[];
    opportunities: Opportunity[];
    tickets: Ticket[];
    activities: Activity[];
    executives: any[];
  } | null>(null);

  // Tabs and Filters
  const [activeTab, setActiveTab] = useState<'commercial' | 'support'>('commercial');
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [selectedHelpdeskId, setSelectedHelpdeskId] = useState<string>('');
  const [selectedExecutiveId, setSelectedExecutiveId] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const [datePeriod, setDatePeriod] = useState<'all' | 'month' | 'quarter' | 'year' | 'custom'>('all');

  // Interactive selected KPI card filter
  const [selectedKpiId, setSelectedKpiId] = useState<string | null>(null);

  // Interactive selected chart slice/bar drill-down filter
  const [selectedChartFilter, setSelectedChartFilter] = useState<{ chartKey: 'month' | 'stage' | 'priority' | 'type'; value: string } | null>(null);

  const handleChartClick = (chartKey: 'month' | 'stage' | 'priority' | 'type', value: string) => {
    setSelectedChartFilter(prev => {
      if (prev?.chartKey === chartKey && prev?.value === value) {
        return null; // Toggle off if clicked again
      }
      return { chartKey, value };
    });
    setCurrentPage(1);
  };

  // Reset interactive filters when active tab changes
  useEffect(() => {
    setSelectedChartFilter(null);
    setSelectedKpiId(null);
    setTableSearch('');
    setCurrentPage(1);
  }, [activeTab]);

  // Chart types ('bar' | 'line' | 'pie' | 'table')
  const [chart1Type, setChart1Type] = useState<'bar' | 'line' | 'pie' | 'table'>('bar');
  const [chart2Type, setChart2Type] = useState<'bar' | 'line' | 'pie' | 'table'>('line');
  const [chart3Type, setChart3Type] = useState<'bar' | 'line' | 'pie' | 'table'>('pie');

  // Custom date range states
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Currency filter state ('consolidado' | 'USD' | 'MXN')
  const [currencyFilter, setCurrencyFilter] = useState<'consolidado' | 'USD' | 'MXN'>('consolidado');

  // Detail table search term
  const [tableSearch, setTableSearch] = useState('');

  // Pagination for detailed records table (optimization for thousands of rows)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Helper to dynamically render current active period filter as suffix to titles
  const getPeriodLabel = () => {
    if (datePeriod === 'custom') {
      return `(${startDate || 'Mín'} a ${endDate || 'Máx'})`;
    }
    switch (datePeriod) {
      case 'month':
        return '(Este Mes)';
      case 'quarter':
        return '(Este Trimestre)';
      case 'year':
        return '(Este Año)';
      default:
        return '(Todo)';
    }
  };

  // Helper to calculate start/end dates for predefined periods automatically
  const handleSelectPeriod = (periodId: 'all' | 'month' | 'quarter' | 'year' | 'custom') => {
    setDatePeriod(periodId);
    if (periodId === 'all') {
      setStartDate('');
      setEndDate('');
      return;
    }
    if (periodId === 'custom') {
      return;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    let start = '';
    let end = '';

    const formatToISODate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    if (periodId === 'month') {
      const firstDay = new Date(currentYear, currentMonth, 1);
      const lastDay = new Date(currentYear, currentMonth + 1, 0);
      start = formatToISODate(firstDay);
      end = formatToISODate(lastDay);
    } else if (periodId === 'quarter') {
      const currentQuarter = Math.floor(currentMonth / 3); // 0 to 3
      const firstMonth = currentQuarter * 3;
      const lastMonth = firstMonth + 3;
      const firstDay = new Date(currentYear, firstMonth, 1);
      const lastDay = new Date(currentYear, lastMonth, 0);
      start = formatToISODate(firstDay);
      end = formatToISODate(lastDay);
    } else if (periodId === 'year') {
      const firstDay = new Date(currentYear, 0, 1);
      const lastDay = new Date(currentYear, 12, 0);
      start = formatToISODate(firstDay);
      end = formatToISODate(lastDay);
    }

    setStartDate(start);
    setEndDate(end);
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (!val && !endDate) {
      setDatePeriod('all');
    } else {
      setDatePeriod('custom');
    }
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    if (!startDate && !val) {
      setDatePeriod('all');
    } else {
      setDatePeriod('custom');
    }
  };

  // Active currency symbol based on filter selection
  const activeCurrency = useMemo(() => {
    return currencyFilter === 'USD' ? 'USD' : 'MXN';
  }, [currencyFilter]);

  // Options for shared Select components
  const pipelineOptions = useMemo(() => {
    if (!data) return [];
    return data.pipelines.map(p => ({ value: p.id, label: p.strname }));
  }, [data]);

  const helpdeskOptions = useMemo(() => {
    if (!data) return [];
    return data.helpdesks.map(h => ({ value: h.id, label: h.strname }));
  }, [data]);

  const executiveOptions = useMemo(() => {
    if (!data) return [];
    const list = data.executives.map(exec => ({
      value: exec.id,
      label: `${exec.username} (${exec.role})`
    }));
    return [{ value: 'all', label: 'Todos los ejecutivos' }, ...list];
  }, [data]);

  // UnifiedSearchBar filter badges definition
  const badges = useMemo(() => {
    const list: any[] = [];
    
    // 1. Pipeline or Helpdesk badge
    if (activeTab === 'commercial') {
      const pOpt = pipelineOptions.find(o => o.value === selectedPipelineId);
      if (pOpt && selectedPipelineId) {
        list.push({
          id: 'pipeline',
          label: `Pipeline: ${pOpt.label}`,
          icon: <Briefcase size={10} />,
          onRemove: () => {
            if (pipelineOptions.length > 0) {
              setSelectedPipelineId(pipelineOptions[0].value);
            }
          }
        });
      }
    } else {
      const hOpt = helpdeskOptions.find(o => o.value === selectedHelpdeskId);
      if (hOpt && selectedHelpdeskId) {
        list.push({
          id: 'helpdesk',
          label: `Mesa: ${hOpt.label}`,
          icon: <LifeBuoy size={10} />,
          onRemove: () => {
            if (helpdeskOptions.length > 0) {
              setSelectedHelpdeskId(helpdeskOptions[0].value);
            }
          }
        });
      }
    }

    // 2. Executive Badge
    if (selectedExecutiveId !== 'all') {
      const eOpt = executiveOptions.find(o => o.value === selectedExecutiveId);
      if (eOpt) {
        list.push({
          id: 'executive',
          label: `Ejecutivo: ${eOpt.label}`,
          icon: <Search size={10} />,
          onRemove: () => setSelectedExecutiveId('all')
        });
      }
    }

    // 3. Date Period / Range Badge
    if (datePeriod !== 'all') {
      let label = '';
      if (datePeriod === 'month') label = 'Mes';
      else if (datePeriod === 'quarter') label = 'Trimestre';
      else if (datePeriod === 'year') label = 'Año';
      else if (datePeriod === 'custom') label = `${startDate || 'Mín'} a ${endDate || 'Máx'}`;

      list.push({
        id: 'period',
        label: `Periodo: ${label}`,
        icon: <ClipboardList size={10} />,
        onRemove: () => {
          setStartDate('');
          setEndDate('');
          setDatePeriod('all');
        }
      });
    }

    // 4. Currency Filter Badge (only commercial)
    if (activeTab === 'commercial' && currencyFilter !== 'consolidado') {
      list.push({
        id: 'currency',
        label: `Moneda: ${currencyFilter}`,
        icon: <TrendingUp size={10} />,
        onRemove: () => setCurrencyFilter('consolidado')
      });
    }

    // 5. KPI Indicator Filter Badge
    if (selectedKpiId) {
      const ind = currentIndicators.find(i => i.id === selectedKpiId);
      if (ind) {
        list.push({
          id: 'kpi',
          label: `Tarjeta KPI: ${ind.title}`,
          icon: <Briefcase size={10} />,
          onRemove: () => setSelectedKpiId(null)
        });
      }
    }

    // 6. Chart Drill-down Filter Badge
    if (selectedChartFilter) {
      list.push({
        id: 'chartFilter',
        label: `Gráfico: ${selectedChartFilter.value}`,
        icon: <TrendingUp size={10} />,
        onRemove: () => setSelectedChartFilter(null)
      });
    }

    return list;
  }, [
    activeTab,
    selectedPipelineId,
    pipelineOptions,
    selectedHelpdeskId,
    helpdeskOptions,
    selectedExecutiveId,
    executiveOptions,
    datePeriod,
    startDate,
    endDate,
    currencyFilter
  ]);

  // Fetch Dashboard Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getDashboardData();

      // Pre-calculate timestamps to optimize massive calculations
      if (res.opportunities) {
        res.opportunities.forEach((o: any) => {
          o._createdAtTime = o.createdAt ? new Date(o.createdAt).getTime() : 0;
          o._closureTime = o.estimated_closure_date ? new Date(o.estimated_closure_date).getTime() : 0;
        });
      }
      if (res.tickets) {
        res.tickets.forEach((t: any) => {
          t._fechaAperturaTime = t.fecha_apertura ? new Date(t.fecha_apertura).getTime() : 0;
        });
      }

      setData(res);

      if (res.pipelines.length > 0) {
        setSelectedPipelineId(res.pipelines[0].id);
      }
      if (res.helpdesks.length > 0) {
        setSelectedHelpdeskId(res.helpdesks[0].id);
      }
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Export to PDF (visual layout with charts)
  const handleExportPDF = async () => {
    try {
      const element = document.getElementById('dashboard-pdf-summary');
      const wrapper = document.getElementById('pdf-summary-wrapper');
      if (!element) return;

      // Temporarily expand the wrapper from height 0 to auto, and place it absolutely offscreen
      if (wrapper) {
        wrapper.setAttribute('style', 'height: auto !important; overflow: visible !important; position: absolute !important; top: -9999px !important; left: 0 !important; width: 1120px !important;');
      }

      // Add a small delay to let browser re-layout SVGs and flex items with active dimensions
      await new Promise((resolve) => setTimeout(resolve, 300));

      const canvas = await html2canvas(element, {
        scale: 2, // high quality
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc',
        windowWidth: 1200,
        scrollX: 0,
        scrollY: 0
      });
      
      // Restore wrapper back to hidden height 0 layout
      if (wrapper) {
        wrapper.setAttribute('style', 'height: 0 !important; overflow: hidden !important; position: relative !important;');
      }
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // Landscape Letter PDF layout: Width = 792 pt, Height = 612 pt
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'letter'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 20;
      const contentWidth = pdfWidth - (margin * 2);
      const contentHeight = (canvas.height * contentWidth) / canvas.width;
      
      // Page 1: Visual summary with KPIs and Charts
      pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, Math.min(contentHeight, pdfHeight - (margin * 2)));
      
      // Page 2: Detailed Table data (formatted clean using autoTable)
      if (tableDataList.length > 0) {
        pdf.addPage();
        
        pdf.setFontSize(14);
        pdf.setTextColor(40, 40, 40);
        pdf.text('Listado Detallado de Registros', 30, 40);
        
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Filtros aplicados - Rango de fechas: ${startDate || 'Mínima'} a ${endDate || 'Máxima'} | Moneda: ${currencyFilter}`, 30, 55);

        if (activeTab === 'commercial') {
          const headers = ['Oportunidad / Proyecto', 'Cliente', 'Empresa', 'Ejecutivo', 'Etapa', 'Monto'];
          const rows = (tableDataList as Opportunity[]).map((opp) => {
            const amount = Number(opp.monto_total || 0);
            let displayAmount = '';
            if (currencyFilter === 'consolidado' && opp.moneda === 'USD') {
              const rate = opp.tipoCambio && opp.tipoCambio > 0 ? opp.tipoCambio : 1;
              displayAmount = formatCurrency(amount * rate, 'MXN');
            } else {
              displayAmount = formatCurrency(amount, opp.moneda);
            }
            return [
              opp.nombre_proyecto || 'N/A',
              opp.cliente ? `${opp.cliente.nombre} ${opp.cliente.apellido}` : opp.empresa || 'N/A',
              opp.company?.nombre || opp.empresa || 'N/A',
              opp.ejecutivo?.username || 'Sin asignar',
              opp.stage?.strname || 'N/A',
              displayAmount
            ];
          });
          
          autoTable(pdf, {
            head: [headers],
            body: rows,
            startY: 70,
            styles: { fontSize: 7.5, cellPadding: 5 },
            headStyles: { fillColor: [79, 70, 229], textColor: 255 }, // indigo-600
            alternateRowStyles: { fillColor: [248, 250, 252] },
          });
        } else {
          const headers = ['Nro Ticket', 'Asunto', 'Prioridad', 'Tipo Incidencia', 'Cliente', 'Asignado a', 'Etapa'];
          const rows = (tableDataList as Ticket[]).map((t) => {
            const priorityStr = t.priority === 3 ? 'Alta' : t.priority === 2 ? 'Media' : 'Baja';
            return [
              `#${t.ticket_number.toString().padStart(5, '0')}`,
              t.strtitle || 'N/A',
              priorityStr,
              t.tipo_incidencia || 'Normal',
              t.cliente ? `${t.cliente.nombre} ${t.cliente.apellido}` : t.contactName || 'N/A',
              t.responsable?.username || 'Sin asignar',
              t.stage?.strname || 'N/A'
            ];
          });

          autoTable(pdf, {
            head: [headers],
            body: rows,
            startY: 70,
            styles: { fontSize: 7.5, cellPadding: 5 },
            headStyles: { fillColor: [79, 70, 229], textColor: 255 }, // indigo-600
            alternateRowStyles: { fillColor: [248, 250, 252] },
          });
        }
      }

      pdf.save(`Reporte_Dashboard_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Error al exportar PDF:', err);
    }
  };

  // 2. Export to Excel (.xls HTML table formatting)
  const handleExportExcel = () => {
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8"/>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Reporte Dashboard</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Arial, sans-serif; }
          .title { font-size: 16px; font-weight: bold; color: #1e3a8a; padding: 10px 0; }
          .meta { font-size: 10px; color: #64748b; margin-bottom: 15px; }
          .filter-table, .kpi-table, .data-table { border-collapse: collapse; margin-bottom: 20px; width: 100%; }
          .filter-table td, .kpi-table td, .kpi-table th, .data-table td, .data-table th { border: 1px solid #e2e8f0; padding: 8px; font-size: 11px; }
          .kpi-table th, .data-table th { background-color: #4f46e5; color: white; font-weight: bold; text-align: left; }
          .kpi-value { font-weight: bold; color: #4f46e5; }
        </style>
      </head>
      <body>
        <div class="title">Reporte de Dashboard - CRM Tibs</div>
        <div class="meta">Generado el: ${new Date().toLocaleString('es-MX')}</div>
        
        <h3>Filtros Aplicados</h3>
        <table class="filter-table">
          <tr><td><b>Módulo:</b></td><td>${activeTab === 'commercial' ? 'Comercial' : 'Mesa de Ayuda'}</td></tr>
          <tr><td><b>Pipeline/Mesa:</b></td><td>${activeTab === 'commercial' ? (data?.pipelines.find(p => p.id === selectedPipelineId)?.strname || '') : (data?.helpdesks.find(h => h.id === selectedHelpdeskId)?.strname || '')}</td></tr>
          <tr><td><b>Ejecutivo:</b></td><td>${selectedExecutiveId === 'all' ? 'Todos' : (data?.executives.find(e => e.id === selectedExecutiveId)?.username || '')}</td></tr>
          <tr><td><b>Filtro de Moneda:</b></td><td>${activeTab === 'commercial' ? (currencyFilter === 'consolidado' ? 'Consolidado en Pesos (MXN)' : currencyFilter) : 'N/A'}</td></tr>
          <tr><td><b>Fecha Inicio:</b></td><td>${startDate || 'No especificada'}</td></tr>
          <tr><td><b>Fecha Fin:</b></td><td>${endDate || 'No especificada'}</td></tr>
        </table>
        
        <h3>Resumen de Indicadores KPI</h3>
        <table class="kpi-table">
          <thead>
            <tr>
              <th>Indicador</th>
              <th>Operación</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            ${currentIndicators.map(ind => {
              const value = kpiValues[ind.id!] || 0;
              const display = ind.type === 'sum' ? formatCurrency(value, activeCurrency) : value;
              return `
                <tr>
                  <td>${ind.title}</td>
                  <td>${ind.type === 'sum' ? `Suma de Importes (${activeCurrency})` : 'Conteo'}</td>
                  <td class="kpi-value">${display}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <h3>Listado de Registros Activos</h3>
        <table class="data-table">
          <thead>
            ${activeTab === 'commercial' ? `
              <tr>
                <th>Oportunidad / Proyecto</th>
                <th>Cliente</th>
                <th>Empresa</th>
                <th>Ejecutivo</th>
                <th>Etapa</th>
                <th>Monto (${activeCurrency})</th>
              </tr>
            ` : `
              <tr>
                <th>Nro Ticket</th>
                <th>Asunto</th>
                <th>Prioridad</th>
                <th>Tipo</th>
                <th>Cliente</th>
                <th>Asignado a</th>
                <th>Etapa</th>
              </tr>
            `}
          </thead>
          <tbody>
            ${activeTab === 'commercial' ? (
              (tableDataList as Opportunity[]).map(opp => {
                const amount = Number(opp.monto_total || 0);
                let displayVal = amount;
                if (currencyFilter === 'consolidado' && opp.moneda === 'USD') {
                  displayVal = amount * (opp.tipoCambio || 1);
                }
                return `
                  <tr>
                    <td>${opp.nombre_proyecto || ''}</td>
                    <td>${opp.cliente ? `${opp.cliente.nombre} ${opp.cliente.apellido || ''}`.trim() : opp.empresa || ''}</td>
                    <td>${opp.company?.nombre || opp.empresa || ''}</td>
                    <td>${opp.ejecutivo?.username || 'Sin asignar'}</td>
                    <td>${opp.stage?.strname || ''}</td>
                    <td>${displayVal.toFixed(2)}</td>
                  </tr>
                `;
              }).join('')
            ) : (
              (tableDataList as Ticket[]).map(t => `
                <tr>
                  <td>#${t.ticket_number.toString().padStart(5, '0')}</td>
                  <td>${t.strtitle || ''}</td>
                  <td>${t.priority === 3 ? 'Alta' : t.priority === 2 ? 'Media' : 'Baja'}</td>
                  <td>${t.tipo_incidencia || 'Normal'}</td>
                  <td>${t.cliente ? `${t.cliente.nombre} ${t.cliente.apellido || ''}`.trim() : t.contactName || ''}</td>
                  <td>${t.responsable?.username || 'Sin asignar'}</td>
                  <td>${t.stage?.strname || ''}</td>
                </tr>
              `).join('')
            )}
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_Dashboard_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Soporte de query params para redirección desde el WebChat
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (!data) return; // Esperar a que los datos estén cargados
    let changed = false;

    const qTab = searchParams.get('tab');
    if (qTab === 'commercial' || qTab === 'helpdesk') {
      setActiveTab(qTab === 'helpdesk' ? 'support' : 'commercial');
      changed = true;
    }

    const qExec = searchParams.get('executive');
    if (qExec) {
      setSelectedExecutiveId(qExec);
      changed = true;
    }

    const qDateStart = searchParams.get('dateStart');
    const qDateEnd = searchParams.get('dateEnd');
    if (qDateStart || qDateEnd) {
      if (qDateStart) setStartDate(qDateStart);
      if (qDateEnd) setEndDate(qDateEnd);
      setDatePeriod('custom');
      changed = true;
    }

    const qPipeline = searchParams.get('pipeline');
    if (qPipeline) {
      setSelectedPipelineId(qPipeline);
      changed = true;
    }

    const qHelpdesk = searchParams.get('helpdesk');
    if (qHelpdesk) {
      setSelectedHelpdeskId(qHelpdesk);
      changed = true;
    }

    // Limpiar query params después de aplicarlos para evitar re-aplicación
    if (changed) {
      setSearchParams({}, { replace: true });
    }
  }, [data]); // Se ejecuta una vez cuando los datos cargan

  useEffect(() => {
    setSelectedKpiId(null);
    setTableSearch('');
    setCurrentPage(1);
  }, [activeTab, selectedPipelineId, selectedHelpdeskId, selectedExecutiveId, datePeriod, startDate, endDate, currencyFilter]);

  // --- FILTERING DATA ---

  // 1. Filter opportunities based on pipeline, executive dropdown, currency, date range and period
  const filteredOpps = useMemo(() => {
    if (!data) return [];
    
    let list = data.opportunities.filter(o => o.pipeline_id === selectedPipelineId);

    // Apply executive filter
    if (selectedExecutiveId !== 'all') {
      list = list.filter(o => o.ejecutivo_id === selectedExecutiveId);
    }

    // Apply currency filter
    if (currencyFilter === 'USD') {
      list = list.filter(o => o.moneda === 'USD');
    } else if (currencyFilter === 'MXN') {
      list = list.filter(o => o.moneda === 'MXN');
    }

    // Apply Custom Date Range if specified, otherwise Predefined Date Period
    if (startDate || endDate) {
      const startVal = startDate ? new Date(startDate).getTime() : -Infinity;
      const endVal = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;
      
      list = list.filter(o => {
        const time = (o as any)._createdAtTime || 0;
        return time >= startVal && time <= endVal;
      });
    } else if (datePeriod !== 'all') {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      list = list.filter(o => {
        const date = o.createdAt ? new Date(o.createdAt) : null;
        if (!date) return false;
        
        if (datePeriod === 'month') {
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        } else if (datePeriod === 'quarter') {
          const diffMonths = (currentYear - date.getFullYear()) * 12 + currentMonth - date.getMonth();
          return diffMonths >= 0 && diffMonths < 3;
        } else if (datePeriod === 'year') {
          return date.getFullYear() === currentYear;
        }
        return true;
      });
    }

    return list;
  }, [data, selectedPipelineId, selectedExecutiveId, datePeriod, startDate, endDate, currencyFilter]);

  // 2. Filter tickets based on helpdesk, executive, date range, and period
  const filteredTickets = useMemo(() => {
    if (!data) return [];
    
    let list = data.tickets.filter(t => t.helpdesk_id === selectedHelpdeskId);

    if (selectedExecutiveId !== 'all') {
      list = list.filter(t => t.responsable_id === selectedExecutiveId);
    }

    // Apply Custom Date Range if specified, otherwise Predefined Date Period
    if (startDate || endDate) {
      const startVal = startDate ? new Date(startDate).getTime() : -Infinity;
      const endVal = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;
      
      list = list.filter(t => {
        const time = (t as any)._fechaAperturaTime || 0;
        return time >= startVal && time <= endVal;
      });
    } else if (datePeriod !== 'all') {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      list = list.filter(t => {
        const date = t.fecha_apertura ? new Date(t.fecha_apertura) : null;
        if (!date) return false;
        
        if (datePeriod === 'month') {
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        } else if (datePeriod === 'quarter') {
          const diffMonths = (currentYear - date.getFullYear()) * 12 + currentMonth - date.getMonth();
          return diffMonths >= 0 && diffMonths < 3;
        } else if (datePeriod === 'year') {
          return date.getFullYear() === currentYear;
        }
        return true;
      });
    }

    return list;
  }, [data, selectedHelpdeskId, selectedExecutiveId, datePeriod, startDate, endDate]);

  // 3. Filter indicators by selected Pipeline or Helpdesk
  const currentIndicators = useMemo(() => {
    if (!data) return [];
    if (activeTab === 'commercial') {
      return data.indicators.filter(ind => ind.pipeline_id === selectedPipelineId);
    } else {
      return data.indicators.filter(ind => ind.helpdesk_id === selectedHelpdeskId);
    }
  }, [data, activeTab, selectedPipelineId, selectedHelpdeskId]);

  // Filter out chart configuration indicators from visible KPI cards
  const kpiIndicators = useMemo(() => {
    return currentIndicators.filter(ind => !ind.title.startsWith('Gráfico:'));
  }, [currentIndicators]);

  // Get active stages configuration of selected Pipeline / Helpdesk
  const currentStages = useMemo(() => {
    if (!data) return [];
    if (activeTab === 'commercial') {
      const pipe = data.pipelines.find(p => p.id === selectedPipelineId);
      return pipe ? pipe.stages : [];
    } else {
      const hd = data.helpdesks.find(h => h.id === selectedHelpdeskId);
      return hd ? hd.stages : [];
    }
  }, [data, activeTab, selectedPipelineId, selectedHelpdeskId]);

  // Map of active stages to their properties for dashboard filtering
  const showDashboardStagesMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    currentStages.forEach((s: any) => {
      map[s.id] = s.bln_show_dashboard !== false;
    });
    return map;
  }, [currentStages]);

  // Opportunities and tickets that belong to stages enabled for dashboard
  const visibleOpps = useMemo(() => {
    return filteredOpps.filter(o => showDashboardStagesMap[o.stage_id] !== false);
  }, [filteredOpps, showDashboardStagesMap]);

  const visibleTickets = useMemo(() => {
    return filteredTickets.filter(t => showDashboardStagesMap[t.stage_id] !== false);
  }, [filteredTickets, showDashboardStagesMap]);

  // Calculate dynamic KPI Card values
  const kpiValues = useMemo(() => {
    const values: Record<string, number> = {};
    
    currentIndicators.forEach(ind => {
      const stageIdsSet = new Set(ind.stage_ids || []);
      
      if (activeTab === 'commercial') {
        const oppsInStages = visibleOpps.filter(o => stageIdsSet.has(o.stage_id));
        if (ind.type === 'sum') {
          values[ind.id!] = oppsInStages.reduce((sum, o) => {
            const amount = Number(o.monto_total || 0);
            if (currencyFilter === 'consolidado' && o.moneda === 'USD') {
              const rate = o.tipoCambio && o.tipoCambio > 0 ? o.tipoCambio : 1;
              return sum + (amount * rate);
            }
            return sum + amount;
          }, 0);
        } else {
          values[ind.id!] = oppsInStages.length;
        }
      } else {
        const ticketsInStages = visibleTickets.filter(t => stageIdsSet.has(t.stage_id));
        values[ind.id!] = ticketsInStages.length;
      }
    });

    return values;
  }, [currentIndicators, activeTab, visibleOpps, visibleTickets, currencyFilter]);

  // Filter detail table list by search and active KPI card selection
  const tableDataList = useMemo(() => {
    if (activeTab === 'commercial') {
      let list = visibleOpps;
      if (selectedKpiId) {
        const ind = currentIndicators.find(i => i.id === selectedKpiId);
        if (ind) {
          const stageIdsSet = new Set(ind.stage_ids || []);
          list = list.filter(o => stageIdsSet.has(o.stage_id));
        }
      }
      // Apply chart drill-down filter
      if (selectedChartFilter) {
        const { chartKey, value } = selectedChartFilter;
        if (chartKey === 'stage') {
          list = list.filter(o => o.stage?.strname === value);
        } else if (chartKey === 'month') {
          list = list.filter(o => getMonthYearString(o.estimated_closure_date || o.createdAt) === value);
        }
      }
      if (tableSearch.trim()) {
        const search = tableSearch.toLowerCase();
        list = list.filter(o => 
          (o.nombre_proyecto || '').toLowerCase().includes(search) ||
          (o.cliente?.nombre || '').toLowerCase().includes(search) ||
          (o.cliente?.apellido || '').toLowerCase().includes(search) ||
          (o.company?.nombre || '').toLowerCase().includes(search) ||
          (o.stage?.strname || '').toLowerCase().includes(search)
        );
      }
      return list;
    } else {
      let list = visibleTickets;
      if (selectedKpiId) {
        const ind = currentIndicators.find(i => i.id === selectedKpiId);
        if (ind) {
          const stageIdsSet = new Set(ind.stage_ids || []);
          list = list.filter(t => stageIdsSet.has(t.stage_id));
        }
      }
      // Apply chart drill-down filter
      if (selectedChartFilter) {
        const { chartKey, value } = selectedChartFilter;
        if (chartKey === 'stage') {
          list = list.filter(t => t.stage?.strname === value);
        } else if (chartKey === 'priority') {
          list = list.filter(t => {
            const label = t.priority === 3 ? 'Alta' : t.priority === 2 ? 'Media' : 'Baja';
            return label === value;
          });
        } else if (chartKey === 'type') {
          list = list.filter(t => (t.tipo_incidencia || 'Sin tipo') === value);
        }
      }
      if (tableSearch.trim()) {
        const search = tableSearch.toLowerCase();
        list = list.filter(t => 
          (t.strtitle || '').toLowerCase().includes(search) ||
          (t.ticket_number || '').toString().includes(search) ||
          (t.tipo_incidencia || '').toLowerCase().includes(search) ||
          (t.cliente?.nombre || '').toLowerCase().includes(search) ||
          (t.cliente?.apellido || '').toLowerCase().includes(search) ||
          (t.stage?.strname || '').toLowerCase().includes(search)
        );
      }
      return list;
    }
  }, [activeTab, visibleOpps, visibleTickets, selectedKpiId, currentIndicators, selectedChartFilter, tableSearch]);

  // Memoized paginated list for rendering the DOM table efficiently
  const paginatedTableList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return tableDataList.slice(start, start + pageSize);
  }, [tableDataList, currentPage]);


  // --- AGGREGATIONS FOR CHARTS ---

  // Chart 1: Open Opportunities by estimated closing month
  const openOppsByMonth = useMemo(() => {
    if (activeTab !== 'commercial') return [];
    
    // Find open stages dynamically from configured KPI indicator (e.g. "Oportunidades Abiertas")
    const openIndicator = currentIndicators.find(ind => 
      ind.title.toLowerCase().includes('abierta') || 
      ind.title.toLowerCase().includes('citas') || 
      ind.color === 'blue' || 
      ind.color === 'purple'
    );
    const openStageIds = openIndicator ? new Set(openIndicator.stage_ids || []) : null;

    const openOpps = visibleOpps.filter(o => {
      if (openStageIds) {
        return openStageIds.has(o.stage_id);
      }
      // Fallback: exclude closed stages if no indicator is found
      return o.stage && !['ganada', 'perdida', 'cancelada', 'standby'].includes(o.stage.strname.toLowerCase());
    });

    const counts: Record<string, number> = {};
    openOpps.forEach(o => {
      const monthStr = getMonthYearString(o.estimated_closure_date);
      counts[monthStr] = (counts[monthStr] || 0) + 1;
    });

    return Object.entries(counts).map(([month, count]) => ({ label: month, value: count }));
  }, [activeTab, visibleOpps, currentIndicators]);

  // Chart 2: Sales (Won Opps) by estimated closing month
  const salesByMonth = useMemo(() => {
    if (activeTab !== 'commercial') return [];
    
    // Find won stages dynamically from configured Sales KPI indicator (e.g. "Ventas" or "Oportunidades Ganadas")
    const salesIndicator = currentIndicators.find(ind => 
      ind.type === 'sum' || 
      ind.title.toLowerCase().includes('venta') || 
      ind.title.toLowerCase().includes('ganada') || 
      ind.color === 'orange' || 
      ind.color === 'green'
    );
    const wonStageIds = salesIndicator ? new Set(salesIndicator.stage_ids || []) : null;

    const wonOpps = visibleOpps.filter(o => {
      if (wonStageIds) {
        return wonStageIds.has(o.stage_id);
      }
      // Fallback
      return o.stage && o.stage.strname.toLowerCase() === 'ganada';
    });

    const sums: Record<string, number> = {};
    wonOpps.forEach(o => {
      const monthStr = getMonthYearString(o.estimated_closure_date || o.createdAt);
      const amount = Number(o.monto_total || 0);
      let convertedAmount = amount;
      if (currencyFilter === 'consolidado' && o.moneda === 'USD') {
        const rate = o.tipoCambio && o.tipoCambio > 0 ? o.tipoCambio : 1;
        convertedAmount = amount * rate;
      }
      sums[monthStr] = (sums[monthStr] || 0) + convertedAmount;
    });

    return Object.entries(sums).map(([month, amount]) => ({ label: month, value: amount }));
  }, [activeTab, visibleOpps, currencyFilter, currentIndicators]);

  // Chart 3: Opportunity Distribution by Stage
  const oppsByStage = useMemo(() => {
    if (activeTab !== 'commercial') return [];
    
    const counts: Record<string, number> = {};
    visibleOpps.forEach(o => {
      if (o.stage) {
        counts[o.stage.strname] = (counts[o.stage.strname] || 0) + 1;
      }
    });

    return Object.entries(counts).map(([stage, count]) => ({ label: stage, value: count }));
  }, [activeTab, visibleOpps]);


  // Helpdesk Chart 1: Tickets Abiertos por Mes (stages from 'Gráfico: Tickets Abiertos')
  const ticketsOpenByMonth = useMemo(() => {
    if (activeTab !== 'support') return [];
    const ind = currentIndicators.find(i => i.title === 'Gráfico: Tickets Abiertos');
    const stageSet = ind?.stage_ids?.length ? new Set(ind.stage_ids) : null;
    const filtered = stageSet ? visibleTickets.filter(t => stageSet.has(t.stage_id)) : visibleTickets;
    const sums: Record<string, number> = {};
    filtered.forEach(t => {
      const monthStr = getMonthYearString(t.fecha_apertura);
      sums[monthStr] = (sums[monthStr] || 0) + 1;
    });
    return Object.entries(sums).map(([month, count]) => ({ label: month, value: count }));
  }, [activeTab, visibleTickets, currentIndicators]);

  // Helpdesk Chart 2: Tickets Cerrados por Mes (stages from 'Gráfico: Tickets Cerrados')
  const ticketsClosedByMonth = useMemo(() => {
    if (activeTab !== 'support') return [];
    const ind = currentIndicators.find(i => i.title === 'Gráfico: Tickets Cerrados');
    const stageSet = ind?.stage_ids?.length ? new Set(ind.stage_ids) : null;
    if (!stageSet) return [];
    const filtered = visibleTickets.filter(t => stageSet.has(t.stage_id));
    const sums: Record<string, number> = {};
    filtered.forEach(t => {
      const monthStr = getMonthYearString(t.fecha_apertura);
      sums[monthStr] = (sums[monthStr] || 0) + 1;
    });
    return Object.entries(sums).map(([month, count]) => ({ label: month, value: count }));
  }, [activeTab, visibleTickets, currentIndicators]);

  // Helpdesk Chart 3: Tickets Cancelados por Mes (stages from 'Gráfico: Tickets Cancelados')
  const ticketsCancelledByMonth = useMemo(() => {
    if (activeTab !== 'support') return [];
    const ind = currentIndicators.find(i => i.title === 'Gráfico: Tickets Cancelados');
    const stageSet = ind?.stage_ids?.length ? new Set(ind.stage_ids) : null;
    if (!stageSet) return [];
    const filtered = visibleTickets.filter(t => stageSet.has(t.stage_id));
    const sums: Record<string, number> = {};
    filtered.forEach(t => {
      const monthStr = getMonthYearString(t.fecha_apertura);
      sums[monthStr] = (sums[monthStr] || 0) + 1;
    });
    return Object.entries(sums).map(([month, count]) => ({ label: month, value: count }));
  }, [activeTab, visibleTickets, currentIndicators]);


  // Helper to render KPI gradient background classes
  const getKpiBgGradient = (color: string) => {
    switch (color) {
      case 'blue':
        return 'from-blue-600 to-sky-400 text-white';
      case 'green':
        return 'from-emerald-600 to-teal-400 text-white';
      case 'purple':
        return 'from-violet-600 to-indigo-400 text-white';
      case 'orange':
        return 'from-amber-500 to-orange-400 text-white';
      case 'red':
        return 'from-rose-600 to-red-400 text-white';
      default:
        return 'from-slate-600 to-slate-400 text-white';
    }
  };

  if (loading || !data) {
    return <Loader />;
  }  return (
    <div className="flex flex-col gap-6 select-none max-w-7xl mx-auto px-1 sm:px-3">
      {/* Header and main tabs / export buttons */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <TrendingUp className="text-indigo-600" size={26} /> Dashboard de Reportes
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Analiza el rendimiento del embudo de ventas y la mesa de ayuda en tiempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto self-stretch md:self-auto justify-between md:justify-end">
          {/* Export Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-350 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
              title="Exportar Reporte a PDF"
            >
              <FileText size={15} className="text-rose-500" />
              <span>Exportar PDF</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-350 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
              title="Exportar Reporte a Excel"
            >
              <FileSpreadsheet size={15} className="text-emerald-500" />
              <span>Exportar Excel</span>
            </button>
          </div>

          {/* Top level tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('commercial')}
              className={`flex items-center justify-center gap-2 px-5 py-2 text-xs font-black uppercase rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === 'commercial'
                  ? 'bg-white text-indigo-600 shadow-lg shadow-indigo-500/10'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Briefcase size={16} /> Resumen Comercial
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className={`flex items-center justify-center gap-2 px-5 py-2 text-xs font-black uppercase rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === 'support'
                  ? 'bg-white text-indigo-600 shadow-lg shadow-indigo-500/10'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LifeBuoy size={16} /> Mesa de Ayuda
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Content Container for PDF screenshot export */}
      <div id="dashboard-report-content" className="flex flex-col gap-6">
        
        {/* Filter Toolbar using standard UnifiedSearchBar */}
        <div className="flex justify-center w-full my-2">
          <UnifiedSearchBar
            ref={searchDropdownRef}
            className="relative w-full max-w-2xl"
            searchTerm={tableSearch}
            onSearchChange={setTableSearch}
            placeholder={activeTab === 'commercial' ? 'Buscar oportunidades por nombre, cliente o etapa...' : 'Buscar tickets por título, cliente o etapa...'}
            badges={badges}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            dropdownWidthClass="w-full sm:w-[680px]"
            dropdownAlign="left"
          >
            <div className="w-full flex flex-col gap-0">

              {/* ── Header row ── */}
              <div className="flex justify-between items-center pb-3 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Filtros del módulo
                  </span>
                  {badges.length > 0 && (
                    <span className="bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                      {badges.length}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedExecutiveId('all');
                    setStartDate('');
                    setEndDate('');
                    setDatePeriod('all');
                    setCurrencyFilter('consolidado');
                    setShowFilters(false);
                  }}
                  className="text-[10px] font-bold text-rose-400 hover:text-rose-600 uppercase tracking-wide cursor-pointer transition-colors"
                >
                  Restablecer todo
                </button>
              </div>

              {/* ── Section 1: Source (Pipeline / Helpdesk) + Executive ── */}
              <div className="bg-slate-50/70 rounded-2xl p-3 mb-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                  {activeTab === 'commercial' ? '📊 Fuente de datos' : '🎫 Mesa de datos'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeTab === 'commercial' ? (
                    <Select
                      label="Pipeline comercial"
                      value={pipelineOptions.find(opt => opt.value === selectedPipelineId)}
                      onChange={(opt: any) => setSelectedPipelineId(opt?.value || '')}
                      options={pipelineOptions}
                    />
                  ) : (
                    <Select
                      label="Mesa de Ayuda"
                      value={helpdeskOptions.find(opt => opt.value === selectedHelpdeskId)}
                      onChange={(opt: any) => setSelectedHelpdeskId(opt?.value || '')}
                      options={helpdeskOptions}
                    />
                  )}

                  {isAdmin && (
                    <Select
                      label="Ejecutivo responsable"
                      value={executiveOptions.find(opt => opt.value === selectedExecutiveId)}
                      onChange={(opt: any) => setSelectedExecutiveId(opt?.value || 'all')}
                      options={executiveOptions}
                    />
                  )}
                </div>
              </div>

              {/* ── Section 2: Period ── */}
              <div className="bg-slate-50/70 rounded-2xl p-3 mb-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                  📅 Periodo de registro
                </p>
                <div className="flex bg-white border border-slate-100 p-1 rounded-xl gap-1 mb-2.5 shadow-sm">
                  {(
                    [
                      { id: 'all',     label: 'Todo',      emoji: '∞' },
                      { id: 'month',   label: 'Mes',       emoji: '30d' },
                      { id: 'quarter', label: 'Trimestre', emoji: '3M' },
                      { id: 'year',    label: 'Año',       emoji: '12M' },
                    ] as const
                  ).map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectPeriod(opt.id)}
                      className={`flex-1 flex flex-col items-center py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer gap-0.5 ${
                        datePeriod === opt.id
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-[9px] opacity-70">{opt.emoji}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Date range */}
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    label="Desde"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                  />
                  <Input
                    type="date"
                    label="Hasta"
                    value={endDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                  />
                </div>
              </div>

              {/* ── Section 3: Currency (commercial only) ── */}
              {activeTab === 'commercial' && (
                <div className="bg-slate-50/70 rounded-2xl p-3 mb-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                    💱 Visualización de moneda
                  </p>
                  <div className="flex gap-2">
                    {([
                      { value: 'consolidado', label: 'Pesos (MXN)', sub: 'Consolidado' },
                      { value: 'USD',         label: 'Dólares',     sub: 'Solo USD'    },
                      { value: 'MXN',         label: 'Pesos',       sub: 'Solo MXN'    },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setCurrencyFilter(opt.value)}
                        className={`flex-1 flex flex-col items-center py-2 px-1 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          currencyFilter === opt.value
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50'
                        }`}
                      >
                        <span className="text-[10px] font-black">{opt.label}</span>
                        <span className={`text-[9px] mt-0.5 ${currencyFilter === opt.value ? 'text-indigo-200' : 'text-slate-400'}`}>
                          {opt.sub}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Apply button ── */}
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-2xl transition-all cursor-pointer shadow-md shadow-indigo-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <ArrowRight size={13} />
                Aplicar filtros{badges.length > 0 ? ` (${badges.length} activo${badges.length !== 1 ? 's' : ''})` : ''}
              </button>
            </div>
          </UnifiedSearchBar>
        </div>

        {/* KPI Cards Grid */}
        {kpiIndicators.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-white border border-slate-100 rounded-3xl text-center shadow-sm">
            <AlertCircle size={28} className="text-slate-400 mb-1" />
            <p className="text-sm font-bold text-slate-700">No hay indicadores configurados para este módulo</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Configúralos en Configuración &gt; Indicadores de Dashboard.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {kpiIndicators.map((ind) => {
              const isSelected = selectedKpiId === ind.id;
              const value = kpiValues[ind.id!] || 0;
              const displayValue = ind.type === 'sum' ? formatCurrency(value, activeCurrency) : value;

              return (
                <button
                  key={ind.id}
                  onClick={() => setSelectedKpiId(isSelected ? null : ind.id!)}
                  className={`text-left rounded-3xl p-5 bg-gradient-to-br shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden select-none cursor-pointer group ${getKpiBgGradient(ind.color)} ${
                    isSelected ? 'ring-4 ring-indigo-600/30 scale-98 shadow-md' : 'opacity-90 hover:opacity-100'
                  }`}
                >
                  {/* Background design elements */}
                  <div className="absolute right-[-20px] top-[-20px] w-24 h-24 rounded-full bg-white/10 group-hover:scale-110 transition-transform duration-300"></div>
                  <div className="absolute right-[-10px] bottom-[-20px] w-16 h-16 rounded-full bg-white/5 group-hover:scale-115 transition-transform duration-300"></div>

                  <div className="flex flex-col justify-between h-full relative z-10 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold tracking-wider uppercase opacity-85">
                        {ind.title}
                      </span>
                      {isSelected && (
                        <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <span className="text-2xl font-black tracking-tight block">
                        {displayValue}
                      </span>
                      <span className="text-[9px] opacity-75 font-semibold block uppercase">
                        {ind.type === 'sum' ? `Suma de importes (${activeCurrency})` : 'Cantidad de registros'}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Visual Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Block 1 */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
            <div className="flex justify-between items-center mb-5 gap-2 flex-wrap">
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                {activeTab === 'commercial' ? `Oportunidades Abiertas por Mes de Cierre ${getPeriodLabel()}` : `Tickets Abiertos por Mes ${getPeriodLabel()}`}
              </h3>
              
              {/* Chart Type Selector */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl gap-0.5">
                {(
                  [
                    { type: 'bar', icon: <BarChart3 size={13} />, label: 'Barras' },
                    { type: 'line', icon: <TrendingUp size={13} />, label: 'Líneas' },
                    { type: 'pie', icon: <PieChart size={13} />, label: 'Pastel' },
                    { type: 'table', icon: <TableIcon size={13} />, label: 'Tabla' },
                  ] as const
                ).map(opt => (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setChart1Type(opt.type)}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      chart1Type === opt.type
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title={opt.label}
                  >
                    {opt.icon}
                  </button>
                ))}
              </div>
            </div>

            <VisualChart
              type={chart1Type}
              data={activeTab === 'commercial' ? openOppsByMonth : ticketsOpenByMonth}
              colorHex="#4f46e5"
              colorGradId="chart1Grad"
              isCurrency={false}
              activeCurrency={activeCurrency}
              onElementClick={(label) => handleChartClick('month', label)}
            />
          </div>

          {/* Chart Block 2 */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
            <div className="flex justify-between items-center mb-5 gap-2 flex-wrap">
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                {activeTab === 'commercial' ? `Ventas Ganadas por Mes ${getPeriodLabel()}` : `Tickets Cerrados por Mes ${getPeriodLabel()}`}
              </h3>
              
              {/* Chart Type Selector */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl gap-0.5">
                {(
                  [
                    { type: 'bar', icon: <BarChart3 size={13} />, label: 'Barras' },
                    { type: 'line', icon: <TrendingUp size={13} />, label: 'Líneas' },
                    { type: 'pie', icon: <PieChart size={13} />, label: 'Pastel' },
                    { type: 'table', icon: <TableIcon size={13} />, label: 'Tabla' },
                  ] as const
                ).map(opt => (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setChart2Type(opt.type)}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      chart2Type === opt.type
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title={opt.label}
                  >
                    {opt.icon}
                  </button>
                ))}
              </div>
            </div>

            <VisualChart
              type={chart2Type}
              data={activeTab === 'commercial' ? salesByMonth : ticketsClosedByMonth}
              colorHex={activeTab === 'commercial' ? '#f59e0b' : '#10b981'}
              colorGradId="salesGrad"
              isCurrency={activeTab === 'commercial'}
              activeCurrency={activeCurrency}
              onElementClick={(label) => handleChartClick('month', label)}
            />
          </div>

          {/* Chart Block 3 */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
            <div className="flex justify-between items-center mb-5 gap-2 flex-wrap">
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                {activeTab === 'commercial' ? `Distribución de Oportunidades por Etapa ${getPeriodLabel()}` : `Tickets Cancelados por Mes ${getPeriodLabel()}`}
              </h3>
              
              {/* Chart Type Selector */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl gap-0.5">
                {(
                  [
                    { type: 'bar', icon: <BarChart3 size={13} />, label: 'Barras' },
                    { type: 'line', icon: <TrendingUp size={13} />, label: 'Líneas' },
                    { type: 'pie', icon: <PieChart size={13} />, label: 'Pastel' },
                    { type: 'table', icon: <TableIcon size={13} />, label: 'Tabla' },
                  ] as const
                ).map(opt => (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setChart3Type(opt.type)}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      chart3Type === opt.type
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title={opt.label}
                  >
                    {opt.icon}
                  </button>
                ))}
              </div>
            </div>

            <VisualChart
              type={chart3Type}
              data={activeTab === 'commercial' ? oppsByStage : ticketsCancelledByMonth}
              colorHex={activeTab === 'commercial' ? '#8b5cf6' : '#f43f5e'}
              colorGradId="chart3Grad"
              isCurrency={false}
              activeCurrency={activeCurrency}
              onElementClick={(label) => handleChartClick(activeTab === 'commercial' ? 'stage' : 'month', label)}
            />
          </div>
        </div>

        {/* Mapped Records Detailed Table */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-md font-extrabold text-slate-800 flex items-center gap-2">
                <ClipboardList className="text-indigo-600" size={20} />
                {selectedChartFilter
                  ? `Registros filtrados por gráfico: "${selectedChartFilter.value}"`
                  : selectedKpiId
                    ? `Registros en: "${currentIndicators.find(i => i.id === selectedKpiId)?.title}"`
                    : activeTab === 'commercial' ? 'Oportunidades en este Pipeline' : 'Tickets en esta Mesa de Ayuda'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedChartFilter
                  ? `Mostrando solo los registros que corresponden al elemento "${selectedChartFilter.value}" del gráfico.`
                  : selectedKpiId 
                    ? 'Mostrando solo los registros asociados al KPI seleccionado.'
                    : 'Muestra los registros consolidados activos bajo las etapas elegidas.'}
              </p>
            </div>

            <div className="flex gap-2 w-full sm:w-auto items-center">
              {/* Search Input */}
              <div className="relative flex-grow sm:flex-none">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full sm:w-56 h-10 pl-10 pr-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-600 transition-all"
                />
              </div>
              {/* Clear KPI card selection */}
              {selectedKpiId && (
                <button
                  onClick={() => setSelectedKpiId(null)}
                  className="px-3.5 h-10 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all whitespace-nowrap cursor-pointer"
                >
                  Ver todos
                </button>
              )}
            </div>
          </div>

          {/* Render Table */}
          {tableDataList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Search size={32} className="text-slate-400 mb-2" />
              <p className="text-sm font-bold text-slate-600">No se encontraron registros</p>
              <p className="text-xs text-slate-500 mt-0.5">
                No hay registros activos que coincidan con la búsqueda o filtros aplicados.
              </p>
            </div>
          ) : activeTab === 'commercial' ? (
            /* Opportunities Table */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-slate-700">
                <thead className="bg-slate-50 text-[10px] text-slate-400 font-black uppercase">
                  <tr>
                    <th className="p-3.5 rounded-l-xl">Oportunidad / Proyecto</th>
                    <th className="p-3.5">Cliente</th>
                    <th className="p-3.5">Empresa</th>
                    <th className="p-3.5">Ejecutivo</th>
                    <th className="p-3.5">Etapa</th>
                    <th className="p-3.5 text-right">Monto</th>
                    <th className="p-3.5 rounded-r-xl text-center w-14">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {(paginatedTableList as Opportunity[]).map((opp) => (
                    <tr key={opp.id} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors">
                      <td className="p-3.5 font-bold text-slate-800 max-w-[200px] truncate">
                        {opp.nombre_proyecto}
                      </td>
                      <td className="p-3.5">
                        {opp.cliente ? `${opp.cliente.nombre} ${opp.cliente.apellido}` : opp.empresa || 'N/A'}
                      </td>
                      <td className="p-3.5">
                        {opp.company?.nombre || opp.empresa || 'N/A'}
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {opp.ejecutivo?.username || 'Sin asignar'}
                      </td>
                      <td className="p-3.5">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold"
                          style={{
                            backgroundColor: opp.stage?.strcolor ? opp.stage.strcolor + '15' : '#f1f5f9',
                            color: opp.stage?.strcolor || '#64748b'
                          }}
                        >
                          {opp.stage?.strname || 'N/A'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-900">
                        {(() => {
                          const amount = Number(opp.monto_total || 0);
                          if (currencyFilter === 'consolidado' && opp.moneda === 'USD') {
                            const rate = opp.tipoCambio && opp.tipoCambio > 0 ? opp.tipoCambio : 1;
                            return formatCurrency(amount * rate, 'MXN');
                          }
                          return formatCurrency(amount, opp.moneda);
                        })()}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => navigate(`/pipeline?opportunityId=${opp.id}`)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer shadow-none border-0"
                          title="Ir a oportunidad"
                        >
                          <ArrowRight size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Tickets Table */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-slate-700">
                <thead className="bg-slate-50 text-[10px] text-slate-400 font-black uppercase">
                  <tr>
                    <th className="p-3.5 rounded-l-xl">Nro Ticket</th>
                    <th className="p-3.5">Asunto</th>
                    <th className="p-3.5">Prioridad</th>
                    <th className="p-3.5">Tipo Incidencia</th>
                    <th className="p-3.5">Cliente</th>
                    <th className="p-3.5">Asignado a</th>
                    <th className="p-3.5">Etapa</th>
                    <th className="p-3.5 rounded-r-xl text-center w-14">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {(paginatedTableList as Ticket[]).map((t) => (
                    <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors">
                      <td className="p-3.5 font-black text-indigo-600">
                        #{t.ticket_number.toString().padStart(5, '0')}
                      </td>
                      <td className="p-3.5 font-bold text-slate-800 max-w-[200px] truncate">
                        {t.strtitle}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          t.priority === 3
                            ? 'bg-rose-50 text-rose-600'
                            : t.priority === 2
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {t.priority === 3 ? 'Alta' : t.priority === 2 ? 'Media' : 'Baja'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {t.tipo_incidencia || 'Normal'}
                      </td>
                      <td className="p-3.5">
                        {t.cliente ? `${t.cliente.nombre} ${t.cliente.apellido}` : t.contactName || 'N/A'}
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {t.responsable?.username || 'Sin asignar'}
                      </td>
                      <td className="p-3.5">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold"
                          style={{
                            backgroundColor: t.stage?.strcolor ? t.stage.strcolor + '15' : '#f1f5f9',
                            color: t.stage?.strcolor || '#64748b'
                          }}
                        >
                          {t.stage?.strname || 'N/A'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => navigate(`/helpdesk?ticketId=${t.id}`)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer shadow-none border-0"
                          title="Ir a ticket"
                        >
                          <ArrowRight size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        {/* Pagination controls */}
        {tableDataList.length > pageSize && (
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100 flex-wrap gap-2 text-xs font-bold text-slate-500">
            <div>
              Mostrando {Math.min(tableDataList.length, (currentPage - 1) * pageSize + 1)} - {Math.min(tableDataList.length, currentPage * pageSize)} de {tableDataList.length} registros
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Anterior
              </button>
              <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg">
                Pág. {currentPage} de {Math.ceil(tableDataList.length / pageSize)}
              </div>
              <button
                type="button"
                disabled={currentPage === Math.ceil(tableDataList.length / pageSize)}
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(tableDataList.length / pageSize), p + 1))}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

      {/* Hidden PDF Summary Template (styled inside an invisible layout container for html2canvas correctness) */}
      <div id="pdf-summary-wrapper" style={{ height: 0, overflow: 'hidden', position: 'relative' }}>
        <div
          id="dashboard-pdf-summary"
          style={{
            width: '1120px',
            padding: '30px',
            backgroundColor: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#1e293b', margin: 0, letterSpacing: '-0.02em' }}>
                REPORTE EJECUTIVO DE DESEMPEÑO
              </h1>
              <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0 0', fontWeight: 'bold' }}>
                Billy Sales & Services - CRM Reportes Consolidados
              </p>
            </div>
            <div style={{ textAlign: 'right', fontSize: '10px', color: '#64748b', lineHeight: '1.4' }}>
              <div><strong>Generado:</strong> {new Date().toLocaleDateString('es-MX')}</div>
              <div><strong>Módulo:</strong> {activeTab === 'commercial' ? 'Resumen Comercial' : 'Mesa de Ayuda'}</div>
              <div>
                <strong>{activeTab === 'commercial' ? 'Pipeline:' : 'Mesa:'}</strong> {activeTab === 'commercial' 
                  ? (pipelineOptions.find(p => p.value === selectedPipelineId)?.label || 'Todos')
                  : (helpdeskOptions.find(h => h.value === selectedHelpdeskId)?.label || 'Todos')}
              </div>
              <div>
                <strong>Ejecutivo:</strong> {selectedExecutiveId === 'all' ? 'Todos los ejecutivos' : (executiveOptions.find(e => e.value === selectedExecutiveId)?.label || 'Todos')}
              </div>
              <div>
                <strong>Periodo:</strong> {getPeriodLabel().replace(/[()]/g, '')}
              </div>
              {activeTab === 'commercial' && (
                <div><strong>Moneda:</strong> {currencyFilter === 'consolidado' ? 'Consolidado en Pesos (MXN)' : (currencyFilter === 'USD' ? 'Solo Dólares (USD)' : 'Solo Pesos (MXN)')}</div>
              )}
            </div>
          </div>

          {/* KPIs Summary */}
          <div>
            <h2 style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
              Indicadores Clave (KPIs)
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
              {kpiIndicators.map((ind) => {
                const value = kpiValues[ind.id!] || 0;
                const displayValue = ind.type === 'sum' ? formatCurrency(value, activeCurrency) : value;
                return (
                  <div
                    key={ind.id}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderLeft: `5px solid ${
                        ind.color === 'blue' ? '#3b82f6' :
                        ind.color === 'green' ? '#10b981' :
                        ind.color === 'purple' ? '#8b5cf6' :
                        ind.color === 'orange' ? '#f59e0b' :
                        ind.color === 'red' ? '#ef4444' : '#64748b'
                      }`,
                      borderRadius: '12px',
                      padding: '14px 12px',
                      minHeight: '85px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxSizing: 'border-box'
                    }}
                  >
                    <div style={{ fontSize: '8.5px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', lineHeight: '1.2' }}>
                      {ind.title}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', marginTop: '6px' }}>
                      <span style={{ fontSize: '18px', fontWeight: 950, color: '#0f172a', lineHeight: '1.1' }}>
                        {displayValue}
                      </span>
                      <span style={{ fontSize: '8px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold', marginTop: '2px', lineHeight: '1' }}>
                        {ind.type === 'sum' ? 'Suma importes' : 'Registros'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Charts Row */}
          <div>
            <h2 style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
              Gráficos del Período
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {/* Chart 1 */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '12px' }}>
                <h3 style={{ fontSize: '9px', fontWeight: 900, color: '#475569', textTransform: 'uppercase', marginBottom: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  {activeTab === 'commercial' ? `Opps por Mes de Cierre ${getPeriodLabel()}` : `Tickets Abiertos por Mes ${getPeriodLabel()}`}
                </h3>
                <VisualChart
                  type={chart1Type}
                  data={activeTab === 'commercial' ? openOppsByMonth : ticketsOpenByMonth}
                  colorHex="#4f46e5"
                  colorGradId="chart1GradPDF"
                  isCurrency={false}
                  activeCurrency={activeCurrency}
                />
              </div>
              {/* Chart 2 */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '12px' }}>
                <h3 style={{ fontSize: '9px', fontWeight: 900, color: '#475569', textTransform: 'uppercase', marginBottom: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  {activeTab === 'commercial' ? `Ventas Ganadas por Mes ${getPeriodLabel()}` : `Tickets Cerrados por Mes ${getPeriodLabel()}`}
                </h3>
                <VisualChart
                  type={chart2Type}
                  data={activeTab === 'commercial' ? salesByMonth : ticketsClosedByMonth}
                  colorHex="#10b981"
                  colorGradId="chart2GradPDF"
                  isCurrency={activeTab === 'commercial'}
                  activeCurrency={activeCurrency}
                />
              </div>
              {/* Chart 3 */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '12px' }}>
                <h3 style={{ fontSize: '9px', fontWeight: 900, color: '#475569', textTransform: 'uppercase', marginBottom: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  {activeTab === 'commercial' ? `Oportunidades por Etapa ${getPeriodLabel()}` : `Tickets Cancelados por Mes ${getPeriodLabel()}`}
                </h3>
                <VisualChart
                  type={chart3Type}
                  data={activeTab === 'commercial' ? oppsByStage : ticketsCancelledByMonth}
                  colorHex="#f43f5e"
                  colorGradId="chart3GradPDF"
                  isCurrency={false}
                  activeCurrency={activeCurrency}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
