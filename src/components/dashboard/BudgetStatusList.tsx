import { formatCurrency } from '@/lib/format';
import type { Budget } from '@/types/finance';
import { Link } from 'react-router-dom';

interface Props {
  budgets: Budget[];
}

export default function BudgetStatusList({ budgets }: Props) {
  return (
    <div className="dashboard-panel p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-foreground">Orçamentos Ativos</h3>
        <Link to="/budgets" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Gerenciar
        </Link>
      </div>
      {budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm gap-2">
          <p>Nenhum orçamento configurado.</p>
          <Link to="/budgets" className="text-primary hover:underline text-xs">Criar orçamento</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {budgets.map((b) => {
            const spent = b.spent || 0;
            const limit = Number(b.limit_amount);
            const pct = Math.min((spent / limit) * 100, 100);
            const barClass = pct >= 90 ? 'bg-destructive' : pct >= Number(b.alert_threshold) ? 'bg-warning' : 'bg-success';
            return (
              <div key={b.id} className="group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground truncate">{b.name}</span>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {formatCurrency(spent)} <span className="text-xs font-normal opacity-70">/ {formatCurrency(limit)}</span>
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barClass}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                  <span>{pct.toFixed(0)}% consumido</span>
                  <span>{b.category?.name || 'Geral'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
