import React from 'react';
import type { Opportunity} from '../../core/models/Opportunity';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit, Trash2, GripVertical } from 'lucide-react';

interface Props {
  opportunity: Opportunity;
  onEdit: (opportunity: Opportunity) => void;
  onDelete: (opportunity: Opportunity) => void;
}

const OpportunityCard: React.FC<Props> = ({ opportunity, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: opportunity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white p-4 mb-4 rounded-md shadow-md flex justify-between items-start"
    >
      <div className="flex-grow">
        <h4 className="font-bold">{opportunity.nombre_proyecto}</h4>
        <p className="text-sm text-gray-600">{opportunity.empresa}</p>
        <p className="text-sm text-gray-500">Ejecutivo: {opportunity.ejecutivo_id}</p>
        <p className="text-right font-bold mt-2">{opportunity.monto_total.toLocaleString('en-US', { style: 'currency', currency: opportunity.moneda })}</p>
        <div className="mt-4 flex space-x-2 justify-end">
          <button
            className="flex items-center bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition text-xs"
            onClick={() => onEdit(opportunity)}
            title="Editar"
          >
            <Edit size={14} className="mr-1" /> Editar
          </button>
          <button
            className="flex items-center bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition text-xs"
            onClick={() => onDelete(opportunity)}
            title="Eliminar"
          >
            <Trash2 size={14} className="mr-1" /> Eliminar
          </button>
        </div>
      </div>
      <div {...attributes} {...listeners} className="p-2 cursor-grab touch-none text-gray-400 hover:text-gray-600">
        <GripVertical size={20} />
      </div>
    </div>
  );
};

export default OpportunityCard;
