import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Swal from 'sweetalert2';
import { 
    MessageSquare, 
    Send, 
    Bot, 
    User, 
    Users, 
    Search, 
    Smartphone, 
    Facebook, 
    Instagram,
    Sparkles,
    ShieldAlert,
    RefreshCw,
    X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getUsers } from '../services/usersService';
import { 
    getConversations, 
    getConversationMessages, 
    sendMessage, 
    toggleBotStatus, 
    assignConversation, 
    simulateIncomingMessage 
} from '../services/conversationsService';
import Loader from '../components/Loader/Loader';
import Input from '../components/shared/Input';
import TextArea from '../components/shared/TextArea';
import Button from '../components/shared/Button';

export const ConversationsPage: React.FC = () => {
    const { user, isAdmin } = useAuth();
    const currentUserId = user?.id || user?.sub;

    const [loading, setLoading] = useState(true);
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedConv, setSelectedConv] = useState<any | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    
    // Form and UI States
    const [inputText, setInputText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSimPanelOpen, setIsSimPanelOpen] = useState(false);
    const [sending, setSending] = useState(false);
    
    // Simulation Form State
    const [simChannel, setSimChannel] = useState('whatsapp');
    const [simExternalId, setSimExternalId] = useState('+525551234567');
    const [simNickname, setSimNickname] = useState('Pedro Pérez');
    const [simText, setSimText] = useState('Hola, quiero cotizar unas licencias de software');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);

    // ── Cargar datos iniciales ───────────────────────────────────────────────
    const loadConversationsList = async (selectId?: string) => {
        try {
            const list = await getConversations();
            setConversations(list);
            
            // Si hay una conversación previamente seleccionada, actualizar su estado
            if (selectedConv) {
                const updated = list.find(c => c.id === selectedConv.id);
                if (updated) {
                    setSelectedConv(updated);
                } else if (!isAdmin) {
                    // Si el ejecutivo reasignó el chat y ya no es suyo, deseleccionarlo
                    setSelectedConv(null);
                }
            } else if (selectId) {
                const found = list.find(c => c.id === selectId);
                if (found) setSelectedConv(found);
            }
        } catch (err) {
            console.error('Error al cargar lista de chats:', err);
        }
    };

    useEffect(() => {
        const initData = async () => {
            try {
                setLoading(true);
                const [_, usersList] = await Promise.all([
                    loadConversationsList(),
                    getUsers(),
                ]);
                setAllUsers(usersList);
            } catch (err) {
                console.error('Error cargando datos de conversaciones:', err);
            } finally {
                setLoading(false);
            }
        };
        initData();
    }, []);

    // ── Cargar mensajes del chat seleccionado ───────────────────────────────
    useEffect(() => {
        if (!selectedConv) return;

        const loadMessages = async () => {
            try {
                const data = await getConversationMessages(selectedConv.id);
                setMessages(data);
                scrollToBottom();
            } catch (err) {
                console.error('Error al cargar mensajes:', err);
            }
        };

        loadMessages();
    }, [selectedConv]);

    // ── WebSocket Connect ──────────────────────────────────────────────────
    useEffect(() => {
        const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3091';
        const socket = io(baseUrl, {
            query: { userId: currentUserId },
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Conectado a Websockets de Conversaciones');
        });

        // Escuchar nuevos mensajes
        socket.on('message_received', (newMsg: any) => {
            // Actualizar lista de conversaciones para refrescar snippets de último mensaje
            loadConversationsList();

            // Si el mensaje es del chat activo, agregarlo a la pantalla
            if (selectedConv && newMsg.conversationId === selectedConv.id) {
                setMessages((prev: any[]) => {
                    if (prev.some(m => m.id === newMsg.id)) return prev;
                    return [...prev, newMsg];
                });
                scrollToBottom();
            }
        });

        // Escuchar estatus del bot
        socket.on('bot_status_changed', (data: { conversationId: string; botActive: boolean }) => {
            if (selectedConv && selectedConv.id === data.conversationId) {
                setSelectedConv((prev: any) => prev ? { ...prev, botActive: data.botActive } : null);
            }
            setConversations((prev: any[]) => prev.map(c => c.id === data.conversationId ? { ...c, botActive: data.botActive } : c));
        });

        // Escuchar reasignación
        socket.on('conversation_assigned', () => {
            loadConversationsList();
        });

        return () => {
            socket.disconnect();
        };
    }, [selectedConv, currentUserId]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    // ── Enviar Mensaje Manual ───────────────────────────────────────────────
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !selectedConv || sending) return;

        try {
            setSending(true);
            const msg = await sendMessage(selectedConv.id, inputText.trim());
            setMessages((prev: any[]) => [...prev, msg]);
            setInputText('');
            scrollToBottom();
            loadConversationsList();
        } catch (err) {
            console.error('Error al enviar mensaje:', err);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo enviar el mensaje.' });
        } finally {
            setSending(false);
        }
    };

    // ── Alternar Estado de Bot ───────────────────────────────────────────────
    const handleToggleBot = async () => {
        if (!selectedConv) return;
        const newStatus = !selectedConv.botActive;
        try {
            await toggleBotStatus(selectedConv.id, newStatus);
            setSelectedConv((prev: any) => ({ ...prev, botActive: newStatus }));
        } catch (err) {
            console.error('Error al alternar bot:', err);
        }
    };

    // ── Reasignar Ejecutivo ──────────────────────────────────────────────────
    const handleAssignUser = async (userId: string) => {
        if (!selectedConv) return;
        try {
            await assignConversation(selectedConv.id, userId);
            Swal.fire({
                icon: 'success',
                title: 'Reasignado',
                text: 'Conversación reasignada con éxito.',
                timer: 1500,
                showConfirmButton: false
            });
            loadConversationsList();
        } catch (err) {
            console.error('Error al asignar ejecutivo:', err);
        }
    };

    // ── Simular Mensaje Entrante ─────────────────────────────────────────────
    const handleSimulate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!simExternalId.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Campo Requerido',
                text: simChannel === 'whatsapp' ? 'Por favor, ingrese el Teléfono del Remitente.' : 'Por favor, ingrese el ID del Perfil Social.',
            });
            return;
        }

        if (!simNickname.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Campo Requerido',
                text: 'Por favor, ingrese el Apodo del Perfil Social.',
            });
            return;
        }

        if (!simText.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Campo Requerido',
                text: 'Por favor, ingrese el Mensaje del Cliente.',
            });
            return;
        }

        try {
            Swal.fire({
                title: 'Simulando...',
                text: 'Enviando mensaje de prueba...',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            await simulateIncomingMessage(simChannel, simExternalId.trim(), simNickname.trim(), simText.trim());

            Swal.fire({
                icon: 'success',
                title: 'Mensaje Recibido',
                text: 'El mensaje simulado ha entrado en el sistema.',
                timer: 1500,
                showConfirmButton: false
            });

            setIsSimPanelOpen(false);
            loadConversationsList();
        } catch (err) {
            console.error('Error al simular mensaje:', err);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Error al simular mensaje entrante.' });
        }
    };

    // ── Filtrado de lista de conversaciones ──────────────────────────────────
    const filteredConversations = conversations.filter(c => {
        const query = searchQuery.toLowerCase();
        return (
            c.clientName.toLowerCase().includes(query) ||
            c.externalId.toLowerCase().includes(query) ||
            (c.client?.nombre || '').toLowerCase().includes(query) ||
            (c.assignedUser?.username || '').toLowerCase().includes(query)
        );
    });

    const getChannelIcon = (channel: string) => {
        switch (channel) {
            case 'whatsapp':
                return <span className="p-1.5 bg-emerald-500 rounded-lg text-white" title="WhatsApp"><Smartphone size={16} /></span>;
            case 'messenger':
                return <span className="p-1.5 bg-blue-500 rounded-lg text-white" title="Messenger"><Facebook size={16} /></span>;
            case 'instagram':
                return <span className="p-1.5 bg-gradient-to-tr from-amber-500 via-red-500 to-purple-600 rounded-lg text-white" title="Instagram"><Instagram size={16} /></span>;
            default:
                return <span className="p-1.5 bg-gray-500 rounded-lg text-white"><MessageSquare size={16} /></span>;
        }
    };

    const getInitials = (name: string) => {
        return name.slice(0, 2).toUpperCase();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader />
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-100px)] rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm relative">
            {/* ── COLUMNA IZQUIERDA: LISTADO DE CONVERSACIONES ────────────────────────── */}
            <aside className="w-80 flex flex-col border-r border-gray-150 bg-slate-50/50 shrink-0">
                {/* Header de la columna */}
                <div className="p-4 border-b border-gray-150 flex justify-between items-center gap-2">
                    <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                        <MessageSquare size={20} className="text-blue-700" />
                        Mensajería
                    </h2>
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => loadConversationsList()} 
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title="Actualizar chats"
                        >
                            <RefreshCw size={16} />
                        </button>
                        <button 
                            onClick={() => setIsSimPanelOpen(true)} 
                            className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100 hover:bg-indigo-100 transition-colors cursor-pointer"
                            title="Simular Mensaje"
                        >
                            <Sparkles size={12} />
                            Simulador
                        </button>
                    </div>
                </div>

                {/* Buscador */}
                <div className="p-3 border-b border-gray-100 bg-white">
                    <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-lg focus-within:border-blue-500 focus-within:bg-white transition-all">
                        <Search size={16} className="text-gray-400 absolute left-3" />
                        <input 
                            type="text" 
                            placeholder="Buscar chats o contactos..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full py-2 pl-9 pr-3 text-sm bg-transparent border-0 outline-none text-gray-700 placeholder-gray-400"
                        />
                    </div>
                </div>

                {/* Lista de Chats */}
                <div className="flex-grow overflow-y-auto no-scrollbar">
                    {filteredConversations.length > 0 ? (
                        <ul className="divide-y divide-gray-100">
                            {filteredConversations.map(conv => {
                                const isSelected = selectedConv && selectedConv.id === conv.id;
                                return (
                                    <li 
                                        key={conv.id}
                                        onClick={() => setSelectedConv(conv)}
                                        className={`p-4 flex gap-3 cursor-pointer transition-all hover:bg-blue-50/50 ${isSelected ? 'bg-blue-50 border-l-4 border-blue-600 pl-3' : 'border-l-4 border-transparent'}`}
                                    >
                                        {/* Avatar circular */}
                                        <div className="w-11 h-11 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border border-indigo-200">
                                            {getInitials(conv.clientName)}
                                        </div>
                                        
                                        {/* Detalles del Chat */}
                                        <div className="flex-grow min-w-0">
                                            <div className="flex justify-between items-center gap-1">
                                                <span className="font-bold text-gray-800 text-sm truncate">{conv.clientName}</span>
                                                <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                                                    {conv.lastMessage ? new Date(conv.lastMessage.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </span>
                                            </div>
                                            
                                            <p className="text-xs text-gray-500 truncate font-medium mt-1">
                                                {conv.lastMessage ? conv.lastMessage.content : 'Sin mensajes'}
                                            </p>

                                            <div className="flex justify-between items-center mt-2.5">
                                                <div className="flex items-center gap-1.5">
                                                    {getChannelIcon(conv.channel)}
                                                    <span className="text-[10px] text-gray-400 font-bold truncate max-w-[90px]">{conv.externalId}</span>
                                                </div>
                                                {conv.botActive ? (
                                                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-black rounded uppercase border border-blue-100">
                                                        <Bot size={10} /> Bot
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-black rounded uppercase border border-amber-100">
                                                        <User size={10} /> Humano
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
                            <MessageSquare size={48} className="mb-2 text-gray-300 stroke-[1.5]" />
                            <p className="text-sm font-medium">No se encontraron conversaciones</p>
                        </div>
                    )}
                </div>
            </aside>

            {/* ── COLUMNA DERECHA: HISTORIAL Y ACCIONES DEL CHAT ACTIVO ───────────────── */}
            <main className="flex-grow flex flex-col bg-slate-50/20">
                {selectedConv ? (
                    <>
                        {/* Header de conversación */}
                        <header className="p-4 border-b border-gray-150 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-base shrink-0">
                                    {getInitials(selectedConv.clientName)}
                                </div>
                                <div className="text-left">
                                    <h3 className="font-extrabold text-gray-800 text-base flex items-center gap-2">
                                        {selectedConv.clientName}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        {getChannelIcon(selectedConv.channel)}
                                        <span className="text-xs text-gray-500 font-bold">{selectedConv.externalId}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Controles: Asignación y Bot status */}
                            <div className="flex flex-wrap items-center gap-4 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                                {/* Selector de Ejecutivo */}
                                <div className="flex items-center gap-2">
                                    <Users size={16} className="text-gray-400" />
                                    <select
                                        value={selectedConv.assignedUserId || ''}
                                        onChange={(e) => handleAssignUser(e.target.value)}
                                        className="py-1 px-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 bg-white outline-none focus:border-blue-500 transition-colors"
                                    >
                                        <option value="">-- Sin asignar --</option>
                                        {allUsers.map(u => (
                                            <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Bot Switch */}
                                <div className="flex items-center gap-2.5">
                                    <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                                        <Bot size={14} className={selectedConv.botActive ? "text-blue-600" : "text-gray-400"} />
                                        Bot IA
                                    </span>
                                    <button 
                                        onClick={handleToggleBot}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${selectedConv.botActive ? 'bg-blue-600' : 'bg-gray-300'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${selectedConv.botActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>
                        </header>

                        {/* Mensajes body */}
                        <div className="flex-grow p-4 overflow-y-auto space-y-4">
                            {messages.map(msg => {
                                if (msg.sender === 'system') {
                                    // Render logs de sistema (auditoría bot, asignación)
                                    return (
                                        <div key={msg.id} className="flex justify-center my-2 animate-fade-in">
                                            <div className="bg-amber-50/80 border border-amber-200/50 rounded-xl px-4 py-2 text-center text-xs text-amber-800 font-bold max-w-lg flex items-center gap-2 shadow-xs select-none">
                                                <ShieldAlert size={14} className="shrink-0 text-amber-600" />
                                                <span>{msg.content}</span>
                                            </div>
                                        </div>
                                    );
                                }

                                const isContact = msg.sender === 'contact';
                                const isBot = msg.sender === 'agent';

                                return (
                                    <div 
                                        key={msg.id} 
                                        className={`flex gap-2.5 items-end max-w-[80%] animate-fade-in ${isContact ? 'mr-auto text-left' : 'ml-auto flex-row-reverse text-right'}`}
                                    >
                                        {/* Avatar de Emisor si es humano o bot */}
                                        {!isContact && (
                                            <div className="relative group shrink-0 select-none">
                                                {isBot ? (
                                                    <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center border border-blue-200">
                                                        <Bot size={15} />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-xs border border-emerald-200 cursor-help">
                                                        {msg.senderUser ? getInitials(msg.senderUser.username) : 'U'}
                                                        
                                                        {/* Tooltip con hover */}
                                                        <div className="absolute bottom-full mb-2 right-1/2 translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-[10px] font-bold py-1 px-2.5 rounded shadow-lg whitespace-nowrap z-50 transition-opacity">
                                                            {msg.senderUser ? msg.senderUser.username : 'Ejecutivo'}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Burbuja */}
                                        <div className="flex flex-col gap-0.5">
                                            <div className={`rounded-2xl px-4 py-2.5 text-sm font-medium shadow-xs leading-relaxed ${
                                                isContact 
                                                    ? 'bg-white text-gray-800 border border-gray-150 rounded-bl-xs' 
                                                    : isBot 
                                                        ? 'bg-blue-600 text-white rounded-br-xs' 
                                                        : 'bg-emerald-600 text-white rounded-br-xs'
                                            }`}>
                                                {msg.content}
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-bold px-1.5 mt-0.5">
                                                {new Date(msg.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Footer / Input de Mensaje */}
                        <footer className="p-4 border-t border-gray-150 bg-white">
                            {selectedConv.botActive ? (
                                // Bloqueo de Captura Manual
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-center gap-2.5 text-slate-500 select-none">
                                    <Bot size={18} className="text-blue-500 animate-pulse" />
                                    <span className="text-xs font-bold uppercase tracking-wider">
                                        Bot activo respondiendo en este chat. Desactívalo para permitir la intervención humana.
                                    </span>
                                </div>
                            ) : (
                                // Input normal habilitado
                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Escribe un mensaje de respuesta..." 
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
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
                    </>
                ) : (
                    <div className="flex-grow flex flex-col items-center justify-center py-20 text-center text-gray-400 bg-slate-50/10">
                        <MessageSquare size={64} className="mb-4 text-gray-200 stroke-[1.5]" />
                        <h3 className="font-extrabold text-gray-800 text-lg">Ninguna conversación seleccionada</h3>
                        <p className="text-sm text-gray-500 mt-1 max-w-sm">
                            Elige una conversación de la columna izquierda para leer los mensajes o simula un mensaje de prueba para interactuar con la IA.
                        </p>
                    </div>
                )}
            </main>

            {/* ── PANEL LATERAL: SIMULADOR DE MENSAJES (COLAPSABLE) ────────────────────── */}
            {isSimPanelOpen && (
                <div className="absolute inset-y-0 right-0 z-50 w-96 bg-white border-l border-gray-200 shadow-2xl flex flex-col animate-slide-in-right">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-150 flex justify-between items-center gap-2">
                        <h3 className="font-black text-gray-800 text-base flex items-center gap-1.5">
                            <Sparkles size={18} className="text-indigo-600" />
                            Simulador de Mensaje
                        </h3>
                        <button 
                            onClick={() => setIsSimPanelOpen(false)}
                            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={handleSimulate} className="flex-grow p-4 overflow-y-auto space-y-4 text-left">
                        {/* Selector de Canal */}
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Canal</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'whatsapp', label: 'WhatsApp', icon: <Smartphone size={14} /> },
                                    { id: 'messenger', label: 'Messenger', icon: <Facebook size={14} /> },
                                    { id: 'instagram', label: 'Instagram', icon: <Instagram size={14} /> },
                                ].map(c => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => {
                                            setSimChannel(c.id);
                                            if (c.id === 'whatsapp') setSimExternalId('+525551234567');
                                            else if (c.id === 'messenger') setSimExternalId('fb_user_123');
                                            else setSimExternalId('insta_user_99');
                                        }}
                                        className={`py-2 px-3 flex flex-col items-center gap-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${simChannel === c.id ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {c.icon}
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ID Externo (teléfono o social id) */}
                        <div>
                            <Input
                                label={simChannel === 'whatsapp' ? 'Teléfono del Remitente' : 'ID del Perfil Social'}
                                id="simExternalId"
                                type="text"
                                value={simExternalId}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSimExternalId(e.target.value)}
                                required
                            />
                        </div>

                        {/* Nombre del Perfil */}
                        <div>
                            <Input
                                label="Apodo / Apodo del Perfil Social"
                                id="simNickname"
                                type="text"
                                value={simNickname}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSimNickname(e.target.value)}
                                placeholder="Ej: Pedrito_99 o Pedro Pérez"
                                required
                            />
                        </div>

                        {/* Mensaje */}
                        <div>
                            <label htmlFor="simText" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Mensaje del Cliente</label>
                            <TextArea
                                id="simText"
                                value={simText}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSimText(e.target.value)}
                                rows={5}
                                placeholder="Escribe el mensaje que simulará ser enviado por el cliente..."
                                required
                            />
                        </div>

                        <div className="bg-slate-50 border border-slate-200/65 rounded-lg p-3 text-[11px] text-gray-500 font-medium leading-relaxed">
                            <span className="font-bold text-indigo-700">¿Cómo funciona?</span> Al simular, el backend creará el contacto (si no existe), registrará el mensaje en este chat en tiempo real y disparará el Agente IA para responderte siguiendo tus reglas de configuración del prompt.
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-150 bg-slate-50">
                        <Button type="button" variant="success" onClick={handleSimulate} className="w-full">
                            Simular Entrada de Mensaje
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConversationsPage;
