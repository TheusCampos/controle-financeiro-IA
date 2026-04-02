import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/lib/format';
import { BudgetSchema } from '@/lib/validators';
import type { Budget, Category } from '@/types/finance';
import { Plus, PiggyBank, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';
import { appendAuditLog } from '@/services/auditLog';
import type { Json } from '@/integrations/supabase/types';

export default function BudgetsPage() {
  const user = useAuthStore((s) => s.user);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    setLoading(true);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [budgetsRes, catsRes, txnsRes] = await Promise.all([
      supabase.from('budgets').select('*, category:categories(*)').eq('is_active', true),
      supabase.from('categories').select('*').eq('type', 'expense'),
      supabase.from('transactions').select('*').eq('type', 'expense').gte('date', startOfMonth).lte('date', endOfMonth),
    ]);

    const txns = txnsRes.data || [];
    const budgetRows = (budgetsRes.data || []) as Budget[];
    const budgetList = budgetRows.map((b) => ({
      ...b,
      spent: txns.filter((t: { category_id: string | null }) => b.category_id ? t.category_id === b.category_id : true)
        .reduce((sum: number, t: { amount: number }) => sum + Number(t.amount), 0),
    }));

    setBudgets(budgetList);
    setCategories((catsRes.data || []) as Category[]);
    setLoading(false);
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const parsed = BudgetSchema.safeParse({
      name,
      limit_amount: parseFloat(limitAmount),
      category_id: categoryId || null,
      period,
      start_date: new Date().toISOString().split('T')[0],
      alert_threshold: 80,
    });

    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || 'Dados inválidos');
      return;
    }

    const payload = {
      user_id: user.id,
      name: parsed.data.name,
      limit_amount: parsed.data.limit_amount,
      category_id: parsed.data.category_id,
      period: parsed.data.period,
      start_date: parsed.data.start_date,
      alert_threshold: parsed.data.alert_threshold,
    };

    if (editingId) {
      const { error } = await supabase.from('budgets').update(payload).eq('id', editingId).eq('user_id', user.id);
      if (error) { toast.error('Erro ao atualizar orçamento'); return; }
      toast.success('Orçamento atualizado!');
      appendAuditLog(user.id, 'update_budget', 'approved', { id: editingId } as unknown as Json);
    } else {
      const { error } = await supabase.from('budgets').insert(payload);
      if (error) { toast.error('Erro ao criar orçamento'); return; }
      toast.success('Orçamento criado!');
    }
    
    setShowForm(false);
    setEditingId(null);
    setName('');
    setLimitAmount('');
    setCategoryId('');
    loadData();
  };

  const handleEdit = (b: Budget) => {
    if (b.user_id !== user?.id) {
      toast.error('Sem permissão para editar.');
      return;
    }
    setEditingId(b.id);
    setName(b.name);
    setLimitAmount(b.limit_amount.toString());
    setCategoryId(b.category_id || '');
    setPeriod(b.period as 'weekly' | 'monthly' | 'yearly');
    setShowForm(true);
  };

  const executeDelete = async () => {
    if (!user || !deletingId) return;
    setIsDeleting(true);
    const { error } = await supabase.from('budgets').delete().eq('id', deletingId).eq('user_id', user.id);
    if (error) {
      toast.error('Erro ao excluir orçamento.');
      appendAuditLog(user.id, 'delete_budget', 'failed', { error: error.message, id: deletingId } as unknown as Json);
    } else {
      toast.success('Orçamento excluído com sucesso.');
      appendAuditLog(user.id, 'delete_budget', 'approved', { id: deletingId } as unknown as Json);
      loadData();
    }
    setIsDeleting(false);
    setDeletingId(null);
  };

  const inputClass = "w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition text-sm";

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-medium text-foreground tracking-tight">Orçamentos</h2>
          <p className="text-muted-foreground text-sm mt-1">Controle seus limites de gastos</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-foreground text-background font-medium text-sm hover:opacity-90 shadow-sm transition">
          <Plus className="w-4 h-4" /> Criar Orçamento
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-medium mb-4">{editingId ? 'Editar Orçamento' : 'Novo Orçamento'}</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <input type="text" placeholder="Nome" value={name} onChange={e => setName(e.target.value)} className={inputClass} required />
            <input type="number" step="0.01" placeholder="Limite (R$)" value={limitAmount} onChange={e => setLimitAmount(e.target.value)} className={inputClass} required />
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={inputClass}>
              <option value="">Todas categorias</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm">
                {editingId ? 'Salvar' : 'Criar'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setName(''); setLimitAmount(''); setCategoryId(''); }} className="px-4 py-2.5 rounded-lg bg-secondary text-muted-foreground text-sm">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 skeleton-pulse rounded-xl" />)}
        </div>
      ) : budgets.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <PiggyBank className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum orçamento criado.</p>
          <button onClick={() => setShowForm(true)} className="mt-2 text-primary hover:underline text-sm">Criar primeiro orçamento</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map(b => {
            const spent = b.spent || 0;
            const limit = Number(b.limit_amount);
            const pct = Math.min((spent / limit) * 100, 100);
            const barClass = pct >= 90 ? 'budget-bar-red' : pct >= b.alert_threshold ? 'budget-bar-yellow' : 'budget-bar-green';
            const remaining = limit - spent;
            return (
              <div key={b.id} className="kpi-card group relative">
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button onClick={() => handleEdit(b)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition" title="Editar">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeletingId(b.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition" title="Excluir">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between mb-2 pr-16">
                  <h4 className="font-medium text-foreground">{b.name}</h4>
                  <span className="text-xs text-muted-foreground">{b.category?.name || 'Geral'}</span>
                </div>
                <div className="h-2.5 rounded-full bg-secondary overflow-hidden mb-3">
                  <div className={`h-full rounded-full transition-all duration-700 ${barClass}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-mono text-muted-foreground">{formatCurrency(spent)} gastos</span>
                  <span className={`font-mono font-medium ${remaining >= 0 ? 'money-positive' : 'money-negative'}`}>
                    {remaining >= 0 ? formatCurrency(remaining) + ' restante' : formatCurrency(Math.abs(remaining)) + ' acima'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deletingId && (
        <DeleteConfirmationModal
          title="Excluir Orçamento"
          description="Tem certeza que deseja excluir este orçamento? Seu histórico de gastos não será afetado."
          isLoading={isDeleting}
          onConfirm={executeDelete}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}
