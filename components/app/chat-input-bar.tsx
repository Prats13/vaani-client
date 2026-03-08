'use client';

import { useRef, useState } from 'react';
import { Camera, Image, Microphone, PaperPlaneTilt, Paperclip, StopCircle } from '@phosphor-icons/react';
import { FilePdf } from '@phosphor-icons/react';
import { useLocalParticipant } from '@livekit/components-react';
import { cn } from '@/lib/shadcn/utils';
import type { AttachmentInput } from './chat-message-bubble';

interface ChatInputBarProps {
  onSendText: (text: string) => Promise<void>;
  onAttachment: (message: AttachmentInput) => void;
}

export function ChatInputBar({ onSendText, onAttachment }: ChatInputBarProps) {
  const [text, setText] = useState('');
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const { localParticipant } = useLocalParticipant();
  const isMicOn = localParticipant?.isMicrophoneEnabled ?? false;

  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    setIsSending(true);
    try {
      await onSendText(trimmed);
      setText('');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onAttachment({ type: 'image', url, filename: file.name });
    e.target.value = '';
    setAttachMenuOpen(false);
  };

  const handlePdfFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const size = `${(file.size / 1024).toFixed(0)} KB`;
    onAttachment({ type: 'pdf', url, filename: file.name, size });
    e.target.value = '';
    setAttachMenuOpen(false);
  };

  const toggleMic = () => {
    localParticipant?.setMicrophoneEnabled(!isMicOn);
  };

  return (
    <div className="relative flex items-end gap-2 bg-[#F0F2F5] px-2 py-2 dark:bg-[#202C33]">
      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFile}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handlePdfFile}
      />
      {/* Camera — uses capture attribute to open device camera on mobile */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore — capture is a valid HTML attribute
        capture="user"
        className="hidden"
        onChange={handleImageFile}
      />

      {/* Attachment menu */}
      {attachMenuOpen && (
        <>
          {/* Backdrop to close menu */}
          <div className="fixed inset-0 z-10" onClick={() => setAttachMenuOpen(false)} />
          <div className="absolute bottom-16 left-2 z-20 flex min-w-[170px] flex-col gap-1 rounded-2xl bg-white p-3 shadow-xl dark:bg-[#233138]">
            <button
              onClick={() => imageInputRef.current?.click()}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
            >
              <span className="rounded-full bg-purple-500 p-1.5 text-white">
                <Image size={18} weight="bold" />
              </span>
              Photo &amp; Video
            </button>
            <button
              onClick={() => pdfInputRef.current?.click()}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
            >
              <span className="rounded-full bg-red-500 p-1.5 text-white">
                <FilePdf size={18} weight="bold" />
              </span>
              Document (PDF)
            </button>
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
            >
              <span className="rounded-full bg-[#25D366] p-1.5 text-white">
                <Camera size={18} weight="bold" />
              </span>
              Camera
            </button>
          </div>
        </>
      )}

      {/* Attach button */}
      <button
        onClick={() => setAttachMenuOpen((o) => !o)}
        className="flex-shrink-0 rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-200 hover:text-[#25D366] dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-[#25D366]"
        aria-label="Attach file"
      >
        <Paperclip size={22} weight="bold" />
      </button>

      {/* Text input */}
      <div className="flex min-h-[44px] flex-1 items-center rounded-full bg-white px-4 py-2.5 dark:bg-[#2A3942]">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
          rows={1}
          className="field-sizing-content max-h-28 flex-1 resize-none bg-transparent text-sm text-gray-900 [scrollbar-width:thin] placeholder:text-gray-400 focus:outline-none dark:text-gray-100 dark:placeholder:text-gray-500"
        />
      </div>

      {/* Send or mic button */}
      {text.trim() ? (
        <button
          onClick={handleSend}
          disabled={isSending}
          className="flex-shrink-0 rounded-full bg-[#25D366] p-2.5 text-white transition-colors hover:bg-[#1ebe5d] disabled:opacity-60"
          aria-label="Send message"
        >
          <PaperPlaneTilt size={20} weight="fill" />
        </button>
      ) : (
        <button
          onClick={toggleMic}
          className={cn(
            'flex-shrink-0 rounded-full p-2.5 text-white transition-colors',
            isMicOn ? 'animate-pulse bg-red-500 hover:bg-red-600' : 'bg-[#25D366] hover:bg-[#1ebe5d]'
          )}
          aria-label={isMicOn ? 'Stop speaking' : 'Tap to speak'}
          title={isMicOn ? 'Tap to stop speaking' : 'Tap to speak'}
        >
          {isMicOn ? <StopCircle size={20} weight="fill" /> : <Microphone size={20} weight="fill" />}
        </button>
      )}
    </div>
  );
}
