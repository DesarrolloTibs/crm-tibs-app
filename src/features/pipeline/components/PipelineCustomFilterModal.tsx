import React from 'react';
import { Filter, X, Trash2, Star } from 'lucide-react';
import Button from '@shared/components/Button';
import Modal from '@shared/components/Modal';
import Select from '@shared/components/Select';
import Input from '@shared/components/Input';
import type { FilterRule } from '../hooks/usePipeline';
import type { Stage } from '@core/models/Opportunity';
import type { OpportunityCatalogOption } from '@core/models/OpportunityCatalog';

interface Executive {
  id: string;
  username: string;
}

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

const FIELD_OPTIONS = [
  { value: 'nombre_proyecto', label: 'Nombre del Proyecto' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'contacto', label: 'Contacto Relacionado' },
  { value: 'linea_negocio', label: 'Línea de Negocio' },
  { value: 'monto_total', label: 'Monto Total' },
  { value: 'priority', label: 'Prioridad' },
  { value: 'stage_id', label: 'Etapa' },
  { value: 'ejecutivo_id', label: 'Ejecutivo' },
];

const MATCH_OPTIONS = [
  { value: 'any', label: 'cualquiera de' },
  { value: 'all', label: 'todas' },
];

const PipelineCustomFilterModal: React.FC<Props> = ({
  open,
  onClose,
  matchType,
  setMatchType,
  includeArchived,
  setIncludeArchived,
  customRules,
  setCustomRules,
  stages,
  executives,
  businessLines,
  getOperatorsForField,
  handleRuleFieldChange,
  handleRuleChange,
  onApply,
}) => {
  if (!open) return null;

  const portalTarget = typeof document !== 'undefined' ? document.body : undefined;

  const renderValueInput = (rule: FilterRule, idx: number) => {
    if (rule.field === 'linea_negocio') {
      const opts = businessLines.map((bl) => ({ value: bl.strname, label: bl.strname }));
      return (
        <Select
          size="sm"
          menuPortalTarget={portalTarget}
          placeholder="-- Seleccione --"
          value={opts.find((o) => o.value === rule.value) || null}
          onChange={(selected: any) => handleRuleChange(idx, 'value', selected?.value || '')}
          options={opts}
        />
      );
    }
    if (rule.field === 'stage_id') {
      const opts = stages.map((s) => ({ value: s.id, label: s.strname }));
      return (
        <Select
          size="sm"
          menuPortalTarget={portalTarget}
          value={opts.find((o) => o.value === rule.value) || null}
          onChange={(selected: any) => handleRuleChange(idx, 'value', selected?.value || '')}
          options={opts}
        />
      );
    }
    if (rule.field === 'ejecutivo_id') {
      const opts = executives.map((e) => ({ value: e.id, label: e.username }));
      return (
        <Select
          size="sm"
          menuPortalTarget={portalTarget}
          isSearchable={opts.length > 6}
          value={opts.find((o) => o.value === rule.value) || null}
          onChange={(selected: any) => handleRuleChange(idx, 'value', selected?.value || '')}
          options={opts}
        />
      );
    }
    if (rule.field === 'priority') {
      return (
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((star) => (
            <Button
              key={star}
              variant="icon"
              onClick={() => handleRuleChange(idx, 'value', String(star))}
              className="!p-0.5"
              title={star === 1 ? 'Baja' : star === 2 ? 'Media' : 'Alta'}
            >
              <Star
                size={20}
                className={
                  Number(rule.value) >= star ? 'text-amber-400 fill-current' : 'text-slate-300'
                }
              />
            </Button>
          ))}
          <span className="text-xs text-slate-500 ml-2">
            {Number(rule.value) === 0
              ? 'Sin prioridad'
              : Number(rule.value) === 1
              ? 'Baja'
              : Number(rule.value) === 2
              ? 'Media'
              : 'Alta'}
          </span>
        </div>
      );
    }
    if (rule.field === 'contacto') {
      return (
        <Input
          type="text"
          value={rule.value}
          onChange={(e) => handleRuleChange(idx, 'value', e.target.value)}
          placeholder="Nombre o correo del contacto (ej: Pedro Pérez)..."
          className="!py-2 !px-3 !rounded-xl !text-xs shadow-none bg-slate-50"
          required
        />
      );
    }
    if (rule.field === 'monto_total') {
      return (
        <Input
          type="number"
          value={rule.value}
          onChange={(e) => handleRuleChange(idx, 'value', e.target.value)}
          placeholder="Monto..."
          className="!py-2 !px-3 !rounded-xl !text-xs shadow-none bg-slate-50"
          min="0"
          required
        />
      );
    }
    return (
      <Input
        type="text"
        value={rule.value}
        onChange={(e) => handleRuleChange(idx, 'value', e.target.value)}
        placeholder="Valor..."
        className="!py-2 !px-3 !rounded-xl !text-xs shadow-none bg-slate-50"
        required
      />
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="max-w-3xl"
      height="max-h-[90vh]"
      padding="p-0"
      className="rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col"
      hideCloseButton={true}
    >
      <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Filter size={18} className="text-indigo-600" /> Filtro Personalizado
        </h3>
        <Button variant="icon" onClick={onClose} className="!text-slate-400 hover:!text-slate-600">
          <X size={18} />
        </Button>
      </div>
      <div className="p-6 flex-grow overflow-y-auto flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60 shrink-0">
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-700">
            <span>Buscar oportunidades que cumplan</span>
            <div className="w-36">
              <Select
                size="sm"
                menuPortalTarget={portalTarget}
                value={MATCH_OPTIONS.find((opt) => opt.value === matchType)}
                onChange={(selected: any) =>
                  setMatchType((selected?.value || 'all') as 'any' | 'all')
                }
                options={MATCH_OPTIONS}
              />
            </div>
            <span>las siguientes reglas:</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              id="incArchived"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="incArchived" className="cursor-pointer select-none">
              Incluir archivadas
            </label>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {customRules.map((rule, idx) => {
            const operators = getOperatorsForField(rule.field);
            return (
              <div
                key={idx}
                className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition-all"
              >
                <div className="w-full sm:w-48">
                  <Select
                    size="sm"
                    menuPortalTarget={portalTarget}
                    value={FIELD_OPTIONS.find((opt) => opt.value === rule.field)}
                    onChange={(selected: any) =>
                      handleRuleFieldChange(idx, selected?.value || 'nombre_proyecto')
                    }
                    options={FIELD_OPTIONS}
                  />
                </div>
                <div className="w-full sm:w-40">
                  <Select
                    size="sm"
                    menuPortalTarget={portalTarget}
                    value={operators.find((op) => op.value === rule.operator) || null}
                    onChange={(selected: any) =>
                      handleRuleChange(idx, 'operator', selected?.value || '')
                    }
                    options={operators}
                  />
                </div>
                <div className="flex-1 w-full">{renderValueInput(rule, idx)}</div>
                <Button
                  variant="icon"
                  onClick={() => setCustomRules((prev) => prev.filter((_, i) => i !== idx))}
                  className="!text-rose-500 hover:!text-rose-700 hover:!bg-rose-50 shrink-0"
                  title="Eliminar regla"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
        <Button
          variant="secondary"
          onClick={() =>
            setCustomRules((prev) => [
              ...prev,
              { field: 'nombre_proyecto', operator: 'contains', value: '' },
            ])
          }
          className="!py-2 !px-4 !text-sm !font-bold !normal-case !tracking-normal"
        >
          + Añadir regla
        </Button>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            className="!py-2 !px-4 !text-sm !font-bold !normal-case !tracking-normal"
          >
            Cancelar
          </Button>
          <Button
            variant="indigo"
            onClick={onApply}
            disabled={customRules.length === 0}
            className="!py-2 !px-5 !text-sm !font-bold !normal-case !tracking-normal"
          >
            Aplicar filtro
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PipelineCustomFilterModal;
