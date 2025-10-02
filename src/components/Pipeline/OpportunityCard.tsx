import React from 'react';
import type { Opportunity, OpportunityStageType} from '../../core/models/Opportunity';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit, Trash2, GripVertical, Building2 } from 'lucide-react';

interface Props {
  opportunity: Opportunity;
  onEdit: (opportunity: Opportunity) => void;
  onDelete: (opportunity: Opportunity) => void;
  isAdmin: boolean;
}

const stageProgress: Record<OpportunityStageType, { percent: number; color: string }> = {
  'Nuevo': { percent: 0, color: 'bg-gray-400' },
  'Descubrimiento': { percent: 20, color: 'bg-blue-400' },
  'Estimación': { percent: 40, color: 'bg-blue-500' },
  'Propuesta': { percent: 60, color: 'bg-indigo-500' },
  'Negociación': { percent: 80, color: 'bg-purple-500' },
  'Ganada': { percent: 100, color: 'bg-green-500' },
  'Perdida': { percent: 100, color: 'bg-red-500' },
  'Cancelada': { percent: 100, color: 'bg-red-500' },
};

const businessLineColors: Record<string, string> = {
  'Datos': 'bg-cyan-100 text-cyan-800',
  'Desarrollo': 'bg-amber-100 text-amber-800',
  'Cloud': 'bg-sky-100 text-sky-800',
  'IA': 'bg-violet-100 text-violet-800',
};

const getInitials = (name = 'N A') => {
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const Avatar: React.FC<{ username?: string }> = ({ username }) => (
  <div
    className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold"
    title={username || 'No asignado'}
  >
    {getInitials(username)}
  </div>
);

const OpportunityCard: React.FC<Props> = ({ opportunity, onEdit, onDelete, isAdmin }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: opportunity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const progress = stageProgress[opportunity.etapa] || { percent: 0, color: 'bg-gray-400' };
  const tagColor = businessLineColors[opportunity.linea_negocio] || 'bg-gray-100 text-gray-800';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white m-2 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between transition-all hover:shadow-lg hover:-translate-y-1 relative group w-[250px] h-[200px]"
    >
      <div className="p-4">
        {/* Actions and Drag Handle */}
        <div className="flex justify-end items-center h-8">
          <div className="flex items-center">
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full"
                onClick={() => onEdit(opportunity)}
                title="Editar"
              >
                <Edit size={16} />
              </button>
              {isAdmin && (
                <button
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full"
                  onClick={() => onDelete(opportunity)}
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <button
              {...attributes} {...listeners}
              className="p-1 cursor-grab touch-none text-gray-400 opacity-50 group-hover:opacity-100 hover:text-gray-700"
              aria-label="Arrastrar oportunidad"
            >
              <GripVertical size={20} />
            </button>
          </div>
        </div>

        {/* Title */}
        <h4 className="font-bold text-gray-800 text-sm pr-4 leading-tight mb-3">{opportunity.nombre_proyecto}</h4>

        {/* Amount */}
        <div className="my-3">
          <span className="text-xl font-bold text-blue-700">${Number(opportunity.monto_total).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className="ml-2 text-xs text-blue-700 font-bold">{opportunity.moneda}</span>
         <p className="flex items-center gap-2 text-gray-500"><Building2 size={14} /> {opportunity.empresa}</p>
        </div>

        {/* Details and Tags */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${tagColor}`}>{opportunity.linea_negocio}</span>
            <div className="flex items-center gap-2 text-gray-600">
              <Avatar username={opportunity.ejecutivo?.username} />
            </div>
          </div>
         
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-200 rounded-b-xl h-2 w-full">
        <div className={`${progress.color} h-2 rounded-b-xl`} style={{ width: `${progress.percent}%` }}></div>
      </div>
    </div>
  );
};

export default OpportunityCard;
