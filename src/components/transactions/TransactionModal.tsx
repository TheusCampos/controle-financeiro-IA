import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuthStore } from '@/store/authStore';
import { TransactionSchema } from '@/lib/validators';
import { formatCurrency } from '@/lib/format';
import { calculateEffectiveBalance } from '@/lib/balance';
import type { Transaction, Category, Account } from '@/types/finance';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  categories: Category[];
  accounts: Account[];
  transaction: Transaction | null;
  onClose: () => void;
  onSaved: () => void;
  initialAccountId?: string;
  accountTypeFilter?: Account['type'];
  defaultType?: 'income' | 'expense' | 'transfer';
  title?: string;
}

export default function TransactionModal({
  categories,
  accounts,
  transaction,
  onClose,
  onSaved,
  initialAccountId,
  accountTypeFilter,
  defaultType = 'expense',
  title,
}: Props) {
  const user = useAuthStore((s) => s.user);
  const availableAccounts = useMemo(
    () => (accountTypeFilter ? accounts.filter((account) => account.type === accountTypeFilter) : accounts),
    [accountTypeFilter, accounts]
  );
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>(transaction?.type || defaultType);
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '');
  const [description, setDescription] = useState(transaction?.description || '');
  const [categoryId, setCategoryId] = useState(transaction?.category_id || '');
  const [accountId, setAccountId] = useState(transaction?.account_id || initialAccountId || availableAccounts[0]?.id || '');
  const [date, setDate] = useState(transaction?.date || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(transaction?.notes || '');
  const [transferToAccountId, setTransferToAccountId] = useState(transaction?.transfer_to_account_id || '');
  const [saving, setSaving] = useState(false);

  const filteredCategories = categories.filter(c => c.type === type || c.type === 'both');

  useEffect(() => {
    if (!availableAccounts.length) {
      setAccountId('');
      return;
    }

    if (!accountId || !availableAccounts.some((account) => account.id === accountId)) {
      setAccountId(transaction?.account_id || initialAccountId || availableAccounts[0].id);
    }
  }, [accountId, availableAccounts, initialAccountId, transaction?.account_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const parsedAmount = parseFloat(amount);
    const parsed = TransactionSchema.safeParse({
      amount: parsedAmount,
      description,
      category_id: categoryId || null,
      account_id: accountId,
      date,
      type,
      notes: notes || null,
    });

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || 'Dados inválidos';
      toast.error(firstError);
      return;
    }

    setSaving(true);
    const payload: TablesInsert<'transactions'> = {
      account_id: parsed.data.account_id,
      amount: parsed.data.amount,
      category_id: parsed.data.category_id,
      date: parsed.data.date,
      description: parsed.data.description,
      is_recurring: parsed.data.is_recurring,
      notes: parsed.data.notes,
      recurring_interval: parsed.data.recurring_interval,
      tags: parsed.data.tags,
      transfer_to_account_id: parsed.data.type === 'transfer' ? transferToAccountId || null : null,
      type: parsed.data.type,
      user_id: user.id,
    };

    const { error } = transaction
      ? await supabase.from('transactions').update(payload as TablesUpdate<'transactions'>).eq('id', transaction.id).eq('user_id', user.id)
      : await supabase.from('transactions').insert(payload);

    if (error) {
      toast.error('Erro ao salvar transação');
    } else {
      toast.success(transaction ? 'Transação atualizada!' : 'Transação criada!');
      onSaved();
    }
    setSaving(false);
  };

  /** Preview do saldo após aplicar a transação (client-side, espelha o trigger). */
  const balancePreview = useMemo(() => {
    const target = availableAccounts.find((a) => a.id === accountId);
    if (!target) return null;

    const amountNum = parseFloat(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return {
        current: Number(target.balance || 0),
        after: Number(target.balance || 0),
        delta: 0,
      };
    }

    // Diferença que essa transação causaria
    let delta = 0;
    if (type === 'income') delta = amountNum;
    else if (type === 'expense') delta = -amountNum;

    const after = calculateEffectiveBalance(
      target,
      [{ type, amount: amountNum, account_id: target.id, transfer_to_account_id: null }],
    );

    return { current: Number(target.balance || 0), after, delta: after - Number(target.balance || 0) };
  }, [accountId, amount, availableAccounts, type]);

  const inputClass = "w-full px-4 py-2.5 rounded-md bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg glass-card p-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-serif font-medium text-foreground">
            {title || (transaction ? 'Editar Movimentação' : 'Adicionar Movimentação')}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector */}
          <div className="flex gap-2">
            {(['expense', 'income', 'transfer'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                  type === t
                    ? t === 'income' ? 'bg-success/20 text-success' : t === 'expense' ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {t === 'income' ? 'Receita' : t === 'expense' ? 'Despesa' : 'Transferência'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Valor (R$)</label>
              <input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} placeholder="0,00" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Data</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} required />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Descrição</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} placeholder="Ex: Supermercado" required maxLength={255} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Conta</label>
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputClass} required>
                <option value="">Selecione</option>
                {availableAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Categoria</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
                <option value="">Sem categoria</option>
                {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {type === 'transfer' && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Conta destino</label>
              <select
                value={transferToAccountId}
                onChange={(e) => setTransferToAccountId(e.target.value)}
                className={inputClass}
                required
              >
                <option value="">Selecione a conta destino</option>
                {availableAccounts
                  .filter((a) => a.id !== accountId)
                  .map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Observações</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={2} placeholder="Opcional" maxLength={1000} />
          </div>

          {balancePreview && balancePreview.delta !== 0 && (
            <div
              className={`rounded-lg border px-3 py-2 text-xs ${
                balancePreview.delta >= 0
                  ? 'border-success/30 bg-success/10 text-success'
                  : 'border-destructive/30 bg-destructive/10 text-destructive'
              }`}
              role="status"
              aria-live="polite"
            >
              <span className="font-semibold">Saldo projetado:</span>{' '}
              {formatCurrency(balancePreview.current)} →{' '}
              <span className="font-bold">{formatCurrency(balancePreview.after)}</span>{' '}
              ({balancePreview.delta >= 0 ? '+' : ''}
              {formatCurrency(balancePreview.delta)})
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-md bg-secondary text-muted-foreground font-medium text-sm hover:text-foreground transition">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition disabled:opacity-50">
              {saving ? 'Salvando...' : 'Salvar movimentação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
