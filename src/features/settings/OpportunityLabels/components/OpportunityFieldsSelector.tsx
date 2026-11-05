import React from 'react';
import { Info, ArrowRight } from 'lucide-react';
import type { OpportunityLabel } from '../schemas/opportunityLabels.schema';
import {
  getFieldDefaultName,
  getFieldBadge,
  getFieldDescription,
} from '../utils/opportunityLabels.helpers';

interface OpportunityFieldsSelectorProps {
  labels: OpportunityLabel[];
  onSelectField: (label: OpportunityLabel) => void;
}

export const OpportunityFieldsSelector: React.FC<OpportunityFieldsSelectorProps> = ({
  labels,
  onSelectField,
}) => {
  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Alerta Informativa */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
        <Info size={18} className="text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-900 leading-relaxed">
          <strong>¿Cómo funciona el guardado?</strong> Al guardar la etiqueta del campo seleccionado, se sincronizará automáticamente para mapear los campos en los formularios y el historial de interacciones.
        </div>
      </div>

      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
        Elige el campo que deseas renombrar:
      </h3>

      {/* Lista de Tarjetas Seleccionables */}
      <div className="flex flex-col gap-4">
        {labels.map((label) => {
          const defaultFieldName = getFieldDefaultName(label.field_key);
          const badgeCategory = getFieldBadge(label.field_key);
          const description = getFieldDescription(label.field_key);

          return (
            <button
              key={label.id}
              type="button"
              onClick={() => onSelectField(label)}
              className="flex justify-between items-center p-5 border border-slate-200 rounded-2xl bg-white hover:border-indigo-500 hover:shadow-lg transition-all duration-300 group cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:scale-[1.01]"
            >
              <div className="space-y-2 flex-grow pr-4">
                <div className="flex items-center gap-2.5">
                  <span className="bg-indigo-50 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                    {badgeCategory}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Clave: {label.field_key}
                  </span>
                </div>

                <h4 className="font-bold text-slate-800 text-base">
                  {defaultFieldName}
                </h4>

                <p className="text-xs text-slate-500 leading-relaxed">
                  {description}
                </p>

                <div className="pt-1 flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 font-medium">Etiqueta actual:</span>
                  <span className="font-bold text-slate-700">{label.strname}</span>
                </div>
              </div>

              <span className="bg-indigo-600 text-white p-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 shrink-0">
                <ArrowRight size={14} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
