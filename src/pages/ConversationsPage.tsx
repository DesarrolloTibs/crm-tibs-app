import React from 'react';
import { MessageSquare } from 'lucide-react';
import { useConversationsSocket } from '../hooks/useConversationsSocket';
import Loader from '../components/shared/Loader';
import Notification from '../components/shared/Notification';
import ChatListSidebar from '../components/WebChat/ChatListSidebar';
import ChatWindowHeader from '../components/WebChat/ChatWindowHeader';
import MessageFeed from '../components/WebChat/MessageFeed';
import MessageInputBar from '../components/WebChat/MessageInputBar';
import SimulatorPanel from '../components/WebChat/SimulatorPanel';

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
        onOpenSimulator={() => cv.setIsSimPanelOpen(true)}
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
            />
            <MessageFeed messages={cv.messages} messagesEndRef={cv.messagesEndRef} />
            <MessageInputBar
              botActive={cv.selectedConv.botActive}
              inputText={cv.inputText}
              sending={cv.sending}
              onInputChange={cv.setInputText}
              onSubmit={cv.handleSendMessage}
            />
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

      {/* Simulator slide-in panel */}
      {cv.isSimPanelOpen && (
        <SimulatorPanel
          simChannel={cv.simChannel}
          simExternalId={cv.simExternalId}
          simNickname={cv.simNickname}
          simText={cv.simText}
          onChannelChange={cv.setSimChannel}
          onExternalIdChange={cv.setSimExternalId}
          onNicknameChange={cv.setSimNickname}
          onTextChange={cv.setSimText}
          onSubmit={cv.handleSimulate}
          onClose={() => cv.setIsSimPanelOpen(false)}
        />
      )}

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
