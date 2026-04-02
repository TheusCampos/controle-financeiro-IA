import { AlertCircle } from 'lucide-react';
import { useAISettingsStore } from '@/store/aiSettingsStore';

export function ApiKeyWarning() {
  const apiKey = useAISettingsStore((s) => s.apiKey);
  if (apiKey) return null;

  return (
    <div className="mb-4 p-4 bg-warning/20 border border-warning/50 rounded-xl flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
      <div className="text-sm text-foreground">
        <p className="font-semibold">Chave de API não configurada</p>
        <p className="text-muted-foreground">Acesse Configurações &gt; Assistente de IA e adicione sua chave.</p>
      </div>
    </div>
  );
}
