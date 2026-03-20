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
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Transações Recentes</h3>
        <Link to="/transactions" className="text-xs text-primary hover:underline">Ver todas</Link>
      </div>
      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm gap-2">
          <p>Nenhuma transação ainda.</p>
          <Link to="/transactions" className="text-primary hover:underline text-xs">Adicionar transação</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((txn) => {
            const Icon = typeIcons[txn.type];
            return (
              <div key={txn.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    txn.type === 'income' ? 'bg-success/10' : txn.type === 'expense' ? 'bg-destructive/10' : 'bg-primary/10'
                  }`}>
                    <Icon className={`w-4 h-4 ${
                      txn.type === 'income' ? 'text-success' : txn.type === 'expense' ? 'text-destructive' : 'text-primary'
                    }`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate" title={txn.description}>{txn.description}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{formatDate(txn.date)}</p>
                  </div>
                </div>
                <span className={`font-serif text-sm sm:text-base font-medium whitespace-nowrap shrink-0 ${
                  txn.type === 'income' ? 'money-positive' : 'money-negative'
                }`}>
                  {txn.type === 'income' ? '+' : '-'}{formatCurrency(Number(txn.amount))}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
