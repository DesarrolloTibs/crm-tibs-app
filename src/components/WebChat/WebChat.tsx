import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { queryWebChat } from '../../services/webchatService';
import type { WebChatMessage, WebChatResponse, DashboardRedirect } from '../../services/webchatService';
import {
  MessageSquare,
  Send,
  X,
  Minus,
  Maximize2,
  Minimize2,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
import './WebChat.css';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  data?: Record<string, any>[];
  dashboardRedirect?: DashboardRedirect | null;
  timestamp: Date;
}

const SUGGESTION_CHIPS = [
  '¿Cuántas oportunidades tengo?',
  'Top 5 clientes por ventas',
  'Mis actividades de esta semana',
  'Tickets abiertos',
  '¿Cuánto he gastado este mes?',
];

const WebChat: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll al final cuando llegan mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Focus en el input cuando se abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [isOpen]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setIsClosing(false);
  }, []);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 250);
  }, []);

  const handleToggleMaximize = useCallback(() => {
    setIsMaximized(prev => !prev);
  }, []);

  const handleSend = useCallback(async (overrideText?: string) => {
    const text = overrideText || inputValue.trim();
    if (!text || isLoading) return;

    // Agregar mensaje del usuario
    const userMessage: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Preparar historial para contexto (últimos 6 mensajes)
      const history: WebChatMessage[] = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response: WebChatResponse = await queryWebChat(text, history);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.answer,
        data: response.data,
        dashboardRedirect: response.dashboardRedirect,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: error?.response?.status === 403
          ? 'No tienes permisos para realizar esta consulta.'
          : 'Ocurrió un error al procesar tu consulta. Por favor intenta de nuevo.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleDashboardRedirect = useCallback((redirect: DashboardRedirect) => {
    const params = new URLSearchParams();
    if (redirect.tab) params.set('tab', redirect.tab);
    if (redirect.executiveId) params.set('executive', redirect.executiveId);
    if (redirect.dateStart) params.set('dateStart', redirect.dateStart);
    if (redirect.dateEnd) params.set('dateEnd', redirect.dateEnd);
    if (redirect.pipelineId) params.set('pipeline', redirect.pipelineId);
    if (redirect.helpdeskId) params.set('helpdesk', redirect.helpdeskId);

    navigate(`/dashboard?${params.toString()}`);
    handleClose();
  }, [navigate, handleClose]);

  const handleSuggestionClick = useCallback((text: string) => {
    handleSend(text);
  }, [handleSend]);

  /**
   * Renderiza una tabla de datos cuando la respuesta incluye resultados tabulares.
   */
  const renderDataTable = (data: Record<string, any>[]) => {
    if (!data || data.length === 0) return null;

    const headers = Object.keys(data[0]);

    // Evitar renderizar tablas redundantes de 1 sola fila con poca información (<= 3 columnas)
    // o cuando es una sola celda (1 fila, 1 columna), ya que el texto en lenguaje natural lo cubre de forma fluida.
    if (data.length === 1 && headers.length <= 3) {
      return null;
    }

    // Limpiar nombres de columnas (quitar prefijo "Entidad.")
    const cleanHeader = (h: string) => {
      const parts = h.split('.');
      return parts[parts.length - 1]
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, s => s.toUpperCase())
        .trim();
    };

    // Limitar a 10 filas en la tabla visual
    const displayData = data.slice(0, 10);

    // Formateador de celda con soporte para badges de stage_type y números
    const renderCellValue = (header: string, val: any) => {
      const lower = header.toLowerCase();
      if (lower.includes('stage_type') || lower.includes('stagetype') || lower.includes('tipoetapa')) {
        const num = Number(val);
        if (num === 1) {
          return (
            <span style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '2px 6px', borderRadius: '9999px', fontSize: '10px', fontWeight: 'bold', display: 'inline-block' }}>
              ✓ Ganada / Resuelto
            </span>
          );
        }
        if (num === 2) {
          return (
            <span style={{ backgroundColor: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3', padding: '2px 6px', borderRadius: '9999px', fontSize: '10px', fontWeight: 'bold', display: 'inline-block' }}>
              ✕ Perdida
            </span>
          );
        }
        return (
          <span style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '2px 6px', borderRadius: '9999px', fontSize: '10px', fontWeight: '500', display: 'inline-block' }}>
            Abierta / Proceso
          </span>
        );
      }

      if (typeof val === 'number') {
        return val.toLocaleString('es-MX');
      }
      return String(val ?? '—');
    };

    return (
      <div className="webchat-data-table">
        <table>
          <thead>
            <tr>
              {headers.map(h => (
                <th key={h}>{cleanHeader(h)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, idx) => (
              <tr key={idx}>
                {headers.map(h => (
                  <td key={h}>
                    {renderCellValue(h, row[h])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 10 && (
          <div style={{ padding: '6px 10px', fontSize: '10px', color: '#94a3b8', textAlign: 'center' }}>
            Mostrando 10 de {data.length} resultados
          </div>
        )}
      </div>
    );
  };

  // Si no hay usuario autenticado, no renderizar
  if (!user) return null;

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          className="webchat-fab"
          onClick={handleOpen}
          title="Abrir Asistente"
          id="webchat-fab"
        >
          <MessageSquare />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`webchat-window ${isMaximized ? 'maximized' : ''} ${isClosing ? 'closing' : ''}`}
          id="webchat-window"
        >
          {/* Header */}
          <div className="webchat-header">
            <div className="webchat-header-left">
              <div className="webchat-header-icon">
                <MessageSquare size={18} />
              </div>
              <div>
                <div className="webchat-header-title">
                  Billy S&S
                  <span className={`webchat-role-badge ${isAdmin ? 'admin' : 'executive'}`}>
                    {isAdmin ? 'Admin' : 'Ejecutivo'}
                  </span>
                </div>
                <div className="webchat-header-subtitle">Consultas analíticas con IA</div>
              </div>
            </div>
            <div className="webchat-header-actions">
              <button onClick={handleToggleMaximize} title={isMaximized ? 'Restaurar' : 'Maximizar'}>
                {isMaximized ? <Minimize2 /> : <Maximize2 />}
              </button>
              <button onClick={handleClose} title="Minimizar">
                <Minus />
              </button>
              <button onClick={() => { setMessages([]); handleClose(); }} title="Cerrar">
                <X />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="webchat-messages">
            {messages.length === 0 && (
              <div className="webchat-welcome">
                <div className="webchat-welcome-icon">
                  <MessageSquare />
                </div>
                <h3>¡Hola, {user.username}!</h3>
                <p>
                  Soy tu asistente de consultas del CRM. Pregúntame sobre oportunidades, clientes, actividades, gastos, tickets o productos.
                </p>
                <div className="webchat-suggestions">
                  {SUGGESTION_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      className="webchat-suggestion-chip"
                      onClick={() => handleSuggestionClick(chip)}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`webchat-message ${msg.role}`}>
                <div className="webchat-msg-avatar">
                  {msg.role === 'assistant' ? <MessageSquare size={14} /> : user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="webchat-msg-bubble">
                    {msg.content}
                  </div>

                  {/* Data Table */}
                  {msg.data && msg.data.length > 0 && renderDataTable(msg.data)}

                  {/* Dashboard Redirect Button */}
                  {msg.dashboardRedirect && (
                    <button
                      className="webchat-dashboard-btn"
                      onClick={() => handleDashboardRedirect(msg.dashboardRedirect!)}
                    >
                      <BarChart3 />
                      Ver en Dashboard
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="webchat-typing">
                <div className="webchat-msg-avatar" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: 'white' }}>
                  <MessageSquare size={14} />
                </div>
                <div className="webchat-typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="webchat-input-area">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Haz una consulta..."
              disabled={isLoading}
              id="webchat-input"
            />
            <button
              className="webchat-send-btn"
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isLoading}
              title="Enviar"
              id="webchat-send-btn"
            >
              <Send />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default WebChat;
