import { BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AISettingsProps {
  provider: string;
  apiKey: string;
  systemPrompt: string;
  onProviderChange: (provider: string) => void;
  onApiKeyChange: (key: string) => void;
  onSystemPromptChange: (prompt: string) => void;
  inputClass: string;
}

export default function AISettings({
  provider,
  apiKey,
  systemPrompt,
  onProviderChange,
  onApiKeyChange,
  onSystemPromptChange,
  inputClass,
}: AISettingsProps) {
  return (
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
            value={provider}
            onChange={(e) => onProviderChange(e.target.value)}
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
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            className={inputClass}
            placeholder={`Sua chave da ${provider === 'openai' ? 'OpenAI' : provider === 'anthropic' ? 'Anthropic' : 'Google'}`}
          />
          <p className="text-[10px] text-muted-foreground mt-1.5 ml-1">Sua chave fica salva apenas no seu navegador e não é enviada para nosso banco de dados.</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">Prompt do Sistema (Personalização)</label>
          <textarea
            value={systemPrompt}
            onChange={(e) => onSystemPromptChange(e.target.value)}
            className={cn(inputClass, "min-h-[100px] resize-y")}
            placeholder="Instruções sobre como a IA deve se comportar..."
          />
        </div>
      </div>
    </div>
  );
}
