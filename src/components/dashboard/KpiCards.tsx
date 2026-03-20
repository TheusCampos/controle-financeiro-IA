import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import type { FinancialSummary } from '@/types/finance';

interface Props {
  summary: FinancialSummary;
}

export default function KpiCards({ summary }: Props) {
  const cards = [
    {
      label: 'Saldo Total',
      value: formatCurrency(summary.totalBalance),
      icon: Wallet,
      iconClass: 'text-primary',
    },
    {
      label: 'Receitas do Mês',
      value: formatCurrency(summary.monthlyIncome),
      icon: TrendingUp,
      iconClass: 'text-success',
      valueClass: 'money-positive',
    },
    {
      label: 'Despesas do Mês',
      value: formatCurrency(summary.monthlyExpenses),
      icon: TrendingDown,
      iconClass: 'text-destructive',
      valueClass: 'money-negative',
    },
    {
      label: 'Taxa de Economia',
      value: `${summary.savingsRate.toFixed(1)}%`,
      icon: PiggyBank,
      iconClass: summary.savingsRate >= 20 ? 'text-success' : 'text-warning',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="kpi-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">{card.label}</span>
            <card.icon className={`w-5 h-5 ${card.iconClass} opacity-80`} />
          </div>
          <p className={`text-2xl sm:text-3xl font-serif font-medium tracking-tight ${card.valueClass || 'text-foreground'} truncate`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
