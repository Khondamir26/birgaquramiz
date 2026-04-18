import { Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { MessageRenderer } from './MessageRenderer';
import type { ChatMessage as ChatMessageType } from '@/lib/chat/types';

interface Props {
  message: ChatMessageType;
  isLatest?: boolean;
  loading?: boolean;
  onSuggestion: (text: string) => void;
}

export function ChatMessage({ message, isLatest, loading, onSuggestion }: Props) {
  const isAi = message.role === 'ai';

  return (
    <div className={`flex gap-3 ${isAi ? '' : 'flex-row-reverse'}`}>
      {isAi && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary mt-0.5">
          <Bot className="w-4 h-4" />
        </div>
      )}

      {isAi ? (
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-card border border-border shadow-sm text-foreground px-4 py-3">
          {message.structured ? (
            <MessageRenderer
              structured={message.structured}
              onSuggestion={onSuggestion}
              isLatest={isLatest}
              loading={loading}
            />
          ) : (
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="mb-1.5 last:mb-0 text-sm leading-relaxed font-medium text-foreground">{children}</p>
                ),
                strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                ul: ({ children }) => (
                  <ul className="ml-4 mt-1 mb-1.5 space-y-0.5 list-disc">{children}</ul>
                ),
                li: ({ children }) => <li className="text-sm">{children}</li>,
              }}
            >
              {String(message.text)}
            </ReactMarkdown>
          )}
        </div>
      ) : (
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-3 text-sm leading-relaxed">
          {message.text}
        </div>
      )}
    </div>
  );
}
