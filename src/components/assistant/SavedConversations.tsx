import { useState } from 'react';
import { History, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { ConversationRow } from '@/types/assistant';

interface SavedConversationsProps {
  conversations: ConversationRow[];
  currentId: string;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SavedConversations({ conversations, currentId, onLoad, onDelete }: SavedConversationsProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (conversations.length === 0) return null;

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir esta conversa?')) {
      onDelete(id);
    }
  };

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <History className="w-4 h-4" />
        Conversas salvas ({conversations.length})
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onLoad(conv.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-sm cursor-pointer transition-colors max-w-[200px] ${
                currentId === conv.id
                  ? 'bg-primary/10 border-primary/20 text-primary'
                  : 'bg-background border-border hover:bg-secondary text-foreground'
              }`}
            >
              <span className="truncate flex-1">{conv.title}</span>
              <button
                onClick={(e) => handleDelete(e, conv.id)}
                className="p-1 hover:bg-destructive/10 hover:text-destructive rounded text-muted-foreground transition-colors"
                title="Excluir conversa"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}