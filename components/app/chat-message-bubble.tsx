'use client';

import { FilePdf, Play } from '@phosphor-icons/react';
import { cn } from '@/lib/shadcn/utils';

export type UIMessage =
  | { id: string; type: 'text'; content: string; isUser: boolean; timestamp: number }
  | {
      id: string;
      type: 'image';
      url: string;
      filename: string;
      isUser: boolean;
      timestamp: number;
    }
  | {
      id: string;
      type: 'pdf';
      url: string;
      filename: string;
      size?: string;
      isUser: boolean;
      timestamp: number;
    }
  | { id: string; type: 'voice-note'; duration: number; isUser: boolean; timestamp: number };

/** Attachment-only payload (no id / isUser / timestamp) — used by ChatInputBar */
export type AttachmentInput =
  | { type: 'image'; url: string; filename: string }
  | { type: 'pdf'; url: string; filename: string; size?: string }
  | { type: 'voice-note'; duration: number };

// Fixed waveform pattern to avoid hydration issues
const WAVEFORM_HEIGHTS = [
  40, 70, 55, 80, 35, 65, 90, 45, 75, 30, 85, 50, 70, 40, 95, 60, 75, 45, 55, 80, 35, 65, 50, 70,
];

export function ChatMessageBubble({ message }: { message: UIMessage }) {
  const { isUser } = message;
  const timeStr = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={cn('mb-1 flex px-2 md:px-4', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] px-3 py-2 shadow-sm md:max-w-[60%]',
          isUser
            ? 'rounded-2xl rounded-tr-sm bg-[#DCF8C6] dark:bg-[#005C4B]'
            : 'rounded-2xl rounded-tl-sm bg-white dark:bg-[#202C33]'
        )}
      >
        {/* Text */}
        {message.type === 'text' && (
          <p className="break-words text-sm leading-relaxed whitespace-pre-wrap text-gray-900 dark:text-gray-100">
            {message.content}
          </p>
        )}

        {/* Image */}
        {message.type === 'image' && (
          <div className="-mx-1 -mt-1 mb-1 overflow-hidden rounded-lg">
            <img
              src={message.url}
              alt={message.filename}
              className="max-h-64 max-w-full rounded-lg object-cover"
            />
          </div>
        )}

        {/* PDF */}
        {message.type === 'pdf' && (
          <div className="flex min-w-[180px] items-center gap-3 py-1">
            <div className="flex-shrink-0 rounded-lg bg-red-500 p-2 text-white">
              <FilePdf size={24} weight="fill" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                {message.filename}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PDF{message.size ? ` · ${message.size}` : ''}
              </p>
            </div>
          </div>
        )}

        {/* Voice note */}
        {message.type === 'voice-note' && (
          <div className="flex min-w-[180px] items-center gap-2 py-1">
            <button
              className="flex-shrink-0 rounded-full bg-[#25D366] p-1.5 text-white transition-colors hover:bg-[#1ebe5d]"
              aria-label="Play voice note"
            >
              <Play size={16} weight="fill" />
            </button>
            <div className="flex h-8 flex-1 items-end gap-px">
              {WAVEFORM_HEIGHTS.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-full bg-[#25D366]/60"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <span className="flex-shrink-0 tabular-nums text-xs text-gray-500 dark:text-gray-400">
              {Math.floor(message.duration / 60)}:{String(message.duration % 60).padStart(2, '0')}
            </span>
          </div>
        )}

        {/* Timestamp */}
        <div
          className={cn(
            'mt-0.5 flex items-center gap-1',
            isUser ? 'justify-end' : 'justify-start'
          )}
        >
          <span className="text-[10px] text-gray-400 dark:text-gray-500">{timeStr}</span>
        </div>
      </div>
    </div>
  );
}
