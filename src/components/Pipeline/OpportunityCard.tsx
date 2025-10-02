import React from 'react';
import type { Opportunity} from '../../core/models/Opportunity';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit, Trash2, GripVertical, Building2, UserCircle, CircleDollarSign } from 'lucide-react';

interface Props {
  opportunity: Opportunity;
  onEdit: (opportunity: Opportunity) => void;
  onDelete: (opportunity: Opportunity) => void;
  isAdmin: boolean;
}

const OpportunityCard: React.FC<Props> = ({ opportunity, onEdit, onDelete, isAdmin }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: opportunity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white p-4 m-2 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between transition-shadow hover:shadow-md relative group"
    >
      {/* Drag Handle and Actions */}
      <div className="absolute top-2 right-1 flex items-center">
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
            onClick={() => onEdit(opportunity)}
            title="Editar"
          >
            <Edit size={16} />
          </button>
          {isAdmin && (
            <button
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
              onClick={() => onDelete(opportunity)}
              title="Eliminar"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
        <div {...attributes} {...listeners} className="p-1 cursor-grab touch-none text-gray-400 opacity-50 group-hover:opacity-100 hover:text-gray-700 transition-opacity">
          <GripVertical size={20} />
        </div>
      </div>

      {/* Card Content */}
      <div className="flex-grow pr-10">
        <h4 className="font-semibold text-gray-800 truncate text-base">{opportunity.nombre_proyecto}</h4>
        <div className="mt-2 space-y-1 text-sm text-gray-600">
          <p className="flex items-center gap-2"><Building2 size={14} className="text-gray-400" /> {opportunity.empresa}</p>
          <p className="flex items-center gap-2"><UserCircle size={14} className="text-gray-400" /> {opportunity.ejecutivo?.username || 'No asignado'}</p>
        </div>
        <div className="flex items-center gap-2 mt-3 text-base font-semibold text-blue-700">
          <CircleDollarSign size={16} className="mb-px" />
          <span>{Number(opportunity.monto_total).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {opportunity.moneda}</span>
        </div>
      </div>
    </div>
  );
};

export default OpportunityCard;
