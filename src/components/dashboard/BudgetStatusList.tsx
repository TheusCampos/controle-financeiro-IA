import { formatCurrency } from '@/lib/format';
import type { Budget } from '@/types/finance';

interface Props {
  budgets: Budget[];
}

export default function BudgetStatusList({ budgets }: Props) {
  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">Orçamentos Ativos</h3>
      {budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm gap-2">
          <p>Nenhum orçamento configurado.</p>
          <a href="/budgets" className="text-primary hover:underline text-xs">Criar orçamento</a>
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.map((b) => {
            const spent = b.spent || 0;
            const pct = Math.min((spent / Number(b.limit_amount)) * 100, 100);
            const barClass = pct >= 90 ? 'budget-bar-red' : pct >= Number(b.alert_threshold) ? 'budget-bar-yellow' : 'budget-bar-green';
            return (
              <div key={b.id}>
                <div className="flex items-center justify-between mb-1.5 gap-4">
                  <span className="text-sm text-foreground truncate min-w-0 flex-1" title={b.name}>{b.name}</span>
                  <span className="text-sm font-serif font-medium text-muted-foreground whitespace-nowrap shrink-0">
                    {formatCurrency(spent)} / {formatCurrency(Number(b.limit_amount))}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barClass}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
