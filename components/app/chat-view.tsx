'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import { DotsThreeVertical, Phone, VideoCamera } from '@phosphor-icons/react';
import { useAgent, useChat, useSessionContext, useSessionMessages } from '@livekit/components-react';
import type { AttachmentInput, UIMessage } from './chat-message-bubble';
import { ChatMessageBubble } from './chat-message-bubble';
import { ChatInputBar } from './chat-input-bar';

function AgentStatusText(state: string | undefined): string {
  switch (state) {
    case 'thinking':
      return 'Typing…';
    case 'speaking':
      return 'Speaking…';
    case 'listening':
      return 'Listening…';
    default:
      return 'Online';
  }
}

export function ChatView() {
  const session = useSessionContext();
  const { messages: livekitMessages } = useSessionMessages(session);
  const { send } = useChat();
  const { state: agentState } = useAgent();
  const [localMessages, setLocalMessages] = useState<UIMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Convert LiveKit messages to UIMessage format
  const allMessages = useMemo<UIMessage[]>(() => {
    const lk: UIMessage[] = livekitMessages.map((m) => ({
      id: m.id,
      type: 'text',
      content: m.message,
      isUser: m.from?.isLocal ?? false,
      timestamp: m.timestamp,
    }));
    return [...lk, ...localMessages].sort((a, b) => a.timestamp - b.timestamp);
  }, [livekitMessages, localMessages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages]);

  const handleSendText = async (text: string) => {
    await send(text);
  };

  const handleAttachment = (msg: AttachmentInput) => {
    const newMsg = {
      ...msg,
      id: nanoid(),
      isUser: true,
      timestamp: Date.now(),
    } as UIMessage;
    setLocalMessages((prev) => [...prev, newMsg]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-[#128C7E] dark:bg-[#0B141A]">
      {/* Chat panel — full width on mobile, centered on desktop */}
      <div className="flex w-full flex-col md:max-w-2xl md:shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 bg-[#075E54] px-4 py-3 text-white dark:bg-[#1F2C34]">
          {/* Agent avatar */}
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#25D366] text-sm font-bold text-white">
            AI
          </div>

          {/* Agent info */}
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold">AI Assistant</h1>
            <p className="text-xs text-green-200/80">{AgentStatusText(agentState)}</p>
          </div>

          {/* Placeholder: Video call */}
          <button
            className="rounded-full p-2 transition-colors hover:bg-white/10"
            aria-label="Video call (coming soon)"
            title="Video call — coming soon"
          >
            <VideoCamera size={20} />
          </button>

          {/* Placeholder: Voice call */}
          <button
            className="rounded-full p-2 transition-colors hover:bg-white/10"
            aria-label="Voice call (coming soon)"
            title="Voice call — coming soon"
          >
            <Phone size={20} />
          </button>

          {/* More options */}
          <button
            className="rounded-full p-2 transition-colors hover:bg-white/10"
            aria-label="More options"
          >
            <DotsThreeVertical size={20} weight="bold" />
          </button>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto bg-[#ECE5DD] py-3 dark:bg-[#0B141A] [scrollbar-width:thin]">
          {allMessages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <p className="rounded-lg bg-white/60 px-4 py-2 text-xs text-gray-500 dark:bg-black/20 dark:text-gray-400">
                Agent is listening — say or type something
              </p>
            </div>
          )}
          {allMessages.map((msg) => (
            <ChatMessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <ChatInputBar onSendText={handleSendText} onAttachment={handleAttachment} />
      </div>
    </div>
  );
}
