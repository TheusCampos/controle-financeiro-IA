import { useState, useEffect, useRef } from 'react';
import { X, DollarSign } from 'lucide-react';
import type { FinancialGoal } from '@/types/finance';

interface ContributeModalProps {
  goal: FinancialGoal;
  onConfirm: (amount: number) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ContributeModal({
  goal,
  onConfirm,
  onCancel,
  isLoading = false,
}: ContributeModalProps) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus automático ao abrir
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const value = parseFloat(amount.replace(',', '.'));
    
    if (isNaN(value) || value <= 0) {
      setError('Por favor, insira um valor válido maior que zero.');
      return;
    }

    await onConfirm(value);
  };

  const remaining = Number(goal.target_amount) - Number(goal.current_amount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-border/50">
          <div>
            <h3 className="text-lg font-serif font-medium flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Contribuir para Meta
            </h3>
            <p className="text-sm text-muted-foreground mt-1 truncate max-w-[280px]">
              {goal.title}
            </p>
          </div>
          <button 
            onClick={onCancel} 
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-secondary -mt-6"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="bg-secondary/50 rounded-xl p-4 flex items-center justify-between border border-border/50">
              <span className="text-sm text-muted-foreground">Falta para atingir:</span>
              <span className="font-mono font-medium text-foreground">
                R$ {remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium text-foreground">
                Valor da contribuição (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">R$</span>
                <input
                  ref={inputRef}
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (error) setError('');
                  }}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl bg-background border ${error ? 'border-destructive focus:ring-destructive/50' : 'border-border focus:ring-primary/50'} text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition text-lg font-medium`}
                  disabled={isLoading}
                />
              </div>
              {error && <p className="text-xs text-destructive mt-1">{error}</p>}
            </div>

            <div className="flex gap-2 pt-2">
              {[10, 50, 100].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val.toString())}
                  className="flex-1 py-1.5 rounded-lg border border-border bg-secondary/30 hover:bg-secondary text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  +R$ {val}
                </button>
              ))}
            </div>
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
              type="submit"
              disabled={isLoading || !amount}
              className="px-6 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}