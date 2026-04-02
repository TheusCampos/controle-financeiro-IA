import { supabase } from '@/integrations/supabase/client';
import {
  AssistantMessagesSchema,
  createInitialAssistantMessage,
  makeConversationTitle,
} from '@/lib/assistant';
import type { Json } from '@/integrations/supabase/types';
import type { Message, ConversationRow, LocalConversation } from '@/types/assistant';

export function localConversationKey(userId: string) {
  return `ai_conversations_local_${userId}`;
}

// ── Snapshot Financeiro ──────────────────────────────────────────────────────

export async function fetchFinancialSnapshot(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  // Promise.allSettled garante que uma falha não derruba o snapshot inteiro
  const results = await Promise.allSettled([
    supabase.from('accounts').select('id, name, balance, type').eq('user_id', userId).eq('is_active', true),
    supabase.from('categories').select('id, name, type'),
    supabase
      .from('transactions')
      .select('amount, type, description, date, categories(name)')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(30),
    supabase
      .from('budgets')
      .select('id, name, limit_amount, category_id, period, alert_threshold')
      .eq('user_id', userId)
      .eq('is_active', true),
    supabase
      .from('financial_goals')
      .select('title, target_amount, current_amount, status')
      .eq('user_id', userId),
    supabase
      .from('transactions')
      .select('amount, category_id')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth),
  ]);

  const [accRes, catRes, txnRes, budgetRes, goalRes, budgetTxnRes] = results.map((r) =>
    r.status === 'fulfilled' ? r.value : { data: [], error: null }
  );

  type ExpenseRow = { amount: number; category_id: string | null };
  type BudgetRow = {
    id: string;
    name: string;
    limit_amount: number;
    category_id: string | null;
    period: string;
    alert_threshold: number | null;
  };

  const monthExpenses = ((budgetTxnRes as { data: ExpenseRow[] | null }).data ?? []) as ExpenseRow[];
  const budgetData = ((budgetRes as { data: BudgetRow[] | null }).data ?? []) as BudgetRow[];

  const budgetsWithSpent = budgetData.map((budget) => ({
    id: budget.id,
    name: budget.name,
    period: budget.period,
    limit_amount: budget.limit_amount,
    alert_threshold: budget.alert_threshold,
    spent: monthExpenses
      .filter((e) => (budget.category_id ? e.category_id === budget.category_id : true))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0),
  }));

  return {
    accounts: (accRes as { data: unknown[] | null }).data ?? [],
    categories: (catRes as { data: unknown[] | null }).data ?? [],
    recent_transactions: (txnRes as { data: unknown[] | null }).data ?? [],
    budgets: budgetsWithSpent,
    goals: (goalRes as { data: unknown[] | null }).data ?? [],
  };
}

// ── Persistência de Conversas ────────────────────────────────────────────────

export interface SaveConversationResult {
  title: string;
  updatedAt: string;
}

export async function saveConversation(params: {
  conversationId: string;
  userId: string;
  messages: Message[];
  snapshot: Json | null;
}): Promise<SaveConversationResult> {
  const { conversationId, userId, messages, snapshot } = params;
  const validated = AssistantMessagesSchema.parse(messages);
  const title = makeConversationTitle(validated);
  const updatedAt = new Date().toISOString();

  const payload = {
    id: conversationId,
    user_id: userId,
    title,
    messages: validated as unknown as Json,
    context_snapshot: snapshot,
    updated_at: updatedAt,
  };

  const { error } = await supabase.from('ai_conversations').upsert(payload, { onConflict: 'id' });

  if (error) {
    // Fallback: localStorage quando Supabase falha
    const storageKey = localConversationKey(userId);
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? (JSON.parse(raw) as LocalConversation[]) : [];
    const filtered = parsed.filter((item) => item.id !== conversationId);
    const local: LocalConversation = {
      id: conversationId,
      title,
      updated_at: updatedAt,
      messages: validated,
      context_snapshot: snapshot,
    };
    localStorage.setItem(storageKey, JSON.stringify([local, ...filtered]));
  }

  return { title, updatedAt };
}

export interface LoadedConversations {
  conversationId: string;
  messages: Message[];
  rows: ConversationRow[];
}

export async function loadConversations(userId: string): Promise<LoadedConversations | null> {
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('id, title, updated_at, messages')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(10);

  if (!error && data && data.length > 0) {
    const rows: ConversationRow[] = data.map((item) => ({
      id: item.id,
      title: item.title || 'Nova conversa',
      updatedAt: item.updated_at,
    }));
    const first = data[0];
    const validated = AssistantMessagesSchema.safeParse(first.messages);
    return {
      conversationId: first.id,
      messages: validated.success ? validated.data : [createInitialAssistantMessage()],
      rows,
    };
  }

  // Fallback: localStorage
  const local = localStorage.getItem(localConversationKey(userId));
  if (!local) return null;

  try {
    const parsed = JSON.parse(local) as LocalConversation[];
    const sorted = [...parsed].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
    const first = sorted[0];
    if (!first) return null;
    const validated = AssistantMessagesSchema.safeParse(first.messages);
    return {
      conversationId: first.id,
      messages: validated.success ? validated.data : [createInitialAssistantMessage()],
      rows: sorted.map((item) => ({
        id: item.id,
        title: item.title,
        updatedAt: item.updated_at,
      })),
    };
  } catch {
    return null;
  }
}

export async function loadConversationById(userId: string, conversationId: string): Promise<Message[] | null> {
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('messages')
    .eq('user_id', userId)
    .eq('id', conversationId)
    .maybeSingle();

  if (!error && data) {
    const validated = AssistantMessagesSchema.safeParse(data.messages);
    return validated.success ? validated.data : null;
  }

  // Fallback: localStorage
  const local = localStorage.getItem(localConversationKey(userId));
  if (local) {
    try {
      const parsed = JSON.parse(local) as LocalConversation[];
      const item = parsed.find(c => c.id === conversationId);
      if (item) {
        const validated = AssistantMessagesSchema.safeParse(item.messages);
        return validated.success ? validated.data : null;
      }
    } catch {
      // ignorar erro de parsing local
    }
  }
  return null;
}

export async function deleteConversation(userId: string, conversationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('ai_conversations')
    .delete()
    .eq('user_id', userId)
    .eq('id', conversationId);

  if (!error) {
    return true;
  }

  // Fallback: localStorage
  const local = localStorage.getItem(localConversationKey(userId));
  if (local) {
    try {
      const parsed = JSON.parse(local) as LocalConversation[];
      const filtered = parsed.filter(c => c.id !== conversationId);
      localStorage.setItem(localConversationKey(userId), JSON.stringify(filtered));
      return true;
    } catch {
      // ignorar erro de parsing local
    }
  }
  
  return false;
}

