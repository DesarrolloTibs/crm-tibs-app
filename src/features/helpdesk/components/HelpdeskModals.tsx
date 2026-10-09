import React from 'react';
import { Settings2, LifeBuoy, AlertTriangle, X } from 'lucide-react';
import Modal from '../shared/Modal';
import Input from '../shared/Input';
import TextArea from '../shared/TextArea';
import Button from '../shared/Button';
import TicketDetail from './TicketDetail';
import OpportunityForm from '../Pipeline/OpportunityForm';
import HelpdeskStagesSettings from './HelpdeskStagesSettings';
import type { TicketStage, Ticket } from '../../core/models/Ticket';

interface Props {
  // Editing stage modal
  editingStage: TicketStage | null;
  setEditingStage: (s: TicketStage | null) => void;
  onSaveStage: (e: React.FormEvent) => void;

  // Resolution modal
  resolutionTicketInfo: { ticketId: string; overStageId: string } | null;
  resolutionNotesTemp: string;
  setResolutionNotesTemp: (v: string) => void;
  onResolutionSubmit: (e: React.FormEvent) => void;
  onResolutionCancel: () => void;

  // Ticket detail modal
  selectedTicket: Ticket | null;
  setSelectedTicket: (t: Ticket | null) => void;
  stages: TicketStage[];
  onUpdateTicket: (payload: Partial<Ticket>) => void;
  onDeleteTicket: (ticket?: Ticket) => void;
  onConvertToOpportunity: (ticket: Ticket) => void;
  onArchive: (ticket: Ticket) => void;

  // New ticket modal
  isCreatingTicket: boolean;
  setIsCreatingTicket: (v: boolean) => void;
  onCreateTicket: (payload: Partial<Ticket>) => void;

  // Convert to opportunity modal
  ticketToConvert: Ticket | null;
  setTicketToConvert: (t: Ticket | null) => void;
  commercialStages: any[];
  onConvertSubmit: (payload: any) => void;

  // Settings drawer
  showStagesConfig: boolean;
  setShowStagesConfig: (v: boolean) => void;
  loadData: () => void;
}

