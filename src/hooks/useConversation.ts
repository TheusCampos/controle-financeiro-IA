import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { createInitialAssistantMessage } from '@/lib/assistant';
import { loadConversations, saveConversation, loadConversationById, deleteConversation } from '@/lib/assistantDb';
import type { Json } from '@/integrations/supabase/types';
import type { Message, ConversationRow } from '@/types/assistant';

export function useConversation(user: User | null) {
  // Bug fix: inicialização lazy — evita o useEffect frágil que poderia causar loop
  const [messages, setMessages] = useState<Message[]>(() => [createInitialAssistantMessage()]);
  const [conversationId, setConversationId] = useState<string>(() => crypto.randomUUID());
  const [conversationRows, setConversationRows] = useState<ConversationRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    void loadConversations(user.id).then((result) => {
      if (!result) {
        setConversationId(crypto.randomUUID() as string);
        setMessages([createInitialAssistantMessage()]);
        setConversationRows([]);
        return;
      }
      setConversationId(result.conversationId);
      setMessages(result.messages);
      setConversationRows(result.rows);
    });
  }, [user]);

  const save = async (msgs: Message[], snapshot: Json | null) => {
    if (!user) return;
    setSaving(true);
    const result = await saveConversation({
      conversationId,
      userId: user.id,
      messages: msgs,
      snapshot,
    });
    setSaving(false);
    setConversationRows((prev) => {
      const next = [
        ...prev.filter((row) => row.id !== conversationId),
        { id: conversationId, title: result.title, updatedAt: result.updatedAt },
      ];
      return next.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    });
  };

  const startNew = () => {
    setConversationId(crypto.randomUUID());
    setMessages([createInitialAssistantMessage()]);
  };

  const loadById = async (id: string) => {
    if (!user) return;
    const msgs = await loadConversationById(user.id, id);
    if (msgs) {
      setConversationId(id);
      setMessages(msgs);
      toast.success('Conversa carregada com sucesso.');
    } else {
      toast.error('Erro ao carregar conversa.');
    }
  };

  const removeConversation = async (id: string) => {
    if (!user) return;
    const success = await deleteConversation(user.id, id);
    if (success) {
      setConversationRows((prev) => prev.filter((row) => row.id !== id));
      if (conversationId === id) {
        startNew();
      }
      toast.success('Conversa excluída com sucesso.');
    } else {
      toast.error('Erro ao excluir conversa.');
    }
  };

  return { messages, setMessages, conversationId, conversationRows, saving, save, startNew, loadById, removeConversation };
}
