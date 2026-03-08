import { Button } from '@/components/ui/button';

function ChatBubbleIcon() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mb-5"
    >
      <circle cx="40" cy="40" r="40" fill="#25D366" />
      <path
        d="M40 18C27.85 18 18 27.85 18 40C18 44.15 19.2 48.05 21.3 51.3L18.5 61.5L28.95 58.75C32.1 60.65 35.9 61.75 40 61.75C52.15 61.75 62 51.9 62 39.75C62 27.6 52.15 18 40 18ZM40 58.25C36.15 58.25 32.6 57.15 29.6 55.25L28.85 54.8L22.75 56.45L24.45 50.5L23.95 49.7C21.85 46.6 20.65 42.9 20.65 39C20.65 29.3 28.55 21.5 38.15 21.5C47.75 21.5 56 29.65 56 39.5C56 49.35 47.95 57.5 38.15 57.5L40 58.25Z"
        fill="white"
      />
      <path
        d="M32 34H48M32 40H44M32 46H40"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
}

export const WelcomeView = ({
  startButtonText,
  onStartCall,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  return (
    <div ref={ref}>
      <section className="bg-background flex flex-col items-center justify-center text-center">
        <ChatBubbleIcon />

        <h2 className="text-foreground text-xl font-bold tracking-tight">Vaani AI</h2>
        <p className="text-muted-foreground mt-2 max-w-xs text-sm leading-6">
          Chat with your AI voice assistant. Send messages, voice notes, and attachments.
        </p>

        <Button
          size="lg"
          onClick={onStartCall}
          className="mt-8 w-64 rounded-full bg-[#25D366] font-mono text-xs font-bold tracking-wider text-white uppercase hover:bg-[#1ebe5d]"
        >
          {startButtonText}
        </Button>
      </section>

      <div className="fixed bottom-5 left-0 flex w-full items-center justify-center">
        <p className="text-muted-foreground max-w-prose pt-1 text-xs leading-5 font-normal text-pretty md:text-sm">
          Need help?{' '}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://docs.livekit.io/agents/start/voice-ai/"
            className="underline"
          >
            View the quickstart guide
          </a>
          .
        </p>
      </div>
    </div>
  );
};
