import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate } from '@/lib/format';
import { GoalSchema } from '@/lib/validators';
import type { FinancialGoal } from '@/types/finance';
import { Plus, Target, PartyPopper, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';
import { ContributeModal } from '@/components/goals/ContributeModal';
import { appendAuditLog } from '@/services/auditLog';
import type { Json } from '@/integrations/supabase/types';

export default function GoalsPage() {
  const user = useAuthStore((s) => s.user);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [contributingGoal, setContributingGoal] = useState<FinancialGoal | null>(null);
  const [isContributing, setIsContributing] = useState(false);

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

    const parsed = GoalSchema.safeParse({
      title,
      target_amount: parseFloat(targetAmount),
      deadline: deadline || null,
    });

    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || 'Dados inválidos');
      return;
    }

    const payload = {
      user_id: user.id,
      title: parsed.data.title,
      target_amount: parsed.data.target_amount,
      deadline: parsed.data.deadline,
    };

    if (editingId) {
      const { error } = await supabase.from('financial_goals').update(payload).eq('id', editingId).eq('user_id', user.id);
      if (error) { toast.error('Erro ao atualizar meta'); return; }
      toast.success('Meta atualizada!');
      appendAuditLog(user.id, 'update_goal', 'approved', { id: editingId } as unknown as Json);
    } else {
      const { error } = await supabase.from('financial_goals').insert(payload);
      if (error) { toast.error('Erro ao criar meta'); return; }
      toast.success('Meta criada!');
    }

    setShowForm(false);
    setEditingId(null);
    setTitle('');
    setTargetAmount('');
    setDeadline('');
    loadGoals();
  };

  const handleEdit = (g: FinancialGoal) => {
    if (g.user_id !== user?.id) {
      toast.error('Sem permissão para editar.');
      return;
    }
    setEditingId(g.id);
    setTitle(g.title);
    setTargetAmount(g.target_amount.toString());
    setDeadline(g.deadline ? new Date(g.deadline).toISOString().split('T')[0] : '');
    setShowForm(true);
  };

  const executeDelete = async () => {
    if (!user || !deletingId) return;
    setIsDeleting(true);
    const { error } = await supabase.from('financial_goals').delete().eq('id', deletingId).eq('user_id', user.id);
    if (error) {
      toast.error('Erro ao excluir meta.');
      appendAuditLog(user.id, 'delete_goal', 'failed', { error: error.message, id: deletingId } as unknown as Json);
    } else {
      toast.success('Meta excluída com sucesso.');
      appendAuditLog(user.id, 'delete_goal', 'approved', { id: deletingId } as unknown as Json);
      loadGoals();
    }
    setIsDeleting(false);
    setDeletingId(null);
  };

  const handleContribute = async (amount: number) => {
    if (!contributingGoal || !user) return;
    setIsContributing(true);
    
    try {
      const newAmount = Number(contributingGoal.current_amount) + amount;
      const newStatus = newAmount >= Number(contributingGoal.target_amount) ? 'completed' : 'active';
      
      const { error } = await supabase.from('financial_goals')
        .update({ current_amount: newAmount, status: newStatus })
        .eq('id', contributingGoal.id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      if (newStatus === 'completed') {
        toast.success('🎉 Meta atingida! Parabéns!');
      } else {
        toast.success('Contribuição registrada com sucesso!');
      }
      
      appendAuditLog(user.id, 'contribute_goal', 'approved', { id: contributingGoal.id, amount } as unknown as Json);
      loadGoals();
    } catch (error) {
      toast.error('Erro ao registrar contribuição. Tente novamente.');
      appendAuditLog(user.id, 'contribute_goal', 'failed', { id: contributingGoal.id, error: String(error) } as unknown as Json);
    } finally {
      setIsContributing(false);
      setContributingGoal(null);
    }
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
          <h3 className="text-lg font-medium mb-4">{editingId ? 'Editar Meta' : 'Nova Meta'}</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input type="text" placeholder="Título da meta" value={title} onChange={e => setTitle(e.target.value)} className={inputClass} required />
            <input type="number" step="0.01" placeholder="Valor-alvo (R$)" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} className={inputClass} required />
            <div className="flex gap-2">
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className={`${inputClass} flex-1`} placeholder="Prazo" />
              <button type="submit" className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm">
                {editingId ? 'Salvar' : 'Criar'}
              </button>
              {editingId && (
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setTitle(''); setTargetAmount(''); setDeadline(''); }} className="px-4 py-2.5 rounded-lg bg-secondary text-muted-foreground text-sm">Cancelar</button>
              )}
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
              <div key={g.id} className={`kpi-card group relative ${isCompleted ? 'border-success/30' : ''}`}>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button onClick={() => handleEdit(g)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition" title="Editar">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeletingId(g.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition" title="Excluir">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between mb-4 pr-16">
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
                    <button onClick={() => setContributingGoal(g)} className="text-sm font-medium text-foreground hover:underline">
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

      {deletingId && (
        <DeleteConfirmationModal
          title="Excluir Meta"
          description="Tem certeza que deseja excluir esta meta financeira?"
          isLoading={isDeleting}
          onConfirm={executeDelete}
          onCancel={() => setDeletingId(null)}
        />
      )}

      {contributingGoal && (
        <ContributeModal
          goal={contributingGoal}
          isLoading={isContributing}
          onConfirm={handleContribute}
          onCancel={() => setContributingGoal(null)}
        />
      )}
    </div>
  );
}
