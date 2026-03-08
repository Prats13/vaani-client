'use client';

import { useMemo, useState } from 'react';
import { TokenSource } from 'livekit-client';
import { useSession } from '@livekit/components-react';
import { WarningIcon } from '@phosphor-icons/react/dist/ssr';
import type { AppConfig } from '@/app-config';
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { StartAudioButton } from '@/components/agents-ui/start-audio-button';
import { OnboardingPendingView } from '@/components/app/onboarding-pending-view';
import { PhoneEntryView } from '@/components/app/phone-entry-view';
import { ViewController } from '@/components/app/view-controller';
import { Toaster } from '@/components/ui/sonner';
import { useAgentErrors } from '@/hooks/useAgentErrors';
import { useDebugMode } from '@/hooks/useDebug';
import { getSandboxTokenSource } from '@/lib/utils';
import { type FarmerProfile, getLiveKitToken } from '@/lib/vaani-api';

const IN_DEVELOPMENT = process.env.NODE_ENV !== 'production';

type AppPhase = 'entry' | 'onboarding' | 'chat';

interface AppProps {
  appConfig: AppConfig;
}

function SessionSetup() {
  useDebugMode({ enabled: IN_DEVELOPMENT });
  useAgentErrors();
  return null;
}

// Inner component — only mounts once we have a verified farmer + phone
function VaaniSession({
  appConfig,
  farmer,
  farmerPhone,
}: {
  appConfig: AppConfig;
  farmer: FarmerProfile | null;
  farmerPhone: string;
}) {
  const tokenSource = useMemo(() => {
    if (typeof process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT === 'string') {
      return getSandboxTokenSource(appConfig);
    }
    // Cache the promise so multiple calls return the same token without hitting the backend twice
    let cached: ReturnType<typeof getLiveKitToken> | null = null;
    return TokenSource.custom(() => {
      if (!cached) cached = getLiveKitToken(farmerPhone);
      return cached;
    });
  }, [appConfig, farmerPhone]);

  const session = useSession(tokenSource);

  return (
    <AgentSessionProvider session={session}>
      <SessionSetup />
      <main className="grid h-svh grid-cols-1 place-content-center">
        <ViewController farmer={farmer} />
      </main>
      <StartAudioButton label="Start Audio" />
      <Toaster
        icons={{ warning: <WarningIcon weight="bold" /> }}
        position="top-center"
        className="toaster group"
        style={
          {
            '--normal-bg': 'var(--popover)',
            '--normal-text': 'var(--popover-foreground)',
            '--normal-border': 'var(--border)',
          } as React.CSSProperties
        }
      />
    </AgentSessionProvider>
  );
}

export function App({ appConfig }: AppProps) {
  const [phase, setPhase] = useState<AppPhase>('entry');
  const [farmerPhone, setFarmerPhone] = useState('');
  const [farmer, setFarmer] = useState<FarmerProfile | null>(null);

  if (phase === 'entry') {
    return (
      <PhoneEntryView
        onRegistered={(farmerData, phone) => {
          setFarmer(farmerData);
          setFarmerPhone(phone);
          setPhase('chat');
        }}
        onNotRegistered={(phone) => {
          setFarmerPhone(phone);
          setPhase('onboarding');
        }}
      />
    );
  }

  if (phase === 'onboarding') {
    return <OnboardingPendingView phone={farmerPhone} onBack={() => setPhase('entry')} />;
  }

  // phase === 'chat'
  return <VaaniSession appConfig={appConfig} farmer={farmer} farmerPhone={farmerPhone} />;
}
