'use client';

import { useEffect } from 'react';
import { useSessionContext } from '@livekit/components-react';
import { ChatView } from '@/components/app/chat-view';
import type { FarmerProfile } from '@/lib/vaani-api';

interface ViewControllerProps {
  farmer: FarmerProfile | null;
}

export function ViewController({ farmer }: ViewControllerProps) {
  const { isConnected, start } = useSessionContext();

  // Auto-connect as soon as the session is ready
  useEffect(() => {
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isConnected) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-[#ECE5DD] dark:bg-[#0B141A]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#25D366] border-t-transparent" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Connecting to Vaani…</p>
      </div>
    );
  }

  return <ChatView farmer={farmer} />;
}
