'use client';

import { useEffect, useRef } from 'react';
import { Bot, Loader2 } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { StickyCartBar } from './StickyCartBar';
import type { ChatMessage as ChatMessageType } from '@/lib/chat/types';

interface Props {
  messages: ChatMessageType[];
  loading: boolean;
  thinkingLabel: string;
  onSuggestion: (text: string) => void;
}

export function ChatContainer({ messages, loading, thinkingLabel, onSuggestion }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const initialCountRef = useRef(messages.length);
  const didScrollRef = useRef(false);

  useEffect(() => {
    if (!didScrollRef.current && messages.length <= initialCountRef.current) return;
    didScrollRef.current = true;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const lastAiIndex = messages.reduce(
    (acc, m, i) => (m.role === 'ai' ? i : acc),
    -1,
  );

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg, i) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isLatest={i === lastAiIndex}
            loading={loading}
            onSuggestion={onSuggestion}
          />
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary mt-0.5">
              <Bot className="size-4" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-card border border-border px-4 py-3 flex items-center gap-1.5">
              <Loader2 className="size-4 text-primary animate-spin" />
              <span className="text-xs text-muted-foreground font-medium">{thinkingLabel}</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <StickyCartBar />
    </div>
  );
}
