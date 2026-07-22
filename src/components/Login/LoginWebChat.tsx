import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { MessageSquare, X, Send, Bot, User, Sparkles, Maximize2, Minimize2 } from 'lucide-react';
import '../WebChat/WebChat.css';

interface Message {
  id: string;
  sender: 'contact' | 'agent' | 'user' | 'system';
  content: string;
  createdAt: string;
}

export const LoginWebChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [visitorId, setVisitorId] = useState<string>('');
  const [recognizedName, setRecognizedName] = useState<string | null>(() => {
    return localStorage.getItem('webchat_recognized_name') || null;
  });
  const [recognizedPhone, setRecognizedPhone] = useState<string | null>(() => {
    return localStorage.getItem('webchat_recognized_phone') || null;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef<string | null>(null);

  const rawBaseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3090';
  const apiUrl = `${rawBaseUrl.replace(/\/$/, '')}/api`;
  const socketUrl = rawBaseUrl.replace(/\/$/, '');

  const checkAndSetRecognizedInfo = useCallback((name?: string | null, phone?: string | null) => {
    if (phone && phone.trim()) {
      const cleanPhone = phone.trim();
      setRecognizedPhone(cleanPhone);
      localStorage.setItem('webchat_recognized_phone', cleanPhone);
    }
    if (name && name.trim()) {
      const cleaned = name.trim();
      const lower = cleaned.toLowerCase();
      const isGeneric =
        lower === '' ||
        lower === 'visitante webchat' ||
        lower === 'visitante web' ||
        lower === 'visitante' ||
        lower === 'contacto' ||
        lower.startsWith('webchat_');
      if (!isGeneric) {
        setRecognizedName(cleaned);
        localStorage.setItem('webchat_recognized_name', cleaned);
      }
    }
  }, []);

  // 1. Obtener o crear visitorId único en localStorage
  useEffect(() => {
    let id = localStorage.getItem('webchat_visitor_id');
    if (!id) {
      id = `webchat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('webchat_visitor_id', id);
    }
    setVisitorId(id);
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!visitorId) return;
    try {
      const res = await fetch(`${apiUrl}/webchat/public/messages/${visitorId}`);
      if (res.ok) {
        const data = await res.json();
        let msgs: Message[] = [];
        if (Array.isArray(data)) {
          msgs = data;
        } else if (data && typeof data === 'object') {
          msgs = data.messages || [];
          checkAndSetRecognizedInfo(data.clientName, data.clientPhone);
          if (data.conversationId) {
            conversationIdRef.current = data.conversationId;
          }
        }
        if (msgs.length > 0) {
          setMessages(msgs);
          if (!conversationIdRef.current && (msgs[0] as any).conversationId) {
            conversationIdRef.current = (msgs[0] as any).conversationId;
          }
        }
      }
    } catch (err) {
      console.error('Error cargando historial de WebChat público:', err);
    }
  }, [visitorId, apiUrl, checkAndSetRecognizedInfo]);

  // 2. Cargar historial y conectar WebSockets al abrir
  useEffect(() => {
    if (!visitorId) return;

    fetchHistory();

    // Conexión Socket.io para escuchar respuestas de ejecutivos e IA en tiempo real
    const socket: Socket = io(socketUrl);

    socket.on('message_received', (newMsg: any) => {
      const isTargetChat =
        (newMsg.conversationId && newMsg.conversationId === conversationIdRef.current) ||
        (newMsg.conversation && newMsg.conversation.externalId === visitorId);

      if (isTargetChat) {
        if (newMsg.conversationId) conversationIdRef.current = newMsg.conversationId;
        
        const convClientName = newMsg.conversation?.clientName || newMsg.clientName;
        const convClientPhone = newMsg.conversation?.client?.telefono || newMsg.clientPhone;
        checkAndSetRecognizedInfo(convClientName, convClientPhone);

        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      } else if (!conversationIdRef.current) {
        fetchHistory();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [visitorId, socketUrl, fetchHistory, checkAndSetRecognizedInfo]);

  // Auto-scroll al final del chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || sending || !visitorId) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    // Mensaje optimista local
    const tempMessage: Message = {
      id: `temp_${Date.now()}`,
      sender: 'contact',
      content: textToSend,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const res = await fetch(`${apiUrl}/webchat/public/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId,
          text: textToSend,
          nickname: 'Visitante Webchat',
        }),
      });

      if (res.ok) {
        const savedMsg = await res.json();
        if (savedMsg && savedMsg.conversationId) {
          conversationIdRef.current = savedMsg.conversationId;
        }
        await fetchHistory();
      }
    } catch (err) {
      console.error('Error enviando mensaje WebChat:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Botón flotante FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="webchat-fab"
        title="Atención y Soporte WebChat"
        aria-label="Abrir WebChat"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Ventana de chat */}
      {isOpen && (
        <div className={`webchat-window ${isMaximized ? 'maximized' : ''}`}>
          {/* Header */}
          <div className="webchat-header">
            <div className="webchat-header-left">
              <div className="webchat-header-icon">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="webchat-header-title" style={{ color: 'white', fontWeight: 'bold' }}>
                  Billy Sales & Services
                </div>
                {recognizedName ? (
                  <div className="webchat-header-user-badge">
                    <User size={12} className="inline mr-1" />
                    <span>Hola, {recognizedName}</span>
                  </div>
                ) : recognizedPhone ? (
                  <div className="webchat-header-user-badge">
                    <User size={12} className="inline mr-1" />
                    <span>Tel: {recognizedPhone}</span>
                  </div>
                ) : (
                  <div className="webchat-header-subtitle">Chat de Asistencia</div>
                )}
              </div>
            </div>
            <div className="webchat-header-actions">
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="webchat-header-btn"
                title={isMaximized ? 'Restaurar' : 'Maximizar'}
              >
                {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="webchat-header-btn"
                title="Cerrar"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Cuerpo de mensajes */}
          <div className="webchat-messages">
            {messages.length === 0 ? (
              <div className="webchat-welcome">
                <div className="webchat-welcome-icon">
                  <Sparkles size={28} />
                </div>
                <h3>¡Hola! Bienvenid@ a Billy Sales</h3>
                <p>¿En qué te podemos ayudar hoy? Escribe tu mensaje para atención inmediata de nuestro asistente o ejecutivo especializado.</p>
              </div>
            ) : (
              messages.map((msg) => {
                if (msg.sender === 'system') return null;
                const isUser = msg.sender === 'contact';
                const isExecutive = msg.sender === 'user';

                return (
                  <div
                    key={msg.id}
                    className={`webchat-message ${isUser ? 'user' : 'bot'}`}
                  >
                    <div
                      className="webchat-msg-avatar"
                      style={
                        isExecutive
                          ? { background: 'linear-gradient(135deg, #059669, #10b981)', color: 'white' }
                          : undefined
                      }
                    >
                      {isUser ? <User size={14} /> : isExecutive ? <User size={14} /> : <Bot size={14} />}
                    </div>
                    <div className="webchat-msg-bubble">
                      {isExecutive && (
                        <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#059669', marginBottom: '2px' }}>
                          Ejecutivo Especializado
                        </div>
                      )}
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}

            {sending && (
              <div className="webchat-typing">
                <div className="webchat-msg-avatar">
                  <Bot size={14} />
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

          {/* Formulario de envío */}
          <form onSubmit={handleSendMessage} className="webchat-input-area">
            <input
              type="text"
              placeholder="Escribe tu mensaje..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={sending}
              className="webchat-input"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="webchat-send-btn font-bold cursor-pointer"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default LoginWebChat;
