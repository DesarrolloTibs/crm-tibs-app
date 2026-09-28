import React from 'react';
import Modal from '../../../../components/shared/Modal';
import { CatalogOptionForm } from './CatalogOptionForm';
import type {
  OpportunityCatalogOption,
  CatalogOptionFormData,
} from '../schemas/opportunityCatalogs.schema';
import { Plus, Edit } from 'lucide-react';

interface CatalogOptionModalProps {
  open: boolean;
  editingOption?: OpportunityCatalogOption | null;
  existingOptions?: OpportunityCatalogOption[];
  catalogTitle: string;
  onClose: () => void;
  onSubmit: (data: CatalogOptionFormData) => Promise<void>;
  submitting?: boolean;
}

export const CatalogOptionModal: React.FC<CatalogOptionModalProps> = ({
  open,
  editingOption,
  existingOptions = [],
  catalogTitle,
  onClose,
  onSubmit,
  submitting = false,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="max-w-lg"
      height="h-auto"
      className="rounded-3xl overflow-hidden shadow-2xl border border-slate-100"
      padding="p-6 sm:p-7"
    >
      <div className="space-y-6 text-left">
        {/* Cabecera del Modal */}
        <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
            {editingOption ? <Edit size={20} /> : <Plus size={20} />}
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">
              {editingOption ? `Editar Opción en ${catalogTitle}` : `Nueva Opción para ${catalogTitle}`}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {editingOption
                ? 'Modifica el nombre o la disponibilidad de este valor en los registros de venta.'
                : `Ingresa el nuevo valor clasificatorio para el catálogo de ${catalogTitle}.`}
            </p>
          </div>
        </div>

        {/* Formulario */}
        <CatalogOptionForm
          initialData={editingOption}
          existingOptions={existingOptions}
          catalogTitle={catalogTitle}
          onSubmit={onSubmit}
          onCancel={onClose}
          submitting={submitting}
        />
      </div>
    </Modal>
  );
};

export default CatalogOptionModal;
