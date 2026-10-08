import React from 'react';
import { MessageSquare } from 'lucide-react';

// Componentes Compartidos del CRM
import Loader from '../../components/shared/Loader';
import EmptyState from '../../components/shared/EmptyState';
import Notification from '../../components/shared/Notification';

// Componentes del Módulo Modular de Conversaciones
import ChatListSidebar from './components/ChatListSidebar';
import ChatWindowHeader from './components/ChatWindowHeader';
import MessageFeed from './components/MessageFeed';
import MessageInputBar from './components/MessageInputBar';
import WhatsAppTemplateSelectorModal from './components/WhatsAppTemplateSelectorModal';
import { getWhatsAppWindowStatus } from './utils/conversations.messages';

// Hook Orquestador Modular de WebSockets y Estado
import { useConversationsSocket } from './hooks/useConversationsSocket';

export const ConversationsPage: React.FC = () => {
  const cv = useConversationsSocket();

  if (cv.loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-140px)]">
        <Loader />
      </div>
    );
  }

  const windowStatus = getWhatsAppWindowStatus(cv.selectedConv);
  const isWhatsAppWindowClosed = windowStatus.isWhatsApp && windowStatus.isExpired;

  return (
    <div className="flex h-[calc(95vh-95px)] rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs relative">
      {/* Columna Izquierda: Lista Lateral de Chats */}
      <ChatListSidebar
        conversations={cv.filteredConversations}
        selectedConv={cv.selectedConv}
        searchQuery={cv.filters.search}
        selectedChannelFilter={cv.filters.channel}
        unreadMap={cv.unreadMap}
        onSearchChange={(search) => cv.setFilters((prev) => ({ ...prev, search }))}
        onChannelChange={(channel) => cv.setFilters((prev) => ({ ...prev, channel }))}
        onSelectConv={cv.handleSelectConv}
        onRefresh={() => cv.loadConversationsList()}
      />

      {/* Columna Derecha: Feed y Ventana del Chat Activo */}
      <main
        className={`flex-1 min-w-0 bg-slate-50/20 ${
          cv.selectedConv ? 'flex flex-col' : 'hidden md:flex md:flex-col'
        }`}
      >
        {cv.selectedConv ? (
          <>
            <ChatWindowHeader
              conv={cv.selectedConv}
              allUsers={cv.allUsers}
              onBack={() => cv.handleSelectConv(null)}
              onAssignUser={cv.handleAssignUser}
              onToggleBot={cv.handleToggleBot}
              onOpenTemplates={() => cv.setIsTemplateModalOpen(true)}
            />

            <MessageFeed
              messages={cv.messages}
              messagesEndRef={cv.messagesEndRef}
            />

            <MessageInputBar
              botActive={cv.selectedConv.botActive}
              inputText={cv.inputText}
              sending={cv.sending}
              onInputChange={cv.setInputText}
              onSubmit={cv.handleSendMessage}
              isWhatsAppWindowClosed={isWhatsAppWindowClosed}
              conversation={cv.selectedConv}
              onTemplateSent={cv.handleTemplateSent}
              onShowNotification={cv.notify}
            />
          </>
        ) : (
          <EmptyState
            icon={<MessageSquare className="w-10 h-10 text-indigo-400" />}
            title="Ninguna conversación seleccionada"
            message="Elige un chat de la columna izquierda para visualizar y responder mensajes en tiempo real."
            className="flex-grow bg-slate-50/10"
          />
        )}
      </main>

      {/* Modal Selector de Plantillas Oficiales de WhatsApp */}
      <WhatsAppTemplateSelectorModal
        open={cv.isTemplateModalOpen}
        onClose={() => cv.setIsTemplateModalOpen(false)}
        conversation={cv.selectedConv}
        onTemplateSent={cv.handleTemplateSent}
      />

      {/* Sistema de Notificaciones Unificado */}
      <Notification
        show={cv.notification.show}
        type={cv.notification.type}
        title={cv.notification.title}
        message={cv.notification.message}
        onConfirm={cv.hideNotification}
        onCancel={cv.hideNotification}
      />
    </div>
  );
};

export default ConversationsPage;
