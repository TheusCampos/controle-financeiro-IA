import { ShieldAlert } from 'lucide-react';
import type { PendingAction } from '@/types/assistant';

interface Props {
  action: PendingAction | null;
  countdown: number;
  executing: boolean;
  onExecute: () => void;
  onCancel: () => void;
}

export function PendingActionBanner({ action, countdown, executing, onExecute, onCancel }: Props) {
  if (!action) return null;

  return (
    <div className="mb-4 p-4 rounded-xl border border-warning/50 bg-warning/10">
      <div className="flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-sm">Confirmação obrigatória para lançamento</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tipo: {action.command.type} | Valor: R$ {action.command.amount.toFixed(2)} | Tempo restante:{' '}
            {countdown}s
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={onExecute}
              disabled={executing || countdown <= 0}
              className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-50"
            >
              {executing ? 'Executando...' : 'Autorizar'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={executing}
              className="px-3 py-2 rounded-lg border border-border text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
