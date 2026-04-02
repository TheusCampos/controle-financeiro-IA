import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import type { TablesUpdate } from '@/integrations/supabase/types';
import type { Profile, Account, Category } from '@/types/finance';
import { toast } from 'sonner';
import { User, Wallet, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useAISettingsStore } from '@/store/aiSettingsStore';
import ProfileSettings from './components/ProfileSettings';
import AISettings from './components/AISettings';
import AccountSettings from './components/AccountSettings';
import CategorySettings from './components/CategorySettings';

type TabId = 'general' | 'data';

const inputClass = "w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition text-sm";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fullName, setFullName] = useState('');

  // AI Settings (local state mirrors store until save)
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
              <ProfileSettings
                fullName={fullName}
                email={user?.email || ''}
                onNameChange={setFullName}
                inputClass={inputClass}
              />

              <AISettings
                provider={localProvider}
                apiKey={localApiKey}
                systemPrompt={localSystemPrompt}
                onProviderChange={(v) => setLocalProvider(v as 'openai' | 'anthropic' | 'gemini')}
                onApiKeyChange={setLocalApiKey}
                onSystemPromptChange={setLocalSystemPrompt}
                inputClass={inputClass}
              />

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

          {activeTab === 'data' && user && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <AccountSettings
                userId={user.id}
                accounts={accounts}
                onDataChanged={loadData}
                inputClass={inputClass}
              />

              <CategorySettings
                userId={user.id}
                categories={categories}
                onDataChanged={loadData}
                inputClass={inputClass}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