const HelpdeskModals: React.FC<Props> = ({
  editingStage, setEditingStage, onSaveStage,
  resolutionTicketInfo, resolutionNotesTemp, setResolutionNotesTemp, onResolutionSubmit, onResolutionCancel,
  selectedTicket, setSelectedTicket, stages, onUpdateTicket, onDeleteTicket, onConvertToOpportunity, onArchive,
  isCreatingTicket, setIsCreatingTicket, onCreateTicket,
  ticketToConvert, setTicketToConvert, commercialStages, onConvertSubmit,
  showStagesConfig, setShowStagesConfig, loadData,
}) => (
  <>
    {/* Drawer: Configurar Mesa de Ayuda */}
    {showStagesConfig && (
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowStagesConfig(false)} />
        <div className="relative w-full max-w-3xl h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <Settings2 size={20} className="text-indigo-600" />
              <h2 className="text-lg font-bold text-gray-800">Configurar Mesa de Ayuda</h2>
            </div>
            <button onClick={() => setShowStagesConfig(false)} className="p-2 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <HelpdeskStagesSettings onlyHelpdeskDetails={false} onSaveSuccess={() => { loadData(); setShowStagesConfig(false); }} />
          </div>
        </div>
      </div>
    )}

    {/* Modal: Editar Etapa */}
    <Modal open={editingStage !== null} onClose={() => setEditingStage(null)} maxWidth="max-w-md" height="h-auto">
      {editingStage && (
        <form onSubmit={onSaveStage} className="space-y-6 p-2">
          <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-2">
            <Settings2 size={18} className="text-indigo-600" />
            Editar Etapa: {editingStage.strname || 'Nueva'}
          </h3>
          <div className="space-y-4">
            <Input label="Nombre de la Etapa" type="text" value={editingStage.strname} onChange={e => setEditingStage({ ...editingStage, strname: e.target.value })} placeholder="Ej. En Espera" required />
            <Input label="Límite de Días" type="number" min="0"
              value={editingStage.intmaxdays !== undefined && editingStage.intmaxdays !== null ? editingStage.intmaxdays : ''}
              onChange={e => { const val = e.target.value; setEditingStage({ ...editingStage, intmaxdays: val === '' ? null : parseInt(val, 10) }); }}
              placeholder="Ej. 15 (dejar vacío para sin límite)"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase">Tipo de Cierre / Etapa</label>
              <select
                value={Number(editingStage.stage_type ?? 0)}
                onChange={e => setEditingStage({ ...editingStage, stage_type: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value={0}>Abierto / En Proceso (Default)</option>
                <option value={1}>✓ Cerrado / Resuelto</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button type="button" onClick={() => setEditingStage(null)} variant="secondary">Cancelar</Button>
            <Button type="submit" variant="indigo">Guardar</Button>
          </div>
        </form>
      )}
    </Modal>

    {/* Modal: Notas de Resolución */}
    <Modal open={resolutionTicketInfo !== null} onClose={onResolutionCancel} maxWidth="max-w-md" height="h-auto">
      {resolutionTicketInfo && (
        <form onSubmit={onResolutionSubmit} className="space-y-4 p-2">
          <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-2">
            <LifeBuoy size={18} className="text-indigo-600" /> Notas de Resolución
          </h3>
          <div className="flex gap-2 text-rose-800 border border-rose-200 bg-rose-50/40 p-3 rounded-lg text-xs items-center font-medium">
            <AlertTriangle size={15} className="text-rose-600 shrink-0" />
            <span>El ticket pasará a la etapa <strong>Resuelto</strong>. Las notas de resolución son obligatorias para continuar.</span>
          </div>
          <TextArea label="Comentarios / Notas" value={resolutionNotesTemp} onChange={e => setResolutionNotesTemp(e.target.value)} placeholder="Describe detalladamente cómo se resolvió la incidencia..." className="w-full min-h-[100px]" required />
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button type="button" onClick={onResolutionCancel} variant="secondary">Cancelar</Button>
            <Button type="submit" variant="indigo">Resolver Ticket</Button>
          </div>
        </form>
      )}
    </Modal>

    {/* Modal: Detalle del Ticket */}
    <Modal open={selectedTicket !== null} onClose={() => setSelectedTicket(null)} maxWidth="max-w-6xl">
      {selectedTicket && (
        <div className="animate-in fade-in duration-300">
          <div className="border-b border-slate-150 pb-4 mb-6 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Detalle del Ticket #{selectedTicket.ticket_number.toString().padStart(5, '0')}</h2>
          </div>
          <TicketDetail ticket={selectedTicket} stages={stages} onSave={onUpdateTicket} onCancel={() => setSelectedTicket(null)} onDelete={onDeleteTicket} onConvertToOpportunity={onConvertToOpportunity} onArchive={onArchive} />
        </div>
      )}
    </Modal>

    {/* Modal: Registrar Nuevo Ticket */}
    <Modal open={isCreatingTicket} onClose={() => setIsCreatingTicket(false)} maxWidth="max-w-6xl">
      {isCreatingTicket && (
        <div className="animate-in fade-in duration-300">
          <div className="border-b border-slate-150 pb-4 mb-6">
            <h2 className="text-lg font-bold text-slate-800">Registrar Nuevo Ticket</h2>
          </div>
          <TicketDetail stages={stages} onSave={onCreateTicket} onCancel={() => setIsCreatingTicket(false)} />
        </div>
      )}
    </Modal>

    {/* Modal: Convertir Ticket a Oportunidad */}
    <Modal open={ticketToConvert !== null} onClose={() => setTicketToConvert(null)} maxWidth="max-w-6xl">
      {ticketToConvert && (
        <div className="animate-in fade-in duration-300">
          <div className="border-b border-slate-150 pb-4 mb-6">
            <h2 className="text-lg font-bold text-slate-800">Convertir Ticket a Oportunidad Comercial</h2>
            <p className="text-xs text-slate-500 mt-1">
              Completa los datos para el Pipeline Comercial. Al guardar, el ticket #{ticketToConvert.ticket_number.toString().padStart(5, '0')} pasará automáticamente a la etapa "Resuelto".
            </p>
          </div>
          <OpportunityForm
            initialData={{
              id: '',
              nombre_proyecto: `Oportunidad: ${ticketToConvert.strtitle}`,
              description: ticketToConvert.description,
              cliente_id: ticketToConvert.cliente_id,
              cliente: ticketToConvert.cliente,
              empresa: ticketToConvert.cliente ? (ticketToConvert.cliente.company?.nombre || ticketToConvert.cliente.empresa || '') : '',
              companyId: ticketToConvert.cliente?.companyId || null,
              priority: ticketToConvert.priority,
              ejecutivo_id: ticketToConvert.responsable_id || '',
              ejecutivo: ticketToConvert.responsable,
              stage_id: commercialStages.find((s: any) => s.blninitial)?.id || '',
              monto_licenciamiento: 0,
              monto_servicios: 0,
              monto_total: 0,
              moneda: 'USD',
              interactions: [],
              reminders: [],
            }}
            onSubmit={onConvertSubmit}
            onCancel={() => setTicketToConvert(null)}
          />
        </div>
      )}
    </Modal>
  </>
);

export default HelpdeskModals;
