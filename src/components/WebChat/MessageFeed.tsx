import React, { useMemo } from 'react';
import { ShieldAlert, Bot } from 'lucide-react';
import { getInitials } from './ChatListSidebar';
import { renderMessageContent, groupMessagesByDate, formatMessageTime } from '../../utils/messageUtils';

interface MessageFeedProps {
  messages: any[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

const MessageFeed: React.FC<MessageFeedProps> = ({ messages, messagesEndRef }) => {
  const groupedMessages = useMemo(() => groupMessagesByDate(messages), [messages]);

  return (
    <div className="flex-grow p-4 overflow-y-auto space-y-4">
      {groupedMessages.map((group) => (
        <div key={group.dateKey} className="space-y-3">
          {/* WhatsApp-style Date Divider Pill */}
          <div className="flex justify-center my-3 sticky top-1 z-10">
            <div className="bg-white/90 backdrop-blur-xs border border-gray-200/80 shadow-xs px-3.5 py-1 rounded-full text-[11px] font-bold text-gray-500 uppercase tracking-wide select-none">
              {group.dateLabel}
            </div>
          </div>

          {/* Messages within this date group */}
          {group.messages.map((msg) => {
            if (msg.sender === 'system') {
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
                className={`flex gap-2.5 items-end max-w-[80%] animate-fade-in ${
                  isContact ? 'mr-auto text-left' : 'ml-auto flex-row-reverse text-right'
                }`}
              >
                {/* Sender avatar (human/bot only) */}
                {!isContact && (
                  <div className="relative group shrink-0 select-none">
                    {isBot ? (
                      <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center border border-blue-200">
                        <Bot size={15} />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-xs border border-emerald-200 cursor-help">
                        {msg.senderUser ? getInitials(msg.senderUser.username) : 'U'}
                        <div className="absolute bottom-full mb-2 right-1/2 translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-[10px] font-bold py-1 px-2.5 rounded shadow-lg whitespace-nowrap z-50 transition-opacity">
                          {msg.senderUser ? msg.senderUser.username : 'Ejecutivo'}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Bubble */}
                <div className="flex flex-col gap-0.5">
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm font-medium shadow-xs leading-relaxed ${
                      isContact
                        ? 'bg-white text-gray-800 border border-gray-150 rounded-bl-xs'
                        : isBot
                          ? 'bg-blue-600 text-white rounded-br-xs'
                          : 'bg-emerald-600 text-white rounded-br-xs'
                    }`}
                  >
                    {renderMessageContent(msg.content)}
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold px-1.5 mt-0.5">
                    {formatMessageTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageFeed;

