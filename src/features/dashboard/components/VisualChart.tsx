import React from 'react';
import { formatCurrency } from '../../utils/formatters';

export interface VisualChartProps {
  type: 'bar' | 'line' | 'pie' | 'table';
  data: { label: string; value: number }[];
  colorHex: string;
  colorGradId: string;
  isCurrency: boolean;
  activeCurrency: string;
  onElementClick?: (label: string) => void;
}

const VisualChart: React.FC<VisualChartProps> = ({
  type, data, colorHex, isCurrency, activeCurrency, onElementClick,
}) => {
  if (data.length === 0) {
    return (
      <div className="flex justify-center items-center h-48 text-slate-400 text-xs">
        Sin datos disponibles
      </div>
    );
  }

  const renderValue = (val: number) => isCurrency ? formatCurrency(val, activeCurrency) : val;

  if (type === 'table') {
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
              <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer select-none transition-colors" onClick={() => onElementClick?.(item.label)}>
                <td className="p-2.5 font-bold text-slate-800">{item.label}</td>
                <td className="p-2.5 text-right font-black text-slate-700">{renderValue(item.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (type === 'bar') {
    return (
      <div style={{ width: '100%', height: '192px', display: 'flex', alignItems: 'flex-end' }}>
        <svg style={{ width: '100%', height: '100%', display: 'block' }} viewBox="0 0 300 150">
          <line x1="20" y1="20" x2="290" y2="20" stroke="#f1f5f9" strokeWidth="1" />
          <line x1="20" y1="65" x2="290" y2="65" stroke="#f1f5f9" strokeWidth="1" />
          <line x1="20" y1="110" x2="290" y2="110" stroke="#f1f5f9" strokeWidth="1" />
          <line x1="20" y1="130" x2="290" y2="130" stroke="#94a3b8" strokeWidth="1.5" />
          {data.map((item, idx) => {
            const bw = Math.min(30, 200/data.length);
            const gap = (250 - bw*data.length)/(data.length+1);
            const x = 30+gap+idx*(bw+gap);
            const maxVal = Math.max(...data.map(i=>i.value),1);
            const h = (item.value/maxVal)*100;
            const y = 130-h;
            return (
              <g key={idx} className="group cursor-pointer" onClick={() => onElementClick?.(item.label)}>
                <rect x={x} y={y} width={bw} height={h} fill={colorHex} rx="4" className="transition-all duration-300 hover:opacity-85 hover:fill-indigo-500" />
                <text x={x+bw/2} y="142" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#64748b">{item.label}</text>
                <text x={x+bw/2} y={y-5} textAnchor="middle" fontSize="9" fontWeight="black" fill={colorHex} className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">{renderValue(item.value)}</text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  if (type === 'line') {
    const maxVal = Math.max(...data.map(i=>i.value),1);
    const xStep = data.length > 1 ? 240/(data.length-1) : 240;
    const points = data.map((item,idx)=>({ x: data.length===1?150:30+idx*xStep, y: 130-(item.value/maxVal)*100, label:item.label, value:item.value }));
    const linePath = data.length===1 ? `M 30 ${points[0].y} L 270 ${points[0].y}` : points.map((p,i)=>`${i===0?'M':'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = data.length>1 ? `${linePath} L ${points[data.length-1].x} 130 L ${points[0].x} 130 Z` : `M 30 ${points[0].y} L 270 ${points[0].y} L 270 130 L 30 130 Z`;
    return (
      <div style={{ width:'100%', height:'192px', display:'flex', alignItems:'flex-end' }}>
        <svg style={{ width:'100%', height:'100%', display:'block' }} viewBox="0 0 300 150">
          <line x1="20" y1="20" x2="290" y2="20" stroke="#f1f5f9" strokeWidth="1" />
          <line x1="20" y1="65" x2="290" y2="65" stroke="#f1f5f9" strokeWidth="1" />
          <line x1="20" y1="110" x2="290" y2="110" stroke="#f1f5f9" strokeWidth="1" />
          <line x1="20" y1="130" x2="290" y2="130" stroke="#94a3b8" strokeWidth="1.5" />
          <path d={areaPath} fill={colorHex} fillOpacity="0.12" />
          <path d={linePath} fill="none" stroke={colorHex} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((p,idx)=>(
            <g key={idx} className="group cursor-pointer" onClick={() => onElementClick?.(p.label)}>
              <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke={colorHex} strokeWidth="2.5" />
              <text x={p.x} y="142" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#64748b">{p.label}</text>
              <text x={p.x} y={p.y-8} textAnchor="middle" fontSize="8.5" fontWeight="black" fill={colorHex} className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">{renderValue(p.value)}</text>
            </g>
          ))}
        </svg>
      </div>
    );
  }

  if (type === 'pie') {
    const total = data.reduce((s,i)=>s+i.value,0)||1;
    const colors = ['#4f46e5','#10b981','#f59e0b','#3b82f6','#ec4899','#8b5cf6','#6366f1','#14b8a6'];
    let acc = 0;
    return (
      <div style={{ width:'100%', height:'192px', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg style={{ width:'160px', height:'160px', flexShrink:0 }} viewBox="0 0 100 100">
          {data.map((item,idx)=>{
            const pct = item.value/total;
            const angle = pct*360;
            const color = colors[idx%colors.length];
            if (angle===0) return null;
            if (pct>=0.999) return (<g key={idx} className="group cursor-pointer" onClick={()=>onElementClick?.(item.label)}><circle cx="50" cy="50" r="35" fill="none" stroke={color} strokeWidth="12" className="transition-all duration-300 hover:stroke-[15]"/><title>{`${item.label}: ${renderValue(item.value)} (100%)`}</title></g>);
            const x1=50+35*Math.cos((acc-90)*Math.PI/180), y1=50+35*Math.sin((acc-90)*Math.PI/180);
            acc+=angle;
            const x2=50+35*Math.cos((acc-90)*Math.PI/180), y2=50+35*Math.sin((acc-90)*Math.PI/180);
            return (<g key={idx} className="group cursor-pointer" onClick={()=>onElementClick?.(item.label)}><path d={`M ${x1} ${y1} A 35 35 0 ${angle>180?1:0} 1 ${x2} ${y2}`} fill="none" stroke={color} strokeWidth="12" className="transition-all duration-300 hover:stroke-[15]"/><title>{`${item.label}: ${renderValue(item.value)} (${(pct*100).toFixed(0)}%)`}</title></g>);
          })}
          <circle cx="50" cy="50" r="23" fill="#ffffff" />
        </svg>
        <div className="overflow-y-auto max-h-36 pl-3 flex flex-col gap-0.5">
          {data.map((item,idx)=>{
            const color=colors[idx%colors.length];
            return (<div key={idx} style={{ display:'flex', alignItems:'center', gap:'6px', height:'18px' }} className="cursor-pointer hover:bg-slate-50 rounded px-1 transition-all select-none" onClick={()=>onElementClick?.(item.label)}><span style={{ width:'8px', height:'8px', borderRadius:'50%', backgroundColor:color, display:'inline-block', flexShrink:0 }} /><span style={{ fontSize:'9.5px', color:'#64748b', fontWeight:'bold', whiteSpace:'nowrap', overflow:'hidden', maxWidth:'90px', display:'inline-block', textOverflow:'ellipsis' }}>{item.label}</span><span style={{ fontSize:'9.5px', color:'#1e293b', fontWeight:900, whiteSpace:'nowrap', flexShrink:0 }}>({renderValue(item.value)})</span></div>);
          })}
        </div>
      </div>
    );
  }

  return null;
};

export default VisualChart;
