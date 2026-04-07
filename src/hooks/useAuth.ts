import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useAISettingsStore } from '@/store/aiSettingsStore';
import { decryptData } from '@/lib/encryption';

export function useAuth() {
  const { session, user, loading, setSession, setLoading } = useAuthStore();
  const setProvider = useAISettingsStore((s) => s.setProvider);
  const setApiKey = useAISettingsStore((s) => s.setApiKey);
  const setSystemPrompt = useAISettingsStore((s) => s.setSystemPrompt);

  useEffect(() => {
    const syncProfileSettings = async (userId: string) => {
      const { data, error } = await supabase.from('profiles').select('ai_provider, ai_api_key, ai_system_prompt').eq('id', userId).single();
      if (data && !error) {
        if (data.ai_provider) setProvider(data.ai_provider as 'openai' | 'anthropic' | 'gemini');
        if (data.ai_api_key) {
          const decrypted = decryptData(data.ai_api_key);
          if (decrypted) setApiKey(decrypted);
        }
        if (data.ai_system_prompt) setSystemPrompt(data.ai_system_prompt);
      }
    };

    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) syncProfileSettings(session.user.id);
    });

    // THEN check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) syncProfileSettings(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, [setSession, setProvider, setApiKey, setSystemPrompt]);

  return { session, user, loading };
}
