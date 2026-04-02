import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import type { TablesUpdate } from '@/integrations/supabase/types';
import type { Profile, Account, Category } from '@/types/finance';
import { AccountSchema, CategorySchema } from '@/lib/validators';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, Check, X, User, Tag, Wallet, Save, BrainCircuit } from 'lucide-react';
import { getAccountTypeLabel } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useAISettingsStore } from '@/store/aiSettingsStore';

type TabId = 'general' | 'data';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fullName, setFullName] = useState('');
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<Account['type']>('checking');
  const [accBalance, setAccBalance] = useState('');

  // Category management
  const [showCatForm, setShowCatForm] = useState(false);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<Category['type']>('expense');
  const [catColor, setCatColor] = useState('#6B7280');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');

  // AI Settings
  const { provider, apiKey, systemPrompt, setProvider, setApiKey, setSystemPrompt } = useAISettingsStore();
  const [localProvider, setLocalProvider] = useState(provider);
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [localSystemPrompt, setLocalSystemPrompt] = useState(systemPrompt);

  const loadData = useCallback(async () => {
    if (!user) return;

    const [profileRes, accountsRes, catsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('accounts').select('*').order('created_at'),
      supabase.from('categories').select('*').order('name'),
    ]);
    if (profileRes.data) {
      setProfile(profileRes.data as Profile);
      setFullName(profileRes.data.full_name);
    }
    setAccounts((accountsRes.data || []) as Account[]);
    setCategories((catsRes.data || []) as Category[]);
  }, [user]);

  useEffect(() => { if (user) loadData(); }, [loadData, user]);

  const updateProfile = async () => {
    if (!user) return;

    const payload: TablesUpdate<'profiles'> = {
      full_name: fullName.trim(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('profiles').update(payload).eq('id', user.id);
    if (error) {
      toast.error('Erro ao atualizar perfil');
      return;
    }

    // Save AI Settings locally
    setProvider(localProvider);
    setApiKey(localApiKey);
    setSystemPrompt(localSystemPrompt);

    toast.success('Configurações atualizadas!');
  };



  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

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
      user_id: user.id, 
      ...parsed.data,
    } as any;

    const { error } = await supabase.from('accounts').insert(payload);
    if (error) { toast.error('Erro ao criar conta'); return; }
    toast.success('Conta criada!');
    setShowAccountForm(false); setAccName(''); setAccBalance('');
    loadData();
  };

  const deleteAccount = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('accounts').delete().eq('id', id).eq('user_id', user.id);
    if (error) toast.error('Erro ao excluir conta');
    else { toast.success('Conta excluída'); loadData(); }
  };

  // Category CRUD
  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const parsed = CategorySchema.safeParse({
      name: catName,
      type: catType,
      color: catColor,
    });

    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || 'Dados inválidos');
      return;
    }

    const payload = {
      user_id: user.id, 
      ...parsed.data,
    } as any;

    const { error } = await supabase.from('categories').insert(payload);
    if (error) { toast.error('Erro ao criar categoria'); return; }
    toast.success('Categoria criada!');
    setShowCatForm(false); setCatName(''); setCatColor('#6B7280');
    loadData();
  };

  const updateCategory = async (id: string) => {
    if (!user) return;

    const parsed = CategorySchema.safeParse({
      name: editCatName,
      type: 'expense', // Just to pass validation, we only update name
    });

    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || 'Nome inválido');
      return;
    }

    const { error } = await supabase.from('categories').update({ name: parsed.data.name }).eq('id', id).eq('user_id', user.id);
    if (error) toast.error('Erro ao atualizar');
    else { toast.success('Categoria atualizada'); setEditingCatId(null); loadData(); }
  };

  const deleteCategory = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('categories').delete().eq('id', id).eq('user_id', user.id);
    if (error) toast.error('Erro ao excluir categoria');
    else { toast.success('Categoria excluída'); loadData(); }
  };

  const inputClass = "w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition text-sm";

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-8">
      <div>
        <h2 className="text-3xl font-serif font-medium text-foreground tracking-tight">Configurações</h2>
        <p className="text-muted-foreground text-sm mt-1">Gerencie seu perfil, contas e preferências de IA</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 space-y-1">
          <button
            onClick={() => setActiveTab('general')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
              activeTab === 'general'
                ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <User className="w-4 h-4" />
            Geral & IA
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
              activeTab === 'data'
                ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <Wallet className="w-4 h-4" />
            Dados & Contas
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Profile */}
              <div className="glass-card p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-border/50 pb-4 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground leading-tight">Perfil</h3>
                    <p className="text-xs text-muted-foreground">Informações básicas da sua conta</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">Nome Completo</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className={inputClass}
                      placeholder="Seu nome"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">E-mail</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      className={cn(inputClass, "bg-secondary/50 opacity-80")}
                      disabled
                    />
                    <p className="text-[10px] text-muted-foreground mt-1.5 ml-1">O e-mail não pode ser alterado diretamente.</p>
                  </div>
                </div>
              </div>

              {/* AI Settings */}
              <div className="glass-card p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-border/50 pb-4 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BrainCircuit className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground leading-tight">Assistente de IA</h3>
                    <p className="text-xs text-muted-foreground">Configurações do seu assistente virtual</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">Provedor de IA</label>
                    <select
                      value={localProvider}
                      onChange={(e) => setLocalProvider(e.target.value as any)}
                      className={inputClass}
                    >
                      <option value="openai">OpenAI (ChatGPT)</option>
                      <option value="anthropic">Anthropic (Claude)</option>
                      <option value="gemini">Google (Gemini)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">Chave de API (API Key)</label>
                    <input
                      type="password"
                      value={localApiKey}
                      onChange={(e) => setLocalApiKey(e.target.value)}
                      className={inputClass}
                      placeholder={`Sua chave da ${localProvider === 'openai' ? 'OpenAI' : localProvider === 'anthropic' ? 'Anthropic' : 'Google'}`}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1.5 ml-1">Sua chave fica salva apenas no seu navegador e não é enviada para nosso banco de dados.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">Prompt do Sistema (Personalização)</label>
                    <textarea
                      value={localSystemPrompt}
                      onChange={(e) => setLocalSystemPrompt(e.target.value)}
                      className={cn(inputClass, "min-h-[100px] resize-y")}
                      placeholder="Instruções sobre como a IA deve se comportar..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={updateProfile}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </button>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Accounts */}
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
                    onClick={() => setShowAccountForm(!showAccountForm)}
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all",
                      showAccountForm 
                        ? "bg-secondary text-foreground" 
                        : "text-primary hover:bg-primary/10"
                    )}
                  >
                    {showAccountForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {showAccountForm ? 'Cancelar' : 'Adicionar'}
                  </button>
                </div>

                {showAccountForm && (
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

              {/* Categories */}
              <div className="glass-card p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Tag className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground leading-tight">Categorias</h3>
                      <p className="text-xs text-muted-foreground">Organize suas receitas e despesas</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCatForm(!showCatForm)}
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all",
                      showCatForm 
                        ? "bg-secondary text-foreground" 
                        : "text-primary hover:bg-primary/10"
                    )}
                  >
                    {showCatForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {showCatForm ? 'Cancelar' : 'Adicionar'}
                  </button>
                </div>

                {showCatForm && (
                  <form onSubmit={createCategory} className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-secondary/30 rounded-2xl border border-border/50 animate-in zoom-in-95 duration-200">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">Nome da Categoria</label>
                      <input type="text" placeholder="Ex: Alimentação, Salário..." value={catName} onChange={e => setCatName(e.target.value)} className={inputClass} required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">Tipo de Fluxo</label>
                      <select value={catType} onChange={e => setCatType(e.target.value as Category['type'])} className={inputClass}>
                        <option value="expense">Despesa</option>
                        <option value="income">Receita</option>
                        <option value="both">Ambos</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">Cor</label>
                      <div className="flex gap-2">
                        <input type="color" value={catColor} onChange={e => setCatColor(e.target.value)} className="h-10 w-16 rounded-lg border border-border cursor-pointer bg-secondary p-1" />
                        <div className="flex-1 flex items-center px-3 rounded-lg bg-secondary/50 text-[10px] font-mono text-muted-foreground uppercase">
                          {catColor}
                        </div>
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <button type="submit" className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-md shadow-primary/10 transition-all active:scale-[0.98]">
                        Criar Categoria
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categories.length === 0 ? (
                    <div className="sm:col-span-2 text-center py-10 px-4 rounded-2xl border border-dashed border-border/50">
                      <Tag className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada.</p>
                    </div>
                  ) : (
                    categories.map(cat => (
                      <div key={cat.id} className="group flex items-center justify-between p-3 rounded-xl border border-border/30 hover:border-primary/20 hover:bg-secondary/30 transition-all duration-200">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: cat.color || '#6B7280' }} />
                          <div className="flex flex-col min-w-0">
                            {editingCatId === cat.id ? (
                              <input 
                                type="text" 
                                value={editCatName} 
                                onChange={e => setEditCatName(e.target.value)}
                                className="px-2 py-0.5 rounded bg-background border border-primary/50 text-foreground text-xs w-full focus:outline-none focus:ring-1 focus:ring-primary"
                                autoFocus 
                                onKeyDown={e => e.key === 'Enter' && updateCategory(cat.id)}
                              />
                            ) : (
                              <span className="text-sm font-semibold text-foreground truncate">{cat.name}</span>
                            )}
                            <span className={cn(
                              "text-[9px] font-bold uppercase tracking-tighter",
                              cat.type === 'income' ? 'text-success' : cat.type === 'expense' ? 'text-destructive' : 'text-muted-foreground'
                            )}>
                              {cat.type === 'income' ? 'Receita' : cat.type === 'expense' ? 'Despesa' : 'Híbrida'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 ml-2">
                          {editingCatId === cat.id ? (
                            <>
                              <button onClick={() => updateCategory(cat.id)} className="p-1.5 text-success hover:bg-success/10 rounded-lg transition">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => setEditingCatId(null)} className="p-1.5 text-muted-foreground hover:bg-secondary rounded-lg transition">
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => { setEditingCatId(cat.id); setEditCatName(cat.name); }}
                                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              {!cat.is_default && (
                                <button 
                                  onClick={() => deleteCategory(cat.id)}
                                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
