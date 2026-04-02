import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';
import type { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { canUseAiAction } from '@/lib/assistant';
import { appendAuditLog } from '@/services/auditLog';
import type { Json } from '@/integrations/supabase/types';
import type { Message, PendingAction } from '@/types/assistant';

interface UsePendingActionParams {
  user: User | null;
  setMessages: Dispatch<SetStateAction<Message[]>>;
}

export function usePendingAction({ user, setMessages }: UsePendingActionParams) {
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionCountdown, setActionCountdown] = useState(0);
  const [executingAction, setExecutingAction] = useState(false);

  // Timer de countdown — expira a ação automaticamente
  useEffect(() => {
    if (!pendingAction) return;

    setActionCountdown(Math.max(0, Math.ceil((pendingAction.expiresAt - Date.now()) / 1000)));
    const timer = setInterval(() => {
      const seconds = Math.max(0, Math.ceil((pendingAction.expiresAt - Date.now()) / 1000));
      setActionCountdown(seconds);
      if (seconds === 0) {
        setPendingAction(null);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'A autorização expirou. Envie o comando novamente para prosseguir.' },
        ]);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [pendingAction, setMessages]);

  const executePendingAction = async () => {
    if (!pendingAction || !user) return;

    if (Date.now() > pendingAction.expiresAt) {
      appendAuditLog(user.id, 'create_transaction', 'expired', pendingAction.command as unknown as Json);
      setPendingAction(null);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'A autorização expirou antes da confirmação.' },
      ]);
      return;
    }

    const role = typeof user.user_metadata?.role === 'string' ? user.user_metadata.role : null;
    if (!canUseAiAction(role, user.email)) {
      appendAuditLog(user.id, 'create_transaction', 'denied', { role, command: pendingAction.command } as unknown as Json);
      toast.error('Seu nível de usuário não permite lançamentos via assistente.');
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Permissão insuficiente para executar o lançamento.' },
      ]);
      setPendingAction(null);
      return;
    }

    setExecutingAction(true);
    try {
      let accountIdToUse = pendingAction.command.accountId;

      if (!accountIdToUse) {
        const { data: account, error: accountError } = await supabase
          .from('accounts')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at')
          .limit(1)
          .maybeSingle();

        if (accountError || !account?.id) {
          throw new Error('Nenhuma conta ativa disponível para registrar lançamento.');
        }
        accountIdToUse = account.id;
      }

      const { error: insertError } = await supabase.from('transactions').insert({
        user_id: user.id,
        account_id: accountIdToUse,
        category_id: pendingAction.command.categoryId || null,
        amount: pendingAction.command.amount,
        type: pendingAction.command.type,
        description: pendingAction.command.description,
        date: pendingAction.command.date,
      });

      if (insertError) throw new Error(insertError.message);

      appendAuditLog(user.id, 'create_transaction', 'approved', {
        accountId: accountIdToUse,
        command: pendingAction.command,
      } as unknown as Json);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Lançamento criado com sucesso: ${pendingAction.command.type} de R$ ${pendingAction.command.amount.toFixed(2)}.`,
        },
      ]);
      setPendingAction(null);
      toast.success('Lançamento realizado com sucesso.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao executar lançamento.';
      appendAuditLog(user.id, 'create_transaction', 'failed', {
        reason: message,
        command: pendingAction.command,
      } as unknown as Json);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Falha ao executar lançamento: ${message}` },
      ]);
      toast.error(message);
    } finally {
      setExecutingAction(false);
    }
  };

  const cancelPendingAction = () => {
    if (!pendingAction || !user) return;
    appendAuditLog(user.id, 'create_transaction', 'denied', pendingAction.command as unknown as Json);
    setPendingAction(null);
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: 'Lançamento cancelado pelo usuário.' },
    ]);
  };

  return {
    pendingAction,
    setPendingAction,
    actionCountdown,
    executingAction,
    executePendingAction,
    cancelPendingAction,
  };
}
