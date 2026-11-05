import React from 'react';
import { Sliders, MousePointer, Edit2 } from 'lucide-react';
import type { OpportunityLabel } from '../schemas/opportunityLabels.schema';

interface OpportunityFormMockupProps {
  labels: OpportunityLabel[];
  selectedLabel: OpportunityLabel | null;
  step: 1 | 2;
  newName: string;
  onFieldClick: (fieldKey: 'linea_negocio' | 'tipo_entrega' | 'licenciamiento') => void;
}

export const OpportunityFormMockup: React.FC<OpportunityFormMockupProps> = ({
  labels,
  selectedLabel,
  step,
  newName,
  onFieldClick,
}) => {
  // Encontrar los nombres actuales para mostrar en los campos no seleccionados
  const currentLicenciamiento =
    labels.find((l) => l.field_key === 'licenciamiento')?.strname || 'Licenciamiento';
  const currentServicios =
    labels.find((l) => l.field_key === 'tipo_entrega')?.strname || 'Servicios';
  const currentLineaNegocio =
    labels.find((l) => l.field_key === 'linea_negocio')?.strname || 'Línea de Negocio';
  const currentTipoEntrega =
    labels.find((l) => l.field_key === 'tipo_entrega')?.strname || 'Tipo de Entrega';

  // Determinar qué se está editando en tiempo real
  const isLic = selectedLabel?.field_key === 'licenciamiento';
  const isDel = selectedLabel?.field_key === 'tipo_entrega';
  const isBus = selectedLabel?.field_key === 'linea_negocio';

  // Nombres en vivo (si se está editando, usar newName, si no, el valor actual)
  const liveLic = isLic ? newName || 'Licenciamiento' : currentLicenciamiento;
  const liveSer = isDel ? newName || 'Servicios' : currentServicios;
  const liveBus = isBus ? newName || 'Línea de Negocio' : currentLineaNegocio;
  const liveDel = isDel ? newName || 'Tipo de Entrega' : currentTipoEntrega;

  const getFieldClassName = (fieldKey: 'linea_negocio' | 'tipo_entrega' | 'licenciamiento') => {
    const isSelected = selectedLabel?.field_key === fieldKey;

    if (step === 2) {
      if (isSelected) {
        return 'border-indigo-500 bg-indigo-50 shadow-sm relative ring-2 ring-indigo-200 border-solid scale-[1.02] cursor-pointer';
      }
      return 'border-indigo-200 border-dashed bg-white hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer transition-all duration-200 opacity-60';
    }

    return 'border-indigo-300 border-dashed bg-indigo-50/10 hover:border-indigo-600 hover:bg-indigo-50/70 hover:shadow-md cursor-pointer transition-all duration-200 hover:scale-[1.01]';
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5 text-left text-xs sticky top-4">
      {/* Cabecera del Simulador */}
      <div className="border-b border-slate-200 pb-2">
        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1">
          <Sliders size={10} /> Ubicación en el Formulario
        </p>
        {step === 1 ? (
          <p className="text-slate-650 font-medium text-[11px] mt-1 bg-indigo-50/80 border border-indigo-100 p-2 rounded-lg flex items-start gap-1.5 leading-relaxed">
            <MousePointer size={12} className="text-indigo-600 shrink-0 mt-0.5" />
            <span>
              <strong>Selección Visual:</strong> Haz clic directamente sobre un campo resaltado en el formulario para modificar su etiqueta.
            </span>
          </p>
        ) : (
          <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
            Visualización en tiempo real del campo editado. Puedes hacer clic en otro para cambiar la selección.
          </p>
        )}
      </div>

      {/* Sección 1: Datos del Proyecto */}
      <div className="space-y-2 opacity-35 select-none pointer-events-none">
        <p className="font-bold text-slate-700 border-b border-slate-150 pb-1 uppercase tracking-wider text-[9px]">
          Datos del Proyecto
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[9px] text-slate-500 block">Nombre del Proyecto</span>
            <div className="h-7 border border-slate-200 rounded bg-slate-100 mt-1" />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 block">Fecha Estimada</span>
            <div className="h-7 border border-slate-200 rounded bg-slate-100 mt-1" />
          </div>
        </div>
      </div>

      {/* Sección 2: Detalles Financieros */}
      <div className="space-y-3">
        <p className="font-bold text-slate-700 border-b border-slate-150 pb-1 uppercase tracking-wider text-[9px]">
          Detalles Financieros
        </p>
        <div className="grid grid-cols-2 gap-3">
          {/* Campo Monto Licenciamiento */}
          <div
            onClick={() => onFieldClick('licenciamiento')}
            className={`p-2.5 rounded-xl border transition-all duration-300 relative ${getFieldClassName('licenciamiento')}`}
          >
            {step === 1 && (
              <span className="absolute -top-2 right-2 bg-indigo-100 text-indigo-700 text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-indigo-200 flex items-center gap-0.5">
                <MousePointer size={8} /> Clic
              </span>
            )}
            {step === 2 && isLic && (
              <span className="absolute -top-2 right-2 bg-indigo-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                <Edit2 size={8} /> Editando
              </span>
            )}
            {step === 2 && !isLic && (
              <span className="absolute -top-2 right-2 bg-slate-100 text-slate-500 text-[8px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider border border-slate-200 opacity-0 hover:opacity-100 transition-opacity">
                Cambiar
              </span>
            )}
            <span className={`text-[9px] block font-bold ${isLic ? 'text-indigo-700' : 'text-slate-500'}`}>
              Monto {liveLic}
            </span>
            <div
              className={`h-7 border rounded mt-1 bg-white flex items-center px-2 text-[10px] ${
                isLic ? 'border-indigo-300 text-indigo-700 font-semibold' : 'border-slate-200 text-slate-400'
              }`}
            >
              $ 0.00
            </div>
          </div>

          {/* Campo Monto Servicios */}
          <div
            onClick={() => onFieldClick('tipo_entrega')}
            className={`p-2.5 rounded-xl border transition-all duration-300 relative ${getFieldClassName('tipo_entrega')}`}
          >
            {step === 1 && (
              <span className="absolute -top-2 right-2 bg-indigo-100 text-indigo-700 text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-indigo-200 flex items-center gap-0.5">
                <MousePointer size={8} /> Clic
              </span>
            )}
            {step === 2 && isDel && (
              <span className="absolute -top-2 right-2 bg-indigo-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                <Edit2 size={8} /> Editando
              </span>
            )}
            {step === 2 && !isDel && (
              <span className="absolute -top-2 right-2 bg-slate-100 text-slate-500 text-[8px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider border border-slate-200 opacity-0 hover:opacity-100 transition-opacity">
                Cambiar
              </span>
            )}
            <span className={`text-[9px] block font-bold ${isDel ? 'text-indigo-700' : 'text-slate-500'}`}>
              Monto {liveSer}
            </span>
            <div
              className={`h-7 border rounded mt-1 bg-white flex items-center px-2 text-[10px] ${
                isDel ? 'border-indigo-300 text-indigo-700 font-semibold' : 'border-slate-200 text-slate-400'
              }`}
            >
              $ 0.00
            </div>
          </div>
        </div>
      </div>

      {/* Sección 3: Clasificación */}
      <div className="space-y-3">
        <p className="font-bold text-slate-700 border-b border-slate-150 pb-1 uppercase tracking-wider text-[9px]">
          Clasificación
        </p>
        <div className="grid grid-cols-2 gap-3">
          {/* Campo Etapa */}
          <div className="p-2.5 border border-slate-150 bg-white rounded-xl opacity-35 select-none pointer-events-none">
            <span className="text-[9px] text-slate-500 block font-bold">Etapa</span>
            <div className="h-7 border border-slate-200 rounded mt-1 bg-white flex items-center px-2 text-slate-550 text-[10px]">
              Nuevo
            </div>
          </div>

          {/* Campo Línea de Negocio */}
          <div
            onClick={() => onFieldClick('linea_negocio')}
            className={`p-2.5 rounded-xl border transition-all duration-300 relative ${getFieldClassName('linea_negocio')}`}
          >
            {step === 1 && (
              <span className="absolute -top-2 right-2 bg-indigo-100 text-indigo-700 text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-indigo-200 flex items-center gap-0.5">
                <MousePointer size={8} /> Clic
              </span>
            )}
            {step === 2 && isBus && (
              <span className="absolute -top-2 right-2 bg-indigo-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                <Edit2 size={8} /> Editando
              </span>
            )}
            {step === 2 && !isBus && (
              <span className="absolute -top-2 right-2 bg-slate-100 text-slate-500 text-[8px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider border border-slate-200 opacity-0 hover:opacity-100 transition-opacity">
                Cambiar
              </span>
            )}
            <span className={`text-[9px] block font-bold ${isBus ? 'text-indigo-700' : 'text-slate-500'}`}>
              {liveBus}
            </span>
            <div
              className={`h-7 border rounded mt-1 bg-white flex items-center justify-between px-2 text-[10px] ${
                isBus ? 'border-indigo-300 text-indigo-700 font-semibold' : 'border-slate-200 text-slate-500'
              }`}
            >
              <span>-- Seleccionar --</span>
              <span className="text-[8px] text-slate-400">▼</span>
            </div>
          </div>

          {/* Campo Tipo de Entrega */}
          <div
            onClick={() => onFieldClick('tipo_entrega')}
            className={`p-2.5 rounded-xl border transition-all duration-300 relative ${getFieldClassName('tipo_entrega')}`}
          >
            {step === 1 && (
              <span className="absolute -top-2 right-2 bg-indigo-100 text-indigo-700 text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-indigo-200 flex items-center gap-0.5">
                <MousePointer size={8} /> Clic
              </span>
            )}
            {step === 2 && isDel && (
              <span className="absolute -top-2 right-2 bg-indigo-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                <Edit2 size={8} /> Editando
              </span>
            )}
            {step === 2 && !isDel && (
              <span className="absolute -top-2 right-2 bg-slate-100 text-slate-500 text-[8px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider border border-slate-200 opacity-0 hover:opacity-100 transition-opacity">
                Cambiar
              </span>
            )}
            <span className={`text-[9px] block font-bold ${isDel ? 'text-indigo-700' : 'text-slate-500'}`}>
              {liveDel}
            </span>
            <div
              className={`h-7 border rounded mt-1 bg-white flex items-center justify-between px-2 text-[10px] ${
                isDel ? 'border-indigo-300 text-indigo-700 font-semibold' : 'border-slate-200 text-slate-500'
              }`}
            >
              <span>-- Seleccionar --</span>
              <span className="text-[8px] text-slate-400">▼</span>
            </div>
          </div>

          {/* Campo Licenciamiento */}
          <div
            onClick={() => onFieldClick('licenciamiento')}
            className={`p-2.5 rounded-xl border transition-all duration-300 relative ${getFieldClassName('licenciamiento')}`}
          >
            {step === 1 && (
              <span className="absolute -top-2 right-2 bg-indigo-100 text-indigo-700 text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-indigo-200 flex items-center gap-0.5">
                <MousePointer size={8} /> Clic
              </span>
            )}
            {step === 2 && isLic && (
              <span className="absolute -top-2 right-2 bg-indigo-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                <Edit2 size={8} /> Editando
              </span>
            )}
            {step === 2 && !isLic && (
              <span className="absolute -top-2 right-2 bg-slate-100 text-slate-500 text-[8px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider border border-slate-200 opacity-0 hover:opacity-100 transition-opacity">
                Cambiar
              </span>
            )}
            <span className={`text-[9px] block font-bold ${isLic ? 'text-indigo-700' : 'text-slate-500'}`}>
              {liveLic}
            </span>
            <div
              className={`h-7 border rounded mt-1 bg-white flex items-center justify-between px-2 text-[10px] ${
                isLic ? 'border-indigo-300 text-indigo-700 font-semibold' : 'border-slate-200 text-slate-500'
              }`}
            >
              <span>-- Seleccionar --</span>
              <span className="text-[8px] text-slate-400">▼</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
