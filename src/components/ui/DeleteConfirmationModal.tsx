import { X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DeleteConfirmationModal({
  title,
  description,
  onConfirm,
  onCancel,
  isLoading = false,
}: DeleteConfirmationModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-border/50">
          <h3 className="text-lg font-serif font-medium">{title}</h3>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-muted-foreground">{description}</p>
        </div>

        <div className="flex justify-end gap-3 p-5 bg-secondary/30 border-t border-border/50">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-md border border-border bg-card text-foreground text-sm font-medium hover:bg-secondary transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
            Sim, Excluir
          </button>
        </div>
      </div>
    </div>
  );
}