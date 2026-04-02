import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { encryptData, decryptData } from '@/lib/encryption';

export interface AISettingsState {
  provider: 'openai' | 'anthropic' | 'gemini';
  apiKey: string;
  systemPrompt: string;
  setProvider: (provider: 'openai' | 'anthropic' | 'gemini') => void;
  setApiKey: (key: string) => void;
  setSystemPrompt: (prompt: string) => void;
}

// Criptografa/descriptografa o armazenamento local do Zustand
const secureStorage = {
  getItem: (name: string) => {
    const str = localStorage.getItem(name);
    if (!str) return null;
    return decryptData(str);
  },
  setItem: (name: string, value: string) => {
    const encrypted = encryptData(value);
    localStorage.setItem(name, encrypted);
  },
  removeItem: (name: string) => localStorage.removeItem(name),
};

export const useAISettingsStore = create<AISettingsState>()(
  persist(
    (set) => ({
      provider: 'openai',
      apiKey: '',
      systemPrompt: 'Você é um assistente financeiro pessoal inteligente. Analise os dados financeiros e responda de forma direta e objetiva, sem enrolação. Dê dicas práticas, curtas e humanizadas.',
      setProvider: (provider) => set({ provider }),
      setApiKey: (apiKey) => set({ apiKey }),
      setSystemPrompt: (systemPrompt) => set({ systemPrompt }),
    }),
    {
      name: 'ai-settings-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
