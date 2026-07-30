import React from 'react';
import { Globe, Smartphone, Facebook, Instagram, Sparkles, X } from 'lucide-react';
import Input from '../shared/Input';
import TextArea from '../shared/TextArea';
import Button from '../shared/Button';

interface SimulatorPanelProps {
  simChannel: string;
  simExternalId: string;
  simNickname: string;
  simText: string;
  onChannelChange: (channel: string) => void;
  onExternalIdChange: (v: string) => void;
  onNicknameChange: (v: string) => void;
  onTextChange: (v: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  onClose: () => void;
}

const SIM_CHANNELS = [
  { id: 'webchat',   label: 'WebChat',   icon: <Globe size={14} />,       defaultId: 'webchat_user_99' },
  { id: 'whatsapp',  label: 'WhatsApp',  icon: <Smartphone size={14} />,  defaultId: '+525551234567' },
  { id: 'messenger', label: 'Messenger', icon: <Facebook size={14} />,    defaultId: 'fb_user_123' },
  { id: 'instagram', label: 'Instagram', icon: <Instagram size={14} />,   defaultId: 'insta_user_99' },
];

const SimulatorPanel: React.FC<SimulatorPanelProps> = ({
  simChannel, simExternalId, simNickname, simText,
  onChannelChange, onExternalIdChange, onNicknameChange, onTextChange,
  onSubmit, onClose,
}) => (
  <div className="absolute inset-y-0 right-0 z-50 w-96 bg-white border-l border-gray-200 shadow-2xl flex flex-col animate-slide-in-right">
    {/* Header */}
    <div className="p-4 border-b border-gray-150 flex justify-between items-center gap-2">
      <h3 className="font-black text-gray-800 text-base flex items-center gap-1.5">
        <Sparkles size={18} className="text-indigo-600" />
        Simulador de Mensaje
      </h3>
      <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
        <X size={18} />
      </button>
    </div>

    {/* Form */}
    <form onSubmit={onSubmit} className="flex-grow p-4 overflow-y-auto space-y-4 text-left">
      {/* Channel selector */}
      <div className="space-y-1">
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Canal</label>
        <div className="grid grid-cols-4 gap-2">
          {SIM_CHANNELS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => { onChannelChange(c.id); onExternalIdChange(c.defaultId); }}
              className={`py-2 px-3 flex flex-col items-center gap-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${simChannel === c.id ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {c.icon}{c.label}
            </button>
          ))}
        </div>
      </div>

      <Input
        label={simChannel === 'whatsapp' ? 'Teléfono del Remitente' : 'ID del Perfil Social'}
        type="text"
        value={simExternalId}
        onChange={(e) => onExternalIdChange(e.target.value)}
        required
      />

      <Input
        label="Apodo / Nombre del Perfil Social"
        type="text"
        value={simNickname}
        onChange={(e) => onNicknameChange(e.target.value)}
        placeholder="Ej: Pedrito_99 o Pedro Pérez"
        required
      />

      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Mensaje del Cliente</label>
        <TextArea
          value={simText}
          onChange={(e) => onTextChange(e.target.value)}
          rows={5}
          placeholder="Escribe el mensaje que simulará ser enviado por el cliente..."
          required
        />
      </div>

      <div className="bg-slate-50 border border-slate-200/65 rounded-lg p-3 text-[11px] text-gray-500 font-medium leading-relaxed">
        <span className="font-bold text-indigo-700">¿Cómo funciona?</span> Al simular, el backend creará el contacto (si no existe), registrará el mensaje en tiempo real y disparará el Agente IA para responderte según tu configuración del prompt.
      </div>
    </form>

    {/* Footer */}
    <div className="p-4 border-t border-gray-150 bg-slate-50">
      <Button type="button" variant="success" onClick={() => onSubmit()} className="w-full">
        Simular Entrada de Mensaje
      </Button>
    </div>
  </div>
);

export default SimulatorPanel;
