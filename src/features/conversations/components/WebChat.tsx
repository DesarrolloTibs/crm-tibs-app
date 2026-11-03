import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@features/auth';
import { queryWebChat, transcribeWebChatAudio } from '@core/services/webchatService';
import type { WebChatMessage, WebChatResponse, DashboardRedirect } from '@core/services/webchatService';
import {
  MessageSquare,
  Send,
  X,
  Minus,
  Maximize2,
  Minimize2,
  Mic,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency } from '@shared/utils/formatters';
import { showToast } from '@shared/utils/toast';
import './WebChat.css';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
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

const formatRecordingTime = (totalSeconds: number): string => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const getSupportedAudioMimeType = (): string => {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
};

const WebChat: React.FC = () => {
  const { user, isAdmin } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Estados de grabación y transcripción de voz
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceFeedbackError, setVoiceFeedbackError] = useState<string | null>(null);

  const messagesRef = useRef<ChatMessage[]>([]);
  const audioObjectUrlsRef = useRef<string[]>([]);
  const isSendingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Referencias para MediaRecorder y pista de micrófono
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCancellingRecordingRef = useRef(false);

  // Mantener messagesRef sincronizado en todo momento para evitar closures obsoletos
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  /**
   * Revoca todas las URLs de audio locales almacenadas en la sesión.
   */
  const revokeAllAudioUrls = useCallback(() => {
    audioObjectUrlsRef.current.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    });
    audioObjectUrlsRef.current = [];
  }, []);

  /**
   * Detiene todas las pistas del micrófono y limpia el temporizador de grabación.
   */
  const cleanupMediaResources = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
  }, []);

  // Limpiar micrófono y ObjectURLs al desmontar el componente
  useEffect(() => {
    return () => {
      isCancellingRecordingRef.current = true;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      cleanupMediaResources();
      revokeAllAudioUrls();
    };
  }, [cleanupMediaResources, revokeAllAudioUrls]);

  // Auto-scroll al final cuando llegan mensajes o cambia el estado de carga/transcripción
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isTranscribing]);

  // Focus en el input cuando se abre
  useEffect(() => {
    if (isOpen && !isRecording && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [isOpen, isRecording]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setIsClosing(false);
  }, []);

  const cancelRecording = useCallback(() => {
    isCancellingRecordingRef.current = true;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    cleanupMediaResources();
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingSeconds(0);
  }, [cleanupMediaResources]);

  const handleClose = useCallback(() => {
    if (isRecording) {
      cancelRecording();
    }
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 250);
  }, [isRecording, cancelRecording]);

  const handleClearChat = useCallback(() => {
    if (isRecording) {
      cancelRecording();
    }
    revokeAllAudioUrls();
    messagesRef.current = [];
    setMessages([]);
    setInputValue('');
    setVoiceFeedbackError(null);
  }, [isRecording, cancelRecording, revokeAllAudioUrls]);

  const handleToggleMaximize = useCallback(() => {
    setIsMaximized(prev => !prev);
  }, []);

  const handleSend = useCallback(async (overrideText?: string, audioUrl?: string) => {
    const text = (overrideText !== undefined ? overrideText : inputValue).trim();
    if (!text || isLoading || isSendingRef.current) return;

    isSendingRef.current = true;
    setVoiceFeedbackError(null);

    // Capturar el historial completo de la sesión activa en texto plano ANTES de anexar el nuevo turno
    const history: WebChatMessage[] = messagesRef.current.map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Agregar mensaje del usuario (conservando content en texto plano para conversationHistory y audioUrl opcional para la vista)
    const userMessage: ChatMessage = {
      role: 'user',
      content: text,
      audioUrl,
      timestamp: new Date(),
    };
    const nextMessagesWithUser = [...messagesRef.current, userMessage];
    messagesRef.current = nextMessagesWithUser;
    setMessages(nextMessagesWithUser);

    if (overrideText === undefined) {
      setInputValue('');
    }
    setIsLoading(true);

    try {
      const response: WebChatResponse = await queryWebChat(text, history);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.answer,
        data: response.data,
        dashboardRedirect: response.dashboardRedirect,
        timestamp: new Date(),
      };
      const updated = [...messagesRef.current, assistantMessage];
      messagesRef.current = updated;
      setMessages(updated);
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: error?.response?.status === 403
          ? 'No tienes permisos para realizar esta consulta.'
          : 'Ocurrió un error al procesar tu consulta. Por favor intenta de nuevo.',
        timestamp: new Date(),
      };
      const updated = [...messagesRef.current, errorMessage];
      messagesRef.current = updated;
      setMessages(updated);
    } finally {
      isSendingRef.current = false;
      setIsLoading(false);
    }
  }, [inputValue, isLoading]);

  /**
   * Inicia la captura de audio con MediaRecorder.
   */
  const startRecording = useCallback(async () => {
    if (isLoading || isTranscribing || isRecording || isSendingRef.current) return;

    setVoiceFeedbackError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const msg = 'Tu navegador no soporta grabación de audio con micrófono.';
      setVoiceFeedbackError(msg);
      showToast.error(msg);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];
      isCancellingRecordingRef.current = false;

      const mimeType = getSupportedAudioMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const wasCancelled = isCancellingRecordingRef.current;
        const effectiveMime = recorder.mimeType || mimeType || 'audio/webm';
        const chunks = [...audioChunksRef.current];
        audioChunksRef.current = [];

        // Siempre liberar todas las pistas del micrófono
        cleanupMediaResources();
        setIsRecording(false);
        setRecordingSeconds(0);

        if (wasCancelled) {
          return;
        }

        const audioBlob = new Blob(chunks, { type: effectiveMime });
        if (!audioBlob || audioBlob.size === 0) {
          const emptyMsg = 'No se detectó audio grabado. Intenta hablar más cerca del micrófono.';
          setVoiceFeedbackError(emptyMsg);
          showToast.warning(emptyMsg);
          return;
        }

        // Paso 1: Transcribir el audio a texto plano
        setIsTranscribing(true);
        try {
          const result = await transcribeWebChatAudio(audioBlob);
          const transcribedText = (result?.text || result?.transcript || '').trim();

          if (!transcribedText) {
            const noSpeechMsg = 'No se detectó voz en el audio. Por favor intenta de nuevo.';
            setVoiceFeedbackError(noSpeechMsg);
            showToast.warning(noSpeechMsg);
            return;
          }

          // Crear ObjectURL local para el reproductor de audio en la burbuja
          const localAudioUrl = URL.createObjectURL(audioBlob);
          audioObjectUrlsRef.current.push(localAudioUrl);

          // Paso 2: Reutilizar el flujo de envío enviando el texto plano al backend y mostrando audio + transcripción
          setIsTranscribing(false);
          await handleSend(transcribedText, localAudioUrl);
        } catch (err: any) {
          const backendMessage =
            err?.response?.data?.message ||
            err?.response?.data?.error ||
            'No se pudo transcribir el audio. Intenta grabar nuevamente.';
          const friendlyMessage = Array.isArray(backendMessage)
            ? backendMessage.join('. ')
            : String(backendMessage);
          setVoiceFeedbackError(friendlyMessage);
          showToast.warning(friendlyMessage);
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      cleanupMediaResources();
      setIsRecording(false);
      setRecordingSeconds(0);

      const isDenied =
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError' ||
        err?.name === 'SecurityError';
      const msg = isDenied
        ? 'Permiso de micrófono denegado. Habilita el acceso al micrófono en tu navegador para enviar notas de voz.'
        : 'No se pudo acceder al micrófono. Verifica que esté conectado y disponible.';
      setVoiceFeedbackError(msg);
      showToast.warning(msg);
    }
  }, [isLoading, isTranscribing, isRecording, cleanupMediaResources, handleSend]);

  /**
   * Detiene la grabación activa y dispara la transcripción + envío.
   */
  const stopAndSendRecording = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    isCancellingRecordingRef.current = false;
    try {
      mediaRecorderRef.current.stop();
    } catch {
      cleanupMediaResources();
      setIsRecording(false);
      setRecordingSeconds(0);
    }
  }, [cleanupMediaResources]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleSuggestionClick = useCallback((text: string) => {
    handleSend(text);
  }, [handleSend]);

  /**
   * Renderiza una tabla de datos cuando la respuesta incluye resultados tabulares.
   */
  const renderDataTable = (data: Record<string, any>[]) => {
    if (!data || data.length === 0) return null;

    const hasDescriptive = Object.keys(data[0]).some(k => {
      const kl = k.toLowerCase();
      return kl.includes('nombre') || kl.includes('cuenta') || kl.includes('cliente') || kl.includes('titulo') || kl.includes('proyecto') || kl.includes('actividad') || kl.includes('concepto');
    });

    const headers = Object.keys(data[0]).filter(h => {
      const parts = h.split('.');
      const col = parts[parts.length - 1];
      const l = col.toLowerCase();

      // Excluir columnas de identificadores internos (ID)
      if (
        l === 'id' ||
        l === '_id' ||
        l.endsWith('_id') ||
        l.startsWith('id_') ||
        col.endsWith('Id') ||
        col.endsWith('ID') ||
        /^[iI][dD][A-Z]/.test(col)
      ) {
        return false;
      }

      const fullLower = h.toLowerCase();
      if (fullLower === 'count' || fullLower.endsWith('.count') || fullLower === 'conteo' || fullLower.endsWith('.conteo')) {
        return !hasDescriptive && !data.every(r => Number(r[h]) === 1 || Number(r[h]) === 0);
      }
      return true;
    });

    if (headers.length === 0) {
      return null;
    }

    // Evitar renderizar tablas redundantes de 1 sola fila con poca información (<= 3 columnas)
    // o cuando es una sola celda (1 fila, 1 columna), ya que el texto en lenguaje natural lo cubre de forma fluida.
    if (data.length === 1 && headers.length <= 3) {
      return null;
    }

    // Limpiar nombres de columnas (quitar prefijo "Entidad.")
    const cleanHeader = (h: string) => {
      const parts = h.split('.');
      const col = parts[parts.length - 1];
      const lower = col.toLowerCase();

      if (lower === 'username') return 'Usuario Asignado';
      if (lower === 'description' || lower === 'descripcion') return 'Descripción';
      if (lower === 'cuentacliente' || lower === 'cuentaocliente') return 'Cuenta / Cliente';
      if (lower === 'nombreproyecto') return 'Oportunidad';
      if (lower === 'ticketnumber') return 'Folio';
      if (lower === 'tipoincidencia') return 'Tipo Incidencia';
      if (lower === 'contactname') return 'Contacto';
      if (lower === 'contactemail') return 'Correo Contacto';
      if (lower === 'montototal') return 'Monto';
      if (lower === 'montototalmxnsum' || lower === 'montototalmxn') return 'Monto MXN';
      if (parts[0] === 'TiposActividad' && lower === 'nombre') return 'Tipo de Actividad';
      if (parts[0] === 'Empresas' && lower === 'nombre') return 'Empresa';
      if (parts[0] === 'Clientes' && lower === 'nombre') return 'Cliente';
      if (lower === 'actividad') return 'Actividad';
      if (lower === 'fecha') return 'Fecha y Hora';
      if (lower === 'nombre') return 'Etapa / Nombre';

      return col
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, s => s.toUpperCase())
        .trim();
    };

    // Limitar a 10 filas en la tabla visual
    const displayData = data;

    // Identificador de campos monetarios
    const isCurrencyField = (header: string): boolean => {
      const lower = header.toLowerCase();
      const colName = lower.split('.').pop() || lower;

      if (
        colName === 'id' ||
        colName.endsWith('id') ||
        colName.includes('count') ||
        colName.includes('conteo') ||
        colName.includes('numero') ||
        colName.includes('cantidad') ||
        colName.includes('folio') ||
        colName.includes('date') ||
        colName.includes('fecha') ||
        colName.includes('status') ||
        colName.includes('estatus') ||
        colName.includes('type') ||
        colName.includes('priority') ||
        colName.includes('ticketnumber') ||
        colName.includes('tipocambio') ||
        colName.includes('tipo_cambio')
      ) {
        return false;
      }

      return (
        colName.includes('monto') ||
        colName.includes('precio') ||
        colName.includes('preciobase') ||
        colName.includes('licenciamiento') ||
        colName.includes('servicios') ||
        colName.includes('costo') ||
        colName.includes('ingreso') ||
        colName.includes('gasto') ||
        colName.includes('total') ||
        colName.includes('venta') ||
        lower.includes('monto') ||
        lower.includes('precio') ||
        lower.includes('licenciamiento') ||
        lower.includes('servicios') ||
        lower.includes('costo') ||
        lower.includes('ingreso') ||
        lower.includes('gasto') ||
        lower.includes('total') ||
        lower.includes('venta')
      );
    };

    // Formateador de celda con soporte para badges de stage_type, moneda y números
    const renderCellValue = (header: string, val: any, row: Record<string, any>) => {
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

      if (isCurrencyField(header)) {
        const isMxn = lower.includes('mxn');
        const isUsd = lower.includes('usd');
        const rowCurrency = isMxn ? 'MXN' : isUsd ? 'USD' : (row['Oportunidades.moneda'] || row['moneda'] || row['Moneda'] || 'MXN');
        return formatCurrency(val, rowCurrency, { decimals: 2, showCode: true });
      }

      if (lower === 'description' || lower === 'descripcion') {
        const text = String(val ?? '');
        if (!text || text.trim() === '') return <span style={{ color: '#94a3b8' }}>Sin descripción</span>;
        return (
          <span
            title={text}
            style={{
              display: 'inline-block',
              maxWidth: '220px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              verticalAlign: 'middle',
            }}
          >
            {text}
          </span>
        );
      }

      if (lower === 'fecha' || lower.includes('.fecha') || lower === 'date' || lower.includes('.date')) {
        if (typeof val === 'string' && (val.includes('T') || val.includes('-'))) {
          try {
            const d = new Date(val);
            if (!isNaN(d.getTime())) {
              return d.toLocaleString('es-MX', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
            }
          } catch {}
        }
      }

      if (lower === 'username') {
        const name = String(val ?? '');
        if (!name || name.trim() === '') return <span style={{ color: '#94a3b8' }}>Sin asignar</span>;
        return <span style={{ fontWeight: 600, color: '#1e293b' }}>{name}</span>;
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
              {headers.map(h => {
                const isCurr = isCurrencyField(h);
                return (
                  <th key={h} style={isCurr ? { textAlign: 'right' } : undefined}>
                    {cleanHeader(h)}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, idx) => (
              <tr key={idx}>
                {headers.map(h => {
                  const isCurr = isCurrencyField(h);
                  return (
                    <td
                      key={h}
                      style={
                        isCurr
                          ? { textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }
                          : typeof row[h] === 'number'
                          ? { textAlign: 'right', fontVariantNumeric: 'tabular-nums' }
                          : undefined
                      }
                    >
                      {renderCellValue(h, row[h], row)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 0 && (<div style={{ padding: '6px 10px', fontSize: '10px', color: '#64748b', textAlign: 'center', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>Total: {data.length} {data.length === 1 ? 'registro' : 'registros'}</div>)}
      </div>
    );
  };

  // Si no hay usuario autenticado, no renderizar
  if (!user) return null;

  const isBusy = isLoading || isTranscribing;

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
              <button onClick={() => { handleClearChat(); handleClose(); }} title="Cerrar">
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
                  Soy tu asistente de consultas del CRM. Pregúntame por texto o voz sobre oportunidades, clientes, actividades, gastos, tickets o productos.
                </p>
                <div className="webchat-suggestions">
                  {SUGGESTION_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      className="webchat-suggestion-chip"
                      onClick={() => handleSuggestionClick(chip)}
                      disabled={isBusy || isRecording}
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
                    {msg.audioUrl ? (
                      <div className="webchat-audio-message">
                        <div className="webchat-audio-header">
                          <Mic size={13} />
                          <span>Nota de voz</span>
                        </div>
                        <audio
                          controls
                          preload="metadata"
                          className="webchat-audio-player"
                          src={msg.audioUrl}
                        >
                          Tu navegador no soporta el reproductor de audio.
                        </audio>
                        {msg.content && (
                          <div className="webchat-audio-transcription">
                            <span className="webchat-audio-transcription-label">
                              Transcripción:
                            </span>
                            <span className="webchat-audio-transcription-text">
                              "{msg.content}"
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>

                  {/* Data Table */}
                  {msg.data && msg.data.length > 0 && renderDataTable(msg.data)}
                </div>
              </div>
            ))}

            {/* Indicador de transcripción de audio */}
            {isTranscribing && (
              <div className="webchat-transcribing-status" role="status" aria-live="polite">
                <Loader2 className="webchat-spin-icon" size={14} />
                <span>Analizando audio...</span>
              </div>
            )}

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

          {/* Banner amigable de retroalimentación de voz (error 400 o permisos) */}
          {voiceFeedbackError && (
            <div className="webchat-voice-error" role="alert">
              <AlertCircle size={15} className="webchat-voice-error-icon" />
              <span>{voiceFeedbackError}</span>
              <button
                type="button"
                className="webchat-voice-error-close"
                onClick={() => setVoiceFeedbackError(null)}
                title="Cerrar aviso"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className="webchat-input-area">
            {isRecording ? (
              <div className="webchat-recording-bar" id="webchat-recording-bar">
                <div className="webchat-recording-indicator">
                  <span className="webchat-recording-dot" />
                  <span className="webchat-recording-label">Grabando</span>
                  <span className="webchat-recording-timer" id="webchat-recording-timer">
                    {formatRecordingTime(recordingSeconds)}
                  </span>
                </div>
                <div className="webchat-recording-actions">
                  <button
                    type="button"
                    className="webchat-record-cancel-btn"
                    onClick={cancelRecording}
                    title="Cancelar grabación"
                    id="webchat-record-cancel-btn"
                  >
                    <Trash2 size={16} />
                    <span>Cancelar</span>
                  </button>
                  <button
                    type="button"
                    className="webchat-record-send-btn"
                    onClick={stopAndSendRecording}
                    title="Detener y enviar audio"
                    id="webchat-record-send-btn"
                  >
                    <Send size={16} />
                    <span>Enviar</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isTranscribing ? 'Transcribiendo audio...' : 'Haz una consulta...'}
                  disabled={isBusy}
                  id="webchat-input"
                />
                <button
                  type="button"
                  className="webchat-mic-btn"
                  onClick={startRecording}
                  disabled={isBusy}
                  title="Grabar consulta por voz"
                  id="webchat-mic-btn"
                >
                  {isTranscribing ? <Loader2 className="webchat-spin-icon" /> : <Mic />}
                </button>
                <button
                  type="button"
                  className="webchat-send-btn"
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isBusy}
                  title="Enviar"
                  id="webchat-send-btn"
                >
                  <Send />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default WebChat;
