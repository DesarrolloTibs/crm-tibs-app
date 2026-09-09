import React from 'react';
import { MessageSquare } from 'lucide-react';
import { useConversationsSocket } from '../hooks/useConversationsSocket';
import Loader from '../components/shared/Loader';
import EmptyState from '../components/shared/EmptyState';
import Notification from '../components/shared/Notification';
import ChatListSidebar from '../components/WebChat/ChatListSidebar';
import ChatWindowHeader from '../components/WebChat/ChatWindowHeader';
import MessageFeed from '../components/WebChat/MessageFeed';
import MessageInputBar from '../components/WebChat/MessageInputBar';
import WhatsAppTemplateSelectorModal from '../components/WebChat/WhatsAppTemplateSelectorModal';
import { getWhatsAppWindowStatus } from '../utils/messageUtils';

const ConversationsPage: React.FC = () => {
  const cv = useConversationsSocket();

  if (cv.loading) {
    return <div className="flex justify-center items-center h-screen"><Loader /></div>;
  }

  return (
    <div className="flex h-[calc(100vh-100px)] rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm relative">

      {/* Left column: chat list */}
      <ChatListSidebar
        conversations={cv.filteredConversations}
        selectedConv={cv.selectedConv}
        searchQuery={cv.searchQuery}
        selectedChannelFilter={cv.selectedChannelFilter}
        onSearchChange={cv.setSearchQuery}
        onChannelChange={cv.setSelectedChannelFilter}
        onSelectConv={cv.setSelectedConv}
        onRefresh={() => cv.loadConversationsList()}
      />

      {/* Center column: active chat */}
      <main className={`flex-grow bg-slate-50/20 ${cv.selectedConv ? 'flex flex-col w-full' : 'hidden md:flex md:flex-col'}`}>
        {cv.selectedConv ? (
          <>
            <ChatWindowHeader
              conv={cv.selectedConv}
              allUsers={cv.allUsers}
              onBack={() => cv.setSelectedConv(null)}
              onAssignUser={cv.handleAssignUser}
              onToggleBot={cv.handleToggleBot}
              onOpenTemplates={() => cv.setIsTemplateModalOpen(true)}
            />
            <MessageFeed messages={cv.messages} messagesEndRef={cv.messagesEndRef} />
            {(() => {
              const windowStatus = getWhatsAppWindowStatus(cv.selectedConv);
              const isWhatsAppWindowClosed = windowStatus.isWhatsApp && windowStatus.isExpired;
              return (
                <MessageInputBar
                  botActive={cv.selectedConv.botActive}
                  inputText={cv.inputText}
                  sending={cv.sending}
                  onInputChange={cv.setInputText}
                  onSubmit={cv.handleSendMessage}
                  isWhatsAppWindowClosed={isWhatsAppWindowClosed}
                  conversation={cv.selectedConv}
                  onTemplateSent={cv.handleTemplateSent}
                  onShowNotification={cv.showNotif}
                />
              );
            })()}
          </>
        ) : (
          <EmptyState
            icon={<MessageSquare className="w-8 h-8 text-indigo-500" />}
            title="Ninguna conversación seleccionada"
            message="Elige una conversación de la columna izquierda para interactuar con tus clientes en tiempo real."
            className="flex-grow bg-slate-50/10"
          />
        )}
      </main>

      {/* WhatsApp Official Template Selector Modal */}
      <WhatsAppTemplateSelectorModal
        open={cv.isTemplateModalOpen}
        onClose={() => cv.setIsTemplateModalOpen(false)}
        conversation={cv.selectedConv}
        onTemplateSent={cv.handleTemplateSent}
      />

      {/* Global notification (replaces Swal) */}
      <Notification
        show={cv.notification.show}
        type={cv.notification.type}
        title={cv.notification.title}
        message={cv.notification.message}
        onConfirm={cv.hideNotif}
        onCancel={cv.hideNotif}
      />
    </div>
  );
};

export default ConversationsPage;
