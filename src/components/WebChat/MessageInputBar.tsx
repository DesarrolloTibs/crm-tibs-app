import React from 'react';
import { Send, Bot } from 'lucide-react';

interface MessageInputBarProps {
  botActive: boolean;
  inputText: string;
  sending: boolean;
  onInputChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const MessageInputBar: React.FC<MessageInputBarProps> = ({
  botActive, inputText, sending, onInputChange, onSubmit,
}) => (
  <footer className="p-4 border-t border-gray-150 bg-white">
    {botActive ? (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-center gap-2.5 text-slate-500 select-none">
        <Bot size={18} className="text-blue-500 animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-wider">
          Bot activo respondiendo en este chat. Desactívalo para permitir la intervención humana.
        </span>
      </div>
    ) : (
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Escribe un mensaje de respuesta..."
          value={inputText}
          onChange={(e) => onInputChange(e.target.value)}
          className="flex-grow py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:bg-white outline-none transition-all text-gray-700"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors cursor-pointer flex items-center justify-center shrink-0"
        >
          <Send size={18} />
        </button>
      </form>
    )}
  </footer>
);

export default MessageInputBar;
