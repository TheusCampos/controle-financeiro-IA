import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate } from '@/lib/format';
import type { FinancialGoal } from '@/types/finance';
import { Plus, Target, PartyPopper } from 'lucide-react';
import { toast } from 'sonner';

export default function GoalsPage() {
  const user = useAuthStore((s) => s.user);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  useEffect(() => { if (user) loadGoals(); }, [user]);

  async function loadGoals() {
    setLoading(true);
    const { data } = await supabase.from('financial_goals').select('*').order('created_at', { ascending: false });
    setGoals((data || []) as FinancialGoal[]);
    setLoading(false);
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from('financial_goals').insert({
      user_id: user.id,
      title,
      target_amount: parseFloat(targetAmount),
      deadline: deadline || null,
    });
    if (error) { toast.error('Erro ao criar meta'); return; }
    toast.success('Meta criada!');
    setShowForm(false);
    setTitle('');
    setTargetAmount('');
    setDeadline('');
    loadGoals();
  };

  const handleContribute = async (goal: FinancialGoal) => {
    const input = prompt('Quanto deseja contribuir? (R$)');
    if (!input) return;
    const amount = parseFloat(input);
    if (isNaN(amount) || amount <= 0) { toast.error('Valor inválido'); return; }
    const newAmount = Number(goal.current_amount) + amount;
    const newStatus = newAmount >= Number(goal.target_amount) ? 'completed' : 'active';
    const { error } = await supabase.from('financial_goals').update({ current_amount: newAmount, status: newStatus }).eq('id', goal.id);
    if (error) { toast.error('Erro ao contribuir'); return; }
    if (newStatus === 'completed') toast.success('🎉 Meta atingida! Parabéns!');
    else toast.success('Contribuição registrada!');
    loadGoals();
  };

  const inputClass = "w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition text-sm";

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-medium text-foreground tracking-tight">Metas Financeiras</h2>
          <p className="text-muted-foreground text-sm mt-1">Acompanhe seus objetivos de economia</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-foreground text-background font-medium text-sm hover:opacity-90 shadow-sm transition">
          <Plus className="w-4 h-4" /> Criar Meta
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-6">
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input type="text" placeholder="Título da meta" value={title} onChange={e => setTitle(e.target.value)} className={inputClass} required />
            <input type="number" step="0.01" placeholder="Valor-alvo (R$)" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} className={inputClass} required />
            <div className="flex gap-2">
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className={`${inputClass} flex-1`} placeholder="Prazo" />
              <button type="submit" className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm">Criar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="h-40 skeleton-pulse rounded-xl" />)}
        </div>
      ) : goals.length === 0 ? (
        <div className="bg-card border border-border shadow-soft rounded-xl p-12 text-center">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">Nenhuma meta definida.</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-foreground font-medium hover:underline text-sm">Criar primeira meta</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map(g => {
            const pct = Math.min((Number(g.current_amount) / Number(g.target_amount)) * 100, 100);
            const isCompleted = g.status === 'completed';
            return (
              <div key={g.id} className={`kpi-card ${isCompleted ? 'border-success/30' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-serif text-xl text-foreground flex items-center gap-2">
                    {isCompleted && <PartyPopper className="w-5 h-5 text-success" />}
                    {g.title}
                  </h4>
                  <span className={`text-xs px-2.5 py-1 rounded-md font-medium tracking-wide ${
                    isCompleted ? 'bg-success/10 text-success' : 'bg-secondary text-muted-foreground'
                  }`}>
                    {isCompleted ? 'CONCLUÍDA' : `${pct.toFixed(0)}%`}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden mb-4">
                  <div className="h-full rounded-full bg-foreground transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-serif font-medium text-base text-muted-foreground">
                    {formatCurrency(Number(g.current_amount))} / {formatCurrency(Number(g.target_amount))}
                  </span>
                  {!isCompleted && (
                    <button onClick={() => handleContribute(g)} className="text-sm font-medium text-foreground hover:underline">
                      + Contribuir
                    </button>
                  )}
                </div>
                {g.deadline && (
                  <p className="text-xs text-muted-foreground mt-2">Prazo: {formatDate(g.deadline)}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
