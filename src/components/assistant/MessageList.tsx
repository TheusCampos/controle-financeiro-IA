import type { RefObject } from 'react';
import { Bot, User, Loader2 } from 'lucide-react';
import type { Message } from '@/types/assistant';

interface Props {
  messages: Message[];
  loading: boolean;
  endRef: RefObject<HTMLDivElement>;
}

export function MessageList({ messages, loading, endRef }: Props) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
      {messages.map((msg, idx) => (
        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`max-w-[85%] rounded-2xl px-4 py-3 flex gap-3 ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-secondary text-foreground rounded-bl-sm border border-border/50'
            }`}
          >
            {msg.role === 'assistant' && <Bot className="w-5 h-5 shrink-0 mt-0.5 opacity-70" />}
            <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
            {msg.role === 'user' && <User className="w-5 h-5 shrink-0 mt-0.5 opacity-70" />}
          </div>
        </div>
      ))}

      {loading && (
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-secondary text-foreground rounded-bl-sm border border-border/50 flex items-center gap-3">
            <Bot className="w-5 h-5 shrink-0 opacity-70" />
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Analisando...</span>
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
