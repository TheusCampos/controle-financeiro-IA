import { useState } from 'react';
import { Plus, Trash2, Wallet, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AccountSchema } from '@/lib/validators';
import { getAccountTypeLabel } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Account } from '@/types/finance';
import { toast } from 'sonner';

interface AccountSettingsProps {
  userId: string;
  accounts: Account[];
  onDataChanged: () => void;
  inputClass: string;
}

export default function AccountSettings({ userId, accounts, onDataChanged, inputClass }: AccountSettingsProps) {
  const [showForm, setShowForm] = useState(false);
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<Account['type']>('checking');
  const [accBalance, setAccBalance] = useState('');

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = AccountSchema.safeParse({
      name: accName,
      type: accType,
      balance: parseFloat(accBalance) || 0,
      currency: 'BRL',
    });

    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || 'Dados inválidos');
      return;
    }

    const payload = {
      user_id: userId,
      ...parsed.data,
    };

    const { error } = await supabase.from('accounts').insert(payload);
    if (error) { toast.error('Erro ao criar conta'); return; }
    toast.success('Conta criada!');
    setShowForm(false); setAccName(''); setAccBalance('');
    onDataChanged();
  };

  const deleteAccount = async (id: string) => {
    const { error } = await supabase.from('accounts').delete().eq('id', id).eq('user_id', userId);
    if (error) toast.error('Erro ao excluir conta');
    else { toast.success('Conta excluída'); onDataChanged(); }
  };

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground leading-tight">Contas Financeiras</h3>
            <p className="text-xs text-muted-foreground">Onde seu dinheiro está guardado</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={cn(
            "flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm",
            showForm
              ? "bg-muted text-foreground hover:bg-muted/80"
              : "bg-primary text-primary-foreground hover:opacity-90"
          )}
        >
          {showForm ? <X className="w-5 h-5 sm:w-3.5 sm:h-3.5" /> : <Plus className="w-5 h-5 sm:w-3.5 sm:h-3.5" />}
          <span className="hidden sm:inline">{showForm ? 'Cancelar' : 'Adicionar'}</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={createAccount} className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-secondary/30 rounded-2xl border border-border/50 animate-in zoom-in-95 duration-200">
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">Nome da Conta</label>
            <input type="text" placeholder="Ex: Nubank, Itaú..." value={accName} onChange={e => setAccName(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">Tipo</label>
            <select value={accType} onChange={e => setAccType(e.target.value as Account['type'])} className={inputClass}>
              <option value="checking">Conta Corrente</option>
              <option value="savings">Poupança</option>
              <option value="credit">Cartão de Crédito</option>
              <option value="investment">Investimento</option>
              <option value="cash">Dinheiro</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">Saldo Inicial</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">R$</span>
              <input type="number" step="0.01" placeholder="0,00" value={accBalance} onChange={e => setAccBalance(e.target.value)} className={cn(inputClass, "pl-10")} />
            </div>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-md shadow-primary/10 transition-all active:scale-[0.98]">
              Confirmar Nova Conta
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-2">
        {accounts.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-border/50">
            <Wallet className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma conta cadastrada.</p>
          </div>
        ) : (
          accounts.map(acc => (
            <div key={acc.id} className="group flex items-center justify-between p-4 rounded-xl border border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{acc.name}</p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{getAccountTypeLabel(acc.type)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-mono text-sm font-semibold text-foreground">R$ {Number(acc.balance).toFixed(2)}</p>
                <button
                  onClick={() => deleteAccount(acc.id)}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  title="Excluir conta"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
