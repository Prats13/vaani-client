'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useSessionContext } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { ChatView } from '@/components/app/chat-view';
import { WelcomeView } from '@/components/app/welcome-view';

const MotionWelcomeView = motion.create(WelcomeView);
const MotionChatView = motion.create(ChatView);

const VIEW_MOTION_PROPS = {
  variants: {
    visible: { opacity: 1 },
    hidden: { opacity: 0 },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: {
    duration: 0.4,
    ease: 'linear',
  },
};

interface ViewControllerProps {
  appConfig: AppConfig;
}

export function ViewController({ appConfig }: ViewControllerProps) {
  const { isConnected, start } = useSessionContext();

  return (
    <AnimatePresence mode="wait">
      {!isConnected && (
        <MotionWelcomeView
          key="welcome"
          {...VIEW_MOTION_PROPS}
          startButtonText={appConfig.startButtonText}
          onStartCall={start}
        />
      )}
      {isConnected && <MotionChatView key="chat" {...VIEW_MOTION_PROPS} />}
    </AnimatePresence>
  );
}
