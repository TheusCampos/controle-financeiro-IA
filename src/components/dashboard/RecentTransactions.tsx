import { ArrowUpRight, ArrowDownRight, ArrowLeftRight } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Transaction } from '@/types/finance';
import { Link } from 'react-router-dom';

interface Props {
  transactions: Transaction[];
}

const typeIcons = {
  income: ArrowUpRight,
  expense: ArrowDownRight,
  transfer: ArrowLeftRight,
};

export default function RecentTransactions({ transactions }: Props) {
  return (
    <div className="dashboard-panel p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-foreground">Transações Recentes</h3>
        <Link to="/transactions" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Ver todas
        </Link>
      </div>
      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm gap-2">
          <p>Nenhuma transação ainda.</p>
          <Link to="/transactions" className="text-primary hover:underline text-xs">Adicionar transação</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((txn) => {
            const Icon = typeIcons[txn.type];
            return (
              <div key={txn.id} className="flex items-center justify-between gap-4 py-2">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    txn.type === 'income' ? 'bg-success/10 text-success' : txn.type === 'expense' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate" title={txn.description}>{txn.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(txn.date)}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-sm font-semibold whitespace-nowrap ${
                    txn.type === 'income' ? 'money-positive' : 'money-negative'
                  }`}>
                    {txn.type === 'income' ? '+' : '-'}{formatCurrency(Number(txn.amount))}
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {txn.category?.name || 'Sem categoria'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
