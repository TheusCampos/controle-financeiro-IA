import { Paperclip, Send, Loader2 } from 'lucide-react';

interface Props {
  input: string;
  loading: boolean;
  hasApiKey: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ChatInput({ input, loading, hasApiKey, onChange, onSubmit, onFileChange }: Props) {
  return (
    <div className="p-4 bg-background/50 border-t border-border/50 backdrop-blur-sm">
      <form
        onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
        className="space-y-2"
      >
        <div className="flex gap-2">
          <label className="px-3 py-3 rounded-xl border border-border text-foreground hover:bg-secondary cursor-pointer inline-flex items-center justify-center">
            <Paperclip className="w-4 h-4" />
            <input
              type="file"
              className="hidden"
              accept=".jpg,.jpeg,.png,.pdf,.docx,.txt"
              onChange={onFileChange}
              disabled={loading}
            />
          </label>

          <input
            type="text"
            value={input}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              hasApiKey
                ? 'Pergunte sobre seus gastos ou use /lancamento ...'
                : 'Configure a chave de API para começar'
            }
            disabled={!hasApiKey || loading}
            className="flex-1 px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition text-sm disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!input.trim() || !hasApiKey || loading}
            className="px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Tipos permitidos: JPEG, PNG, PDF, DOCX e TXT (máx. 10MB). Comandos: /lancamento type=expense
          amount=120 description=&quot;Mercado&quot;
        </p>
      </form>
    </div>
  );
}
