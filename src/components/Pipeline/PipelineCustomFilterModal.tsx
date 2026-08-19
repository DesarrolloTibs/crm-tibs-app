import React from 'react';
import { Filter, X, Trash2, Star } from 'lucide-react';
import type { FilterRule } from '../../hooks/usePipeline';
import type { Stage } from '../../core/models/Opportunity';
import type { OpportunityCatalogOption } from '../../core/models/OpportunityCatalog';

interface Executive { id: string; username: string; }

interface Props {
  open: boolean;
  onClose: () => void;
  matchType: 'any' | 'all';
  setMatchType: (v: 'any' | 'all') => void;
  includeArchived: boolean;
  setIncludeArchived: (v: boolean) => void;
  customRules: FilterRule[];
  setCustomRules: React.Dispatch<React.SetStateAction<FilterRule[]>>;
  stages: Stage[];
  executives: Executive[];
  businessLines: OpportunityCatalogOption[];
  getOperatorsForField: (field: string) => { value: string; label: string }[];
  handleRuleFieldChange: (idx: number, field: string) => void;
  handleRuleChange: (idx: number, key: keyof FilterRule, value: string) => void;
  onApply: () => void;
}

const PipelineCustomFilterModal: React.FC<Props> = ({
  open, onClose, matchType, setMatchType, includeArchived, setIncludeArchived,
  customRules, setCustomRules, stages, executives, businessLines,
  getOperatorsForField, handleRuleFieldChange, handleRuleChange, onApply,
}) => {
  if (!open) return null;

  const renderValueInput = (rule: FilterRule, idx: number) => {
    if (rule.field === 'linea_negocio') return <select value={rule.value} onChange={e => handleRuleChange(idx, 'value', e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium w-full cursor-pointer"><option value="" disabled>-- Seleccione --</option>{businessLines.map(bl => <option key={bl.id} value={bl.strname}>{bl.strname}</option>)}</select>;
    if (rule.field === 'stage_id') return <select value={rule.value} onChange={e => handleRuleChange(idx, 'value', e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium w-full cursor-pointer">{stages.map(s => <option key={s.id} value={s.id}>{s.strname}</option>)}</select>;
    if (rule.field === 'ejecutivo_id') return <select value={rule.value} onChange={e => handleRuleChange(idx, 'value', e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium w-full cursor-pointer">{executives.map(e => <option key={e.id} value={e.id}>{e.username}</option>)}</select>;
    if (rule.field === 'priority') return (
      <div className="flex items-center gap-1">
        {[1,2,3].map(star => (
          <button key={star} type="button" onClick={() => handleRuleChange(idx,'value',String(star))} className="p-0.5 transition-colors cursor-pointer" title={star===1?'Baja':star===2?'Media':'Alta'}>
            <Star size={20} className={Number(rule.value)>=star?'text-amber-400 fill-current':'text-slate-300'} />
          </button>
        ))}
        <span className="text-xs text-slate-500 ml-2">{Number(rule.value)===0?'Sin prioridad':Number(rule.value)===1?'Baja':Number(rule.value)===2?'Media':'Alta'}</span>
      </div>
    );
    if (rule.field === 'contacto') return <input type="text" value={rule.value} onChange={e => handleRuleChange(idx,'value',e.target.value)} placeholder="Nombre o correo del contacto (ej: Pedro Pérez)..." className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium w-full" required />;
    if (rule.field === 'monto_total') return <input type="number" value={rule.value} onChange={e => handleRuleChange(idx,'value',e.target.value)} placeholder="Monto..." className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium w-full" min="0" required />;
    return <input type="text" value={rule.value} onChange={e => handleRuleChange(idx,'value',e.target.value)} placeholder="Valor..." className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium w-full" required />;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Filter size={18} className="text-indigo-600" /> Filtro Personalizado</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"><X size={18} /></button>
        </div>
        <div className="p-6 flex-grow overflow-y-auto flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60 shrink-0">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <span>Buscar oportunidades que cumplan</span>
              <select value={matchType} onChange={e => setMatchType(e.target.value as 'any'|'all')} className="border border-slate-300 rounded px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-semibold text-indigo-700 cursor-pointer">
                <option value="any">cualquiera de</option>
                <option value="all">todas</option>
              </select>
              <span>las siguientes reglas:</span>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer select-none">
              <input type="checkbox" checked={includeArchived} onChange={e => setIncludeArchived(e.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4" />
              <span>Incluir archivadas</span>
            </label>
          </div>
          <div className="flex flex-col gap-3">
            {customRules.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-300 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center gap-3">
                <p className="text-slate-500 text-sm">No has añadido ninguna regla de filtrado.</p>
                <button type="button" onClick={() => setCustomRules([{ field:'nombre_proyecto', operator:'contains', value:'' }])} className="bg-white border border-slate-300 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer">+ Añadir primera regla</button>
              </div>
            ) : customRules.map((rule, idx) => {
              const operators = getOperatorsForField(rule.field);
              return (
                <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition-all">
                  <select value={rule.field} onChange={e => handleRuleFieldChange(idx,e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium w-full sm:w-48 cursor-pointer">
                    <option value="nombre_proyecto">Nombre del Proyecto</option>
                    <option value="empresa">Empresa</option>
                    <option value="contacto">Contacto Relacionado</option>
                    <option value="linea_negocio">Línea de Negocio</option>
                    <option value="monto_total">Monto Total</option>
                    <option value="priority">Prioridad</option>
                    <option value="stage_id">Etapa</option>
                    <option value="ejecutivo_id">Ejecutivo</option>
                  </select>
                  <select value={rule.operator} onChange={e => handleRuleChange(idx,'operator',e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium w-full sm:w-40 cursor-pointer">
                    {operators.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                  </select>
                  <div className="flex-1 w-full">{renderValueInput(rule, idx)}</div>
                  <button type="button" onClick={() => setCustomRules(prev => prev.filter((_,i) => i!==idx))} className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0" title="Eliminar regla"><Trash2 size={16} /></button>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
          <button type="button" onClick={() => setCustomRules(prev => [...prev, { field:'nombre_proyecto', operator:'contains', value:'' }])} className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer">+ Añadir regla</button>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer">Cancelar</button>
            <button type="button" onClick={onApply} disabled={customRules.length===0} className={`px-5 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer ${customRules.length===0?'bg-slate-300 text-slate-500 cursor-not-allowed':'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>Aplicar filtro</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineCustomFilterModal;
