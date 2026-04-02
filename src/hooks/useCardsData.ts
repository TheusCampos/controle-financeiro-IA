import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';
import { useAuthStore } from '@/store/authStore';
import { AccountSchema } from '@/lib/validators';
import type { Account, Category, Transaction } from '@/types/finance';
import { toast } from 'sonner';

export const cardBrands = [
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'elo', label: 'Elo' },
  { value: 'amex', label: 'Amex' },
  { value: 'hipercard', label: 'Hipercard' },
  { value: 'other', label: 'Outro' },
] as const;

export const cardColors = ['#F97316', '#6366F1', '#0F766E', '#E11D48', '#111827', '#7C3AED'];

function isMissingCardFieldsError(error: { code?: string; message?: string; details?: string | null } | null) {
  if (!error) return false;

  const combinedMessage = `${error.code || ''} ${error.message || ''} ${error.details || ''}`.toLowerCase();

  return (
    combinedMessage.includes('card_brand') ||
    combinedMessage.includes('credit_limit') ||
    combinedMessage.includes('closing_day') ||
    combinedMessage.includes('due_day') ||
    combinedMessage.includes('last_four_digits') ||
    combinedMessage.includes('schema cache') ||
    combinedMessage.includes('pgrst')
  );
}

export interface CardSummary extends Account {
  spentThisMonth: number;
  creditLimit: number;
  availableLimit: number;
  utilization: number;
}

export function useCardsData() {
  const user = useAuthStore((s) => s.user);
  const [cards, setCards] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<string>('');

  const loadData = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    const [cardsRes, categoriesRes, transactionsRes] = await Promise.all([
      supabase.from('accounts').select('*').eq('type', 'credit').eq('is_active', true).order('created_at'),
      supabase.from('categories').select('*').order('name'),
      supabase
        .from('transactions')
        .select('*, category:categories(*), account:accounts(*)')
        .order('date', { ascending: false })
        .limit(150),
    ]);

    if (cardsRes.error) {
      toast.error('Não foi possível carregar seus cartões');
    }

    const nextCards = (cardsRes.data || []) as Account[];
    const nextTransactions = ((transactionsRes.data || []) as Transaction[]).filter(
      (transaction) => transaction.account?.type === 'credit'
    );

    setCards(nextCards);
    setCategories((categoriesRes.data || []) as Category[]);
    setTransactions(nextTransactions);
    setSelectedCardId((current) => current || nextCards[0]?.id || '');
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [loadData, user]);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const cardSummaries = useMemo<CardSummary[]>(
    () =>
      cards.map((card) => {
        const spentThisMonth = transactions
          .filter(
            (transaction) =>
              transaction.account_id === card.id &&
              transaction.type === 'expense' &&
              transaction.date >= startOfMonth &&
              transaction.date <= endOfMonth
          )
          .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

        const creditLimit = Number(card.credit_limit || 0);
        const availableLimit = Math.max(creditLimit - spentThisMonth, 0);
        const utilization = creditLimit > 0 ? (spentThisMonth / creditLimit) * 100 : 0;

        return {
          ...card,
          spentThisMonth,
          creditLimit,
          availableLimit,
          utilization,
        };
      }),
    [cards, endOfMonth, startOfMonth, transactions]
  );

  const selectedCard = cardSummaries.find((card) => card.id === selectedCardId) || cardSummaries[0];
  const selectedTransactions = transactions.filter((transaction) =>
    selectedCard ? transaction.account_id === selectedCard.id : true
  );
  const totalLimit = cardSummaries.reduce((sum, card) => sum + card.creditLimit, 0);
  const totalUsed = cardSummaries.reduce((sum, card) => sum + card.spentThisMonth, 0);
  const totalAvailable = Math.max(totalLimit - totalUsed, 0);

  const createCard = async (formData: {
    cardName: string;
    bankName: string;
    cardBrand: string;
    cardLimit: string;
    closingDay: string;
    dueDay: string;
    lastDigits: string;
    initialBalance: string;
    cardColor: string;
  }) => {
    if (!user) return false;

    const parsed = AccountSchema.safeParse({
      name: formData.cardName,
      type: 'credit',
      balance: Number(formData.initialBalance || 0),
      bank_name: formData.bankName || null,
      color: formData.cardColor,
      card_brand: formData.cardBrand,
      credit_limit: formData.cardLimit ? Number(formData.cardLimit) : null,
      closing_day: formData.closingDay ? Number(formData.closingDay) : null,
      due_day: formData.dueDay ? Number(formData.dueDay) : null,
      last_four_digits: formData.lastDigits || null,
    });

    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || 'Dados inválidos');
      return false;
    }

    const completePayload = {
      user_id: user.id,
      ...parsed.data,
    };

    const { error } = await supabase.from('accounts').insert(completePayload);

    if (error) {
      if (isMissingCardFieldsError(error)) {
        const basePayload: TablesInsert<'accounts'> = {
          user_id: user.id,
          name: parsed.data.name,
          type: parsed.data.type,
          balance: parsed.data.balance,
          bank_name: parsed.data.bank_name,
          color: parsed.data.color,
        };
        const fallbackResult = await supabase.from('accounts').insert(basePayload);

        if (!fallbackResult.error) {
          toast.success('Cartão cadastrado. Os campos avançados serão liberados após aplicar a migration do banco.');
          await loadData();
          return true;
        }
      }

      toast.error(error.message || 'Erro ao cadastrar cartão');
      return false;
    }

    toast.success('Cartão cadastrado com sucesso');
    await loadData();
    return true;
  };

  const deleteCard = async (cardId: string) => {
    if (!user) return;
    const { error } = await supabase.from('accounts').delete().eq('id', cardId).eq('user_id', user.id);

    if (error) {
      toast.error('Erro ao excluir cartão');
      return;
    }

    toast.success('Cartão removido');
    if (selectedCardId === cardId) {
      setSelectedCardId('');
    }
    loadData();
  };

  return {
    loading,
    cards,
    categories,
    transactions,
    cardSummaries,
    selectedCard,
    selectedCardId,
    setSelectedCardId,
    selectedTransactions,
    totalLimit,
    totalUsed,
    totalAvailable,
    createCard,
    deleteCard,
    loadData,
  };
}
