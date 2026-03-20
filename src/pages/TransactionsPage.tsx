import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate, getTransactionTypeLabel } from '@/lib/format';
import { TransactionSchema, type TransactionInput } from '@/lib/validators';
import type { Transaction, Category, Account } from '@/types/finance';
import { Plus, Search, ArrowUpRight, ArrowDownRight, ArrowLeftRight, Trash2, Filter } from 'lucide-react';
import { toast } from 'sonner';
import TransactionModal from '@/components/transactions/TransactionModal';

export default function TransactionsPage() {
  const user = useAuthStore((s) => s.user);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [txnRes, catRes, accRes] = await Promise.all([
      supabase.from('transactions').select('*, category:categories(*), account:accounts(*)').order('date', { ascending: false }).limit(100),
      supabase.from('categories').select('*'),
      supabase.from('accounts').select('*').eq('is_active', true),
    ]);
    setTransactions((txnRes.data || []) as Transaction[]);
    setCategories((catRes.data || []) as Category[]);
    setAccounts((accRes.data || []) as Account[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Transação excluída');
    loadData();
  };

  const filtered = transactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const typeIcons = { income: ArrowUpRight, expense: ArrowDownRight, transfer: ArrowLeftRight };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-serif font-medium text-foreground tracking-tight">Movimentações</h2>
          <p className="text-muted-foreground text-sm mt-1">Acompanhe e gerencie todas as suas movimentações financeiras.</p>
        </div>
        <button
          onClick={() => { setEditingTxn(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-foreground text-background font-medium text-sm hover:opacity-90 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Adicionar movimentação
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar transações..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-md bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition text-sm shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'income', 'expense', 'transfer'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2.5 rounded-md text-xs font-medium transition shadow-sm border ${
                filterType === type
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-secondary'
              }`}
            >
              {type === 'all' ? 'Todas' : getTransactionTypeLabel(type)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 skeleton-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border shadow-soft rounded-xl p-12 text-center">
          <p className="text-muted-foreground">Nenhuma movimentação encontrada.</p>
          <button
            onClick={() => { setEditingTxn(null); setModalOpen(true); }}
            className="mt-3 text-foreground font-medium hover:underline text-sm"
          >
            Adicionar primeira movimentação
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border shadow-soft rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  <th className="text-left px-5 py-4">Descrição</th>
                  <th className="text-left px-5 py-4">Categoria</th>
                  <th className="text-left px-5 py-4">Data</th>
                  <th className="text-right px-5 py-4">Valor</th>
                  <th className="text-right px-5 py-4 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(txn => {
                  const Icon = typeIcons[txn.type];
                  return (
                    <tr key={txn.id} className="border-b border-border/30 last:border-0 hover:bg-secondary/30 transition group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-4">
                          <div 
                            className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${
                              txn.type === 'income' ? 'bg-success/10' : txn.type === 'expense' ? 'bg-destructive/10' : 'bg-primary/10'
                            }`}
                            aria-hidden="true"
                          >
                            <Icon className={`w-4 h-4 ${
                              txn.type === 'income' ? 'text-success' : txn.type === 'expense' ? 'text-destructive' : 'text-primary'
                            }`} />
                          </div>
                          <span className="text-sm font-medium text-foreground">{txn.description}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{txn.category?.name || '—'}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{formatDate(txn.date)}</td>
                      <td className={`px-5 py-4 text-base font-serif font-medium text-right ${
                        txn.type === 'income' ? 'money-positive' : 'money-negative'
                      }`}>
                        {txn.type === 'income' ? '+' : '-'}{formatCurrency(Number(txn.amount))}
                      </td>
                      <td className="px-5 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDelete(txn.id)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <TransactionModal
          categories={categories}
          accounts={accounts}
          transaction={editingTxn}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); loadData(); }}
        />
      )}
    </div>
  );
}
