'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RoomEvent } from 'livekit-client';
import { nanoid } from 'nanoid';
import {
  useAgent,
  useRoomContext,
  useSessionContext,
  useSessionMessages,
} from '@livekit/components-react';
import type { FarmerProfile } from '@/lib/vaani-api';
import { ChatInputBar } from './chat-input-bar';
import type { AttachmentInput, UIMessage } from './chat-message-bubble';
import { ChatMessageBubble } from './chat-message-bubble';

function agentStatusText(state: string | undefined): string {
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

/** Try to parse a LiveKit message as a Vaani CTA. Returns null if not a CTA. */
function parseCtaMessage(content: string): { message: string; buttons: string[] } | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed.vaani_cta === true && Array.isArray(parsed.buttons)) {
      return { message: parsed.message ?? '', buttons: parsed.buttons as string[] };
    }
  } catch {
    // not JSON — plain text
  }
  return null;
}

interface ChatViewProps {
  farmer: FarmerProfile | null;
}

export function ChatView({ farmer }: ChatViewProps) {
  const session = useSessionContext();
  const { messages: livekitMessages } = useSessionMessages(session);
  const room = useRoomContext();
  const { state: agentState } = useAgent();
  const [localMessages, setLocalMessages] = useState<UIMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen for CTA JSON sent via publish_data from the backend.
  // publish_data fires RoomEvent.DataReceived with raw bytes — correct for CTAs.
  // Agent speech transcripts come through useSessionMessages separately.
  useEffect(() => {
    const handleData = (payload: Uint8Array) => {
      try {
        const text = new TextDecoder().decode(payload);
        const cta = parseCtaMessage(text);
        if (cta) {
          setLocalMessages((prev) => [
            ...prev,
            {
              id: nanoid(),
              type: 'cta',
              message: cta.message,
              buttons: cta.buttons,
              isUser: false,
              timestamp: Date.now(),
            } as UIMessage,
          ]);
        }
      } catch {
        // ignore non-UTF8 payloads
      }
    };
    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room]);

  // Agent speech transcripts from useSessionMessages — filter out any CTA JSON
  // that might bleed through, show everything else as text bubbles.
  const allMessages = useMemo<UIMessage[]>(() => {
    const lk: UIMessage[] = livekitMessages
      .filter((m) => !parseCtaMessage(m.message))
      .map((m) => ({
        id: m.id,
        type: 'text' as const,
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
    // Show the message locally immediately — typed messages don't come back through
    // useSessionMessages (which only captures speech transcripts + chat protocol).
    setLocalMessages((prev) => [
      ...prev,
      {
        id: nanoid(),
        type: 'text',
        content: text,
        isUser: true,
        timestamp: Date.now(),
      },
    ]);
    // Send raw UTF-8 bytes — the backend's data_received handler reads these directly.
    // publishData() sends raw bytes; sendText() uses the DataStream protocol which the
    // backend data_received handler does NOT receive.
    await room.localParticipant.publishData(new TextEncoder().encode(text), { reliable: true });
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

  // CTA button click → send the raw button label string to the agent via sendText
  const handleCtaClick = useCallback(
    async (button: string) => {
      // Show it locally immediately so the farmer sees their selection
      setLocalMessages((prev) => [
        ...prev,
        {
          id: nanoid(),
          type: 'text',
          content: button,
          isUser: true,
          timestamp: Date.now(),
        },
      ]);
      // Send raw bytes — backend data_received handler receives it
      await room.localParticipant.publishData(new TextEncoder().encode(button), { reliable: true });
    },
    [room]
  );

  const farmerName = farmer?.name ?? 'Farmer';
  const initials = farmerName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-[#128C7E] dark:bg-[#0B141A]">
      {/* Chat panel — full width on mobile, centered on desktop */}
      <div className="flex w-full flex-col md:max-w-2xl md:shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 bg-[#075E54] px-4 py-3 text-white dark:bg-[#1F2C34]">
          {/* Vaani avatar */}
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#25D366] text-sm font-bold text-white">
            V
          </div>

          {/* Agent info */}
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold">
              Vaani
              {farmer?.name ? (
                <span className="ml-2 font-normal text-green-200/70">• {farmer.name}</span>
              ) : null}
            </h1>
            <p className="text-xs text-green-200/80">{agentStatusText(agentState)}</p>
          </div>

          {/* Farmer initials chip */}
          {farmer && (
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white"
              title={farmerName}
            >
              {initials}
            </div>
          )}
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto bg-[#ECE5DD] py-3 [scrollbar-width:thin] dark:bg-[#0B141A]">
          {allMessages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <p className="rounded-lg bg-white/60 px-4 py-2 text-xs text-gray-500 dark:bg-black/20 dark:text-gray-400">
                Vaani is listening — say or type something
              </p>
            </div>
          )}
          {allMessages.map((msg) => (
            <ChatMessageBubble key={msg.id} message={msg} onCtaClick={handleCtaClick} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <ChatInputBar onSendText={handleSendText} onAttachment={handleAttachment} />
      </div>
    </div>
  );
}
