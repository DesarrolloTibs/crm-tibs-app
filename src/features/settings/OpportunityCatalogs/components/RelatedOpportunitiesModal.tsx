import React from 'react';
import { Link } from 'react-router-dom';
import Modal from '../../../../components/shared/Modal';
import Button from '../../../../components/shared/Button';
import type { OpportunityCatalogOption } from '../schemas/opportunityCatalogs.schema';
import { FolderKanban, ArrowRight } from 'lucide-react';

interface RelatedOpportunitiesModalProps {
  open: boolean;
  option: OpportunityCatalogOption | null;
  catalogTitle: string;
  onClose: () => void;
}

export const RelatedOpportunitiesModal: React.FC<RelatedOpportunitiesModalProps> = ({
  open,
  option,
  catalogTitle,
  onClose,
}) => {
  if (!option) return null;

  const opportunities = option.opportunities || [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="max-w-lg"
      height="h-auto"
      className="rounded-3xl overflow-hidden shadow-2xl border border-slate-100"
      padding="p-6 sm:p-7"
    >
      <div className="space-y-5 text-left">
        {/* Cabecera del Modal */}
        <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
            <FolderKanban size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">
              Oportunidades Relacionadas
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Valor: <strong className="text-slate-700">{option.strname}</strong> en{' '}
              <strong className="text-indigo-600">{catalogTitle}</strong>
            </p>
          </div>
        </div>

        {/* Mensaje descriptivo */}
        <p className="text-xs text-slate-500 leading-relaxed">
          Las siguientes <strong className="text-slate-800">{opportunities.length} oportunidades</strong> tienen actualmente asignado este valor clasificatorio. Haz clic en cualquiera para abrirla directamente en el Pipeline comercial.
        </p>

        {/* Lista interactiva */}
        <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-slate-50/50 p-1">
          {opportunities.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No hay oportunidades activas asociadas a esta opción.
            </div>
          ) : (
            opportunities.map((opp) => (
              <Link
                key={opp.id}
                to={`/pipeline?opportunityId=${opp.id}`}
                onClick={onClose}
                className="group flex items-center justify-between p-3 rounded-xl hover:bg-white hover:shadow-2xs text-xs sm:text-sm text-slate-700 hover:text-indigo-600 font-semibold transition-all"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <span className="truncate">{opp.nombre_proyecto}</span>
                </div>
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 group-hover:text-indigo-600 shrink-0 ml-2">
                  <span>Abrir en Pipeline</span>
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
          <span>{opportunities.length} asociadas</span>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="!py-2 !px-4 text-xs font-semibold"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RelatedOpportunitiesModal;
