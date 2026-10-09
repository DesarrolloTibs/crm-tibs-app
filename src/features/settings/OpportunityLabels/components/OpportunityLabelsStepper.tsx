import React from 'react';
import { Check, ArrowRight } from 'lucide-react';

interface OpportunityLabelsStepperProps {
  step: 1 | 2;
}

export const OpportunityLabelsStepper: React.FC<OpportunityLabelsStepperProps> = ({ step }) => {
  return (
    <div className="max-w-xl mx-auto mb-10 px-4 animate-fade-in">
      <div className="flex items-center justify-center gap-2 sm:gap-6">
        {/* Paso 1 */}
        <div
          className={`flex items-center gap-2 pb-2.5 border-b-2 transition-all duration-300 ${
            step === 1
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-gray-400 font-medium'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
              step === 1
                ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                : 'bg-green-500 text-white'
            }`}
          >
            {step > 1 ? <Check size={12} /> : '1'}
          </div>
          <span className="text-xs whitespace-nowrap">
            Seleccionar Campo
          </span>
        </div>

        <ArrowRight size={14} className="text-gray-300 shrink-0 mb-1" />

        {/* Paso 2 */}
        <div
          className={`flex items-center gap-2 pb-2.5 border-b-2 transition-all duration-300 ${
            step === 2
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-gray-400 font-medium'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
              step === 2
                ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            2
          </div>
          <span className="text-xs whitespace-nowrap">
            Modificar Etiqueta
          </span>
        </div>
      </div>
    </div>
  );
};
